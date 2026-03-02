import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:4000/api';

function BoardsPage({ token }) {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newBoardName, setNewBoardName] = useState('');
  const navigate = useNavigate();

  const fetchBoards = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/boards`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBoards(res.data);
    } catch (err) {
      setError('Failed to load boards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;
    try {
      const res = await axios.post(
        `${API_URL}/boards`,
        { name: newBoardName, is_private: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBoards((prev) => [...prev, res.data]);
      setNewBoardName('');
    } catch (err) {
      setError('Failed to create board');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Your Boards</h2>
      </div>
      <div className="boards-grid">
        <div className="board-card new-board-card">
          <form onSubmit={handleCreateBoard}>
            <input
              type="text"
              placeholder="New board name"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
            />
            <button type="submit" className="btn-primary">
              Create Board
            </button>
          </form>
        </div>
        {loading && <div>Loading boards...</div>}
        {error && <div className="error-banner">{error}</div>}
        {boards.map((board) => (
          <button
            key={board.id}
            className="board-card"
            onClick={() => navigate(`/boards/${board.id}`)}
          >
            <h3>{board.name}</h3>
          </button>
        ))}
      </div>
    </div>
  );
}

export default BoardsPage;

