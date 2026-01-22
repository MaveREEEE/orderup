import React, { useState } from 'react';
import './ForgotPassword.css';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const url = import.meta.env.VITE_API_URL || "http://localhost:4000";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${url}/api/password/forgot-password`, {
        email: email.trim(),
        userType: 'customer'
      });

      if (response.data.success) {
        setEmailSent(true);
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error("Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='forgot-password-container'>
      <div className='forgot-password-card'>
        {!emailSent ? (
          <>
            <h2>Forgot Password</h2>
            <p className='forgot-password-description'>
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit}>
              <div className='form-group'>
                <label htmlFor='email'>Email Address</label>
                <input
                  type='email'
                  id='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='Enter your email'
                  required
                />
              </div>

              <button 
                type='submit' 
                className='submit-btn' 
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div className='forgot-password-links'>
              <Link to='/'>Back to Login</Link>
            </div>
          </>
        ) : (
          <div className='email-sent-message'>
            <div className='success-icon'>✓</div>
            <h2>Check Your Email</h2>
            <p>
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className='helper-text'>
              Please check your inbox and click the link to reset your password.
              The link will expire in 1 hour.
            </p>
            <Link to='/' className='back-to-login-btn'>
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
