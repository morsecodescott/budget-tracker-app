#!/bin/bash

# Navigate to backend and start server
echo "Starting Backend..."
(cd backend && npm run dev) &

# Navigate to frontend and start server
echo "Starting Frontend..."
(cd frontend && npm start) &

# Wait for all background processes to complete
wait
