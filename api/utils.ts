import type { ServerResponse } from 'http';

export function jsonResponse(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export const ALLOWED_CLASSIFICATIONS = new Set(['compliance', 'pitti_compliance']);
