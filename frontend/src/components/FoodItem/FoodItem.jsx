import React from 'react'
import './FoodItem.css'

const FoodItem = ({
  name,
  price,
  description,
  image,
  batches = [],
  ratings = [],
  averageRating,
  onView,
  hideDescriptionOnMobile = false,
}) => {
  const getImageUrl = (img) => {
    if (!img) return ''
    return img.startsWith('http') ? img : ''
  }

  const totalStock = batches?.reduce((sum, batch) => sum + batch.quantity, 0) || 0
  const isOutOfStock = totalStock === 0

  const ratingCount = ratings?.length || 0
  const computedAvg = ratingCount
    ? ratings.reduce((sum, r) => sum + (r?.rating || 0), 0) / ratingCount
    : null
  const displayAvg = averageRating ?? computedAvg
  const formattedAvg = displayAvg ? Number(displayAvg).toFixed(1) : null

  return (
    <div
      className={`food-item ${isOutOfStock ? 'unavailable' : ''} ${!isOutOfStock && onView ? 'clickable' : ''}`}
      onClick={!isOutOfStock && onView ? () => onView() : undefined}
    >
      <div className="food-item-img-container">
        <img className="food-item-image" src={getImageUrl(image)} alt="" />
        {isOutOfStock && (
          <div className="unavailable-overlay">
            <span className="unavailable-text">UNAVAILABLE</span>
          </div>
        )}
        {formattedAvg && (
          <div className="item-rating item-rating-badge">
            <span className="item-rating-star">★</span>
            <span className="item-rating-value">{formattedAvg}</span>
            <span className="item-rating-count">({ratingCount})</span>
          </div>
        )}
        {totalStock <= 10 && totalStock > 0 && (
          <div className="low-stock-badge">
            {totalStock} left
          </div>
        )}
      </div>
      <div className="food-item-info">
        <div className="food-item-name-rating">
          <p className="food-item-name">{name}</p>
        </div>
        {/* Price directly below title */}
        <p className="food-item-price">
          {new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
          }).format(price)}
        </p>
        {/* Description clamped for consistent card height */}
        <p className={`food-item-desc${hideDescriptionOnMobile ? ' hide-desc-mobile' : ''}`}>{description}</p>
        {!isOutOfStock && onView && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onView()
            }}
            className="view-button"
          >
            View
          </button>
        )}
        {isOutOfStock && (
          <button disabled className="view-button sold-out-btn">
            Sold Out
          </button>
        )}
      </div>
    </div>
  )
}

export default FoodItem