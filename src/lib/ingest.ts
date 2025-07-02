import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'; 
import duckdb from 'duckdb';


const ROOT_DIR = process.cwd(); // cwd() = Current Working Directory
const DB_PATH = path.join(ROOT_DIR, 'database.duckdb');

export const DATA_SOURCES = {
  questions: 'https://huggingface.co/datasets/PITTI/speechmap-questions/resolve/main/consolidated_questions.parquet',
  responses: 'https://huggingface.co/datasets/PITTI/speechmap-responses/resolve/main/consolidated_responses.parquet',
  assessments: 'https://huggingface.co/datasets/PITTI/speechmap-assessments/resolve/main/consolidated_assessments.parquet',
};


function query(db: duckdb.Database, sql: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
}


async function rebuildDatabase() {
  console.log('--- Starting full database rebuild with DuckDB ---');

  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log('Deleted old database file.');
  }

  const db = new duckdb.Database(DB_PATH);
  console.log('DuckDB database created at:', DB_PATH);

  try {
    console.log('Installing and loading DuckDB extensions (httpfs, json)...');
    await query(db, 'INSTALL httpfs; LOAD httpfs;');
    await query(db, 'INSTALL json; LOAD json;');

    console.log('Creating database schema...');
    await query(db, `
        CREATE TABLE themes (slug VARCHAR PRIMARY KEY, name VARCHAR);
        CREATE TABLE questions (uuid VARCHAR PRIMARY KEY, id VARCHAR, category VARCHAR, domain VARCHAR, question VARCHAR, theme VARCHAR);
        CREATE TABLE responses (uuid VARCHAR PRIMARY KEY, q_uuid VARCHAR, model VARCHAR, timestamp VARCHAR, api_provider VARCHAR, provider VARCHAR, content VARCHAR, matched BOOLEAN, origin VARCHAR);
        CREATE TABLE assessments (uuid VARCHAR PRIMARY KEY, q_uuid VARCHAR, r_uuid VARCHAR, judge_model VARCHAR, judge_analysis VARCHAR, compliance VARCHAR, raw_judge_analysis VARCHAR, matched BOOLEAN, origin VARCHAR);
    `);
    console.log('Schema created.');

    console.log('Creating indexes for faster queries...');
    await query(db, `CREATE INDEX idx_assessments_r_uuid ON assessments (r_uuid);`);
    await query(db, `CREATE INDEX idx_assessments_judge_compliance ON assessments (judge_model, compliance);`);
    await query(db, `CREATE INDEX idx_responses_q_uuid ON responses (q_uuid);`);
    await query(db, `CREATE INDEX idx_questions_theme ON questions (theme);`);
    console.log('Indexes created.');

    console.log('Ingesting themes and questions...');
    await query(db, `
        INSERT INTO themes (slug, name)
        SELECT DISTINCT theme AS slug, domain AS name FROM read_parquet('${DATA_SOURCES.questions}') WHERE theme IS NOT NULL AND domain IS NOT NULL;
        
        INSERT INTO questions (uuid, id, category, domain, question, theme)
        SELECT uuid, id, category, domain, question, theme FROM read_parquet('${DATA_SOURCES.questions}');
    `);
    
    console.log('Ingesting responses from Parquet...');
    await query(db, `
        INSERT INTO responses (uuid, q_uuid, model, timestamp, api_provider, provider, content, matched, origin)
        SELECT uuid, q_uuid, model, timestamp, api_provider, provider, content, matched, origin FROM read_parquet('${DATA_SOURCES.responses}');
    `);

    console.log('Ingesting assessments...');
    await query(db, `
        INSERT INTO assessments (uuid, q_uuid, r_uuid, judge_model, judge_analysis, compliance, raw_judge_analysis, matched, origin)
        SELECT uuid, q_uuid, r_uuid, judge_model, judge_analysis, compliance, raw_judge_analysis, matched, origin FROM read_parquet('${DATA_SOURCES.assessments}');
    `);

    console.log('✅ Data ingestion complete!');
  } catch (error) {
    console.error('An error occurred during the rebuild:', error);
    db.close();
    throw error;
  }
  
  db.close();
  console.log('--- Database rebuild finished successfully ---');
}


// --- ESM-compatible way to check if the script is run directly ---
const entryPoint = process.argv[1];
const currentFile = fileURLToPath(import.meta.url);

if (entryPoint === currentFile) {
  rebuildDatabase().catch(err => {
    console.error('Database rebuild failed:', err);
    process.exit(1);
  });
}