import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { playNavigationSound } from '../App';

import { normalizePlayerName } from '../utils';

interface Player {
  name: string;
  score: string;
}

interface Game {
  id: string;
  gameName: string;
  date: string;
  players: Player[];
  createdAt: string;
}

const EditScores: React.FC = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/games');
      setGames(response.data);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditGame = (game: Game) => {
    setEditingGame({ ...game });
    setSelectedGame(null);
  };

  const handleSaveEdit = async () => {
    if (!editingGame) return;

    setIsUpdating(true);
    try {
      await axios.put(`/api/games/${editingGame.id}`, {
        gameName: editingGame.gameName,
        date: editingGame.date,
        players: editingGame.players
      });
      
      await fetchGames(); // Refresh the list
      setEditingGame(null);
    } catch (error) {
      console.error('Error updating game:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    if (!window.confirm('Are you sure you want to delete this game?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await axios.delete(`/api/games/${gameId}`);
      await fetchGames(); // Refresh the list
      setSelectedGame(null);
    } catch (error) {
      console.error('Error deleting game:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePlayerChange = (index: number, field: 'name' | 'score', value: string) => {
    if (!editingGame) return;
    
    const newPlayers = [...editingGame.players];
    if (field === 'name') {
      newPlayers[index][field] = normalizePlayerName(value);
    } else {
      newPlayers[index][field] = value;
    }
    setEditingGame({ ...editingGame, players: newPlayers });
  };

  const addPlayer = () => {
    if (!editingGame) return;
    
    setEditingGame({
      ...editingGame,
      players: [...editingGame.players, { name: '', score: '' }]
    });
  };

  const deletePlayer = (index: number) => {
    if (!editingGame || editingGame.players.length <= 1) return;
    
    const newPlayers = editingGame.players.filter((_, i) => i !== index);
    setEditingGame({ ...editingGame, players: newPlayers });
  };


  if (loading) {
    return (
      <div className="edit-scores-container">
        <div style={{ textAlign: 'center', color: '#00ffcc', fontSize: '1.2em' }}>
          Loading games...
        </div>
      </div>
    );
  }

  if (editingGame) {
    return (
      <div className="edit-scores-container">
        <button className="back-button" onClick={() => {
          playNavigationSound();
          setEditingGame(null);
        }}>← Back to Game List</button>
        
        <div className="edit-game-form">
          <h2 style={{ 
            textAlign: 'center', 
            marginBottom: '30px',
            fontSize: window.innerWidth <= 480 ? '1.4em' : '1.8em',
            color: '#00ffcc',
            textShadow: '0 0 10px #00ffcc'
          }}>Edit Game: {editingGame.gameName}</h2>
          
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
              value={editingGame.gameName}
              onChange={(e) => setEditingGame({ ...editingGame, gameName: e.target.value })}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                backgroundColor: '#222',
                color: '#00ffcc',
                border: '2px solid #ff00ff',
                padding: '12px 15px',
                fontSize: '1em',
                fontFamily: "'Press Start 2P', cursive",
                boxShadow: '0 0 5px #ff00ff',
                outline: 'none'
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
              value={editingGame.date}
              onChange={(e) => setEditingGame({ ...editingGame, date: e.target.value })}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                backgroundColor: '#222',
                color: '#00ffcc',
                border: '2px solid #ff00ff',
                padding: '12px 15px',
                fontSize: '1em',
                fontFamily: "'Press Start 2P', cursive",
                boxShadow: '0 0 5px #ff00ff',
                outline: 'none'
              }}
            />
          </div>

          {editingGame.players.map((player, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '15px',
              marginBottom: '15px',
              padding: '15px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              border: '1px solid rgba(0, 255, 204, 0.3)'
            }}>
              <div style={{ flex: 2 }}>
                <label style={{
                  display: 'block',
                  color: '#00ffcc',
                  fontSize: '0.9em',
                  fontWeight: 'bold',
                  marginBottom: '5px',
                  textShadow: '0 0 3px #00ffcc'
                }}>Player {index + 1} Name:</label>
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) => handlePlayerChange(index, 'name', e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#222',
                    color: '#00ffcc',
                    border: '2px solid #ff00ff',
                    padding: '12px 15px',
                    fontSize: '1em',
                    fontFamily: "'Press Start 2P', cursive",
                    boxShadow: '0 0 5px #ff00ff',
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block',
                  color: '#00ffcc',
                  fontSize: '0.9em',
                  fontWeight: 'bold',
                  marginBottom: '5px',
                  textShadow: '0 0 3px #00ffcc'
                }}>Score:</label>
                <input
                  type="text"
                  value={player.score}
                  onChange={(e) => handlePlayerChange(index, 'score', e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#222',
                    color: '#00ffcc',
                    border: '2px solid #ff00ff',
                    padding: '12px 15px',
                    fontSize: '1em',
                    fontFamily: "'Press Start 2P', cursive",
                    boxShadow: '0 0 5px #ff00ff',
                    outline: 'none'
                  }}
                />
              </div>
              {editingGame.players.length > 1 && (
                <button
                  onClick={() => {
                    playNavigationSound();
                    deletePlayer(index);
                  }}
                  style={{
                    backgroundColor: '#440022',
                    color: '#ff6666',
                    border: '2px solid #ff6666',
                    padding: '12px 15px',
                    fontSize: '1em',
                    width: '50px',
                    fontFamily: "'Press Start 2P', cursive",
                    boxShadow: '0 0 5px #ff6666',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginTop: '20px',
            padding: '15px',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            border: '1px solid rgba(0, 255, 204, 0.3)'
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
                padding: '12px 20px',
                fontSize: '0.8em',
                fontFamily: "'Press Start 2P', cursive",
                boxShadow: '0 0 5px #00ffcc',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              + Add Player
            </button>

            <button 
              onClick={() => {
                playNavigationSound();
                handleSaveEdit();
              }}
              disabled={isUpdating || !editingGame.gameName.trim()}
              style={{
                backgroundColor: '#004422',
                color: '#00ffcc',
                border: '2px solid #00ffcc',
                padding: '12px 20px',
                fontSize: '0.8em',
                fontFamily: "'Press Start 2P', cursive",
                boxShadow: '0 0 5px #00ffcc',
                cursor: isUpdating ? 'not-allowed' : 'pointer',
                opacity: isUpdating ? 0.7 : 1,
                outline: 'none'
              }}
            >
              {isUpdating ? 'Updating...' : 'Update Game'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-scores-container">
      <button className="back-button" onClick={() => {
        playNavigationSound();
        navigate('/');
      }}>← Back to Menu</button>
      
      <div className="edit-scores-content">
        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: '30px',
          fontSize: window.innerWidth <= 480 ? '1.4em' : '1.8em',
          color: '#00ffcc',
          textShadow: '0 0 10px #00ffcc'
        }}>Edit Scores</h2>
        
        {games.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#00ffcc', 
            fontSize: '1em',
            padding: '20px'
          }}>
            No games found. Add some games first!
          </div>
        ) : (
          <div className="games-list">
            {games.map((game) => (
              <div key={game.id} style={{
                padding: '15px',
                marginBottom: '15px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '2px solid #ff00ff',
                borderRadius: '8px',
                boxShadow: '0 0 10px rgba(255, 0, 255, 0.3)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '10px'
                }}>
                  <div>
                    <h3 style={{ 
                      color: '#00ffcc', 
                      margin: '0 0 5px 0',
                      fontSize: '1.1em',
                      textShadow: '0 0 5px #00ffcc'
                    }}>{game.gameName}</h3>
                    <p style={{ 
                      color: '#ff00ff', 
                      margin: '0 0 5px 0',
                      fontSize: '0.8em'
                    }}>Date: {game.date}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => {
                        playNavigationSound();
                        handleEditGame(game);
                      }}
                      style={{
                        backgroundColor: '#002244',
                        color: '#00ffcc',
                        border: '2px solid #00ffcc',
                        padding: '8px 12px',
                        fontSize: '0.7em',
                        fontFamily: "'Press Start 2P', cursive",
                        boxShadow: '0 0 5px #00ffcc',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        playNavigationSound();
                        handleDeleteGame(game.id);
                      }}
                      disabled={isDeleting}
                      style={{
                        backgroundColor: '#440022',
                        color: '#ff6666',
                        border: '2px solid #ff6666',
                        padding: '8px 12px',
                        fontSize: '0.7em',
                        fontFamily: "'Press Start 2P', cursive",
                        boxShadow: '0 0 5px #ff6666',
                        cursor: isDeleting ? 'not-allowed' : 'pointer',
                        opacity: isDeleting ? 0.7 : 1,
                        outline: 'none'
                      }}
                    >
                      {isDeleting ? 'Del...' : 'Delete'}
                    </button>
                  </div>
                </div>
                <div style={{ color: '#ffffff', fontSize: '0.8em' }}>
                  Players: {game.players.map(p => `${p.name} (${p.score})`).join(', ')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EditScores;