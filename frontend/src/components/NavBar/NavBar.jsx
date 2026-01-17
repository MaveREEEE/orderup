import React, { useContext, useState, useEffect } from 'react'
import './NavBar.css'
import { assets } from '../../assets/assets'
import { Link, useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import Search from '../Search/Search';
import axios from 'axios';

const NavBar = ({ setShowLogin, showLogin }) => {
  const [menu, setMenu] = useState("home");
  const [restaurantLogo, setRestaurantLogo] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [userName, setUserName] = useState("");
  const { getTotalCartAmount, token, setToken, cartItems, url } = useContext(StoreContext)
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);

    // Fetch logo from backend settings
    const fetchLogo = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/settings/");
        const data = await res.json();
        if (data.success && data.data.logo) {
          const logoUrl = "http://localhost:4000/uploads/branding/" + data.data.logo;
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

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("userId")
    setToken("")
    setUserName("")
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

          <div className="navbar-cart-icon">
            <Link to='/cart' onClick={closeMobileMenu}>
              <img src={assets.basket_icon} alt="Cart" />
            </Link>
            {cartItemCount > 0 && (
              <div className="dot">{cartItemCount}</div>
            )}
          </div>

          {!token ? (
            <button onClick={() => setShowLogin(true)}>sign in</button>
          ) : (
            <div className='navbar-profile'>
              <div className="profile-info">
                <img src={assets.profile_icon} alt="Profile" />
                {userName && <span className="profile-name">{userName}</span>}
              </div>
              <ul className="nav-profile-dropdown">
                <li onClick={() => { navigate('/myorders'); closeMobileMenu(); }}>
                  <img src={assets.bag_icon} alt="Orders" />
                  <p>Orders</p>
                </li>
                <hr />
                <li onClick={logout}>
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
    </>
  )
}

export default NavBar