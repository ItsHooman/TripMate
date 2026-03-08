import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/HomePage.css'; 

function HomePage() {
    return (
        <div className="home-container">
            <nav className="home-navbar-main">
            <div className="home-menu-icon">
                <i className="fa-solid fa-bars"></i>
                <ul className="home-dropdown-menu">
                    <li><Link to="/about">About</Link></li>
                    <li><Link to="/register">Register</Link></li>
                    <li><Link to="/login">Log In</Link></li>
                </ul>
            </div>
        </nav>
            <img 
                className="home-logo" 
                src="/logo-1-Photoroom.png" 
                alt="App Logo" 
            />
            <div className="home-image-wrapper">
                <img 
                    className="home-image" 
                    src="main-back2.webp" 
                    alt="Background"
                />
                <div className="home-overlay">
                    <Link to="/register" className="get-started-link">
                        Let's Get Started <i className="fa fa-arrow-right"></i>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default HomePage;
