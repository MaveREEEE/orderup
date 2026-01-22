import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'
import { Routes, Route } from 'react-router-dom'
import Add from './pages/Add/Add'
import List from './pages/List/List'
import Orders from './pages/Orders/Orders'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Dashboard from './pages/Dashboard/Dashboard'
import Category from './pages/Category/Category'
import Inventory from './pages/Inventory/Inventory'
import Report from './pages/Report/Report'
import Users from './pages/Users/Users'
import Settings from './pages/Settings/Settings'
import DineIn from './pages/DineIn/DineIn'
import Login from './pages/Login/Login'
import PromoCode from './pages/PromoCode/PromoCode'
import Reviews from './pages/Reviews/Reviews'
import { applyTheme, applyStoredTheme } from './utils/themeUtils'

const App = () => {

  const url = import.meta.env.VITE_API_URL || "http://localhost:4000"
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [userRole, setUserRole] = useState(localStorage.getItem("userRole") || "");
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Apply theme on load
  useEffect(() => {
    applyStoredTheme(); // Apply cached theme immediately
    applyTheme(url); // Fetch fresh theme from backend
  }, [url]);

  // If no token, show login
  if (!token) {
    return (
      <div>
        <ToastContainer />
        <Login url={url} setToken={setToken} setUserRole={setUserRole} />
      </div>
    )
  }
  
  return (
    <div>
      <ToastContainer />
      <Navbar 
        setToken={setToken}
        setUserRole={setUserRole}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      <hr />
      <div className="app-content">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} /> {/* Pass both props */}
        <div className={`main-content ${isCollapsed ? 'expanded' : ''}`}>
          <Routes>
            <Route path="/" element={<Dashboard url={url} token={token} />} />
            <Route path="/dashboard" element={<Dashboard url={url} token={token} />} />
            <Route path="/add" element={<Add url={url} token={token} />} />
            <Route path="/list" element={<List url={url} token={token} />} />
            <Route path="/category" element={<Category url={url} token={token} />} />
            <Route path="/orders" element={<Orders url={url} token={token} />} />
            <Route path="/reviews" element={<Reviews url={url} token={token} />} />
            <Route path="/inventory" element={<Inventory url={url} token={token} />} />
            <Route path="/report" element={<Report url={url} token={token} />} />
            <Route path="/users" element={<Users url={url} token={token} />} />
            <Route path="/settings" element={<Settings url={url} token={token} />} />
            <Route path="/dine-in" element={<DineIn url={url} token={token} />} />
            <Route path="/promocode" element={<PromoCode url={url} />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

export default App