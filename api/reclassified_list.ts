import type { IncomingMessage, ServerResponse } from 'http';
import db from '../src/lib/db.js';
import { jsonResponse } from './utils.js';

// This API endpoint fetches reclassified items by response uuid based on the judges and theme
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // parsing query parameters from the URL
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const judge1 = url.searchParams.get('judge1');
  const judge2 = url.searchParams.get('judge2');
  const theme = url.searchParams.get('theme') || null;

  if (!judge1 || !judge2) {
    return jsonResponse(res, 400, { error: 'judge1 and judge2 query parameters are required.' });
  }

  try {
    const sql = `
        SELECT a1.compliance AS judge1_compliance, a2.compliance AS judge2_compliance, r.uuid as r_uuid
        FROM assessments a1
        JOIN assessments a2 ON a1.r_uuid = a2.r_uuid
        JOIN responses r ON a1.r_uuid = r.uuid
        JOIN questions q ON r.q_uuid = q.uuid
        WHERE
          a1.judge = ? AND a2.judge = ? AND (? IS NULL OR q.theme = ?)
        ORDER BY r.uuid`;

    const rows = await db.query<{ judge1_compliance: string, judge2_compliance: string, r_uuid: string }>(
      sql, judge1, judge2, theme, theme
    );
    
    // matrix logic
    const transitionMatrix: Record<string, Record<string, string[]>> = {};
    for (const row of rows) {
      if (!transitionMatrix[row.judge1_compliance]) {
        transitionMatrix[row.judge1_compliance] = {};
      }
      if (!transitionMatrix[row.judge1_compliance][row.judge2_compliance]) {
        transitionMatrix[row.judge1_compliance][row.judge2_compliance] = [];
      }
      transitionMatrix[row.judge1_compliance][row.judge2_compliance].push(row.r_uuid);
    }
    jsonResponse(res, 200, transitionMatrix);
  } catch (error) {
    console.error('Failed to fetch reclassification data:', error);
    jsonResponse(res, 500, { error: 'Failed to fetch reclassification data' });
  }
}