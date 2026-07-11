// db/index.ts
import * as SQLite from "expo-sqlite";
import { runMigrations } from "./migrations";

export const DB_NAME = "spendsnap.db";
export const db = SQLite.openDatabaseSync(DB_NAME);

export async function initDb() {
  await db.execAsync("PRAGMA foreign_keys = ON");
  await db.execAsync("PRAGMA journal_mode = WAL");

  await runMigrations(db);
}

export async function exec(sql: string, params: any[] = []) {
  try {
    return await db.runAsync(sql, params);
  } catch (err) {
    console.error("SQL Exec Error:", sql, params, err);
    throw err;
  }
}

export async function queryAll<T>(sql: string, params: any[] = []): Promise<T[]> {
  try {
    return await db.getAllAsync<T>(sql, params);
  } catch (err) {
    console.error("SQL Query Error:", sql, params, err);
    throw err;
  }
}