import type { IncomingMessage, ServerResponse } from 'http';
import db from '../src/lib/db.js';
import type { Model } from '../src/types.js';
import { jsonResponse } from './utils.js';

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  try {
    const sql = 'SELECT DISTINCT model FROM responses ORDER BY model ASC';
    const models = await db.query<Model>(sql);
    jsonResponse(res, 200, models);
  } catch (error) {
    console.error('Failed to fetch models:', error);
    jsonResponse(res, 500, { error: 'Failed to fetch models' });
  }
}