import { useEffect } from 'react';
import socket from '../utils/socket';

const useWebSocket = (isLoggedIn, user) => {
    useEffect(() => {
        let socketInitialized = false;

        const initializeWebSocket = () => {
            if (socketInitialized) return;

            const token = localStorage.getItem('token');
            if (token && user) {
                const { authenticateSocket, setupSocketListeners } = require('../utils/socket');
                authenticateSocket(token);

                setupSocketListeners({
                    onTransactionsUpdate: (data) => {
                        console.log('New transactions update:', data);
                    },
                    onConnect: () => {
                        console.log('WebSocket connected');
                    },
                    onDisconnect: () => {
                        console.log('WebSocket disconnected');
                    },
                });

                socketInitialized = true;
            }
        };

        if (isLoggedIn && user) {
            initializeWebSocket();
        }

        return () => {
            if (socketInitialized) {
                socket.disconnect();
            }
        };
    }, [isLoggedIn, user]);
};

export default useWebSocket;