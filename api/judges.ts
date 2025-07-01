import type { IncomingMessage, ServerResponse } from 'http';
import db from '../src/lib/db.js';
import { jsonResponse } from './utils.js';

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  try {
    const sql = 'SELECT DISTINCT judge_model FROM assessments ORDER BY judge_model DESC';
    const rows = await db.query<{ judge_model: string }>(sql);
    const judges = rows.map(row => row.judge_model); // Map the data as before
    jsonResponse(res, 200, judges);
  } catch (error) {
    console.error('Failed to fetch judges:', error);
    jsonResponse(res, 500, { error: 'Failed to fetch judges' });
  }
}