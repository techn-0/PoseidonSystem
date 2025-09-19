import { useState, useEffect, useRef } from 'react';
import { getToken, removeToken, auth } from './api';
import MapPanel from './components/MapPanel';
import Sidebar from './components/Sidebar';
import LoginModal from './components/LoginModal';
import SplashScreen from './components/SplashScreen';
import './styles.css';

function App() {
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          const userData = await auth.me();
          setUser(userData);
        } catch (error) {
          console.error('Auth check failed:', error);
          removeToken();
        }
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    removeToken();
    setUser(null);
  };

  const handleLocationChange = (lat, lng) => {
    if (mapRef.current && mapRef.current.moveToLocation) {
      mapRef.current.moveToLocation(lat, lng);
    }
  };

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="app">
      {/* 상단 툴바 */}
      <header className="toolbar">
        <div className="logo-title">
          <img src="/poseidon-logo.png" alt="Poseidon Logo" className="logo" />
          <h1>Poseidon System</h1>
        </div>
        <div className="auth-section">
          {user ? (
            <div className="user-info">
              <span>환영합니다, {user.email}</span>
              <button onClick={handleLogout}>로그아웃</button>
            </div>
          ) : (
            <button onClick={() => setShowLoginModal(true)}>로그인</button>
          )}
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="main-content">
        <Sidebar 
          user={user} 
          mapRef={mapRef}
          lastUpdateTime={lastUpdateTime}
          onLocationChange={handleLocationChange}
        />
        <MapPanel 
          ref={mapRef}
          onUpdateTime={setLastUpdateTime}
        />
      </main>

      {/* 로그인 모달 */}
      {showLoginModal && (
        <LoginModal 
          onLogin={handleLogin}
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </div>
  );
}

export default App;
