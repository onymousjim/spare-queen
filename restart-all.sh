#!/bin/bash

# Restart backend
echo "Restarting backend..."
fuser -k 5000/tcp
cd backend
npm start &
cd ..

# Restart frontend
echo "Restarting frontend..."
fuser -k 3000/tcp
cd frontend
npm start &
cd ..
