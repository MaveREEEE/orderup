import React, { useState, useEffect, useContext } from 'react';
import './Profile.css';
import { StoreContext } from '../../context/StoreContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';

const Profile = () => {
  const { url, token, userId } = useContext(StoreContext);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!userId || !token) return;

    try {
      setLoading(true);
      const response = await axios.get(`${url}/api/user/${userId}`, {
        headers: { token }
      });

      if (response.data.success) {
        const { name, email, phone, address } = response.data.data;
        setProfileData({ name, email, phone, address });
      } else {
        toast.error("Failed to load profile");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.put(
        `${url}/api/user/profile/update/${userId}`,
        profileData,
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success("Profile updated successfully!");
        setEditMode(false);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${url}/api/password/change-password`,
        {
          userId,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          userType: 'customer'
        },
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setShowChangePassword(false);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profileData.name) {
    return (
      <div className='profile-container'>
        <LoadingSpinner fullScreen message="Loading your profile..." />
      </div>
    );
  }

  return (
    <div className='profile-container'>
      <div className='profile-wrapper'>
        <h1>My Profile</h1>

        {/* Profile Information */}
        <div className='profile-card'>
          <div className='card-header'>
            <h2>Profile Information</h2>
            {!editMode && (
              <button
                className='edit-btn'
                onClick={() => setEditMode(true)}
              >
                Edit Profile
              </button>
            )}
          </div>

          {editMode ? (
            <form onSubmit={handleProfileSubmit}>
              <div className='form-group'>
                <label>Name</label>
                <input
                  type='text'
                  name='name'
                  value={profileData.name}
                  onChange={handleProfileChange}
                  required
                />
              </div>

              <div className='form-group'>
                <label>Email</label>
                <input
                  type='email'
                  name='email'
                  value={profileData.email}
                  onChange={handleProfileChange}
                  required
                />
              </div>

              <div className='form-group'>
                <label>Phone</label>
                <input
                  type='tel'
                  name='phone'
                  value={profileData.phone}
                  onChange={handleProfileChange}
                />
              </div>

              <div className='form-group'>
                <label>Address</label>
                <textarea
                  name='address'
                  value={profileData.address}
                  onChange={handleProfileChange}
                  rows='3'
                />
              </div>

              <div className='form-actions'>
                <button
                  type='button'
                  className='cancel-btn'
                  onClick={() => {
                    setEditMode(false);
                    fetchProfile();
                  }}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='save-btn'
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className='profile-details'>
              <div className='detail-row'>
                <span className='label'>Name:</span>
                <span className='value'>{profileData.name}</span>
              </div>
              <div className='detail-row'>
                <span className='label'>Email:</span>
                <span className='value'>{profileData.email}</span>
              </div>
              <div className='detail-row'>
                <span className='label'>Phone:</span>
                <span className='value'>{profileData.phone || 'Not provided'}</span>
              </div>
              <div className='detail-row'>
                <span className='label'>Address:</span>
                <span className='value'>{profileData.address || 'Not provided'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Change Password */}
        <div className='profile-card'>
          <div className='card-header'>
            <h2>Security</h2>
            {!showChangePassword && (
              <button
                className='edit-btn'
                onClick={() => setShowChangePassword(true)}
              >
                Change Password
              </button>
            )}
          </div>

          {showChangePassword ? (
            <form onSubmit={handlePasswordSubmit}>
              <div className='form-group'>
                <label>Current Password</label>
                <input
                  type='password'
                  name='currentPassword'
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <div className='form-group'>
                <label>New Password</label>
                <input
                  type='password'
                  name='newPassword'
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength={6}
                />
              </div>

              <div className='form-group'>
                <label>Confirm New Password</label>
                <input
                  type='password'
                  name='confirmPassword'
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength={6}
                />
              </div>

              <div className='form-actions'>
                <button
                  type='button'
                  className='cancel-btn'
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='save-btn'
                  disabled={loading}
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          ) : (
            <p className='security-message'>
              Keep your account secure by using a strong password and changing it regularly.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
