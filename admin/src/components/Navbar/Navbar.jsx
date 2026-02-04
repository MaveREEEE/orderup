import React, { useEffect, useState } from 'react'
import './Navbar.css'
import { toast } from 'react-toastify'
import { assets } from '../../assets/assets'

const Navbar = ({ setToken, setUserRole, isCollapsed, setIsCollapsed }) => {
  const [userRole, setLocalUserRole] = useState("")
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState("")

  // Fetch admin profile from MongoDB
  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const token = sessionStorage.getItem("token")
        
        if (!token) {
          setLoading(false)
          return
        }

        // Call the admin profile endpoint
        const response = await fetch('http://localhost:4000/api/admin/profile', {
          method: 'GET',
          headers: {
            'token': token,
            'Content-Type': 'application/json'
          }
        })

        const data = await response.json()

        if (data.success && data.admin) {
          setLocalUserRole(data.admin.role)
          setUserName(data.admin.name)
          // Update sessionStorage with fresh data from DB
          sessionStorage.setItem("userRole", data.admin.role)
          
          // Also update parent component state if needed
          if (setUserRole) {
            setUserRole(data.admin.role)
          }
        } else {
          console.error("Failed to fetch admin profile:", data.message)
          // Fallback to sessionStorage
          const storedRole = sessionStorage.getItem("userRole") || "admin"
          setLocalUserRole(storedRole)
        }
      } catch (error) {
        console.error("Error fetching admin profile:", error)
        // Fallback to sessionStorage if API fails
        const storedRole = sessionStorage.getItem("userRole") || "admin"
        setLocalUserRole(storedRole)
      } finally {
        setLoading(false)
      }
    }

    fetchAdminProfile()
  }, [setUserRole])

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
          {loading ? (
            <p className="user-role">Loading...</p>
          ) : (
            <>
              {userName && <p className="user-name">{userName}</p>}
              <p className="user-role">
                {userRole === "superadmin" ? "Super Admin" : userRole === "admin" ? "Admin" : "Staff"}
              </p>
            </>
          )}
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export default Navbar