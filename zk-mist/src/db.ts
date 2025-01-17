import { Client } from "pg";
import * as dotenv from "dotenv";
dotenv.config();

export const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "5432", 10),
};

export interface Snapshot {
  id: number;
  priv_key: string;
  points: number;
  date: string;
  created_at: Date;
  updated_at: Date;
}

export async function getSnapshots(): Promise<Snapshot[]> {
  const client = new Client(dbConfig);
  try {
    // Connect to the database
    await client.connect();

    // Query to fetch data from the snapshot table
    const res = await client.query('SELECT * FROM "snapshot"');

    // Map the result to the Snapshot interface
    const snapshots: Snapshot[] = res.rows.map((row) => ({
      id: row.id,
      priv_key: row.priv_key,
      points: row.points,
      date: row.date,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return snapshots;
  } catch (err) {
    console.error("Error fetching snapshots", err);
    throw err;
  } finally {
    // Close the database connection
    await client.end();
  }
}
