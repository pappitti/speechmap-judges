import type { IncomingMessage, ServerResponse } from 'http';
import db from '../src/lib/db.js';
import type { Theme } from '../src/types.js';
import { jsonResponse } from './utils.js';

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  try {
    const sql = 'SELECT slug, name FROM themes ORDER BY name ASC';
    const themes = await db.query<Theme>(sql);
    jsonResponse(res, 200, themes);
  } catch (error) {
    console.error('Failed to fetch themes:', error);
    jsonResponse(res, 500, { error: 'Failed to fetch themes' });
  }
}