import './App.css';
import React, { useContext } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import About from "./pages/About";
import Stats from "./pages/Stats";
import LiveFeed from "./components/LiveFeed";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AlertsPopup from "./components/AlertsPopup";
import { RecordingProvider, RecordingContext } from "./components/SessionRecording";

function App() {
    const TestAlertButtons = () => {
        const { addAlert } = useContext(RecordingContext);
        return (
            <div style={{ position: 'fixed', left: 20, bottom: 20, zIndex: 2000, display: 'flex', gap: 8 }}>
                <button onClick={() => addAlert('Test info alert', 'info')} style={{ padding: '6px 8px' }}>Test Info</button>
                <button onClick={() => addAlert('Test warning alert', 'warning')} style={{ padding: '6px 8px' }}>Test Warn</button>
                <button onClick={() => addAlert('Test critical alert', 'critical')} style={{ padding: '6px 8px', background: '#ef4444', color: '#fff' }}>Test Critical</button>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <RecordingProvider>
            <div className="App" style={{ backgroundColor: '#0e1319', paddingTop: '20px' }}>
                <AlertsPopup />

                <TestAlertButtons />

                <div className="top-right-auth">
                    <NavLink to="/login" className="auth-link">Sign in</NavLink>
                    <NavLink to="/register" className="auth-link">Sign up</NavLink>
                </div>

                <header>Welcome in Road Guard!</header>

                <nav aria-label="Main menu">
                    <ul>
                        <li><NavLink to="/about">About app</NavLink></li>
                        <li><NavLink to="/roadguard">Use app</NavLink></li>
                        <li><NavLink to="/stats">Statistics</NavLink></li>
                    </ul>
                </nav>

                <main>
                    <Routes>
                        <Route path="/" element={<h2>Home page</h2>} />
                        <Route path="/about" element={<About />} />
                        <Route path="/roadguard" element={<LiveFeed />} />
                        <Route path="/stats" element={<Stats />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                    </Routes>
                </main>
            </div>
            </RecordingProvider>
        </BrowserRouter>
    );
}

export default App;
