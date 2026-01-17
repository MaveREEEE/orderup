import React, { useContext, useEffect, useState } from 'react'
import './MyOrders.css'
import { StoreContext } from '../../context/StoreContext';
import axios from 'axios';
import { assets } from '../../assets/assets';

const MyOrders = () => {
    const { url, token, userId } = useContext(StoreContext);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [userRatings, setUserRatings] = useState({});
    const [ratingStates, setRatingStates] = useState({});

    const fetchOrders = async () => {
        if (!userId || !token) {
            console.error("userId or token missing");
            return;
        }
        
        try {
            setLoading(true);
            const response = await axios.post(
                url + "/api/order/userorders",
                { userId },
                { headers: { token } }
            );
            if (response.data.success) {
                setData(response.data.data || []);
                
                // Fetch ratings for all items in orders
                const ratings = {};
                const items = [];
                response.data.data?.forEach(order => {
                    order.items?.forEach(item => {
                        items.push({ id: item._id, orderId: order._id });
                    });
                });

                // Fetch each food item to check ratings
                for (let item of items) {
                    try {
                        const foodResponse = await axios.get(
                            url + `/api/food/${item.id}`
                        );
                        if (foodResponse.data.success && foodResponse.data.data.ratings) {
                            const userRating = foodResponse.data.data.ratings.find(
                                r => r.userId === userId && r.orderId === item.orderId
                            );
                            if (userRating) {
                                ratings[`${item.id}-${item.orderId}`] = userRating.rating;
                            }
                        }
                    } catch (error) {
                        console.error("Error fetching food ratings:", error);
                    }
                }
                setUserRatings(ratings);
            } else {
                console.error("Error:", response.data.message);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (token && userId) {
            fetchOrders();
            
            const interval = setInterval(() => {
                fetchOrders();
            }, 30000);
            
            return () => clearInterval(interval);
        }
    }, [token, userId])

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const openModal = (order) => {
        setSelectedOrder(order)
        setShowModal(true)
        // Initialize rating form states for this order
        const states = {};
        order.items?.forEach(item => {
            states[item._id] = {
                showForm: false,
                selectedRating: 0,
                comment: "",
                hoverRating: 0
            };
        });
        setRatingStates(states);
    }

    const closeModal = () => {
        setShowModal(false)
        setSelectedOrder(null)
        setRatingStates({})
    }

    const handleRating = async (foodId, orderId, rating, comment = "") => {
        try {
            const response = await axios.post(
                url + "/api/food/rate",
                {
                    foodId,
                    userId,
                    orderId,
                    rating,
                    comment
                },
                { headers: { token } }
            );

            if (response.data.success) {
                // Mark item as rated
                setUserRatings(prev => ({
                    ...prev,
                    [`${foodId}-${orderId}`]: rating
                }));
                
                // Reset form
                setRatingStates(prev => ({
                    ...prev,
                    [foodId]: {
                        showForm: false,
                        selectedRating: 0,
                        comment: "",
                        hoverRating: 0
                    }
                }));
                
                alert("Rating submitted successfully!");
            } else {
                alert(response.data.message);
            }
        } catch (error) {
            console.error("Error submitting rating:", error);
            alert("Error submitting rating: " + error.message);
        }
    }

    const toggleRatingForm = (foodId) => {
        setRatingStates(prev => ({
            ...prev,
            [foodId]: {
                ...prev[foodId],
                showForm: !prev[foodId]?.showForm
            }
        }));
    }

    const updateRatingState = (foodId, key, value) => {
        setRatingStates(prev => ({
            ...prev,
            [foodId]: {
                ...prev[foodId],
                [key]: value
            }
        }));
    }

    return (
        <div className='my-orders'>
            <h2>My Orders</h2>
            
            {loading && data.length === 0 ? (
                <p className="loading-message">Loading orders...</p>
            ) : data.length === 0 ? (
                <p className="no-orders-message">No orders found</p>
            ) : (
                <div className="orders-table-wrapper">
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>Order Date</th>
                                <th>Order ID</th>
                                <th>Items</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((order) => {
                                const firstItem = order.items[0];
                                const remainingCount = order.items.length - 1;
                                
                                return (
                                    <tr key={order._id}>
                                        <td className="date-cell">{formatDate(order.date)}</td>
                                        <td className="order-id-cell">{order._id.slice(-6)}</td>
                                        <td className="items-cell">
                                            <div className="items-preview">
                                                <img 
                                                    src={firstItem.image}
                                                    alt={firstItem.name}
                                                    className="item-thumbnail"
                                                />
                                                <div className="items-info">
                                                    <span className="item-name">{firstItem.name}</span>
                                                    {remainingCount > 0 && (
                                                        <span className="more-items">
                                                            +{remainingCount} more {remainingCount === 1 ? 'item' : 'items'}
                                                        </span>
                                                    )}
                                                    <button 
                                                        className="view-all-btn"
                                                        onClick={() => openModal(order)}
                                                    >
                                                        View All
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="amount-cell">₱{Number(order.amount).toFixed(2)}</td>
                                        <td>
                                            <span className={`status-badge ${order.status.toLowerCase().replace(/\s+/g,'-')}`}>
                                                <span className="status-dot">●</span>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Order Details Modal */}
            {showModal && selectedOrder && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Ordered Items</h2>
                            <button className="modal-close" onClick={closeModal}>&times;</button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="items-section">
                                <div className="items-list">
                                    {selectedOrder.items.map((item, index) => {
                                        const isRated = userRatings[`${item._id}-${selectedOrder._id}`];
                                        const state = ratingStates[item._id] || { showForm: false, selectedRating: 0, comment: "", hoverRating: 0 };

                                        return (
                                            <div key={index} className="item-card">
                                                <img 
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="item-image"
                                                />
                                                <div className="item-details">
                                                    <h4 className="item-name">{item.name}</h4>
                                                    <p className="item-category">{item.category}</p>
                                                    <div className="item-price-qty">
                                                        <span className="item-price">₱{Number(item.price).toFixed(2)}</span>
                                                        <span className="item-qty">Qty: {item.quantity}</span>
                                                    </div>
                                                    <div className="item-total">
                                                        Total: ₱{(Number(item.price) * item.quantity).toFixed(2)}
                                                    </div>

                                                    {/* Rating Section */}
                                                    <div className="rating-section">
                                                        {isRated ? (
                                                            <span className="rated-label">✓ Rated ({isRated}★)</span>
                                                        ) : (
                                                            <>
                                                                {!state.showForm ? (
                                                                    <button 
                                                                        className="rate-btn"
                                                                        onClick={() => toggleRatingForm(item._id)}
                                                                    >
                                                                        Rate Item
                                                                    </button>
                                                                ) : (
                                                                    <div className="rating-form">
                                                                        <div className="stars">
                                                                            {[1, 2, 3, 4, 5].map(star => (
                                                                                <span
                                                                                    key={star}
                                                                                    className={`star ${star <= (state.hoverRating || state.selectedRating) ? 'filled' : ''}`}
                                                                                    onClick={() => updateRatingState(item._id, 'selectedRating', star)}
                                                                                    onMouseEnter={() => updateRatingState(item._id, 'hoverRating', star)}
                                                                                    onMouseLeave={() => updateRatingState(item._id, 'hoverRating', 0)}
                                                                                >
                                                                                    ★
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                        <textarea
                                                                            placeholder="Add a comment (optional)"
                                                                            value={state.comment}
                                                                            onChange={(e) => updateRatingState(item._id, 'comment', e.target.value)}
                                                                            className="rating-comment"
                                                                        />
                                                                        <div className="rating-buttons">
                                                                            <button
                                                                                className="submit-rating-btn"
                                                                                onClick={() => {
                                                                                    if (state.selectedRating > 0) {
                                                                                        handleRating(item._id, selectedOrder._id, state.selectedRating, state.comment);
                                                                                    } else {
                                                                                        alert("Please select a rating");
                                                                                    }
                                                                                }}
                                                                            >
                                                                                Submit
                                                                            </button>
                                                                            <button
                                                                                className="cancel-rating-btn"
                                                                                onClick={() => toggleRatingForm(item._id)}
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="order-summary">
                                <div className="summary-row total">
                                    <span>Grand Total:</span>
                                    <span>₱{Number(selectedOrder.amount).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default MyOrders