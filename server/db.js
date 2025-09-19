// Database module
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// SQLite 데이터베이스 파일 경로
const dbPath = path.join(__dirname, 'poseidon.db');
const db = new sqlite3.Database(dbPath);

// 데이터베이스 초기화 함수
function initDatabase() {
  console.log('Initializing database...');
  
  // users 테이블 생성
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  // favorites 테이블 생성
  const createFavoritesTable = `
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `;
  
  db.serialize(() => {
    db.run(createUsersTable, (err) => {
      if (err) {
        console.error('Error creating users table:', err);
      }
    });
    
    db.run(createFavoritesTable, (err) => {
      if (err) {
        console.error('Error creating favorites table:', err);
      } else {
        console.log('Database tables created successfully');
      }
    });
  });
}

// 데이터베이스 인스턴스 내보내기
module.exports = {
  db,
  initDatabase,
  getDb: () => db
};