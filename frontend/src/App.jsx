import React, { useState, useEffect } from 'react'
import NavBar from './components/NavBar/NavBar'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home/Home'
import Cart from './pages/Cart/Cart'
import PlaceOrder from './pages/PlaceOrder/PlaceOrder'
import Footer from './components/Footer/Footer'
import LoginPopUp from './components/LoginPopUp/LoginPopUp'
import Verify from './pages/Verify/Verify'
import MyOrders from './pages/MyOrders/MyOrders'
import ScrollToTop from './components/ScrollToTop/ScrollToTop'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { applyTheme, applyStoredTheme } from './utils/themeUtils'

const App = () => {
  const [showLogin, setShowLogin] = useState(false)
  const url = import.meta.env.VITE_API_URL || "http://localhost:4000"

  // Apply theme on load
  useEffect(() => {
    applyStoredTheme(); // Apply cached theme immediately
    applyTheme(url); // Fetch fresh theme from backend
  }, [])

  return (
    <>
      {showLogin ? <LoginPopUp setShowLogin={setShowLogin} /> : <></>}
      <div className="app">
        <NavBar setShowLogin={setShowLogin} showLogin={showLogin} />
        <Routes>
          <Route path='/' element={<Home showLogin={showLogin} />} />
          <Route path='/cart' element={<Cart />} />
          <Route path='/order' element={<PlaceOrder />} />
          <Route path='/verify' element={<Verify />} />
          <Route path='/myorders' element={<MyOrders />} />
        </Routes>
      </div>
      <Footer />
      <ScrollToTop/>
      <ToastContainer />
    </>
  )
}

export default App