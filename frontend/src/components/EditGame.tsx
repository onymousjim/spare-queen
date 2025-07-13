import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { playNavigationSound } from '../App';

import { normalizePlayerName } from '../utils';

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
  const [players, setPlayers] = useState<Player[]>(state?.players.map(p => ({...p, name: normalizePlayerName(p.name)})) || []);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const generateDefaultGameName = async (date: string): Promise<string> => {
    try {
      const response = await axios.get(`/api/games/count/${date}`);
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
    if (field === 'name') {
      newPlayers[index][field] = normalizePlayerName(value);
    } else {
      newPlayers[index][field] = value;
    }
    setPlayers(newPlayers);
  };

  const addPlayer = () => {
    setPlayers([...players, { name: '', score: '' }]);
  };

  const deletePlayer = (index: number) => {
    if (players.length > 1) { // Prevent deleting the last player
      const newPlayers = players.filter((_, i) => i !== index);
      setPlayers(newPlayers);
    }
  };

  const handleSave = async () => {
    if (!gameName.trim()) {
      return;
    }

    setIsSaving(true);

    try {
      await axios.post('/api/games', { gameName, players, date });
      
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
      <button className="back-button" onClick={() => {
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
            {players.length > 1 && (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: window.innerWidth <= 480 ? 'stretch' : 'center',
                marginLeft: window.innerWidth <= 480 ? '0' : '10px',
                marginTop: window.innerWidth <= 480 ? '10px' : '0',
                gap: '5px'
              }}>
                <label style={{
                  color: '#ff6666',
                  fontSize: window.innerWidth <= 480 ? '0.85em' : '0.9em',
                  fontWeight: 'bold',
                  marginBottom: '5px',
                  textShadow: '0 0 3px #ff6666',
                  visibility: 'hidden' // Hidden label to maintain alignment
                }}>Delete:</label>
                <button
                  onClick={() => {
                    playNavigationSound();
                    deletePlayer(index);
                  }}
                  style={{
                    backgroundColor: '#440022',
                    color: '#ff6666',
                    border: '2px solid #ff6666',
                    padding: window.innerWidth <= 480 ? '10px 12px' : '12px 15px',
                    fontSize: window.innerWidth <= 480 ? '0.9em' : '1em',
                    minHeight: '44px',
                    width: window.innerWidth <= 480 ? '100%' : '50px',
                    boxSizing: 'border-box',
                    fontFamily: "'Press Start 2P', cursive",
                    boxShadow: '0 0 5px #ff6666',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    borderRadius: '0',
                    outline: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#ff6666';
                    e.currentTarget.style.color = '#000';
                    e.currentTarget.style.boxShadow = '0 0 10px #ff6666';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#440022';
                    e.currentTarget.style.color = '#ff6666';
                    e.currentTarget.style.boxShadow = '0 0 5px #ff6666';
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        ))}

        <div style={{ 
          display: 'flex', 
          flexDirection: window.innerWidth <= 480 ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: window.innerWidth <= 480 ? 'stretch' : 'flex-start',
          marginTop: '20px',
          gap: window.innerWidth <= 480 ? '15px' : '0',
          padding: window.innerWidth <= 480 ? '0' : '0 15px', // Match the player box padding
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '8px',
          border: '1px solid rgba(0, 255, 204, 0.3)',
          paddingTop: '15px',
          paddingBottom: '15px'
        }}>
          <button 
            onClick={() => {
              playNavigationSound();
              addPlayer();
            }}
            style={{
              backgroundColor: '#002244',
              color: '#00ffcc',
              border: '2px solid #00ffcc',
              padding: window.innerWidth <= 480 ? '12px 20px' : '12px 20px',
              fontSize: window.innerWidth <= 480 ? '0.8em' : '0.8em',
              fontFamily: "'Press Start 2P', cursive",
              boxShadow: '0 0 5px #00ffcc',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              borderRadius: '0',
              outline: 'none',
              alignSelf: window.innerWidth <= 480 ? 'center' : 'flex-start'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#00ffcc';
              e.currentTarget.style.color = '#000';
              e.currentTarget.style.boxShadow = '0 0 10px #00ffcc';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#002244';
              e.currentTarget.style.color = '#00ffcc';
              e.currentTarget.style.boxShadow = '0 0 5px #00ffcc';
            }}
          >
            + Add Player
          </button>

          <button 
            onClick={() => {
              playNavigationSound();
              handleSave();
            }}
            disabled={isSaving || !gameName.trim()}
            style={{
              backgroundColor: '#004422',
              color: '#00ffcc',
              border: '2px solid #00ffcc',
              padding: window.innerWidth <= 480 ? '12px 20px' : '12px 20px',
              fontSize: window.innerWidth <= 480 ? '0.8em' : '0.8em',
              fontFamily: "'Press Start 2P', cursive",
              boxShadow: '0 0 5px #00ffcc',
              transition: 'all 0.3s ease',
              cursor: (isSaving || !gameName.trim()) ? 'not-allowed' : 'pointer',
              opacity: (isSaving || !gameName.trim()) ? 0.7 : 1,
              borderRadius: '0',
              outline: 'none',
              alignSelf: window.innerWidth <= 480 ? 'center' : 'flex-end'
            }}
            onMouseEnter={(e) => {
              if (!isSaving && gameName.trim()) {
                e.currentTarget.style.backgroundColor = '#00ffcc';
                e.currentTarget.style.color = '#000';
                e.currentTarget.style.boxShadow = '0 0 10px #00ffcc';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#004422';
              e.currentTarget.style.color = '#00ffcc';
              e.currentTarget.style.boxShadow = '0 0 5px #00ffcc';
            }}
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