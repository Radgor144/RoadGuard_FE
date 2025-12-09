import {useEffect, useRef, useState} from 'react';
import {Client} from '@stomp/stompjs';

const WS_URL = 'ws://localhost:8082/driver-monitor';
const SEND_INTERVAL_MS = 100;

// useWebSocket(latestEARRef, enabled, token, driverId)
// - activates the STOMP client only when enabled===true and token is provided
// - publishes latest EAR every SEND_INTERVAL_MS with Authorization header
// - exposes sendEndDriving() to publish an END_DRIVING event with ISO timestamp
export const useWebSocket = (latestEARRef, enabled = false, token = null, driverId = null) => {
    const clientRef = useRef(null);
    const pendingConnectRef = useRef(null); // {resolve, reject, timeoutId}
    const [isConnected, setIsConnected] = useState(false);
    const lastErrorRef = useRef(null);

    // helper to (re)create client instance with current token/driverId
    const ensureClient = () => {
        if (clientRef.current) return clientRef.current;

        const brokerURL = WS_URL;

        const client = new Client({
            brokerURL,
            reconnectDelay: 5000,
            connectHeaders: {
                Authorization: token ? `Bearer ${token}` : undefined
            },
            onConnect: () => {
                console.log('useWebSocket: connected to STOMP broker');
                setIsConnected(true);
                // resolve any pending connect() call
                if (pendingConnectRef.current) {
                    clearTimeout(pendingConnectRef.current.timeoutId);
                    pendingConnectRef.current.resolve(true);
                    pendingConnectRef.current = null;
                }
                try {
                    client.subscribe('/topic/ear-updates', (message) => {
                        // server -> client notifications
                        console.log('Received from Server:', message.body);
                    });
                } catch (e) {
                    // swallow
                }
            },
            onStompError: (frame) => {
                console.error('useWebSocket: Broker reported error: ' + (frame?.headers?.message || frame));
                lastErrorRef.current = frame;
                // reject pending connect if exists
                if (pendingConnectRef.current) {
                    clearTimeout(pendingConnectRef.current.timeoutId);
                    pendingConnectRef.current.resolve(false);
                    pendingConnectRef.current = null;
                }
            },
            onDisconnect: () => {
                console.log('useWebSocket: disconnected from broker');
                setIsConnected(false);
                clientRef.current = null;
            }
        });

        clientRef.current = client;
        return client;
    };

    // auto-activate when enabled===true and token present (backwards compatibility)
    useEffect(() => {
        if (!enabled || !token) {
            // if auto was requested off, deactivate
            try {
                if (clientRef.current && clientRef.current.active) clientRef.current.deactivate();
            } catch (e) { /* swallow */ }
            return;
        }

        const client = ensureClient();
        // update connectHeaders if token changed
        if (client && client.connectHeaders) client.connectHeaders.Authorization = `Bearer ${token}`;

        try {
            client.activate();
        } catch (e) {
            console.warn('useWebSocket: activate failed', e);
        }

        return () => {
            try {
                if (client && client.connected) client.deactivate();
            } catch (e) {
                // swallow
            }
        };
    }, [enabled, token, driverId]);

    // periodic EAR publisher
    useEffect(() => {
        if (!token) return; // do not publish without token

        const interval = setInterval(() => {
            const client = clientRef.current;
            if (client && client.connected && latestEARRef && latestEARRef.current !== null) {
                const message = {
                    driverId: '63a27a59-e8f0-4e03-a4f3-f27f853888f9',
                    ear: latestEARRef.current
                };
                try {
                    client.publish({
                        destination: '/app/ear-data',
                        body: JSON.stringify(message),
                        headers: {'content-type': 'application/json'}
                    });
                } catch (e) {
                    // swallow publish errors
                }
            }
        }, SEND_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [token, latestEARRef, driverId]);

    // helper to send END_DRIVING event with timestamp
    const sendEndDriving = (extra = {}) => {
        const client = clientRef.current;
        if (!client || !client.connected) {
            console.warn('Cannot send end driving: STOMP client not connected');
            return false;
        }
        if (!driverId) {
            console.warn('Cannot send end driving: driverId not provided');
            return false;
        }
        const payload = {
            driverId,
            event: 'END_DRIVING',
            timestamp: new Date().toISOString(),
            ...extra
        };
        try {
            client.publish({
                destination: '/app/driver-event',
                body: JSON.stringify(payload),
                headers: {'content-type': 'application/json', Authorization: `Bearer ${token}`}
            });
            return true;
        } catch (e) {
            console.error('sendEndDriving publish failed', e);
            return false;
        }
    };

    // connect() returns a Promise that resolves true when connected or false on timeout/failure
    const connect = (timeoutMs = 5000) => {
        return new Promise((resolve) => {
            try {
                const client = ensureClient();
                // update connect headers
                if (client && client.connectHeaders) client.connectHeaders.Authorization = `Bearer ${token}`;
                // if already connected
                if (client && client.connected) return resolve(true);

                // store pending resolver
                if (pendingConnectRef.current) {
                    // there is already a pending promise; resolve immediately with false
                    return resolve(false);
                }
                const timeoutId = setTimeout(() => {
                    if (pendingConnectRef.current) {
                        pendingConnectRef.current.resolve(false);
                        pendingConnectRef.current = null;
                    }
                }, timeoutMs);

                pendingConnectRef.current = {resolve, timeoutId};
                try {
                    client.activate();
                } catch (e) {
                    console.warn('useWebSocket.connect: activate failed', e);
                    clearTimeout(timeoutId);
                    pendingConnectRef.current = null;
                    return resolve(false);
                }
            } catch (e) {
                console.warn('useWebSocket.connect exception', e);
                return resolve(false);
            }
        });
    };

    const disconnect = async () => {
        try {
            const c = clientRef.current;
            if (c && c.active) await c.deactivate();
        } catch (e) {
            // swallow
        }
        // clear pending
        if (pendingConnectRef.current) {
            clearTimeout(pendingConnectRef.current.timeoutId);
            pendingConnectRef.current.resolve(false);
            pendingConnectRef.current = null;
        }
        setIsConnected(false);
        clientRef.current = null;
    };

    return {isConnected, sendEndDriving, connect, disconnect};
};