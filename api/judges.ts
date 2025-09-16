import type { IncomingMessage, ServerResponse } from 'http';
import db from '../src/lib/db.js';
import { jsonResponse } from './utils.js';

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  try {
    const sql = `
      SELECT 
        judge, 
        judge_type,
        COUNT(compliance) as compliance,
        COUNT(pitti_compliance) as pitti_compliance
      FROM assessments 
      GROUP BY judge, judge_type
      ORDER BY judge DESC;
    `;
    const rows = await db.query<{ judge: string, judge_type: string, compliance : number, pitti_compliance :number }>(sql);
    const judges = rows.map(row => ({
      name: row.judge,
      judge_type: row.judge_type,
      classifications: {
        compliance: Number(row.compliance),
        pitti_compliance: Number(row.pitti_compliance)
      }
    }));
    jsonResponse(res, 200, judges);
  } catch (error) {
    console.error('Failed to fetch judges:', error);
    jsonResponse(res, 500, { error: 'Failed to fetch judges' });
  }
}