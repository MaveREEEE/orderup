import React, { useState } from 'react';
import './ResetPassword.css';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const url = import.meta.env.VITE_API_URL || "http://localhost:4000";

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${url}/api/password/reset-password`, {
        token,
        newPassword: formData.password,
        userType: 'customer'
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='reset-password-container'>
      <div className='reset-password-card'>
        <h2>Reset Password</h2>
        <p className='reset-password-description'>
          Enter your new password below
        </p>

        <form onSubmit={handleSubmit}>
          <div className='form-group'>
            <label htmlFor='password'>New Password</label>
            <input
              type='password'
              id='password'
              name='password'
              value={formData.password}
              onChange={handleChange}
              placeholder='Enter new password'
              required
              minLength={6}
            />
          </div>

          <div className='form-group'>
            <label htmlFor='confirmPassword'>Confirm Password</label>
            <input
              type='password'
              id='confirmPassword'
              name='confirmPassword'
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder='Re-enter new password'
              required
              minLength={6}
            />
          </div>

          <button 
            type='submit' 
            className='submit-btn' 
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className='reset-password-links'>
          <Link to='/'>Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
