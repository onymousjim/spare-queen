import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { playNavigationSound } from '../App';

interface Player {
  name: string;
  score: string;
}

interface LocationState {
  players: Player[];
  scrapedData: any;
  imageUrl?: string;
}

const EditGame: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const [gameName, setGameName] = useState('');
  const [players, setPlayers] = useState<Player[]>(state?.players || []);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const generateDefaultGameName = async (date: string): Promise<string> => {
    try {
      const response = await axios.get(`http://localhost:5000/api/games/count/${date}`);
      return response.data.nextGameName;
    } catch (error) {
      console.error('Error fetching games count:', error);
      return 'Game 1';
    }
  };

  useEffect(() => {
    const setDefaultGameName = async () => {
      const defaultName = await generateDefaultGameName(date);
      setGameName(defaultName);
    };
    setDefaultGameName();
  }, [date]);

  // Redirect if no data was passed
  useEffect(() => {
    if (!state?.players) {
      navigate('/image-upload');
    }
  }, [state, navigate]);

  const handlePlayerChange = (index: number, field: 'name' | 'score', value: string) => {
    const newPlayers = [...players];
    newPlayers[index][field] = value;
    setPlayers(newPlayers);
  };

  const handleSave = async () => {
    if (!gameName.trim()) {
      return;
    }

    setIsSaving(true);

    try {
      await axios.post('http://localhost:5000/api/games', { gameName, players, date });
      
      // Navigate back to main menu with success
      navigate('/', { 
        state: { 
          message: `Game "${gameName}" saved successfully!` 
        } 
      });
    } catch (err) {
      console.error('Error saving game:', err);
      setIsSaving(false);
    }
  };

  if (!state?.players) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="edit-game-container">
      <button className="back-button-manual" onClick={() => {
        playNavigationSound();
        navigate('/image-upload');
      }}>← Back to Upload</button>
      
      <div className="edit-game-form">
        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: '30px',
          fontSize: window.innerWidth <= 480 ? '1.4em' : '1.8em',
          color: '#00ffcc',
          textShadow: '0 0 10px #00ffcc'
        }}>Edit Game Data</h2>
        
        {state?.imageUrl && (
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '30px',
            padding: '15px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '8px',
            border: '1px solid rgba(0, 255, 204, 0.3)'
          }}>
            <h3 style={{ 
              color: '#00ffcc', 
              marginBottom: '15px',
              fontSize: '1em',
              textShadow: '0 0 5px #00ffcc'
            }}>Uploaded Image:</h3>
            <img 
              src={state.imageUrl} 
              alt="Uploaded scorecard" 
              style={{
                maxWidth: '100%',
                maxHeight: '300px',
                borderRadius: '5px',
                border: '2px solid #ff00ff',
                boxShadow: '0 0 10px rgba(255, 0, 255, 0.5)'
              }}
            />
          </div>
        )}
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{
            display: 'block',
            color: '#00ffcc',
            fontSize: '0.9em',
            fontWeight: 'bold',
            marginBottom: '5px',
            textShadow: '0 0 3px #00ffcc'
          }}>Game Name:</label>
          <input
            type="text"
            placeholder="Game Name"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            color: '#00ffcc',
            fontSize: '0.9em',
            fontWeight: 'bold',
            marginBottom: '5px',
            textShadow: '0 0 3px #00ffcc'
          }}>Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {players.map((player, index) => (
          <div key={index} className="player-row-layout" style={{
            display: 'flex',
            flexDirection: window.innerWidth <= 480 ? 'column' : 'row',
            alignItems: window.innerWidth <= 480 ? 'stretch' : 'flex-end',
            gap: window.innerWidth <= 480 ? '10px' : '15px',
            marginBottom: '15px',
            padding: window.innerWidth <= 480 ? '12px' : '15px',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            border: '1px solid rgba(0, 255, 204, 0.3)'
          }}>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              flex: window.innerWidth <= 480 ? 1 : 2, 
              gap: '5px' 
            }}>
              <label htmlFor={`player-name-${index}`} style={{
                color: '#00ffcc',
                fontSize: window.innerWidth <= 480 ? '0.85em' : '0.9em',
                fontWeight: 'bold',
                marginBottom: '5px',
                textShadow: '0 0 3px #00ffcc'
              }}>Player {index + 1} Name:</label>
              <input
                id={`player-name-${index}`}
                type="text"
                placeholder="Enter player name"
                value={player.name}
                onChange={(e) => handlePlayerChange(index, 'name', e.target.value)}
                onFocus={() => setFocusedInput(`name-${index}`)}
                onBlur={() => setFocusedInput(null)}
                style={{
                  backgroundColor: '#222',
                  color: '#00ffcc',
                  border: '2px solid #ff00ff',
                  padding: window.innerWidth <= 480 ? '10px 12px' : '12px 15px',
                  fontSize: window.innerWidth <= 480 ? '0.9em' : '1em',
                  minHeight: '44px',
                  boxSizing: 'border-box',
                  fontFamily: "'Press Start 2P', cursive",
                  boxShadow: focusedInput === `name-${index}` ? '0 0 10px #ff00ff, 0 0 15px #ff00ff' : '0 0 5px #ff00ff',
                  transition: 'all 0.3s ease',
                  width: '100%',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              flex: 1, 
              gap: '5px' 
            }}>
              <label htmlFor={`player-score-${index}`} style={{
                color: '#00ffcc',
                fontSize: window.innerWidth <= 480 ? '0.85em' : '0.9em',
                fontWeight: 'bold',
                marginBottom: '5px',
                textShadow: '0 0 3px #00ffcc'
              }}>Score:</label>
              <input
                id={`player-score-${index}`}
                type="text"
                placeholder="Enter score"
                value={player.score}
                onChange={(e) => handlePlayerChange(index, 'score', e.target.value)}
                onFocus={() => setFocusedInput(`score-${index}`)}
                onBlur={() => setFocusedInput(null)}
                style={{
                  backgroundColor: '#222',
                  color: '#00ffcc',
                  border: '2px solid #ff00ff',
                  padding: window.innerWidth <= 480 ? '10px 12px' : '12px 15px',
                  fontSize: window.innerWidth <= 480 ? '0.9em' : '1em',
                  minHeight: '44px',
                  boxSizing: 'border-box',
                  fontFamily: "'Press Start 2P', cursive",
                  boxShadow: focusedInput === `score-${index}` ? '0 0 10px #ff00ff, 0 0 15px #ff00ff' : '0 0 5px #ff00ff',
                  transition: 'all 0.3s ease',
                  width: '100%',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        ))}

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button 
            onClick={() => {
              playNavigationSound();
              handleSave();
            }}
            disabled={isSaving || !gameName.trim()}
            style={{
              opacity: (isSaving || !gameName.trim()) ? 0.7 : 1,
              cursor: (isSaving || !gameName.trim()) ? 'not-allowed' : 'pointer'
            }}
            className="save-button"
          >
            {isSaving ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <span className="loading-spinner"></span>
                Saving...
              </span>
            ) : (
              'Save Game'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditGame;