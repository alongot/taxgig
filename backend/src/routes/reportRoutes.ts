/**
 * Report Routes
 * PDF tax report generation and management
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  generateReport,
  createReport,
  getReportHistory,
  previewReport,
  emailReport,
} from '../controllers/reportController';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/reports/generate
 * Generate and download a PDF tax report
 * Query params:
 *   - year: Tax year (default: current year)
 *   - quarter: 1-4 for quarterly report, omit for annual
 */
router.get('/generate', generateReport);

/**
 * POST /api/reports/generate
 * Generate a report and return metadata
 * Body: { tax_year: number, quarter?: number }
 */
router.post('/generate', createReport);

/**
 * GET /api/reports/preview
 * Get report summary data without generating PDF
 * Query params:
 *   - year: Tax year (default: current year)
 *   - quarter: 1-4 for quarterly, omit for annual
 */
router.get('/preview', previewReport);

/**
 * GET /api/reports/history
 * Get list of previously generated reports
 * Query params:
 *   - limit: Number of reports to return (default: 20)
 */
router.get('/history', getReportHistory);

/**
 * POST /api/reports/email
 * Generate a report and send it via email
 * Body: {
 *   tax_year: number,
 *   quarter?: number,
 *   recipient_email?: string (defaults to user's email)
 * }
 */
router.post('/email', emailReport);

export default router;
