import React, { useEffect, useState } from 'react';
import './Dashboard.css';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { assets } from '../../assets/assets';

const orderTypes = ["Dine In", "Pick Up", "Pre-Order", "Delivery"];

const Dashboard = ({ url }) => {
    const [orders, setOrders] = useState([]);
    const [filterType, setFilterType] = useState("Today's");
    const [dateFilter, setDateFilter] = useState(() => {
        const now = new Date();
        return now.toISOString().slice(0, 10);
    });
    const [expiringItems, setExpiringItems] = useState([]);
    const [itemStatsByType, setItemStatsByType] = useState({});

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const getDaysUntilExpiry = (expiryDate) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDate);
        expiry.setHours(0, 0, 0, 0);
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Fetch Orders with token
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const token = sessionStorage.getItem("token");
                const res = await axios.get(url + "/api/order/list", {
                    headers: { token }
                });
                if (res.data.success) {
                    setOrders(res.data.data);
                    const stats = {};
                    orderTypes.forEach(type => stats[type] = {});
                    res.data.data.forEach(order => {
                        const type = order.orderType || "Other";
                        if (!stats[type]) {
                            stats[type] = {};
                        }
                        order.items.forEach(item => {
                            if (!stats[type][item.name]) {
                                stats[type][item.name] = { count: 0, image: item.image };
                            }
                            stats[type][item.name].count += item.quantity;
                        });
                    });
                    const formattedStats = {};
                    Object.entries(stats).forEach(([type, items]) => {
                        formattedStats[type] = Object.entries(items).map(([name, data]) => ({
                            name,
                            count: data.count,
                            image: data.image
                        }));
                    });
                    setItemStatsByType(formattedStats);
                }
            } catch (error) {
                console.log("Error fetching orders:", error);
            }
        };
        fetchOrders();
    }, [url]);

    // Fetch Expiring Items from Inventory (same as Inventory page)
    useEffect(() => {
        const fetchExpiringItems = async () => {
            try {
                const token = sessionStorage.getItem("token");
                const res = await axios.get(url + "/api/inventory/expiring-soon", {
                    headers: { token }
                });
                if (res.data.success) {
                    console.log("Expiring items:", res.data.data);
                    setExpiringItems(res.data.data);
                } else {
                    console.log("No expiring items or error:", res.data.message);
                    setExpiringItems([]);
                }
            } catch (error) {
                console.log("Error fetching expiring items:", error);
                setExpiringItems([]);
            }
        };
        fetchExpiringItems();
    }, [url]);

    const filterOrdersByRange = (orders, selectedDate, type) => {
        // Normalize type to lowercase
        const normalizedType = type.toLowerCase().replace("'s", "").trim();
        
        if (normalizedType === "all") return orders;

        const selected = new Date(selectedDate + 'T00:00:00');

        return orders.filter(order => {
            const orderDate = new Date(order.date);

            switch (normalizedType) {
                case "today":
                case "day": {
                    const orderDay = orderDate.getFullYear() + '-' + 
                                    String(orderDate.getMonth() + 1).padStart(2, '0') + '-' + 
                                    String(orderDate.getDate()).padStart(2, '0');
                    return orderDay === selectedDate;
                }

                case "week": {
                    const dayOfWeek = selected.getDay();
                    const daysSinceMonday = (dayOfWeek + 6) % 7;
                    const startOfWeek = new Date(selected);
                    startOfWeek.setDate(selected.getDate() - daysSinceMonday);
                    startOfWeek.setHours(0, 0, 0, 0);

                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 6);
                    endOfWeek.setHours(23, 59, 59, 999);

                    return orderDate >= startOfWeek && orderDate <= endOfWeek;
                }

                case "month": {
                    return orderDate.getFullYear() === selected.getFullYear() && 
                           orderDate.getMonth() === selected.getMonth();
                }

                case "year": {
                    return orderDate.getFullYear() === selected.getFullYear();
                }

                default:
                    return true;
            }
        });
    };

    const filteredOrders = filterOrdersByRange(orders, dateFilter, filterType);
    const totalSales = filteredOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const totalOrders = filteredOrders.length;
    const deliveredOrders = filteredOrders.filter(o => o.status === "Delivered").length;
    const avgOrderValue = totalOrders ? totalSales / totalOrders : 0;

    // Top Selling Items - Aggregate items by name to avoid duplicates
    const itemAggregation = {};
    Object.values(itemStatsByType).forEach(typeItems => {
        typeItems.forEach(item => {
            if (!itemAggregation[item.name]) {
                itemAggregation[item.name] = { name: item.name, count: 0, image: item.image };
            }
            itemAggregation[item.name].count += item.count;
        });
    });
    const allSellingData = Object.values(itemAggregation)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    // Sales by Food Category (Pie)
    const categoryCount = {};
    filteredOrders.forEach(order => {
        order.items.forEach(item => {
            const cat = item.category || "Other";
            categoryCount[cat] = (categoryCount[cat] || 0) + item.quantity;
        });
    });
    const pieData = Object.entries(categoryCount).map(([cat, count]) => ({
        name: cat,
        value: count
    }));
    const pieColors = ["#ff7043", "#ff6347", "#e85a4f", "#ffd966", "#ffab40"];

    // Peak Hours
    const hourCount = {};
    filteredOrders.forEach(order => {
        const hour = new Date(order.date).getHours();
        hourCount[hour] = (hourCount[hour] || 0) + 1;
    });
    const peakHours = Object.entries(hourCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    // Orders by Weekday
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekCount = {};
    weekdays.forEach(day => weekCount[day] = 0);
    filteredOrders.forEach(order => {
        const day = new Date(order.date).toLocaleString('en-US', { weekday: 'long' });
        weekCount[day] = (weekCount[day] || 0) + 1;
    });

    return (
        <div className="dashboard-main">
            <div className="dashboard-header">
                <h1>Dashboard</h1>
                <div className="dashboard-filters">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="filter-select"
                    >
                        <option value="Today's">Today</option>
                        <option value="Week">Weekly</option>
                        <option value="Month">Monthly</option>
                        <option value="Year">Yearly</option>
                        <option value="All">All</option>
                    </select>
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={e => setDateFilter(e.target.value)}
                        className="date-input"
                    />
                </div>
            </div>

            <div className="dashboard-grid">
                {/* Stats Cards */}
                <div className="dashboard-card stats-card">
                    <div className="card-icon">
                        <img src={assets.money} alt="Sales" />
                    </div>
                    <div className="card-content">
                        <h2>{formatCurrency(totalSales)}</h2>
                        <p>
                            {filterType === "all"
                                ? "All-Time Sales"
                                : `${filterType.charAt(0).toUpperCase() + filterType.slice(1)} Sales`}
                        </p>
                    </div>
                </div>

                <div className="dashboard-card stats-card">
                    <div className="card-icon">
                        <img src={assets.order_icon} alt="Orders" />
                    </div>
                    <div className="card-content">
                        <h2>{totalOrders}</h2>
                        <p>Total Orders</p>
                    </div>
                </div>

                <div className="dashboard-card stats-card">
                    <div className="card-icon">
                        <img src={assets.total_sales} alt="Revenue" />
                    </div>
                    <div className="card-content">
                        <h2>{deliveredOrders}</h2>
                        <p>Delivered Orders</p>
                    </div>
                </div>

                <div className="dashboard-card stats-card">
                    <div className="card-icon">
                        <img src={assets.average_sales} alt="Average" />
                    </div>
                    <div className="card-content">
                        <h2>{formatCurrency(avgOrderValue)}</h2>
                        <p>Avg. Order Value</p>
                    </div>
                </div>

                {/* Expiring Items Alert */}
                {expiringItems.length > 0 && (
                    <div className="dashboard-card expiring-card chart-wide">
                        <div className="card-header">
                            <h3>Items Expiring Soon ({expiringItems.length})</h3>
                        </div>
                        <div className="table-container">
                            <table className="dashboard-table expiring-table">
                                <thead>
                                    <tr>
                                        <th>Image</th>
                                        <th>Item Name</th>
                                      
                                        <th>Quantity</th>
                                        <th>Production Date</th>
                                        <th>Expiration Date</th>
                                        <th>Days Left</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expiringItems.map((item, index) => {
                                        const daysLeft = getDaysUntilExpiry(item.expirationDate);
                                        const isExpired = daysLeft < 0;
                                        const isCritical = daysLeft <= 1 && daysLeft >= 0;

                                        return (
                                            <tr key={index} className={isExpired ? 'expired-row' : isCritical ? 'critical-row' : ''}>
                                                <td>
                                                    <img 
                                                        src={item.image && item.image.startsWith('http') ? item.image : `${url}/uploads/items/${item.image}`} 
                                                        alt={item.name}
                                                        className="table-item-image"
                                                    />
                                                </td>
                                                <td className="item-name">{item.name}</td>
                                                <td className="quantity-cell">{item.quantity}</td>
                                                <td>{formatDate(item.productionDate)}</td>
                                                <td className="expiry-date">{formatDate(item.expirationDate)}</td>
                                                <td className={`days-left ${isExpired ? 'expired' : isCritical ? 'critical' : 'warning'}`}>
                                                    {isExpired ? 'EXPIRED' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''}`}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {expiringItems.length === 0 && (
                    <div className="dashboard-card success-card chart-wide">
                        <div className="card-header">
                            <h3>Inventory Status</h3>
                        </div>
                        <p className="no-data">No items expiring soon. Inventory is in good condition!</p>
                    </div>
                )}

                {/* Top Selling Items Chart */}
                <div className="dashboard-chart chart-wide">
                    <div className="chart-header">
                        <h3>Top Selling Items</h3>
                    </div>
                    <div className="chart-container">
                        {allSellingData && allSellingData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    data={allSellingData}
                                    layout="vertical"
                                    margin={{ left: 15, right: 20, top: 20, bottom: 20 }}
                                >
                                    <XAxis type="number" />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={150}
                                        tick={{ fontSize: 12, fill: "#333" }}
                                    />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#ff7043" barSize={25} radius={[5, 5, 5, 5]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="no-data">No data available for top selling items.</p>
                        )}
                    </div>
                </div>

                {/* Sales by Category */}
                <div className="dashboard-chart">
                    <div className="chart-header">
                        <h3>Sales by Category</h3>
                    </div>
                    <div className="chart-container">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                                        ))}
                                    </Pie>
                                    <Legend />
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="no-data">No sales data available.</p>
                        )}
                    </div>
                </div>

                {/* Peak Hours Table */}
                <div className="dashboard-card table-card">
                    <div className="card-header">
                        <h3>Peak Hours</h3>
                    </div>
                    <div className="table-container">
                        <table className="dashboard-table">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Orders</th>
                                </tr>
                            </thead>
                            <tbody>
                                {peakHours.length > 0 ? (
                                    peakHours.map(([hour, count]) => (
                                        <tr key={hour}>
                                            <td className="time-cell">{hour}:00</td>
                                            <td className="count-cell">{count}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="2" className="no-data">No data available</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Orders by Day Table */}
                <div className="dashboard-card table-card">
                    <div className="card-header">
                        <h3>Orders by Day</h3>
                    </div>
                    <div className="table-container">
                        <table className="dashboard-table">
                            <thead>
                                <tr>
                                    <th>Day</th>
                                    <th>Orders</th>
                                </tr>
                            </thead>
                            <tbody>
                                {weekdays.map(day => (
                                    <tr key={day}>
                                        <td className="day-cell">{day}</td>
                                        <td className="count-cell">{weekCount[day]}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;