import { useState } from 'react';
import { auth, setToken } from '../api';

function LoginModal({ onLogin, onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      if (isLogin) {
        result = await auth.login(email, password);
      } else {
        result = await auth.register(email, password);
      }

      setToken(result.token);
      onLogin({ email, ...result.user });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>{isLogin ? '로그인' : '회원가입'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="email">이메일:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">비밀번호:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength="6"
            />
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? '처리 중...' : (isLogin ? '로그인' : '회원가입')}
          </button>

          <div className="toggle-mode">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              disabled={loading}
              className="link-btn"
            >
              {isLogin ? '회원가입 하기' : '로그인 하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginModal;