import React, { createContext, useContext, useState, useEffect } from 'react';
import { mapEarToFocusPercent } from "../../mediapipe/components/DriverMonitoring/EarToPercent";

const StatsContext = createContext();

export const useStatsData = () => useContext(StatsContext);

export const StatsProvider = ({ children, startTime, endTime }) => {
    const [dataset, setDataset] = useState([]);
    const [breaks, setBreaks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!startTime || !endTime) return;
        let isMounted = true;

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const rg_token = localStorage.getItem('rg_token');
                const res = await fetch(`http://localhost:8082/api/dashboard/ear-data`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(rg_token ? { Authorization: `Bearer ${rg_token}` } : {})
                    },
                    body: JSON.stringify({ startTime, endTime })
                });

                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();

                if (!isMounted) return;

                const rawDriveData = data.activeDriveData || [];
                const rawBreaks = data.breaks || [];

                const formattedData = rawDriveData.map(d => ({
                    timestamp: new Date(d.timestamp),
                    focusPercentage: mapEarToFocusPercent(d.averageEar)
                }));

                const GAP_THRESHOLD_MS = 15 * 60 * 1000;
                const dataWithGaps = [];
                for (let i = 0; i < formattedData.length; i++) {
                    const curr = formattedData[i];
                    if (i > 0) {
                        const prev = formattedData[i - 1];
                        if (curr.timestamp.getTime() - prev.timestamp.getTime() > GAP_THRESHOLD_MS) { // Poprawione na getTime()
                            dataWithGaps.push({ timestamp: new Date(prev.timestamp.getTime() + 1000), focusPercentage: null });
                        }
                    }
                    dataWithGaps.push(curr);
                }

                setDataset(dataWithGaps);
                setBreaks(rawBreaks);
            } catch (err) {
                console.error(err);
                if (isMounted) {
                    setError(err.message);
                    setDataset([]);
                    setBreaks([]);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();
        return () => { isMounted = false; };
    }, [startTime, endTime]);

    return (
        <StatsContext.Provider value={{ dataset, breaks, loading, error, startTime, endTime }}>
            {children}
        </StatsContext.Provider>
    );
};