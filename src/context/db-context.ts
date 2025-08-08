// src/context/db-context.ts
import { createContext } from 'react';
import type * as duckdb from '@duckdb/duckdb-wasm';

export interface DuckDBContextType {
  db: duckdb.AsyncDuckDB | null;
  loading: boolean;
  error: Error | null;
  repairDatabase: () => Promise<void>;
}

export const DuckDBContext = createContext<DuckDBContextType>({
  db: null,
  loading: true,
  error: null,
  repairDatabase: async () => {},
});