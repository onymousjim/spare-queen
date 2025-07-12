# Concept
- Create an app called Spare Queen that allows you to enter the scores of a bowling game for multiple players
- The app should allow the user to create a bowling game, then input for the game scores by three different methods
  - The first method of input is to take picture of the bowling game scoreboard
  - The second method of input is to manually enter the player names and scores
  - The third method of input is to upload a picture of the bowling game scorboard
- Each game, the captured input should be
  -  All the player's names
  -  The player's final scores
  -  The date of the game
  -  The name of the game
- The app should only allow users access if they put in the right username and password, which should be username = Mary, password = SpareQueen!
- The styling theme of the app should be like a retro 80s style nintendo game with black, pink and teal neon colors 
- The app should also track metrics about players and games which is derives from the stored data over time
- The app should use Cloud Firestore to store all the data over time
- Game name population should have the convention of sequential numbers such as Game 1, Game 2, Game 3, etc., on a per day basis.  

# Input Methods
## First Input Method
- The app should allow the user to take a picture of the bowling scoreboard.  The app should then scrape the player names and final scores from the scoreboard.
- It should then diplay the names, scores, and date to the user, ask the user if the names and scores are correct, and allow to edit all fields before storing the game data with a Save button
  -  The date should be defaulted to today's date
## Second Input Method
- The app should allow the user to manually input the date, players, and scores for a game
  - The date should be defaulted to today's date
## Third Input Method
- The app should allow the user to upload a picture of a bowling scoreboad. The app should then scrape the player names and final scores from the scoreboard.
- It should then diplay the names, scores, and date to the user, ask the user if the names and scores are correct, and allow to edit all fields before storing the game data with a Save button
  -  The date should be attemped to be populated from the metadata of the picture if possible


# Additional Features
- It should have a screen that displays metrics for each player.  Examples for each player include:
  - Total wins 
  - Average score 
  - Max score
  - Min score
  - Graphs of scores over time for players

