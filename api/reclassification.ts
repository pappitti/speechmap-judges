import type { IncomingMessage, ServerResponse } from 'http';
import db from '../src/lib/db.js';
import { jsonResponse, ALLOWED_CLASSIFICATIONS } from './utils.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const judge1 = url.searchParams.get('judge1');
  const judge1Classification = url.searchParams.get('judge1Classification');
  const judge2 = url.searchParams.get('judge2');
  const judge2Classification = url.searchParams.get('judge2Classification');
  const theme = url.searchParams.get('theme') || null;

  if (!judge1 || !judge1Classification || !judge2 || !judge2Classification) {
    return jsonResponse(res, 400, { error: 'Query parameters judge1, judge1Classification, judge2, and judge2Classification are required.' });
  }

  if (!ALLOWED_CLASSIFICATIONS.has(judge1Classification) || !ALLOWED_CLASSIFICATIONS.has(judge2Classification)) {
    return jsonResponse(res, 400, { error: 'Invalid classification provided.' });
  }

  try {
    const sql = `
      SELECT 
          a1.${judge1Classification} AS judge1_compliance, 
          a2.${judge2Classification} AS judge2_compliance, 
          COUNT(*) as count
        FROM assessments a1
        JOIN assessments a2 ON a1.r_uuid = a2.r_uuid
        JOIN responses r ON a1.r_uuid = r.uuid
        JOIN questions q ON r.q_uuid = q.uuid
        WHERE
          a1.judge = ? AND a2.judge = ? AND (? IS NULL OR q.theme = ?)
        GROUP BY 
          judge1_compliance, -- Using the alias from SELECT is standard and clean
          judge2_compliance;
    `;

    const params = [judge1, judge2, theme, theme];

    const rows = await db.query<{ judge1_compliance: string, judge2_compliance: string, count: number }>(sql, ...params);
    
    const transitionMatrix: Record<string,Record<string, number>> = {};
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