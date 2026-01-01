import React, {createContext, useContext, useState, useEffect} from 'react';
import {normalizeDate, processEarData, processSessions} from "./StatsHelpers";

const StatsContext = createContext();

export const useStatsData = () => {
    return useContext(StatsContext);
};

export const StatsProvider = ({ children, startTime, endTime }) => {
    const [data, setData] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!startTime || !endTime) {
            setData([]);
            setLoading(false);
            return;
        }

        let isMounted = true;

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            const requestData = {
                startTime: normalizeDate(startTime),
                endTime: normalizeDate(endTime)
            };

            const rg_token = localStorage.getItem('rg_token');
            const headers = {
                'Content-Type': 'application/json',
                ...(rg_token ? { Authorization: `Bearer ${rg_token}` } : {})
            };

            try {
                const [earRes, sessionsRes] = await Promise.all([
                    fetch(`http://localhost:8082/api/dashboard/ear-data`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(requestData)
                    }),
                    fetch(`http://localhost:8082/api/dashboard/driving-sessions`, {
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
                    const cleanChartData = processEarData(earDataJson.activeDriveData);
                    const cleanSessions = processSessions(sessionsJson);

                    setData(cleanChartData);
                    setSessions(cleanSessions);
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