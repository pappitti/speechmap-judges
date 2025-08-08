import * as duckdb from '@duckdb/duckdb-wasm';
import type { Theme, TransitionMatrix, AssessmentItem} from '../types';


// --- API Functions ---
export async function getThemes(db: duckdb.AsyncDuckDB): Promise<Theme[]> {
  const conn = await db.connect();
  try {
    const result = await conn.query(`SELECT slug, name FROM themes ORDER BY name ASC;`);
    return result.toArray().map(row => row.toJSON() as Theme);
  } finally {
    await conn.close();
  }
}

export async function getJudges(db: duckdb.AsyncDuckDB): Promise<string[]> {
    const conn = await db.connect();
    try {
        const result = await conn.query(`
            SELECT DISTINCT judge_model 
            FROM assessments 
            ORDER BY judge_model DESC
        `);
        return result.toArray().map(row => row.toJSON().judge_model as string);
    } finally {
        await conn.close();
    }
}


export async function getReclassificationData(
  db: duckdb.AsyncDuckDB,
  params: { judge1: string; judge2: string; theme: string | null }
): Promise<TransitionMatrix> {
  const sql = `
      SELECT 
          a1.compliance AS judge1_compliance, 
          a2.compliance AS judge2_compliance, 
          COUNT(*) as count
      FROM assessments a1
      JOIN assessments a2 ON a1.r_uuid = a2.r_uuid
      JOIN responses r ON a1.r_uuid = r.uuid
      JOIN questions q ON r.q_uuid = q.uuid
      WHERE
        a1.judge_model = ? AND a2.judge_model = ? AND (? IS NULL OR q.theme = ?)
      GROUP BY a1.compliance, a2.compliance;`;
  
  const conn = await db.connect();
  let ps: duckdb.AsyncPreparedStatement | null = null;
  try {
    ps = await conn.prepare(sql);
    const result = await ps.query(params.judge1, params.judge2, params.theme, params.theme);
    const rows = result.toArray().map(row => row.toJSON());

    // Build the transition matrix from the query result
    const transitionMatrix: TransitionMatrix = {};
    for (const row of rows) {
      if (!transitionMatrix[row.judge1_compliance]) {
        transitionMatrix[row.judge1_compliance] = {};
      }
      transitionMatrix[row.judge1_compliance][row.judge2_compliance] = Number(row.count);
    }
    return transitionMatrix;

  } finally {
    if (ps) await ps.close();
    await conn.close();
  }
}

export async function getAssessmentItems(
  db: duckdb.AsyncDuckDB,
  params: { judge1: string; fromCategory: string; judge2: string; toCategory: string; theme: string | null }
): Promise<AssessmentItem[]> {
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
            a.judge_model IN (?, ?)
        ORDER BY r.uuid;
    `;

    const queryParams = [
        params.judge1, params.judge2,  
        params.theme, params.theme,
        params.judge1, params.fromCategory, 
        params.judge2, params.toCategory,
        params.judge1, params.judge2
    ];
    
    const conn = await db.connect();
    let ps: duckdb.AsyncPreparedStatement | null = null;
    try {
        ps = await conn.prepare(sql);
        const result = await ps.query(...queryParams);
        const rows = result.toArray().map(row => row.toJSON());

        // Group results by response, as the original API did.
        const resultsByResponse = new Map<string, AssessmentItem>();
        for (const row of rows) {
            if (!resultsByResponse.has(row.r_uuid)) {
                resultsByResponse.set(row.r_uuid, {
                    question: row.question,
                    theme: row.question_theme,
                    domain: row.question_domain,
                    model: row.response_model,
                    r_uuid: row.r_uuid,
                    response: row.response_content,
                    assessments: {},
                });
            }
            resultsByResponse.get(row.r_uuid)!.assessments[row.judge_model] = {
                compliance: row.compliance,
                judge_analysis: row.judge_analysis,
            };
        }
        return Array.from(resultsByResponse.values());

    } finally {
        if (ps) await ps.close();
        await conn.close();
    }
}