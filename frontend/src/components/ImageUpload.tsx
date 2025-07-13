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
  const [isProcessing, setIsProcessing] = useState(false);

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

  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      console.log('🎥 Starting camera...');
      
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('❌ MediaDevices not supported');
        setError('Camera not supported in this browser');
        return;
      }

      console.log('📱 Requesting camera access...');
      // Try with more permissive constraints first
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Use back camera if available
        } 
      });
      
      console.log('✅ Camera stream obtained:', stream);
      
      // Store the stream and show the modal
      setCameraStream(stream);
      setShowCamera(true);
      setError(''); // Clear any previous errors
      console.log('✅ Camera modal will be shown');
      
    } catch (err: any) {
      console.error('❌ Camera error:', err);
      
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

  // Effect to set video source when modal opens and stream is available
  useEffect(() => {
    if (showCamera && cameraStream && videoRef.current) {
      console.log('🎬 Setting video source...');
      videoRef.current.srcObject = cameraStream;
      
      // Wait for video to load
      videoRef.current.onloadedmetadata = () => {
        console.log('📺 Video metadata loaded');
        if (videoRef.current) {
          videoRef.current.play();
          console.log('▶️ Video playing');
        }
      };
    }
  }, [showCamera, cameraStream]);

  const stopCamera = () => {
    // Stop the camera stream
    if (cameraStream) {
      const tracks = cameraStream.getTracks();
      tracks.forEach(track => track.stop());
      setCameraStream(null);
      console.log('🛑 Camera stream stopped');
    }
    
    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setShowCamera(false);
    console.log('❌ Camera modal closed');
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

    setIsProcessing(true);
    setError('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await axios.post('/api/scrape', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('API Response:', res.data);
      
      // Navigate to edit page with the processed data
      const imageUrl = URL.createObjectURL(file);
      navigate('/edit-game', { 
        state: { 
          players: res.data.players,
          scrapedData: res.data.scrapedData,
          imageUrl: imageUrl
        } 
      });
    } catch (err) {
      setError('Error scraping image');
      setIsProcessing(false);
    }
  };

  const handlePlayerChange = (index: number, field: 'name' | 'score', value: string) => {
    const newPlayers = [...players];
    newPlayers[index][field] = value;
    setPlayers(newPlayers);
  };

  const handleSave = async () => {
    try {
      await axios.post('/api/games', { gameName, players, date });
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
            <div className="image-action-buttons">
              <button 
                className="process-button" 
                onClick={() => {
                  playNavigationSound();
                  handleUpload();
                }}
                disabled={isProcessing}
                style={{
                  opacity: isProcessing ? 0.7 : 1,
                  cursor: isProcessing ? 'not-allowed' : 'pointer'
                }}
              >
                {isProcessing ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <span className="loading-spinner"></span>
                    Processing...
                  </span>
                ) : (
                  'Process Image'
                )}
              </button>
            </div>
            
            <div className="image-preview">
              <h3 style={{
                color: '#00ffcc',
                textAlign: 'center',
                marginBottom: '15px',
                fontSize: '1.1em',
                textShadow: '0 0 5px #00ffcc'
              }}>
                {file.name === 'captured-image.jpg' ? 'Photo Captured!' : 'Image Selected'}
              </h3>
              <img 
                src={URL.createObjectURL(file)} 
                alt="Preview" 
                style={{
                  maxWidth: '100%',
                  maxHeight: '300px',
                  border: '2px solid #ff00ff',
                  borderRadius: '8px',
                  boxShadow: '0 0 10px rgba(255, 0, 255, 0.5)',
                  marginBottom: '20px'
                }}
              />
            </div>
          </div>
        )}
        
        {isProcessing && (
          <div className="processing-message">
            <p style={{ 
              textAlign: 'center', 
              color: '#00ffcc', 
              marginTop: '15px',
              fontSize: '1em',
              textShadow: '0 0 5px #00ffcc'
            }}>
              Analyzing your bowling scorecard...
            </p>
          </div>
        )}
      </div>
      
      {showCamera && (
        <div className="camera-modal">
          <div className="camera-container">
            <h3 style={{
              color: '#00ffcc',
              textAlign: 'center',
              marginBottom: '20px',
              fontSize: '1.2em',
              textShadow: '0 0 5px #00ffcc'
            }}>Camera Preview</h3>
            
            <div className="video-container">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                style={{ 
                  width: '100%',
                  maxWidth: '600px',
                  height: 'auto',
                  border: '3px solid #00ffcc',
                  borderRadius: '8px',
                  boxShadow: '0 0 15px rgba(0, 255, 204, 0.5)'
                }} 
              />
            </div>
            
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            <div className="camera-controls">
              <button 
                className="camera-button snap-button"
                onClick={() => {
                  playNavigationSound();
                  capturePhoto();
                }}
              >
                📸 Snap Photo
              </button>
              <button 
                className="camera-button back-button"
                onClick={() => {
                  playNavigationSound();
                  stopCamera();
                }}
              >
                ← Back
              </button>
            </div>
          </div>
        </div>
      )}
      
      {error && <p className="camera-error">{error}</p>}
      {scrapedData && (
        <div className="scraped-data-form">
          <h3 style={{ 
            textAlign: 'center', 
            marginBottom: '20px',
            fontSize: window.innerWidth <= 480 ? '1.3em' : '1.5em'
          }}>Edit Game Data</h3>
          
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
