import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import animation from '../assets/Security Research.mp4'
import '../styles/Login.css';

function Login() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [isAdmin, setIsAdmin] = useState(false); 
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAdminChange = (e) => {
        setIsAdmin(e.target.checked);
        console.log('isAdmin:', e.target.checked);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const loginUrl = isAdmin ? '/api/admin/login' : '/api/auth/login';  

        try {
            const response = await fetch(loginUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);  
                localStorage.setItem('user', JSON.stringify(data.user));  
                localStorage.setItem('role', isAdmin ? 'admin' : 'user'); 
                console.log(localStorage.getItem('role')); 
                login(data.user, data.token);  

                navigate(isAdmin ? '/admin' : '/matching');
            } else {
                alert(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <div className="form-section">
                    <h2>Login</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <div className="input-field">
                                <input
                                 className='login-input'
                                    type="email"
                                    name="email"
                                    id="email"
                                    onChange={handleChange}
                                    value={formData.email}
                                    required
                                />
                                <label className='login-label' htmlFor="email">Email Address</label>
                            </div>
                            <div className="input-field">
                                <input className='login-input'
                                    type="password"
                                    name="password"
                                    id="password"
                                    onChange={handleChange}
                                    value={formData.password}
                                    required
                                />
                                <label className='login-label' htmlFor="password">Password</label>
                            </div>
                        </div>
                        <button type="submit" className="login-btn">Login</button>
                    </form>
                    <div className="redirect-register">
                        <p>
                            Don't have an account? <a href="/register">Register here</a>
                        </p>
                    </div>
                    {/* Admin Login Checkbox */}
                    <div className="admin-login">
                    <label className='admin-label'>
                        <input
                            className="admin-checkbox"
                            type="checkbox"
                            checked={isAdmin}
                            onChange={handleAdminChange}
                        />
                        Login as Admin
                    </label>
                </div>
                </div>
                <div className="login-image-section">
                    <video
                        autoPlay
                        loop
                        muted
                        className="login-mp4-animation"
                        src={animation}
                    />
                </div>
            </div>
        </div>
    );
} 

export default Login;
