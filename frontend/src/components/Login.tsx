import React, { useState } from 'react';
import axios from 'axios';
import { playNavigationSound } from '../App';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      await axios.post('/api/login', { username, password });
      onLogin();
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="login-container">
      <h2>Spare Queen</h2>
      <div className="login-background-image">
        <img src="/images/SpareQueenBackground.png" alt="Spare Queen" className="background-image" />
      </div>
      <div className="login-form">
        <div className="input-group">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="login-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
          />
        </div>
        <div className="button-group">
          <button onClick={() => {
            playNavigationSound();
            handleLogin();
          }} className="login-button">Login</button>
        </div>
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default Login;
