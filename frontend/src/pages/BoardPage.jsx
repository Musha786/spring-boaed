import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:4000/api';
const SOCKET_URL = 'http://localhost:4000';

function BoardPage({ token, user }) {
  const { boardId } = useParams();
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [cards, setCards] = useState([]);
  const [socket, setSocket] = useState(null);
  const [newListName, setNewListName] = useState('');
  const [newCardTitle, setNewCardTitle] = useState('');
  const [selectedListId, setSelectedListId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const s = io(SOCKET_URL);
    s.emit('joinBoard', boardId);
    setSocket(s);

    s.on('boardUpdated', (payload) => {
      if (String(payload.boardId) === String(boardId)) {
        fetchBoard();
      }
    });

    return () => {
      s.emit('leaveBoard', boardId);
      s.disconnect();
    };
  }, [boardId]);

  const fetchBoard = async () => {
    try {
      const res = await axios.get(`${API_URL}/boards/${boardId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBoard(res.data.board);
      setLists(res.data.lists);
      setCards(res.data.cards);
    } catch (err) {
      setError('Failed to load board');
    }
  };

  useEffect(() => {
    fetchBoard();
  }, [boardId]);

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    try {
      const res = await axios.post(
        `${API_URL}/lists`,
        { board_id: boardId, name: newListName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLists((prev) => [...prev, res.data]);
      setNewListName('');
      socket?.emit('boardUpdated', { boardId });
    } catch (err) {
      setError('Failed to create list');
    }
  };

  const handleCreateCard = async (e) => {
    e.preventDefault();
    if (!newCardTitle.trim() || !selectedListId) return;
    try {
      const res = await axios.post(
        `${API_URL}/cards`,
        {
          board_id: boardId,
          list_id: selectedListId,
          title: newCardTitle,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCards((prev) => [...prev, res.data]);
      setNewCardTitle('');
      socket?.emit('boardUpdated', { boardId });
    } catch (err) {
      setError('Failed to create card');
    }
  };

  const onDragStart = (e, cardId) => {
    e.dataTransfer.setData('cardId', cardId);
  };

  const onDropCard = async (e, targetListId) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('cardId');
    if (!cardId) return;
    try {
      const res = await axios.put(
        `${API_URL}/cards/${cardId}/move`,
        { list_id: targetListId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCards((prev) =>
        prev.map((c) => (c.id === res.data.id ? res.data : c))
      );
      socket?.emit('boardUpdated', { boardId });
    } catch (err) {
      setError('Failed to move card');
    }
  };

  const allowDrop = (e) => {
    e.preventDefault();
  };

  const cardsForList = (listId) =>
    cards.filter((c) => c.list_id === listId).sort((a, b) => a.position - b.position);

  if (!board) {
    return (
      <div className="page-container">
        {error ? <div className="error-banner">{error}</div> : 'Loading board...'}
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>{board.name}</h2>
      </div>
      {error && <div className="error-banner">{error}</div>}
      <div className="board-layout">
        <div className="lists-row">
          {lists.map((list) => (
            <div
              key={list.id}
              className="list-column"
              onDrop={(e) => onDropCard(e, list.id)}
              onDragOver={allowDrop}
            >
              <div className="list-header">
                <h3>{list.name}</h3>
              </div>
              <div className="cards-column">
                {cardsForList(list.id).map((card) => (
                  <div
                    key={card.id}
                    className="card-item"
                    draggable
                    onDragStart={(e) => onDragStart(e, card.id)}
                  >
                    <div className="card-title">{card.title}</div>
                    {card.due_date && (
                      <div className="card-meta">
                        Due: {new Date(card.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="list-column new-list-column">
            <form onSubmit={handleCreateList}>
              <input
                type="text"
                placeholder="Add list"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
              />
              <button type="submit" className="btn-secondary">
                Add List
              </button>
            </form>
          </div>
        </div>
        <div className="new-card-panel">
          <h3>Quick Add Card</h3>
          <form onSubmit={handleCreateCard}>
            <input
              type="text"
              placeholder="Card title"
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
            />
            <select
              value={selectedListId}
              onChange={(e) => setSelectedListId(e.target.value)}
            >
              <option value="">Select list</option>
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
            <button type="submit" className="btn-primary">
              Add Card
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default BoardPage;

