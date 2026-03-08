import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import animation from '../assets/Web Address registration.mp4'
import '../styles/Register.css'; 

function Register() {
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (response.ok) {
                alert('Registration successful!');
                navigate('/login');
            } else {
                alert(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <div className="register-container">
            <div className="register-box">
                <div className="form-section">
                    <h2>Create an Account</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <div className="input-field">
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    onChange={handleChange}
                                    value={formData.name}
                                    required
                                />
                                <label className='register-label' htmlFor="name">Full Name</label>
                            </div>
                            <div className="input-field">
                                <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    onChange={handleChange}
                                    value={formData.email}
                                    required
                                />
                                <label className='register-label' htmlFor="email">Email Address</label>
                            </div>
                            <div className="input-field">
                                <input
                                    type="password"
                                    name="password"
                                    id="password"
                                    onChange={handleChange}
                                    value={formData.password}
                                    required
                                />
                                <label className='register-label' htmlFor="password">Password</label>
                            </div>
                        </div>
                        <button type="submit" className="register-btn">
                            Register
                        </button>
                    </form>
                    <div className="redirect-login">
                        <p>
                            Already have an account? <a href="/login">Login here</a>
                        </p>
                    </div>
                </div>
                <div className="image-section">
                    <video
                        autoPlay
                        loop
                        muted
                        className="mp4-animation"
                        src={animation}
                    />
                </div>
            </div>
        </div>
    );
    }
    
export default Register;
