const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const multer = require('multer');
const Tesseract = require('tesseract.js');

// Mock data store for testing (replace with Firebase in production)
let mockGames = [];
let mockGameIdCounter = 1;

// Check if Firebase credentials are valid
let db = null;
try {
  const serviceAccount = require('./serviceAccountKey.json');
  if (serviceAccount.private_key !== "your-private-key") {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    console.log('Firebase initialized successfully');
  } else {
    console.log('Using mock database for testing (Firebase credentials not configured)');
  }
} catch (error) {
  console.log('Using mock database for testing (Firebase credentials not found)');
}

const app = express();
const port = process.env.PORT || 5000;

const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Spare Queen Backend is running!');
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

    const { data: { text } } = await Tesseract.recognize(
      req.file.path,
      'eng',
      { logger: m => console.log(m) }
    );
    
    const lines = text.split('\n');
    const players = lines.map(line => {
      const parts = line.split(' ');
      const name = parts.slice(0, -1).join(' ');
      const score = parts[parts.length - 1];
      return { name, score };
    }).filter(player => player.name && player.score);
    
    res.status(200).send({ players });
  } catch (error) {
    console.error('Error scraping image: ', error);
    res.status(500).send({ message: 'Error scraping image' });
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

app.get('/api/metrics', async (req, res) => {
  try {
    let games = [];
    
    if (db) {
      const gamesSnapshot = await db.collection('games').get();
      gamesSnapshot.forEach(doc => {
        games.push(doc.data());
      });
    } else {
      // Mock database
      games = mockGames;
    }

    const totalGames = games.length;
    const playerMetrics = {};

    games.forEach(game => {
      let winner = { name: '', score: 0 };
      game.players.forEach(player => {
        const score = parseInt(player.score, 10);
        if (score > winner.score) {
          winner = { name: player.name, score };
        }

        if (!playerMetrics[player.name]) {
          playerMetrics[player.name] = {
            totalWins: 0,
            totalGames: 0,
            totalScore: 0,
            maxScore: 0,
            minScore: Infinity,
            scoresOverTime: []
          };
        }
        
        playerMetrics[player.name].totalGames++;
        playerMetrics[player.name].totalScore += score;
        playerMetrics[player.name].scoresOverTime.push({ date: game.date, score });
        if (score > playerMetrics[player.name].maxScore) {
          playerMetrics[player.name].maxScore = score;
        }
        if (score < playerMetrics[player.name].minScore) {
          playerMetrics[player.name].minScore = score;
        }
      });
      if (winner.name) {
        playerMetrics[winner.name].totalWins++;
      }
    });

    const players = Object.keys(playerMetrics).map(name => {
      const metrics = playerMetrics[name];
      return {
        name,
        totalWins: metrics.totalWins,
        averageScore: parseFloat((metrics.totalScore / metrics.totalGames).toFixed(2)),
        maxScore: metrics.maxScore,
        minScore: metrics.minScore === Infinity ? 0 : metrics.minScore,
        scoresOverTime: metrics.scoresOverTime.sort((a, b) => new Date(a.date) - new Date(b.date))
      };
    });

    res.status(200).send({ totalGames, players });
  } catch (error) {
    console.error('Error fetching metrics: ', error);
    res.status(500).send({ message: 'Error fetching metrics' });
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
