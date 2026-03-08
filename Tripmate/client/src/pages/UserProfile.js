import React, { useEffect, useState, useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaUserAlt, FaMapMarkedAlt, FaCalendarAlt, FaHeart, FaGlobeAmericas } from 'react-icons/fa';
import '../styles/UserProfile.css';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from "../components/Navbar";

function UserProfile() {
  const { userId } = useParams(); 
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState([]);
  const validReasons = ['Inappropriate behavior', 'Spam', 'Harassment'];
  const defaultProfilePicture = 'https://i.postimg.cc/rwk4Qqd6/avatar-account-flat-isolated-on-transparent-background-for-graphic-and-web-design-default-social-med.jpg';

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');

    // Open report modal
    const openReportModal = () => {
      setIsReportModalOpen(true);
    };
  
    // Close report modal
    const closeReportModal = () => {
      setIsReportModalOpen(false);
      setReportReason('');
    };
  
    const handleCheckboxChange = (e) => {
      const { value, checked } = e.target;
      setSelectedReasons((prev) =>
        checked ? [...prev, value] : prev.filter((reason) => reason !== value)
      );
    };
    
    const handleReportSubmit = async () => {
      if (selectedReasons.length === 0) {
        alert('Please select at least one reason for reporting.');
        return;
      }
    
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5002/api/reports/report', {
          method: 'POST',
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reportedUserId: userDetails._id,
            reason: selectedReasons.join(', '), // Combine the selected reasons into a string
          }),
        });
    
        if (!response.ok) {
          throw new Error('Failed to report user');
        }
    
        // Close the modal after successful report
        closeReportModal();
        alert('User reported successfully');
      } catch (err) {
        console.error(err);
        alert('There was an issue reporting the user');
      }
    };

    const toggleMenu = () => {
      setIsMenuOpen(!isMenuOpen);
    };

  useEffect(() => {
    console.log('userId:', userId);
    const fetchUserDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5002/api/matche/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setUserDetails(data);
      } catch (err) {
        setError('Failed to fetch user details. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId]);

  if (loading) return <p>Loading user profile...</p>;
  if (error) return <p>{error}</p>;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // New function to handle connecting with this user
  const handleConnect = () => {
    const connectedUsers = JSON.parse(localStorage.getItem('connectedUsers')) || [];
    const isAlreadyConnected = connectedUsers.some(user => user._id === userDetails._id);
  
    if (!isAlreadyConnected) {
      connectedUsers.push(userDetails);
      localStorage.setItem('connectedUsers', JSON.stringify(connectedUsers));
    }
  
    // Navigate to messages and pass the selected user
    console.log('Navigating to messages with user:', userDetails);
    navigate('/messages', { state: { selectedUser: userDetails } });    
  };  

  return (
    <div className="profilePage-container">
      <Navbar />
      <div className="profilePage-card">
        <div className="profilePage-image-container">
          <img src={userDetails.profile.profilePicture || defaultProfilePicture} alt="Profile" className="profilePage-image" />
        </div>
        <div className="profilePage-info">
          <div className="profilePage-details">
            <div className="profilePage-detail">
              <FaUserAlt className="profilePage-icon" />
              <p><strong>Name:</strong> {userDetails.profile.name}</p>
            </div>
            <div className="profilePage-detail">
              <FaUserAlt className="profilePage-icon" />
              <p><strong>Email:</strong> {userDetails.profile.email}</p>
            </div>
            <div className="profilePage-detail">
              <FaHeart className="profilePage-icon" />
              <p><strong>Bio:</strong> {userDetails.profile.bio}</p>
            </div>
            <div className="profilePage-detail">
              <FaGlobeAmericas className="profilePage-icon" />
              <p><strong>Interests:</strong> {userDetails.profile.interests.join(', ')}</p>
            </div>
            <div className="profilePage-detail">
              <FaMapMarkedAlt className="profilePage-icon" />
              <p><strong>Location:</strong> {userDetails.profile.location}</p>
            </div>
            <div className="profilePage-detail">
              <FaCalendarAlt className="profilePage-icon" />
              <p><strong>Travel Dates:</strong>
                {userDetails.profile.travelDates ? 
                  `${new Date(userDetails.profile.travelDates.start).toLocaleDateString()} - ${new Date(userDetails.profile.travelDates.end).toLocaleDateString()}` 
                  : 'No travel dates specified'}
              </p>
            </div>
          </div>
          <div className="profilePage-actions">
            {/* Use the handleConnect function on button click */}
            <button onClick={handleConnect} className="edit-button">Connect</button>
            <button onClick={openReportModal} className="edit-button">Report</button>
          </div>
        </div>
      </div>
      {/* Modal for reporting user */}
      {isReportModalOpen && (
        <div className="report-modal">
          <div className="report-modal-content">
            <h2>Report User</h2>
            <div>
              <input
                type="checkbox"
                id="inappropriate"
                value="Inappropriate behavior"
                checked={selectedReasons.includes("Inappropriate behavior")}
                onChange={handleCheckboxChange}
              />
              <label htmlFor="inappropriate">Inappropriate behavior</label>
            </div>
            <div>
              <input
                type="checkbox"
                id="spam"
                value="Spam"
                checked={selectedReasons.includes("Spam")}
                onChange={handleCheckboxChange}
              />
              <label htmlFor="spam">Spam</label>
            </div>
            <div>
              <input
                type="checkbox"
                id="harassment"
                value="Harassment"
                checked={selectedReasons.includes("Harassment")}
                onChange={handleCheckboxChange}
              />
              <label htmlFor="harassment">Harassment</label>
            </div>
            <div className="report-modal-actions">
              <button onClick={closeReportModal}>Cancel</button>
              <button onClick={handleReportSubmit}>Submit Report</button>
            </div>
          </div>
        </div>      
      )}
    </div>
  );
}

export default UserProfile;
