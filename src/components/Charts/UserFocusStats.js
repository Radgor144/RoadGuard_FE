import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import mockEarData, { staticMockEarData } from '../../data/mockEarData';

// Komponent wyświetlający: średnią koncentrację, minimalną koncentrację i całkowity czas jazdy
// Props:
// - useMockData (default true) - jeśli false, można podać apiUrl
// - apiUrl - endpoint do backendu (jeszcze nie używany domyślnie)

function formatMinutesToHMM(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  if (hours === 0) return `${minutes} min`;
  return `${hours}h ${minutes} min`;
}

export default function UserFocusStats({ useMockData = true, apiUrl = 'http://localhost:8080/api/user-focus' }) {
  const [dataset, setDataset] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (isMounted) setDataset(data);
      } catch (err) {
        console.error('UserFocusStats fetch error:', err);
        if (isMounted) {
          setError(err.message);
          // fallback
          setDataset(staticMockEarData.length ? staticMockEarData : mockEarData);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [useMockData, apiUrl]);

  if (loading) return <Typography sx={{ color: '#ffffff' }}>Ładowanie statystyk użytkownika...</Typography>;
  if (!dataset || dataset.length === 0) return <Typography sx={{ color: '#ffffff' }}>Brak danych do wyświetlenia.</Typography>;

  // Obliczenia: zakładamy, że każdy wpis ma focusPercentage (0..100) i timestamp
  const focusValues = dataset.map(d => (typeof d.focusPercentage === 'number' ? d.focusPercentage : 0));
  const average = focusValues.reduce((a, b) => a + b, 0) / focusValues.length;
  const minimum = Math.min(...focusValues);

  // oblicz całkowity czas jazdy: różnica między ostatnim i pierwszym timestamp w minutach
  let totalMinutes = 0;
  try {
    const firstTs = new Date(dataset[0].timestamp);
    const lastTs = new Date(dataset[dataset.length - 1].timestamp);
    const diffMs = Math.abs(lastTs - firstTs);
    totalMinutes = Math.round(diffMs / (60 * 1000));
    // jeśli dane są generowane co minutę i chcemy liczyć również łączny czas jako count*1min
    if (totalMinutes === 0 && dataset.length > 1) totalMinutes = dataset.length - 1;
  } catch (e) {
    totalMinutes = Math.max(0, dataset.length - 1);
  }

  const cardStyle = {
    background: '#ffffff',
    color: '#000000',
    padding: 16,
    borderRadius: 8,
    minWidth: 220,
    boxShadow: '0 6px 18px rgba(0,0,0,0.12)'
  };

  return (
    <Box sx={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Box sx={cardStyle}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Średnia koncentracja</Typography>
        <Typography variant="h3" sx={{ mt: 1 }}>{average.toFixed(1)}%</Typography>
        <Typography variant="caption" sx={{ color: '#333', display: 'block', mt: 1 }}>Średnia wartość koncentracji dla dostępnych danych</Typography>
      </Box>

      <Box sx={cardStyle}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Minimalna koncentracja</Typography>
        <Typography variant="h3" sx={{ mt: 1 }}>{minimum.toFixed(1)}%</Typography>
        <Typography variant="caption" sx={{ color: '#333', display: 'block', mt: 1 }}>Najniższy zmierzony poziom</Typography>
      </Box>

      <Box sx={cardStyle}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Całkowity czas jazdy</Typography>
        <Typography variant="h4" sx={{ mt: 1 }}>{formatMinutesToHMM(totalMinutes)}</Typography>
        <Typography variant="caption" sx={{ color: '#333', display: 'block', mt: 1 }}>Obliczony na podstawie zakresu znaczników czasu</Typography>
      </Box>
    </Box>
  );
}

