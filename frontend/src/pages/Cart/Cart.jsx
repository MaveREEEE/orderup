import React, { useContext, useEffect, useState } from 'react'
import './Cart.css'
import { StoreContext } from '../../context/StoreContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'

const Cart = () => {
  const { cartItems, food_list, removeFromCart, addToCart, getTotalCartAmount, url, token, userId, setCartItems } = useContext(StoreContext)
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const getImageUrl = (img) => {
    if (!img) return ''
    return img.startsWith('http') ? img : ''
  }

  // Fetch cart from database on component mount
  useEffect(() => {
    const fetchCartFromDB = async () => {
      if (userId && token) {
        try {
          const response = await axios.post(
            url + "/api/cart/get",
            { userId },
            { headers: { token } }
          );
          if (response.data.success) {
            setCartItems(response.data.cartData);
            console.log("Cart loaded from database:", response.data.cartData);
          }
        } catch (error) {
          console.error("Error loading cart from database:", error);
        }
      }
    };
    
    fetchCartFromDB();
  }, [userId, token, url, setCartItems]);

  const subtotal = getTotalCartAmount();
  const discount = appliedPromo ? appliedPromo.discount : 0;
  const total = subtotal - discount;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      toast.error("Please enter a promo code");
      return;
    }

    setIsApplyingPromo(true);

    try {
      const response = await axios.post(
        url + "/api/promo/apply",
        { 
          code: promoCode.trim(),
          orderAmount: subtotal
        },
        { headers: { token } }
      );

      if (response.data.success) {
        setAppliedPromo(response.data.data);
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
        setAppliedPromo(null);
      }
    } catch (error) {
      console.error("Error applying promo code:", error);
      toast.error("Failed to apply promo code");
      setAppliedPromo(null);
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    toast.info("Promo code removed");
  };

  const isCartEmpty = subtotal === 0;

  if (isCartEmpty) {
    return (
      <div className='cart'>
        <div className="empty-cart">
          <h2>Your cart is empty</h2>
          <p>Add some delicious items to get started!</p>
          <button onClick={() => navigate('/')}>Continue Shopping</button>
        </div>
      </div>
    );
  }

  return (
    <div className='cart'>
      <div className="cart-items">
        <div className="cart-items-title">
          <p>Items</p>
          <p>Title</p>
          <p>Price</p>
          <p>Quantity</p>
          <p>Total</p>
          <p>Remove</p>
        </div>
        <br />
        <hr />

        {food_list.map((item, index) => {
          if (cartItems[item._id] > 0) {
            return (
              <div key={item._id}>
                <div className="cart-items-title cart-items-item desktop-cart-item">
                  <img src={getImageUrl(item.image)} alt={item.name} />
                  <p>{item.name}</p>
                  <p>₱{item.price}</p>
                  <div className="cart-quantity-controls">
                    <button
                      className="cart-qty-btn"
                      onClick={() => removeFromCart(item._id)}
                      aria-label="Decrease quantity"
                    >-</button>
                    <span>{cartItems[item._id]}</span>
                    <button
                      className="cart-qty-btn"
                      onClick={() => addToCart(item._id, 1)}
                      aria-label="Increase quantity"
                    >+</button>
                  </div>
                  <p>₱{item.price * cartItems[item._id]}</p>
                  <button
                    onClick={() => removeFromCart(item._id, true)}
                    className='cross'
                    aria-label="Remove item"
                    title="Remove item"
                  >×</button>
                </div>

                <div className="mobile-cart-item">
                  <img src={getImageUrl(item.image)} alt={item.name} />

                  <div className="mobile-item-info">
                    <h3 className="mobile-item-name">{item.name}</h3>

                    <div className="mobile-price-row">
                      <span className="mobile-price-label">Unit Price:</span>
                      <span className="mobile-price-value">₱{item.price}</span>
                    </div>

                    <div className="mobile-quantity-row">
                      <span className="mobile-price-label">Quantity:</span>
                      <div className="cart-quantity-controls">
                        <button
                          className="cart-qty-btn"
                          onClick={() => removeFromCart(item._id)}
                          aria-label="Decrease quantity"
                        >-</button>
                        <span>{cartItems[item._id]}</span>
                        <button
                          className="cart-qty-btn"
                          onClick={() => addToCart(item._id, 1)}
                          aria-label="Increase quantity"
                        >+</button>
                      </div>
                    </div>

                    <div className="mobile-price-row mobile-total-row">
                      <span className="mobile-price-label">Total:</span>
                      <span className="mobile-price-value mobile-total-price">₱{item.price * cartItems[item._id]}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item._id, true)}
                    className='cross mobile-cross'
                    aria-label="Remove item"
                    title="Remove item"
                  >×</button>
                </div>

                <hr />
              </div>
            )
          }
        })}
      </div>

      <div className="cart-bottom">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div>
            <div className="cart-total-details">
              <p>Subtotal</p>
              <p>₱{subtotal.toFixed(2)}</p>
            </div>

            {appliedPromo && (
              <div className="cart-total-details promo-applied">
                <p>
                  Discount ({appliedPromo.code})
                  <button 
                    className="remove-promo-btn" 
                    onClick={handleRemovePromo}
                    title="Remove promo code"
                  >×</button>
                </p>
                <p className="discount-amount">-₱{discount.toFixed(2)}</p>
              </div>
            )}

            <hr />

            <div className="cart-total-details">
              <b>Total</b>
              <b>₱{total.toFixed(2)}</b>
            </div>
          </div>
          <button onClick={() => navigate('/order', { state: { appliedPromo } })}>
            Proceed to Checkout
          </button>
        </div>

        <div className="cart-promocode">
          <div>
            <p>If you have a promo code, Enter it here</p>
            <div className="cart-promocode-input">
              <input 
                type="text" 
                placeholder='promo code'
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                disabled={appliedPromo !== null}
              />
              <button 
                onClick={handleApplyPromo}
                disabled={isApplyingPromo || appliedPromo !== null}
              >
                {isApplyingPromo ? 'Applying...' : 'Submit'}
              </button>
            </div>
            {appliedPromo && (
              <p className="promo-success">
                ✓ {appliedPromo.code} applied! You saved ₱{discount.toFixed(2)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart