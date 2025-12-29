import React, {createContext, useContext, useState, useEffect} from 'react';
import {mapEarToFocusPercent} from "../../mediapipe/components/DriverMonitoring/EarToPercent";

const StatsContext = createContext();

export const useStatsData = () => {
    return useContext(StatsContext);
};

export const StatsProvider = ({ children, startTime, endTime }) => {
    const [data, setData] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!startTime || !endTime) return;

        let isMounted = true;

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            const normalize = (t) => {
                if (t instanceof Date) return t.toISOString();
                return String(t);
            };

            // Teraz startTime i endTime pójdą do backendu dokładnie w takiej formie, w jakiej są w stanie aplikacji
            const requestData = {
                startTime: normalize(startTime),
                endTime: normalize(endTime)
            };

            const rg_token = localStorage.getItem('rg_token');
            const headers = {
                'Content-Type': 'application/json',
                ...(rg_token ? { Authorization: `Bearer ${rg_token}` } : {})
            };

            try {
                // Dodajemy parametry do URL dla GET
                const queryParams = new URLSearchParams({
                    startTime: requestData.startTime,
                    endTime: requestData.endTime
                }).toString();

                const [earRes, sessionsRes] = await Promise.all([
                    fetch(`http://localhost:8082/api/dashboard/ear-data`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(requestData)
                    }),
                    fetch(`http://localhost:8082/api/dashboard/driving-sessions?${queryParams}`, {
                        method: 'GET',
                        headers
                    })
                ]);

                if (!earRes.ok || !sessionsRes.ok) {
                    if (isMounted) setError(`HTTP Error: ${earRes.status} / ${sessionsRes.status}`);
                    return;
                }

                const earDataJson = await earRes.json();
                const sessionsJson = await sessionsRes.json();

                if (isMounted) {
                    const rawData = earDataJson.activeDriveData || [];
                    let formattedData = rawData.map(item => ({
                        timestamp: new Date(item.timestamp),
                        focusPercentage: mapEarToFocusPercent(item.averageEar)
                    }));
                    formattedData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

                    const dataWithGaps = [];
                    const GAP_THRESHOLD_MS = 15 * 60 * 1000;
                    for (let i = 0; i < formattedData.length; i++) {
                        const current = formattedData[i];
                        if (i > 0) {
                            const prev = formattedData[i - 1];
                            if ((current.timestamp.getTime() - prev.timestamp.getTime()) > GAP_THRESHOLD_MS) {
                                dataWithGaps.push({
                                    timestamp: new Date(prev.timestamp.getTime() + 1000),
                                    focusPercentage: null
                                });
                            }
                        }
                        dataWithGaps.push(current);
                    }
                    setData(dataWithGaps);

                    const normalizedSessions = Array.isArray(sessionsJson) ? sessionsJson.map((s, index) => ({
                        ...s,
                        id: s.id || (index + 1),
                        startTime: s.startTime,
                        endTime: s.endTime
                    })) : [];

                    setSessions(normalizedSessions);
                }
            } catch (err) {
                console.error(err);
                if (isMounted) {
                    setError(err.message);
                    setData([]);
                    setSessions([]);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [startTime, endTime]);

    const value = {
        dataset: data,
        sessions,
        loading,
        error,
        startTime,
        endTime
    };

    return (
        <StatsContext.Provider value={value}>
            {children}
        </StatsContext.Provider>
    );
};