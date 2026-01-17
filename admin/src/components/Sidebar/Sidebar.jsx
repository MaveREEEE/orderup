import React, { useEffect, useState } from 'react'
import './Sidebar.css'
import { assets } from '../../assets/assets'
import { NavLink, useLocation } from 'react-router-dom'

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
    const [isListMenuOpen, setIsListMenuOpen] = useState(false);
    const location = useLocation();

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
        // Close submenu when collapsing sidebar
        if (!isCollapsed) {
            setIsListMenuOpen(false);
        }
    };

    const toggleListMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Don't allow submenu toggle when sidebar is collapsed
        if (isCollapsed) {
            // Expand sidebar first
            setIsCollapsed(false);
            // Then open submenu
            setTimeout(() => {
                setIsListMenuOpen(true);
            }, 150);
        } else {
            setIsListMenuOpen(!isListMenuOpen);
        }
    };

    // Auto-open submenu if on a submenu page
    useEffect(() => {
        if (location.pathname === '/list' || location.pathname === '/category' || location.pathname === '/add') {
            setIsListMenuOpen(true);
            // Make sure sidebar is expanded when on submenu pages
            if (window.innerWidth > 768) {
                setIsCollapsed(false);
            }
        }
    }, [location.pathname, setIsCollapsed]);

    // Close sidebar on mobile when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (window.innerWidth <= 768 && !isCollapsed) {
                const sidebar = document.querySelector('.sidebar');
                const toggle = document.querySelector('.mobile-menu-btn');

                if (sidebar && !sidebar.contains(event.target) &&
                    toggle && !toggle.contains(event.target)) {
                    setIsCollapsed(true);
                    setIsListMenuOpen(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isCollapsed, setIsCollapsed]);

    // Handle responsive behavior
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 768) {
                setIsCollapsed(true);
                setIsListMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [setIsCollapsed]);

    const handleSubmenuClick = () => {
        // On mobile, close sidebar after clicking submenu item
        if (window.innerWidth <= 768) {
            setIsCollapsed(true);
            setIsListMenuOpen(false);
        }
    };

    const handleNavClick = () => {
        if (window.innerWidth <= 768) {
            setIsCollapsed(true);
        }
        setIsListMenuOpen(false);
    };

    return (
        <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <button
                className="sidebar-toggle"
                onClick={toggleSidebar}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                type="button"
            >
                <span className={`toggle-icon ${isCollapsed ? 'rotated' : ''}`}>
                    &#8250;
                </span>
            </button>

            <div className="sidebar-options">
                <NavLink
                    to='/dashboard'
                    className="sidebar-option"
                    data-tooltip="Dashboard"
                    onClick={handleNavClick}
                >
                    <img src={assets.dashboard} alt="Dashboard" />
                    <p>Dashboard</p>
                </NavLink>

                <NavLink
                    to='/dine-in'
                    className="sidebar-option"
                    data-tooltip="Dine In"
                    onClick={handleNavClick}
                >
                    <img src={assets.dine_in} alt="Dine-In" />
                    <p>Dine In</p>
                </NavLink>

                {/* List Items with Submenu */}
                <div className="sidebar-option-group">
                    <div
                        className={`sidebar-option has-submenu ${isListMenuOpen ? 'active' : ''}`}
                        onClick={toggleListMenu}
                        data-tooltip="Food List"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                toggleListMenu(e);
                            }
                        }}
                    >
                        <img src={assets.order_list} alt="Food List" />
                        <p>Food List</p>
                        <span className={`submenu-arrow ${isListMenuOpen ? 'open' : ''}`}>
                            &#8250;
                        </span>
                    </div>

                    {/* Submenu */}
                    <div className={`sidebar-submenu ${isListMenuOpen ? 'open' : ''}`}>
                        <NavLink
                            to='/list'
                            className="sidebar-submenu-option"
                            data-tooltip="All Items"
                            onClick={handleSubmenuClick}
                        >
                            <img src={assets.order_list} alt="All Items" className="submenu-icon" />
                            <p>All Items</p>
                        </NavLink>
                        <NavLink
                            to='/category'
                            className="sidebar-submenu-option"
                            data-tooltip="Categories"
                            onClick={handleSubmenuClick}
                        >
                            <img src={assets.add_icon} alt="Categories" className="submenu-icon" />
                            <p>Categories</p>
                        </NavLink>
                        <NavLink
                            to='/add'
                            className="sidebar-submenu-option"
                            data-tooltip="Add New Item"
                            onClick={handleSubmenuClick}
                        >
                            <img src={assets.add_icon} alt="Add New Item" className="submenu-icon" />
                            <p>Add New Item</p>
                        </NavLink>
                    </div>
                </div>

                <NavLink
                    to='/orders'
                    className="sidebar-option"
                    data-tooltip="Orders"
                    onClick={handleNavClick}
                >
                    <img src={assets.order_icon} alt="Orders" />
                    <p>Orders</p>
                </NavLink>
                <NavLink
                    to='/reviews'
                    className="sidebar-option"
                    data-tooltip="Reviews"
                    onClick={handleNavClick}
                >
                    <img src={assets.review_icon} alt="Reviews" />
                    <p>Reviews</p>
                </NavLink>
                <NavLink
                    to='/inventory'
                    className="sidebar-option"
                    data-tooltip="Inventory"
                    onClick={handleNavClick}
                >
                    <img src={assets.inventory_icon} alt="Inventory" />
                    <p>Inventory</p>
                </NavLink>
                <NavLink to='/promocode' className="sidebar-option">
                    <img src={assets.promo_icon} alt="" />
                    <p>Promo Codes</p>
                </NavLink>
                <NavLink
                    to='/report'
                    className="sidebar-option"
                    data-tooltip="Report"
                    onClick={handleNavClick}
                >
                    <img src={assets.report} alt="Report" />
                    <p>Report</p>
                </NavLink>
                <NavLink
                    to='/users'
                    className="sidebar-option"
                    data-tooltip="Users"
                    onClick={handleNavClick}
                >
                    <img src={assets.user} alt="Users" />
                    <p>Users</p>
                </NavLink>
                <NavLink
                    to='/settings'
                    className="sidebar-option"
                    data-tooltip="Settings"
                    onClick={handleNavClick}
                >
                    <img src={assets.settings} alt="Settings" />
                    <p>Settings</p>
                </NavLink>
            </div>
        </div>
    )
}

export default Sidebar