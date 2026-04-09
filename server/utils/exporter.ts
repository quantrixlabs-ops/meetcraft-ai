/**
 * server/utils/exporter.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Multi-format export utilities for KnowledgePackage.
 * Formats: DOCX · PDF · PPTX · XLSX
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { KnowledgePackage } from '../../types.js';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
} from 'docx';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import PptxGenJS from 'pptxgenjs';

// ─── Markdown stripping helper ────────────────────────────────────────────────
function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, '')          // Remove headings
    .replace(/\*\*(.+?)\*\*/g, '$1')   // Bold
    .replace(/\*(.+?)\*/g, '$1')       // Italic
    .replace(/`(.+?)`/g, '$1')         // Inline code
    .replace(/```[\s\S]*?```/g, '')    // Code blocks
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Links
    .replace(/^[-*+]\s+/gm, '• ')      // List bullets
    .replace(/^\d+\.\s+/gm, '')        // Numbered lists
    .replace(/>\s+/g, '')              // Blockquotes
    .replace(/---+/g, '')              // Horizontal rules
    .trim();
}

// ─── Split content into labelled paragraphs ───────────────────────────────────
function splitIntoParagraphs(content: string): string[] {
  return content
    .split(/\n{2,}/)
    .map(s => stripMarkdown(s).trim())
    .filter(s => s.length > 0);
}

// ─── DOCX Export ─────────────────────────────────────────────────────────────
export async function exportToDocx(data: KnowledgePackage): Promise<Buffer> {
  const docChildren: Paragraph[] = [];

  // ── Cover / Title ──────────────────────────────────────────────
  docChildren.push(
    new Paragraph({
      children: [new TextRun({ text: data.meta.topic, bold: true, size: 56, color: '1E293B' })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 1440, after: 480 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Audience: ${data.meta.audience}`, size: 28, color: '475569' })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: `Industry: ${data.meta.industry}`, size: 28, color: '475569' })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: `Depth: ${data.meta.depth}  |  Tone: ${data.meta.tone}`, size: 24, color: '94A3B8' })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 720 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Generated: ${new Date().toLocaleDateString()}`, size: 20, color: '94A3B8' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 1440 },
    }),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ── Overview ───────────────────────────────────────────────────
  if (data.overview?.explanation) {
    docChildren.push(
      new Paragraph({
        text: 'Overview',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 480, after: 240 },
      }),
      new Paragraph({
        children: [new TextRun({ text: stripMarkdown(data.overview.explanation), size: 24 })],
        spacing: { after: 200 },
      }),
      new Paragraph({ children: [new PageBreak()] }),
    );
  }

  // ── Chapters ───────────────────────────────────────────────────
  for (let idx = 0; idx < data.bookChapters.length; idx++) {
    const chapter = data.bookChapters[idx];

    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Chapter ${idx + 1}`, size: 20, color: '6366F1', bold: true }),
        ],
        spacing: { before: 480, after: 120 },
      }),
      new Paragraph({
        text: chapter.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 0, after: 360 },
      }),
    );

    const paragraphs = splitIntoParagraphs(chapter.content);
    for (const para of paragraphs) {
      if (para.startsWith('•')) {
        docChildren.push(
          new Paragraph({
            children: [new TextRun({ text: para, size: 22 })],
            indent: { left: 360 },
            spacing: { after: 120 },
          }),
        );
      } else {
        docChildren.push(
          new Paragraph({
            children: [new TextRun({ text: para, size: 22 })],
            spacing: { after: 200 },
          }),
        );
      }
    }

    if (idx < data.bookChapters.length - 1) {
      docChildren.push(new Paragraph({ children: [new PageBreak()] }));
    }
  }

  // ── Slides Appendix ────────────────────────────────────────────
  if (data.slides?.length > 0) {
    docChildren.push(
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({
        text: 'Presentation Slides',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 480, after: 360 },
      }),
    );

    for (let idx = 0; idx < data.slides.length; idx++) {
      const slide = data.slides[idx];
      docChildren.push(
        new Paragraph({
          children: [new TextRun({ text: `Slide ${idx + 1}: ${slide.title}`, bold: true, size: 26 })],
          spacing: { before: 320, after: 160 },
        }),
      );
      if (slide.bullets?.length) {
        for (const bullet of slide.bullets) {
          docChildren.push(
            new Paragraph({
              children: [new TextRun({ text: `• ${bullet}`, size: 22, color: '334155' })],
              indent: { left: 360 },
              spacing: { after: 100 },
            }),
          );
        }
      }
      if (slide.speakerNotes) {
        docChildren.push(
          new Paragraph({
            children: [new TextRun({ text: `Notes: ${slide.speakerNotes}`, size: 20, color: '64748B', italics: true })],
            spacing: { before: 100, after: 240 },
          }),
        );
      }
    }
  }

  // ── Takeaways Appendix ─────────────────────────────────────────
  if (data.takeaways?.insights?.length || data.takeaways?.nextSteps?.length) {
    docChildren.push(
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ text: 'Key Takeaways', heading: HeadingLevel.HEADING_1, spacing: { before: 480, after: 360 } }),
    );

    const sections: [string, string[]][] = [
      ['Insights', data.takeaways.insights || []],
      ['Decisions', data.takeaways.decisions || []],
      ['Next Steps', data.takeaways.nextSteps || []],
      ['Recommendations', data.takeaways.recommendations || []],
    ];

    for (const [label, items] of sections) {
      if (items.length === 0) continue;
      docChildren.push(new Paragraph({ text: label, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } }));
      for (const item of items) {
        docChildren.push(new Paragraph({ children: [new TextRun({ text: `• ${item}`, size: 22 })], indent: { left: 360 }, spacing: { after: 100 } }));
      }
    }
  }

  const doc = new Document({
    creator: 'MeetCraft AI',
    description: `Generated textbook: ${data.meta.topic}`,
    title: data.meta.topic,
    sections: [{ children: docChildren }],
  });

  return await Packer.toBuffer(doc);
}

// ─── PDF Export ───────────────────────────────────────────────────────────────
export async function exportToPdf(data: KnowledgePackage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 72, bottom: 72, left: 72, right: 72 },
        info: {
          Title: data.meta.topic,
          Author: 'MeetCraft AI',
          Subject: data.meta.industry,
          Creator: 'MeetCraft AI',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const PAGE_WIDTH = doc.page.width - 144; // margins

      // ── Cover Page ─────────────────────────────────────────────
      doc.fontSize(28).font('Helvetica-Bold').fillColor('#1E293B')
        .text(data.meta.topic, { align: 'center', width: PAGE_WIDTH });
      doc.moveDown(2);
      doc.fontSize(13).font('Helvetica').fillColor('#475569')
        .text(`For: ${data.meta.audience}`, { align: 'center', width: PAGE_WIDTH });
      doc.fontSize(13).fillColor('#94A3B8')
        .text(`${data.meta.industry}  ·  ${data.meta.depth}`, { align: 'center', width: PAGE_WIDTH });
      doc.moveDown(1);
      doc.fontSize(11).fillColor('#CBD5E1')
        .text(`Generated ${new Date().toLocaleDateString()}`, { align: 'center', width: PAGE_WIDTH });

      // ── Overview ──────────────────────────────────────────────
      if (data.overview?.explanation) {
        doc.addPage();
        doc.fontSize(20).font('Helvetica-Bold').fillColor('#4338CA')
          .text('Overview', { width: PAGE_WIDTH });
        doc.moveDown(0.5);
        doc.moveTo(72, doc.y).lineTo(72 + PAGE_WIDTH, doc.y).strokeColor('#E2E8F0').stroke();
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica').fillColor('#334155')
          .text(stripMarkdown(data.overview.explanation), { width: PAGE_WIDTH, lineGap: 4 });
      }

      // ── Chapters ───────────────────────────────────────────────
      for (let idx = 0; idx < data.bookChapters.length; idx++) {
        const chapter = data.bookChapters[idx];
        doc.addPage();

        // Chapter number label
        doc.fontSize(10).font('Helvetica').fillColor('#6366F1')
          .text(`CHAPTER ${idx + 1}`, { width: PAGE_WIDTH });
        doc.moveDown(0.3);

        // Chapter title
        doc.fontSize(20).font('Helvetica-Bold').fillColor('#0F172A')
          .text(chapter.title, { width: PAGE_WIDTH });
        doc.moveDown(0.5);

        // Separator
        doc.moveTo(72, doc.y).lineTo(72 + PAGE_WIDTH, doc.y).strokeColor('#E2E8F0').stroke();
        doc.moveDown(0.8);

        // Content (stripped of markdown)
        const content = stripMarkdown(chapter.content);
        doc.fontSize(11).font('Helvetica').fillColor('#1E293B')
          .text(content, { width: PAGE_WIDTH, lineGap: 4, paragraphGap: 8 });
      }

      // ── Slides Summary ─────────────────────────────────────────
      if (data.slides?.length > 0) {
        doc.addPage();
        doc.fontSize(20).font('Helvetica-Bold').fillColor('#4338CA')
          .text('Presentation Slides', { width: PAGE_WIDTH });
        doc.moveDown(0.5);
        doc.moveTo(72, doc.y).lineTo(72 + PAGE_WIDTH, doc.y).strokeColor('#E2E8F0').stroke();
        doc.moveDown(0.8);

        for (let idx = 0; idx < data.slides.length; idx++) {
          const slide = data.slides[idx];
          if (doc.y > doc.page.height - 200) doc.addPage();

          doc.fontSize(13).font('Helvetica-Bold').fillColor('#1E293B')
            .text(`${idx + 1}. ${slide.title}`, { width: PAGE_WIDTH });
          if (slide.bullets?.length) {
            doc.moveDown(0.3);
            doc.fontSize(11).font('Helvetica').fillColor('#475569')
              .text(slide.bullets.map(b => `  • ${b}`).join('\n'), { width: PAGE_WIDTH, lineGap: 3 });
          }
          doc.moveDown(0.6);
        }
      }

      // ── Takeaways ──────────────────────────────────────────────
      if (data.takeaways?.insights?.length) {
        doc.addPage();
        doc.fontSize(20).font('Helvetica-Bold').fillColor('#4338CA')
          .text('Key Takeaways', { width: PAGE_WIDTH });
        doc.moveDown(0.8);

        const sections: [string, string[]][] = [
          ['Insights', data.takeaways.insights || []],
          ['Next Steps', data.takeaways.nextSteps || []],
          ['Recommendations', data.takeaways.recommendations || []],
        ];
        for (const [label, items] of sections) {
          if (!items.length) continue;
          doc.fontSize(14).font('Helvetica-Bold').fillColor('#0F172A').text(label);
          doc.moveDown(0.3);
          for (const item of items) {
            doc.fontSize(11).font('Helvetica').fillColor('#334155').text(`• ${item}`, { indent: 20, lineGap: 3 });
          }
          doc.moveDown(0.8);
        }
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ─── XLSX Export ──────────────────────────────────────────────────────────────
export async function exportToXlsx(data: KnowledgePackage): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MeetCraft AI';
  workbook.created = new Date();

  // ── Sheet 1: Overview ─────────────────────────────────────────
  const overviewSheet = workbook.addWorksheet('Overview');
  overviewSheet.columns = [
    { header: 'Field', key: 'field', width: 25 },
    { header: 'Value', key: 'value', width: 60 },
  ];

  const headerRow = overviewSheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } };

  overviewSheet.addRows([
    { field: 'Topic', value: data.meta.topic },
    { field: 'Audience', value: data.meta.audience },
    { field: 'Industry', value: data.meta.industry },
    { field: 'Depth', value: data.meta.depth },
    { field: 'Tone', value: data.meta.tone },
    { field: 'Duration (min)', value: data.meta.duration },
    { field: 'Document Pages', value: data.meta.documentPages ?? 'Default' },
    { field: 'Slide Count', value: data.meta.slideCount ?? 'Default' },
    { field: 'Generated', value: new Date().toLocaleString() },
  ]);

  if (data.overview?.explanation) {
    overviewSheet.addRow({});
    overviewSheet.addRow({ field: 'Overview', value: stripMarkdown(data.overview.explanation) });
  }

  // ── Sheet 2: Chapters ─────────────────────────────────────────
  const chaptersSheet = workbook.addWorksheet('Chapters');
  chaptersSheet.columns = [
    { header: '#', key: 'num', width: 6 },
    { header: 'Chapter Title', key: 'title', width: 40 },
    { header: 'Word Count', key: 'words', width: 15 },
    { header: 'Content Preview', key: 'preview', width: 80 },
  ];

  const chapHdr = chaptersSheet.getRow(1);
  chapHdr.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  chapHdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };

  data.bookChapters.forEach((ch, idx) => {
    const wordCount = ch.content.split(/\s+/).length;
    const preview = stripMarkdown(ch.content).substring(0, 200) + (ch.content.length > 200 ? '…' : '');
    chaptersSheet.addRow({ num: idx + 1, title: ch.title, words: wordCount, preview });
    if (idx % 2 === 0) {
      chaptersSheet.getRow(idx + 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    }
  });

  // ── Sheet 3: Slides ───────────────────────────────────────────
  if (data.slides?.length > 0) {
    const slidesSheet = workbook.addWorksheet('Slides');
    slidesSheet.columns = [
      { header: '#', key: 'num', width: 6 },
      { header: 'Title', key: 'title', width: 40 },
      { header: 'Bullets', key: 'bullets', width: 60 },
      { header: 'Speaker Notes', key: 'notes', width: 60 },
    ];

    const slideHdr = slidesSheet.getRow(1);
    slideHdr.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    slideHdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };

    data.slides.forEach((sl, idx) => {
      slidesSheet.addRow({
        num: idx + 1,
        title: sl.title || '',
        bullets: (sl.bullets || []).join('\n'),
        notes: sl.speakerNotes || '',
      });
      slidesSheet.getRow(idx + 2).alignment = { wrapText: true, vertical: 'top' };
    });
  }

  // ── Sheet 4: Takeaways ────────────────────────────────────────
  const tkSheet = workbook.addWorksheet('Takeaways');
  tkSheet.columns = [
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Item', key: 'item', width: 80 },
  ];

  const tkHdr = tkSheet.getRow(1);
  tkHdr.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  tkHdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } };

  const tkSections: [string, string[]][] = [
    ['Insights', data.takeaways?.insights || []],
    ['Decisions', data.takeaways?.decisions || []],
    ['Next Steps', data.takeaways?.nextSteps || []],
    ['Recommendations', data.takeaways?.recommendations || []],
  ];

  for (const [cat, items] of tkSections) {
    for (const item of items) {
      tkSheet.addRow({ category: cat, item });
    }
  }

  // ── Sheet 5: Agenda ───────────────────────────────────────────
  if (data.agenda?.length > 0) {
    const agendaSheet = workbook.addWorksheet('Agenda');
    agendaSheet.columns = [
      { header: 'Section', key: 'section', width: 35 },
      { header: 'Time (min)', key: 'time', width: 12 },
      { header: 'Talking Points', key: 'points', width: 60 },
      { header: 'Notes', key: 'notes', width: 40 },
    ];
    const agHdr = agendaSheet.getRow(1);
    agHdr.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    agHdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92400E' } };

    data.agenda.forEach(ag => {
      agendaSheet.addRow({ section: ag.section, time: ag.time, points: ag.talkingPoint, notes: ag.notes });
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// ─── PPTX Export (Server-side) ────────────────────────────────────────────────
export async function exportToPptxServer(data: KnowledgePackage): Promise<Buffer> {
  const pres = new PptxGenJS();
  pres.author = 'MeetCraft AI';
  pres.company = data.meta.industry;
  pres.subject = data.meta.topic;
  pres.title = data.meta.topic;
  pres.layout = 'LAYOUT_WIDE'; // 13.33" × 7.5"

  // ── Color palette ──────────────────────────────────────────────
  const PRIMARY   = '4F46E5'; // Indigo 600
  const ACCENT    = '22C55E'; // Green 500
  const HIGHLIGHT = 'F59E0B'; // Amber 500
  const DARK      = '0F172A'; // Slate 950
  const NAVY      = '1E1B4B'; // Indigo 950
  const BODY      = '334155'; // Slate 700
  const MUTED     = '94A3B8'; // Slate 400
  const LIGHT     = 'F8FAFC'; // Slate 50
  const WHITE     = 'FFFFFF';
  const DIVIDER   = 'E2E8F0'; // Slate 200

  // ── Title Slide ────────────────────────────────────────────────
  const titleSlide = pres.addSlide();
  titleSlide.background = { color: NAVY };

  // Left accent stripe
  titleSlide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: 0.25, h: '100%', fill: { color: PRIMARY },
  });
  // Bottom banner
  titleSlide.addShape(pres.ShapeType.rect, {
    x: 0, y: '85%', w: '100%', h: '15%', fill: { color: '312E81' },
  });
  // Accent square (decorative)
  titleSlide.addShape(pres.ShapeType.rect, {
    x: 0.6, y: 1.35, w: 0.18, h: 0.18, fill: { color: ACCENT },
  });
  // Topic title
  titleSlide.addText(data.meta.topic, {
    x: 0.6, y: 1.0, w: 12.4,
    fontSize: 40, bold: true, color: WHITE,
    fontFace: 'Arial', lineSpacingMultiple: 1.1,
  });
  // Accent underline
  titleSlide.addShape(pres.ShapeType.rect, {
    x: 0.6, y: 2.6, w: 2.0, h: 0.06, fill: { color: ACCENT },
  });
  // Audience
  titleSlide.addText(`For: ${data.meta.audience}`, {
    x: 0.6, y: 2.85, w: 10, fontSize: 16, color: 'A5B4FC',
  });
  // Industry
  titleSlide.addText(data.meta.industry.toUpperCase(), {
    x: 0.6, y: 3.45, w: 8, fontSize: 11, color: ACCENT, bold: true,
  });
  // Date + branding
  titleSlide.addText(`Generated by MeetCraft AI  ·  ${new Date().toLocaleDateString()}`, {
    x: 0.6, y: 6.1, w: 12.4, fontSize: 10, color: '6366F1',
  });

  // ── Content Slides ─────────────────────────────────────────────
  const slides = data.slides?.length ? data.slides : [];

  for (let idx = 0; idx < slides.length; idx++) {
    const slide = slides[idx];
    const isSection = slide.type === 'section' ||
      (!slide.bullets?.length && idx > 0 && idx < slides.length - 1);

    if (isSection) {
      // ── Section Divider Slide ──────────────────────────────────
      const s = pres.addSlide();
      s.background = { color: '1E293B' };

      // Left accent stripe
      s.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 0.14, h: '100%', fill: { color: PRIMARY } });
      // Highlight bar
      s.addShape(pres.ShapeType.rect, { x: 0.4, y: 2.85, w: 2.2, h: 0.07, fill: { color: HIGHLIGHT } });
      // Section label
      s.addText(`SECTION ${idx + 1}`, {
        x: 0.4, y: 2.05, w: 12, fontSize: 11, color: HIGHLIGHT, bold: true,
      });
      // Section title
      s.addText(slide.title || '', {
        x: 0.4, y: 2.45, w: 12, fontSize: 32, bold: true, color: WHITE,
      });
    } else {
      // ── Standard Content Slide ─────────────────────────────────
      const s = pres.addSlide();
      s.background = { color: LIGHT };

      // Top primary accent bar
      s.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.12, fill: { color: PRIMARY } });
      // Left gutter stripe
      s.addShape(pres.ShapeType.rect, { x: 0.35, y: 0.25, w: 0.06, h: 0.85, fill: { color: PRIMARY } });

      // Slide counter (top-right)
      s.addText(`${idx + 1} / ${slides.length}`, {
        x: 11.7, y: 0.18, w: 1.4, fontSize: 9, color: MUTED, align: 'right',
      });

      // Title
      s.addText(slide.title || '', {
        x: 0.6, y: 0.25, w: 12.2, fontSize: 22, bold: true, color: DARK, fontFace: 'Arial',
      });

      // Title underline — subtle full width
      s.addShape(pres.ShapeType.rect, { x: 0.6, y: 1.14, w: 12.2, h: 0.02, fill: { color: DIVIDER } });
      // Accent portion of underline
      s.addShape(pres.ShapeType.rect, { x: 0.6, y: 1.12, w: 1.8, h: 0.05, fill: { color: ACCENT } });

      // Bullet content
      if (slide.bullets?.length) {
        const bulletContent = slide.bullets
          .map(b => `• ${b.replace(/\*\*/g, '')}`)
          .join('\n');
        s.addText(bulletContent, {
          x: 0.6, y: 1.3, w: 12.2, h: 4.9,
          fontSize: 15,
          color: BODY,
          lineSpacingMultiple: 1.7,
          paraSpaceAfter: 6,
          valign: 'top',
        });
      }

      // Speaker notes footer
      if (slide.speakerNotes) {
        s.addShape(pres.ShapeType.rect, { x: 0, y: 6.8, w: '100%', h: 0.7, fill: { color: 'F1F5F9' } });
        s.addText(slide.speakerNotes.substring(0, 160), {
          x: 0.5, y: 6.85, w: 12.3, fontSize: 9, color: MUTED, italic: true,
        });
      }
    }
  }

  // ── Takeaways Summary Slide ────────────────────────────────────
  const hasInsights  = (data.takeaways?.insights?.length ?? 0) > 0;
  const hasNextSteps = (data.takeaways?.nextSteps?.length ?? 0) > 0;

  if (hasInsights || hasNextSteps) {
    const summarySlide = pres.addSlide();
    summarySlide.background = { color: LIGHT };

    // Header band
    summarySlide.addShape(pres.ShapeType.rect, {
      x: 0, y: 0, w: '100%', h: 1.1, fill: { color: PRIMARY },
    });
    summarySlide.addText('Key Takeaways', {
      x: 0.5, y: 0.28, w: 12, fontSize: 26, bold: true, color: WHITE,
    });

    // Vertical divider between columns
    summarySlide.addShape(pres.ShapeType.rect, {
      x: 6.5, y: 1.2, w: 0.04, h: 5.5, fill: { color: DIVIDER },
    });

    // Insights column
    if (hasInsights) {
      summarySlide.addShape(pres.ShapeType.rect, {
        x: 0.4, y: 1.2, w: 5.7, h: 0.06, fill: { color: ACCENT },
      });
      summarySlide.addText('Insights', {
        x: 0.4, y: 1.35, w: 5.7, fontSize: 14, bold: true, color: DARK,
      });
      summarySlide.addText(
        data.takeaways.insights.slice(0, 5).map(i => `• ${i}`).join('\n'),
        { x: 0.4, y: 1.75, w: 5.7, h: 4.8, fontSize: 12, color: BODY, lineSpacingMultiple: 1.5, valign: 'top' },
      );
    }

    // Next Steps column
    if (hasNextSteps) {
      summarySlide.addShape(pres.ShapeType.rect, {
        x: 6.8, y: 1.2, w: 5.7, h: 0.06, fill: { color: HIGHLIGHT },
      });
      summarySlide.addText('Next Steps', {
        x: 6.8, y: 1.35, w: 5.7, fontSize: 14, bold: true, color: DARK,
      });
      summarySlide.addText(
        data.takeaways.nextSteps.slice(0, 5).map(s => `• ${s}`).join('\n'),
        { x: 6.8, y: 1.75, w: 5.7, h: 4.8, fontSize: 12, color: BODY, lineSpacingMultiple: 1.5, valign: 'top' },
      );
    }
  }

  const output = await pres.write('nodebuffer' as any);
  return Buffer.from(output as ArrayBuffer);
}
