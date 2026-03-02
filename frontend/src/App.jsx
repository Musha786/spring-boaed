import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BoardsPage from './pages/BoardsPage';
import BoardPage from './pages/BoardPage';
import './index.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null
  );

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const handleAuth = (data) => {
    setToken(data.token);
    setUser(data.user);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="logo">Sprint Board</div>
          {user && (
            <div className="header-right">
              <span className="user-name">{user.name}</span>
              <button className="btn-secondary" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </header>
        <main className="app-main">
          <Routes>
            <Route
              path="/login"
              element={
                token ? <Navigate to="/boards" /> : <LoginPage onAuthSuccess={handleAuth} />
              }
            />
            <Route
              path="/register"
              element={
                token ? <Navigate to="/boards" /> : <RegisterPage onAuthSuccess={handleAuth} />
              }
            />
            <Route
              path="/boards"
              element={
                token ? <BoardsPage token={token} /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/boards/:boardId"
              element={
                token ? (
                  <BoardPage token={token} user={user} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="*"
              element={<Navigate to={token ? '/boards' : '/login'} replace />}
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
