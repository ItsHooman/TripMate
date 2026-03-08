import React, { useEffect, useState } from 'react';
import '../styles/ReportedUsers.css';

function ReportedUsers() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem('token'); 
        const response = await fetch('http://localhost:5002/api/reports/admin/reports', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch reports.');
        }

        const data = await response.json();
        setReports(data);
      } catch (err) {
        console.error('Error fetching reports:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handleStatusChange = async (reportId, status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5002/api/reports/admin/reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update report status.');
      }

      alert('Status updated.');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleUnbanUser = async (reportId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5002/api/reports/admin/reports/${reportId}/unban`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to unban user.');
      }

      alert('User has been unbanned.');

      // Remove resolved reports from the list
      setReports((prevReports) => prevReports.filter(report => report._id !== reportId));

    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  if (loading) return <p>Loading reports...</p>;

  return (
    <div className="reported-users-container">
      <h1>Reported Users</h1>
      <ul>
        {reports.map((report) => (
          <li key={report._id}>
            <p>Reported User: {report.reportedUserId.name}</p>
            <p>Reporter: {report.reporterUserId.name}</p>
            <p>Reason: {report.reason}</p>
            <p>Status: {report.status}</p>
            <button 
              className="ban-button" 
              onClick={() => handleStatusChange(report._id, 'banned')}
            >
              Ban User
            </button>
            <button 
              className="unban-button" 
              onClick={() => handleUnbanUser(report._id)}
              disabled={report.status !== 'banned'}
            >
              Unban User
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ReportedUsers;
