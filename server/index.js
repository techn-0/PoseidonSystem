// Poseidon System - Main Server File
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initDatabase } = require('./db');

// 환경변수 확인
console.log('KMA_SERVICE_KEY:', process.env.KMA_SERVICE_KEY ? '설정됨' : '설정안됨');

// 라우터 import
const authRouter = require('./auth');
const kmaRouter = require('./kma');
const favoritesRouter = require('./favorites');
const { router: airkoreaRouter } = require('./airkorea');

const app = express();
const PORT = process.env.PORT || 4000;

// 데이터베이스 초기화
initDatabase();

// Middleware
app.use(cors());
app.use(express.json());

// 라우터 마운트
app.use('/auth', authRouter);
app.use('/kma', kmaRouter);
app.use('/favorites', favoritesRouter);
app.use('/airkorea', airkoreaRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// 테스트 엔드포인트
app.get('/test', (req, res) => {
  console.log('테스트 엔드포인트 호출됨 - 서버 업데이트 확인 v2');
  res.json({ message: 'Server is updated v2!', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Poseidon Server running on port ${PORT}`);
});