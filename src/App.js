import './App.css';
import React from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import About from "./pages/About";
import Stats from "./pages/Stats";
import LiveFeed from "./components/LiveFeed";

function App() {
    return (
        <BrowserRouter>
            <div className="App">
                <header>Welcome in Road Guard!</header>

                <nav aria-label="Main menu">
                    <ul>
                        <li>
                            <NavLink to="/about" className={({ isActive }) => isActive ? "active" : ""}>
                                About app
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/roadguard" className={({ isActive }) => isActive ? "active" : ""}>
                                Use app
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/stats" className={({ isActive }) => isActive ? "active" : ""}>
                                Statistics
                            </NavLink>
                        </li>
                    </ul>
                </nav>

                <main>
                    <Routes>
                        <Route path="/" element={<h2>Home page</h2>} />
                        <Route path="/about" element={<About />} />
                        <Route
                            path="/roadguard"
                            /* element={
                                <div className="roadguard-wrapper">
                                    <div className="camera">
                                        <DriverMonitoring />
                                    </div>

                                    <div className="gauge">
                                        <GaugeComponent
                                            size={200}
                                            value={10}
                                            minValue={0}
                                            maxValue={100}
                                            label="Driver Alertness"
                                            color="#FF0000"
                                        />
                                    </div>

                                    <RoadGuard />
                                </div>
                            } */
                            element={<LiveFeed />}
                        />
                        <Route path="/stats" element={<Stats />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}

export default App;
