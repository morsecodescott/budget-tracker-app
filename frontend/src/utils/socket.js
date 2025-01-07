import { io } from 'socket.io-client';

// Create socket connection
const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:4000', {
    withCredentials: true,
    autoConnect: false,
    path: '/socket.io/',
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});

// Add error logging
socket.on('connect_error', (err) => {
    console.error('WebSocket connection error:', err.message);
});

socket.on('connect_timeout', () => {
    console.error('WebSocket connection timeout');
});

socket.on('reconnect_attempt', (attempt) => {
    console.log(`WebSocket reconnection attempt ${attempt}`);
});

socket.on('reconnect_failed', () => {
    console.error('WebSocket reconnection failed');
});

// Authentication handler
export const authenticateSocket = (token) => {
    console.log('Authenticating WebSocket with token:', token);
    socket.auth = { token };
    socket.connect();

    // Add authentication response handler
    socket.on('authenticated', () => {
        console.log('WebSocket authentication successful');
    });

    socket.on('unauthorized', (err) => {
        console.error('WebSocket authentication failed:', err.message);
    });
};

// Event listeners
export const setupSocketListeners = (handlers) => {
    socket.on('connect', () => {
        console.log('Connected to WebSocket server');
        if (socket.auth?.token) {
            console.log('Sending authentication token to server');
            socket.emit('authenticate', socket.auth.token, (response) => {
                if (response?.error) {
                    console.error('Authentication error:', response.error);
                }
            });
        }
        if (handlers.onConnect) {
            handlers.onConnect();
        }
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
        if (handlers.onDisconnect) {
            handlers.onDisconnect();
        }
    });

    socket.on('TRANSACTIONS_UPDATE', handlers.onTransactionsUpdate);
};

export default socket;
