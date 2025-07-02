import duckdb from 'duckdb';
import path from 'path';

const ROOT_DIR = process.cwd(); // cwd() = Current Working Directory
const dbPath = path.join(ROOT_DIR, 'database.duckdb');

const db = new duckdb.Database(dbPath, { "access_mode": "READ_ONLY" });
console.log(`DuckDB connected in READ_ONLY mode at ${dbPath}`);

function query<T>(sql: string, ...params: any[]): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, ...params, (err, res) => {
      if (err) return reject(err);
      resolve(res as T[]);
    });
  });
}
export default { query };