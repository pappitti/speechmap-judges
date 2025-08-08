import { useContext } from 'react';
import { DuckDBContext } from '../context/db-context';

export const useDuckDB = () => {
  const context = useContext(DuckDBContext);
  if (context === undefined) {
    throw new Error('useDuckDB must be used within a DuckDBProvider');
  }
  return context;
};