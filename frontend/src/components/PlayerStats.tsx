import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { playNavigationSound } from '../App';
import ScoreScatterPlot from './ScoreScatterPlot';

const PlayerStats: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { playerName } = useParams<{ playerName: string }>();
  const { player: summaryStats } = location.state || {};

  const [gameHistory, setGameHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGameHistory = async () => {
      if (!playerName) return;
      try {
        setLoading(true);
        const res = await axios.get(`/api/players/${playerName}/games`);
        setGameHistory(res.data);
      } catch (err) {
        console.error("Failed to fetch player game history", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGameHistory();
  }, [playerName]);

  if (!summaryStats) {
    // This could happen if the page is refreshed or accessed directly
    // You might want to fetch summary stats as well in a real app
    return (
      <div className="metrics-container">
        <p>Player data not found. Please return to the rankings.</p>
        <button className="back-button" onClick={() => navigate('/metrics')}>
          ← Back to Rankings
        </button>
      </div>
    );
  }

  return (
    <div className="metrics-container">
      <button className="back-button" onClick={() => {
        playNavigationSound();
        navigate('/metrics');
      }}>← Back to Rankings</button>

      <div className="metrics">
        <h2 style={{ fontSize: '2em', marginBottom: '40px' }}>{summaryStats.name}'s Stats</h2>
        <div className="player-metrics" style={{ border: '3px solid #00ffcc', boxShadow: '0 0 15px #00ffcc' }}>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Wins</span>
              <span className="stat-value wins">{summaryStats.totalWins}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Average Score</span>
              <span className="stat-value average">
                {summaryStats.averageScore % 1 === 0 ? summaryStats.averageScore : summaryStats.averageScore.toFixed(2)}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">High Score</span>
              <span className="stat-value high">{summaryStats.maxScore}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Low Score</span>
              <span className="stat-value low">{summaryStats.minScore}</span>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading Score History...</div>
          </div>
        ) : (
          <ScoreScatterPlot games={gameHistory} />
        )}
      </div>
    </div>
  );
};

export default PlayerStats;
