import React, { useContext, useState, useEffect } from 'react'
import './NavBar.css'
import { assets } from '../../assets/assets'
import { Link, useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import Search from '../Search/Search';
import Notifications from '../Notifications/Notifications';
import axios from 'axios';

const NavBar = ({ setShowLogin, showLogin }) => {
  const [menu, setMenu] = useState("home");
  const [restaurantLogo, setRestaurantLogo] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userName, setUserName] = useState("");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const { getTotalCartAmount, token, setToken, cartItems, url } = useContext(StoreContext)
  const navigate = useNavigate();

  const getBrandingUrl = (apiUrl, img) => {
    if (!img) return null;
    return img.startsWith('http') ? img : null;
  }

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);

    // Fetch logo from backend settings
    const fetchLogo = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
        const res = await fetch(apiUrl + "/api/settings/");
        const data = await res.json();
        if (data.success && data.data.logo) {
          const logoUrl = getBrandingUrl(apiUrl, data.data.logo);
          console.log("Logo URL:", logoUrl);
          setRestaurantLogo(logoUrl);
        } else {
          setRestaurantLogo(assets.logo);
        }
      } catch (e) {
        console.error("Error fetching logo:", e);
        setRestaurantLogo(assets.logo);
      }
    };
    fetchLogo();

    // Fetch user data from database
    const fetchUserData = async () => {
      const userId = localStorage.getItem("userId");
      const storedToken = localStorage.getItem("token");
      
      if (userId && storedToken) {
        try {
          const response = await axios.get(`${url}/api/user/${userId}`, {
            headers: { token: storedToken }
          });
          if (response.data.success) {
            setUserName(response.data.data.name);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    if (token) {
      fetchUserData();
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, [token, url]);

  // Fetch unread notifications count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      const userId = localStorage.getItem("userId");
      const storedToken = localStorage.getItem("token");

      if (userId && storedToken) {
        try {
          const response = await axios.get(`${url}/api/notifications/${userId}/unread-count`, {
            headers: { token: storedToken }
          });
          if (response.data.success) {
            setUnreadCount(response.data.count);
          }
        } catch (error) {
          console.error("Error fetching unread count:", error);
        }
      }
    };

    if (token) {
      fetchUnreadCount();
      // Refresh every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [token, url]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest('.navbar-profile')) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showProfileDropdown]);

  const logout = () => {
    sessionStorage.removeItem("token")
    sessionStorage.removeItem("userId")
    sessionStorage.removeItem("userName")
    sessionStorage.removeItem("userType")
    sessionStorage.removeItem("userRole")
    setToken("")
    setUserName("")
    setShowProfileDropdown(false)
    navigate("/")
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  }

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  const handleHomeClick = () => {
    setMenu("home");
    closeMobileMenu();
    scrollToTop();
  }

  const getCartItemCount = () => {
    if (!cartItems) return 0;

    const itemCount = Object.keys(cartItems).filter(key => cartItems[key] > 0).length;

    console.log("Cart items from context:", cartItems);
    console.log("Item count:", itemCount);
    console.log("Total amount:", getTotalCartAmount());

    return itemCount;
  };

  const toggleProfileDropdown = (e) => {
    // stop propagation so the document click handler doesn't immediately close it
    if (e && e.stopPropagation) e.stopPropagation();
    setShowProfileDropdown(!showProfileDropdown);
  };

  const cartItemCount = getCartItemCount();

  return (
    <>
      {!showLogin && (
        <div className={`navbar ${scrolled ? 'scrolled' : ''}`}> 
        <Link to='/' onClick={handleHomeClick} className="navbar-brand">
          <img
            src={restaurantLogo || assets.logo}
            alt="Restaurant Logo"
            className='logo restaurant-logo'
          />
          
         <span className="x-orderup-logo">
  <span className="x-separator">X</span>
  <img src={assets.logo} alt="OrderUP" className="orderup-logo" />
</span>
        </Link>
        <ul className={`navbar-menu ${mobileMenuOpen ? 'active' : ''}`}> 
          <Link
            to='/'
            onClick={handleHomeClick}
            className={menu === "home" ? "active" : ""}
          >
            home
          </Link>
          <a
            href='#explore-menu'
            onClick={() => { setMenu("menu"); closeMobileMenu(); }}
            className={menu === "menu" ? "active" : ""}
          >
            menu
          </a>
          <a
            href='#footer'
            onClick={() => { setMenu("contact-us"); closeMobileMenu(); }}
            className={menu === "contact-us" ? "active" : ""}
          >
            contact us
          </a>
        </ul>

        <div className="navbar-right">
          <div className="navbar-search-icon" onClick={() => setShowSearch(true)}>
            <img src={assets.search_icon} alt="Search" />
          </div>

          {token && (
            <div className="navbar-notification-icon" onClick={() => setShowNotifications(true)}>
              <img src={assets.notification_icon} alt="Notifications" />
              {unreadCount > 0 && (
                <div className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</div>
              )}
            </div>
          )}

          <Link to='/cart' onClick={closeMobileMenu} className="navbar-cart-icon">
            <img src={assets.basket_icon} alt="Cart" />
            {cartItemCount > 0 && (
              <div className="dot">{cartItemCount}</div>
            )}
          </Link>

          {!token ? (
            <button onClick={() => setShowLogin(true)}>sign in</button>
          ) : (
            <div className='navbar-profile'>
              {/* Clickable avatar (keyboard accessible) */}
              <div
                className="profile-info"
                onClick={toggleProfileDropdown}
                role="button"
                tabIndex={0}
                aria-expanded={showProfileDropdown}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleProfileDropdown(e);
                  }
                }}
              >
                <img src={assets.profile_icon} alt="Profile" />
              </div>

              {/* Username appears below the avatar and also toggles dropdown when clicked */}
              {userName && (
                <div
                  className="profile-name-below"
                  onClick={toggleProfileDropdown}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleProfileDropdown(e);
                    }
                  }}
                >
                  {userName}
                </div>
              )}

              {/* Dropdown visibility is controlled by showProfileDropdown (inline style overrides any :hover rules) */}
              <ul
                className={`nav-profile-dropdown ${showProfileDropdown ? 'show' : ''}`}
                style={{ display: showProfileDropdown ? 'block' : 'none' }}
              > 
                <li onClick={(e) => { e.stopPropagation(); navigate('/profile'); closeMobileMenu(); setShowProfileDropdown(false); }}>  
                  <img src={assets.profile_icon} alt="Profile" />
                  <p>Profile</p>
                </li>
                <hr />
                <li onClick={(e) => { e.stopPropagation(); navigate('/myorders'); closeMobileMenu(); setShowProfileDropdown(false); }}>  
                  <img src={assets.basket_icon} alt="Orders" />
                  <p>Orders</p>
                </li>
                <hr />
                <li onClick={(e) => { e.stopPropagation(); logout(); }}>
                  <img src={assets.logout_icon} alt="Logout" />
                  <p>Logout</p>
                </li>
              </ul>
            </div>
          )}

          <div
            className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
            onClick={toggleMobileMenu}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
      )}
      {showSearch && <Search onClose={() => setShowSearch(false)} />}
      {showNotifications && <Notifications onClose={() => setShowNotifications(false)} />}
    </>
  )
}

export default NavBar
