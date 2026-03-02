const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth(), async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT b.* FROM boards b
       JOIN board_members bm ON bm.board_id = b.id
       WHERE bm.user_id = ?`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth(), async (req, res) => {
  const { name, is_private } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }
  try {
    const userId = req.user.id;
    const [result] = await pool.query(
      'INSERT INTO boards (name, owner_id, is_private) VALUES (?, ?, ?)',
      [name, userId, is_private ? 1 : 0]
    );
    const boardId = result.insertId;
    await pool.query(
      'INSERT INTO board_members (board_id, user_id, role) VALUES (?, ?, ?)',
      [boardId, userId, 'admin']
    );
    const [boardRows] = await pool.query('SELECT * FROM boards WHERE id = ?', [boardId]);
    res.status(201).json(boardRows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:boardId', auth(), async (req, res) => {
  const { boardId } = req.params;
  try {
    const userId = req.user.id;
    const [permitted] = await pool.query(
      'SELECT 1 FROM board_members WHERE board_id = ? AND user_id = ?',
      [boardId, userId]
    );
    if (permitted.length === 0) {
      return res.status(403).json({ message: 'No access to this board' });
    }

    const [[board]] = await pool.query('SELECT * FROM boards WHERE id = ?', [boardId]);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const [lists] = await pool.query(
      'SELECT * FROM lists WHERE board_id = ? ORDER BY position',
      [boardId]
    );
    const [cards] = await pool.query(
      'SELECT * FROM cards WHERE board_id = ? ORDER BY position',
      [boardId]
    );

    res.json({ board, lists, cards });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

