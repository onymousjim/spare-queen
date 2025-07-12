import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { playNavigationSound } from '../App';

const Metrics: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/metrics');
        setMetrics(res.data);
      } catch (err) {
        setError('Error fetching metrics');
      }
    };
    fetchMetrics();
  }, []);

  return (
    <div className="metrics-container">
      <button className="back-button-manual" onClick={() => {
        playNavigationSound();
        navigate('/');
      }}>← Back to Menu</button>
      
      <div className="metrics">
        <h2>Sweet Stats</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        {metrics && (
          <div className="metrics-content">
            <div className="total-games-section">
              <h3>Total Games Played</h3>
              <div className="total-games-count">{metrics.totalGames}</div>
            </div>
            
            <div className="players-stats-section">
              <h3>Player Statistics</h3>
              {metrics.players.map((player: any, index: number) => (
                <div key={index} className="player-metrics">
                  <div className="player-name-header">{player.name}</div>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">Total Wins</span>
                      <span className="stat-value wins">{player.totalWins}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Average Score</span>
                      <span className="stat-value average">{player.averageScore % 1 === 0 ? player.averageScore : player.averageScore.toFixed(2)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">High Score</span>
                      <span className="stat-value high">{player.maxScore}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Low Score</span>
                      <span className="stat-value low">{player.minScore}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Metrics;