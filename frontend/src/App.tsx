import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import ManualEntry from './components/ManualEntry';
import ImageUpload from './components/ImageUpload';
import EditGame from './components/EditGame';
import EditScores from './components/EditScores';
import Metrics from './components/Metrics';
import PlayerStats from './components/PlayerStats';
import './App.css';

// Global sound utility function
export const playNavigationSound = () => {
  // Create a Nintendo-style menu blip sound with frequency sweep
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // Start at higher frequency and sweep down for classic Nintendo menu sound
  oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.05);
  oscillator.type = 'square';
  
  gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.08);
};

const MainMenu: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);

  const menuItems = [
    { label: 'Enter Scores', path: '/manual-entry' },
    { label: 'Scrape Scores', path: '/image-upload' },
    { label: 'Edit Scores', path: '/edit-scores' },
    { label: 'Sweet Stats', path: '/metrics' }
  ];


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          playNavigationSound();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : menuItems.length - 1);
          break;
        case 'ArrowDown':
          event.preventDefault();
          playNavigationSound();
          setSelectedIndex(prev => prev < menuItems.length - 1 ? prev + 1 : 0);
          break;
        case 'Enter':
          event.preventDefault();
          navigate(menuItems[selectedIndex].path);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, navigate, menuItems]);

  return (
    <div className="main-menu">
      <h1 className="spare-queen-title">Spare<br />Queen</h1>
      <div className="menu-items">
        {menuItems.map((item, index) => (
          <div key={item.path} className="menu-item-container">
            <div className="menu-icon-external">
              {index === selectedIndex ? (
                <img src="/images/BowlingBallPurple2.png" alt="bowling ball" className="bowling-ball-image" />
              ) : null}
            </div>
            <div
              className={`menu-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => {
                playNavigationSound();
                setSelectedIndex(index);
                navigate(item.path);
              }}
            >
              <span className="menu-label">{item.label}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="menu-instructions">
        Use ↑↓ arrows to navigate, Enter to select
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [loggedIn, setLoggedIn] = useState(false);

  const handleLogin = () => {
    setLoggedIn(true);
  };

  return (
    <Router>
      <div className="App">
        <div className="background-overlay">
          <img src="/images/SpareQueenBackground.png" alt="" />
        </div>
        {loggedIn ? (
          <Routes>
            <Route path="/" element={<MainMenu />} />
            <Route path="/manual-entry" element={<ManualEntry />} />
            <Route path="/image-upload" element={<ImageUpload />} />
            <Route path="/edit-game" element={<EditGame />} />
            <Route path="/edit-scores" element={<EditScores />} />
            <Route path="/metrics" element={<Metrics />} />
            <Route path="/player/:playerName" element={<PlayerStats />} />
          </Routes>
        ) : (
          <Routes>
            <Route path="/" element={<Login onLogin={handleLogin} />} />
          </Routes>
        )}
      </div>
    </Router>
  );
};

export default App;