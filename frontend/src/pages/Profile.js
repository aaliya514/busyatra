import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Lock, Save } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import './Profile.css';

const Profile = ({ onNavigate }) => {
  const { user, updateUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: '',
    phone: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
    setMessage({ type: '', text: '' });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
    setMessage({ type: '', text: '' });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await userAPI.updateProfile(profileData);
      updateUser(res.data.data);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update profile'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setLoading(true);

    try {
      await userAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to change password'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar currentPage="profile" onNavigate={onNavigate} />
      <div className="profile-page">
        <div className="profile-container">
          {/* Header */}
          <div className="profile-header">
            <div className="profile-avatar-large">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h1>{user?.name || 'User'}</h1>
              <p>{user?.email}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="profile-tabs">
            <button
              className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('profile');
                setMessage({ type: '', text: '' });
              }}
            >
              <User size={20} />
              Profile Information
            </button>
            <button
              className={`tab ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('password');
                setMessage({ type: '', text: '' });
              }}
            >
              <Lock size={20} />
              Change Password
            </button>
          </div>

          {/* Message */}
          {message.text && (
            <div className={`profile-message ${message.type}`}>
              {message.text}
            </div>
          )}

          {/* Content */}
          <div className="profile-content">
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit} className="profile-form">
                <h2>Update Your Information</h2>

                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <div className="input-wrapper">
                      <User size={20} className="input-icon" />
                      <input
                        type="text"
                        name="name"
                        value={profileData.name}
                        onChange={handleProfileChange}
                        className="input"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <div className="input-wrapper">
                      <Mail size={20} className="input-icon" />
                      <input
                        type="email"
                        value={user?.email || ''}
                        className="input"
                        disabled
                      />
                    </div>
                    <span className="form-hint">Email cannot be changed</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <div className="input-wrapper">
                    <Phone size={20} className="input-icon" />
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      placeholder="98xxxxxxxx"
                      className="input"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary btn-full"
                  disabled={loading}
                >
                  <Save size={20} />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="profile-form">
                <h2>Change Your Password</h2>

                <div className="form-group">
                  <label>Current Password</label>
                  <div className="input-wrapper">
                    <Lock size={20} className="input-icon" />
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter current password"
                      className="input"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <div className="input-wrapper">
                    <Lock size={20} className="input-icon" />
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
                      className="input"
                      required
                    />
                  </div>
                  <span className="form-hint">Minimum 6 characters</span>
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <div className="input-wrapper">
                    <Lock size={20} className="input-icon" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                      className="input"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary btn-full"
                  disabled={loading}
                >
                  <Save size={20} />
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            )}
          </div>

          {/* Account Info */}
          <div className="account-info">
            <h3>Account Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Role</span>
                <span className="info-value">{user?.role || 'User'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Member Since</span>
                <span className="info-value">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
