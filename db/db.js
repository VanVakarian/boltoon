import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

export const getConnection = async () => {
  return open({
    filename: 'boltoon.db',
    driver: sqlite3.Database,
  });
};
