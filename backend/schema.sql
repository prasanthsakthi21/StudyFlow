CREATE DATABASE IF NOT EXISTS studyflow_db;
USE studyflow_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin', 'teacher') DEFAULT 'student',
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    public_id VARCHAR(255), -- Cloudinary Public ID for deletion
    uploaded_by ENUM('admin', 'student', 'teacher') DEFAULT 'student',
    file_type VARCHAR(50),
    file_url TEXT,
    secure_url TEXT, -- Store secure_url specifically if needed, though file_url usually serves this
    original_name VARCHAR(255),
    file_size BIGINT DEFAULT 0, -- Stored in Bytes
    -- New Columns for Admin & Search
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    subject VARCHAR(100),
    course VARCHAR(100),
    semester VARCHAR(50),
    unit_number VARCHAR(50),
    topic_name VARCHAR(255),
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    category ENUM('user_upload', 'semester_resource') DEFAULT 'user_upload',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS micro_lessons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_id INT NOT NULL,
    lesson_order INT,
    title VARCHAR(255),
    content_points JSON,
    duration_seconds INT DEFAULT 60,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
);
