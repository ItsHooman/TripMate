import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser({
                    ...parsedUser,
                    isAdmin: parsedUser.isAdmin ?? false,
                });
            } catch (error) {
                console.error("Failed to parse user data from localStorage:", error);
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        }

        setAuthLoading(false);
    }, []);

    const login = (userData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        if (user?.isAdmin) {
            const confirmLogout = window.confirm("Are you sure you want to log out as an admin?");
            if (!confirmLogout) {
                return;
            }
        }

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, authLoading }}>
            {children}
        </AuthContext.Provider>
    );
};