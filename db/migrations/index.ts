import * as SQLite from "expo-sqlite";
import { initialSchema } from "../schema";

export async function runMigrations(db: SQLite.SQLiteDatabase) {
    const result = await db.getFirstAsync<{ user_version: number }>(
        "PRAGMA user_version"
    );

    const currentDbVersion = result?.user_version || 0;

    if (currentDbVersion === 0) {
        console.log("Running initial database migration...");

        await db.execAsync(initialSchema);

        await db.execAsync("PRAGMA user_version = 1");

        console.log("Database migrated to v1");
    }
}