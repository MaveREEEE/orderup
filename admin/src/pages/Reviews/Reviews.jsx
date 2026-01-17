import React, { useEffect, useMemo, useState } from 'react'
import './Reviews.css'
import axios from 'axios'
import { toast } from 'react-toastify'

const Reviews = ({ url, token }) => {
  const [foods, setFoods] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const res = await axios.get(url + '/api/food/list')
      if (res.data.success) {
        setFoods(res.data.data || [])
      } else {
        toast.error(res.data.message || 'Failed to load reviews')
      }
    } catch (err) {
      console.error(err)
      toast.error('Network error loading reviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredFoods = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (foods || [])
      .filter(f => (f.ratings?.length || 0) > 0)
      .filter(f => (needle ? f.name.toLowerCase().includes(needle) : true))
      .map(f => {
        const ratingCount = f.ratings?.length || 0
        const computedAvg = ratingCount
          ? f.ratings.reduce((sum, r) => sum + (r?.rating || 0), 0) / ratingCount
          : 0
        const average = f.averageRating ?? computedAvg
        const latest = [...(f.ratings || [])].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        )[0]
        return { ...f, ratingCount, displayAvg: Number(average || 0).toFixed(1), latest }
      })
  }, [foods, search])

  const handleDelete = async (foodId, ratingId) => {
    const confirm = window.confirm('Remove this review?')
    if (!confirm) return
    try {
      const res = await axios.delete(
        `${url}/api/food/ratings/${foodId}/${ratingId}`,
        { headers: { token } }
      )
      if (res.data.success) {
        toast.success('Review removed')
        setFoods(prev =>
          prev.map(f =>
            f._id === foodId
              ? { ...f, ratings: res.data.data.ratings, averageRating: res.data.data.averageRating }
              : f
          )
        )
      } else {
        toast.error(res.data.message || 'Failed to remove review')
      }
    } catch (err) {
      console.error(err)
      toast.error('Network error removing review')
    }
  }

  return (
    <div className="reviews-container">
      <div className="reviews-header">
        <div>
          <h2>Reviews Management</h2>
        </div>
        <div className="reviews-actions">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
          />
          <button onClick={fetchReviews} className="ghost-btn">Refresh</button>
        </div>
      </div>

      {loading ? (
        <div className="reviews-card">Loading reviews…</div>
      ) : filteredFoods.length === 0 ? (
        <div className="reviews-card">No reviews found.</div>
      ) : (
        filteredFoods.map(food => (
          <div key={food._id} className="reviews-card">
            <div className="card-top">
              <div className="item-meta">
                <h3>{food.name}</h3>
                <p className="item-category">{food.category}</p>
              </div>
              <div className="item-stats">
                <span className="rating-chip">★ {food.displayAvg}</span>
                <span className="count-chip">{food.ratingCount} reviews</span>
              </div>
              <button
                className="ghost-btn"
                onClick={() => setExpandedId(expandedId === food._id ? null : food._id)}
              >
                {expandedId === food._id ? 'Hide' : 'Manage'}
              </button>
            </div>

            <div className="latest-line">
              <span className="label">Latest:</span>
              {food.latest ? (
                <span>
                  {food.latest.rating}★ · {food.latest.comment || 'No comment'} ·{' '}
                  {new Date(food.latest.date).toLocaleDateString()}
                </span>
              ) : (
                <span>No reviews yet</span>
              )}
            </div>

            {expandedId === food._id && (
              <div className="reviews-list">
                {food.ratings
                  .slice()
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map(r => (
                    <div key={r._id} className="review-row">
                      <div className="review-main">
                        <span className="review-rating">★ {r.rating}</span>
                        <span className="review-comment">{r.comment || 'No comment'}</span>
                      </div>
                      <div className="review-meta">
                        <span>{new Date(r.date).toLocaleString()}</span>
                        <span>User: {r.userId}</span>
                        <span>Order: {r.orderId}</span>
                      </div>
                      <button
                        className="danger-btn"
                        onClick={() => handleDelete(food._id, r._id)}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

export default Reviews