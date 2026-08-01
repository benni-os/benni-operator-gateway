import Database from 'better-sqlite3';
import { getEnv } from '../config/env.js';
import { logger } from './logger.js';

const env = getEnv();

export let db = new Database(env.DB_PATH === ':memory:' ? ':memory:' : env.DB_PATH);
db.pragma('journal_mode = WAL');

export function initializeDatabase() {
  logger.info(`Initializing SQLite database at ${env.DB_PATH}`);
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      riskLevel TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      input TEXT NOT NULL,
      result TEXT,
      auditEvents TEXT NOT NULL
    )
  `);
}

initializeDatabase();

export function closeDatabaseForTesting() { db.close(); }

export function recreateDatabaseForTesting() {
  const env = getEnv();
  db = new Database(env.DB_PATH === ':memory:' ? ':memory:' : env.DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      riskLevel TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      input TEXT NOT NULL,
      result TEXT,
      auditEvents TEXT NOT NULL
    )
  `);
}
