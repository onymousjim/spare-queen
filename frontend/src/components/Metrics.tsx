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
    <div className="metrics">
      <button className="back-button" onClick={() => {
        playNavigationSound();
        navigate('/');
      }}>← Back to Menu</button>
      <h2>Metrics</h2>
      {error && <p>{error}</p>}
      {metrics && (
        <div>
          <p>Total Games Played: {metrics.totalGames}</p>
          {metrics.players.map((player: any, index: number) => (
            <div key={index} className="player-metrics">
              <h3>{player.name}</h3>
              <p>Total Wins: {player.totalWins}</p>
              <p>Average Score: {player.averageScore}</p>
              <p>Max Score: {player.maxScore}</p>
              <p>Min Score: {player.minScore}</p>
              {/* Add graph here later */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Metrics;