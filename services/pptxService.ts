import PptxGenJS from "pptxgenjs";
import { KnowledgePackage } from "../types";

// ── Brand palette ────────────────────────────────────────────────────────────
const C = {
  navy:    "1E3A8A",   // primary dark blue
  indigo:  "4F46E5",   // accent indigo
  sky:     "0EA5E9",   // highlight sky
  emerald: "10B981",   // success / insight green
  amber:   "F59E0B",   // warning / highlight
  white:   "FFFFFF",
  offWhite:"F8FAFC",
  light:   "E2E8F0",
  mid:     "94A3B8",
  dark:    "1E293B",
  charcoal:"334155",
} as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Strip markdown syntax from a line of text */
function stripMd(text: string): string {
  return text
    .replace(/^#{1,6}\s+/, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/^[-*>+]\s+/, '')
    .replace(/^\d+\.\s+/, '')
    .trim();
}

/** Extract up to `max` meaningful bullet lines from chapter content */
function extractBullets(content: string, max = 5): string[] {
  const lines = content
    .split('\n')
    .map(l => stripMd(l))
    .filter(l => l.length > 15 && l.length < 160);
  // Prefer lines that look like sentences (contain a verb cue or start capitalised)
  const picks: string[] = [];
  for (const line of lines) {
    if (picks.length >= max) break;
    picks.push(line);
  }
  return picks;
}

/** Add a thin horizontal rule */
function addRule(slide: PptxGenJS.Slide, y: number, color: string = C.indigo) {
  slide.addShape("rect" as any, { x: 0.5, y, w: 9, h: 0.04, fill: { color } });
}

/** Add a standard footer to every content slide */
function addFooter(slide: PptxGenJS.Slide, topic: string, pageNum: number) {
  slide.addShape("rect" as any, { x: 0, y: 6.9, w: "100%", h: 0.4, fill: { color: C.navy } });
  slide.addText(topic.toUpperCase(), {
    x: 0.4, y: 6.92, w: 6, h: 0.35,
    fontSize: 7, color: C.mid, bold: false,
  });
  slide.addText(String(pageNum), {
    x: 8.8, y: 6.92, w: 0.8, h: 0.35,
    fontSize: 7, color: C.mid, align: "right",
  });
  slide.addText("MeetCraft AI", {
    x: 3.5, y: 6.92, w: 3, h: 0.35,
    fontSize: 7, color: C.sky, align: "center",
  });
}

// ── Main export ──────────────────────────────────────────────────────────────

export async function generatePowerPoint(data: KnowledgePackage): Promise<void> {
  console.log('[PPTX] Generating PowerPoint for:', data.meta.topic);
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 10 × 7.5 in

  let pageNum = 1;

  // ── 1. TITLE SLIDE ─────────────────────────────────────────────────────────
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: C.navy };

  // Left accent bar
  titleSlide.addShape("rect" as any, { x: 0, y: 0, w: 0.18, h: "100%", fill: { color: C.indigo } });

  // Decorative circles
  titleSlide.addShape("ellipse" as any, { x: 7.2, y: -1.2, w: 4, h: 4, fill: { color: C.indigo }, line: { color: C.indigo } });
  titleSlide.addShape("ellipse" as any, { x: 8.0, y: 4.5,  w: 2.5, h: 2.5, fill: { color: C.sky }, line: { color: C.sky } });

  titleSlide.addText("KNOWLEDGE PACKAGE", {
    x: 0.5, y: 1.4, w: 8, h: 0.4,
    fontSize: 11, color: C.sky, bold: true, charSpacing: 3,
  });

  titleSlide.addText(data.meta.topic, {
    x: 0.5, y: 1.9, w: 8.2, h: 2.2,
    fontSize: 38, bold: true, color: C.white,
    wrap: true, valign: "top",
  });

  addRule(titleSlide, 4.2, C.sky);

  titleSlide.addText(
    [
      { text: `Audience: `,  options: { color: C.mid,   fontSize: 13, bold: false } },
      { text: data.meta.audience, options: { color: C.white, fontSize: 13, bold: true  } },
      { text: `   ·   Depth: `, options: { color: C.mid,   fontSize: 13, bold: false } },
      { text: data.meta.depth,    options: { color: C.white, fontSize: 13, bold: true  } },
    ],
    { x: 0.5, y: 4.3, w: 8, h: 0.5 }
  );

  titleSlide.addText(`Industry: ${data.meta.industry}   ·   Tone: ${data.meta.tone}`, {
    x: 0.5, y: 4.85, w: 8, h: 0.35,
    fontSize: 11, color: C.mid,
  });

  titleSlide.addText("MeetCraft AI", {
    x: 0.5, y: 6.8, w: 4, h: 0.4,
    fontSize: 10, color: C.sky, bold: true,
  });

  // ── 2. AGENDA SLIDE ────────────────────────────────────────────────────────
  if (data.bookChapters.length > 0) {
    pageNum++;
    const agendaSlide = pptx.addSlide();
    agendaSlide.background = { color: C.offWhite };

    agendaSlide.addShape("rect" as any, { x: 0, y: 0, w: "100%", h: 1.2, fill: { color: C.indigo } });
    agendaSlide.addText("TABLE OF CONTENTS", {
      x: 0.5, y: 0.1, w: 9, h: 0.45,
      fontSize: 11, color: C.sky, bold: true, charSpacing: 3,
    });
    agendaSlide.addText("What We Will Cover", {
      x: 0.5, y: 0.55, w: 9, h: 0.55,
      fontSize: 26, bold: true, color: C.white,
    });

    const half = Math.ceil(data.bookChapters.length / 2);
    const leftChapters  = data.bookChapters.slice(0, half);
    const rightChapters = data.bookChapters.slice(half);

    const renderColumn = (chapters: typeof data.bookChapters, x: number) => {
      chapters.forEach((ch, i) => {
        const y = 1.4 + i * 0.62;
        agendaSlide.addShape("rect" as any, {
          x, y, w: 0.32, h: 0.32,
          fill: { color: C.indigo }, line: { color: C.indigo },
        });
        agendaSlide.addText(String(i + (x > 4 ? half + 1 : 1)), {
          x, y, w: 0.32, h: 0.32,
          fontSize: 9, color: C.white, bold: true, align: "center", valign: "middle",
        });
        agendaSlide.addText(stripMd(ch.title), {
          x: x + 0.42, y: y + 0.02, w: 4.1, h: 0.3,
          fontSize: 12, color: C.dark, bold: false,
        });
      });
    };

    renderColumn(leftChapters,  0.4);
    renderColumn(rightChapters, 5.1);
    addFooter(agendaSlide, data.meta.topic, pageNum);
  }

  // ── 3. OVERVIEW SLIDE ──────────────────────────────────────────────────────
  if (data.overview?.explanation) {
    pageNum++;
    const overSlide = pptx.addSlide();
    overSlide.background = { color: C.dark };

    overSlide.addShape("rect" as any, { x: 0, y: 0, w: "100%", h: 1.1, fill: { color: C.indigo } });
    overSlide.addText("OVERVIEW", {
      x: 0.5, y: 0.08, w: 9, h: 0.4,
      fontSize: 11, color: C.sky, bold: true, charSpacing: 3,
    });
    overSlide.addText("What Is This About?", {
      x: 0.5, y: 0.52, w: 9, h: 0.5,
      fontSize: 24, bold: true, color: C.white,
    });

    overSlide.addText(data.overview.explanation, {
      x: 0.6, y: 1.3, w: 8.8, h: 2.5,
      fontSize: 17, color: C.light, lineSpacingMultiple: 1.5, wrap: true,
    });

    if (data.takeaways?.insights?.length) {
      addRule(overSlide, 4.0, C.sky);
      overSlide.addText("KEY INSIGHTS", {
        x: 0.5, y: 4.1, w: 4, h: 0.35,
        fontSize: 9, color: C.sky, bold: true, charSpacing: 2,
      });
      data.takeaways.insights.slice(0, 3).forEach((insight, i) => {
        overSlide.addShape("ellipse" as any, {
          x: 0.5, y: 4.55 + i * 0.55, w: 0.22, h: 0.22,
          fill: { color: C.emerald }, line: { color: C.emerald },
        });
        overSlide.addText(stripMd(insight), {
          x: 0.82, y: 4.5 + i * 0.55, w: 8.5, h: 0.4,
          fontSize: 12, color: C.light,
        });
      });
    }

    addFooter(overSlide, data.meta.topic, pageNum);
  }

  // ── 4. CHAPTER SLIDES ──────────────────────────────────────────────────────
  data.bookChapters.forEach((chapter, index) => {
    // Section divider
    pageNum++;
    const divider = pptx.addSlide();
    divider.background = { color: C.indigo };

    divider.addShape("ellipse" as any, {
      x: 6.5, y: -0.8, w: 5, h: 5,
      fill: { color: C.navy }, line: { color: C.navy },
    });

    divider.addText(`${String(index + 1).padStart(2, '0')}`, {
      x: 0.5, y: 1.5, w: 3, h: 2.5,
      fontSize: 96, bold: true, color: C.white,
    });
    divider.addShape("rect" as any, { x: 0.5, y: 3.9, w: 4, h: 0.06, fill: { color: C.sky } });
    divider.addText(stripMd(chapter.title), {
      x: 0.5, y: 4.05, w: 7, h: 1.4,
      fontSize: 22, bold: true, color: C.white, wrap: true,
    });
    divider.addText("MeetCraft AI", {
      x: 0.5, y: 6.8, w: 4, h: 0.4,
      fontSize: 9, color: C.sky,
    });

    // Content slide
    pageNum++;
    const content = pptx.addSlide();
    content.background = { color: C.offWhite };

    // Top header band
    content.addShape("rect" as any, { x: 0, y: 0, w: "100%", h: 1.15, fill: { color: C.navy } });
    content.addText(`Chapter ${index + 1}`, {
      x: 0.5, y: 0.08, w: 9, h: 0.35,
      fontSize: 10, color: C.sky, bold: true, charSpacing: 2,
    });
    content.addText(stripMd(chapter.title), {
      x: 0.5, y: 0.44, w: 8.8, h: 0.65,
      fontSize: 22, bold: true, color: C.white,
    });

    const bullets = extractBullets(chapter.content, 5);

    if (bullets.length === 0) {
      // Fallback: just show trimmed prose
      content.addText(chapter.content.slice(0, 600) + '…', {
        x: 0.5, y: 1.3, w: 9, h: 5,
        fontSize: 13, color: C.charcoal, wrap: true, lineSpacingMultiple: 1.5,
      });
    } else {
      bullets.forEach((bullet, bi) => {
        const y = 1.35 + bi * 0.98;
        // Bullet marker
        content.addShape("rect" as any, {
          x: 0.4, y: y + 0.12, w: 0.06, h: 0.35,
          fill: { color: bi % 2 === 0 ? C.indigo : C.sky },
        });
        content.addText(bullet, {
          x: 0.62, y, w: 9.1, h: 0.85,
          fontSize: 14, color: C.dark, wrap: true, lineSpacingMultiple: 1.3,
        });
      });
    }

    addFooter(content, data.meta.topic, pageNum);
  });

  // ── 5. GENERATED SLIDES (from AI slides array) ─────────────────────────────
  if (data.slides && data.slides.length > 0) {
    // Section header
    pageNum++;
    const slidesDivider = pptx.addSlide();
    slidesDivider.background = { color: C.dark };
    slidesDivider.addShape("rect" as any, { x: 0, y: 0, w: 0.18, h: "100%", fill: { color: C.sky } });
    slidesDivider.addText("PRESENTATION", {
      x: 0.5, y: 2.5, w: 9, h: 0.5,
      fontSize: 14, color: C.sky, bold: true, charSpacing: 4, align: "center",
    });
    slidesDivider.addText("Slides", {
      x: 0.5, y: 3.1, w: 9, h: 1.2,
      fontSize: 56, bold: true, color: C.white, align: "center",
    });

    data.slides.forEach((slide) => {
      pageNum++;
      const s = pptx.addSlide();
      s.background = { color: C.offWhite };

      // Accent top strip
      s.addShape("rect" as any, { x: 0, y: 0, w: "100%", h: 0.12, fill: { color: C.indigo } });

      // Title
      s.addText(stripMd(slide.title || 'Slide'), {
        x: 0.5, y: 0.22, w: 8.5, h: 0.7,
        fontSize: 24, bold: true, color: C.navy,
      });
      addRule(s, 0.96, C.sky);

      // Bullets
      const bullets = Array.isArray(slide.bullets) ? slide.bullets : [];
      bullets.slice(0, 6).forEach((bullet, bi) => {
        const y = 1.1 + bi * 0.78;
        s.addShape("ellipse" as any, {
          x: 0.45, y: y + 0.22, w: 0.14, h: 0.14,
          fill: { color: bi % 3 === 0 ? C.indigo : bi % 3 === 1 ? C.sky : C.emerald },
        });
        s.addText(stripMd(bullet), {
          x: 0.72, y, w: 9, h: 0.72,
          fontSize: 14, color: C.charcoal, wrap: true,
        });
      });

      // Speaker notes box
      if (slide.speakerNotes) {
        s.addShape("rect" as any, {
          x: 0, y: 6.2, w: "100%", h: 0.7,
          fill: { color: C.navy },
        });
        s.addText(`Notes: ${stripMd(slide.speakerNotes).slice(0, 160)}`, {
          x: 0.5, y: 6.22, w: 9.3, h: 0.6,
          fontSize: 9, color: C.mid, italic: true,
        });
      }

      addFooter(s, data.meta.topic, pageNum);
    });
  }

  // ── 6. KEY TAKEAWAYS SLIDE ─────────────────────────────────────────────────
  if (data.takeaways?.nextSteps?.length || data.takeaways?.recommendations?.length) {
    pageNum++;
    const tSlide = pptx.addSlide();
    tSlide.background = { color: C.dark };

    tSlide.addShape("rect" as any, { x: 0, y: 0, w: "100%", h: 1.15, fill: { color: C.emerald } });
    tSlide.addText("NEXT STEPS & RECOMMENDATIONS", {
      x: 0.5, y: 0.08, w: 9, h: 0.38,
      fontSize: 10, color: C.dark, bold: true, charSpacing: 2,
    });
    tSlide.addText("Action Plan", {
      x: 0.5, y: 0.5, w: 9, h: 0.58,
      fontSize: 28, bold: true, color: C.dark,
    });

    const items = [
      ...(data.takeaways.nextSteps?.map(s => ({ label: 'Next Step', text: s, color: C.sky })) ?? []),
      ...(data.takeaways.recommendations?.map(r => ({ label: 'Rec', text: r, color: C.amber })) ?? []),
    ].slice(0, 6);

    items.forEach((item, i) => {
      const col = i < 3 ? 0 : 1;
      const row = i % 3;
      const x = col === 0 ? 0.4 : 5.2;
      const y = 1.35 + row * 1.65;

      tSlide.addShape("rect" as any, {
        x, y, w: 4.4, h: 1.45,
        fill: { color: "1E293B" }, line: { color: item.color, pt: 2 },
      });
      tSlide.addText(item.label.toUpperCase(), {
        x: x + 0.15, y: y + 0.1, w: 4, h: 0.28,
        fontSize: 8, color: item.color, bold: true, charSpacing: 1,
      });
      tSlide.addText(stripMd(item.text), {
        x: x + 0.15, y: y + 0.38, w: 4.1, h: 0.96,
        fontSize: 12, color: C.light, wrap: true, lineSpacingMultiple: 1.3,
      });
    });

    addFooter(tSlide, data.meta.topic, pageNum);
  }

  // ── 7. CLOSING SLIDE ───────────────────────────────────────────────────────
  pageNum++;
  const closing = pptx.addSlide();
  closing.background = { color: C.navy };

  closing.addShape("ellipse" as any, {
    x: -1, y: -1, w: 5, h: 5,
    fill: { color: C.indigo }, line: { color: C.indigo },
  });
  closing.addShape("ellipse" as any, {
    x: 7, y: 4.5, w: 4, h: 4,
    fill: { color: C.sky }, line: { color: C.sky },
  });

  closing.addText("Thank You", {
    x: 0.5, y: 1.8, w: 9, h: 1.6,
    fontSize: 56, bold: true, color: C.white, align: "center",
  });
  closing.addText(data.meta.topic, {
    x: 0.5, y: 3.6, w: 9, h: 0.6,
    fontSize: 18, color: C.sky, align: "center",
  });
  addRule(closing, 4.35, C.sky);
  closing.addText("Generated by MeetCraft AI", {
    x: 0.5, y: 4.5, w: 9, h: 0.4,
    fontSize: 11, color: C.mid, align: "center",
  });

  // ── Write file ──────────────────────────────────────────────────────────────
  const fileName = data.meta.topic.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').slice(0, 60) + '.pptx';
  await pptx.writeFile({ fileName });
  console.log(`[PPTX] Done — ${pageNum} slides written to ${fileName}`);
}
