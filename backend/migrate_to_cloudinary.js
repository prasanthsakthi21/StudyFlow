require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const db = require('./db');
const fs = require('fs');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

async function migrateFiles() {
    console.log('Starting migration to Cloudinary...');

    try {
        // 1. Get all files from DB
        const [files] = await db.query('SELECT * FROM files');
        console.log(`Found ${files.length} total file records.`);

        let migratedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const file of files) {
            const currentUrl = file.file_url;

            // Check if already on Cloudinary
            if (currentUrl && currentUrl.includes('cloudinary.com')) {
                // console.log(`[SKIP] File ID ${file.id} is already on Cloudinary.`);
                skippedCount++;
                continue;
            }

            // Check if it's a URL (e.g. YouTube) but NOT Cloudinary
            if (currentUrl && currentUrl.startsWith('http')) {
                // This might be a YouTube link or other external link
                // console.log(`[SKIP] File ID ${file.id} is an external URL: ${currentUrl}`);
                skippedCount++;
                continue;
            }

            // Assume it's a local file path
            // Handle possibility of relative or absolute paths
            let localPath = currentUrl;

            // If it's just a filename or relative, try to find it in uploads
            if (!fs.existsSync(localPath)) {
                // Try resolving relative to __dirname/uploads if strictly filename
                const potentialPath = path.join(__dirname, 'uploads', path.basename(currentUrl));
                if (fs.existsSync(potentialPath)) {
                    localPath = potentialPath;
                } else {
                    console.warn(`[WARN] File ID ${file.id} not found locally at: ${currentUrl}`);
                    errorCount++;
                    continue;
                }
            }

            console.log(`[UPLOADING] File ID ${file.id}: ${localPath}`);

            try {
                const result = await cloudinary.uploader.upload(localPath, {
                    folder: 'studyflow_uploads',
                    resource_type: 'auto',
                    use_filename: true,
                    unique_filename: false
                });

                const newUrl = result.secure_url;

                // Update DB
                await db.query('UPDATE files SET file_url = ? WHERE id = ?', [newUrl, file.id]);
                console.log(`[SUCCESS] File ID ${file.id} migrated. New URL: ${newUrl}`);
                migratedCount++;

            } catch (uploadErr) {
                console.error(`[ERROR] Failed to upload File ID ${file.id}:`, uploadErr.message);
                errorCount++;
            }
        }

        console.log('------------------------------------------------');
        console.log(`Migration Complete.`);
        console.log(`Migrated: ${migratedCount}`);
        console.log(`Skipped (Already Cloud/Video): ${skippedCount}`);
        console.log(`Errors (File not found/Upload failed): ${errorCount}`);
        console.log('------------------------------------------------');

        process.exit(0);

    } catch (err) {
        console.error('Fatal Error during migration:', err);
        process.exit(1);
    }
}

migrateFiles();
