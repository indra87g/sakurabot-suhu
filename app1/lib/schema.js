
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const dbPath = path.join(__dirname, '..', 'data.db')

export async function initializeDatabase() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  })

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      jid TEXT PRIMARY KEY,
      lid TEXT,
      name TEXT,
      limit_ INTEGER DEFAULT 15,
      money REAL DEFAULT 0,
      premium BOOLEAN DEFAULT FALSE,
      expired INTEGER DEFAULT 0,
      banned BOOLEAN DEFAULT FALSE,
      ban_times INTEGER DEFAULT 0,
      lastseen INTEGER,
      usebot INTEGER,
      hit INTEGER DEFAULT 0,
      spam INTEGER DEFAULT 0,
      afk INTEGER DEFAULT -1,
      afkReason TEXT,
      afkObj TEXT
    );

    CREATE TABLE IF NOT EXISTS groups (
      jid TEXT PRIMARY KEY,
      activity INTEGER,
      mute BOOLEAN DEFAULT FALSE,
      localonly BOOLEAN DEFAULT FALSE,
      member TEXT
    );

    CREATE TABLE IF NOT EXISTS chats (
      jid TEXT PRIMARY KEY,
      chat INTEGER DEFAULT 0,
      lastchat INTEGER,
      lastseen INTEGER
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY DEFAULT 'default',
      autobackup BOOLEAN DEFAULT FALSE,
      online BOOLEAN DEFAULT TRUE,
      multiprefix BOOLEAN DEFAULT TRUE,
      noprefix BOOLEAN DEFAULT FALSE,
      onlyprefix TEXT DEFAULT '.',
      prefix TEXT DEFAULT '.',
      owners TEXT,
      pluginDisable TEXT,
      error TEXT,
      paidc TEXT,
      toxic TEXT,
      antispam BOOLEAN DEFAULT TRUE,
      debug BOOLEAN DEFAULT FALSE,
      groupmode BOOLEAN DEFAULT FALSE,
      self BOOLEAN DEFAULT FALSE,
      link TEXT,
      lastReset INTEGER
    );
  `)

  return db
}
