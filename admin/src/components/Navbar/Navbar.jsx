import React from 'react'
import './Navbar.css'
import { toast } from 'react-toastify'
import { assets } from '../../assets/assets'

const Navbar = ({ setToken, setUserRole, isCollapsed, setIsCollapsed }) => {
  const handleLogout = () => {
    sessionStorage.removeItem("token")
    sessionStorage.removeItem("userRole")
    sessionStorage.removeItem("userType")
    
    setToken("")
    setUserRole("")
    
    toast.success("Logged out successfully!")
    
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  const userRole = localStorage.getItem("userRole") || "admin"

  return (
    <div className="navbar">
      <div className="navbar-left">
        <button className="menu-toggle" onClick={toggleSidebar}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <div className="navbar-logo">
          <img src={assets.logo} alt="OrderUP logo" className="navbar-logo-img" />
          <span className="navbar-title">OrderUP Admin</span>
        </div>
      </div>
      
      <div className="navbar-right">
        <div className="user-info">
          <p className="user-role">
            {userRole === "superadmin" ? "Super Admin" : userRole === "admin" ? "Admin" : "Staff"}
          </p>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export default Navbar