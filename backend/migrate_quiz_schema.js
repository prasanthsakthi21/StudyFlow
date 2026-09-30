const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function migrateQuizSchema() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'studyflow_db',
        multipleStatements: true
    });

    try {
        console.log('Applying Quiz Schema V4...');
        const schemaSql = fs.readFileSync(path.join(__dirname, 'quiz_schema_v4.sql'), 'utf8');
        await connection.query(schemaSql);
        console.log('✅ Quiz Schema Applied Successfully');
    } catch (error) {
        console.error('❌ Migration Failed:', error);
    } finally {
        await connection.end();
    }
}

migrateQuizSchema();
