import type { IncomingMessage, ServerResponse } from 'http';
import db from '../src/lib/db.js';
import { jsonResponse } from './utils.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // We need to parse query parameters from the URL
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const judge1 = url.searchParams.get('judge1');
  const judge2 = url.searchParams.get('judge2');
  const theme = url.searchParams.get('theme') || null;

  if (!judge1 || !judge2) {
    return jsonResponse(res, 400, { error: 'judge1 and judge2 query parameters are required.' });
  }

  try {
    const sql = `
        SELECT a1.compliance AS judge1_compliance, a2.compliance AS judge2_compliance, COUNT(*) as count
        FROM assessments a1
        JOIN assessments a2 ON a1.r_uuid = a2.r_uuid
        JOIN responses r ON a1.r_uuid = r.uuid
        JOIN questions q ON r.q_uuid = q.uuid
        WHERE
          a1.judge_model = ? AND a2.judge_model = ? AND (? IS NULL OR q.theme = ?)
        GROUP BY a1.compliance, a2.compliance;`;
        
    const rows = await db.query<{ judge1_compliance: string, judge2_compliance: string, count: number }>(
      sql, judge1, judge2, theme, theme
    );
    
    // The matrix logic is identical
    const transitionMatrix: Record<string, Record<string, number>> = {};
    for (const row of rows) {
      if (!transitionMatrix[row.judge1_compliance]) {
        transitionMatrix[row.judge1_compliance] = {};
      }
      transitionMatrix[row.judge1_compliance][row.judge2_compliance] = Number(row.count);
    }
    jsonResponse(res, 200, transitionMatrix);
  } catch (error) {
    console.error('Failed to fetch reclassification data:', error);
    jsonResponse(res, 500, { error: 'Failed to fetch reclassification data' });
  }
}