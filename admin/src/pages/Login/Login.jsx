import React, { useState } from 'react'
import './Login.css'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { assets } from '../../assets/assets'

const Login = ({ url, setToken, setUserRole }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log("Attempting login...")
      const response = await axios.post(url + "/api/auth/login", {
        email: email.trim(),
        password: password
      })

      console.log("Response:", response.data)

      if (response.data.success) {
        const { token, userType, role, name } = response.data

        if (userType === 'admin') {
          sessionStorage.setItem("token", token)
          sessionStorage.setItem("userRole", role)
          sessionStorage.setItem("userType", "admin")
          setToken(token)
          setUserRole(role)
          toast.success(`Welcome ${name}!`)
          setTimeout(() => {
            navigate("/") // Go to dashboard
          }, 500)
        } else {
          toast.warning("This login is for admin panel only. Redirecting...")
          setTimeout(() => {
            window.location.href = 'http://localhost:5173/'
          }, 2000)
        }
      } else {
        toast.error(response.data.message || "Login failed")
      }
    } catch (error) {
      console.error("Login error:", error)
      if (error.response) {
        toast.error(error.response.data.message || "Login failed")
      } else if (error.request) {
        toast.error("Cannot connect to server. Please check if backend is running.")
      } else {
        toast.error("Login failed. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-brand">
            <img src={assets.logo} alt="OrderUP logo" className="login-logo" />
          </div>
          <h1>Admin Panel</h1>
          <p>Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter Your Email"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Your Password"
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
