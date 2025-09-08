/**
 * @fileoverview This file provides a WebSocket context for the application.
 * It includes a context, a provider component, and a custom hook for accessing the context.
 * The context manages the WebSocket connection and related state.
 * @module frontend/src/context/SocketContext
 */

import React, { createContext, useContext, useState } from 'react';
import socket from '../utils/socket';

/**
 * @typedef {Object} SocketContextType
 * @property {import('socket.io-client').Socket} socket - The Socket.IO client instance.
 * @property {Object|null} lastMessage - The last message received from the socket.
 * @property {function(Object|null): void} setLastMessage - A function to set the last message.
 * @property {boolean} isConnected - A flag indicating if the socket is connected.
 * @property {function(boolean): void} setIsConnected - A function to set the connection status.
 */

/**
 * The WebSocket context.
 * @type {React.Context<SocketContextType>}
 */
const SocketContext = createContext();

/**
 * A custom hook for accessing the WebSocket context.
 * @returns {SocketContextType} The WebSocket context.
 */
export const useSocket = () => {
    return useContext(SocketContext);
};

/**
 * The WebSocket provider component.
 * It wraps the application and provides the WebSocket context to its children.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to render.
 * @returns {JSX.Element} The rendered provider component.
 */
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
