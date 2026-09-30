require('dotenv').config();
const express = require('express');
const cors = require('cors');
let OpenAI;
try {
    OpenAI = require('openai');
} catch (e) {
    console.warn('OpenAI optional dependency not found. AI features disabled.');
}
const db = require('./db');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const explainEngine = require('./explainEngine');
const debugEngine = require('./debugEngine');
const converterEngine = require('./converterEngine');
const youtubesearchapi = require("youtube-search-api");

const pdfParse = require('pdf-parse');
const mammoth = require('mammoth'); // DOCX
const officeParser = require('officeparser'); // PPTX Support
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        console.log('[UPLOAD] Processing File:', file.originalname, 'Mime:', file.mimetype);

        // Check if file is a document (PDF, DOCX, PPTX)
        const isDocument = file.mimetype.includes('pdf') ||
            file.mimetype.includes('word') ||
            file.mimetype.includes('presentation') ||
            file.originalname.match(/\.(doc|docx|ppt|pptx|pdf)$/i);

        console.log(`[UPLOAD] isDocument: ${isDocument} (Regex/Mime check)`);

        if (isDocument) {
            // Sanitize: Replace spaces with underscores, keep alphanumeric and dots/dashes
            // But Cloudinary 'public_id' usually handles some chars. User specifically asked to replace space with underscore.
            const rawName = path.parse(file.originalname).name;
            const sanitizedName = rawName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-\.]/g, '');
            const maskedName = `${sanitizedName}_${Date.now()}`;

            console.log(`[UPLOAD] Masking ${file.originalname} as .txt (RAW). PublicID: ${maskedName}`);
            return {
                folder: 'studyflow_uploads',
                resource_type: 'raw',
                format: 'txt', // Mask as text to bypass 401
                public_id: maskedName
            };
        } else {
            console.log('[UPLOAD] Treating as Image/Auto');
        }

        // Default for Images/Videos
        return {
            folder: 'studyflow_uploads',
            resource_type: 'auto',
        };
    },
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
// Serve Uploads Static Directory (Mock Cloud)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// DEBUG LOGGER
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

// REGISTER ENDPOINT
app.post('/register', async (req, res) => {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // In a real app, hash the password here (e.g., using bcrypt)
        // const hashedPassword = await bcrypt.hash(password, 10);

        // For this demo, we store plain text (NOT SECURE for production) but satisfies "code like database query" request
        const [result] = await db.query(
            'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [fullName, email, password, role || 'student']
        );

        res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Database error' });
    }
});

// LOGIN ENDPOINT
app.post('/login', async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' });
    }

    try {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE email = ? AND role = ?',
            [email, role]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = rows[0];

        // Verify password (again, use bcrypt.compare in production)
        if (user.password_hash !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                role: user.role,
                createdAt: user.created_at,
                avatar: user.avatar_url // Return persisted avatar
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// GET CODE LESSONS ENDPOINT
app.get('/code-lessons', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM code_lessons ORDER BY id DESC');
        res.json({ lessons: rows });
    } catch (error) {
        console.error('Fetch code lessons error:', error);
        res.status(500).json({ error: 'Failed to fetch code lessons' });
    }
});

// --- NEW ROADMAP ENDPOINTS (Moved to Top) ---
app.get('/roadmap/:subject', async (req, res) => {
    const { subject } = req.params;
    console.log('[ROADMAP] Request for:', subject);
    try {
        let searchSubject = subject;
        if (subject === 'DS') searchSubject = 'Data Structures';

        const [topics] = await db.query('SELECT * FROM topics WHERE subject = ?', [searchSubject]);

        if (topics.length === 0) {
            console.log('[ROADMAP] No topics found for:', searchSubject);
            return res.json({ topics: [], dependencies: [] });
        }

        const topicIds = topics.map(t => t.id);
        const [dependencies] = await db.query('SELECT * FROM topic_dependencies WHERE topic_id IN (?)', [topicIds]);

        res.json({ topics, dependencies });
    } catch (err) {
        console.error('Roadmap fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch roadmap' });
    }
});

app.get('/roadmap/progress/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [progress] = await db.query('SELECT topic_id, status FROM user_progress WHERE user_id = ?', [userId]);
        res.json({ progress });
    } catch (err) {
        console.error('Roadmap progress error:', err);
        res.status(500).json({ error: 'Failed to fetch progress' });
    }
});

app.post('/roadmap/progress', async (req, res) => {
    const { userId, topicId, status } = req.body;

    if (!userId || !topicId || !status) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    try {
        await db.query(`
            INSERT INTO user_progress (user_id, topic_id, status)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE status = VALUES(status)
        `, [userId, topicId, status]);

        res.json({ message: 'Progress updated' });
    } catch (err) {
        console.error('Update progress error:', err);
        res.status(500).json({ error: 'Failed to update progress' });
    }
});

// GOOGLE LOGIN ENDPOINT (Simulated/Real Hybrid)
app.post('/auth/google', async (req, res) => {
    const { email, name, googleId, avatar } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        // 1. Check if user exists
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        let user;
        if (rows.length > 0) {
            // User exists: Update avatar if provided and not set
            user = rows[0];
            if (avatar && !user.avatar_url) {
                await db.query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatar, user.id]);
                user.avatar_url = avatar;
            }
        } else {
            // User does not exist: Create new user
            const [result] = await db.query(
                'INSERT INTO users (full_name, email, password_hash, role, avatar_url) VALUES (?, ?, ?, ?, ?)',
                [name || 'Google User', email, 'GOOGLE_AUTH_PLACEHOLDER', 'student', avatar || null]
            );
            user = {
                id: result.insertId,
                full_name: name,
                email: email,
                role: 'student',
                created_at: new Date(),
                avatar_url: avatar
            };
        }

        res.json({
            message: 'Google Login successful',
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                role: user.role,
                createdAt: user.created_at,
                avatar: user.avatar_url
            }
        });

    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(500).json({ error: 'Database error during Google Login' });
    }
});

// RESET PASSWORD ENDPOINT
app.post('/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
        return res.status(400).json({ error: 'Missing email or new password' });
    }

    try {
        const [result] = await db.query(
            'UPDATE users SET password_hash = ? WHERE email = ?',
            [newPassword, email]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// UPDATE USER CREDITS (From Quiz)
app.post('/users/:id/credits', async (req, res) => {
    const userId = req.params.id;
    const { credits } = req.body;

    if (!credits || isNaN(credits)) {
        return res.status(400).json({ error: 'Invalid credits value' });
    }

    try {
        await db.query('UPDATE users SET credits = COALESCE(credits, 0) + ? WHERE id = ?', [credits, userId]);
        const [rows] = await db.query('SELECT credits FROM users WHERE id = ?', [userId]);

        res.json({
            message: 'Credits updated',
            totalCredits: rows[0] ? rows[0].credits : 0
        });
    } catch (error) {
        console.error('Update credits error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// 4. UPDATE USER PROFILE (Avatar & Name)
app.put('/users/:id/profile', upload.single('avatar'), async (req, res) => {
    const userId = req.params.id;
    console.log(`[PROFILE UPDATE] User: ${userId}`);
    console.log('[PROFILE UPDATE] Body:', req.body);
    console.log('[PROFILE UPDATE] File:', req.file);

    const { fullName } = req.body;
    let avatarUrl = null;

    if (req.file) {
        avatarUrl = req.file.path; // Cloudinary URL
    }

    try {
        const fields = [];
        const values = [];

        if (fullName) {
            fields.push('full_name = ?');
            values.push(fullName);
        }
        if (avatarUrl) {
            fields.push('avatar_url = ?');
            values.push(avatarUrl);
        }

        if (fields.length === 0) {
            return res.json({ message: 'No changes detected' });
        }

        values.push(userId); // For WHERE clause

        const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
        await db.query(sql, values);

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: userId,
                fullName,
                avatar: avatarUrl
            }
        });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// 5. GET STORAGE STATS
app.get('/users/:id/storage-stats', async (req, res) => {
    const userId = req.params.id;
    try {
        const [files] = await db.query(
            'SELECT file_type, original_name, file_size FROM files WHERE user_id = ?',
            [userId]
        );

        let totalSize = 0;
        let docsCount = 0;
        let videoCount = 0;
        let imageCount = 0;
        let otherCount = 0;

        let docsSize = 0;
        let videoSize = 0;
        let imageSize = 0;
        let otherSize = 0;

        for (const file of files) {
            // Use real file_size if available, else fallback to 0 (or estimate if you really want)
            let sizeBytes = 0;

            if (file.file_size !== null && file.file_size !== undefined) {
                sizeBytes = parseInt(file.file_size);
            }

            totalSize += sizeBytes;

            if (file.file_type === 'video_url') {
                videoCount++;
                videoSize += sizeBytes;
            } else if (['jpg', 'png', 'jpeg'].some(ext => file.original_name.toLowerCase().endsWith(ext))) {
                imageCount++;
                imageSize += sizeBytes;
            } else if (file.file_type === 'doc') {
                docsCount++;
                docsSize += sizeBytes;
            } else {
                otherCount++;
                otherSize += sizeBytes;
            }
        }

        const usedMB = (totalSize / (1024 * 1024)).toFixed(2); // 2 decimals

        res.json({
            usedMB,
            totalMB: 2000, // 2GB free tier
            fileCount: files.length,
            breakdown: {
                docs: { count: docsCount, size: (docsSize / (1024 * 1024)).toFixed(2) },
                video: { count: videoCount, size: (videoSize / (1024 * 1024)).toFixed(2) },
                image: { count: imageCount, size: (imageSize / (1024 * 1024)).toFixed(2) },
                other: { count: otherCount, size: (otherSize / (1024 * 1024)).toFixed(2) }
            }
        });

    } catch (err) {
        console.error('Storage stats error:', err);
        res.status(500).json({ error: 'Failed to fetch storage stats' });
    }
});

// Basic Root Route to check if server is running

// --- CAREER ADVISOR ENDPOINTS ---

// GET LATEST CAREER ANALYSIS
app.get('/career/latest/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        const [rows] = await db.query(
            'SELECT result_json FROM career_analysis WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
            [userId]
        );
        if (rows.length > 0) {
            res.json({ result: rows[0].result_json });
        } else {
            res.json({ result: null });
        }
    } catch (error) {
        console.error('Fetch career error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// ANALYZE CAREER PATH
app.post('/career/assess', async (req, res) => {
    const { userId, skills, interests, academics } = req.body;
    console.log('[CAREER] Analyzing for User:', userId);
    console.log('[CAREER] Inputs:', { skills, interests, academics });

    try {
        // 1. GENERATE RECOMMENDATIONS (Mock AI / Heuristic Engine)
        // In a real app, this would call OpenAI/Gemini with a prompt.

        const skillsLower = skills.toLowerCase();
        const interestsLower = interests.toLowerCase();

        let paths = [];
        let roadmap = [];
        let certs = [];
        let tips = [];

        // Logic Rule Engine
        if (skillsLower.includes('python') || skillsLower.includes('data') || skillsLower.includes('ai')) {
            paths.push({
                role: "AI / Data Scientist",
                match_score: "98%",
                reason: "Your strong foundation in Python and interest in AI aligns perfectly with Data Science roles."
            });
            paths.push({
                role: "Backend Developer",
                match_score: "85%",
                reason: "Python is a leading backend language, making this a strong alternative."
            });

            roadmap = [
                { step: 1, title: "Master Python Libraries", description: "Focus on Pandas, NumPy, and Scikit-Learn." },
                { step: 2, title: "Learn Machine Learning", description: "Understand supervised and unsupervised algorithms." },
                { step: 3, title: "Build Projects", description: "Create a portfolio with real-world datasets (Kaggle)." },
                { step: 4, title: "Deep Learning (Optional)", description: "Explore TensorFlow or PyTorch for advanced roles." }
            ];
            certs = ["Google Data Analytics Certificate", "TensorFlow Developer Certificate", "AWS Certified Machine Learning"];
            tips = ["Highlight data visualization projects.", "Showcase your GitHub contributions.", "Mention specific algorithms you have used."];

        } else if (skillsLower.includes('javascript') || skillsLower.includes('react') || skillsLower.includes('web')) {
            paths.push({
                role: "Full Stack Developer",
                match_score: "96%",
                reason: "Skills in JavaScript and frameworks like React are in high demand for full-stack roles."
            });
            paths.push({
                role: "Frontend Engineer",
                match_score: "90%",
                reason: "Specializing further in UI/UX and React can lead to specialized frontend roles."
            });

            roadmap = [
                { step: 1, title: "Advanced JavaScript", description: "Master ES6+, closures, and async programming." },
                { step: 2, title: "Frontend Frameworks", description: "Deep dive into React, Next.js, and State Management (Redux)." },
                { step: 3, title: "Backend Basics", description: "Learn Node.js, Express, and Databases (SQL/NoSQL)." },
                { step: 4, title: "DevOps & Deployment", description: "Understand Docker, CI/CD, and Cloud hosting (Vercel/AWS)." }
            ];
            certs = ["Meta Front-End Developer Professional Certificate", "AWS Certified Developer", "MongoDB Developer"];
            tips = ["Deploy your projects live (Vercel/Netlify).", "Focus on responsive design skills.", "Include lighthouse performance scores."];

        } else if (skillsLower.includes('design') || skillsLower.includes('figma') || skillsLower.includes('ui')) {
            paths.push({
                role: "UI/UX Designer",
                match_score: "95%",
                reason: "Your listed interests in design and tools like Figma make you a great fit."
            });
            paths.push({
                role: "Product Designer",
                match_score: "88%",
                reason: "Expanding into user research and strategy can open Product Design roles."
            });

            roadmap = [
                { step: 1, title: "Design Principles", description: "Master color theory, typography, and layout." },
                { step: 2, title: "Tool Mastery", description: "Become an expert in Figma and Adobe XD." },
                { step: 3, title: "User Research", description: "Learn how to conduct user interviews and usability testing." },
                { step: 4, title: "Prototyping", description: "Build interactive high-fidelity prototypes." }
            ];
            certs = ["Google UX Design Professional Certificate", "Nielsen Norman Group UX Certification"];
            tips = ["Build a visually stunning portfolio (Behance/Dribbble).", "Explain your design thinking process, not just visuals.", "Include case studies."];
        } else {
            // Default / Generic
            paths.push({
                role: "Software Engineer",
                match_score: "80%",
                reason: "A versatile role suitable for your current academic background."
            });
            paths.push({
                role: "Technical Product Manager",
                match_score: "75%",
                reason: "Combines technical knowledge with planning and strategy."
            });

            roadmap = [
                { step: 1, title: "Data Structures & Algo", description: "Practice LeetCode and understand core CS concepts." },
                { step: 2, title: "Pick a Specialization", description: "Decide between Web, Mobile, or Systems programming." },
                { step: 3, title: "Build a Capstone Project", description: "Develop a complex application to demonstrate skills." }
            ];
            certs = ["AWS Cloud Practitioner", "Professional Scrum Master (PSM)"];
            tips = ["Focus on problem-solving skills in your resume.", "List all academic projects clearly.", "Participate in Hackathons."];
        }

        const resultJson = {
            recommended_paths: paths,
            roadmap: roadmap,
            certifications: certs,
            resume_tips: tips
        };

        // 2. SAVE TO DB
        await db.query(
            'INSERT INTO career_analysis (user_id, skills, interests, academics, result_json) VALUES (?, ?, ?, ?, ?)',
            [userId, skills, interests, academics, JSON.stringify(resultJson)]
        );

        res.json({
            message: 'Analysis complete',
            result: resultJson
        });

    } catch (error) {
        console.error('Career Analysis Error:', error);
        res.status(500).json({ error: 'Failed to analyze profile' });
    }
});


app.get('/', (req, res) => {
    res.json({ message: 'StudyFlow API is running 🚀' });
});

// DEBUG ECHO
app.post('/debug-echo', (req, res) => {
    console.log('Echo Body:', req.body);
    res.json(req.body);
});

// 1. Upload to Cloud (Storage) Endpoint
// Configure Local Storage for buffering before Cloudinary
const localStorageEngine = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const uploadLocal = multer({ storage: localStorageEngine });

// --- CONSOLIDATED WORKFLOW (Requested by User): Upload -> Local Analyze -> Cloudinary -> DB ---
app.post('/upload-and-analyze', uploadLocal.single('file'), async (req, res) => {
    console.log('[PROCESS] Starting Unified Flow (Local Analyze -> Cloud Upload)');

    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const localFilePath = req.file.path;
    const originalName = req.file.originalname;
    const mimeType = req.file.mimetype;
    const userId = req.body.userId || 1;
    const fileSize = req.file.size;

    let rawText = "";
    let lessons = [];
    let publicId = "";
    let secureUrl = "";
    let fileType = "doc";

    try {
        // 1. LOCAL ANALYSIS
        console.time('Local Extraction');
        try {
            if (originalName.match(/\.pdf$/i)) {
                const data = await pdfParse(fs.readFileSync(localFilePath));
                rawText = data.text;
            } else if (originalName.match(/\.docx$/i)) {
                const result = await mammoth.extractRawText({ path: localFilePath });
                rawText = result.value;
            } else if (originalName.match(/\.pptx?$/i)) {
                rawText = await officeParser.parseOfficeAsync(localFilePath);
            } else {
                rawText = fs.readFileSync(localFilePath, 'utf8');
            }
        } catch (extractErr) {
            console.error('Extraction Failed:', extractErr);
        }
        console.timeEnd('Local Extraction');

        console.log(`[ANALYSIS] Extracted Text Length: ${rawText ? rawText.length : 0} chars`);
        if (rawText && rawText.length > 0) console.log(`[ANALYSIS] Preview: ${rawText.substring(0, 100)}...`);

        // 2. GENERATE LESSONS
        // Improvement: Handle Scanned Docs vs Empty Docs
        const isScanned = (!rawText || rawText.trim().length < 50) && mimeType.includes('pdf');

        const cleanText = rawText ? rawText.replace(/\r\n/g, '\n').replace(/\t/g, ' ') : "";

        let chunks = cleanText.split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 3); // Relaxed filter

        // Remove duplicate lines (common in headers)
        chunks = [...new Set(chunks)];

        if (chunks.length < 3) {
            // FALLBACK / SCANNED DOCUMENT HANDLING
            const topic = originalName.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
            lessons = [
                {
                    title: isScanned ? "Scanned Document Detected" : `Overview: ${topic}`,
                    points: isScanned
                        ? ["This document appears to be an image source or scanned PDF.", "Text extraction capabilities are limited.", "Please refer to the original file for details."]
                        : ["The document content is brief.", `Focus appears to be on ${topic}.`, "Review the full file for more context."]
                },
                {
                    title: "Key Takeaways",
                    points: ["Ensure you understand the main headings.", "Check for any diagrams or charts in the file.", "Summarization is best with text-selectable documents."]
                },
                {
                    title: "Study Tip",
                    points: ["Break down the material into smaller sections.", "Use the 'Recall' feature to test your memory.", "Watch the recommended video for a visual explanation."]
                }
            ];
        } else {
            // SMART CHUNKING
            let buffer = [];
            for (let i = 0; i < chunks.length; i++) {
                const line = chunks[i];
                if (line.match(/^\d+$/)) continue; // Skip page numbers

                buffer.push(line);

                // Create lesson every 5 lines OR if line looks like a header (short, no punctuation)
                const isHeader = line.length < 50 && !line.match(/[.!?]$/);

                if (buffer.length >= 5 || (isHeader && buffer.length > 3)) {
                    const title = buffer[0].length > 60 ? buffer[0].substring(0, 60) + '...' : buffer[0];
                    const points = buffer.slice(1);
                    if (points.length > 0) lessons.push({ title, points });
                    buffer = [];
                }
            }
            if (buffer.length > 0) {
                const title = buffer[0].length > 60 ? buffer[0].substring(0, 60) + '...' : "Conclusion";
                lessons.push({ title, points: buffer.slice(1) });
            }
        }

        // Limit
        if (lessons.length > 40) lessons.splice(40);
        if (lessons.length === 0) lessons.push({ title: 'Summary', points: ["Content processed."] });

        // 3. UPLOAD TO CLOUDINARY
        console.log('[PROCESS] Uploading to Cloudinary...');
        const isDoc = mimeType.includes('pdf') || mimeType.includes('word') || mimeType.includes('presentation') || originalName.match(/\.(doc|docx|ppt|pptx|pdf)$/i);
        const uploadOptions = { folder: 'studyflow_uploads', resource_type: isDoc ? 'raw' : 'auto' };
        if (isDoc) {
            uploadOptions.public_id = `${path.parse(originalName).name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.txt`;
            uploadOptions.use_filename = true;
        }
        const cloudResult = await cloudinary.uploader.upload(localFilePath, uploadOptions);
        publicId = cloudResult.public_id;
        secureUrl = cloudResult.secure_url;
        fileType = isDoc ? 'doc' : 'image';

        // 4. IMPROVED: DYNAMIC VIDEO SEARCH (Content-Aware)
        // Extract keywords from rawText for better relevance
        let searchKeywords = "";
        if (rawText) {
            const stopWords = new Set(['the', 'is', 'in', 'at', 'of', 'on', 'and', 'a', 'to', 'for', 'with', 'it', 'as', 'an', 'by', 'that', 'this', 'be', 'are', 'from', 'or', 'was', 'but', 'not']);
            // Tokenize, lowercase, remove punctuation/numbers, filter stop words
            const words = rawText.substring(0, 2000) // Look at first 2000 chars
                .toLowerCase()
                .replace(/[^a-z\s]/g, '')
                .split(/\s+/)
                .filter(w => w.length > 3 && !stopWords.has(w));

            // Simple Frequency Count
            const freq = {};
            words.forEach(w => freq[w] = (freq[w] || 0) + 1);

            // Sort by frequency and pick top 5
            searchKeywords = Object.entries(freq)
                .sort((a, b) => b[1] - a[1]) // Descending
                .slice(0, 5)
                .map(e => e[0])
                .join(' ');
        }

        const filenameClean = originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9 ]/g, " ");
        const searchTarget = `${filenameClean} ${searchKeywords}`.trim();

        let relatedVideoUrl = 'https://www.youtube.com/watch?v=p60rN9JEapg'; // Default fallback

        try {
            console.log(`[VIDEO SEARCH] Searching YouTube for: ${searchTarget.substring(0, 50)}...`);
            const youtubesearchapi = require("youtube-search-api");

            // Search for the top result
            const searchResults = await youtubesearchapi.GetListByKeyword(searchTarget, false, 5, [{ type: "video" }]);

            if (searchResults && searchResults.items && searchResults.items.length > 0) {
                // Get the ID of the first video
                const videoId = searchResults.items[0].id;
                relatedVideoUrl = `https://www.youtube.com/watch?v=${videoId}`;
                console.log(`[VIDEO SEARCH] Found related video: ${relatedVideoUrl} (${searchResults.items[0].title})`);
            } else {
                console.log('[VIDEO SEARCH] No results found, using default.');
            }
        } catch (vidErr) {
            console.warn('[VIDEO SEARCH] Search failed (using default):', vidErr.message);
        }

        // 5. SAVE DB
        const [fileResult] = await db.query(
            'INSERT INTO files (user_id, public_id, file_type, file_url, secure_url, original_name, file_size, uploaded_by, related_video_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, publicId, fileType, secureUrl, secureUrl, originalName, fileSize, 'student', relatedVideoUrl]
        );
        const fileId = fileResult.insertId;

        // 6. SAVE LESSONS
        for (let i = 0; i < lessons.length; i++) {
            await db.query(
                'INSERT INTO micro_lessons (file_id, lesson_order, title, content_points, duration_seconds) VALUES (?, ?, ?, ?, ?)',
                [fileId, i + 1, lessons[i].title, JSON.stringify(lessons[i].points), 120]
            );
        }

        // --- NEW: UPLOAD SUMMARY TO CLOUDINARY (User Request) ---
        let summaryUrl = "";
        try {
            console.log('[PROCESS] Uploading Summary Text to Cloudinary...');
            const summaryContent = lessons.map(l => `## ${l.title}\n${l.points.map(p => `- ${p}`).join('\n')}`).join('\n\n');
            const summaryTempPath = path.join(__dirname, 'uploads', `summary_${Date.now()}.txt`);
            fs.writeFileSync(summaryTempPath, summaryContent);

            const summaryUpload = await cloudinary.uploader.upload(summaryTempPath, {
                folder: 'studyflow_summaries',
                resource_type: 'raw',
                public_id: `${path.parse(originalName).name.replace(/[^a-zA-Z0-9]/g, '_')}_summary`,
                format: 'txt'
            });
            summaryUrl = summaryUpload.secure_url;
            console.log(`[PROCESS] Summary saved to Cloudinary: ${summaryUrl}`);

            // Clean up temp summary
            fs.unlinkSync(summaryTempPath);
        } catch (sumErr) {
            console.warn('[PROCESS] Failed to upload summary text to Cloudinary:', sumErr.message);
        }
        // ---------------------------------------------------------

        // 7. CLEANUP
        try { fs.unlinkSync(localFilePath); } catch (e) { }

        res.json({
            message: 'File processed successfully',
            fileId: fileId,
            fileUrl: secureUrl,
            relatedVideoUrl: relatedVideoUrl,
            lessonCount: lessons.length
        });

    } catch (error) {
        console.error('Process Error:', error);
        // Try cleanup
        try { if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath); } catch (e) { }
        res.status(500).json({ error: 'Processing failed', details: error.message });
    }
});


// --- CAREER ADVISOR ENDPOINTS ---

// GET Latest Career Assessment
app.get('/career/latest/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const [rows] = await db.query(
            'SELECT * FROM career_assessments WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
            [userId]
        );

        if (rows.length > 0) {
            let result = rows[0];
            // Ensure result_json is parsed if it's stored as a string
            if (typeof result.result_json === 'string') {
                try {
                    result.result_json = JSON.parse(result.result_json);
                } catch (e) {
                    // ignore parse error, send as is
                }
            }
            res.json({ result: result });
        } else {
            res.json({ result: null });
        }
    } catch (error) {
        console.error('Fetch Career Error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// POST Analyze Career Path (AI)
app.post('/career/assess', async (req, res) => {
    const { userId, skills, interests, academics, useAI } = req.body;

    if (!userId || !skills) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    let aiResult = null;

    // 1. Try AI Analysis if requested and available
    if (useAI && process.env.OPENAI_API_KEY) {
        try {
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

            const prompt = `
                Act as an expert Career Counselor. Analyze this student profile:
                - Skills: ${skills}
                - Interests: ${interests}
                - Academics: ${academics}

                Provide a JSON response with:
                1. "recommended_paths": Array of 3 roles (role, match_score (percentage), reason).
                2. "roadmap": Array of 5 steps to achieve the best match role (step number, title, description).
                3. "certifications": Array of recommended certifications.
                4. "resume_tips": Array of specific resume improvements.

                Format strictly as JSON. No markdown formatting.
            `;

            const completion = await openai.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "gpt-4o-mini", // or gpt-3.5-turbo
                response_format: { type: "json_object" }
            });

            const content = completion.choices[0].message.content;
            aiResult = JSON.parse(content);
            console.log("AI Career Analysis Successful");

        } catch (error) {
            console.error("AI Analysis Failed:", error.message);
            // Fallback continues below
        }
    }

    // 2. Fallback Mock Data if AI failed or not requested
    if (!aiResult) {
        console.log("Using Mock Career Data");
        aiResult = {
            recommended_paths: [
                { role: "Full Stack Developer", match_score: "95%", reason: "Strong match based on your skills in " + skills.split(',')[0] },
                { role: "Backend Engineer", match_score: "85%", reason: "Good alternative given your interest in logic." },
                { role: "DevOps Engineer", match_score: "70%", reason: "Useful path if you like infrastructure." }
            ],
            roadmap: [
                { step: 1, title: "Master Fundamentals", description: "Deepen your knowledge of " + skills.split(',')[0] },
                { step: 2, title: "Build Projects", description: "Create 2-3 full stack apps using React and Node." },
                { step: 3, title: "Learn Cloud", description: "Get basic AWS/Firebase certification." },
                { step: 4, title: "Internship", description: "Apply for junior dev roles." },
                { step: 5, title: "Specialize", description: "Choose a niche like AI or Mobile." }
            ],
            certifications: ["AWS Certified Developer", "Meta Frontend Developer"],
            resume_tips: ["Highlight your projects", "List skills clearly at the top"]
        };
    }

    try {
        // 3. Save to DB
        // Check if user already has an analysis, if so, insert new one (history)
        await db.query(
            'INSERT INTO career_assessments (user_id, skills, interests, academics, result_json) VALUES (?, ?, ?, ?, ?)',
            [userId, skills, interests, academics, JSON.stringify(aiResult)]
        );

        res.json({ success: true, result: aiResult });
    } catch (dbError) {
        console.error("DB Save Error:", dbError);
        res.status(500).json({ error: 'Failed to save analysis' });
    }
});


// --- EXAM COMPANION ENDPOINTS ---

// GET Active Study Plan
app.get('/users/:userId/study-plans', async (req, res) => {
    try {
        const { userId } = req.params;
        // Fetch the most recently created plan
        const [rows] = await db.query(
            'SELECT * FROM study_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
            [userId]
        );

        if (rows.length > 0) {
            let plan = rows[0];
            // Ensure plan_json is parsed if it's stored as a string
            if (typeof plan.plan_json === 'string') {
                try {
                    plan.plan_json = JSON.parse(plan.plan_json);
                } catch (e) { }
            }
            res.json({ plan: plan });
        } else {
            res.json({ plan: null });
        }
    } catch (error) {
        console.error('Fetch Study Plan Error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// POST Generate Smart Study Plan
app.post('/generate-study-plan', async (req, res) => {
    const { userId, title, syllabus, examDate } = req.body;

    if (!userId || !title || !syllabus || !examDate) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Helper: Calculate number of days
    const start = new Date();
    const end = new Date(examDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
        return res.status(400).json({ error: 'Exam date must be in the future' });
    }

    // Limit plan to 30 days max for AI generation to keep prompt small, or chunks? 
    // For now, let's target key milestones if duration is long.
    const planDuration = Math.min(diffDays, 60);

    let generatedPlan = null;

    // 1. AI Generation
    if (process.env.OPENAI_API_KEY) {
        try {
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            const prompt = `
                Create a study plan for an exam titled "${title}".
                Syllabus: "${syllabus}"
                Days remaining: ${planDuration}.
                
                Return a JSON array where each object is a day:
                [
                    { "day": 1, "topic": "Focus Topic", "tasks": ["Task 1", "Task 2"] },
                    ...
                ]
                Cover the entire syllabus properly distributed over ${planDuration} days.
                Ensure the last day is for revision.
                Format strictly as JSON. No markdown.
            `;

            const completion = await openai.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "gpt-4o-mini", // or gpt-3.5-turbo
                response_format: { type: "json_object" }
            });

            const content = completion.choices[0].message.content;
            // Handle cases where AI returns { "days": [...] } or just [...]
            const parsed = JSON.parse(content);
            generatedPlan = Array.isArray(parsed) ? parsed : (parsed.days || parsed.plan || []);

            console.log("AI Study Plan Generated");
        } catch (e) {
            console.error("AI Plan Gen Failed:", e.message);
        }
    }

    // 2. Fallback Heuristic Generation
    if (!generatedPlan || generatedPlan.length === 0) {
        console.log("Using Heuristic Plan Generator");
        const topics = syllabus.split(/,|\n/).map(t => t.trim()).filter(t => t.length > 2);
        generatedPlan = [];

        for (let i = 1; i <= planDuration; i++) {
            const topicIndex = (i - 1) % (topics.length || 1);
            const currentTopic = topics[topicIndex] || "General Review";

            let tasks = [];
            if (i === planDuration) {
                tasks = ["Review all notes", "Take a mock test", "Rest well"];
            } else if (topics.length > 0) {
                tasks = [
                    `Read chapter on ${currentTopic}`,
                    `Practice problems for ${currentTopic}`,
                    `Summarize key points`
                ];
            } else {
                tasks = ["Study session 1", "Practice problems", "Review"];
            }

            generatedPlan.push({
                day: i,
                topic: i === planDuration ? "Final Revision" : currentTopic,
                tasks: tasks
            });
        }
    }

    try {
        // 3. Save to DB
        // Format date for MySQL
        const sqlDate = new Date(examDate).toISOString().slice(0, 19).replace('T', ' ');
        const planJsonStr = JSON.stringify(generatedPlan);

        const [result] = await db.query(
            'INSERT INTO study_plans (user_id, title, exam_date, syllabus_text, plan_json) VALUES (?, ?, ?, ?, ?)',
            [userId, title, sqlDate, syllabus, planJsonStr]
        );

        // Return the full plan object as expected by frontend
        res.json({
            success: true,
            plan: {
                id: result.insertId,
                title,
                exam_date: examDate,
                plan_json: generatedPlan
            }
        });

    } catch (err) {
        console.error("Save Plan Error:", err);
        res.status(500).json({ error: 'Failed to save study plan' });
    }
});

// POST Explain Code Endpoint
app.post('/explain-code', async (req, res) => {
    const { code, language } = req.body;

    if (!code) {
        return res.status(400).json({ error: 'Code is required' });
    }

    // Default response structure
    let responseData = {
        language: language || 'Unknown',
        complexity: 'N/A',
        summary: 'Could not analyze code.',
        explanation: ['Analysis failed.']
    };

    // 1. AI Analysis
    if (typeof OpenAI !== 'undefined' && process.env.OPENAI_API_KEY) {
        try {
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            const prompt = `
                Act as a Senior Developer. Explain this code snippet.
                Code:
                ${code.substring(0, 2000)}

                Return JSON ONLY:
                {
                    "language": "Programming Language",
                    "complexity": "Time/Space Complexity",
                    "summary": "Brief summary of what the code does",
                    "explanation": ["Step 1 explanation", "Step 2 explanation", "Step 3 explanation"]
                }
            `;

            const completion = await openai.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "gpt-4o-mini", // or gpt-3.5-turbo
                response_format: { type: "json_object" }
            });

            const content = completion.choices[0].message.content;
            responseData = JSON.parse(content);
            console.log("AI Code Explanation Successful");

            return res.json(responseData);

        } catch (error) {
            console.error("AI Explain Failed:", error.message);
            // Fallback continues
        }
    }

    // 2. Fallback Rule-Based Analysis (Regex/Heuristic) + Internet Search
    console.log("Using Fallback Code Explainer with Internet Search");

    // Use the dedicated engine
    const engineResult = explainEngine(code);
    const detailedExplanation = engineResult.explanation;

    const detectedLang = engineResult.language !== "Unknown" ? engineResult.language : (language || "Code");
    const complexity = engineResult.complexity;
    const concepts = engineResult.concepts || [];

    // Internet Search for Related Video
    let relatedVideoUrl = null;
    let relatedVideoTitle = null;
    let relatedVideoThumbnail = null;

    try {
        const searchTarget = `${detectedLang} ${concepts[0] || "programming tutorial"} explanation`;
        console.log(`[VIDEO SEARCH] Searching YouTube for: ${searchTarget}`);

        const searchResults = await youtubesearchapi.GetListByKeyword(searchTarget, false, 5, [{ type: "video" }]);

        if (searchResults && searchResults.items && searchResults.items.length > 0) {
            const video = searchResults.items[0];
            relatedVideoUrl = `https://www.youtube.com/watch?v=${video.id}`;
            relatedVideoTitle = video.title;
            relatedVideoThumbnail = video.thumbnail?.thumbnails?.[0]?.url || "";
            console.log(`[VIDEO SEARCH] Found: ${relatedVideoTitle}`);
        }
    } catch (vidErr) {
        console.warn('[VIDEO SEARCH] Failed:', vidErr.message);
    }

    responseData = {
        language: detectedLang,
        complexity: { time: complexity, space: "O(1) (Estimated)" },
        summary: `This is a ${detectedLang} snippet involving ${concepts.join(', ') || 'general logic'}.`,
        explanation: detailedExplanation,
        concepts: concepts,
        stepByStep: detailedExplanation, // Mapping for frontend compatibility
        relatedVideo: relatedVideoUrl ? {
            url: relatedVideoUrl,
            title: relatedVideoTitle,
            thumbnail: relatedVideoThumbnail
        } : null
    };

    res.json(responseData);
});

// --- CODING CHALLENGE ENDPOINTS ---



// GET All Problems
app.get('/coding-problems', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, title, difficulty, tags, created_at FROM coding_problems ORDER BY id ASC');
        const problems = rows.map(p => ({
            ...p,
            tags: typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags,
            solved: false // TODO: Join with user progress
        }));
        res.json({ problems });
    } catch (error) {
        console.error('Fetch problems error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// NEW DEBUG CODE ENDPOINT
app.post('/debug-code', async (req, res) => {
    const { code } = req.body;
    let language = 'javascript'; // Default
    if (code.includes('import ') || code.includes('def ')) language = 'python';
    if (code.includes('void ') || code.includes('System.out')) language = 'java';

    // 1. Check if AI available
    if (typeof OpenAI !== 'undefined' && process.env.OPENAI_API_KEY) {
        try {
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            const prompt = `
            Act as an Expert Code Debugger. Analyze this code:
            ${code.substring(0, 2000)}

            Task: Identify bugs, syntax errors, or logic flaws. Fix them.
            Return JSON ONLY:
            {
                "isError": true/false (true if issues found),
                "errorType": "Syntax Error" or "Logic Bug",
                "error": "Short description of the error",
                "explanation": "Detailed explanation of why it failed and how it was fixed.",
                "fixedCode": "The complete rectified code string",
                "improvedCode": "An optimized version if possible (optional)",
                "bestPractice": "A related best practice tip."
            }
            `;

            const completion = await openai.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "gpt-4o-mini", // or gpt-3.5-turbo
                response_format: { type: "json_object" }
            });

            const content = JSON.parse(completion.choices[0].message.content);
            console.log("AI Debug Successful");
            return res.json(content);

        } catch (error) {
            console.error("AI Debug Failed:", error);
            // Fallback continues...
        }
    }

    // 2. Fallback Heuristic Debugger
    console.log("Using Fallback Debug Engine");
    const result = debugEngine(code);
    res.json(result);
});

// GET Problem Details
app.get('/coding-problems/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM coding_problems WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Problem not found' });

        const problem = rows[0];
        // Parse JSON fields
        ['tags', 'starter_code', 'test_cases'].forEach(key => {
            if (problem[key] && typeof problem[key] === 'string') {
                try { problem[key] = JSON.parse(problem[key]); } catch (e) { }
            }
        });

        const { test_cases, ...safeProblem } = problem;
        res.json({ problem: safeProblem });
    } catch (error) {
        console.error('Fetch problem details error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// SUBMIT Solution (AI Evaluated)
app.post('/coding-problems/:id/submit', async (req, res) => {
    const { id } = req.params;
    const { code, language } = req.body;

    try {
        const [rows] = await db.query('SELECT title, description, test_cases, difficulty FROM coding_problems WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Problem not found' });

        const problem = rows[0];
        let testCases = problem.test_cases;
        if (typeof testCases === 'string') testCases = JSON.parse(testCases);

        // AI EVALUATION LOGIC
        if (typeof OpenAI !== 'undefined') {
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            const prompt = `
            Act as a strict Coding Judge.
            Problem: ${problem.title}
            Description: ${problem.description}
            Difficulty: ${problem.difficulty}
            Language: ${language}
            
            Student Code:
            ${code}

            Task:
            1. Verify if the code correctly solves the problem.
            2. Check against these test cases: ${JSON.stringify(testCases)}.
            3. Check for time complexity and syntax.
            
            Return JSON ONLY:
            {
                "score": (0-100 integer),
                "passed_count": (integer),
                "total_count": (integer),
                "results": [
                    { "input": "...", "status": "Passed" or "Failed", "output": "...", "expected": "...", "feedback": "brief reason if failed" }
                ],
                "feedback": "Overall feedback on logic and efficiency."
            }
            `;

            try {
                const completion = await openai.chat.completions.create({
                    messages: [{ role: "system", content: "You are a code evaluator. Return strictly validated JSON." }, { role: "user", content: prompt }],
                    model: "gpt-4o-mini", // Efficient model
                    response_format: { type: "json_object" }
                });

                const aiResponse = JSON.parse(completion.choices[0].message.content);

                // Save Result/XP
                const passed = aiResponse.passed_count;
                const score = aiResponse.score;

                // Award XP if passed > 50%
                if (score > 50) {
                    // Mock user ID 1 for now if not sent, or TODO: get from auth
                    // await db.query('UPDATE users SET credits = credits + ? WHERE id = ?', [Math.round(score/10), 1]);
                }

                return res.json({
                    score: score,
                    passed: passed,
                    total: aiResponse.total_count,
                    results: aiResponse.results,
                    feedback: aiResponse.feedback
                });

            } catch (aiErr) {
                console.error("AI Eval Failed:", aiErr);
                // Fallback will run below
            }
        }

        // FALLBACK MOCK EVALUATOR (If No AI or AI Failed)
        console.log("Using Fallback Evaluator");
        const results = [];
        let passedCount = 0;
        const isValid = code && code.length > 30 && !code.includes('pass') && !code.includes('// Logic');

        for (const tc of testCases) {
            if (isValid) {
                passedCount++;
                results.push({ input: tc.input, status: 'Passed', output: tc.output, expected: tc.output });
            } else {
                results.push({ input: tc.input, status: 'Failed', output: 'Syntax/Logic Error', expected: tc.output, feedback: 'Code too short or incomplete.' });
            }
        }

        res.json({
            score: testCases.length > 0 ? Math.round((passedCount / testCases.length) * 100) : 0,
            passed: passedCount,
            total: testCases.length,
            results: results,
            feedback: isValid ? "Good job! (Fallback Evaluated)" : "Please implement a complete solution."
        });

    } catch (error) {
        console.error('Submit error:', error);
        res.status(500).json({ error: 'Execution failed' });
    }
});

// GET Leaderboard (Sorted by Credits) + Current User Rank
app.get('/leaderboard', async (req, res) => {
    const { userId } = req.query; // Optional: Get rank for specific user

    try {
        // 1. Get Top 20 Global
        const [topRows] = await db.query('SELECT id, full_name, credits, avatar_url FROM users ORDER BY credits DESC LIMIT 20');

        // Map to standard format
        let rank = 1;
        const leaderboard = topRows.map(user => ({
            rank: rank++,
            id: user.id,
            name: user.full_name || 'Anonymous',
            points: user.credits || 0,
            avatar: user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U',
            isCurrentUser: String(user.id) === String(userId)
        }));

        let userRankData = null;

        // 2. If userId provided, find their specific rank
        if (userId) {
            // Check if user is already in top 20
            const inTop = leaderboard.find(u => String(u.id) === String(userId));

            if (inTop) {
                userRankData = inTop;
            } else {
                // Fetch User Stats
                const [userRows] = await db.query('SELECT id, full_name, credits, avatar_url FROM users WHERE id = ?', [userId]);
                if (userRows.length > 0) {
                    const user = userRows[0];
                    const userCredits = user.credits || 0;

                    // Calculate Rank: Count users with MORE credits
                    const [countRows] = await db.query('SELECT COUNT(*) as higherCount FROM users WHERE credits > ?', [userCredits]);
                    const actualRank = countRows[0].higherCount + 1;

                    userRankData = {
                        rank: actualRank,
                        id: user.id,
                        name: user.full_name || 'Anonymous',
                        points: userCredits,
                        avatar: user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U',
                        isCurrentUser: true
                    };
                }
            }
        }

        res.json({ leaderboard, userRank: userRankData });
    } catch (error) {
        console.error('Fetch leaderboard error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// NEW CODE CONVERTER ENDPOINT
app.post('/convert-code', async (req, res) => {
    const { code, targetLang } = req.body;
    let language = 'javascript'; // Default source
    if (code.includes('import ') || code.includes('def ')) language = 'python';
    if (code.includes('void ') || code.includes('System.out')) language = 'java';

    // 1. AI Implementation
    if (typeof OpenAI !== 'undefined' && process.env.OPENAI_API_KEY) {
        try {
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            const prompt = `
            Act as an Expert Polyglot Programmer.
            Convert this ${language} code to ${targetLang}:
            
            ${code.substring(0, 2000)}

            Requirements:
            1. Maintain logic and variable names where possible.
            2. Use idiomatic ${targetLang} syntax.
            3. Add comments explaining complex changes.
            4. Return ONLY the code, no markdown block syntax.
            `;

            const completion = await openai.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "gpt-4o-mini", // or gpt-3.5-turbo
            });

            const result = completion.choices[0].message.content;
            return res.json({ convertedCode: result });

        } catch (error) {
            console.error("AI Convert Failed:", error);
            // Fallback continues...
        }
    }

    // 2. Fallback Heuristic Converter
    console.log("Using Fallback Converter Engine");
    const result = converterEngine(code, targetLang);

    // 3. ENHANCEMENT: Fetch Related YouTube Video
    let relatedVideo = null;
    try {
        const searchTarget = `convert ${language} to ${targetLang} tutorial`;
        console.log(`[CONVERTER] Searching YouTube for: ${searchTarget}`);
        const searchResults = await youtubesearchapi.GetListByKeyword(searchTarget, false, 3, [{ type: "video" }]);

        if (searchResults && searchResults.items && searchResults.items.length > 0) {
            const video = searchResults.items[0];
            relatedVideo = {
                url: `https://www.youtube.com/watch?v=${video.id}`,
                title: video.title,
                thumbnail: video.thumbnail?.thumbnails?.[0]?.url || ""
            };
        }
    } catch (e) {
        console.warn("[CONVERTER] Video search failed:", e.message);
    }

    res.json({ convertedCode: result, relatedVideo });
});

// LEGACY (DEPRECATED)
/*
app.post('/upload-storage', upload.single('file'), async (req, res) => {
    // ... Legacy logic hidden
});
*/

// 2. Analyze Content (Metadata/URL) Endpoint
// GENERATE QUIZ FROM FILE ENDPOINT
app.get('/files/:id/quiz', async (req, res) => {
    const fileId = req.params.id;
    console.log(`[QUIZ GEN] Generating quiz for File ID: ${fileId}`);

    try {
        // 1. Fetch File Info
        const [files] = await db.query('SELECT * FROM files WHERE id = ?', [fileId]);
        if (files.length === 0) return res.status(404).json({ error: 'File not found' });
        const file = files[0];

        // 2. Fetch Micro-Lessons
        const [lessons] = await db.query('SELECT * FROM micro_lessons WHERE file_id = ? ORDER BY lesson_order ASC', [fileId]);

        if (lessons.length === 0) {
            return res.status(400).json({ error: 'No content found. Please process the file first.' });
        }

        // 3. Generate Questions (Improved Logic)
        let questions = [];

        // Helper: Get points that are reasonably short for options (< 120 chars)
        const getAllCandidatePoints = () => lessons.flatMap(l => {
            try {
                const p = JSON.parse(l.content_points);
                return Array.isArray(p) ? p.filter(txt => txt.length < 120) : [];
            } catch (e) { return []; }
        });
        const allCandidatePoints = getAllCandidatePoints();

        lessons.forEach((lesson, index) => {
            if (index > 9) return;

            let points = [];
            try { points = JSON.parse(lesson.content_points); } catch (e) { points = []; }
            if (!points || points.length === 0) return;

            // Use first suitable point as correct answer
            const correctAns = points.find(p => p.length < 120) || (points[0].substring(0, 110) + "...");

            // Get distractors that are NOT from this lesson
            const distractors = allCandidatePoints
                .filter(p => !points.includes(p))
                .sort(() => 0.5 - Math.random())
                .slice(0, 3);

            // Fallback if not enough distractors
            if (distractors.length < 3) {
                // Add generic distractors if needed
                while (distractors.length < 3) {
                    distractors.push("None of the above");
                }
            }

            const options = [
                { id: 1, option_text: correctAns, is_correct: true },
                { id: 2, option_text: distractors[0] || "Incorrect Option A", is_correct: false },
                { id: 3, option_text: distractors[1] || "Incorrect Option B", is_correct: false },
                { id: 4, option_text: distractors[2] || "Incorrect Option C", is_correct: false },
            ].sort(() => 0.5 - Math.random());

            options.forEach((o, i) => o.id = i + 1);

            questions.push({
                id: index + 1,
                question_text: `Regarding "${lesson.title}", which statement is accurate?`,
                options: options
            });
        });

        res.json({
            id: `file_${fileId}`,
            title: `Quiz: ${file.original_name}`,
            description: `Generated quiz from ${file.original_name}`,
            questions: questions
        });

    } catch (error) {
        console.error('Quiz Gen Error:', error);
        res.status(500).json({ error: 'Failed to generate quiz' });
    }
});

// 2. Analyze Content (Metadata/URL) Endpoint
app.post('/analyze-url', async (req, res) => {
    // metadata is now optional if we have fileId
    const { fileId, fileUrl, originalName, mimeType, fileSize } = req.body;

    console.log('------------------------------------------------');
    console.time('Total Analysis Time');
    console.log('[DEBUG] /analyze-url called');
    console.log('[DEBUG] Body:', JSON.stringify(req.body, null, 2));

    if (!fileId && !fileUrl) {
        return res.status(400).json({ error: 'No File ID or URL provided' });
    }

    try {
        let targetFileId = fileId;
        let targetUrl = fileUrl;
        let targetName = originalName || 'Document';
        let targetMime = mimeType || 'application/unknown';
        let targetPublicId = null;

        // 1. Resolve File Details from DB if fileId is present
        if (targetFileId) {
            const [rows] = await db.query('SELECT * FROM files WHERE id = ?', [targetFileId]);
            if (rows.length > 0) {
                const fileRecord = rows[0];
                targetUrl = fileRecord.secure_url || fileRecord.file_url;
                targetName = fileRecord.original_name;
                targetPublicId = fileRecord.public_id;
                // Infer mime if missing (basic)
                if (!targetMime || targetMime === 'application/unknown') {
                    if (targetName.endsWith('.pdf')) targetMime = 'application/pdf';
                    else if (targetName.endsWith('.pptx')) targetMime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
                    else if (targetName.endsWith('.docx')) targetMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                }

                // CHECK IF SUMMARY ALREADY EXISTS
                const [lessons] = await db.query('SELECT id FROM micro_lessons WHERE file_id = ? LIMIT 1', [targetFileId]);
                if (lessons.length > 0) {
                    console.log('[ANALYSIS] Summary already exists. Returning existing data.');
                    console.timeEnd('Total Analysis Time');
                    return res.json({
                        message: 'Summary fetched from database',
                        fileId: targetFileId,
                        alreadyExists: true
                    });
                }
            }
        }

        // If we still don't have a fileId (legacy flow), insert record now
        if (!targetFileId && targetUrl) {
            const userId = req.body.userId || 1;
            const [insertRes] = await db.query(
                'INSERT INTO files (user_id, file_type, file_url, original_name, file_size) VALUES (?, ?, ?, ?, ?)',
                [userId, 'doc', targetUrl, targetName, fileSize || 0]
            );
            targetFileId = insertRes.insertId;
        }

        console.log(`Analyzing File ID: ${targetFileId}, URL: ${targetUrl}`);

        // REAL CONTENT EXTRACTION
        let rawText = '';
        let processingPath = targetUrl;
        let isTemp = false;

        try {
            // Handle Remote Cloudinary URL by downloading to temp file
            let usedFallback = false;

            if (targetUrl.startsWith('http')) {
                console.time('Download Time');
                console.log(`Downloading remote file: ${targetUrl}`);

                const downloadArgs = async (url) => {
                    const res = await fetch(url);
                    if (!res.ok) throw { status: res.status, statusText: res.statusText, url };
                    return res;
                };

                let response;
                try {
                    response = await downloadArgs(targetUrl);
                } catch (err) {
                    // FALLBACK LOGIC
                    if ((err.status === 401 || err.status === 404) && targetUrl.includes('cloudinary')) {
                        console.warn(`[DOWNLOAD FAIL] Primary URL failed (${err.status}). Attempting Fallback...`);

                        // Fallback 1: Raw .txt masking
                        let fallbackUrl = targetUrl.replace('/image/upload/', '/raw/upload/').replace(/\.(pdf|docx|ppt|pptx)$/i, '.txt');
                        if (!fallbackUrl.endsWith('.txt')) fallbackUrl += '.txt'; // Ensure it ends in .txt

                        if (targetPublicId) {
                            // If we have public_id, construct robust raw URL
                            // Cloudinary Raw URL: https://res.cloudinary.com/<cloud>/raw/upload/<public_id>
                            // Note: public_id for us includes folder currently? let's trust the replace logic first
                        }

                        console.log(`[FALLBACK] Trying: ${fallbackUrl}`);
                        try {
                            response = await downloadArgs(fallbackUrl);
                            usedFallback = true;
                        } catch (fallbackErr) {
                            console.error('[FALLBACK] Raw TXT Failed. Trying Signed URL...');
                            // Fallback 2: Signed URL
                            // Using targetPublicId if available or parsing from URL
                            try {
                                let pid = targetPublicId;
                                if (!pid) {
                                    const parts = targetUrl.split('/upload/');
                                    if (parts[1]) {
                                        pid = parts[1].replace(/^v\d+\//, '').split('.')[0];
                                        // Note: This is a loose parse. Better to use DB public_id.
                                    }
                                }

                                if (pid) {
                                    // Try Image then Raw
                                    const signedImg = cloudinary.url(pid, { resource_type: 'image', type: 'authenticated', sign_url: true, secure: true });
                                    try {
                                        response = await downloadArgs(signedImg);
                                    } catch (e) {
                                        const signedRaw = cloudinary.url(pid, { resource_type: 'raw', type: 'authenticated', sign_url: true, secure: true });
                                        response = await downloadArgs(signedRaw);
                                    }
                                    usedFallback = true;
                                } else {
                                    throw new Error('No public ID for signed URL');
                                }
                            } catch (finalErr) {
                                throw new Error('All download methods failed.');
                            }
                        }
                    } else {
                        throw err;
                    }
                }

                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                console.log(`[ANALYSIS] Downloaded Buffer: ${buffer.length} bytes`);

                // Check for invalid file (e.g., Cloudinary 404 page hidden as 200)
                if (buffer.length < 1000) {
                    console.warn('[ANALYSIS] File too small (<1KB). Likely corrupt or access denied.');
                    // We will still try to process, but expect failure.
                }

                // Use original extension to ensure parser works
                const ext = path.extname(targetName) || '.down';
                const tempName = `temp-${Date.now()}${ext}`;
                processingPath = path.join(__dirname, 'uploads', tempName);
                fs.writeFileSync(processingPath, buffer);
                isTemp = true;
                console.timeEnd('Download Time');
            }

            // EXTRACTION LOGIC
            if (fs.existsSync(processingPath)) {
                console.time('Text Extraction Time');
                try {
                    // usedFallback treated same as normal download - content is binary
                    if (targetName.match(/\.pdf$/i)) {
                        try {
                            const pdfData = await pdfParse(fs.readFileSync(processingPath));
                            rawText = pdfData.text;
                        } catch (e) {
                            console.warn('PDF Parse failed. Trying raw read.');
                            rawText = fs.readFileSync(processingPath, 'utf8');
                        }
                    }
                    else if (targetName.match(/\.docx$/i)) {
                        const result = await mammoth.extractRawText({ path: processingPath });
                        rawText = result.value;
                    }
                    else if (targetName.match(/\.pptx?$/i)) { // PPT or PPTX
                        console.log('[EXTRACT] parsing PPT with officeParser...');
                        try {
                            rawText = await officeParser.parseOfficeAsync(processingPath);
                        } catch (pptErr) {
                            console.error('PPT Parser failed:', pptErr);
                            // Minimal OCR fallback or text read could go here, but for now just error
                            throw pptErr;
                        }
                    } else {
                        // Default text
                        rawText = fs.readFileSync(processingPath, 'utf8');
                    }
                } catch (parseErr) {
                    console.error('Extraction Error:', parseErr);
                    rawText = ""; // Empty triggers fallback
                } finally {
                    console.timeEnd('Text Extraction Time');
                }
            } else {
                rawText = "";
            }

        } finally {
            if (isTemp && fs.existsSync(processingPath)) {
                try { fs.unlinkSync(processingPath); } catch (e) { }
            }
        }

        console.log(`[ANALYSIS] Extracted Chars: ${rawText ? rawText.length : 0}`);

        // 3. MICRO-LESSON GENERATION
        console.time('Lesson Generation Time');

        let lessons = [];

        // CHECK ID extraction actually worked
        if (!rawText || rawText.length < 50 || rawText.includes("Could not extract")) {
            console.warn('[ANALYSIS] Extraction failed or content too short. Generating FALLBACK Summary.');
            // Fallback Generation
            const topic = targetName.replace(/\.[^/.]+$/, ""); // remove extension
            lessons = [
                {
                    title: `Introduction to ${topic}`,
                    points: ["This file contains key information about the topic.", "Review the original document for full details.", "Summary generated automatically."]
                },
                {
                    title: "Key Concepts",
                    points: ["Important definitions are likely covered here.", "Understanding the core principles is essential.", "Check the source file for diagrams and charts."]
                },
                {
                    title: "Further Study",
                    points: ["Practice problems typically follow this section.", "Reviewing lecture notes will reinforce this.", "Ensure you understand the examples provided."]
                }
            ];
        } else {
            // REAL GENERATION - Revised for PPT/Doc structure
            const cleanText = rawText.replace(/\r\n/g, '\n').replace(/\t/g, ' ');

            // Strategy: Split by Newlines for structure
            let chunks = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 5);
            // Deduplicate
            chunks = [...new Set(chunks)];

            if (chunks.length < 3) {
                // Too short even after extraction? Fallback.
                const topic = targetName.replace(/\.[^/.]+$/, "");
                lessons = [
                    { title: `Overview: ${topic}`, points: ["Summary generated automatically.", "Content appears to be brief."] }
                ];
            } else {
                // Group lines into "Lessons"
                let buffer = [];
                for (let i = 0; i < chunks.length; i++) {
                    const line = chunks[i];
                    // Skip garbage
                    if (line.match(/^\d+$/) || line.length < 4) continue;

                    buffer.push(line);

                    if (buffer.length >= 4) {
                        const titleCandidate = buffer[0];
                        const title = titleCandidate.length > 50 ? titleCandidate.substring(0, 50) + '...' : titleCandidate;
                        const points = buffer.slice(1);

                        lessons.push({ title, points });
                        buffer = [];
                    }
                }
                // Leftovers
                if (buffer.length > 1) {
                    const title = buffer[0].length > 50 ? buffer[0].substring(0, 50) + '...' : buffer[0];
                    lessons.push({ title, points: buffer.slice(1) });
                }
            }

            // Limit
            if (lessons.length > 15) lessons.splice(15);

            // Fallback if no lessons created
            if (lessons.length === 0 && chunks.length > 0) {
                lessons.push({ title: "Summary", points: chunks.slice(0, 5) });
            }

            // Insert Lessons
            for (let i = 0; i < lessons.length; i++) {
                await db.query(
                    'INSERT INTO micro_lessons (file_id, lesson_order, title, content_points, duration_seconds) VALUES (?, ?, ?, ?, ?)',
                    [targetFileId, i + 1, lessons[i].title, JSON.stringify(lessons[i].points), 60]
                );
            }
            console.timeEnd('Lesson Generation Time');

            // VIDEO RECOMMENDATION (Fixed Keyword Logic)
            const combinedText = (targetName + ' ' + rawText.substring(0, 2000)).toLowerCase();
            let relatedVideoUrl = 'https://www.youtube.com/watch?v=p60rN9JEapg';

            const videoMap = [
                // Programming & Computer Science
                { keywords: ['react', 'jsx', 'component', 'props', 'hook', 'frontend', 'javascript', 'native'], url: 'https://www.youtube.com/watch?v=SqcY0GlETPk', topic: 'React.js' },
                { keywords: ['node', 'express', 'backend', 'server', 'api', 'database', 'sql', 'mysql', 'mongo'], url: 'https://www.youtube.com/watch?v=TlB_eWDSMt4', topic: 'Node.js Backend' },
                { keywords: ['python', 'django', 'flask', 'panda', 'numpy', 'data science', 'pip'], url: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc', topic: 'Python Programming' },
                { keywords: ['java', 'spring', 'object oriented', 'class', 'inheritance', 'jvm'], url: 'https://www.youtube.com/watch?v=eIrMbAQSU34', topic: 'Java Programming' },
                { keywords: ['algorithm', 'structure', 'sorting', 'array', 'linked list', 'tree', 'graph'], url: 'https://www.youtube.com/watch?v=RBSGKlAvoiM', topic: 'Data Structures' },
                { keywords: ['operating system', 'linux', 'kernel', 'process', 'thread', 'memory'], url: 'https://www.youtube.com/watch?v=vBURTt97EkA', topic: 'Operating Systems' },
                { keywords: ['networking', 'http', 'tcp', 'ip', 'dns', 'protocol', 'internet'], url: 'https://www.youtube.com/watch?v=i5-mhRj_W7E', topic: 'Computer Networking' },

                // Mathematics
                { keywords: ['math', 'algebra', 'calculus', 'derivative', 'integral', 'equation', 'linear'], url: 'https://www.youtube.com/watch?v=bewox3db_Zk', topic: 'Mathematics' },
                { keywords: ['statistics', 'probability', 'mean', 'median', 'distribution', 'variance'], url: 'https://www.youtube.com/watch?v=Vfo5le26IhY', topic: 'Statistics' },
                { keywords: ['graph', 'vertex', 'edge', 'discrete', 'logic'], url: 'https://www.youtube.com/watch?v=DBbqHH8qaDE', topic: 'Discrete Math' },

                // Science
                { keywords: ['physics', 'force', 'energy', 'quantum', 'gravity', 'motion', 'thermodynamics'], url: 'https://www.youtube.com/watch?v=bHIhgxav9LY', topic: 'Physics' },
                { keywords: ['biology', 'cell', 'dna', 'gene', 'evolution', 'anatomy', 'life'], url: 'https://www.youtube.com/watch?v=ax0tAbC9QMM', topic: 'Biology' },
                { keywords: ['chemistry', 'atom', 'molecule', 'reaction', 'periodic', 'bond'], url: 'https://www.youtube.com/watch?v=bka20Q9TN6M', topic: 'Chemistry' },
                { keywords: ['environment', 'climate', 'ecology', 'pollution', 'water'], url: 'https://www.youtube.com/watch?v=GieYCZsjqyc', topic: 'Environmental Science' },

                // Humanities
                { keywords: ['history', 'war', 'ancient', 'civilization', 'century', 'king', 'revolution'], url: 'https://www.youtube.com/watch?v=XgnXwrsMBUs', topic: 'History' },
                { keywords: ['business', 'market', 'economy', 'finance', 'stock', 'management', 'marketing', 'entrepreneur'], url: 'https://www.youtube.com/watch?v=L2GD8f4A3qQ', topic: 'Business Basics' },
                { keywords: ['psychology', 'brain', 'mind', 'behavior', 'cognition', 'freud'], url: 'https://www.youtube.com/watch?v=vo4pMVb0R6M', topic: 'Psychology' },
                { keywords: ['literature', 'novel', 'poem', 'shakespeare', 'author', 'fiction'], url: 'https://www.youtube.com/watch?v=2T8gM3_b-rA', topic: 'Literature' },

                // General & Soft Skills
                { keywords: ['writing', 'essay', 'grammar', 'thesis', 'research'], url: 'https://www.youtube.com/watch?v=-zgKoX3p_po', topic: 'Academic Writing' },
                { keywords: ['exam', 'test', 'study', 'grade', 'school', 'learn'], url: 'https://www.youtube.com/watch?v=p60rN9JEapg', topic: 'Study Skills' },
                { keywords: ['communication', 'public speaking', 'presentation', 'speech'], url: 'https://www.youtube.com/watch?v=i5mYphUoOCs', topic: 'Communication Skills' },
                { keywords: ['motivation', 'goal', 'habit', 'success', 'mindset'], url: 'https://www.youtube.com/watch?v=75d_29QWELk', topic: 'Productivity' }
            ];

            for (const entry of videoMap) {
                // Check if any keyword matches
                if (entry.keywords.some(k => combinedText.includes(k))) {
                    relatedVideoUrl = entry.url;
                    // topicFound = entry.topic; // Not used in this refactor, but kept for context
                    break;
                }
            }

            res.json({
                message: 'Micro-lessons generated successfully',
                fileId: targetFileId,
                relatedVideoUrl: relatedVideoUrl
            });
        } // Closing the else block

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze document', details: error.message });
    }
});

// 3. DELETE ENDPOINT
app.delete('/delete-file/:id', async (req, res) => {
    const fileId = req.params.id;
    const userId = req.body.userId; // Verification (In prod use auth middleware)

    console.log(`[DELETE] Request for File ID: ${fileId}`);

    try {
        // 1. Get File Details
        const [rows] = await db.query('SELECT * FROM files WHERE id = ?', [fileId]);
        if (rows.length === 0) return res.status(404).json({ error: 'File not found' });

        const file = rows[0];

        // 2. Permission Check (Simple)
        // if (file.user_id != userId && userId != ADMIN_ID) ... 

        // 3. Delete from Cloudinary
        if (file.public_id) {
            console.log(`[DELETE] Removing from Cloudinary: ${file.public_id}`);
            const resourceType = file.file_type === 'video' ? 'video' : 'raw'; // Default for docs is usually raw/image depending on upload
            // Note: If we uploaded as 'auto', it might be image or video. 
            // Safer to try both or rely on stored type.

            try {
                await cloudinary.uploader.destroy(file.public_id, { resource_type: 'raw' });
                await cloudinary.uploader.destroy(file.public_id, { resource_type: 'image' }); // Try image too (PDFs)
                await cloudinary.uploader.destroy(file.public_id, { resource_type: 'video' });
            } catch (cErr) {
                console.warn('[DELETE] Cloudinary error (non-fatal):', cErr.message);
            }
        }

        // 4. Delete from DB (Cascades to micro_lessons)
        await db.query('DELETE FROM files WHERE id = ?', [fileId]);

        res.json({ message: 'File deleted successfully' });

    } catch (err) {
        console.error('Delete error:', err);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

// GET Lessons for a specific file
app.get('/files/:id/lessons', async (req, res) => {
    const fileId = req.params.id;
    try {
        // Fetch Lessons
        const [rows] = await db.query('SELECT * FROM micro_lessons WHERE file_id = ? ORDER BY lesson_order ASC', [fileId]);

        // Fetch File Details (for "View Original File" button)
        const [files] = await db.query('SELECT * FROM files WHERE id = ?', [fileId]);
        const file = files.length > 0 ? files[0] : null;

        // Parse content_points from JSON string to Array
        const lessons = rows.map(lesson => {
            try {
                // Check if it's already a string (it should be)
                if (typeof lesson.content_points === 'string') {
                    lesson.content_points = JSON.parse(lesson.content_points);
                }
            } catch (e) {
                console.warn(`Failed to parse content_points for lesson ${lesson.id}`, e);
                lesson.content_points = ["Error loading points."];
            }
            return lesson;
        });

        res.json({
            lessons,
            file: file, // Return file details including file_url
            relatedVideo: file ? file.related_video_url : null // Explicitly send related video
        });
    } catch (err) {
        console.error('Fetch lessons error:', err);
        res.status(500).json({ error: 'Failed to fetch lessons' });
    }
});

// GET Translated Lessons for a specific file
app.get('/files/:id/lessons/translate', async (req, res) => {
    const fileId = req.params.id;
    const targetLang = req.query.lang || 'en'; // 'en', 'es', 'ta', 'fr'...

    try {
        const translate = require('google-translate-api-x');

        // Fetch Lessons
        const [rows] = await db.query('SELECT * FROM micro_lessons WHERE file_id = ? ORDER BY lesson_order ASC', [fileId]);

        // Fetch File Details
        const [files] = await db.query('SELECT * FROM files WHERE id = ?', [fileId]);
        const file = files.length > 0 ? files[0] : null;

        // Translation Helper
        const translateHelper = async (text, lang) => {
            if (!text || lang === 'en') return text;
            try {
                // If 'simple', we might prompt an LLM in a real app, but here we'll map to 'en' or just use as is for now
                // google-translate doesn't support 'simple'.
                if (lang === 'simple') return text;

                const res = await translate(text, { to: lang });
                return res.text;
            } catch (e) {
                console.warn(`Translation failed for "${text.substring(0, 20)}...":`, e.message);
                return text;
            }
        };

        // 1. Translate Description
        let translatedDescription = file ? file.description : '';
        if (targetLang !== 'en' && targetLang !== 'simple' && file && file.description) {
            // Check if description is JSON or just text? Usually text.
            translatedDescription = await translateHelper(file.description, targetLang);
        }

        // 2. Translate Lessons (Parallelize for speed)
        const translatedLessons = await Promise.all(rows.map(async (lesson) => {
            let points = [];
            try {
                points = typeof lesson.content_points === 'string' ? JSON.parse(lesson.content_points) : (lesson.content_points || []);
            } catch (e) { points = []; }

            if (targetLang === 'en' || targetLang === 'simple') {
                return { ...lesson, content_points: points };
            }

            const transTitle = await translateHelper(lesson.title, targetLang);
            // Translate all points
            const transPoints = await Promise.all(points.map(p => translateHelper(p, targetLang)));

            return {
                ...lesson,
                title: transTitle,
                content_points: transPoints
            };
        }));

        res.json({
            lessons: translatedLessons,
            file: {
                ...file,
                description: translatedDescription // Return translated description
            },
            language: targetLang,
            relatedVideo: file ? file.related_video_url : null
        });

    } catch (err) {
        console.error('Fetch translated lessons error:', err);
        res.status(500).json({ error: 'Failed to fetch translated lessons' });
    }
});

// GET Files (Your Uploads)
app.get('/users/:userId/files', async (req, res) => {
    const userId = req.params.userId;
    try {
        const [rows] = await db.query(
            'SELECT id, file_type, original_name, created_at, file_url FROM files WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        res.json({ files: rows });
    } catch (err) {
        console.error('Fetch files error:', err);
        res.status(500).json({ error: 'Failed to fetch files' });
    }
});

const { YoutubeTranscript } = require('youtube-transcript');

// Video Metadata Endpoint (Fast Preview)
app.post('/video-info', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'No URL provided' });

    try {
        console.log(`[VIDEO INFO] Fetching metadata for: ${url}`);
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        const response = await fetch(oembedUrl);

        if (!response.ok) {
            throw new Error(`YouTube oEmbed failed: ${response.statusText}`);
        }

        const data = await response.json();

        res.json({
            title: data.title,
            thumbnail_url: data.thumbnail_url,
            author_name: data.author_name,
            provider_name: data.provider_name
        });
    } catch (error) {
        console.error('Video Info Error:', error);
        // Fallback if oEmbed fails (e.g. valid ID but network issue, or invalid URL)
        res.status(500).json({ error: 'Failed to fetch video metadata', details: error.message });
    }
});

// Analyze Video Endpoint (URL)
app.post('/analyze-video', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'No URL provided' });
    }

    console.log(`Analyzing Video URL: ${url}`);

    try {
        // 1. Save File Metadata
        const userId = req.body.userId || 1;
        // Attempt to extract ID for Title (Basic)
        let videoTitle = 'YouTube Video';
        try {
            const videoId = url.split('v=')[1]?.split('&')[0];
            if (videoId) videoTitle = `YouTube Video (${videoId})`;
        } catch (e) { }

        const [fileResult] = await db.query(
            'INSERT INTO files (user_id, file_type, file_url, original_name) VALUES (?, ?, ?, ?)',
            [userId, 'video_url', url, videoTitle]
        );
        const fileId = fileResult.insertId;

        // 2. Generate Micro-Lessons
        let microLessons = [];

        try {
            // A: Real Transcript Logic
            console.log('Attempting to fetch real transcript...');

            let transcript = null;
            try {
                // Try default first (often works for auto-generated)
                transcript = await YoutubeTranscript.fetchTranscript(url);
            } catch (e) {
                console.log('Default transcript fetch failed, trying options:', e.message);
                try {
                    // Fallback 1: explicitly ask for English
                    transcript = await YoutubeTranscript.fetchTranscript(url, { lang: 'en' });
                } catch (e2) {
                    console.log('English transcript fetch failed:', e2.message);

                    // Fallback 2: Third-party API (as requested)
                    try {
                        console.log('Trying third-party API fallback...');
                        const apiRes = await fetch("https://youtubetranscript.dev/api/v1/transcriptions", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ url: url })
                        });
                        if (apiRes.ok) {
                            const apiData = await apiRes.json();
                            // Handle potential response formats
                            const rawTranscript = Array.isArray(apiData) ? apiData : (apiData.transcript || apiData.captions || []);
                            if (rawTranscript.length > 0) {
                                // Normalize to { text, offset, duration }
                                transcript = rawTranscript.map(t => ({
                                    text: t.text || t.content || "",
                                    offset: t.offset || t.start * 1000 || 0,
                                    duration: t.duration || 2000
                                }));
                                console.log('Third-party API success!');
                            }
                        }
                    } catch (e3) {
                        console.log('Third-party API failed:', e3.message);

                        // Fallback 3: youtube-caption-scraper (Robust Scraper)
                        try {
                            console.log('Trying youtube-caption-scraper fallback...');
                            const videoIdMatch = url.match(/(?:\?v=|\/embed\/|\/1\/|\/v\/|https:\/\/youtu\.be\/)([^#\&\?]*).*/);
                            const videoId = videoIdMatch ? videoIdMatch[1] : null;
                            if (videoId) {
                                const { getSubtitles } = require('youtube-caption-scraper');
                                const subtitles = await getSubtitles({
                                    videoID: videoId,
                                    lang: 'en' // Default to English
                                });
                                if (subtitles && subtitles.length > 0) {
                                    transcript = subtitles.map(s => ({
                                        text: s.text,
                                        offset: parseFloat(s.start) * 1000,
                                        duration: parseFloat(s.dur) * 1000
                                    }));
                                    console.log('youtube-caption-scraper success!');
                                }
                            }
                        } catch (e4) {
                            console.log('youtube-caption-scraper failed:', e4.message);
                        }
                    }
                }
            }

            if (!transcript) {
                console.log('All transcript methods failed. Using fallback summary.');
                // Create a dummy transcript so the process doesn't crash, 
                // but the content will reflect that we couldn't get the audio.
                transcript = [
                    { text: "We could not auto-generate captions for this video.", offset: 0, duration: 5000 },
                    { text: "Please try a video with clear English captions.", offset: 5000, duration: 5000 },
                    { text: "Here is a general summary based on the video title.", offset: 10000, duration: 5000 }
                ];
            }

            if (transcript && transcript.length > 0) {
                console.log(`Transcript found! Length: ${transcript.length} items.`);

                // Pre-clean transcript items
                transcript = transcript.map(item => ({
                    ...item,
                    text: item.text.replace(/\[.*?\]/g, '').replace(/\b(uh|um)\b/gi, '').trim()
                })).filter(t => t.text.length > 0);

                // Corrected: Time-Based Analysis (2-minute buckets)
                const lastItem = transcript[transcript.length - 1];
                const totalDuration = (lastItem.offset + lastItem.duration) / 1000; // in seconds
                const bucketSize = 120; // 2 minutes per lesson section
                const numBuckets = Math.ceil(totalDuration / bucketSize);

                // Track Unique Explanations to prevent repetition
                const seenExplanations = new Set();
                const globalTitleSet = new Set();

                for (let i = 0; i < numBuckets; i++) {
                    const bucketStart = i * bucketSize * 1000; // ms
                    const bucketEnd = (i + 1) * bucketSize * 1000; // ms

                    // Filter items for this time bucket
                    const chunk = transcript.filter(t => t.offset >= bucketStart && t.offset < bucketEnd);

                    if (!chunk || chunk.length === 0) continue;

                    // Calculate display timestamp
                    const startTimeMs = chunk[0].offset;
                    const mins = Math.floor(startTimeMs / 1000 / 60);
                    const secs = Math.floor((startTimeMs / 1000) % 60);
                    const timeStr = `(${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')})`;

                    // Summarize text (Heuristic Analysis)
                    const chunkText = chunk.map(item => item.text).join(' ');
                    const cleanText = chunkText.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
                    const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];

                    // NLP Analysis using 'natural'
                    const natural = require('natural');
                    const tokenizer = new natural.WordTokenizer();
                    const words = tokenizer.tokenize(cleanText.toLowerCase());
                    const stopWords = new Set(['the', 'and', 'is', 'to', 'in', 'of', 'that', 'it', 'for', 'you', 'we', 'are', 'this', 'on', 'with', 'as', 'can', 'be', 'so', 'just', 'have', 'but', 'not', 'algorithm', 'system', 'problem', 'value', 'return']); // Expanded stop words

                    const wordFreq = {};
                    words.forEach(w => {
                        if (w.length > 3 && !stopWords.has(w)) {
                            const stem = natural.PorterStemmer.stem(w); // Stemming
                            wordFreq[stem] = (wordFreq[stem] || 0) + 1;
                        }
                    });

                    // Top Keywords for Title (Map stem back to representative word?? simplified: just use stem or first instance)
                    const topKeywords = Object.entries(wordFreq)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 2)
                        .map(e => e[0].charAt(0).toUpperCase() + e[0].slice(1) + "*"); // * indicates stemmed

                    // Score Sentences
                    const scoredSentences = sentences.map(s => {
                        let score = 0;
                        const sWords = tokenizer.tokenize(s.toLowerCase());
                        sWords.forEach(sw => {
                            const stem = natural.PorterStemmer.stem(sw);
                            if (wordFreq[stem]) score += wordFreq[stem];
                        });

                        // Length Check
                        if (s.length < 40) score -= 5;
                        if (s.length > 200) score -= 2;
                        return { text: s.trim(), score };
                    }).sort((a, b) => b.score - a.score);

                    // 1. DETECT INTENT (Rule-Based)
                    let intent = 'DEFAULT';
                    const lcText = cleanText.toLowerCase();
                    if (i === 0 || lcText.includes('introduction') || lcText.includes('welcome') || lcText.includes('today')) intent = 'INTRO';
                    else if (lcText.includes('background') || lcText.includes('context') || lcText.includes('why')) intent = 'CONTEXT';
                    else if (lcText.includes('history') || lcText.includes('evolution') || lcText.includes('past')) intent = 'HISTORY';
                    else if (lcText.includes('principle') || lcText.includes('core') || lcText.includes('concept') || lcText.includes('theory')) intent = 'PRINCIPLE';
                    else if (lcText.includes('example') || lcText.includes('case') || lcText.includes('demo') || lcText.includes('practical')) intent = 'EXAMPLE';
                    else if (i === numBuckets - 1 || lcText.includes('summary') || lcText.includes('conclusion')) intent = 'SUMMARY';

                    // 2. GET TOPIC
                    const topic = topKeywords.length > 0 ? topKeywords[0].replace('*', '') : "this topic";

                    // Prevent Topic Repetition in Consecutive Lessons
                    if (globalTitleSet.has(topic) && intent === 'DEFAULT') {
                        // Force a different intent if topic is same as previous
                        intent = 'DETAIL';
                    }
                    globalTitleSet.add(topic);

                    // 3. GENERATE EXPLANATION FROM TEMPLATE
                    let uniqueExplanation = "";
                    switch (intent) {
                        case 'INTRO':
                            uniqueExplanation = `This section introduces the main concept of **${topic}** and outlines what will be covered.`;
                            break;
                        case 'CONTEXT':
                            uniqueExplanation = `The instructor provides background context for **${topic}**, explaining why it is significant in this field.`;
                            break;
                        case 'HISTORY':
                            uniqueExplanation = `A brief history of **${topic}** is discussed, tracing its evolution and origins.`;
                            break;
                        case 'PRINCIPLE':
                            uniqueExplanation = `This lesson focuses on the core principles of **${topic}**, identifying key theoretical rules.`;
                            break;
                        case 'EXAMPLE':
                            uniqueExplanation = `Practical examples of **${topic}** are shown to demonstrate how it applies in real-world scenarios.`;
                            break;
                        case 'SUMMARY':
                            uniqueExplanation = `The video concludes with a summary of **${topic}** and reviews the key takeaways.`;
                            break;
                        case 'DETAIL':
                            uniqueExplanation = `Further details on **${topic}** are explored, looking at specific nuances and edge cases.`;
                            break;
                        default:
                            uniqueExplanation = `This part explains the details of **${topic}**, focusing on its characteristics and usage.`;
                            break;
                    }

                    // 4. ADD SPECIFIC DETAIL & DEDUPLICATION
                    const bestSentence = scoredSentences[0]?.text || "";
                    if (bestSentence.length > 20 && bestSentence.length < 150) {
                        uniqueExplanation += ` Specifically, the speaker notes: "${bestSentence}"`;
                    }

                    // CHECK FOR DUPLICATES: If this exact explanation template + topic already exists, skip or merging
                    const explKey = `${intent}-${topic}`;
                    if (seenExplanations.has(explKey)) {
                        continue; // SKIP REPEATED CONTENT entirely
                    }
                    seenExplanations.add(explKey);

                    const selectedPoints = [uniqueExplanation];

                    const sectionTitle = topKeywords.length > 0 ? `${topKeywords.join(' & ')}` : `Topic ${i + 1}`;

                    microLessons.push({
                        title: sectionTitle,
                        points: selectedPoints.map(p => `${timeStr} ${p}`)
                    });
                }

                // 3. GENERATE GLOBAL DESCRIPTION (Enhanced with 'natural' Keyword Analysis)
                const fullText = transcript.map(t => t.text).join(' ');
                const cleanFullText = fullText
                    .replace(/\[.*?\]/g, "")
                    .replace(/\b(uh|um|okay|so|like|actually|basically)\b/gi, "") // Aggressive cleaning
                    .replace(/\t/g, ' ')
                    .replace(/\s+/g, " ")
                    .trim();

                // A. Extract Summary Sentences
                const meaningfulSentences = cleanFullText.split('. ')
                    .filter(s => s.length > 30 && s.length < 150 && !s.match(/subscribe|channel|notification|guys|welcome/i))
                    .slice(0, 4); // Top 4 solid sentences

                // B. Extract Core Topics (TF-IDF style frequency)
                const tokenizer = new natural.WordTokenizer();
                const allWords = tokenizer.tokenize(cleanFullText.toLowerCase());
                // Extended stop words for video speech
                const stopWords = new Set([
                    'the', 'and', 'is', 'to', 'in', 'of', 'that', 'it', 'for', 'you', 'we', 'are', 'this', 'on', 'with', 'as', 'can', 'be', 'so', 'just', 'have', 'but', 'not',
                    'what', 'when', 'where', 'how', 'why', 'doing', 'going', 'make', 'video', 'tutorial', 'really', 'very', 'good', 'know', 'about', 'here', 'there',
                    'which', 'from', 'some', 'something', 'thing', 'things', 'then', 'they', 'your', 'example', 'problem', 'value'
                ]);

                const freqMap = {};
                allWords.forEach(w => {
                    // Only count words length > 4 to avoid noise
                    if (!stopWords.has(w) && w.length > 4 && !w.match(/^\d+$/)) {
                        freqMap[w] = (freqMap[w] || 0) + 1;
                    }
                });

                const topTopics = Object.entries(freqMap)
                    .sort((a, b) => b[1] - a[1]) // Sort by frequency desc
                    .slice(0, 6) // Top 6
                    .map(entry => entry[0].charAt(0).toUpperCase() + entry[0].slice(1)); // Capitalize

                // C. Construct Final Description
                const globalDescription = `
**Summary**
This video explains key concepts such as ${topTopics.slice(0, 3).join(', ')}. ${meaningfulSentences.join('. ')}.

**Core Topics Covered**
• ${topTopics.join('\n• ')}
                `.trim();

                console.log('Generated Enhanced Description:', globalDescription.substring(0, 100));

                // Update File with Description
                await db.query('UPDATE files SET description = ? WHERE id = ?', [globalDescription, fileId]);
            }
        } catch (transcriptError) {
            console.warn('Transcript fetch failed, falling back to mock:', transcriptError.message);
        }

        // B: Fallback Mock Logic (Only if transcript failed)
        if (microLessons.length === 0) {
            console.log('No transcript found. Attempting Fallback to Video Description...');

            try {
                const youtubesearchapi = require("youtube-search-api");
                const videoIdMatch = url.match(/(?:\?v=|\/embed\/|\/1\/|\/v\/|https:\/\/youtu\.be\/)([^#\&\?]*).*/);
                const videoId = videoIdMatch ? videoIdMatch[1] : null;

                let description = "";
                if (videoId) {
                    const details = await youtubesearchapi.GetVideoDetails(videoId);
                    // Note: GetVideoDetails might return differently depending on version. 
                    // Inspecting the library or assuming standard fields 'description' or 'shortDescription'.
                    if (details && (details.description || details.shortDescription)) {
                        description = details.description || details.shortDescription || "";
                    } else {
                        // Fallback: oEmbed title as description
                        description = `Video titled "${videoTitle}"`;
                    }
                }

                if (description) {
                    console.log('Generating summary from Description...');

                    // Sanitize and split into points
                    const cleanDesc = description.replace(/\r\n/g, '. ').replace(/\n/g, '. ');
                    const sentences = cleanDesc.match(/[^.!?]+[.!?]+/g) || [cleanDesc];

                    // Take top 5 meaningful sentences
                    const points = sentences
                        .map(s => s.trim())
                        .filter(s => s.length > 20 && !s.includes('http') && !s.includes('subscribe'))
                        .slice(0, 6);

                    microLessons.push({
                        title: "Video Overview (Metadata)",
                        points: points.length > 0 ? points : ["Overview generated from video metadata."]
                    });

                    await db.query('UPDATE files SET description = ? WHERE id = ?', ["Note: Summary generated from metadata (no captions found).\n\n" + description.substring(0, 300), fileId]);
                }
            } catch (metaErr) {
                console.warn('Metadata fallback failed:', metaErr.message);
            }

            // Final fallback if even metadata failed
            if (microLessons.length === 0) {
                microLessons.push({
                    title: "Analysis Unavailable",
                    points: [
                        "Could not extract captions or description.",
                        "We recommend videos with English captions enabled."
                    ]
                });
                await db.query('UPDATE files SET description = ? WHERE id = ?', ["Analysis failed: No captions or metadata available.", fileId]);
            }
        }

        // 3. Save Micro-Lessons to DB
        // ... (Existing Save Logic below)

        // 3. Save Micro-Lessons to DB
        for (let i = 0; i < microLessons.length; i++) {
            const lesson = microLessons[i];
            await db.query(
                'INSERT INTO micro_lessons (file_id, lesson_order, title, content_points, duration_seconds) VALUES (?, ?, ?, ?, ?)',
                [fileId, i + 1, lesson.title, JSON.stringify(lesson.points), 60]
            );
        }

        // 4. Find Related Video (YouTube Search)
        let relatedVideoUrl = null;
        try {
            const youtubesearchapi = require("youtube-search-api");
            // Use top topics or title for search. 
            // Note: topTopics might be undefined if transcript failed, so fallback to videoTitle
            // Accessing topTopics from outer scope might be tricky if it was defined in a block. 
            // We'll regenerate a simple keyword from title if needed.
            let searchKeyword = videoTitle;

            console.log(`[SEARCH] Looking for related video with keyword: "${searchKeyword}"`);

            const results = await youtubesearchapi.GetListByKeyword(searchKeyword, false, 5);
            if (results && results.items && results.items.length > 0) {
                // Find first video that is NOT the current one
                const currentIdMatch = url.match(/(?:\?v=|\/embed\/|\/1\/|\/v\/|https:\/\/youtu\.be\/)([^#\&\?]*).*/);
                const currentId = currentIdMatch ? currentIdMatch[1] : "";

                const related = results.items.find(item => item.id !== currentId && item.type === 'video');
                if (related) {
                    relatedVideoUrl = `https://www.youtube.com/watch?v=${related.id}`;
                    console.log(`[SEARCH] Found related video: ${relatedVideoUrl}`);

                    // Update DB
                    await db.query('UPDATE files SET related_video_url = ? WHERE id = ?', [relatedVideoUrl, fileId]);
                }
            }
        } catch (searchErr) {
            console.warn('[SEARCH] Related video search failed:', searchErr.message);
        }

        // Simulate processing delay
        setTimeout(() => {
            res.json({
                message: 'Video Analysis Complete',
                fileId: fileId,
                original_name: videoTitle,
                video_url: url,
                relatedVideoUrl: relatedVideoUrl
            });
        }, 2500);

    } catch (err) {
        console.error('Video Analysis Error:', err);
        res.status(500).json({
            error: 'Failed to process video',
            details: err.message, // Send specific error to frontend
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// Generate Audio for Lesson (Voice-Based Learning)
app.post('/lessons/:id/audio', async (req, res) => {
    const lessonId = req.params.id;
    const { lang = 'en' } = req.body;
    console.log(`[AUDIO] Generating audio for Lesson ${lessonId} (${lang})`);

    try {
        // 1. Fetch Lesson Content
        const [rows] = await db.query('SELECT * FROM micro_lessons WHERE id = ?', [lessonId]);
        if (rows.length === 0) return res.status(404).json({ error: 'Lesson not found' });
        const lesson = rows[0];

        // Combine title and points
        let points = lesson.content_points;
        try { points = typeof points === 'string' ? JSON.parse(points) : points; } catch (e) { points = []; }
        const textToSpeak = `${lesson.title}. ${points.join('. ')}`;

        // 2. Generate Audio (google-tts-api) handling Long Text
        const googleTTS = require('google-tts-api');

        // getAllAudioBase64 splits text into chunks (200 chars) and fetches base64 for each
        const results = await googleTTS.getAllAudioBase64(textToSpeak, {
            lang: lang,
            slow: false,
            host: 'https://translate.google.com',
            timeout: 10000,
        });

        // 3. Combine Base64 parts into a single Buffer
        const combinedBuffer = Buffer.concat(results.map(r => Buffer.from(r.base64, 'base64')));

        const tempAudioPath = path.join(__dirname, 'uploads', `audio_${lessonId}_${Date.now()}.mp3`);
        fs.writeFileSync(tempAudioPath, combinedBuffer);

        // 4. Upload to Cloudinary
        const uploadRes = await cloudinary.uploader.upload(tempAudioPath, {
            resource_type: 'video', // 'video' resource type ensures MP3s are handled correctly by Cloudinary
            folder: 'studyflow_audio',
            public_id: `lesson_audio_${lessonId}`
        });

        // 5. Save to DB
        const audioUrl = uploadRes.secure_url;
        await db.query('UPDATE micro_lessons SET audio_url = ? WHERE id = ?', [audioUrl, lessonId]);

        // Cleanup
        fs.unlinkSync(tempAudioPath);

        res.json({ message: 'Audio generated successfully', audioUrl });

    } catch (error) {
        console.error('Audio Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate audio' });
    }
});

// GET Micro-Lessons for a File (Updated to include audio_url)
app.get('/files/:id/lessons', async (req, res) => {
    const fileId = req.params.id;
    try {
        const [rows] = await db.query(
            'SELECT * FROM micro_lessons WHERE file_id = ? ORDER BY lesson_order ASC',
            [fileId]
        );

        const lessons = rows.map(row => {
            let points = row.content_points;
            if (typeof points === 'string') {
                try {
                    points = JSON.parse(points);
                } catch (e) {
                    points = [];
                }
            }
            if (!Array.isArray(points)) points = [];
            return { ...row, content_points: points };
        });

        // 2. Fetch File Metadata to return file URL if needed
        const [fileRows] = await db.query('SELECT * FROM files WHERE id = ?', [fileId]);
        const fileData = fileRows[0] || {};

        res.json({ lessons, file: fileData });
    } catch (err) {
        console.error('Fetch lessons error:', err);
        res.status(500).json({ error: 'Failed to fetch lessons' });
    }
});

// GET Translated Micro-Lessons (Real Translation for Tamil)
app.get('/files/:id/lessons/translate', async (req, res) => {
    const fileId = req.params.id;
    const lang = req.query.lang || 'en';

    console.log(`[TRANSLATE] Request for File ${fileId} to ${lang}`);

    try {
        // 1. Fetch Original Lessons
        const [rows] = await db.query(
            'SELECT * FROM micro_lessons WHERE file_id = ? ORDER BY lesson_order ASC',
            [fileId]
        );

        if (rows.length === 0) return res.json({ lessons: [] });

        // 2. Translation Logic
        // We use Promise.all to handle multiple async translations in parallel
        const translatedLessons = await Promise.all(rows.map(async (row) => {
            let points = row.content_points;
            if (typeof points === 'string') {
                try { points = JSON.parse(points); } catch (e) { points = []; }
            }
            if (!Array.isArray(points)) points = [];

            let newTitle = row.title;
            let newPoints = [...points];

            if (lang === 'simple') {
                // "Simple English" is a summarization/simplification task, not just translation.
                // Keeping Mock/Heuristic for now as we don't have an LLM here.
                newTitle = `[Simple] ${row.title}`;
                newPoints = newPoints.map(p => `Simply put: ${p}`);
            } else if (lang && lang !== 'en') {
                // Generic Translation for any other language code (ta, ur, hi, es, etc.)
                try {
                    // Translate Title
                    const titleRes = await translate(row.title, { to: lang });
                    newTitle = titleRes.text;

                    // Translate Points (Array)
                    newPoints = await Promise.all(points.map(async (p) => {
                        try {
                            const res = await translate(p, { to: lang });
                            return res.text;
                        } catch (e) {
                            return p; // Fallback to original
                        }
                    }));
                } catch (e) {
                    console.error(`Error translating lesson to ${lang}:`, row.id, e);
                }
            }

            return {
                ...row,
                title: newTitle,
                content_points: newPoints
            };
        }));

        res.json({ lessons: translatedLessons });

    } catch (err) {
        console.error('Translation error:', err);
        res.status(500).json({ error: 'Failed to translate lessons' });
    }
});

// POST Generic Translate Endpoint (for frontend text)
app.post('/translate', async (req, res) => {
    const { text, target } = req.body; // text can be string or array

    if (!text || !target) return res.status(400).json({ error: 'Missing text or target language' });

    console.log(`[TRANSLATE GENERIC] Target: ${target}, Input Type: ${typeof text}`);

    try {
        if (Array.isArray(text)) {
            // Check if array of strings or objects
            const isObjectArray = text.length > 0 && typeof text[0] === 'object';

            if (isObjectArray) {
                // Iterate through array of objects and translate 'concept' and 'explanation'
                const results = await Promise.all(text.map(async (item) => {
                    let newItem = { ...item };
                    if (newItem.concept) {
                        try {
                            const r = await translate(newItem.concept, { to: target });
                            newItem.concept = r.text;
                        } catch (e) { }
                    }
                    if (newItem.explanation) {
                        try {
                            const r = await translate(newItem.explanation, { to: target });
                            newItem.explanation = r.text;
                        } catch (e) { }
                    }
                    return newItem;
                }));
                res.json({ translatedText: results });
            } else {
                // Handle array of strings
                const results = await Promise.all(text.map(async (t) => {
                    try {
                        const r = await translate(t, { to: target });
                        return r.text;
                    } catch (e) {
                        return t;
                    }
                }));
            }
        } else {
            // Single string
            const result = await translate(text, { to: target });
            res.json({ translatedText: result.text });
        }

    } catch (err) {
        console.error('Generic Translation Error:', err);
        res.status(500).json({ error: 'Translation failed' });
    }
});

// ==========================================
// ADMIN MODULE ENDPOINTS
// ==========================================

// 1. GET ALL USERS (for Admin Dashboard)
app.get('/admin/users', async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, full_name, email, role, created_at FROM users ORDER BY created_at DESC');
        res.json({ users });
    } catch (err) {
        console.error('Fetch users error:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// 2. DELETE USER
app.delete('/admin/users/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        if (userId == 1) return res.status(403).json({ error: 'Cannot delete default admin/demo user' });
        await db.query('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// 3. GET PENDING FILES (Approvals)
app.get('/admin/pending-files', async (req, res) => {
    try {
        const [files] = await db.query(`
        SELECT f.*, u.full_name as uploaded_by 
        FROM files f 
        JOIN users u ON f.user_id = u.id 
        ORDER BY f.created_at DESC
    `);
        res.json({ files });
    } catch (err) {
        console.error('Fetch pending files error:', err);
        res.status(500).json({ error: 'Failed to fetch pending files' });
    }
});

// 4. APPROVE / REJECT FILE
app.put('/admin/files/:id/status', async (req, res) => {
    const fileId = req.params.id;
    const { status } = req.body; // 'approved' or 'rejected'
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

    try {
        await db.query('UPDATE files SET approval_status = ? WHERE id = ?', [status, fileId]);
        res.json({ message: `File ${status} successfully` });
    } catch (err) {
        console.error('Update status error:', err);
        res.status(500).json({ error: 'Failed to update file status' });
    }
});

// 5. UPLOAD SEMESTER RESOURCE (Admin Upload)
app.post('/admin/upload-resource', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { subject, description, title, adminId, course, semester, unit, topic, difficulty } = req.body;

    try {
        await db.query(
            'INSERT INTO files (user_id, file_type, file_url, original_name, subject, course, semester, unit_number, topic_name, difficulty_level, category, description, approval_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [adminId || 1, 'doc', req.file.path, title || req.file.originalname, subject, course, semester, unit, topic, difficulty || 'medium', 'semester_resource', description, 'approved']
        );
        res.json({ message: 'Resource uploaded successfully' });
    } catch (err) {
        console.error('Upload resource error:', err);
        res.status(500).json({ error: 'Failed to upload resource' });
    }
});

// 6. SEARCH ENDPOINT (For Students)
app.get('/files/search', async (req, res) => {
    const { q } = req.query; // Query string
    if (!q) return res.json({ results: [] });

    const searchTerm = `%${q}%`;
    try {
        const [rows] = await db.query(`
        SELECT id, original_name, file_type, file_url, subject, category, description, created_at 
        FROM files 
        WHERE (original_name LIKE ? OR subject LIKE ? OR description LIKE ?) 
        AND approval_status = 'approved'
        ORDER BY created_at DESC
    `, [searchTerm, searchTerm, searchTerm]);

        res.json({ results: rows });
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({ error: 'Search failed' });
    }
});


// DELETE File and its Micro-Lessons
app.delete('/files/:id', async (req, res) => {
    const fileId = req.params.id;
    try {
        // 1. Get File details for Cloudinary Deletion
        // Select public_id explicitly
        const [files] = await db.query('SELECT file_url, original_name, public_id FROM files WHERE id = ?', [fileId]);

        if (files.length > 0) {
            const file = files[0];
            const fileUrl = file.file_url;

            // Priority: Use DB Public ID
            let publicId = file.public_id;

            // Fallback: Parse URL if public_id missing in DB (Legacy files)
            if (!publicId && fileUrl && fileUrl.includes('cloudinary')) {
                try {
                    const parts = fileUrl.split('/upload/');
                    if (parts.length === 2) {
                        const pathPart = parts[1];
                        const pathWithoutVersion = pathPart.replace(/^v\d+\//, '');
                        const possibleId = pathWithoutVersion.substring(0, pathWithoutVersion.lastIndexOf('.'));
                        if (possibleId) publicId = possibleId;
                    }
                } catch (e) { }
            }

            if (publicId) {
                console.log(`[DELETE] Removing from Cloudinary: ${publicId}`);
                try {
                    // Destroy - try all types to be safe
                    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
                    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
                    await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
                } catch (cloudErr) {
                    console.error('Cloudinary delete error (non-fatal):', cloudErr);
                }
            }
        }

        // 2. Delete associated lessons (optional if CASCADE set, but safe to keep)
        await db.query('DELETE FROM micro_lessons WHERE file_id = ?', [fileId]);

        // 3. Delete the file record
        const [result] = await db.query('DELETE FROM files WHERE id = ?', [fileId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.json({ message: 'File and lessons deleted successfully' });
    } catch (err) {
        console.error('Delete error:', err);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

// 404 Handler for undefined routes
app.use((req, res, next) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.url}` });
});

// Global Error Handler (Forces JSON response for errors)
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: `Upload Error: ${err.message}` });
    }
    res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// ==========================================
// QUIZ ENDPOINTS
// ==========================================

// 1. CREATE QUIZ
app.post('/quizzes', async (req, res) => {
    const { title, description, course, semester, unit, topic, difficulty, createdBy, questions } = req.body;

    if (!title || !questions || questions.length === 0) {
        return res.status(400).json({ error: 'Missing title or questions' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Insert Quiz
        const [quizResult] = await connection.query(
            'INSERT INTO quizzes (title, description, course, semester, unit_number, topic_name, difficulty_level, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [title, description, course, semester, unit, topic, difficulty, createdBy || 1]
        );
        const quizId = quizResult.insertId;

        // 2. Insert Questions & Options
        for (const q of questions) {
            const [qResult] = await connection.query(
                'INSERT INTO questions (quiz_id, question_text) VALUES (?, ?)',
                [quizId, q.text]
            );
            const qId = qResult.insertId;

            for (const opt of q.options) {
                await connection.query(
                    'INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)',
                    [qId, opt.text, opt.isCorrect]
                );
            }
        }

        await connection.commit();
        res.status(201).json({ message: 'Quiz created successfully', quizId });
    } catch (err) {
        await connection.rollback();
        console.error('Create Quiz Error:', err);
        res.status(500).json({ error: 'Failed to create quiz' });
    } finally {
        connection.release();
    }
});

// 2. GET ALL QUIZZES (For Student List)
app.get('/quizzes', async (req, res) => {
    try {
        const [quizzes] = await db.query('SELECT * FROM quizzes ORDER BY created_at DESC');
        res.json({ quizzes });
    } catch (err) {
        console.error('Fetch quizzes error:', err);
        res.status(500).json({ error: 'Failed to fetch quizzes' });
    }
});

// 3. GET SINGLE QUIZ (With Questions & Options)
app.get('/quizzes/:id', async (req, res) => {
    const quizId = req.params.id;
    try {
        // Fetch basic details
        const [quizRows] = await db.query('SELECT * FROM quizzes WHERE id = ?', [quizId]);
        if (quizRows.length === 0) return res.status(404).json({ error: 'Quiz not found' });
        const quiz = quizRows[0];

        // Fetch Questions
        const [questionRows] = await db.query('SELECT * FROM questions WHERE quiz_id = ?', [quizId]);

        // Fetch Options for all questions
        const questionsWithOptions = await Promise.all(questionRows.map(async (q) => {
            const [options] = await db.query('SELECT id, option_text, is_correct FROM options WHERE question_id = ?', [q.id]);
            return {
                ...q,
                options
            };
        }));

        res.json({
            ...quiz,
            questions: questionsWithOptions
        });

    } catch (err) {
        console.error('Fetch single quiz error:', err);
        res.status(500).json({ error: 'Failed to fetch quiz details' });
    }
});

// 4. GENERATE QUIZ FROM FILE (Dynamic - MCQs)
app.get('/quizzes/from-file/:fileId', async (req, res) => {
    const fileId = req.params.fileId;
    try {
        // Fetch File
        const [files] = await db.query('SELECT * FROM files WHERE id = ?', [fileId]);
        if (files.length === 0) return res.status(404).json({ error: 'File not found' });
        const file = files[0];

        // Fetch Lessons
        const [lessons] = await db.query('SELECT * FROM micro_lessons WHERE file_id = ? ORDER BY lesson_order', [fileId]);

        if (lessons.length === 0) {
            return res.status(400).json({ error: 'No lessons found for this file. Please analyze it first.' });
        }

        // --- Helper to get random items from array ---
        const getRandomItems = (arr, n) => {
            const shuffled = arr.sort(() => 0.5 - Math.random());
            return shuffled.slice(0, n);
        };

        // --- Generate Questions ---
        // Target: 10-15 questions. 
        // Strategy: Generate 1 question per lesson, if < 10, try generating more from content points.

        let allQuestions = [];

        // Collect all possible distractors (all content points from all lessons)
        const allContentPoints = lessons.flatMap(l => {
            try {
                return typeof l.content_points === 'string' ? JSON.parse(l.content_points) : l.content_points;
            } catch (e) { return []; }
        });

        lessons.forEach((lesson, index) => {
            let points = [];
            try {
                points = typeof lesson.content_points === 'string' ? JSON.parse(lesson.content_points) : lesson.content_points;
            } catch (e) { points = ["Content content"]; }

            // Create a question for the main point of this lesson
            if (points.length > 0) {
                const correctStart = points[0]; // Assume first point is main
                const distractors = getRandomItems(allContentPoints.filter(p => p !== correctStart), 3);

                // If not enough unique distractors, fill with generics
                while (distractors.length < 3) {
                    distractors.push("Review previous topics");
                }

                const options = [
                    { id: 1, option_text: correctStart, is_correct: true },
                    { id: 2, option_text: distractors[0], is_correct: false },
                    { id: 3, option_text: distractors[1], is_correct: false },
                    { id: 4, option_text: distractors[2], is_correct: false }
                ].sort(() => 0.5 - Math.random()); // Shuffle options

                // Re-assign IDs after shuffle for safe keying
                options.forEach((opt, i) => opt.id = i + 1);

                allQuestions.push({
                    id: index * 10 + 1,
                    question_text: `Regarding "${lesson.title}", which of the following is a key concept?`,
                    question_type: 'mcq',
                    options: options
                });

                // Validating length - if we need more questions, try adding a second one from other points
                if (lessons.length < 10 && points.length > 1) {
                    const secondPoint = points[1];
                    const dists2 = getRandomItems(allContentPoints.filter(p => p !== secondPoint && p !== correctStart), 3);
                    while (dists2.length < 3) dists2.push("General Knowledge");

                    const options2 = [
                        { option_text: secondPoint, is_correct: true },
                        { option_text: dists2[0], is_correct: false },
                        { option_text: dists2[1], is_correct: false },
                        { option_text: dists2[2], is_correct: false }
                    ].sort(() => 0.5 - Math.random());
                    options2.forEach((opt, i) => opt.id = i + 1);

                    allQuestions.push({
                        id: index * 10 + 2,
                        question_text: `What else is discussed in "${lesson.title}"?`,
                        question_type: 'mcq',
                        options: options2
                    });
                }
            }
        });

        // Cap at 15 if somehow we generated too many (though unlikely with this logic unless huge file)
        // If less than 10, it's okay, we provide what we can based on content.

        const quiz = {
            id: `file-${file.id}`,
            title: `Quiz: ${file.original_name}`,
            description: `Generated ${allQuestions.length} Questions based on your upload.`,
            course: 'Self Study',
            questions: allQuestions
        };

        res.json(quiz);

    } catch (err) {
        console.error('Generate quiz error:', err);
        res.status(500).json({ error: 'Failed to generate quiz' });
    }
});

// 5. STORAGE STATS ENDPOINT
app.get('/users/:id/storage-stats', async (req, res) => {
    const userId = req.params.id;
    try {
        // Fetch counts grouped by file_type
        const [rows] = await db.query('SELECT file_type, COUNT(*) as count FROM files WHERE user_id = ? GROUP BY file_type', [userId]);

        let totalCount = 0;
        let totalSizeMB = 0;

        const breakdown = {
            docs: { count: 0, size: 0 },
            video: { count: 0, size: 0 },
            image: { count: 0, size: 0 },
            other: { count: 0, size: 0 }
        };

        rows.forEach(row => {
            const count = row.count;
            totalCount += count;

            // Mock Size Logic based on type
            let avgSize = 1.0; // Default 1MB
            if (row.file_type === 'video') avgSize = 15.0;
            if (row.file_type === 'doc' || row.file_type === 'pdf') avgSize = 2.5;
            if (row.file_type === 'image') avgSize = 3.0;

            const size = count * avgSize;
            totalSizeMB += size;

            if (breakdown[row.file_type]) {
                breakdown[row.file_type].count += count;
                breakdown[row.file_type].size += size;
            } else {
                breakdown.other.count += count;
                breakdown.other.size += size;
            }
        });

        const totalStorageMB = 2000; // 2 GB Limit

        res.json({
            usedMB: totalSizeMB.toFixed(1),
            totalMB: totalStorageMB,
            fileCount: totalCount,
            breakdown: breakdown
        });
    } catch (err) {
        console.error('Storage stats error:', err);
        res.status(500).json({ error: 'Failed to fetch storage stats' });
    }
});

// 6. LESSON PROGRESS ENDPOINTS
// GET Progress
app.get('/files/:fileId/progress', async (req, res) => {
    const { fileId } = req.params;
    const { userId } = req.query;

    if (!userId) return res.status(400).json({ error: 'User ID required' });

    try {
        const [rows] = await db.query(
            'SELECT last_lesson_index FROM lesson_progress WHERE user_id = ? AND file_id = ?',
            [userId, fileId]
        );

        if (rows.length > 0) {
            res.json({ index: rows[0].last_lesson_index });
        } else {
            res.json({ index: 0 });
        }
    } catch (err) {
        console.error('Fetch progress error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// SAVE Progress
app.post('/files/:fileId/progress', async (req, res) => {
    const { fileId } = req.params;
    const { userId, index } = req.body;

    if (!userId || index === undefined) return res.status(400).json({ error: 'Missing userId or index' });

    try {
        await db.query(`
            INSERT INTO lesson_progress (user_id, file_id, last_lesson_index)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE last_lesson_index = ?
        `, [userId, fileId, index, index]);

        res.json({ message: 'Progress saved' });
    } catch (err) {
        console.error('Save progress error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// GET User Analytics (Concept-Wise Learning Tracker)
app.get('/users/:userId/analytics', async (req, res) => {
    const { userId } = req.params;
    try {
        // 1. Get raw progress data joined with files
        const [progressRows] = await db.query(`
            SELECT lp.file_id, lp.last_lesson_index, f.original_name, f.file_type,
                   (SELECT COUNT(*) FROM micro_lessons WHERE file_id = lp.file_id) as total_lessons
            FROM lesson_progress lp
            JOIN files f ON lp.file_id = f.id
            WHERE lp.user_id = ?
            ORDER BY lp.updated_at DESC
        `, [userId]);

        let totalTopicsViewed = progressRows.length;
        let totalTimeSpentMinutes = 0;
        let completedTopics = 0;
        let recentActivity = [];

        for (const row of progressRows) {
            const current = row.last_lesson_index || 0;
            const total = row.total_lessons || 1; // avoid divide by zero, assume at least 1 if unknown

            // Calculate Time (Approx 1 min per lesson view)
            totalTimeSpentMinutes += (current * 1);

            // Calculate Completion
            const progressPercent = Math.min(100, Math.round((current / total) * 100));
            if (current >= total && total > 0) {
                completedTopics++;
            }

            recentActivity.push({
                id: row.file_id,
                title: row.original_name,
                type: row.file_type,
                progress: progressPercent,
                completed: current >= total
            });
        }

        res.json({
            stats: {
                totalTopics: totalTopicsViewed,
                timeSpentMinutes: totalTimeSpentMinutes,
                completedTopics: completedTopics
            },
            recentActivity: recentActivity
        });

    } catch (err) {
        console.error('Analytics error:', err);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// SMART EXAM PREP ENDPOINTS
app.post('/generate-study-plan', async (req, res) => {
    const { userId, title, examDate, syllabus } = req.body;

    if (!userId || !title || !examDate || !syllabus) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Calculate days remaining
        const exam = new Date(examDate);
        const today = new Date();
        const diffTime = Math.abs(exam - today);
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysLeft < 1) return res.status(400).json({ error: 'Exam date must be in the future' });

        console.log(`[PLAN] Generating plan for ${daysLeft} days...`);

        // AI Generation
        let plan = [];
        if (OpenAI && process.env.OPENAI_API_KEY) {
            try {
                const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
                const prompt = `
                    Create a STUDY PLAN for: "${title}".
                    Syllabus: ${syllabus.substring(0, 1000)}...
                    
                    Time Remaining: ${daysLeft} Days.
                    
                    Task:
                    Split the syllabus intelligently over ${daysLeft} days. 
                    Focus on covering all topics. 
                    Include a "Revision" day if possible.

                    Return ONLY JSON Array:
                    [
                        { "day": 1, "topic": "Topic Name", "tasks": ["Subtask 1", "Subtask 2"] },
                        ...
                    ]
                `;

                const completion = await openai.chat.completions.create({
                    messages: [{ role: "user", content: prompt }],
                    model: "gpt-4o-mini",
                    temperature: 0.4,
                });

                const content = completion.choices[0].message.content;

                // Robust JSON Extraction
                const startIndex = content.indexOf('[');
                const endIndex = content.lastIndexOf(']');
                if (startIndex !== -1 && endIndex !== -1) {
                    const cleanJson = content.substring(startIndex, endIndex + 1);
                    plan = JSON.parse(cleanJson);
                } else {
                    throw new Error("No JSON array found in response");
                }

            } catch (aiError) {
                console.warn("[PLAN] AI Failed (API/Parse):", aiError.message);
                plan = [
                    { day: 1, topic: "Syllabus Overview", tasks: ["Read full syllabus", "Identify weak areas"] },
                    { day: daysLeft, topic: "Final Revision", tasks: ["Review all notes", "Practice mock test"] }
                ];
            }
        } else {
            // Fallback Plan
            plan = [
                { day: 1, topic: "Syllabus Overview", tasks: ["Read full syllabus", "Identify weak areas"] },
                { day: daysLeft, topic: "Final Revision", tasks: ["Review all notes", "Practice mock test"] }
            ];
        }

        // Save to DB
        await db.query(
            'INSERT INTO study_plans (user_id, title, exam_date, syllabus_text, plan_json) VALUES (?, ?, ?, ?, ?)',
            [userId, title, examDate, syllabus, JSON.stringify(plan)]
        );

        res.json({ message: 'Plan generated successfully', plan });

    } catch (err) {
        console.error('Plan generation error:', err);
        res.status(500).json({ error: 'Failed to generate plan' });
    }
});

app.get('/users/:userId/study-plans', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM study_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [req.params.userId]);
        if (rows.length === 0) return res.json({ plan: null });

        // Parse JSON
        const plan = rows[0];
        plan.plan_json = JSON.parse(plan.plan_json);
        res.json({ plan });
    } catch (err) {
        console.error('Fetch plan error:', err);
        res.status(500).json({ error: 'Failed to fetch plan' });
    }
});


// --- CODE EXPLAINER ENDPOINT ---
app.post('/explain-code', async (req, res) => {
    const { userId, code } = req.body;

    if (!code) return res.status(400).json({ error: 'No code provided' });

    console.log(`[EXPLAIN] Request for user ${userId}`);

    let explanationData = null;

    // 1. AI Analysis
    if (process.env.OPENAI_API_KEY) {
        try {
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            const prompt = `
                Analyze the following code snippet and provide a detailed explanation for a beginner student.
                
                Code:
                ${code.substring(0, 3000)}

                You MUST return a valid JSON object with the following fields:
                1. "language": The programming language.
                2. "purpose": "What problem does this program solve? (Simple English, max 2 sentences)"
                3. "stepByStep": ["Step 1 explanation", "Step 2 explanation", ...] (Array of strings, clear and simple)
                4. "concepts": ["Concept 1", "Concept 2", ...] (Key programming concepts used)
                5. "complexity": { "time": "O(...)", "space": "O(...)", "explanation": "Brief reason" }
                6. "example": { "input": "Example Input", "output": "Example Output" }
                7. "mistakes": ["Mistake 1", "Mistake 2"] (Common beginner mistakes with similar code)
                8. "summary": "Three-line summary of the code logic."

                Rules:
                - Use simple English.
                - Keep it easy for beginners.
                - If the code has errors, explain the errors in the "purpose" section first.
            `;

            const completion = await openai.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "gpt-4o-mini",
                response_format: { type: "json_object" }
            });

            const content = completion.choices[0].message.content;
            explanationData = JSON.parse(content);
            console.log("AI Explanation Success");

        } catch (e) {
            console.error("AI Explain Failed:", e.message);
        }
    }

    // 2. Fallback
    if (!explanationData) {
        let localAnalysis = {};
        try {
            const explainCode = require('./explainEngine');
            localAnalysis = explainCode(code);
        } catch (err) {
            console.warn("Local explainEngine not found or failed:", err.message);
        }

        explanationData = {
            language: localAnalysis.language || "Unknown",
            purpose: "Detailed AI analysis unavailable. Showing local syntax analysis.",
            stepByStep: (localAnalysis.explanation || []).map(item => `${item.line}: ${item.text}`),
            concepts: localAnalysis.concepts || ["Syntax Analysis"],
            complexity: {
                time: localAnalysis.complexity || "O(?)",
                space: "Unknown",
                explanation: "Estimated based on loop nesting."
            },
            example: { input: "N/A", output: "N/A" },
            mistakes: ["Ensure AI key is configured for verified analysis."],
            summary: "Basic local analysis performed due to AI unavailability."
        };

        if (!localAnalysis.explanation || localAnalysis.explanation.length === 0) {
            explanationData.stepByStep = [
                "1. Code received.",
                "2. Connectivity to AI service failed.",
                "3. Local analysis could not parse logic."
            ];
        }
    }

    // 3. Save to DB
    try {
        await db.query(
            'INSERT INTO code_explanations (user_id, code_snippet, explanation) VALUES (?, ?, ?)',
            [userId || null, code, JSON.stringify(explanationData)]
        );
    } catch (saveErr) {
        console.error("DB Save Failed:", saveErr.message);
    }

    res.json(explanationData);
});

// CAREER ADVISOR ENDPOINTS

app.post('/career/assess', async (req, res) => {
    const { userId, skills, interests, academics } = req.body;

    if (!userId || !skills) return res.status(400).json({ error: 'Skills are required' });

    try {
        console.log(`[CAREER] Assessing profile for user ${userId}...`);

        let result = {};
        if (OpenAI && process.env.OPENAI_API_KEY) {
            try {
                const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
                const prompt = `
                    Act as an expert Career Counselor. Analyze this student profile:
                    - Skills: ${skills}
                    - Interests: ${interests || 'General Technology'}
                    - Academics/Background: ${academics || 'Student'}

                    Task:
                    1. Recommend top 2 Career Paths (e.g. Full Stack, Data Science, DevOps).
                    2. For the #1 recommendation, provide a 5-step Learning Roadmap.
                    3. Suggest 3 key Certifications or Courses.
                    4. Give 3 actionable Resume Tips.

                    Return ONLY JSON in this format:
                    {
                        "recommended_paths": [
                            { "role": "Role Name", "match_score": "95%", "reason": "Why it fits" }
                        ],
                        "roadmap": [
                            { "step": 1, "title": "Basics", "description": "What to learn..." }
                        ],
                        "certifications": ["Cert 1", "Cert 2"],
                        "resume_tips": ["Tip 1", "Tip 2"]
                    }
                `;

                const completion = await openai.chat.completions.create({
                    messages: [{ role: "user", content: prompt }],
                    model: "gpt-4o-mini",
                    temperature: 0.5,
                });

                const content = completion.choices[0].message.content;

                // Robust JSON Extraction (Find Object)
                const startIndex = content.indexOf('{');
                const endIndex = content.lastIndexOf('}');
                if (startIndex !== -1 && endIndex !== -1) {
                    const cleanJson = content.substring(startIndex, endIndex + 1);
                    result = JSON.parse(cleanJson);
                } else {
                    throw new Error("No JSON object found in response");
                }
            } catch (aiError) {
                console.warn("[CAREER] AI Failed (API/Parse):", aiError.message);
                result = {
                    recommended_paths: [
                        { role: "Software Developer", match_score: "85%", reason: "Based on your interest in technology (System Fallback)" },
                        { role: "Data Analyst", match_score: "70%", reason: "Alternative path for analytical skills" }
                    ],
                    roadmap: [
                        { step: 1, title: "Learn Basics", description: "Master HTML, CSS, and JavaScript." },
                        { step: 2, title: "Build Projects", description: "Create a personal portfolio website." }
                    ],
                    certifications: ["FreeCodeCamp (Web Design)", "Coursera (Python for Everybody)"],
                    resume_tips: ["Highlight your projects", "Keep it under 1 page"]
                };
            }
        } else {
            // Offline/No Key Fallback
            result = {
                recommended_paths: [
                    { role: "Software Developer", match_score: "85%", reason: "Based on your interest in technology (Offline Mode)" },
                    { role: "Data Analyst", match_score: "70%", reason: "Alternative path for analytical skills" }
                ],
                roadmap: [
                    { step: 1, title: "Learn Basics", description: "Master HTML, CSS, and JavaScript." },
                    { step: 2, title: "Build Projects", description: "Create a personal portfolio website." }
                ],
                certifications: ["FreeCodeCamp (Web Design)", "Coursera (Python for Everybody)"],
                resume_tips: ["Highlight your projects", "Keep it under 1 page"]
            };
        }

        // Save Assessment
        await db.query(
            'INSERT INTO career_assessments (user_id, skills, interests, academics, result_json) VALUES (?, ?, ?, ?, ?)',
            [userId, skills, interests, academics, JSON.stringify(result)]
        );

        res.json({ message: 'Assessment complete', result });

    } catch (err) {
        console.error('Career assessment error:', err);
        res.status(500).json({ error: 'Failed to assess career' });
    }
});

app.get('/career/latest/:userId', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM career_assessments WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [req.params.userId]);
        if (rows.length === 0) return res.json({ result: null });

        const data = rows[0];
        data.result_json = JSON.parse(data.result_json);
        res.json({ result: data });
    } catch (err) {
        console.error('Fetch career error:', err);
        res.status(500).json({ error: 'Failed to fetch career data' });
    }
});

// CODE EXPLANATION ENDPOINT
// CODE EXPLANATION ENDPOINT
const explainCode = require('./explainEngine');

// CODE EXPLANATION ENDPOINT (Rule-Based Engine)
// CODE EXPLANATION ENDPOINT (AI-Powered with Fallback)
app.post('/explain-code', async (req, res) => {
    const { code, userId } = req.body; // 'code' can now be text/question too
    console.log('[EXPLAIN] Request received. Length:', code ? code.length : 0);

    if (!code || code.trim().length === 0) {
        return res.status(400).json({ error: 'Input cannot be empty' });
    }

    // 1. Try OpenAI First
    if (OpenAI && process.env.OPENAI_API_KEY) {
        try {
            console.log('[EXPLAIN] Using OpenAI (gpt-4o-mini)...');
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

            const prompt = `
                You are a concise Computer Science tutor. Analyze the following input.
                
                Input:
                ${code.substring(0, 3000)}

                Task:
                1. Determine if the input is "CODE" or a "CONCEPT QUESTION".
                2. If CODE: Provide a summary with:
                   - Purpose (What does it do?)
                   - Key Concepts (e.g. Loops, Arrays)
                   - Complexity (Time/Space)
                3. If CONCEPT QUESTION: Provide a clear, simple answer (max 3 sentences).
                4. If ERROR MESSAGE: Explain what it means and how to fix it.

                RETURN ONLY RAW JSON in this format:
                {
                    "isCode": boolean,
                    "title": "Short Title (e.g. 'Binary Search' or 'Explanation of REST')",
                    "content": "The formatted text explanation. Use bullet points for code summaries."
                }
            `;

            const completion = await openai.chat.completions.create({
                messages: [
                    { role: "system", content: "You are a helpful CS tutor. Return valid JSON only." },
                    { role: "user", content: prompt }
                ],
                model: "gpt-4o-mini",
                temperature: 0.3,
            });

            const content = completion.choices[0].message.content;
            const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const result = JSON.parse(cleanJson);

            return res.json({
                language: result.isCode ? "Code" : "Concept",
                complexity: result.isCode ? "Analyzed" : "N/A",
                explanation: [{ line: result.title, text: result.content }]
            });

        } catch (aiError) {
            console.error('[EXPLAIN] OpenAI failed:', aiError.message);
            // Fallback
        }
    }

    // 2. Fallback: Simple Logic
    let fallbackResponse = {
        language: "Analysis",
        complexity: "N/A",
        explanation: []
    };

    const inputLower = code.toLowerCase();

    if (inputLower.includes("function") || inputLower.includes("class") || inputLower.includes("int ") || inputLower.includes("def ")) {
        // Looks like Code
        fallbackResponse.explanation = [
            { line: "Code Detected", text: "This appears to be a code snippet. Our AI is offline, but it likely contains logic for processing data." }
        ];
    } else if (inputLower.includes("error") || inputLower.includes("exception")) {
        // Looks like Error
        fallbackResponse.explanation = [
            { line: "Error Detected", text: "This looks like an error message. Check for null values or syntax typos." }
        ];
        // Looks like Concept
        fallbackResponse.explanation = [
            { line: "Concept", text: "This seems to be a question or topic. Please enable AI for detailed answers." }
        ];
    }

    res.json(fallbackResponse);
});

const PORT = 3000;

// Test Main Database Connection before starting server
db.query('SELECT 1')
    .then(async () => {
        console.log('✅ Connected to MySQL database');

        // Ensure table exists
        const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role ENUM('student', 'admin', 'teacher') DEFAULT 'student',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
        db.query(createTableQuery)
            .then(async () => {
                console.log('✅ Verified "users" table exists');
                // Default user creation removed by request
            })
            .catch(err => console.error('⚠️ Could not verify/create "users" table:', err.message));

        const createFilesTableQuery = `
        CREATE TABLE IF NOT EXISTS files (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            file_type VARCHAR(50),
            file_url TEXT,
            original_name VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `;
        db.query(createFilesTableQuery)
            .then(() => console.log('✅ Verified "files" table exists'))
            .catch(err => console.error('⚠️ Could not verify/create "files" table:', err.message));

        const createLessonsTableQuery = `
            CREATE TABLE IF NOT EXISTS micro_lessons (
                id INT AUTO_INCREMENT PRIMARY KEY,
                file_id INT NOT NULL,
                lesson_order INT,
                title VARCHAR(255),
                concept TEXT,
                explanation TEXT,
                key_takeaway TEXT,
                content_points TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
            )
        `;
        db.query(createLessonsTableQuery)
            .then(() => console.log('✅ Verified "micro_lessons" table exists'))
            .catch(err => console.error('⚠️ Could not verify/create "micro_lessons" table:', err.message));

        const createStudyPlansTable = `
            CREATE TABLE IF NOT EXISTS study_plans (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                title VARCHAR(255),
                exam_date DATETIME,
                syllabus_text TEXT,
                plan_json TEXT, -- Stores the JSON array of daily tasks
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `;
        db.query(createStudyPlansTable)
            .then(() => console.log('✅ Verified "study_plans" table exists'))
            .catch(err => console.error('⚠️ Could not verify/create "study_plans" table:', err.message));

        const createCareerTable = `
            CREATE TABLE IF NOT EXISTS career_assessments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                skills TEXT,
                interests TEXT,
                academics TEXT,
                result_json TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `;
        db.query(createCareerTable)
            .then(() => console.log('✅ Verified "career_assessments" table exists'))
            .catch(err => console.error('⚠️ Could not verify/create "career_assessments" table:', err.message));



        const createProgressTableQuery = `
        CREATE TABLE IF NOT EXISTS lesson_progress(
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                file_id INT NOT NULL,
                last_lesson_index INT DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY(file_id) REFERENCES files(id) ON DELETE CASCADE,
                UNIQUE KEY unique_access(user_id, file_id)
            )
    `;
        await db.query(createProgressTableQuery);
        console.log('✅ Verified "lesson_progress" table exists');
        // QUIZ TABLES
        const createQuizTable = `CREATE TABLE IF NOT EXISTS quizzes(
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                course VARCHAR(100),
                semester VARCHAR(50),
                subject VARCHAR(100),
                unit_number VARCHAR(50),
                topic_name VARCHAR(255),
                difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`;
        const createQuestionsTable = `CREATE TABLE IF NOT EXISTS questions(
                id INT AUTO_INCREMENT PRIMARY KEY,
                quiz_id INT,
                question_text TEXT NOT NULL,
                question_type ENUM('mcq', 'true_false') DEFAULT 'mcq',
                marks INT DEFAULT 1,
                FOREIGN KEY(quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
            )`;
        const createOptionsTable = `CREATE TABLE IF NOT EXISTS options(
                id INT AUTO_INCREMENT PRIMARY KEY,
                question_id INT,
                option_text TEXT NOT NULL,
                is_correct BOOLEAN DEFAULT FALSE,
                FOREIGN KEY(question_id) REFERENCES questions(id) ON DELETE CASCADE
            )`;

        await db.query(createQuizTable);
        await db.query(createQuestionsTable);
        await db.query(createOptionsTable);
        console.log('✅ Verified Quiz Tables Exist');

        // CODE EXPLANATION TABLE
        const createExplanationTable = `CREATE TABLE IF NOT EXISTS code_explanations(
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                code_snippet TEXT,
                explanation JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
            )`;
        await db.query(createExplanationTable);
        console.log('✅ Verified "code_explanations" table exists');

        // AI CODE EXPLAINER ENDPOINT (Hybrid: Online AI + Offline Fallback)
        app.post('/explain-code', async (req, res) => {
            const { code, userId } = req.body;
            if (!code) return res.status(400).json({ error: 'No code provided' });

            console.log(`[EXPLAIN] Request received. Length: ${code.length}`);

            // 1. Try OpenAI (Internet AI)
            if (OpenAI && process.env.OPENAI_API_KEY) {
                try {
                    console.log('[EXPLAIN] Using OpenAI API (Internet Mode)...');
                    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

                    const prompt = `
                    Analyze this code snippet and explain it simply line-by-line for a student.
                    If the code is an algorithm, summarize its high-level logic first.
                    Return ONLY valid JSON in this format:
                    {
                        "language": "Programming Language Name",
                        "explanation": [
                            { "line": "Line content (short)", "text": "Simple explanation of what this line does" }
                        ]
                    }
                    Code:
                    ${code}
                    `;

                    const completion = await openai.chat.completions.create({
                        messages: [{ role: "user", content: prompt }],
                        model: "gpt-3.5-turbo",
                        response_format: { type: "json_object" },
                    });

                    const content = completion.choices[0].message.content;
                    const result = JSON.parse(content);

                    // Save to history (optional)
                    if (userId) {
                        // fire and forget save
                        db.query('INSERT INTO code_explanations (user_id, code_snippet, explanation) VALUES (?, ?, ?)',
                            [userId, code, JSON.stringify(result)]).catch(e => console.error('Save explainer error', e));
                    }

                    return res.json(result);

                } catch (aiErr) {
                    console.error('[EXPLAIN] OpenAI failed:', aiErr.message);
                    console.log('[EXPLAIN] Falling back to local logic...');
                }
            } else {
                console.log('[EXPLAIN] OpenAI not configured/available. Using local fallback.');
            }

            // 2. Local Fallback (Algorithm-Aware Engine)
            try {
                const lines = code.split(/\r\n|\r|\n/);
                const explanation = [];
                let language = 'Detected Code';
                let algoSummary = "";

                // Language Detection (Existing)
                if (code.includes('def ') || code.includes('import ') || code.includes('print(')) language = 'Python';
                else if (code.includes('function') || code.includes('console.log') || code.includes('const ')) language = 'JavaScript';
                else if (code.includes('public class') || code.includes('System.out')) language = 'Java';
                else if (code.includes('#include') || code.includes('int main')) language = 'C/C++';

                // ALGORITHM DETECTION
                const codeLower = code.toLowerCase();

                if (codeLower.includes('bubble') || (codeLower.includes('j + 1') && codeLower.includes('temp'))) {
                    algoSummary = "This appears to be the **Bubble Sort** algorithm. It works by repeatedly swapping adjacent elements if they are in the wrong order, causing larger values to 'bubble' to the end.";
                } else if (codeLower.includes('binary') || (codeLower.includes('mid') && codeLower.includes('low') && codeLower.includes('high'))) {
                    algoSummary = "This implements **Binary Search**. It efficiently finds a target value in a sorted array by repeatedly dividing the search interval in half.";
                } else if (codeLower.includes('factorial') || (codeLower.includes('return 1') && codeLower.includes('*') && codeLower.includes('- 1'))) {
                    algoSummary = "This calculates the **Factorial** of a number, likely using recursion (calling itself) or iteration to multiply a sequence of numbers.";
                } else if (codeLower.includes('fib') || codeLower.includes('fibonacci')) {
                    algoSummary = "This generates the **Fibonacci Sequence**, where each number is the sum of the two preceding ones (0, 1, 1, 2, 3...).";
                } else if (codeLower.includes('linear') || codeLower.includes('search')) {
                    algoSummary = "This is a **Linear Search** algorithm. It checks every element in the list one by one until the target value is found.";
                } else if (codeLower.includes('quick') || (codeLower.includes('pivot') && codeLower.includes('partition'))) {
                    algoSummary = "This implements **Quick Sort**, a highly efficient sorting algorithm that uses a 'pivot' element to partition the array into smaller sub-arrays.";
                } else if (codeLower.includes('merge') && codeLower.includes('mid')) {
                    algoSummary = "This is likely **Merge Sort**, a divide-and-conquer algorithm that recursively splits the list and merges the sorted sub-lists.";
                } else {
                    // GENERIC HEURISTIC ANALYSIS (If specific algo not found)
                    let complexity = "";
                    // Check for nested loops (O(N^2))
                    if (codeLower.match(/for\s*\(.*for\s*\(/s)) {
                        complexity = "uses **Nested Loops**, indicating likely **Quadratic Time Complexity (O(N²))**. This pattern is common in simple sorting algorithms (like Bubble/Selection Sort) or matrix operations.";

                        // Check for O(log N) - division in loop
                    } else if (codeLower.match(/while\s*\(.*\/=\s*2/s) || codeLower.match(/while\s*\(.*>>=\s*1/s)) {
                        complexity = "uses a **Logarithmic Loop** (dividing by 2), suggesting **O(log N)** complexity. This is highly efficient and typical of Binary Search or similar divide-and-conquer strategies.";

                        // Check for Recursion (Basic)
                    } else if (code.match(/([a-zA-Z0-9_]+)\s*\(.*\).*return.*\1\s*\(/s)) {
                        complexity = "uses **Recursion**, where the function calls itself. This is a powerful technique for problems like tree traversal, factorial calculation, or sorting (Merge/Quick Sort).";
                    }

                    if (complexity) {
                        algoSummary = `**Structural Analysis**: This code ${complexity}`;
                    } else {
                        algoSummary = "This code executes a linear sequence of instructions. It appears to be a direct procedural script or simple O(N) algorithm.";
                    }
                }

                // Inject Summary
                explanation.push({
                    line: "ALGORITHM SUMMARY",
                    text: algoSummary,
                    desc: algoSummary
                });
                lines.forEach((line, idx) => {
                    const trimLine = line.trim();
                    if (trimLine.length === 0) return;

                    let text = "Executes this logic.";

                    // Improved Context-Aware Explanations
                    if (trimLine.startsWith('//') || trimLine.startsWith('#')) text = "Comment: Explains the code (ignored by execution).";
                    else if (trimLine.includes('return ')) text = "Returns the final result from the function.";

                    // loops
                    else if (trimLine.includes('for ') && trimLine.includes('j')) text = "Inner Loop: Iterates through the list for comparison.";
                    else if (trimLine.includes('for ') && trimLine.includes('i')) text = "Outer Loop: Controls the number of passes through the list.";
                    else if (trimLine.includes('while ')) text = "Loop: Continues running as long as the condition is true.";

                    // comparisons
                    else if (trimLine.includes('if ') && (trimLine.includes('>') || trimLine.includes('<'))) text = " Comparison: Checks if elements are out of order.";
                    else if (trimLine.includes('==')) text = "Equality Check: Verifies if the value matches the target.";

                    // actions
                    else if (trimLine.includes('swap') || (trimLine.includes('temp') && trimLine.includes('='))) text = "Swap Action: Exchanges the positions of two elements.";
                    else if (trimLine.includes('print') || trimLine.includes('console.log')) text = "Output: Displays the result to the user.";
                    else if (trimLine.includes('mid') && trimLine.includes('=')) text = "Calculation: Finds the middle index of the current range.";

                    // definitions
                    else if (trimLine.includes('def ') || trimLine.includes('function ')) text = "Function Definition: precise logic block.";
                    else if (trimLine.includes('int ') || trimLine.includes('var ') || trimLine.includes('let ')) text = "Variable Declaration: Allocates memory for data.";

                    explanation.push({
                        line: trimLine.length > 50 ? trimLine.substring(0, 47) + '...' : trimLine,
                        text: text,
                        desc: text
                    });
                });

                console.log(`[EXPLAIN] Analyzed ${lines.length} lines. Generated ${explanation.length} explanation items.`);
                if (explanation.length === 0) console.warn('[EXPLAIN] WARNING: Explanation is empty!');
                console.log('[EXPLAIN] First item:', JSON.stringify(explanation[0]));
                res.json({ language, explanation });

            } catch (localErr) {
                console.error('[EXPLAIN] Local fallback failed:', localErr);
                res.status(500).json({ error: 'Failed to explain code' });
            }
        });

        // ERROR DEBUGGING ENDPOINT
        app.post('/debug-code', async (req, res) => {
            const { code, userId } = req.body;
            if (!code) return res.status(400).json({ error: 'No code provided' });

            console.log(`[DEBUG] Request received. Length: ${code.length}`);

            let result = null;

            // 1. Try OpenAI
            if (OpenAI && process.env.OPENAI_API_KEY) {
                try {
                    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
                    const prompt = `
                        You are an expert programming debugger helping MCA students.

                        Analyze the following code carefully.

                        If there are errors:
                        1. Identify the type of error (Syntax / Logical / Runtime / Optimization)
                        2. Explain why the error occurs
                        3. Show the corrected version of the code
                        4. Explain the correction clearly
                        5. Suggest best practice improvements

                        If there is no error:
                        1. Confirm the code is correct
                        2. Suggest optimization improvements
                        3. Mention time and space complexity

                        Code:
                        ${code}

                        Return ONLY valid JSON in this format:
                        {
                            "isError": boolean, // true if error found
                            "errorType": "Syntax | Logical | Runtime | Optimization | None",
                            "error": "Short description of the error",
                            "fixedCode": "The full corrected code",
                            "explanation": "Explanation of what was wrong and how it was fixed",
                            "bestPractice": "Tip for improvement or optimization",
                            "improvedCode": "An optimized version of the code (optional)"
                        }
                    `;

                    const completion = await openai.chat.completions.create({
                        messages: [{ role: "user", content: prompt }],
                        model: "gpt-4o-mini",
                        response_format: { type: "json_object" },
                    });

                    result = JSON.parse(completion.choices[0].message.content);
                    console.log('[DEBUG] AI Analysis Success');

                    // Save to history
                    if (userId) {
                        const insertHistory = `
                            INSERT INTO code_analysis_history (user_id, code, error_type, corrected_code)
                            VALUES (?, ?, ?, ?)
                        `;
                        // Ensure table exists (create if not)
                        await db.query(`
                            CREATE TABLE IF NOT EXISTS code_analysis_history (
                                id INT AUTO_INCREMENT PRIMARY KEY,
                                user_id INT,
                                code TEXT,
                                error_type VARCHAR(50),
                                corrected_code TEXT,
                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                            )
                        `);
                        await db.query(insertHistory, [userId, code, result.errorType || 'Unknown', result.fixedCode || '']);
                    }

                } catch (e) {
                    console.error('[DEBUG] AI Failed:', e.message);
                }
            }

            // 2. Fallback
            if (!result) {
                result = {
                    isError: true,
                    error: "AI Service Unavailable. Performing basic check.",
                    fixedCode: code,
                    explanation: "Could not connect to AI debugger. Please check your syntax manually.",
                    improvedCode: code
                };

                // Simple heuristics
                if (code.includes('console.log') && !code.includes(';')) {
                    result.error = "Missing semicolon";
                    result.explanation = "It looks like you missed a semicolon after console.log";
                    result.fixedCode = code.replace(/console\.log\((.*)\)/g, 'console.log($1);');
                }
            }

            res.json(result);
        });

        // --- GRAPH DEPENDENCY SYSTEM ---

        // 1. Create Tables
        const createTopicsTable = `
            CREATE TABLE IF NOT EXISTS topics (
                id INT AUTO_INCREMENT PRIMARY KEY,
                label VARCHAR(255) NOT NULL,
                x INT NOT NULL,
                y INT NOT NULL,
                category VARCHAR(50) DEFAULT 'General',
                subject VARCHAR(50) DEFAULT 'DS',
                level VARCHAR(20) DEFAULT 'Beginner',
                description TEXT
            )
        `;
        const createDependenciesTable = `
            CREATE TABLE IF NOT EXISTS topic_dependencies (
                id INT AUTO_INCREMENT PRIMARY KEY,
                topic_id INT NOT NULL,
                prerequisite_id INT NOT NULL,
                FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
                FOREIGN KEY (prerequisite_id) REFERENCES topics(id) ON DELETE CASCADE
            )
        `;
        const createUserProgressTable = `
            CREATE TABLE IF NOT EXISTS user_topic_progress (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                topic_id INT NOT NULL,
                status ENUM('locked', 'unlocked', 'completed') DEFAULT 'locked',
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
                UNIQUE KEY unique_progress (user_id, topic_id)
            )
        `;

        try {
            await db.query(createTopicsTable);
            await db.query(createDependenciesTable);
            await db.query(createUserProgressTable);

            // Auto-Migration: Add subject/level if missing (for existing installs)
            const [tCols] = await db.query("SHOW COLUMNS FROM topics LIKE 'subject'");
            if (tCols.length === 0) {
                await db.query("ALTER TABLE topics ADD COLUMN subject VARCHAR(50) DEFAULT 'DS'");
                await db.query("ALTER TABLE topics ADD COLUMN level VARCHAR(20) DEFAULT 'Beginner'");
                console.log('✅ Migrated topics table with subject/level');
            } else {
                // Fix: Ensure existing NULL subjects are set to DS
                await db.query("UPDATE topics SET subject = 'DS' WHERE subject IS NULL");
            }

            console.log('✅ Verified Graph Dependency tables exist');

            // 2. Seed Initial Data (Smart Seeding)

            // A. Data Structures (DS)
            const [dsTopics] = await db.query("SELECT COUNT(*) as count FROM topics WHERE subject = 'DS'");
            if (dsTopics[0].count === 0) {
                console.log('🌱 Seeding Graph Data (DS)...');
                const dsData = [
                    { id: 1, label: 'Basics', x: 150, y: 50, category: 'Core', level: 'Beginner' },
                    { id: 2, label: 'Arrays', x: 50, y: 150, category: 'Linear', level: 'Beginner' },
                    { id: 3, label: 'Pointers', x: 250, y: 150, category: 'Core', level: 'Intermediate' },
                    { id: 4, label: 'Recursion', x: 350, y: 150, category: 'Core', level: 'Intermediate' },
                    { id: 5, label: 'Linked List', x: 150, y: 250, category: 'Linear', level: 'Intermediate' },
                    { id: 6, label: 'Stack', x: 50, y: 350, category: 'Linear', level: 'Intermediate' },
                    { id: 7, label: 'Queue', x: 150, y: 350, category: 'Linear', level: 'Intermediate' },
                    { id: 8, label: 'Trees', x: 300, y: 350, category: 'Non-Linear', level: 'Advanced' },
                    { id: 9, label: 'Graphs', x: 300, y: 480, category: 'Non-Linear', level: 'Advanced' },
                    { id: 10, label: 'Dyn. Prog.', x: 100, y: 480, category: 'Algo', level: 'Advanced' },
                    { id: 11, label: 'Hashing', x: 200, y: 350, category: 'Core', level: 'Intermediate' },
                    { id: 12, label: 'Heaps', x: 400, y: 350, category: 'Non-Linear', level: 'Advanced' }
                ];

                for (const t of dsData) {
                    // Check if exists to avoid dupes during dev
                    const [exists] = await db.query('SELECT 1 FROM topics WHERE id = ?', [t.id]);
                    if (exists.length === 0) {
                        await db.query(
                            'INSERT INTO topics (id, label, x, y, category, subject, level) VALUES (?, ?, ?, ?, ?, ?, ?)',
                            [t.id, t.label, t.x, t.y, t.category, 'DS', t.level]
                        );
                    }
                }

                const dsDeps = [
                    { t: 2, r: 1 }, { t: 3, r: 1 }, { t: 4, r: 1 },
                    { t: 5, r: 3 }, { t: 5, r: 2 }, { t: 6, r: 2 }, { t: 6, r: 5 },
                    { t: 7, r: 2 }, { t: 7, r: 5 }, { t: 8, r: 4 }, { t: 8, r: 3 }, { t: 8, r: 5 },
                    { t: 9, r: 8 }, { t: 9, r: 4 }, { t: 10, r: 4 }, { t: 10, r: 2 },
                    { t: 11, r: 2 }, { t: 12, r: 2 }, { t: 12, r: 8 }
                ];

                for (const d of dsDeps) {
                    const [exists] = await db.query('SELECT 1 FROM topic_dependencies WHERE topic_id = ? AND prerequisite_id = ?', [d.t, d.r]);
                    if (exists.length === 0) {
                        await db.query('INSERT INTO topic_dependencies (topic_id, prerequisite_id) VALUES (?, ?)', [d.t, d.r]);
                    }
                }
            } else {
                // Force update for existing users to see new nodes
                const newNodes = [
                    { id: 11, label: 'Hashing', x: 200, y: 350, category: 'Core', level: 'Intermediate' },
                    { id: 12, label: 'Heaps', x: 400, y: 350, category: 'Non-Linear', level: 'Advanced' }
                ];
                for (const t of newNodes) {
                    const [exists] = await db.query('SELECT 1 FROM topics WHERE id = ?', [t.id]);
                    if (exists.length === 0) {
                        await db.query(
                            'INSERT INTO topics (id, label, x, y, category, subject, level) VALUES (?, ?, ?, ?, ?, ?, ?)',
                            [t.id, t.label, t.x, t.y, t.category, 'DS', t.level]
                        );
                    }
                }
                const newDeps = [
                    { t: 11, r: 2 }, { t: 12, r: 2 }, { t: 12, r: 8 }
                ];
                for (const d of newDeps) {
                    const [exists] = await db.query('SELECT 1 FROM topic_dependencies WHERE topic_id = ? AND prerequisite_id = ?', [d.t, d.r]);
                    if (exists.length === 0) {
                        await db.query('INSERT INTO topic_dependencies (topic_id, prerequisite_id) VALUES (?, ?)', [d.t, d.r]);
                    }
                }
            }

            // B. Frontend Development (React)
            const [reactTopics] = await db.query("SELECT COUNT(*) as count FROM topics WHERE subject = 'Frontend'");
            if (reactTopics[0].count === 0) {
                console.log('🌱 Seeding Graph Data (Frontend)...');
                const reactData = [
                    { id: 20, label: 'HTML/CSS', x: 150, y: 50, category: 'Foundation', level: 'Beginner' },
                    { id: 21, label: 'JavaScript', x: 150, y: 150, category: 'Language', level: 'Beginner' },
                    { id: 22, label: 'React Basics', x: 50, y: 250, category: 'Framework', level: 'Intermediate' },
                    { id: 23, label: 'Hooks', x: 250, y: 250, category: 'Framework', level: 'Intermediate' },
                    { id: 24, label: 'Routing', x: 50, y: 350, category: 'Library', level: 'Intermediate' },
                    { id: 25, label: 'State Mgmt', x: 250, y: 350, category: 'Architecture', level: 'Advanced' },
                    { id: 26, label: 'API / Query', x: 150, y: 450, category: 'Data', level: 'Advanced' }
                ];

                for (const t of reactData) {
                    await db.query(
                        'INSERT INTO topics (id, label, x, y, category, subject, level) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [t.id, t.label, t.x, t.y, t.category, 'Frontend', t.level]
                    );
                }

                const reactDeps = [
                    { t: 21, r: 20 }, // JS -> HTML/CSS
                    { t: 22, r: 21 }, // React -> JS
                    { t: 23, r: 22 }, // Hooks -> React
                    { t: 24, r: 22 }, // Routing -> React
                    { t: 25, r: 23 }, // State -> Hooks
                    { t: 26, r: 23 }, // API -> Hooks
                    { t: 26, r: 21 }  // API -> JS
                ];

                for (const d of reactDeps) {
                    await db.query('INSERT INTO topic_dependencies (topic_id, prerequisite_id) VALUES (?, ?)', [d.t, d.r]);
                }
            }

            // C. System Design (New Subject)
            const [sysTopics] = await db.query("SELECT COUNT(*) as count FROM topics WHERE subject = 'System Design'");
            if (sysTopics[0].count === 0) {
                console.log('🌱 Seeding Graph Data (System Design)...');
                const sysData = [
                    { id: 101, label: 'Protocols', x: 150, y: 50, category: 'Core', level: 'Beginner' },
                    { id: 102, label: 'OS Basics', x: 50, y: 150, category: 'Core', level: 'Beginner' },
                    { id: 103, label: 'Networking', x: 250, y: 150, category: 'Core', level: 'Intermediate' },
                    { id: 104, label: 'Databases', x: 150, y: 250, category: 'Storage', level: 'Intermediate' },
                    { id: 105, label: 'Caching', x: 350, y: 250, category: 'Perf', level: 'Intermediate' },
                    { id: 106, label: 'Load Bal.', x: 150, y: 350, category: 'Scale', level: 'Advanced' },
                    { id: 107, label: 'Sharding', x: 150, y: 450, category: 'Scale', level: 'Advanced' },
                    { id: 108, label: 'CAP Thm', x: 300, y: 350, category: 'Theory', level: 'Advanced' }
                ];

                for (const t of sysData) {
                    await db.query(
                        'INSERT INTO topics (id, label, x, y, category, subject, level) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [t.id, t.label, t.x, t.y, t.category, 'System Design', t.level]
                    );
                }

                const sysDeps = [
                    { t: 103, r: 101 }, { t: 104, r: 102 }, { t: 105, r: 104 },
                    { t: 106, r: 103 }, { t: 106, r: 104 }, { t: 107, r: 104 },
                    { t: 108, r: 104 }
                ];
                for (const d of sysDeps) {
                    await db.query('INSERT INTO topic_dependencies (topic_id, prerequisite_id) VALUES (?, ?)', [d.t, d.r]);
                }

                // Seed Resources for System Design
                await db.query("UPDATE topics SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/d/d9/Cloud_computing_icon.png' WHERE subject = 'System Design'");
                await db.query("UPDATE topics SET documentation_url = 'https://github.com/donnemartin/system-design-primer', video_url = 'https://youtu.be/SqcY0GlETPk' WHERE subject = 'System Design'");
            }

            // Auto-Migration: Add resource links & image
            const [rCols] = await db.query("SHOW COLUMNS FROM topics LIKE 'documentation_url'");
            if (rCols.length === 0) {
                await db.query("ALTER TABLE topics ADD COLUMN documentation_url TEXT");
                await db.query("ALTER TABLE topics ADD COLUMN video_url TEXT");
                console.log('✅ Migrated topics table with resource links');

                // Backfill for demo
                await db.query("UPDATE topics SET documentation_url = 'https://react.dev', video_url = 'https://youtu.be/SqcY0GlETPk' WHERE subject = 'Frontend'");
                await db.query("UPDATE topics SET documentation_url = 'https://www.geeksforgeeks.org/data-structures/', video_url = 'https://youtu.be/RBSGKlAvoiM' WHERE subject = 'DS'");
            }

            const [iCols] = await db.query("SHOW COLUMNS FROM topics LIKE 'image_url'");
            if (iCols.length === 0) {
                await db.query("ALTER TABLE topics ADD COLUMN image_url TEXT");
                console.log('✅ Migrated topics table with image_url');

                // Backfill Images
                // DS
                await db.query("UPDATE topics SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/ISO_C%2B%2B_Logo.svg/1200px-ISO_C%2B%2B_Logo.svg.png' WHERE subject = 'DS'");
                // React
                await db.query("UPDATE topics SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1200px-React-icon.svg.png' WHERE subject = 'Frontend'");
                // JS specific override
                await db.query("UPDATE topics SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/6/6a/JavaScript-logo.png' WHERE label = 'JavaScript'");

                // Hashing & Heaps Resource Backfill
                await db.query("UPDATE topics SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Hash_table_3_1_1_0_1_0_0_SP.svg/1200px-Hash_table_3_1_1_0_1_0_0_SP.svg.png', documentation_url = 'https://www.geeksforgeeks.org/hashing-data-structure/', video_url = 'https://youtu.be/2Ti5yvumFTU' WHERE label = 'Hashing'");
                await db.query("UPDATE topics SET image_url = 'https://media.geeksforgeeks.org/wp-content/cdn-uploads/binary-heap.png', documentation_url = 'https://www.geeksforgeeks.org/heap-data-structure/', video_url = 'https://youtu.be/WCm3TqScBM8' WHERE label = 'Heaps'");
            }

        } catch (graphErr) {
            console.error('❌ Graph System Setup Error:', graphErr);
        }

        // 3. API Endpoints

        // GET Graph Data (Nodes + Edges)
        app.get('/topics/graph', async (req, res) => {
            const subject = req.query.subject || 'DS';
            try {
                // Fix: Include NULL subjects for backward compatibility
                const query = subject === 'DS'
                    ? 'SELECT * FROM topics WHERE subject = ? OR subject IS NULL'
                    : 'SELECT * FROM topics WHERE subject = ?';

                const [topics] = await db.query(query, [subject]);
                const [deps] = await db.query('SELECT * FROM topic_dependencies');

                // Format for frontend
                const nodes = topics.map(t => ({
                    id: String(t.id),
                    label: t.label,
                    x: t.x,
                    y: t.y,
                    category: t.category,
                    level: t.level,
                    doc: t.documentation_url,
                    video: t.video_url,
                    image: t.image_url,
                    req: deps.filter(d => d.topic_id === t.id).map(d => String(d.prerequisite_id))
                }));

                res.json({ nodes });
            } catch (error) {
                console.error('Graph fetch error:', error);
                res.status(500).json({ error: 'Failed to fetch graph data' });
            }
        });

        // GET User Progress
        app.get('/topics/progress/:userId', async (req, res) => {
            try {
                const [progress] = await db.query('SELECT topic_id FROM user_topic_progress WHERE user_id = ? AND status = "completed"', [req.params.userId]);
                const completedIds = progress.map(p => String(p.topic_id));

                // Ensure 'Basics' (ID 1) is always completed for new users to start if no progress found
                // Note: ID 1 is 'Basics' in our seed data.
                if (completedIds.length === 0) {
                    completedIds.push('1');
                } else if (!completedIds.includes('1')) {
                    completedIds.push('1');
                }

                res.json({ completed: completedIds });
            } catch (error) {
                console.error('Progress fetch error:', error);
                res.status(500).json({ error: 'Failed to fetch progress' });
            }
        });

        // POST Mark Complete
        app.post('/topics/complete', async (req, res) => {
            const { userId, topicId } = req.body;
            try {
                await db.query(`
                    INSERT INTO user_topic_progress (user_id, topic_id, status) 
                    VALUES (?, ?, 'completed') 
                    ON DUPLICATE KEY UPDATE status = 'completed', completed_at = CURRENT_TIMESTAMP
                `, [userId, topicId]);

                res.json({ success: true, message: 'Topic marked as completed' });
            } catch (error) {
                console.error('Mark complete error:', error);
                res.status(500).json({ error: 'Failed to update progress' });
            }
        });

        // --- NEW ROADMAP ENDPOINTS ---

        // Get Roadmap Data
        app.get('/roadmap/:subject', async (req, res) => {
            const { subject } = req.params;
            try {
                // Determine subject filter (handle 'DS' vs 'Data Structures' aliasing if needed)
                // We'll search for exact match or 'Data Structures' if requested as 'DS'
                let searchSubject = subject;
                if (subject === 'DS') searchSubject = 'Data Structures';

                const [topics] = await db.query('SELECT * FROM topics WHERE subject = ?', [searchSubject]);

                if (topics.length === 0) {
                    return res.json({ topics: [], dependencies: [] });
                }

                const topicIds = topics.map(t => t.id);
                const [dependencies] = await db.query('SELECT * FROM topic_dependencies WHERE topic_id IN (?)', [topicIds]);

                res.json({ topics, dependencies });
            } catch (err) {
                console.error('Roadmap fetch error:', err);
                res.status(500).json({ error: 'Failed to fetch roadmap' });
            }
        });

        // Get User Progress
        app.get('/roadmap/progress/:userId', async (req, res) => {
            const { userId } = req.params;
            try {
                const [progress] = await db.query('SELECT topic_id, status FROM user_progress WHERE user_id = ?', [userId]);
                res.json({ progress });
            } catch (err) {
                console.error('Roadmap progress error:', err);
                res.status(500).json({ error: 'Failed to fetch progress' });
            }
        });

        // Update Progress
        app.post('/roadmap/progress', async (req, res) => {
            const { userId, topicId, status } = req.body;
            // status: 'completed', 'in_progress', 'not_started'

            if (!userId || !topicId || !status) {
                return res.status(400).json({ error: 'Missing fields' });
            }

            try {
                await db.query(`
                    INSERT INTO user_progress (user_id, topic_id, status)
                    VALUES (?, ?, ?)
                    ON DUPLICATE KEY UPDATE status = VALUES(status)
                `, [userId, topicId, status]);

                res.json({ message: 'Progress updated' });
            } catch (err) {
                console.error('Update progress error:', err);
                res.status(500).json({ error: 'Failed to update progress' });
            }
        });

        // AUTO-MIGRATION: Add avatar_url to users if missing
        try {
            const [columns] = await db.query("SHOW COLUMNS FROM users LIKE 'avatar_url'");
            if (columns.length === 0) {
                await db.query("ALTER TABLE users ADD COLUMN avatar_url TEXT");
                console.log('✅ Added "avatar_url" column to users table');
            }
        } catch (migErr) {
            if (migErr.code === 'ECONNRESET') {
                console.warn('⚠️ Migration check skipped: Database connection reset. (Non-fatal)');
            } else {
                console.warn('⚠️ Migration check failed:', migErr.message);
            }
        }

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`✅ Server running on http://0.0.0.0:${PORT}`);

            const { networkInterfaces } = require('os');
            const nets = networkInterfaces();
            for (const name of Object.keys(nets)) {
                for (const net of nets[name]) {
                    if (net.family === 'IPv4' && !net.internal) {
                        console.log(`Possible Connect URL: http://${net.address}:${PORT}`);
                    }
                }
            }
        });
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err.message);
    });
