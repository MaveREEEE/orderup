import React, { useEffect, useState } from 'react'
import './FoodItemModal.css'

const FoodItemModal = ({ item, items = [], onClose, onAddToCart, url, onItemClick }) => {
  if (!item) return null

  const [amount, setAmount] = useState(1)
  const [mlRecs, setMlRecs] = useState([])
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null

  const getImageUrl = (img) => {
    if (!img) return ''
    return img.startsWith('http') ? img : ''
  }

  useEffect(() => {
    if (!userId || !url) {
      setMlRecs([])
      return
    }

    const controller = new AbortController()

    const fetchRecs = async () => {
      try {
        const res = await fetch(`${url}/api/recommend/${encodeURIComponent(userId)}`, {
          signal: controller.signal
        })

        if (!res.ok) {
          setMlRecs([])
          return
        }

        const data = await res.json()
        setMlRecs(Array.isArray(data.recommendations) ? data.recommendations : [])
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('recommendations fetch failed', err)
        }
        setMlRecs([])
      }
    }

    fetchRecs()

    return () => controller.abort()
  }, [userId, url])

  const ratings = item.ratings || []
  const ratingCount = ratings.length
  const averageRating =
    item.averageRating ??
    (ratingCount
      ? Number((ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratingCount).toFixed(1))
      : null)

  const mlRecommendations = mlRecs
    .map(id => items.find(i => String(i._id ?? i.id ?? i.food_id) === String(id)))
    .filter(Boolean)
    .slice(0, 5)

  const fallbackRecommendations = items
    .filter(
      i =>
        i._id !== item._id &&
        i.category &&
        item.category &&
        i.category.trim().toLowerCase() === item.category.trim().toLowerCase()
    )
    .slice(0, 5)

  const recommendations = mlRecommendations.length ? mlRecommendations : fallbackRecommendations

  const renderStars = value => {
    const filled = Math.round(value || 0)
    return '★'.repeat(filled) + '☆'.repeat(5 - filled)
  }

  const formatReviewDate = dateStr => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>

        <div className="modal-image-wrapper">
          <img src={getImageUrl(item.image)} alt={item.name} className="modal-image" />
        </div>

        <h2 className="modal-name">{item.name}</h2>
        <p className="modal-desc">{item.description}</p>

        

        {item.allergens && item.allergens.length > 0 && (
          <div className="modal-allergens">
            <span className="allergen-label">⚠️ Allergens:</span>
            <div className="allergen-list">
              {item.allergens.map((allergen, index) => (
                <span key={index} className="allergen-item">{allergen}</span>
              ))}
            </div>
          </div>
        )}

        <div className="modal-price">₱{Number(item.price).toFixed(2)}</div>

        <div className="modal-quantity">
          <label>Quantity:</label>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
          />
        </div>

        <div className="modal-buttons">
          <button
            className="btn-add"
            onClick={() => {
              onAddToCart(item._id, amount)
              onClose()
            }}
          >
            Add to Cart - ₱{(item.price * amount).toFixed(2)}
          </button>
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
        </div>
<div className="modal-rating">
          <div className="rating-summary">
            <span className="rating-star">★</span>
            <span className="rating-score">{averageRating ? averageRating.toFixed(1) : '–'}</span>
            <span className="rating-count">
              {ratingCount} {ratingCount === 1 ? 'review' : 'reviews'}
            </span>
          </div>
          {ratingCount > 0 && (
            <div className="rating-list">
              {ratings.slice(0, 5).map((r, idx) => (
                <div key={idx} className="rating-row">
                  <div className="rating-row-header">
                    <span className="rating-stars">{renderStars(r.rating)}</span>
                    <span className="rating-date">{formatReviewDate(r.date)}</span>
                  </div>
                  {r.comment && <p className="rating-comment-text">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
        {recommendations.length > 0 && (
          <div className="modal-recommendations">
            <h3>You might also like</h3>
            <div className="rec-scroll">
              {recommendations.map(rec => (
                <div 
                  key={rec._id} 
                  className="rec-card"
                  onClick={() => onItemClick && onItemClick(rec)}
                  style={{ cursor: 'pointer' }}
                >
                  <img src={getImageUrl(rec.image)} alt={rec.name} />
                  <p className="rec-name">{rec.name}</p>
                  <p className="rec-price">₱{Number(rec.price).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FoodItemModal