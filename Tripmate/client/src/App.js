import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AuthLandingPage from './pages/AuthLandingPage';
import ProfileSetup from './pages/ProfileSetup';
import ExploreEvents from './pages/ExploreEvents';
import EventDetails from './pages/EventDetails';
import ProfilePage from './pages/ProfilePage';
import Matching from './pages/MatchingPage';
import MessagesPage from './pages/MessagePage';
import AdminDashboard from './pages/AdminDashboard';
import CreateEvent from './pages/CreateEvent';
import UserManagement from './pages/UserManagement';
import UserProfile from './pages/UserProfile';
import EventUpdating from './pages/EditEvents';
import ReportedUsers from './pages/ReportedUsers';
import NotificationPage from './pages/NotificationsPage';
import EventManagement from './pages/ManageEvents';
import ProtectedRoute from './components/ProtectedRoute';
import "./styles/global.css";
import WelcomeGuidePage from './pages/WelcomeGuidePage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<AuthLandingPage />} />
          <Route path="/register" element={<Navigate to="/" replace />} />
          <Route path="/login" element={<Navigate to="/" replace />} />

          {/* Protected user routes */}
          <Route path="/dashboard" element={<Navigate to="/matching" replace />} />
          
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile-setup"
            element={
              <ProtectedRoute>
                <ProfileSetup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/explore-events"
            element={
              <ProtectedRoute>
                <ExploreEvents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:id"
            element={
              <ProtectedRoute>
                <EventDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/matching"
            element={
              <ProtectedRoute>
                <Matching />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <MessagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user-profile/:userId"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />

          {/* Admin routes for now still only protected by login.
              Later we will make a dedicated AdminRoute */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-event"
            element={
              <ProtectedRoute>
                <CreateEvent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-event/:id"
            element={
              <ProtectedRoute>
                <EventUpdating />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-events"
            element={
              <ProtectedRoute>
                <EventManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reported-users"
            element={
              <ProtectedRoute>
                <ReportedUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/welcome"
            element={
              <ProtectedRoute>
                <WelcomeGuidePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;