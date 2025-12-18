import { useState, useEffect, useRef, useCallback } from "react";

export const useWebSocket = (latestEARRef, enabled, token) => {
    const wsRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);

    const createWebSocket = useCallback(() => {
        if (!token) {
            console.warn("useWebSocket: missing token");
            return null;
        }

        const ws = new WebSocket(`ws://localhost:8082/driver-monitor?access_token=${token}`);

        ws.onopen = () => {
            console.log("WS open");
            setIsConnected(true);
        };

        ws.onmessage = (msg) => console.log("WS message", msg.data);
        ws.onerror = (err) => console.error("WS error", err);
        ws.onclose = () => {
            console.log("WS closed");
            setIsConnected(false);
            wsRef.current = null;
        };

        return ws;
    }, [token]);

    const connect = useCallback(() => {
        return new Promise((resolve) => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                resolve(true);
                return;
            }

            const ws = createWebSocket();
            if (!ws) {
                resolve(false);
                return;
            }

            wsRef.current = ws;

            ws.onopen = () => {
                setIsConnected(true);
                resolve(true);
            };
        });
    }, [createWebSocket]);

    const disconnect = useCallback(() => {
        if (wsRef.current) wsRef.current.close();
        wsRef.current = null;
        setIsConnected(false);
        return Promise.resolve(true);
    }, []);

    const sendMessage = useCallback((payload) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return false;
        wsRef.current.send(JSON.stringify(payload));
        return true;
    }, []);

    const sendEAR = useCallback((ear) => sendMessage({ ear }), [sendMessage]);
    const sendEndDriving = useCallback((data) => sendMessage({ type: "END_DRIVING", ...data }), [sendMessage]);
    useEffect(() => {
        if (!enabled || !latestEARRef) return;
        const interval = setInterval(() => {
            if (latestEARRef.current != null) sendEAR(latestEARRef.current);
        }, 100);
        return () => clearInterval(interval);
    }, [enabled, latestEARRef, sendEAR]);

    return { wsRef, isConnected, connect, disconnect, sendEAR, sendEndDriving };
};