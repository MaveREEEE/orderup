import React from 'react'
import './Navbar.css'
import { toast } from 'react-toastify'

const Navbar = ({ setToken, setUserRole, isCollapsed, setIsCollapsed }) => {
  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("userRole")
    localStorage.removeItem("userType")
    
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
          ☰
        </button>
        <div className="navbar-logo">
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