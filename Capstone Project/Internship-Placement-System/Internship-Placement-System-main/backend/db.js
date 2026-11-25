import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const tidbHost = process.env.TIDB_HOST;

const pool = mysql.createPool({
  host: process.env.DB_HOST || process.env.TIDB_HOST || "localhost",
  port: Number(process.env.DB_PORT || process.env.TIDB_PORT || 3306),
  user: process.env.DB_USER || process.env.TIDB_USER || "root",
  password: process.env.DB_PASSWORD || process.env.TIDB_PASSWORD || "",
  database: process.env.DB_NAME || process.env.TIDB_DATABASE || "internship_placement_db",
  ssl: process.env.DB_SSL === "true" || tidbHost
    ? { rejectUnauthorized: true }
    : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
