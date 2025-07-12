// Example implementation using Google Gemini API for image processing
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function processImageWithGemini(imagePath) {
  try {
    // Get the Gemini Flash model (cheaper and faster)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Read and encode image
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    // Get file extension for media type
    const ext = path.extname(imagePath).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
    
    const prompt = `Analyze this bowling scorecard image and extract the player names and their total scores. 

Please return the data in this exact JSON format:
{
  "players": [
    {"name": "PLAYER_NAME", "score": "TOTAL_SCORE"},
    {"name": "PLAYER_NAME", "score": "TOTAL_SCORE"},
    {"name": "PLAYER_NAME", "score": "TOTAL_SCORE"}
  ]
}

Rules:
- Extract exactly 3 players, even if the image shows fewer (fill missing ones with empty strings)
- Look for the rightmost number in each player's row as their total score
- Common player names are LILY, MARY, JAMIE, JAMEY
- Total scores are typically between 0-300 for bowling
- Only return the JSON, no other text`;

    const imageParts = [
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      }
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const responseText = response.text();
    
    console.log('Gemini response:', responseText);
    
    // Clean the response to extract just the JSON
    let jsonText = responseText.trim();
    
    // Remove any markdown code block formatting
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }
    
    // Parse JSON response
    const data = JSON.parse(jsonText);
    return data;
    
  } catch (error) {
    console.error('Error processing image with Gemini:', error);
    throw error;
  }
}

module.exports = { processImageWithGemini };