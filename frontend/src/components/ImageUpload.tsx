import React, { useState, useRef } from 'react';
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
      }
    } catch (err) {
      setError('Error accessing camera');
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
    <div className="image-upload">
      <button className="back-button" onClick={() => {
        playNavigationSound();
        navigate('/');
      }}>← Back to Menu</button>
      <h2>Image Upload</h2>
      <div className="camera-controls">
        <button onClick={() => {
          playNavigationSound();
          startCamera();
        }}>Take Photo</button>
        <input type="file" onChange={handleFileChange} />
        {file && <button onClick={() => {
          playNavigationSound();
          handleUpload();
        }}>Upload</button>}
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
      
      {error && <p>{error}</p>}
      {scrapedData && (
        <div className="scraped-data-form">
          <h3>Scraped Data</h3>
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
            <div key={index} className="player-inputs">
              <input
                type="text"
                placeholder="Player Name"
                value={player.name}
                onChange={(e) => handlePlayerChange(index, 'name', e.target.value)}
              />
              <input
                type="text"
                placeholder="Score"
                value={player.score}
                onChange={(e) => handlePlayerChange(index, 'score', e.target.value)}
              />
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
