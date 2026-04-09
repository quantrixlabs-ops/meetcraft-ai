import { UserInput, KnowledgePackage } from "../types";
import { keyManager } from "./services/keyManager";
import { ProviderFactory } from "./providers/ProviderFactory";
import { AIProvider } from "./providers/AIProvider";

// ─── Fallback-triggering error detection ──────────────────────────────────────
// Any error in this list causes immediate provider switch (no retry on same provider).
function isFallbackError(err: any): boolean {
  const msg = (err?.message || '').toLowerCase();
  return (
    // Rate limits / quota
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    msg.includes('limit reached') ||
    msg.includes('tokens per day') ||
    msg.includes('per minute') ||
    msg.includes('capacity') ||
    // Network / timeout
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('network error') ||
    msg.includes('connect timeout') ||
    msg.includes('econnrefused') ||
    msg.includes('enotfound') ||
    // Auth / billing exhausted (no point retrying same provider)
    msg.includes('credits exhausted') ||
    msg.includes('credit balance') ||
    msg.includes('billing') ||
    msg.includes('payment') ||
    msg.includes('too low') ||
    msg.includes('upgrade') ||
    (msg.includes('invalid') && msg.includes('api key'))
  );
}

// ─── Retry with exponential back-off ─────────────────────────────────────────
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
  label = 'AI call'
): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      if (isFallbackError(err)) {
        console.warn(`[Retry] ${label} — fallback error detected, skipping retries to allow provider switch`);
        throw err; // bail immediately so withProviderFallback can switch providers
      }
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`[Retry] ${label} attempt ${attempt + 1} failed: ${err?.message}. Retrying in ${delay}ms...`);
        await new Promise<void>(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

// ─── Page → chapter config ─────────────────────────────────────────────────
function getChapterConfig(documentPages?: number): { chapterCount: number; wordsPerChapter: number } {
  if (!documentPages) return { chapterCount: 15, wordsPerChapter: 2000 };
  const chapterCount =
    documentPages <= 10 ? 3
    : documentPages <= 20 ? 5
    : documentPages <= 30 ? 8
    : documentPages <= 50 ? 12
    : 20;
  const wordsPerChapter = Math.max(600, Math.floor((documentPages * 250) / chapterCount));
  return { chapterCount, wordsPerChapter };
}

class AIOrchestrator {

  /**
   * Wraps a provider call with automatic fallback to the next available provider
   * if the primary fails. Never crashes — always tries env Gemini as last resort.
   */
  private async withProviderFallback<T>(
    userId: string,
    fn: (provider: AIProvider) => Promise<T>,
    label = "AI call"
  ): Promise<T> {
    const providerPriority = ["openrouter", "anthropic", "claude", "openai", "groq", "perplexity", "google"];

    // Build list of available providers in priority order
    const available: Array<{ name: string; key: string }> = [];
    for (const prov of providerPriority) {
      const key = await keyManager.getActiveKey(userId, prov);
      if (key) available.push({ name: prov, key });
    }
    // Always append env Gemini as final safety net
    const envKey = process.env.VITE_GEMINI_API_KEY;
    if (envKey && !available.find(p => p.name === "google")) {
      available.push({ name: "google", key: envKey });
    }

    if (available.length === 0) {
      throw new Error("No API key configured. Please set VITE_GEMINI_API_KEY in .env or add a key via Settings.");
    }

    let lastError: any;
    for (const { name, key } of available) {
      const nextName = available[available.findIndex(p => p.name === name) + 1]?.name;
      try {
        const provider = ProviderFactory.create(name, key);
        console.log(`[Orchestrator] Trying provider: ${name}`);
        const result = await fn(provider);
        console.log(`[Orchestrator] ${label} — success with ${name}`);
        return result;
      } catch (err: any) {
        lastError = err;
        if (isFallbackError(err)) {
          console.warn(`[Orchestrator] ${name} → fallback triggered (${err?.message}). Switching${nextName ? ` → ${nextName}` : ' (no more providers)'}`);
        } else {
          console.warn(`[Orchestrator] ${name} failed: ${err?.message}. Switching${nextName ? ` → ${nextName}` : ' (no more providers)'}`);
        }
      }
    }
    throw new Error(`All providers failed for "${label}". Last error: ${lastError?.message}`);
  }

  public async generateKnowledgePackage(
    input: UserInput,
    userId: string = "anon"
  ): Promise<KnowledgePackage> {

    const { chapterCount: baseChapterCount, wordsPerChapter: baseWordsPerChapter } = getChapterConfig(input.documentPages);
    const targetSlides = input.slideCount ?? 20;

    // ── Token budget ─────────────────────────────────────────────────────────
    const budget = input.maxTokens ?? 12_000;
    // Scale chapter count and per-chapter tokens proportionally to the budget.
    // Reserve ~20% of budget for outline + slides + overview.
    const contentBudget   = Math.floor(budget * 0.8);
    const chapterCount    = input.documentPages
      ? baseChapterCount                              // document mode keeps page-derived count
      : budget <= 2000  ? 2
      : budget <= 5000  ? 4
      : budget <= 12000 ? 8
      : baseChapterCount;
    // Tokens per provider call — cap at 4096 to stay within most provider limits.
    const tokensPerCall   = Math.min(Math.floor(contentBudget / chapterCount), 4096);
    const wordsPerChapter = input.documentPages
      ? baseWordsPerChapter
      : Math.floor(tokensPerCall * 0.75); // ~0.75 words per token

    // Transparent per-call provider proxy — each call independently falls back
    // across all configured providers if the primary is rate-limited or unavailable.
    const provider = {
      generateJSON: (prompt: string) =>
        this.withProviderFallback(userId, p => p.generateJSON(prompt, undefined, Math.min(tokensPerCall, 2048))),
      generateText: (prompt: string) =>
        this.withProviderFallback(userId, p => p.generateText(prompt, undefined, tokensPerCall)),
    };
    console.log(`📘 Generating textbook outline (${chapterCount} chapters, ~${input.documentPages ?? 'default'} pages)...`);

    let outline = await withRetry(() => provider.generateJSON(`
You are a senior academic textbook author and subject-matter expert.

Create a detailed, professional outline for a university-level textbook.

Topic: ${input.topic}
Audience: ${input.audience}
Industry / Context: ${input.industry}
Depth: ${input.depth}
Tone: ${input.tone}

Requirements:
- Exactly ${chapterCount} chapters
- Each chapter must have 5–8 subtopics that are specific, actionable, and clearly scoped
- Chapter 1 must be an Introduction / Foundation chapter
- The final chapter must be a Conclusion / Future Directions chapter
- Middle chapters should progress logically from fundamentals to advanced applications
- Structure must support a ${input.documentPages ?? 50}+ page book

Return ONLY valid JSON (no markdown, no code fences):

{
  "title": "Book Title",
  "chapters": [
    {
      "title": "Chapter Title",
      "topics": ["Topic 1", "Topic 2", "Topic 3"]
    }
  ]
}
`), 3, 1500, 'outline generation');

    // Safety fallback
    if (!outline || !outline.chapters || !Array.isArray(outline.chapters) || outline.chapters.length === 0) {
      console.error("[Orchestrator] Invalid outline returned by AI — using fallback.", outline);
      outline = {
        title: input.topic,
        chapters: Array.from({ length: chapterCount }, (_, i) => ({
          title: i === 0 ? 'Introduction' : i === chapterCount - 1 ? 'Conclusion & Future Directions' : `Core Concepts Part ${i}`,
          topics: ['Overview', 'Key Principles', 'Practical Applications']
        }))
      };
    }

    // ── 2. Generate chapters in parallel batches of 3 ────────────
    const BATCH_SIZE = 3;
    const chapters: { title: string; content: string }[] = [];

    for (let i = 0; i < outline.chapters.length; i += BATCH_SIZE) {
      const batch = outline.chapters.slice(i, i + BATCH_SIZE);
      console.log(`✍️  Generating chapters ${i + 1}–${Math.min(i + BATCH_SIZE, outline.chapters.length)} of ${outline.chapters.length}...`);

      const batchResults = await Promise.all(
        batch.map((ch: any, batchIdx: number) => {
          const chapterNum = i + batchIdx + 1;
          return withRetry(
            () => provider.generateText(`
You are a senior subject-matter expert writing a professional textbook chapter.

Book Title: "${outline.title}"
Chapter ${chapterNum}: ${ch.title}
Topics to cover: ${(ch.topics || [ch.title]).join(', ')}
Overall book topic: ${input.topic}
Audience: ${input.audience}
Industry: ${input.industry}
Depth: ${input.depth}
Tone: ${input.tone}
Target length: approximately ${wordsPerChapter} words

MANDATORY STRUCTURE — follow this layout precisely:

## ${ch.title}

### Executive Summary
Write a 2–3 sentence overview of what this chapter covers and why it matters.

### ${chapterNum}.1 [First Subtopic Title]
Write detailed content with clear explanations. Include:
- Bullet points for key concepts
- A real-world example or case study where applicable

### ${chapterNum}.2 [Second Subtopic Title]
Continue with the same pattern for each subtopic listed above.
Each section must have substantive content (not filler).

(Continue numbered sections ${chapterNum}.3, ${chapterNum}.4, etc. for ALL topics listed)

### Key Insights
Provide 3–5 bullet points summarizing the most important takeaways from this chapter.
Format as: **Insight Title** — Brief explanation.

### Chapter Summary
Write a concise 2–3 sentence conclusion that reinforces the core message and transitions to the next chapter.

---

RULES:
- Use clean Markdown formatting (##, ###, bold, bullet points)
- Every section must have real, substantive content — no placeholder text
- Include at least one real-world example or case study per chapter
- Use bullet points where they improve readability
- Write at least ${wordsPerChapter} words total
- Do NOT include chapter numbers in section headings beyond the numbering scheme shown above
`),
            3,
            1000,
            `chapter "${ch.title}"`
          ).then(content => ({ title: ch.title, content }));
        })
      );

      chapters.push(...batchResults);
      console.log(`✅  Batch ${Math.floor(i / BATCH_SIZE) + 1} complete (${chapters.length}/${outline.chapters.length} chapters).`);
    }

    // ── 3. Generate slides ───────────────────────────────────────
    console.log(`📊 Generating ${targetSlides} slides...`);

    // Build chapter titles list for slide alignment
    const chapterTitles = chapters.map((ch, idx) => `Chapter ${idx + 1}: ${ch.title}`).join('\n');

    let slidesData = await withRetry(() => provider.generateJSON(`
You are a senior presentation designer creating an enterprise-grade slide deck.

Topic: ${input.topic}
Audience: ${input.audience}
Industry: ${input.industry}
Tone: ${input.tone}
Book chapters (align slides to these):
${chapterTitles}

Generate a professional presentation with EXACTLY ${targetSlides} slides following this structure:

1. OPENING SLIDE (type: "title")
   - Title: The main topic title
   - Subtitle bullets: audience, date, industry context
   - Speaker notes: Opening remarks

2. AGENDA SLIDE (type: "agenda")
   - Title: "Agenda"
   - Bullets: List of major sections/chapters covered
   - Speaker notes: How to navigate the presentation

3. SECTION DIVIDER SLIDES (type: "section") — one per major chapter
   - Title: The chapter/section name
   - Bullets: 2–3 key questions this section answers
   - Speaker notes: Transition context

4. CONTENT SLIDES (type: "content") — the majority of slides
   - Title: Clear, specific slide title
   - Bullets: 3–6 concise bullet points (no long paragraphs, max 15 words each)
   - Speaker notes: Detailed explanation (2–4 sentences) of what to say
   - Visual suggestion: Describe a diagram, chart, icon, or image that would enhance this slide

5. KEY TAKEAWAYS SLIDE (type: "summary")
   - Title: "Key Takeaways"
   - Bullets: 4–6 critical insights from the entire presentation
   - Speaker notes: Reinforcement of main message

6. CLOSING SLIDE (type: "closing")
   - Title: "Thank You" or a strong closing statement
   - Bullets: Contact info placeholder, Q&A invitation, next steps
   - Speaker notes: Closing remarks

Return ONLY valid JSON (no markdown, no code fences):

{
  "slides": [
    {
      "type": "title|agenda|section|content|summary|closing",
      "title": "Slide Title",
      "bullets": ["Point 1", "Point 2", "Point 3"],
      "speakerNotes": "Detailed speaker notes for this slide",
      "visualSuggestion": "Description of recommended visual element"
    }
  ]
}

RULES:
- EXACTLY ${targetSlides} slide objects
- Every slide MUST have type, title, bullets (array of 2–6 items), and speakerNotes
- Bullets must be concise (max 15 words each) — no long paragraphs
- Content slides must have a visualSuggestion field
- Slides must align with and reference the book chapters
`), 3, 1500, 'slides generation');

    const slides = (slidesData?.slides || []).map((s: any) => ({
      title: s.title || '',
      bullets: Array.isArray(s.bullets) ? s.bullets : [],
      speakerNotes: s.speakerNotes || '',
      visualSuggestion: s.visualSuggestion || '',
      type: s.type || 'content',
    }));

    // ── 4. Generate overview ─────────────────────────────────────
    console.log(`🔍 Generating overview...`);

    let overviewText = '';
    let overviewPurpose = '';
    let overviewDefinitions = '';
    let overviewRelevance = '';
    let takeaways = { insights: [] as string[], decisions: [] as string[], nextSteps: [] as string[], recommendations: [] as string[] };

    try {
      const overviewData = await withRetry(() => provider.generateJSON(`
You are an expert creating an executive overview for a professional knowledge package.

Topic: "${input.topic}"
Audience: ${input.audience}
Industry: ${input.industry}
Chapters covered: ${chapters.map(c => c.title).join(', ')}

Return ONLY valid JSON (no markdown, no code fences):

{
  "explanation": "A compelling 3–4 sentence executive overview of this knowledge package",
  "purpose": "A clear statement of why this topic matters for the target audience (2–3 sentences)",
  "definitions": "3–5 key terms and their definitions, separated by semicolons",
  "relevance": "How this topic impacts the ${input.industry} industry specifically (2–3 sentences)",
  "insights": ["Insight 1", "Insight 2", "Insight 3", "Insight 4", "Insight 5"],
  "decisions": ["Decision point 1", "Decision point 2", "Decision point 3"],
  "nextSteps": ["Actionable step 1", "Actionable step 2", "Actionable step 3"],
  "recommendations": ["Strategic recommendation 1", "Strategic recommendation 2", "Strategic recommendation 3"]
}
`), 2, 1000, 'overview generation');

      overviewText = overviewData?.explanation || `Comprehensive academic textbook on ${input.topic}`;
      overviewPurpose = overviewData?.purpose || input.topic;
      overviewDefinitions = overviewData?.definitions || 'See individual chapters for detailed definitions.';
      overviewRelevance = overviewData?.relevance || 'High';
      takeaways = {
        insights: overviewData?.insights || [],
        decisions: overviewData?.decisions || [],
        nextSteps: overviewData?.nextSteps || [],
        recommendations: overviewData?.recommendations || [],
      };
    } catch (e) {
      console.warn('[Orchestrator] Overview generation failed, using fallback.', e);
      overviewText = `Comprehensive academic textbook on ${input.topic}`;
    }

    // Build agenda from chapters
    const agenda = chapters.map((ch, idx) => ({
      section: `Chapter ${idx + 1}: ${ch.title}`,
      talkingPoint: (outline.chapters[idx]?.topics || []).slice(0, 3).join(', '),
      time: Math.round(input.duration / chapters.length),
      notes: '',
    }));

    console.log(`🎉 Knowledge package complete: ${chapters.length} chapters, ${slides.length} slides.`);

    return {
      meta: input,
      overview: {
        explanation: overviewText,
        purpose: overviewPurpose,
        definitions: overviewDefinitions,
        relevance: overviewRelevance,
      },
      agenda,
      slides,
      bookChapters: chapters,
      takeaways,
      sources: [],
    };
  }
}

export const aiOrchestrator = new AIOrchestrator();