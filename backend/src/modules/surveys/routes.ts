import express, { Router, type Request, type Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { env } from '../../config/env.js';
import { ApiError, success } from '../../lib/http.js';
import { actor, authenticate, allowRoles, requireCsrf } from '../auth/auth.js';
import { LocalSurveyStorage, type SurveyStorage } from './storage.js';
import * as v from './validation.js';
import * as surveys from './survey.service.js';
import * as scheduling from './scheduling.service.js';
import * as read from './read.service.js';
import * as review from './review.service.js';
import * as attachments from './attachments.service.js';

export function createSurveyRouter(storage: SurveyStorage = new LocalSurveyStorage(env.SURVEY_STORAGE_DIR, env.SURVEY_MAX_FILE_BYTES)) {
  const router = Router();
  router.use(authenticate, allowRoles('ADMIN', 'SALES', 'TECHNICIAN'), requireCsrf);
  const id = (req: Request) => v.idParams.parse(req.params).id;
  const list = (res: Response, result: { data: unknown; pagination: unknown }) => success(res, result.data, 200, { pagination: result.pagination });
  router.get('/summary', async (req, res) => success(res, await read.summary(actor(req))));
  router.get('/availability', async (req, res) => success(res, await read.availability(actor(req), v.availability.parse(req.query))));
  router.get('/surveyors', allowRoles('ADMIN'), async (req, res) => list(res, await read.surveyors(actor(req), v.page.parse(req.query))));
  router.get('/', async (req, res) => list(res, await read.listSurveys(actor(req), v.list.parse(req.query))));
  router.post('/', allowRoles('ADMIN', 'SALES'), async (req, res) => success(res, await surveys.createSurvey(actor(req), v.create.parse(req.body)), 201));
  router.get('/:id', async (req, res) => success(res, await read.surveyDetail(actor(req), id(req))));
  router.patch('/:id', async (req, res) => success(res, await surveys.updateFeasibility(actor(req), id(req), v.update.parse(req.body))));
  router.post('/:id/assign', allowRoles('ADMIN'), async (req, res) => success(res, await scheduling.assignSurveyor(actor(req), id(req), v.assign.parse(req.body))));
  router.post('/:id/schedule', allowRoles('ADMIN'), async (req, res) => success(res, await scheduling.scheduleSurvey(actor(req), id(req), v.schedule.parse(req.body))));
  router.post('/:id/start', allowRoles('TECHNICIAN'), async (req, res) => success(res, await scheduling.startSurvey(actor(req), id(req), v.command.parse(req.body))));
  router.post('/:id/submit', allowRoles('TECHNICIAN'), async (req, res) => success(res, await review.submitSurvey(actor(req), id(req), v.command.parse(req.body))));
  router.post('/:id/review', allowRoles('ADMIN'), async (req, res) => success(res, await review.reviewSurvey(actor(req), id(req), v.review.parse(req.body))));
  router.post('/:id/cancel', allowRoles('ADMIN'), async (req, res) => success(res, await surveys.cancelSurvey(actor(req), id(req), v.command.parse(req.body))));
  router.put('/:id/roof-assessment', allowRoles('TECHNICIAN'), async (req, res) => success(res, await surveys.putRoof(actor(req), id(req), v.roof.parse(req.body))));
  router.put('/:id/electrical-assessment', allowRoles('TECHNICIAN'), async (req, res) => success(res, await surveys.putElectrical(actor(req), id(req), v.electrical.parse(req.body))));
  router.get('/:id/attachments', async (req, res) => list(res, await read.surveyCollection(actor(req), id(req), v.page.parse(req.query), 'attachments')));
  router.get('/:id/history', async (req, res) => list(res, await read.surveyCollection(actor(req), id(req), v.page.parse(req.query), 'history')));
  router.get('/:id/reviews', async (req, res) => list(res, await read.surveyCollection(actor(req), id(req), v.page.parse(req.query), 'reviews')));
  router.get('/:id/approved', async (req, res) => success(res, await review.approvedSurvey(actor(req), id(req))));

  const raw = express.raw({ type: ['image/jpeg', 'image/png', 'application/pdf'], limit: env.SURVEY_MAX_FILE_BYTES, inflate: false });
  router.post('/:id/attachments', allowRoles('TECHNICIAN'), rateLimit({ windowMs: 15 * 60000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false,
    handler: (_req, _res, next) => next(new ApiError(429, 'RATE_LIMITED', 'Too many uploads; try again later')),
  }), async (req, _res, next) => {
    const input = v.upload.parse(req.query);
    await attachments.uploadPreflight(actor(req), id(req), input.version);
    if (!req.is(['image/jpeg', 'image/png', 'application/pdf'])) throw new ApiError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Upload a raw JPEG, PNG or PDF file');
    next();
  }, (req, res, next) => raw(req, res, (error: unknown) => {
    if (error) {
      const type = typeof error === 'object' && error !== null && 'type' in error ? error.type : undefined;
      if (type === 'entity.too.large') return next(new ApiError(413, 'FILE_TOO_LARGE', 'File exceeds the configured upload limit'));
      if (type === 'encoding.unsupported') return next(new ApiError(415, 'UPLOAD_ENCODING_UNSUPPORTED', 'Compressed uploads are not accepted'));
      return next(new ApiError(400, 'INVALID_UPLOAD_BODY', 'Unable to read the upload body'));
    }
    next();
  }), async (req, res) => {
    if (!Buffer.isBuffer(req.body)) throw new ApiError(422, 'BINARY_FILE_REQUIRED', 'Send raw file bytes, not JSON or multipart form data');
    const mime = req.get('Content-Type')!.split(';')[0]!.trim().toLowerCase();
    return success(res, await attachments.uploadAttachment(actor(req), id(req), v.upload.parse(req.query), req.body, mime, storage), 201);
  });
  router.get('/:id/attachments/:attachmentId/download', async (req, res) => {
    const params = v.fileParams.parse(req.params);
    const file = await attachments.downloadAttachment(actor(req), params.id, params.attachmentId, storage);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    res.setHeader('Content-Security-Policy', "sandbox; default-src 'none'");
    return res.status(200).send(file.bytes);
  });
  router.use((_req, _res, next) => next(new ApiError(404, 'NOT_FOUND', 'Survey endpoint not found')));
  return router;
}
