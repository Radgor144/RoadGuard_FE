import React, { useState, useEffect } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { Box, Typography, useMediaQuery } from "@mui/material";
import mockEarData from '../../data/mockEarData';

function downsampleByAveraging(dataset) {
    if (dataset.length <= 2) return dataset;

    const result = [];
    result.push(dataset[0]);

    for (let i = 1; i < dataset.length; i += 2) {
        const p1 = dataset[i];
        const p2 = dataset[i + 1];

        if (!p2) {
            result.push(p1);
        } else {
            result.push({
                timeLabel: p2.timeLabel,
                focusPercentage: Math.round(
                    (p1.focusPercentage + p2.focusPercentage) / 2
                )
            });
        }
    }

    return result;
}

export default function FocusPerTimeChart({
                                              useMockData = true,
                                              apiUrl = 'http://localhost:8080/api/chart-data'
                                          }) {
    const [dataset, setDataset] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [chartWidth, setChartWidth] = useState(450);

    const isCompactChart = useMediaQuery('(max-width:750px)');

    useEffect(() => {
        const calculateWidth = () => {
            const screenWidth = window.innerWidth;

            if (screenWidth < 600) {
                setChartWidth(450);
            } else if (screenWidth > 1100) {
                setChartWidth(950);
            } else {
                setChartWidth(screenWidth - 150);
            }
        };

        calculateWidth();
        window.addEventListener('resize', calculateWidth);
        return () => window.removeEventListener('resize', calculateWidth);
    }, []);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
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
                const res = await fetch(apiUrl);
                if (!res.ok) {
                    if (isMounted) {
                        setError(`HTTP ${res.status}`);
                        setDataset(mockEarData);
                    }
                    return;
                }
                const data = await res.json();
                if (isMounted) setDataset(data);
            } catch (err) {
                console.error(err);
                if (isMounted) {
                    setError(err.message);
                    setDataset(mockEarData);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();
        return () => { isMounted = false; };
    }, [useMockData, apiUrl]);

    if (loading) {
        return <Typography sx={{ color: '#fff' }}>Loading data...</Typography>;
    }

    if (!dataset.length) {
        return (
            <Typography sx={{ color: '#fff' }}>
                {error ? `Error: ${error}` : 'No data to show'}
            </Typography>
        );
    }

    const chartDataset = isCompactChart
        ? downsampleByAveraging(dataset)
        : dataset;

    const timeLabels = chartDataset.map(p => p.timeLabel);
    const focusValues = chartDataset.map(p => p.focusPercentage);

    return (
        <Box
            sx={{
                bgcolor: '#1f2937',
                borderRadius: 2,
                p: { xs: 1, md: 2 },
                boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
                display: 'flex',
                justifyContent: 'center'
            }}
        >
            <LineChart
                width={chartWidth}
                height={isCompactChart ? 320 : 420}
                grid={{
                    horizontal: true,
                    stroke: 'rgba(255,255,255,0.15)'
                }}
                sx={{
                    '& .MuiChartsAxis-tickLabel': { fill: '#fff' },
                    '& .MuiChartsAxis-label': { fill: '#fff' },
                    '& .MuiChartsLegend-label': { fill: '#fff' },
                    '& .MuiChartsGrid-line': {
                    stroke: '#fff',
                    strokeOpacity: 0.2
                }
                }}
                xAxis={[{
                    scaleType: 'point',
                    data: timeLabels,
                    tickNumber: isCompactChart ? 6 : 10,
                    tickLabelStyle: {
                        fontSize: isCompactChart ? 10 : 12,
                        angle: isCompactChart ? -45 : 0,
                        fill: '#fff'
                    }
                }]}
                yAxis={[{
                    min: 0,
                    max: 100,
                    label: 'Focus (%)',
                    labelStyle: {
                        fontWeight: 'bold',
                        fill: '#fff'
                    },
                    tickLabelStyle: {
                        fill: '#fff'
                    },
                    colorMap: {
                        type: 'piecewise',
                        thresholds: [25, 50, 100],
                        colors: ['#cb1224', '#f59e0b', '#1B885E']
                    }
                }]}
                series={[{
                    data: focusValues,
                    curve: 'catmullRom',
                    showMark: true,
                    valueFormatter: v => `${v}%`
                }]}
                margin={{
                    left: 60,
                    right: 30,
                    top: 30,
                    bottom: isCompactChart ? 90 : 60
                }}
            />
        </Box>
    );
}
