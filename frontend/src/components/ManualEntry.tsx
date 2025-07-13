import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { playNavigationSound } from '../App';

interface Player {
  name: string;
  score: string;
}

type Step = 'game-info' | 'add-players' | 'review';

const ManualEntry: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('game-info');
  const [gameName, setGameName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player>({ name: '', score: '' });
  const [scoreError, setScoreError] = useState('');

  const getDefaultPlayerName = (playerNumber: number): string => {
    const defaultNames = ['Lily', 'Mary', 'Jim'];
    return playerNumber <= defaultNames.length ? defaultNames[playerNumber - 1] : '';
  };

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
    // Set default game name when component mounts or date changes
    const setDefaultGameName = async () => {
      if (!gameName) {
        const defaultName = await generateDefaultGameName(date);
        setGameName(defaultName);
      }
    };
    
    if (currentStep === 'game-info') {
      setDefaultGameName();
    }
  }, [currentStep, date]);

  // Update game name when date changes
  useEffect(() => {
    const updateGameNameForDate = async () => {
      const defaultName = await generateDefaultGameName(date);
      setGameName(defaultName);
    };
    
    if (currentStep === 'game-info') {
      updateGameNameForDate();
    }
  }, [date, currentStep]);

  const handleGameInfoNext = () => {
    if (gameName.trim()) {
      setCurrentStep('add-players');
      // Set default name for first player
      const defaultName = getDefaultPlayerName(1);
      setCurrentPlayer({ name: defaultName, score: '' });
    }
  };

  const handleAddPlayer = () => {
    if (currentPlayer.name.trim() && isValidScore(currentPlayer.score)) {
      setPlayers([...players, currentPlayer]);
      // Set default name for next player
      const nextPlayerNumber = players.length + 2;
      const defaultName = getDefaultPlayerName(nextPlayerNumber);
      setCurrentPlayer({ name: defaultName, score: '' });
    }
  };

  const isValidScore = (score: string): boolean => {
    const numScore = parseInt(score, 10);
    return !isNaN(numScore) && numScore >= 0 && numScore <= 300 && score === numScore.toString();
  };

  const handleScoreChange = (value: string) => {
    // Only allow digits
    const digitsOnly = value.replace(/[^0-9]/g, '');
    
    // Limit to 3 digits maximum (for 300)
    const limitedDigits = digitsOnly.slice(0, 3);
    
    // Convert to number and ensure it's within range
    const numValue = parseInt(limitedDigits, 10);
    if (!isNaN(numValue) && numValue <= 300) {
      setCurrentPlayer({...currentPlayer, score: limitedDigits});
      setScoreError('');
    } else if (limitedDigits === '') {
      setCurrentPlayer({...currentPlayer, score: ''});
      setScoreError('');
    } else {
      setScoreError('Score must be between 0 and 300');
    }
  };

  const handleFinishAddingPlayers = () => {
    if (players.length > 0) {
      setCurrentStep('review');
    }
  };

  const handleRemovePlayer = (index: number) => {
    const newPlayers = players.filter((_, i) => i !== index);
    setPlayers(newPlayers);
  };

  const handleEditPlayer = (index: number) => {
    const playerToEdit = players[index];
    setCurrentPlayer(playerToEdit);
    handleRemovePlayer(index);
  };

  const handleSave = async () => {
    try {
      await axios.post('/api/games', { gameName, players, date });
      // Reset form and go back to menu
      setGameName('');
      setPlayers([]);
      setCurrentPlayer({ name: '', score: '' });
      setDate(new Date().toISOString().split('T')[0]);
      setCurrentStep('game-info');
      navigate('/');
    } catch (err) {
      // Handle error
    }
  };

  const handleBack = () => {
    if (currentStep === 'add-players') {
      setCurrentStep('game-info');
    } else if (currentStep === 'review') {
      setCurrentStep('add-players');
      // Set appropriate default name when returning to add players
      const nextPlayerNumber = players.length + 1;
      const defaultName = getDefaultPlayerName(nextPlayerNumber);
      setCurrentPlayer({ name: defaultName, score: '' });
    } else {
      navigate('/');
    }
  };

  const renderGameInfoStep = () => (
    <div className="manual-entry">
      <h2>Game Information</h2>
      <div className="step-indicator">Step 1 of 3</div>
      
      <div className="form-fields">
        <input
          type="text"
          placeholder="Game Name"
          value={gameName}
          onChange={(e) => setGameName(e.target.value)}
          className="manual-input"
          autoFocus
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="manual-input"
        />
        
        <div className="button-group-manual">
          <button onClick={() => {
            playNavigationSound();
            handleBack();
          }} className="manual-button">← Back</button>
          <button 
            onClick={() => {
              playNavigationSound();
              handleGameInfoNext();
            }} 
            className="manual-button save-button"
            disabled={!gameName.trim()}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );

  const renderAddPlayersStep = () => (
    <div className="manual-entry">
      <h2>Add Players</h2>
      <div className="step-indicator">Step 2 of 3</div>
      
      <div className="form-fields">
        <div className="current-player-section">
          <h3>Add Player {players.length + 1}</h3>
          <input
            type="text"
            placeholder="Player Name"
            value={currentPlayer.name}
            onChange={(e) => setCurrentPlayer({...currentPlayer, name: e.target.value})}
            className="manual-input"
            autoFocus
          />
          <input
            type="text"
            placeholder="Score (0-300)"
            value={currentPlayer.score}
            onChange={(e) => handleScoreChange(e.target.value)}
            className="manual-input"
          />
          {scoreError && <div className="score-error">{scoreError}</div>}
          <button 
            onClick={() => {
              playNavigationSound();
              handleAddPlayer();
            }}
            className="manual-button"
            disabled={!currentPlayer.name.trim() || !isValidScore(currentPlayer.score)}
          >
            Add Player
          </button>
        </div>

        {players.length > 0 && (
          <div className="players-list">
            <h3>Added Players ({players.length})</h3>
            {players.map((player, index) => (
              <div key={index} className="player-summary">
                <span>{player.name}: {player.score}</span>
                <div className="player-actions">
                  <button 
                    onClick={() => {
                      playNavigationSound();
                      handleEditPlayer(index);
                    }}
                    className="edit-button"
                    title="Edit Player"
                  >
                    EDIT
                  </button>
                  <button 
                    onClick={() => {
                      playNavigationSound();
                      handleRemovePlayer(index);
                    }}
                    className="remove-button"
                    title="Remove Player"
                  >
                    DEL
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="button-group-manual">
          <button onClick={() => {
            playNavigationSound();
            handleBack();
          }} className="manual-button">← Back</button>
          <button 
            onClick={() => {
              playNavigationSound();
              handleFinishAddingPlayers();
            }}
            className="manual-button save-button"
            disabled={players.length === 0}
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="manual-entry">
      <h2>Review & Save</h2>
      <div className="step-indicator">Step 3 of 3</div>
      
      <div className="form-fields">
        <div className="review-section">
          <div className="review-item">
            <strong>Game Name:</strong> {gameName}
          </div>
          <div className="review-item">
            <strong>Date:</strong> {date}
          </div>
          <div className="review-item">
            <strong>Players:</strong>
            <div className="players-review">
              {players.map((player, index) => (
                <div key={index} className="player-review">
                  <span className="player-name">{player.name}</span>
                                    <span className="player-score">{player.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="button-group-manual">
          <button onClick={() => {
            playNavigationSound();
            handleBack();
          }} className="manual-button">← Back</button>
          <button onClick={() => {
            playNavigationSound();
            handleSave();
          }} className="manual-button save-button">
            Save Game
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="manual-entry-container">
      <button className="back-button" onClick={() => {
        playNavigationSound();
        navigate('/');
      }}>← Back to Menu</button>
      
      {currentStep === 'game-info' && renderGameInfoStep()}
      {currentStep === 'add-players' && renderAddPlayersStep()}
      {currentStep === 'review' && renderReviewStep()}
    </div>
  );
};

export default ManualEntry;
