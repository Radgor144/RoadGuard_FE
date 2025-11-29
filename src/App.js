import './App.css';
import React, {useContext} from "react";
import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import About from "./pages/About";
import Stats from "./pages/Stats";
import LiveFeed from "./components/LiveFeed";
import { Login, Register, AuthProvider, useAuth, RequireAuth } from './features/auth';
import {RecordingContext, RecordingProvider} from "./components/SessionRecording";
import AlertsPopup from './components/AlertsPopup';

function TopRightAuth() {
    const auth = useAuth();

    if (auth.user) {
        return (
            <div className="top-right-auth">
                <span style={{ color: 'white', marginRight: 8 }}>{auth.user.email}</span>
                <button className="auth-link" onClick={() => auth.logout()}>Logout</button>
            </div>
        );
    }

    return (
        <div className="top-right-auth">
            <NavLink to="/login" className="auth-link">Sign in</NavLink>
            <NavLink to="/register" className="auth-link">Sign up</NavLink>
        </div>
    );
}

function AppContent() {
    return (
        <>
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
                    <Route path="/" element={<Navigate to="/roadguard" replace />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/roadguard" element={
                        <RequireAuth>
                            <LiveFeed />
                        </RequireAuth>
                    } />
                    <Route path="/stats" element={<Stats />} />
                </Routes>
            </main>
        </>
    );
}

function App() {
    return (
        <AuthProvider>
            {/* Global RecordingProvider so all components share the same alerts/context */}
            <RecordingProvider>
                <BrowserRouter>
                    <InnerApp />
                    {/* AlertsPopup renders popups based on RecordingContext.alerts */}
                    <AlertsPopup />
                </BrowserRouter>
            </RecordingProvider>
        </AuthProvider>
    );
}

function InnerApp() {
    const auth = useAuth();

    return (
        <div className="App" style={{ backgroundColor: '#0e1319', paddingTop: '20px' }}>

            <TopRightAuth />

            {auth.user ? (
                <AppContent />
            ) : (
                <main>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/" element={<Navigate to="/login" replace />} />
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </main>
            )}

        </div>
    );
}

export default App;
