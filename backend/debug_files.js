const db = require('./db');

async function checkFiles() {
    try {
        const [files] = await db.query('SELECT id, user_id, original_name, created_at FROM files ORDER BY created_at DESC LIMIT 10');
        console.log('Recent Files:', files);

        const [users] = await db.query('SELECT id, email, full_name FROM users');
        console.log('Users:', users);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkFiles();
