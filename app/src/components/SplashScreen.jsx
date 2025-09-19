import { useState, useEffect } from 'react';
import './SplashScreen.css';

function SplashScreen({ onComplete }) {
  const [isVisible, setIsVisible] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    // 페이드 인 시작
    const fadeInTimer = setTimeout(() => {
      setFadeIn(true);
    }, 100);

    // 2초 후 페이드 아웃 시작
    const fadeOutTimer = setTimeout(() => {
      setFadeIn(false);
    }, 2000);

    // 페이드 아웃 완료 후 컴포넌트 제거
    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 2500);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className={`splash-screen ${fadeIn ? 'fade-in' : 'fade-out'}`}>
      <div className="splash-content">
        <img 
          src="/splash-logo.png" 
          alt="Poseidon Logo" 
          className="splash-logo"
        />
      </div>
    </div>
  );
}

export default SplashScreen;