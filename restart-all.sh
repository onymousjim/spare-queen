#!/bin/bash

# Restart backend
echo "Restarting backend..."
fuser -k 5000/tcp 2>/dev/null
cd backend
npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Restart frontend
echo "Restarting frontend..."
fuser -k 3000/tcp 2>/dev/null
cd frontend
npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo "Backend started with PID $BACKEND_PID"
echo "Frontend started with PID $FRONTEND_PID"
echo "Services are starting up..."

# Give services a moment to start
sleep 2

# Check if services are running
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "✓ Backend is running"
else
    echo "✗ Backend failed to start"
fi

if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "✓ Frontend is running"
else
    echo "✗ Frontend failed to start"
fi

echo "Restart complete!"
exit 0
