import type { IncomingMessage, ServerResponse } from 'http';
import db from '../src/lib/db.js';
import { jsonResponse, ALLOWED_CLASSIFICATIONS } from './utils.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const judge1 = url.searchParams.get('judge1');
    const judge1Classification = url.searchParams.get('judge1Classification');
    const j1_compliance = url.searchParams.get('fromCategory');
    const judge2 = url.searchParams.get('judge2');
    const judge2Classification = url.searchParams.get('judge2Classification');
    const j2_compliance = url.searchParams.get('toCategory');
    const theme = url.searchParams.get('theme') || null;
    const model = url.searchParams.get('model') || null;

    if (!judge1 || !j1_compliance || !judge2 || !j2_compliance || !judge1Classification || !judge2Classification) {
        return jsonResponse(res, 400, { error: 'judge1, j1_compliance, judge2, and j2_compliance are required.' });
    }

    if (!ALLOWED_CLASSIFICATIONS.has(judge1Classification) || !ALLOWED_CLASSIFICATIONS.has(judge2Classification)) {
        return jsonResponse(res, 400, { error: 'Invalid classification provided.' });
      }
    
    try {
        const sql = `
            SELECT
                r.uuid AS r_uuid,
                q.question,
                r.q_uuid AS q_uuid,
                q.theme AS question_theme,
                q.domain AS question_domain,
                r.model AS response_model,
                r.content AS response_content,

                a1.judge AS judge1_name,
                a1.${judge1Classification} AS judge1_classification_value,
                a1.judge_analysis AS judge1_analysis,

                a2.judge AS judge2_name,
                a2.${judge2Classification} AS judge2_classification_value,
                a2.judge_analysis AS judge2_analysis
            FROM assessments a1
            
            -- Join assessments for the second judge on the same response
            JOIN assessments a2 ON a1.r_uuid = a2.r_uuid
            
            -- Join to get response and question details
            JOIN responses r ON a1.r_uuid = r.uuid
            JOIN questions q ON r.q_uuid = q.uuid

            
            WHERE
                -- Filter for the first judge's specific assessment
                a1.judge = ? AND a1.${judge1Classification} = ?
                
                -- Filter for the second judge's specific assessment
                AND a2.judge = ? AND a2.${judge2Classification} = ?
                
                -- Optional theme filter and model filter
                AND (? IS NULL OR q.theme = ?) AND (? IS NULL OR r.model = ?)

                -- Exclude pitti/pap assessments
                AND r.uuid NOT IN (
                    SELECT r_uuid FROM assessments WHERE judge = 'pitti/pap'
                );
        `;

        const params = [
            judge1, j1_compliance,
            judge2, j2_compliance,
            theme, theme,
            model, model
        ];

        const rows = await db.query<any>(sql, ...params);

        // The grouping logic is identical
        const resultsByResponse = new Map<string, any>();
        for (const row of rows) {
            if (!resultsByResponse.has(row.r_uuid)) {
                resultsByResponse.set(row.r_uuid, [
                    row.r_uuid,
                    row.judge1_classification_value,
                    row.judge1_analysis,
                    row.q_uuid,
                    row.judge1_classification_value,
                ]);
            }
        }
        jsonResponse(res, 200, Array.from(resultsByResponse.values()));
    } catch (error) {
        console.error('Failed to fetch details:', error);
        jsonResponse(res, 500, { error: 'Failed to fetch details' });
    }
}