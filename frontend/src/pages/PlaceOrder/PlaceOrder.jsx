import React, { useContext, useEffect, useState } from 'react'
import './PlaceOrder.css'
import { StoreContext } from '../../context/StoreContext'
import axios from 'axios'
import { useNavigate, useLocation } from 'react-router-dom'
import { assets } from '../../assets/assets';
import { toast } from 'react-toastify';

const orderTypes = ["Pick Up", "Pre-Order", "Delivery"];
const formatCurrency = (amount) => `₱${amount.toFixed(2)}`;

const PlaceOrder = () => {
  const { getTotalCartAmount, token, food_list, cartItems, url } = useContext(StoreContext)
  const navigate = useNavigate();
  const location = useLocation();
  
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [showGcash, setShowGcash] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState(null);
  
  const [data, setData] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
    orderType: orderTypes[0],
    reservationDate: "",
    reservationTime: "",
    partySize: ""
  });

  // Prefill user details from profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;
      try {
        const res = await axios.get(url + "/api/user/profile", { headers: { token } });
        if (res.data?.success && res.data.user) {
          const { name, email, phone, address } = res.data.user;
          setData(prev => ({
            ...prev,
            name: name || prev.name,
            email: email || prev.email,
            phone: phone || prev.phone,
            address: address || prev.address
          }));
        }
      } catch (err) {
        console.error("profile fetch failed", err);
      }
    };

    fetchProfile();
  }, [token, url]);

  // Get promo code from location state
  useEffect(() => {
    if (location.state?.appliedPromo) {
      setAppliedPromo(location.state.appliedPromo);
    }
  }, [location]);

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData(data => ({ ...data, [name]: value }))
  }

  const getOrderItems = () => {
    let orderItems = [];
    food_list.forEach((item) => {
      if (cartItems[item._id] > 0) {
        let itemInfo = { ...item };
        itemInfo["quantity"] = cartItems[item._id];
        orderItems.push(itemInfo)
      }
    });
    return orderItems;
  }

  const placeOrder = async (event) => {
    event.preventDefault();
    
    const orderItems = getOrderItems();
    const userId = localStorage.getItem("userId");
    
    if (!userId) {
      toast.error("User ID not found. Please login again.");
      return;
    }
    
    // Calculate final amount with promo discount
    const subtotal = getTotalCartAmount();
    const discount = appliedPromo ? appliedPromo.discount : 0;
    const finalAmount = subtotal - discount;
    
      const addressPayload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        reservationDate: data.reservationDate,
        reservationTime: data.reservationTime,
        partySize: data.partySize
      }

      let orderData = {
        userId,
        address: addressPayload,
        items: orderItems,
        amount: finalAmount,
        subtotal: subtotal,
        discount: discount,
        promoCode: appliedPromo?.code || null,
        orderType: data.orderType,
        paymentMethod
      };

    try {
      if (paymentMethod === "Cash") {
        let response = await axios.post(url + "/api/order/place", orderData, { headers: { token } });
        if (response.data.success) {
          toast.success("Order placed successfully!");
          window.location.replace("/myorders");
        } else {
          toast.error("Error placing order: " + response.data.message);
        }
      } else if (paymentMethod === "Gcash") {
        setShowGcash(true);
      } else if (paymentMethod === "Card") {
        let response = await axios.post(url + "/api/order/place", orderData, { headers: { token } });
        if (response.data.success) {
          const { session_url } = response.data;
          window.location.replace(session_url); 
        } else {
          toast.error("Error: " + response.data.message);
        }
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Error placing order: " + (error.response?.data?.message || error.message));
    }
  }

  useEffect(() => {
    if (!token) {
      navigate('/cart')
    }
    else if (getTotalCartAmount() === 0) {
      navigate('/cart')
    }
  }, [token, navigate])

  const subtotal = getTotalCartAmount();
  const discount = appliedPromo ? appliedPromo.discount : 0;
  const total = subtotal - discount;

  return (
    <>
      <form onSubmit={placeOrder} className="place-order">
        <div className="place-order-left">
          <p className="title">Order Type</p>
          <div className="order-type-radio-group">
            {orderTypes.map(type => (
              <label key={type} className={`order-type-radio${data.orderType === type ? " selected" : ""}`}>
                <input
                  type="radio"
                  name="orderType"
                  value={type}
                  checked={data.orderType === type}
                  onChange={onChangeHandler}
                />
                {type}
              </label>
            ))}
          </div>

          {data.orderType === "Pre-Order" && (
            <div className="reservation-fields">
              <input
                required
                name='reservationDate'
                type="date"
                value={data.reservationDate}
                onChange={onChangeHandler}
              />
              <input
                required
                name='reservationTime'
                type="time"
                value={data.reservationTime}
                onChange={onChangeHandler}
              />
              <input
                required
                name='partySize'
                type="number"
                min={1}
                value={data.partySize}
                onChange={onChangeHandler}
                placeholder='# of Guests'
              />
            </div>
          )}

          {data.orderType === "Delivery" && (
            <>
              <p className="title">Delivery Information</p>
              <input
                required
                name='name'
                onChange={onChangeHandler}
                value={data.name}
                type="text"
                placeholder='Name'
              />
              <input required name='email' onChange={onChangeHandler} value={data.email} type="email" placeholder='Email Address' />
              <textarea
                required
                name='address'
                onChange={onChangeHandler}
                value={data.address}
                placeholder='Complete Address'
                rows={3}
              />
              <input required name='phone' onChange={onChangeHandler} value={data.phone} type="text" placeholder='Phone Number' />
            </>
          )}

          {data.orderType === "Pick Up" && (
            <>
              <p className="title">Contact Information</p>
              <input
                required
                name='name'
                onChange={onChangeHandler}
                value={data.name}
                type="text"
                placeholder='Name'
              />
              <input
                required
                name='phone'
                onChange={onChangeHandler}
                value={data.phone}
                type="text"
                placeholder='Phone Number'
              />
            </>
          )}
        </div>

        <div className="place-order-right">
          <div className="cart-total">
            <h2>Cart Totals</h2>
            <div className="cart-total-details">
              <p>Subtotal</p>
              <p>{formatCurrency(subtotal)}</p>
            </div>
            {appliedPromo && (
              <div className="cart-total-details promo-applied">
                <p>
                  Discount ({appliedPromo.code})
                </p>
                <p className="discount-amount">-{formatCurrency(discount)}</p>
              </div>
            )}
            <hr />
            <div className="cart-total-details">
              <b>Total</b>
              <b>{formatCurrency(total)}</b>
            </div>
            <div className="payment-method-section">
              <label>Payment Method:</label>
              <div className="payment-method-options">
                {["Cash", "Gcash"].map(method => (
                  <label key={method} className={`payment-radio${paymentMethod === method ? " selected" : ""}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={e => setPaymentMethod(e.target.value)}
                    />
                    {method}
                  </label>
                ))}
              </div>
            </div>
            <button type='submit'>Proceed to Payment</button>
          </div>
        </div>
      </form>

      {showGcash && (
        <div className="gcash-modal" onClick={() => setShowGcash(false)}>
          <div className="gcash-modal-content" onClick={e => e.stopPropagation()}>
            <div className="gcash-modal-header">
              <h3>GCash Payment</h3>
              <button
                className="gcash-close-btn"
                onClick={() => setShowGcash(false)}
                aria-label="Close"
                type="button"
              >
                ×
              </button>
            </div>

            <div className="gcash-qr-container">
              <img
                src={assets.gcash_qr}
                alt="Gcash QR Code"
                className="gcash-qr-image"
              />
            </div>

            <p className="gcash-instruction">Scan the QR code above to pay with GCash</p>

            <div className="gcash-amount">
              <span>Amount to pay: </span>
              <strong>{formatCurrency(total)}</strong>
            </div>

            <div className="gcash-modal-actions">
              <button
                className="gcash-confirm-btn"
                type="button"
                onClick={async () => {
                  const userId = localStorage.getItem("userId");
                  if (!userId) {
                    toast.error("User ID not found. Please login again.");
                    return;
                  }

                  const orderItems = getOrderItems();
                    const addressPayload = {
                      name: data.name,
                      email: data.email,
                      phone: data.phone,
                      address: data.address,
                      reservationDate: data.reservationDate,
                      reservationTime: data.reservationTime,
                      partySize: data.partySize
                    }

                    let orderData = {
                      userId,
                      address: addressPayload,
                      items: orderItems,
                      amount: total,
                      subtotal: subtotal,
                      discount: discount,
                      promoCode: appliedPromo?.code || null,
                      orderType: data.orderType,
                      paymentMethod: "Gcash"
                    };

                  try {
                    let response = await axios.post(url + "/api/order/place", orderData, { headers: { token } });
                    if (response.data.success) {
                      setShowGcash(false);
                      toast.success("Order placed successfully!");
                      window.location.replace("/myorders");
                    } else {
                      toast.error("Error placing order: " + response.data.message);
                    }
                  } catch (error) {
                    console.error("Error:", error);
                    toast.error("Error placing order: " + (error.response?.data?.message || error.message));
                  }
                }}
              >
                Confirm Payment
              </button>
              <button
                className="gcash-cancel-btn"
                type="button"
                onClick={() => setShowGcash(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default PlaceOrder