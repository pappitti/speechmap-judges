// src/context/DuckDBContext.tsx
import React, { useState, useEffect, useCallback, type ReactNode } from 'react';
import * as duckdb from '@duckdb/duckdb-wasm';
import { DuckDBContext, type DuckDBContextType } from './db-context'; 
import { getDB, repairAndReload } from '../db';

export const DuckDBProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<duckdb.AsyncDuckDB | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const init = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dbInstance = await getDB();
      setDb(dbInstance);
    } catch (e) {
      console.error("Failed to initialize database:", e);
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // React StrictMode will run this twice. The singleton `dbPromise` handles this.
    // If init() fails, it sets the error state and stops. No loop.
    init();
  }, [init]);

  const repairDatabase = useCallback(async () => {
    setLoading(true); // Show a loading state
    await repairAndReload();
    // The page will reload, so no need to set state here.
  }, []);

  return (
    <DuckDBContext.Provider value={{ db, loading, error, repairDatabase }}>
      {children}
    </DuckDBContext.Provider>
  );
};