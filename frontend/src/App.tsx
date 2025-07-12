import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import ManualEntry from './components/ManualEntry';
import ImageUpload from './components/ImageUpload';
import Metrics from './components/Metrics';
import './App.css';

const MainMenu: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);

  const menuItems = [
    { label: 'Manual Entry', path: '/manual-entry' },
    { label: 'Image Upload', path: '/image-upload' },
    { label: 'Metrics', path: '/metrics' }
  ];

  const playNavigationSound = () => {
    // Create a simple 8-bit beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

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
      <h2>Spare Queen</h2>
      <div className="menu-items">
        {menuItems.map((item, index) => (
          <div
            key={item.path}
            className={`menu-item ${index === selectedIndex ? 'selected' : ''}`}
            onClick={() => {
              setSelectedIndex(index);
              navigate(item.path);
            }}
          >
            <span className="menu-icon">
              {index === selectedIndex ? '●' : ' '}
            </span>
            <span className="menu-label">{item.label}</span>
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
        {loggedIn ? (
          <Routes>
            <Route path="/" element={<MainMenu />} />
            <Route path="/manual-entry" element={<ManualEntry />} />
            <Route path="/image-upload" element={<ImageUpload />} />
            <Route path="/metrics" element={<Metrics />} />
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