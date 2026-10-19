
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "hireflow_ats",
  waitForConnections: true,
  connectionLimit: 10,
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
