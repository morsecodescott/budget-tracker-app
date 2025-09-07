import React, { createContext, useContext, useState } from 'react';
import socket from '../utils/socket';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [lastMessage, setLastMessage] = useState(null);
    const [isConnected, setIsConnected] = useState(socket.connected);

    const value = {
        socket,
        lastMessage,
        setLastMessage,
        isConnected,
        setIsConnected,
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
