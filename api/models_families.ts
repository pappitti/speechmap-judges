import type { IncomingMessage, ServerResponse } from 'http';
import db from '../src/lib/db.js';
import type { ModelFamily } from '../src/types.js';
import { jsonResponse } from './utils.js';


export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  try {
    const sql = 'SELECT DISTINCT family FROM models ORDER BY family ASC';
    const modelFamilies = await db.query<ModelFamily>(sql);
    jsonResponse(res, 200, modelFamilies);
  } catch (error) {
    console.error('Failed to fetch model families:', error);
    jsonResponse(res, 500, { error: 'Failed to fetch model families' });
  }
}