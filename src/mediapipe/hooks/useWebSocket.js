import {useEffect, useState} from 'react';
import {Client} from '@stomp/stompjs';

const WS_URL = 'ws://localhost:8082/driver-monitor';
const SEND_INTERVAL_MS = 100;

export const useWebSocket = (latestEARRef) => {
    const [stompClient, setStompClient] = useState(null);

    useEffect(() => {
        const client = new Client({
            brokerURL: WS_URL,

            onConnect: () => {
                setStompClient(client);

                client.subscribe('/topic/ear-updates', (message) => {
                    console.log("Received from Server:", message.body);
                });
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
            },
            onDisconnect: () => {
                setStompClient(null);
            },
            reconnectDelay: 5000,
        });

        client.activate();

        return () => {
            if (client.connected) {
                client.deactivate();
            }
        };
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (stompClient && stompClient.connected && latestEARRef.current !== null) {
                const message = {
                    driverId: "testing_driver",
                    ear: latestEARRef.current,
                    timestamp: Date.now()
                };

                stompClient.publish({
                    destination: '/app/ear-data',
                    body: JSON.stringify(message),
                    headers: {'content-type': 'application/json'},
                });
            }
        }, SEND_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [stompClient, latestEARRef]);

    return {isConnected: !!stompClient && stompClient.connected};
};