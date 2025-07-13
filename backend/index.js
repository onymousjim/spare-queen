const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const multer = require('multer');
const path = require('path');
const { processImageWithGemini } = require('./gemini-vision-example');

// Load environment variables
require('dotenv').config({ path: '../.env' });

// Mock data store for testing (replace with Firebase in production)
let mockGames = [];
let mockGameIdCounter = 1;

// Check if Firebase credentials are available
let db = null;
try {
  // Try environment variables first (for Docker/GCP)
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    console.log('Initializing Firebase with environment variables...');
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
      universe_domain: "googleapis.com"
    };
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    console.log('Firebase initialized successfully with environment variables');
  } else {
    // Fallback to local file for development
    try {
      const serviceAccount = require('./serviceAccountKey.json');
      if (serviceAccount.private_key !== "your-private-key") {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        db = admin.firestore();
        console.log('Firebase initialized successfully with local credentials');
      } else {
        console.log('Using mock database for testing (Firebase credentials not configured)');
      }
    } catch (fileError) {
      console.log('Using mock database for testing (Firebase credentials not found)');
    }
  }
} catch (error) {
  console.log('Using mock database for testing (Firebase initialization failed):', error.message);
}

const app = express();
const port = process.env.PORT || 5000;

// Use /tmp for uploads in production (Cloud Run) or new-uploads/ locally
const uploadDir = process.env.NODE_ENV === 'production' ? '/tmp/uploads' : 'new-uploads/';

// Ensure upload directory exists
const fs = require('fs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

app.use(cors());
app.use(bodyParser.json());

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint for Docker
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Test endpoint for Gemini API
app.get('/api/test-gemini', async (req, res) => {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent("Say hello");
    const response = await result.response;
    const text = response.text();
    
    res.status(200).json({ 
      success: true, 
      response: text,
      apiKeyExists: !!process.env.GEMINI_API_KEY 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      apiKeyExists: !!process.env.GEMINI_API_KEY 
    });
  }
});

// Test endpoint for image processing
app.get('/api/test-image', async (req, res) => {
  try {
    const testImagePath = '../uploads/20250705_201000-COLLAGE.jpg';
    const result = await processImageWithGemini(testImagePath);
    res.status(200).json({ 
      success: true, 
      result: result
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    });
  }
});

// Placeholder for authentication
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'Mary' && password === 'SpareQueen!') {
    res.status(200).send({ message: 'Login successful' });
  } else {
    res.status(401).send({ message: 'Invalid credentials' });
  }
});

app.post('/api/games', async (req, res) => {
  try {
    let { gameName, players, date } = req.body;
    
    // Auto-generate game name if not provided
    if (!gameName) {
      let gameCount;
      if (db) {
        const todayStart = new Date(date);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(date);
        todayEnd.setHours(23, 59, 59, 999);
        
        const gamesSnapshot = await db.collection('games')
          .where('date', '>=', todayStart.toISOString().split('T')[0])
          .where('date', '<=', todayEnd.toISOString().split('T')[0])
          .get();
        
        gameCount = gamesSnapshot.size + 1;
      } else {
        // Mock database
        const todayGames = mockGames.filter(game => game.date === date);
        gameCount = todayGames.length + 1;
      }
      gameName = `Game ${gameCount}`;
    }
    
    const gameData = {
      gameName,
      date,
      players,
      createdAt: new Date().toISOString()
    };
    
    let gameId;
    if (db) {
      const docRef = await db.collection('games').add(gameData);
      gameId = docRef.id;
    } else {
      // Mock database
      gameId = mockGameIdCounter++;
      mockGames.push({ id: gameId, ...gameData });
    }
    
    res.status(201).send({ id: gameId, gameName });
  } catch (error) {
    console.error('Error adding document: ', error);
    res.status(500).send({ message: 'Error saving game data' });
  }
});

app.post('/api/scrape', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: 'No image file uploaded' });
    }

    console.log('Processing image with Gemini Vision API...');
    console.log('GEMINI_API_KEY available:', !!process.env.GEMINI_API_KEY);
    console.log('File path:', req.file.path);
    console.log('File size:', req.file.size);
    console.log('Upload directory:', uploadDir);
    console.log('File exists:', require('fs').existsSync(req.file.path));
    
    // Process with Gemini Vision API only
    const result = await processImageWithGemini(req.file.path);
    
    const players = result.players || [];
    
    // Ensure we always have exactly 3 players
    while (players.length < 3) {
      players.push({ name: '', score: '' });
    }
    
    // Take only first 3 players
    const finalPlayers = players.slice(0, 3);
    
    const playerNames = finalPlayers.map(p => p.name || '');
    const playerScores = finalPlayers.map(p => p.score || '');
    
    // Send both the player data and structured scraped data for display
    const scrapedData = {
      playerNames: playerNames,
      playerScores: playerScores,
      rawText: 'Processed with Google Gemini Vision API'
    };
    
    console.log('Gemini processing successful:', { playerNames, playerScores });
    
    res.status(200).send({ 
      players: finalPlayers,
      scrapedData
    });

  } catch (error) {
    console.error('Error scraping image: ', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    res.status(500).send({ message: 'Error scraping image', error: error.message });
  }
});

app.get('/api/games/count/:date', async (req, res) => {
  try {
    const { date } = req.params;
    let gamesCount = 0;
    
    if (db) {
      const gamesSnapshot = await db.collection('games')
        .where('date', '==', date)
        .get();
      gamesCount = gamesSnapshot.size;
    } else {
      // Mock database
      const todayGames = mockGames.filter(game => game.date === date);
      gamesCount = todayGames.length;
    }
    
    res.status(200).send({ count: gamesCount, nextGameName: `Game ${gamesCount + 1}` });
  } catch (error) {
    console.error('Error fetching games count: ', error);
    res.status(500).send({ message: 'Error fetching games count' });
  }
});

// API endpoint to get all games (for metrics)
app.get('/api/games', async (req, res) => {
  try {
    let games = [];
    
    if (db) {
      const snapshot = await db.collection('games').orderBy('createdAt', 'desc').get();
      games = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      // Mock database - return mock games
      games = mockGames.slice().reverse(); // Most recent first
    }
    
    res.status(200).send(games);
  } catch (error) {
    console.error('Error fetching games: ', error);
    res.status(500).send({ message: 'Error fetching games' });
  }
});

// API endpoint to update a game
app.put('/api/games/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { gameName, players, date } = req.body;
    
    const gameData = {
      gameName,
      date,
      players,
      updatedAt: new Date().toISOString()
    };
    
    if (db) {
      await db.collection('games').doc(id).update(gameData);
      res.status(200).send({ message: 'Game updated successfully', id });
    } else {
      // Mock database
      const gameIndex = mockGames.findIndex(game => game.id.toString() === id);
      if (gameIndex !== -1) {
        mockGames[gameIndex] = { ...mockGames[gameIndex], ...gameData };
        res.status(200).send({ message: 'Game updated successfully', id });
      } else {
        res.status(404).send({ message: 'Game not found' });
      }
    }
  } catch (error) {
    console.error('Error updating game: ', error);
    res.status(500).send({ message: 'Error updating game' });
  }
});

// API endpoint to delete a game
app.delete('/api/games/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (db) {
      await db.collection('games').doc(id).delete();
      res.status(200).send({ message: 'Game deleted successfully' });
    } else {
      // Mock database
      const gameIndex = mockGames.findIndex(game => game.id.toString() === id);
      if (gameIndex !== -1) {
        mockGames.splice(gameIndex, 1);
        res.status(200).send({ message: 'Game deleted successfully' });
      } else {
        res.status(404).send({ message: 'Game not found' });
      }
    }
  } catch (error) {
    console.error('Error deleting game: ', error);
    res.status(500).send({ message: 'Error deleting game' });
  }
});

// API endpoint to get calculated metrics
app.get('/api/metrics', async (req, res) => {
  try {
    let games = [];
    
    if (db) {
      const snapshot = await db.collection('games').orderBy('createdAt', 'desc').get();
      games = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      // Mock database - return mock games
      games = mockGames.slice().reverse(); // Most recent first
    }
    
    // Calculate metrics
    const totalGames = games.length;
    const playerStats = {};
    
    // Process each game to build player statistics
    games.forEach(game => {
      game.players.forEach(player => {
        if (!player.name || !player.score) return; // Skip empty players
        
        const name = player.name;
        const score = parseInt(player.score);
        
        if (!playerStats[name]) {
          playerStats[name] = {
            name: name,
            scores: [],
            totalWins: 0
          };
        }
        
        playerStats[name].scores.push(score);
      });
      
      // Determine winner (highest score) for each game
      const validPlayers = game.players.filter(p => p.name && p.score);
      if (validPlayers.length > 0) {
        const winner = validPlayers.reduce((prev, current) => 
          parseInt(current.score) > parseInt(prev.score) ? current : prev
        );
        if (winner.name && playerStats[winner.name]) {
          playerStats[winner.name].totalWins++;
        }
      }
    });
    
    // Calculate final stats for each player
    const players = Object.values(playerStats).map(player => ({
      name: player.name,
      totalWins: player.totalWins,
      averageScore: player.scores.length > 0 ? 
        player.scores.reduce((a, b) => a + b, 0) / player.scores.length : 0,
      maxScore: player.scores.length > 0 ? Math.max(...player.scores) : 0,
      minScore: player.scores.length > 0 ? Math.min(...player.scores) : 0
    }));
    
    const metrics = {
      totalGames,
      players
    };
    
    res.status(200).send(metrics);
  } catch (error) {
    console.error('Error fetching metrics: ', error);
    res.status(500).send({ message: 'Error fetching metrics' });
  }
});

// Handle React Router routes - serve index.html for specific routes
app.get(['/manual-entry', '/image-upload', '/edit-game', '/edit-scores', '/metrics'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});