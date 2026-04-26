const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDB() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    console.log('Connected to MySQL. Creating database if not exists...');
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
    
    await connection.query(`USE \`${process.env.DB_NAME}\``);
    
    console.log('Creating tables...');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS Users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        credits INT DEFAULT 20,
        bio TEXT,
        rating FLOAT DEFAULT 0.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS Skills (
        id INT AUTO_INCREMENT PRIMARY KEY,
        skill_name VARCHAR(255) UNIQUE NOT NULL,
        category VARCHAR(255) NOT NULL
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS UserSkills (
        user_id INT NOT NULL,
        skill_id INT NOT NULL,
        type ENUM('offer', 'learn') NOT NULL,
        PRIMARY KEY (user_id, skill_id, type),
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (skill_id) REFERENCES Skills(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS TimeSlots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        is_booked BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS Sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mentor_id INT NOT NULL,
        learner_id INT NOT NULL,
        skill_id INT NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        status ENUM('upcoming', 'completed', 'cancelled') DEFAULT 'upcoming',
        meeting_url VARCHAR(500),
        FOREIGN KEY (mentor_id) REFERENCES Users(id),
        FOREIGN KEY (learner_id) REFERENCES Users(id),
        FOREIGN KEY (skill_id) REFERENCES Skills(id)
      )
    `);

    try {
      await connection.query(`ALTER TABLE Sessions ADD COLUMN meeting_url VARCHAR(500)`);
      console.log('Added meeting_url column to existing Sessions table.');
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') throw e;
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS Reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT NOT NULL,
        mentor_id INT NOT NULL,
        rating INT NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES Sessions(id),
        FOREIGN KEY (mentor_id) REFERENCES Users(id)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS ChatMessages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id INT NOT NULL,
        receiver_id INT NOT NULL,
        room_id VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES Users(id),
        FOREIGN KEY (receiver_id) REFERENCES Users(id)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS Transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        amount INT NOT NULL,
        type ENUM('earned', 'spent') NOT NULL,
        reason VARCHAR(255) NOT NULL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES Users(id)
      )
    `);

    // Insert some default skills
    await connection.query(`
      INSERT IGNORE INTO Skills (skill_name, category) VALUES
      ('React', 'Programming'),
      ('Node.js', 'Programming'),
      ('Python', 'Programming'),
      ('UI/UX Design', 'Design'),
      ('Figma', 'Design'),
      ('SEO', 'Marketing'),
      ('Digital Marketing', 'Marketing')
    `);

    console.log('Database and all tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDB();
