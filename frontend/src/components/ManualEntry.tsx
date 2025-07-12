import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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

  const handleGameInfoNext = () => {
    if (gameName.trim()) {
      setCurrentStep('add-players');
    }
  };

  const handleAddPlayer = () => {
    if (currentPlayer.name.trim() && currentPlayer.score.trim()) {
      setPlayers([...players, currentPlayer]);
      setCurrentPlayer({ name: '', score: '' });
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
      await axios.post('http://localhost:5000/api/games', { gameName, players, date });
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
          <button onClick={handleBack} className="manual-button">← Back</button>
          <button 
            onClick={handleGameInfoNext} 
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
            placeholder="Score"
            value={currentPlayer.score}
            onChange={(e) => setCurrentPlayer({...currentPlayer, score: e.target.value})}
            className="manual-input"
          />
          <button 
            onClick={handleAddPlayer}
            className="manual-button"
            disabled={!currentPlayer.name.trim() || !currentPlayer.score.trim()}
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
                    onClick={() => handleEditPlayer(index)}
                    className="edit-button"
                    title="Edit Player"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleRemovePlayer(index)}
                    className="remove-button"
                    title="Remove Player"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="button-group-manual">
          <button onClick={handleBack} className="manual-button">← Back</button>
          <button 
            onClick={handleFinishAddingPlayers}
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
                  {player.name}: {player.score}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="button-group-manual">
          <button onClick={handleBack} className="manual-button">← Back</button>
          <button onClick={handleSave} className="manual-button save-button">
            Save Game
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="manual-entry-container">
      <button className="back-button-manual" onClick={() => navigate('/')}>← Back to Menu</button>
      
      {currentStep === 'game-info' && renderGameInfoStep()}
      {currentStep === 'add-players' && renderAddPlayersStep()}
      {currentStep === 'review' && renderReviewStep()}
    </div>
  );
};

export default ManualEntry;
