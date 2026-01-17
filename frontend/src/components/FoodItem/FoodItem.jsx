import React, { useContext } from 'react'
import './FoodItem.css'
import { assets } from '../../assets/assets'
import { StoreContext } from '../../context/StoreContext'

const FoodItem = ({
  id,
  name,
  price,
  description,
  image,
  batches = [],
  ratings = [],
  averageRating,
  onView,
}) => {
  const { url } = useContext(StoreContext)

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
        <img className="food-item-image" src={image} alt="" />
      </div>
      <div className="food-item-info">
        <div className="food-item-name-rating">
          <p className="food-item-name">{name}</p>
          {formattedAvg && (
            <div className="item-rating">
              <span className="item-rating-star">★</span>
              <span className="item-rating-value">{formattedAvg}</span>
              <span className="item-rating-count">({ratingCount})</span>
            </div>
          )}
        </div>
        <p className="food-item-desc">{description}</p>
        <div className="food-item-bottom">
          <p className="food-item-price">
            {new Intl.NumberFormat('en-PH', {
              style: 'currency',
              currency: 'PHP',
            }).format(price)}
          </p>
          {totalStock <= 10 && totalStock > 0 && (
            <span className="low-stock-warning">Only {totalStock} left!</span>
          )}
        </div>
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