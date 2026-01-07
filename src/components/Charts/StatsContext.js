import React, {createContext, useContext, useState, useEffect} from 'react';
import {normalizeDate, processEarData, processSessions} from "./StatsHelpers";

const StatsContext = createContext();

export const useStatsData = () => {
    return useContext(StatsContext);
};

export const StatsProvider = ({ children, startTime, endTime, fetchSessions = true }) => {
    const [dataset, setDataset] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!startTime || !endTime) {
            setDataset([]);
            return;
        }

        let isMounted = true;
        setLoading(true);

        const fetchEarData = async () => {
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
                const res = await fetch(`http://localhost:8082/api/dashboard/ear-data`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(requestData)
                });

                if (!res.ok) {
                    const errorMsg = `EAR HTTP Error: ${res.status}`;
                    console.error(errorMsg);
                    if (isMounted) setError(prev => prev || errorMsg);
                    return;
                }

                const json = await res.json();
                if (isMounted) {
                    setDataset(processEarData(json.activeDriveData));
                }
            } catch (err) {
                console.error(err);
                if (isMounted) setError(prev => prev || err.message);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchEarData();

        return () => { isMounted = false; };
    }, [startTime, endTime]);


    useEffect(() => {
        if (!fetchSessions) return;

        let isMounted = true;

        const fetchSessionsList = async () => {
            const rg_token = localStorage.getItem('rg_token');
            const headers = {
                'Content-Type': 'application/json',
                ...(rg_token ? { Authorization: `Bearer ${rg_token}` } : {})
            };

            try {
                const res = await fetch(`http://localhost:8082/api/dashboard/driving-sessions`, {
                    method: 'GET',
                    headers
                });

                if (!res.ok) {
                    const errorMsg = `Sessions HTTP Error: ${res.status}`;
                    console.error(errorMsg);
                    if (isMounted) setError(prev => prev || errorMsg);
                    return;
                }

                const json = await res.json();
                if (isMounted) {
                    setSessions(processSessions(json));
                }
            } catch (err) {
                console.error(err);
                if (isMounted) setError(prev => prev || err.message);
            }
        };

        fetchSessionsList();

        return () => { isMounted = false; };
    }, [fetchSessions]);

    const value = {
        dataset,
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