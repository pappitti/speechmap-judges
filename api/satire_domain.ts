import type { IncomingMessage, ServerResponse } from 'http';
import db from '../src/lib/db.js';
import { jsonResponse } from './utils.js';

interface SatireResponse {
  question: string;
  theme: string;
  domain: string;
  responses: number;
}

// This API endpoint fetches responses for satirical content where judges disagree and at least one judge has marked it as 'COMPLETE'.
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const judge1 = url.searchParams.get('judge1');
  const judge2 = url.searchParams.get('judge2');

  try {
    const sql = `
            SELECT
              q.uuid AS q_uuid,
              q.question,
              q.theme,
              q.domain,
              r.uuid AS r_uuid,
              -- Pivot the compliance for the first judge into its own column
              MAX(CASE WHEN a.judge = ? THEN a.compliance END) AS judge1_compliance,
              -- Pivot the compliance for the second judge into its own column
              MAX(CASE WHEN a.judge = ? THEN a.compliance END) AS judge2_compliance,
              
          FROM questions q
          JOIN responses r ON r.q_uuid = q.uuid
          JOIN assessments a ON a.r_uuid = r.uuid
          WHERE
              q.question LIKE '%satirical%'
              AND a.judge_model IN (?, ?) -- Pre-filter for only the two judges in question
          GROUP BY
              q.uuid,
              q.question,
              q.theme,
              q.domain,
              r.uuid,
          HAVING
              -- Condition 1: Ensure both judges have actually assessed this response.
              -- The COUNT will be 2 if both judge models are present in the group.
              COUNT(DISTINCT a.judge) = 2
              AND
              -- Condition 2: Check for a mismatch in compliance.
              -- This compares the two pivoted columns directly.
              judge1_compliance IS DISTINCT FROM judge2_compliance
              AND
              -- Condition 3: Ensure at least one of the judges has a compliance status of 'COMPLETE'.
              (judge1_compliance = 'COMPLETE' OR judge2_compliance = 'COMPLETE')
          ORDER BY
              q.uuid;
      `;
    const params = [
      judge1, judge2,
      judge1, judge2
    ];
    const rows = await db.query<{ 
      q_uuid: string, 
      question: string, 
      theme: string, 
      domain: string, 
      r_uuid: string, 
      judge1_compliance: string,
      judge2_compliance: string
    }>(sql, ...params);

    const satiricalQuestions : Record<string, Record<string,SatireResponse>> = {};

    for (const row of rows) {
      if (!satiricalQuestions[row.domain]) {
        satiricalQuestions[row.domain] = {
          [row.q_uuid]: {
            question: row.question,
            theme: row.theme,
            domain: row.domain,
            responses: 1
          }
        };
      }
      else if (!satiricalQuestions[row.domain][row.q_uuid]) {
        satiricalQuestions[row.domain][row.q_uuid] = {
          question: row.question,
          theme: row.theme,
          domain: row.domain,
          responses: 1
        };
      }
      else {
        satiricalQuestions[row.domain][row.q_uuid].responses += 1;
      }
    }

    jsonResponse(res, 200, satiricalQuestions);
  } catch (error) {
    console.error('Failed to fetch satires:', error);
    jsonResponse(res, 500, { error: 'Failed to fetch satires' });
  }
}