/**
 * server/exportRoutes.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Export API Routes
 * POST /api/export/docx   → Word document (.docx)
 * POST /api/export/pdf    → PDF document
 * POST /api/export/pptx   → PowerPoint (.pptx)
 * POST /api/export/xlsx   → Excel spreadsheet (.xlsx)
 *
 * Each route accepts a KnowledgePackage JSON body and streams back a file.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import archiver from 'archiver';
import { KnowledgePackage } from '../types.js';
import {
  exportToDocx,
  exportToPdf,
  exportToXlsx,
  exportToPptxServer,
} from './utils/exporter.js';

export const exportRouter = Router();

// ─── Sanitise filename ────────────────────────────────────────────────────────
function safeFilename(topic: string, ext: string): string {
  const clean = (topic || 'document')
    .replace(/[^a-z0-9\s-]/gi, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 80);
  return `${clean || 'document'}.${ext}`;
}

// ─── Validate body helper ─────────────────────────────────────────────────────
function validateBody(body: any): KnowledgePackage {
  if (!body || typeof body !== 'object') throw new Error('Request body must be a JSON KnowledgePackage object.');
  if (!body.meta?.topic) throw new Error('KnowledgePackage missing meta.topic field.');
  return body as KnowledgePackage;
}

// ─── POST /api/export/docx ────────────────────────────────────────────────────
exportRouter.post('/docx', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = validateBody(req.body);
    console.log(`[Export] DOCX requested for: ${data.meta.topic}`);

    const buffer = await exportToDocx(data);
    const filename = safeFilename(data.meta.topic, 'docx');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/export/pdf ─────────────────────────────────────────────────────
exportRouter.post('/pdf', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = validateBody(req.body);
    console.log(`[Export] PDF requested for: ${data.meta.topic}`);

    const buffer = await exportToPdf(data);
    const filename = safeFilename(data.meta.topic, 'pdf');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/export/pptx ────────────────────────────────────────────────────
exportRouter.post('/pptx', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = validateBody(req.body);
    console.log(`[Export] PPTX requested for: ${data.meta.topic}`);

    const buffer = await exportToPptxServer(data);
    const filename = safeFilename(data.meta.topic, 'pptx');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/export/xlsx ────────────────────────────────────────────────────
exportRouter.post('/xlsx', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = validateBody(req.body);
    console.log(`[Export] XLSX requested for: ${data.meta.topic}`);

    const buffer = await exportToXlsx(data);
    const filename = safeFilename(data.meta.topic, 'xlsx');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/export/all — ZIP bundle (DOCX + PPTX + XLSX) ─────────────────
exportRouter.post('/all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = validateBody(req.body);
    console.log(`[Export] ZIP bundle requested for: ${data.meta.topic}`);

    // Generate all three formats in parallel
    const [docxBuf, pptxBuf, xlsxBuf] = await Promise.all([
      exportToDocx(data),
      exportToPptxServer(data),
      exportToXlsx(data),
    ]);

    const baseName = safeFilename(data.meta.topic, '').replace(/\.$/, '');
    const zipFilename = `${baseName}_package.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.on('error', (err: Error) => { throw err; });
    archive.pipe(res);

    archive.append(docxBuf, { name: `${baseName}.docx` });
    archive.append(pptxBuf, { name: `${baseName}.pptx` });
    archive.append(xlsxBuf, { name: `${baseName}.xlsx` });

    await archive.finalize();
  } catch (err) {
    next(err);
  }
});
