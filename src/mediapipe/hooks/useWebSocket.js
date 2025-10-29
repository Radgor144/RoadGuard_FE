import {useEffect, useState} from 'react';
import SockJS from 'sockjs-client';
import {Client} from '@stomp/stompjs';

const WS_URL_HTTP = 'http://localhost:8082/driver-monitor';
const SEND_INTERVAL_MS = 100;

export const useWebSocket = (latestEARRef) => {
    const [stompClient, setStompClient] = useState(null);

    useEffect(() => {
        const client = new Client({
            brokerURL: WS_URL_HTTP,
            webSocketFactory: () => new SockJS(WS_URL_HTTP),
            onConnect: () => {
                console.log('STOMP/SockJS connected!');
                setStompClient(client);

                client.subscribe('/topic/ear-updates', (message) => {
                    console.log("Received from Server:", message.body);
                });
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            },
            onDisconnect: () => {
                console.log('STOMP disconnected');
                setStompClient(null);
            }
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
                    ear: latestEARRef.current,
                    timestamp: Date.now()
                };

                stompClient.publish({
                    destination: '/app/ear-data',
                    body: JSON.stringify(message)
                });
            }
        }, SEND_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [stompClient, latestEARRef]);

    return { isConnected: !!stompClient && stompClient.connected };
};