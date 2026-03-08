import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { FaUserAlt, FaMapMarkedAlt, FaCalendarAlt, FaHeart, FaGlobeAmericas, FaEnvelope  } from 'react-icons/fa';
import '../styles/ProfilePage.css';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

function ProfilePage() {
    const [profile, setProfile] = useState(null);
    const [error, setError] = useState(null);
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const defaultProfilePicture = 'https://i.postimg.cc/rwk4Qqd6/avatar-account-flat-isolated-on-transparent-background-for-graphic-and-web-design-default-social-med.jpg';

    const toggleMenu = () => {
      setIsMenuOpen(!isMenuOpen);
    };

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('You must be logged in to view the profile');
                return;
            }

            try {
                const response = await fetch('/api/profile/', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!response.ok) {
                    const data = await response.json();
                    setError(data.message || 'Failed to fetch profile');
                    return;
                }

                const data = await response.json();
                setProfile(data);
            } catch (error) {
                setError('An error occurred while fetching the profile');
                console.error(error);
            }
        };

        fetchProfile();
    }, []);

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (!profile) {
        return <div>Loading...</div>;
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="profilePage-container">
              <Navbar />
              <div className="app-page">
        <div className="profilePage-card">
            <div className="profilePage-image-container">
                <img src={profile.profilePicture || defaultProfilePicture} alt="Profile" className="profilePage-image" />
            </div>
            <div className="profilePage-info">
                <div className="profilePage-details">
                    <div className="profilePage-detail">
                        <FaUserAlt className="profilePage-icon" />
                        <p><strong>Name:</strong> {profile.name}</p>
                    </div>
                    <div className="profilePage-detail">
                        <FaEnvelope className="profilePage-icon" />
                        <p><strong>Email:</strong> {profile.email}</p>
                    </div>
                    <div className="profilePage-detail">
                        <FaHeart className="profilePage-icon" />
                        <p><strong>Bio:</strong> {profile.bio}</p>
                    </div>
                    <div className="profilePage-detail">
                        <FaGlobeAmericas className="profilePage-icon" />
                        <p><strong>Interests:</strong> {profile.interests.join(', ')}</p>
                    </div>
                    <div className="profilePage-detail">
                        <FaMapMarkedAlt className="profilePage-icon" />
                        <p><strong>Location:</strong> {profile.location}</p>
                    </div>
                    <div className="profilePage-detail">
                        <FaCalendarAlt className="profilePage-icon" />
                        <p><strong>Travel Dates:</strong>
                            {profile.travelDates ? 
                                `${new Date(profile.travelDates.start).toLocaleDateString()} - ${new Date(profile.travelDates.end).toLocaleDateString()}` 
                                : 'No travel dates specified'}
                        </p>
                    </div>
                </div>
                <div className="profilePage-actions">
                    <Link to="/profile-setup">
                        <button className="profile-edit-button">Edit Profile</button>
                    </Link>
                    <Link className="dashboard-link" to="/matching">Back to Matching</Link>
                </div>
            </div>
        </div>
        </div>
    </div>
    );
}

export default ProfilePage;
