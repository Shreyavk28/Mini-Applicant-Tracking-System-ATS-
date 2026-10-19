
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

const caPath = path.join(__dirname, "../../certs/ca.pem");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "defaultdb",

  ssl:
    process.env.DB_SSL === "true"
      ? {
          ca: fs.readFileSync(caPath, "utf8"),
          rejectUnauthorized: true,
        }
      : undefined,

  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

async function testConnection() {
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.query(
      "SELECT DATABASE() AS database_name"
    );

    console.log(
      `MySQL connected to database: ${rows[0].database_name}`
    );
  } finally {
    connection.release();
  }
}

module.exports = { pool, testConnection };
