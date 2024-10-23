// server/db.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

console.log('Database configuration:', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const pool = mysql.createPool({
  host: process.env.DB_HOST,      // e.g., 'localhost' or your AWS RDS endpoint
  user: process.env.DB_USER,      // e.g., 'admin'
  password: process.env.DB_PASSWORD, // e.g., 'yourpassword'
  database: process.env.DB_NAME,  // e.g., 'yourdatabase'
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true, // Add this line
});

export default pool;


// server/db.js
/*import mysql from 'mysql2/promise';

const pool = mysql.createPool({

  host: process.env.DB_HOST, // Ensure these environment variables are set
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export default pool;*/
