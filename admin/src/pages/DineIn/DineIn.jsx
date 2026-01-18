import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './DineIn.css';

const DineIn = ({ url, token }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [foods, setFoods] = useState([]);
  const [search, setSearch] = useState('');
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getImageUrl = (img) => {
    if (!img) return ''
    return img.startsWith('http') ? img : `${url}/uploads/items/${img}`
  }

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${url}/api/category/list`);
      if (res.data.success) {
        const sorted = [...(res.data.data || [])].sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        setCategories(sorted);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const fetchFoods = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${url}/api/food/list`);
      if (res.data.success) {
        setFoods(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load foods', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchFoods();
  }, [url]);

  const filteredFoods = useMemo(() => {
    const term = search.trim().toLowerCase();
    return foods.filter((item) => {
      // Hide items with no stock (calculate total from batches)
      const totalStock = item.batches?.reduce((sum, batch) => sum + batch.quantity, 0) || 0;
      if (totalStock === 0) return false;
      
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        !term ||
        item.name.toLowerCase().includes(term) ||
        (item.description || '').toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [foods, search, selectedCategory]);

  const handleQuantity = (id, delta) => {
    setQuantities((prev) => {
      const next = Math.max(0, (prev[id] || 0) + delta);
      return { ...prev, [id]: next };
    });
  };

  const handleQuantityInput = (id, value) => {
    const parsed = Number.isNaN(Number(value)) ? 0 : Math.max(0, Number(value));
    setQuantities((prev) => ({ ...prev, [id]: parsed }));
  };

  const orderItems = useMemo(
    () => foods.filter((f) => (quantities[f._id] || 0) > 0),
    [foods, quantities]
  );

  const orderTotal = orderItems.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (quantities[item._id] || 0),
    0
  );
const handleCheckout = async () => {
    if (!token) {
      toast.error('Please login to place a dine-in order.');
      return;
    }
    if (orderItems.length === 0) {
      toast.error('Add at least one item.');
      return;
    }
    if (!tableNumber.trim()) {
      toast.error('Enter a table number.');
      return;
    }

    const payload = {
      items: orderItems.map((item) => ({
        _id: item._id,
        name: item.name,
        description: item.description,
        price: item.price,
        image: item.image,
        category: item.category,
        quantity: quantities[item._id] || 0,
      })),
      amount: orderTotal,
      tableNumber: tableNumber.trim(),
      notes: notes.trim(),
      orderType: 'Dine In',
    };

    try {
      setSubmitting(true);
      const res = await axios.post(`${url}/api/order/dinein/place`, payload, {
        headers: { token },
      });
      if (res.data.success) {
        toast.success('Dine-in order saved');
        setQuantities({});
        setTableNumber('');
        setNotes('');
      } else {
        toast.error(res.data.message || 'Failed to save order');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dinein-page">
      <div className="dinein-header">
        <div>
          <h1>Dine-In Ordering</h1>
        </div>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search dishes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="category-row">
        <button
          className={selectedCategory === 'all' ? 'active' : ''}
          onClick={() => setSelectedCategory('all')}
          type="button"
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat._id}
            className={selectedCategory === cat.name ? 'active' : ''}
            onClick={() => setSelectedCategory(cat.name)}
            type="button"
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="dinein-layout">
        <div className="dinein-grid">
          {loading && <div className="muted">Loading menu…</div>}
          {!loading && filteredFoods.length === 0 && (
            <div className="muted">No dishes match your filters.</div>
          )}
          {!loading &&
            filteredFoods.map((item) => (
              <div className="food-card" key={item._id}>
                <div className="food-image">
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.name}
                    loading="lazy"
                  />
                </div>
                <div className="food-info">
                  <div className="food-top">
                    <h3>{item.name}</h3>
                    <span className="food-price">
                      ₱{Number(item.price || 0).toFixed(2)}
                    </span>
                  </div>
                  <p className="food-desc">{item.description || 'No description.'}</p>
                  <div className="food-meta">
                    <span className="pill">{item.category || 'Uncategorized'}</span>
                  </div>
                </div>
                <div className="qty-row">
                  <button
                    type="button"
                    onClick={() => handleQuantity(item._id, -1)}
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={quantities[item._id] || 0}
                    onChange={(e) => handleQuantityInput(item._id, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => handleQuantity(item._id, 1)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
        </div>

        <aside className="order-summary">
          <div className="summary-header">
            <h3>Current Order</h3>
            <span className="summary-count">
              {orderItems.length} item{orderItems.length !== 1 ? 's' : ''}
            </span>
          </div>
          {orderItems.length === 0 && (
            <p className="muted">No items yet. Add quantities to start an order.</p>
          )}
          {orderItems.length > 0 && (
            <div className="summary-list">
              {orderItems.map((item) => (
                <div className="summary-item" key={item._id}>
                  <div>
                    <p className="summary-name">{item.name}</p>
                    <p className="summary-meta">
                      ₱{Number(item.price || 0).toFixed(2)} ea
                    </p>
                  </div>
                  <div className="summary-qty">
                    <button
                      type="button"
                      onClick={() => handleQuantity(item._id, -1)}
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={quantities[item._id] || 0}
                      onChange={(e) => handleQuantityInput(item._id, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => handleQuantity(item._id, 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <div className="summary-line">
                    ₱{(
                      (Number(item.price) || 0) * (quantities[item._id] || 0)
                    ).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="summary-form">
            <label>
              Table #
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="e.g., 12"
              />
            </label>
            <label>
              Notes (optional)
              <textarea
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add instructions or guest name"
              />
            </label>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <strong>₱{orderTotal.toFixed(2)}</strong>
          </div>
          <button
            className="checkout-btn"
            type="button"
            disabled={
              submitting || orderItems.length === 0 || !tableNumber.trim()
            }
            onClick={handleCheckout}
          >
            {submitting ? 'Saving…' : 'Save Dine-In Order'}
          </button>
        </aside>
      </div>
    </div>
  );
};

export default DineIn;