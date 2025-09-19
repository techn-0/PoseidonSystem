const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('./db');

const router = express.Router();

// JWT 미들웨어
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// POST /auth/signup
router.post('/signup', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  // 비밀번호 해시
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  // 이메일 중복 체크
  db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (row) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    // 사용자 생성
    db.run('INSERT INTO users (email, password_hash) VALUES (?, ?)', [email, hashedPassword], function(err) {
      if (err) {
        console.error('Signup error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      const userId = this.lastID;
      
      // JWT 토큰 생성
      const token = jwt.sign(
        { id: userId, email: email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      res.json({ token, user: { id: userId, email } });
    });
  });
});

// POST /auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  // 사용자 조회
  db.get('SELECT id, email, password_hash FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // 비밀번호 검증
    const isValidPassword = bcrypt.compareSync(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // JWT 토큰 생성
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ token, user: { id: user.id, email: user.email } });
  });
});

// GET /auth/me
router.get('/me', verifyToken, (req, res) => {
  db.get('SELECT id, email, created_at FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      console.error('Get user error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  });
});

module.exports = router;
module.exports.authenticateToken = verifyToken;