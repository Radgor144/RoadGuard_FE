import './App.css';
import React from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import About from "./pages/About";
import Stats from "./pages/Stats";
import LiveFeed from "./components/LiveFeed";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
    return (
        <BrowserRouter>
            <div className="App" style={{ backgroundColor: '#0e1319', paddingTop: '20px' }}>

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
        </BrowserRouter>
    );
}

export default App;
