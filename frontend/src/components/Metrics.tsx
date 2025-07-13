import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { playNavigationSound } from '../App';

const Metrics: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/metrics');
        const sortedPlayers = res.data.players.sort((a: any, b: any) => parseFloat(b.averageScore) - parseFloat(a.averageScore));
        setMetrics({ ...res.data, players: sortedPlayers });
      } catch (err) {
        setError('Error fetching metrics');
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  return (
    <div className="metrics-container">
      <button className="back-button" onClick={() => {
        playNavigationSound();
        navigate('/');
      }}>← Back to Menu</button>
      
      <div className="metrics">
        <h2>Sweet Stats</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">Preparing your scoreboard...</div>
          </div>
        )}
        
        {!loading && metrics && (
          <div className="metrics-content">
            <div className="total-games-section">
              <h3>Total Games Played</h3>
              <div className="total-games-count">{metrics.totalGames}</div>
            </div>
            
            <div className="players-ranking-section">
              <h3>Player Rankings</h3>
              <p style={{ fontSize: '0.8em', color: '#aaa', marginTop: '-15px', marginBottom: '20px' }}>
                (click player for details)
              </p>
              <div className="ranking-list">
                {metrics.players.map((player: any, index: number) => (
                  <Link to={`/player/${player.name}`} state={{ player }} key={index} className="player-rank-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="player-rank">{index + 1}</div>
                    <div className="player-rank-name">{player.name}</div>
                    <div className="player-rank-avg">
                      Avg: {player.averageScore % 1 === 0 ? player.averageScore : player.averageScore.toFixed(2)}
                    </div>
                    <div className="player-rank-wins">
                      Wins: {player.totalWins}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Metrics;