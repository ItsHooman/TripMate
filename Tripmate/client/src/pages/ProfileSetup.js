import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/ProfileSetup.css';

function ProfileSetup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [interests, setInterests] = useState('');
    const [preferredDestinations, setPreferredDestinations] = useState('');
    const [travelStyle, setTravelStyle] = useState('');
    const [bio, setBio] = useState('');
    const [location , setLocation] = useState('');
    const [profilePicture, setProfilePicture] = useState(null);
    const navigate = useNavigate();
    const defaultProfilePicture = 'https://i.postimg.cc/rwk4Qqd6/avatar-account-flat-isolated-on-transparent-background-for-graphic-and-web-design-default-social-med.jpg';

    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch('/api/profile', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data) {
                    setName(data.name);
                    setEmail(data.email);
                    setInterests(data.interests.join(', '));
                    setPreferredDestinations(data.preferredDestinations.join(', '));
                    setTravelStyle(data.travelStyle);
                    setBio(data.bio);
                    setLocation(data.location);
                    setProfilePicture(data.profilePicture);
                }
            });
    }, []);

    const handleFileChange = (e) => {
        setProfilePicture(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('interests', interests);
        formData.append('preferredDestinations', preferredDestinations);
        formData.append('travelStyle', travelStyle);
        formData.append('bio', bio);
        formData.append('location', location);
        if (profilePicture) {
            formData.append('profilePicture', profilePicture);
        }

        const response = await fetch('/api/profile', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        if (response.ok) {
            alert('Profile updated!');
            navigate('/matching');
        } else {
            alert('Error updating profile');
        }
    };

    return (
        <div className='profile-container'>
            <h2 className='profile-title'>Set Up Your Profile</h2>
            <form onSubmit={handleSubmit} className='profile-form'>
                <input
                    className='profile-input'
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <input
                    className='profile-input'
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    className='profile-input'
                    placeholder="Enter your interests (comma separated)"
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                />
                <input
                    className='profile-input'
                    placeholder="Enter your preferred destinations (comma separated)"
                    value={preferredDestinations}
                    onChange={(e) => setPreferredDestinations(e.target.value)}
                />
                <input
                    className='profile-input'
                    placeholder="Write something about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                />
                <input
                    className='profile-input'
                    type="text"
                    placeholder="Travel Style (e.g. Solo, Group)"
                    value={travelStyle}
                    onChange={(e) => setTravelStyle(e.target.value)}
                />
                <input
                    className='profile-input'
                    type="text"
                    placeholder="Enter your Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                />
                <input
                    className='profile-input'
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                />
                <img
                    className='profile-image'
                    src={profilePicture || defaultProfilePicture}
                    alt="Profile"
                />
                <button type="submit" className='profile-button'>Save Profile</button>
                <Link to="/profile" className='profile-link'>Go to Profile</Link>
            </form>
        </div>
    );
}

export default ProfileSetup;
