import React, { createContext, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const AuthContext = createContext(null);
const API_BASE = '';

const parseErrorMessage = (errText) => {
    try {
        const parsed = JSON.parse(errText);
        return parsed.message || JSON.stringify(parsed);
    } catch {
        return errText;
    }
};

const handleAuthResponse = async (res) => {
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(parseErrorMessage(errText));
    }
    return res.json();
};

const saveAuthData = (email, data) => {
    // log returned keys for debugging
    try {
        const keys = data && typeof data === 'object' ? Object.keys(data).join(',') : String(data);
        console.log('Auth: saveAuthData response keys ->', keys);
    } catch (e) {
        // ignore
    }

    const token = data.accessToken || data.token || data.access_token || data.jwt;
    if (!token) {
        console.warn('Auth: no token found in response', data);
        throw new Error('No access token returned');
    }

    // mask token for logs
    try { console.log('Auth: saving token ->', token ? token.slice(0,8) + '...' : null); } catch(e){}

    localStorage.setItem('rg_token', token);
    localStorage.setItem('rg_current_user', JSON.stringify({ email }));
    // notify other parts of app
    try { window.dispatchEvent(new Event('rg:auth-changed')); } catch (e) { /* ignore */ }
    return { email };
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const raw = localStorage.getItem('rg_current_user');
        if (raw) {
            try {
                setUser(JSON.parse(raw));
            } catch {
                localStorage.removeItem('rg_current_user');
            }
        }
    }, []);

    const authRequest = async (endpoint, credentials) => {
        try {
            const res = await fetch(`${API_BASE}/api/users/${endpoint}`, {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });

            const data = await handleAuthResponse(res);
            const currentUser = saveAuthData(credentials.email, data);
            setUser(currentUser);
            // notify other parts of app about user change
            try { window.dispatchEvent(new Event('rg:auth-changed')); } catch (e) { /* ignore */ }
            return data;
        } catch (err) {
            console.error(`Auth error:`, err);
            throw err;
        }
    };

    const register = (credentials) => authRequest('register', credentials);
    const login = (credentials) => authRequest('login', credentials);

    const logout = () => {
        localStorage.removeItem('rg_current_user');
        localStorage.removeItem('rg_token');
        setUser(null);
        try { window.dispatchEvent(new Event('rg:auth-changed')); } catch (e) { /* ignore */ }
    };

    return (
        <AuthContext.Provider value={{ user, register, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}

export function RequireAuth({ children }) {
    const auth = useAuth();
    const location = useLocation();

    if (!auth.user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}
