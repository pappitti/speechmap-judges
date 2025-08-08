// src/db/builder.ts
import * as duckdb from '@duckdb/duckdb-wasm'

// This part is perfectly reusable!
export const DATA_SOURCES = {
  questions: 'https://huggingface.co/datasets/PITTI/speechmap-questions/resolve/main/consolidated_questions.parquet',
  responses: 'https://huggingface.co/datasets/PITTI/speechmap-responses/resolve/main/consolidated_responses.parquet',
  assessments: 'https://huggingface.co/datasets/PITTI/speechmap-assessments/resolve/main/consolidated_assessments.parquet',
};

/* Rebuilds the entire database from remote parquet files.*/
export async function buildDatabase(db: duckdb.AsyncDuckDB, c: duckdb.AsyncDuckDBConnection) {
  console.log('--- Starting full database rebuild with duckdb-wasm ---');

  try {

    console.log('Creating database schema...');
    await c.query(`
        CREATE OR REPLACE TABLE themes (slug VARCHAR PRIMARY KEY, name VARCHAR);
        CREATE OR REPLACE TABLE questions (uuid VARCHAR PRIMARY KEY, id VARCHAR, category VARCHAR, domain VARCHAR, question VARCHAR, theme VARCHAR);
        CREATE OR REPLACE TABLE responses (uuid VARCHAR PRIMARY KEY, q_uuid VARCHAR, model VARCHAR, timestamp VARCHAR, api_provider VARCHAR, provider VARCHAR, content VARCHAR, matched BOOLEAN, origin VARCHAR);
        CREATE OR REPLACE TABLE assessments (uuid VARCHAR PRIMARY KEY, q_uuid VARCHAR, r_uuid VARCHAR, judge_model VARCHAR, judge_analysis VARCHAR, compliance VARCHAR, raw_judge_analysis VARCHAR, matched BOOLEAN, origin VARCHAR);
    `);
    console.log('Schema created.');

    console.log('Creating indexes...');
    await c.query(`
        CREATE INDEX idx_assessments_r_uuid ON assessments (r_uuid);
        CREATE INDEX idx_assessments_judge_compliance ON assessments (judge_model, compliance);
        CREATE INDEX idx_responses_q_uuid ON responses (q_uuid);
        CREATE INDEX idx_questions_theme ON questions (theme);
    `);
    console.log('Indexes created.');

    // --- Data Ingestion: The New Pattern ---

    console.log('Fetching parquet files...');
    const [questionsBuffer, responsesBuffer, assessmentsBuffer] = await Promise.all([
      fetch(DATA_SOURCES.questions).then(res => res.arrayBuffer()),
      fetch(DATA_SOURCES.responses).then(res => res.arrayBuffer()),
      fetch(DATA_SOURCES.assessments).then(res => res.arrayBuffer()),
    ]);
    console.log('All files downloaded.');

    await Promise.all([
        db.registerFileBuffer('questions.parquet', new Uint8Array(questionsBuffer)),
        db.registerFileBuffer('responses.parquet', new Uint8Array(responsesBuffer)),
        db.registerFileBuffer('assessments.parquet', new Uint8Array(assessmentsBuffer)),
    ]);
    console.log('Files registered with DuckDB.');

    console.log('Ingesting themes and questions...');
    await c.query(`
        INSERT INTO themes (slug, name)
        SELECT DISTINCT theme AS slug, domain AS name FROM read_parquet('questions.parquet') WHERE theme IS NOT NULL AND domain IS NOT NULL;
        
        INSERT INTO questions (uuid, id, category, domain, question, theme)
        SELECT uuid, id, category, domain, question, theme FROM read_parquet('questions.parquet');
    `);

    console.log('Ingesting responses...');
    await c.query(`
        INSERT INTO responses (uuid, q_uuid, model, timestamp, api_provider, provider, content, matched, origin)
        SELECT uuid, q_uuid, model, timestamp, api_provider, provider, content, matched, origin FROM read_parquet('responses.parquet');
    `);

    console.log('Ingesting assessments...');
    await c.query(`
        INSERT INTO assessments (uuid, q_uuid, r_uuid, judge_model, judge_analysis, compliance, raw_judge_analysis, matched, origin)
        SELECT uuid, q_uuid, r_uuid, judge_model, judge_analysis, compliance, raw_judge_analysis, matched, origin FROM read_parquet('assessments.parquet');
    `);

    console.log('✅ Data ingestion complete!');

  } catch (error) {
    console.error('An error occurred during the database rebuild:', error);
    throw error; // Re-throw to be caught by the UI
  } finally {
    console.log('--- Database rebuild finished ---');
  }
}