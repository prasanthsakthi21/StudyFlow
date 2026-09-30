const mysql = require('mysql2/promise');

async function init() {
    console.log('Connecting to MySQL...');
    let connection; // Declare connection outside try block for finally
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '' // Default XAMPP password
        });

        console.log('Connected. Creating database if not exists...');
        await connection.query('CREATE DATABASE IF NOT EXISTS studyflow_db');
        console.log('Database `studyflow_db` ensured.');

        await connection.query('USE studyflow_db');
        console.log('Using database `studyflow_db`.');

        // Create Users Table
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users(
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin', 'teacher') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
    `;

        // Create Files Table
        const createFilesTable = `
            CREATE TABLE IF NOT EXISTS files(
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        file_type ENUM('pdf', 'ppt', 'doc', 'video_url') NOT NULL,
        file_url VARCHAR(512) NOT NULL,
        original_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    `;

        // Create Micro-Lessons Table
        const createMicroLessonsTable = `
            CREATE TABLE IF NOT EXISTS micro_lessons(
        id INT AUTO_INCREMENT PRIMARY KEY,
        file_id INT,
        lesson_order INT,
        title VARCHAR(255),
        content_points TEXT,
                duration_seconds INT DEFAULT 60,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(file_id) REFERENCES files(id) ON DELETE CASCADE
    )
    `;

        await connection.query(createUsersTable);
        console.log('✅ Verified/Created "users" table');

        // Ensure Default User
        const [users] = await connection.query('SELECT * FROM users WHERE id = 1');
        if (users.length === 0) {
            await connection.query(`INSERT INTO users (id, full_name, email, password_hash, role) VALUES (1, 'Demo Student', 'demo@studyflow.com', 'demo123', 'student')`);
            console.log('✅ Created Default User (ID: 1) for Demo');
        }

        await connection.query(createFilesTable);
        console.log('✅ Verified/Created "files" table');

        await connection.query(createMicroLessonsTable);
        console.log('✅ Verified/Created "micro_lessons" table');

        console.log('🎉 Database initialization complete!');

    } catch (err) {
        console.error('❌ Database initialization failed:', err);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Connection closed.');
        }
        process.exit(0); // Exit successfully after closing connection
    }
}

init();
