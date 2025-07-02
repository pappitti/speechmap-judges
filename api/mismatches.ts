import type { IncomingMessage, ServerResponse } from 'http';
import db from '../src/lib/db.js';
import { jsonResponse } from './utils.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const judge1 = url.searchParams.get('judge1');
    const j1_compliance = url.searchParams.get('fromCategory');
    const judge2 = url.searchParams.get('judge2');
    const j2_compliance = url.searchParams.get('toCategory');
    const theme = url.searchParams.get('theme') || null;

    if (!judge1 || !j1_compliance || !judge2 || !j2_compliance) {
        return jsonResponse(res, 400, { error: 'judge1, j1_compliance, judge2, and j2_compliance are required.' });
    }

    try {
        const sql = `
            WITH MismatchedResponses AS (
                SELECT a.r_uuid
                FROM assessments a
                JOIN responses r ON a.r_uuid = r.uuid
                JOIN questions q ON r.q_uuid = q.uuid
                WHERE 
                    a.judge_model IN (?, ?) AND
                    (? IS NULL OR q.theme = ?)
                GROUP BY a.r_uuid
                HAVING
                    SUM(CASE WHEN a.judge_model = ? AND a.compliance = ? THEN 1 ELSE 0 END) > 0
                    AND
                    SUM(CASE WHEN a.judge_model = ? AND a.compliance = ? THEN 1 ELSE 0 END) > 0
            )
            SELECT
                r.uuid as r_uuid,
                q.question,
                q.theme as question_theme,
                q.domain as question_domain,
                r.model as response_model,
                r.content as response_content,
                a.judge_model,
                a.compliance,
                a.judge_analysis
            FROM MismatchedResponses mr
            JOIN responses r ON mr.r_uuid = r.uuid
            JOIN questions q ON r.q_uuid = q.uuid
            JOIN assessments a ON mr.r_uuid = a.r_uuid
            WHERE
                a.judge_model IN (?, ?) -- Only get assessments from the two judges in question
            ORDER BY r.uuid;
        `;
        const params = [
            judge1, judge2,  
            theme, theme,
            judge1, j1_compliance, 
            judge2, j2_compliance,
            judge1, judge2
        ];
        const rows = await db.query<any>(sql, ...params);

        // The grouping logic is identical
        const resultsByResponse = new Map<string, any>();
        for (const row of rows) {
            if (!resultsByResponse.has(row.r_uuid)) {
                resultsByResponse.set(row.r_uuid, {
                    question: row.question,
                    theme: row.question_theme,
                    domain: row.question_domain,
                    model: row.response_model,
                    response: row.response_content,
                    assessments: {},
                });
            }
            resultsByResponse.get(row.r_uuid).assessments[row.judge_model] = {
                compliance: row.compliance,
                judge_analysis: row.judge_analysis,
            };
        }
        jsonResponse(res, 200, Array.from(resultsByResponse.values()));
    } catch (error) {
        console.error('Failed to fetch details:', error);
        jsonResponse(res, 500, { error: 'Failed to fetch details' });
    }
}