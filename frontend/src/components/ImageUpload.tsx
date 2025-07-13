import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { playNavigationSound } from '../App';

const ImageUpload: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [scrapedData, setScrapedData] = useState<any>(null);
  const [error, setError] = useState('');
  const [gameName, setGameName] = useState('');
  const [players, setPlayers] = useState<{ name: string; score: string }[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Clear error message after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const startCamera = async () => {
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera not supported in this browser');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Use back camera if available
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
        setError(''); // Clear any previous errors
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      
      // Provide specific error messages
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotSupportedError') {
        setError('Camera not supported in this browser.');
      } else if (err.name === 'SecurityError') {
        setError('Camera access blocked. Make sure you are using HTTPS.');
      } else {
        setError(`Camera error: ${err.message || 'Unknown error'}`);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        
        canvasRef.current.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'captured-image.jpg', { type: 'image/jpeg' });
            setFile(file);
            stopCamera();
          }
        }, 'image/jpeg');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await axios.post('http://localhost:5000/api/scrape', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('API Response:', res.data);
      setScrapedData(res.data);
      setPlayers(res.data.players);
      setError('');
    } catch (err) {
      setError('Error scraping image');
    }
  };

  const handlePlayerChange = (index: number, field: 'name' | 'score', value: string) => {
    const newPlayers = [...players];
    newPlayers[index][field] = value;
    setPlayers(newPlayers);
  };

  const handleSave = async () => {
    try {
      await axios.post('http://localhost:5000/api/games', { gameName, players, date });
      // Reset form
      setFile(null);
      setScrapedData(null);
      setGameName('');
      setPlayers([]);
      setDate(new Date().toISOString().split('T')[0]);
    } catch (err) {
      // Handle error
    }
  };

  return (
    <div className="image-upload-container">
      <button className="back-button-manual" onClick={() => {
        playNavigationSound();
        navigate('/');
      }}>← Back to Menu</button>
      
      <div className="image-upload">
        <h2>Image Options</h2>
        
        <div className="image-options">
          <button className="option-button take-photo-btn" onClick={() => {
            playNavigationSound();
            startCamera();
          }}>
            Take Photo
          </button>
          
          <div className="upload-option">
            <input 
              type="file" 
              onChange={handleFileChange} 
              id="file-upload" 
              style={{ display: 'none' }}
            />
            <label htmlFor="file-upload" className="option-button upload-photo-btn">
              Upload Photo
            </label>
          </div>
        </div>
        
        {file && (
          <div className="upload-action">
            <button className="process-button" onClick={() => {
              playNavigationSound();
              handleUpload();
            }}>Process Image</button>
          </div>
        )}
      </div>
      
      {showCamera && (
        <div className="camera-container">
          <video ref={videoRef} autoPlay playsInline style={{ maxWidth: '100%' }} />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div>
            <button onClick={() => {
              playNavigationSound();
              capturePhoto();
            }}>Capture</button>
            <button onClick={() => {
              playNavigationSound();
              stopCamera();
            }}>Cancel</button>
          </div>
        </div>
      )}
      
      {error && <p className="camera-error">{error}</p>}
      {scrapedData && (
        <div className="scraped-data-form">
          <h3>Scraped Data</h3>
          
          {/* Display the extracted data clearly */}
          {scrapedData && scrapedData.scrapedData && (
            <div className="extracted-data-display">
              <h4>Extracted Information:</h4>
              <div className="data-columns">
                <div className="names-column">
                  <h5>Player Names (Left Column):</h5>
                  {scrapedData.scrapedData.playerNames && scrapedData.scrapedData.playerNames.map((name: string, index: number) => (
                    <div key={index} className="extracted-item">
                      {index + 1}. {name || '(Not detected)'}
                    </div>
                  ))}
                </div>
                <div className="scores-column">
                  <h5>Scores (Right Column):</h5>
                  {scrapedData.scrapedData.playerScores && scrapedData.scrapedData.playerScores.map((score: string, index: number) => (
                    <div key={index} className="extracted-item">
                      {index + 1}. {score || '(Not detected)'}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Debug: Show raw scraped data */}
          {scrapedData && (
            <div style={{background: '#222', padding: '10px', margin: '10px 0', fontSize: '12px'}}>
              <strong>Debug - Raw Response:</strong>
              <pre>{JSON.stringify(scrapedData, null, 2)}</pre>
            </div>
          )}
          
          <h4>Edit Game Data:</h4>
          <input
            type="text"
            placeholder="Game Name"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          {players.map((player, index) => (
            <div key={index} className="player-row-layout" style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '15px',
              marginBottom: '15px',
              padding: '15px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              border: '1px solid rgba(0, 255, 204, 0.3)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 2, gap: '5px' }}>
                <label htmlFor={`player-name-${index}`} style={{
                  color: '#00ffcc',
                  fontSize: '0.9em',
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
                    padding: '12px 15px',
                    fontSize: '1em',
                    minHeight: '44px',
                    boxSizing: 'border-box',
                    fontFamily: "'Press Start 2P', cursive",
                    boxShadow: focusedInput === `name-${index}` ? '0 0 10px #ff00ff, 0 0 15px #ff00ff' : '0 0 5px #ff00ff',
                    transition: 'all 0.3s ease',
                    width: 'auto',
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '5px' }}>
                <label htmlFor={`player-score-${index}`} style={{
                  color: '#00ffcc',
                  fontSize: '0.9em',
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
                    padding: '12px 15px',
                    fontSize: '1em',
                    minHeight: '44px',
                    boxSizing: 'border-box',
                    fontFamily: "'Press Start 2P', cursive",
                    boxShadow: focusedInput === `score-${index}` ? '0 0 10px #ff00ff, 0 0 15px #ff00ff' : '0 0 5px #ff00ff',
                    transition: 'all 0.3s ease',
                    width: 'auto',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          ))}
          <button onClick={() => {
            playNavigationSound();
            handleSave();
          }}>Save Game</button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
