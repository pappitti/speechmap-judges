import type { IncomingMessage, ServerResponse } from 'http';
import db from '../src/lib/db.js';
import type { Provider } from '../src/types.js';
import { jsonResponse } from './utils.js';

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  try {
    const sql = 'SELECT DISTINCT provider FROM responses ORDER BY provider ASC';
    const providers = await db.query<Provider>(sql);
    jsonResponse(res, 200, providers);
  } catch (error) {
    console.error('Failed to fetch providers:', error);
    jsonResponse(res, 500, { error: 'Failed to fetch providers' });
  }
}