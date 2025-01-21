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
  public_key: string; // For testing purposes
  priv_key: string;
  points: number;
  date: string;
  created_at: Date;
  updated_at: Date;
}

function getSnapshotsTest(): Snapshot[] {
  return [
    {
      id: 1,
      public_key: "GMPWaPPrCeZPse5kwSR3WUrqYAPrVZBSVwymqh7auNW7",
      priv_key: "4",
      points: 100000,
      date: "",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 2,
      priv_key: "4",
      points: 100000,
      date: "",
      created_at: new Date(),
      updated_at: new Date(),
      public_key: "GySGrTgPtPfMtYoYTmwUdUDFwVJbFMfip7QZdhgXp8dy",
    },
    {
      id: 3,
      priv_key: "4",
      points: 100000,
      date: "",
      created_at: new Date(),
      updated_at: new Date(),
      public_key: "Bk1r2vcgX2uTzwV3AUyfRbSfGKktoQrQufBSrHzere74",
    },
    {
      id: 4,
      priv_key: "4",
      points: 100000,
      date: "",
      created_at: new Date(),
      updated_at: new Date(),
      public_key: "8BvkadZ6ycFNmQF7S1MHRvEVNb1wvDBFdjkAUnxjK9Ug",
    },
    {
      id: 5,
      priv_key: "4",
      points: 100000,
      date: "",
      created_at: new Date(),
      updated_at: new Date(),
      public_key: "EmxcvFKXsWLzUho8AhV9LCKeKRFHg5gAs4sKNJwhe5PF",
    },
    {
      id: 6,
      priv_key: "4",
      points: 100000,
      date: "",
      created_at: new Date(),
      updated_at: new Date(),
      public_key: "6mqdHkSpcvNexmECjp5XLt9V9KnSQre9TvbMLGr6sEPM",
    },
    {
      id: 7,
      priv_key: "4",
      points: 100000,
      date: "",
      created_at: new Date(),
      updated_at: new Date(),
      public_key: "3k4MViTWXBjFvoUZiJcNGPvzrqnTa41gcrbWCMMnV6ys",
    },
    {
      id: 8,
      priv_key: "4",
      points: 100000,
      date: "",
      created_at: new Date(),
      updated_at: new Date(),
      public_key: "2k6BfYRUZQHquPtpkyJpUx3DzM7W3K6H95igtJk8ztpd",
    },
    {
      id: 9,
      priv_key: "4",
      points: 100000,
      date: "",
      created_at: new Date(),
      updated_at: new Date(),
      public_key: "89jPyNNLCcqWn1RZThSS4jSqU5VCJkR5mAaSaVzuuqH4",
    },
  ];
}

export async function getSnapshots(
  date: string,
  isTest: boolean = false
): Promise<Snapshot[]> {
  if (isTest) {
    return getSnapshotsTest();
  }
  const client = new Client(dbConfig);
  try {
    // Connect to the database
    await client.connect();

    // Define the query
    const query = "SELECT * FROM snapshot WHERE date = $1";

    // Execute the query
    const res = await client.query(query, [date]);

    // Map the result to the Snapshot interface
    const snapshots: Snapshot[] = res.rows.map((row) => ({
      id: row.id,
      priv_key: row.priv_key,
      points: row.points,
      date: row.date,
      created_at: row.created_at,
      updated_at: row.updated_at,
      public_key: "",
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
