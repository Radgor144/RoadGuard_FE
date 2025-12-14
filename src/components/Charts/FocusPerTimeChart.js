import React, {useState, useEffect} from 'react';
import {LineChart} from '@mui/x-charts/LineChart';
import {Box, Typography} from "@mui/material";
// Import ścieżki do danych testowych
import mockEarData from '../../data/mockEarData';

// --- Main Component ---

const FocusPerTimeChart = ({useMockData = true, apiUrl = 'http://localhost:8080/api/chart-data'}) => {
    // data states
    const [dataset, setDataset] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. Logika pobierania danych
    useEffect(() => {
        let isMounted = true;

        const fetchChartData = async () => {
            setLoading(true);
            setError(null);

            if (useMockData) {
                if (isMounted) {
                    setDataset(mockEarData);
                    setLoading(false);
                }
                return;
            }

            try {
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const result = await response.json();
                if (isMounted) {
                    setDataset(result);
                }
            } catch (err) {
                console.error('Fetch error:', err);
                if (isMounted) {
                    setError(err.message);
                    // Fallback do mock data w przypadku błędu
                    setDataset(mockEarData);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchChartData();

        // Cleanup function
        return () => {
            isMounted = false;
        };
    }, [useMockData, apiUrl]);


    // 3. Handle loading/error states
    if (loading) return <Typography sx={{color: '#ffffff'}}>Ładowanie danych wykresu...</Typography>;
    if (dataset.length === 0) return (
        <Typography sx={{color: '#ffffff'}}>
            {error ? `Błąd: ${error}. Brak danych.` : 'Brak dostępnych danych do wyświetlenia wykresu.'}
        </Typography>
    );

    // Przygotowanie danych dla wykresu (mapowanie do prostych tablic)
    const timeLabels = dataset.map(p => p.timeLabel);
    const focusValues = dataset.map(p => p.focusPercentage);


    // 4. Chart Configuration
    return (
        <Box sx={{width: '100%', maxWidth: 900, margin: 'auto', p: 2}}>
            <Typography variant="h5" gutterBottom sx={{color: '#ffffff'}}>
                Poziom Koncentracji w Czasie
            </Typography>

            {error && useMockData && (
                <Typography color="warning.main" variant="caption" display="block" gutterBottom>
                    Używanie danych testowych (Błąd połączenia z backendem)
                </Typography>
            )}

            <Box sx={{
                bgcolor: '#ffffff',
                borderRadius: 2,
                p: 2,
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.5)'
            }}>
                {/* Obrazek pokazujący wynikowy wykres */}

                <LineChart
                    width={850}
                    height={400}
                    grid={{horizontal: true}}

                    // X-AXIS: Czas
                    xAxis={[{
                        scaleType: 'point',
                        data: timeLabels,
                        label: 'Time',
                        labelStyle: {fill: '#000000', fontWeight: 'bold'},
                        tickLabelStyle: {fill: '#424242', fontSize: 11, angle: -45},
                        tickNumber: 10,
                    }]}

                    // Y-AXIS: Procent Koncentracji
                    yAxis={
                        [
                            {
                                label: 'Focus Level (%)',
                                min: 0,
                                max: 100,
                                labelStyle: {fill: '#000000', fontWeight: 'bold'},
                                tickLabelStyle: {fill: '#424242'},
                                colorMap: {
                                    type: 'piecewise',
                                    thresholds: [25, 50, 100],
                                    colors: [
                                        '#cb1224', // < 25 (Red - Drowsy)
                                        '#f59e0b', // 25-50 (Orange - Tired)
                                        '#1B885E' // > 50 (Green - Fully Alert)
                                    ],
                                }
                            }
                        ]
                    }

                    // UŻYWAMY TYLKO JEDNEJ SERII Z colorMap
                    series={
                        [
                            {
                                data: focusValues,
                                showMark: true,
                                curve: 'catmullRom',
                                valueFormatter: (value) => `${value}%`,
                            }
                        ]
                    }



                    margin={{left: 60, right: 30, top: 30, bottom: 80}}
                />
            </Box>

            {/* Panel referencyjny */}
            <Box sx={{mt: 2, p: 2, bgcolor: '#1a1a1a', borderRadius: 1, border: '1px solid #333'}}>
                <Typography variant="body2" sx={{color: '#e0e0e0'}}>
                    <strong style={{color: '#ffffff'}}>Focus Level Reference:</strong><br/>
                    <span style={{color: '#1B885E', fontWeight: 'bold'}}>● 50-100%:</span> Fully alert and focused<br/>
                    <span style={{color: '#f59e0b', fontWeight: 'bold'}}>● 25-50%:</span> Reduced focus, getting
                    tired<br/>
                    <span style={{color: '#cb1224', fontWeight: 'bold'}}>● 0-25%:</span> Very drowsy, immediate rest
                    recommended<br/>
                    <br/>
                    <em style={{color: '#999', fontSize: '0.9em'}}>
                        Linia odzwierciedla poziom koncentracji w czasie.
                    </em>
                </Typography>
            </Box>
        </Box>
    );
}
export default FocusPerTimeChart;