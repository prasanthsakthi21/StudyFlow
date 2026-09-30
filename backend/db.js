const mysql = require('mysql2');

require('dotenv').config();

// REPLACE WITH YOUR ACTUAL CREDENTIALS
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',      // default XAMPP/WAMP user
  password: process.env.DB_PASSWORD || '',  // default XAMPP/WAMP password (empty)
  database: process.env.DB_NAME || 'studyflow_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000 // 10 seconds timeout
});

module.exports = pool.promise();
