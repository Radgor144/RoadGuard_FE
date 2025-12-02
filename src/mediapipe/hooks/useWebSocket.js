import {useEffect, useRef, useState} from 'react';
import {Client} from '@stomp/stompjs';

const WS_URL = 'ws://localhost:8082/driver-monitor';
const SEND_INTERVAL_MS = 100;

// useWebSocket(latestEARRef, enabled)
// - only activates the STOMP client when enabled===true
// - deactivates when enabled becomes false or on unmount
export const useWebSocket = (latestEARRef, enabled = false) => {
    const [stompClient, setStompClient] = useState(null);
    const clientRef = useRef(null);

    useEffect(() => {
        if (!enabled) {
            // ensure disconnected
            if (clientRef.current) {
                try {
                    clientRef.current.deactivate();
                } catch (e) {}
                clientRef.current = null;
            }
            setStompClient(null);
            return;
        }

        // create and activate client
        const client = new Client({
            brokerURL: WS_URL,
            reconnectDelay: 5000,
            onConnect: () => {
                clientRef.current = client;
                setStompClient(client);
                try {
                    client.subscribe('/topic/ear-updates', (message) => {
                        // server -> client notifications
                        console.log('Received from Server:', message.body);
                    });
                } catch (e) {}
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + (frame?.headers?.message || frame));
            },
            onDisconnect: () => {
                setStompClient(null);
                clientRef.current = null;
            }
        });

        client.activate();

        return () => {
            try {
                if (client && client.connected) client.deactivate();
            } catch (e) {}
            clientRef.current = null;
            setStompClient(null);
        };
    }, [enabled]);

    useEffect(() => {
        if (!enabled) return;

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
    }, [enabled, latestEARRef]);

    return {isConnected: !!stompClient && stompClient.connected};
};