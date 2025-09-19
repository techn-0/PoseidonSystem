// Favorites module
const express = require('express');
const router = express.Router();
const { getDb } = require('./db');
const { authenticateToken } = require('./auth');

// 모든 즐겨찾기 라우트는 인증 필요
router.use(authenticateToken);

// 즐겨찾기 목록 조회
router.get('/', (req, res) => {
  const db = getDb();
  db.all('SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC', [req.user.id], (err, favorites) => {
    if (err) {
      console.error('Error fetching favorites:', err);
      return res.status(500).json({ error: 'Failed to fetch favorites' });
    }
    res.json(favorites);
  });
});

// 즐겨찾기 추가
router.post('/', (req, res) => {
  const { name, lat, lon } = req.body;
  
  if (!name || lat === undefined || lon === undefined) {
    return res.status(400).json({ error: 'Name, lat, and lon are required' });
  }

  const db = getDb();
  db.run('INSERT INTO favorites (user_id, name, lat, lon) VALUES (?, ?, ?, ?)', [req.user.id, name, lat, lon], function(err) {
    if (err) {
      console.error('Error adding favorite:', err);
      return res.status(500).json({ error: 'Failed to add favorite' });
    }
    
    res.json({ 
      id: this.lastID, 
      name, 
      lat, 
      lon,
      message: 'Favorite added successfully' 
    });
  });
});

// 즐겨찾기 삭제
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  
  // 사용자의 즐겨찾기만 삭제할 수 있도록 확인
  db.run('DELETE FROM favorites WHERE id = ? AND user_id = ?', [id, req.user.id], function(err) {
    if (err) {
      console.error('Error deleting favorite:', err);
      return res.status(500).json({ error: 'Failed to delete favorite' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Favorite not found or not authorized' });
    }
    
    res.json({ message: 'Favorite deleted successfully' });
  });
});

module.exports = router;