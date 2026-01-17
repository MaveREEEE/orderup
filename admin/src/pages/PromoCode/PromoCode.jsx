import React, { useState, useEffect } from 'react'
import './PromoCode.css'
import axios from 'axios'
import { toast } from 'react-toastify'

const PromoCode = ({ url }) => {
  const [promoCodes, setPromoCodes] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentPromo, setCurrentPromo] = useState(null)
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderAmount: '0',
    maxDiscount: '',
    usageLimit: '',
    validFrom: '',
    validUntil: ''
  })

  const token = localStorage.getItem("token")

  const fetchPromoCodes = async () => {
    try {
      const response = await axios.get(url + "/api/promo/list", {
        headers: { token }
      })
      if (response.data.success) {
        setPromoCodes(response.data.data)
      } else {
        toast.error("Error fetching promo codes")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Network error")
    }
  }

  useEffect(() => {
    fetchPromoCodes()
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const resetForm = () => {
    setFormData({
      code: '',
      discountType: 'percentage',
      discountValue: '',
      minOrderAmount: '0',
      maxDiscount: '',
      usageLimit: '',
      validFrom: '',
      validUntil: ''
    })
    setEditMode(false)
    setCurrentPromo(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const endpoint = editMode 
        ? url + `/api/promo/update/${currentPromo._id}` 
        : url + "/api/promo/create"
      
      const method = editMode ? 'put' : 'post'

      const response = await axios[method](endpoint, formData, {
        headers: { token }
      })

      if (response.data.success) {
        toast.success(response.data.message)
        fetchPromoCodes()
        setShowModal(false)
        resetForm()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error saving promo code")
    }
  }

  const handleEdit = (promo) => {
    setEditMode(true)
    setCurrentPromo(promo)
    setFormData({
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue.toString(),
      minOrderAmount: promo.minOrderAmount.toString(),
      maxDiscount: promo.maxDiscount?.toString() || '',
      usageLimit: promo.usageLimit?.toString() || '',
      validFrom: new Date(promo.validFrom).toISOString().split('T')[0],
      validUntil: new Date(promo.validUntil).toISOString().split('T')[0]
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this promo code?")) {
      return
    }

    try {
      const response = await axios.delete(url + `/api/promo/delete/${id}`, {
        headers: { token }
      })

      if (response.data.success) {
        toast.success(response.data.message)
        fetchPromoCodes()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error deleting promo code")
    }
  }

  const handleToggleStatus = async (id) => {
    try {
      const response = await axios.patch(url + `/api/promo/toggle/${id}`, {}, {
        headers: { token }
      })

      if (response.data.success) {
        toast.success(response.data.message)
        fetchPromoCodes()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error toggling status")
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="promo-container">
      <div className="promo-header">
        <h2>Promo Codes Management</h2>
        <button 
          className="btn-add-promo"
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
        >
          + Create Promo Code
        </button>
      </div>

      <div className="promo-table-wrapper">
        <table className="promo-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Type</th>
              <th>Value</th>
              <th>Min Order</th>
              <th>Usage</th>
              <th>Valid Period</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {promoCodes.length > 0 ? (
              promoCodes.map((promo) => (
                <tr key={promo._id}>
                  <td className="promo-code">{promo.code}</td>
                  <td>
                    <span className={`badge type-${promo.discountType}`}>
                      {promo.discountType}
                    </span>
                  </td>
                  <td>
                    {promo.discountType === 'percentage' 
                      ? `${promo.discountValue}%` 
                      : `₱${promo.discountValue}`}
                    {promo.maxDiscount && ` (Max: ₱${promo.maxDiscount})`}
                  </td>
                  <td>₱{promo.minOrderAmount}</td>
                  <td>
                    {promo.usedCount || 0}
                    {promo.usageLimit && ` / ${promo.usageLimit}`}
                  </td>
                  <td className="date-cell">
                    {formatDate(promo.validFrom)} - {formatDate(promo.validUntil)}
                  </td>
                  <td>
                    <button
                      className={`status-toggle ${promo.isActive ? 'active' : 'inactive'}`}
                      onClick={() => handleToggleStatus(promo._id)}
                    >
                      {promo.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="actions-cell">
                    <button 
                      className="btn-edit"
                      onClick={() => handleEdit(promo)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDelete(promo._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="no-data">No promo codes found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editMode ? 'Edit Promo Code' : 'Create Promo Code'}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="promo-form">
              <div className="form-group">
                <label>Promo Code *</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="e.g., SAVE20"
                  required
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Discount Type *</label>
                  <select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Discount Value * 
                    {formData.discountType === 'percentage' ? ' (%)' : ' (₱)'}
                  </label>
                  <input
                    type="number"
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleInputChange}
                    min="0"
                    step={formData.discountType === 'percentage' ? '1' : '0.01'}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Min Order Amount (₱)</label>
                  <input
                    type="number"
                    name="minOrderAmount"
                    value={formData.minOrderAmount}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Max Discount (₱)</label>
                  <input
                    type="number"
                    name="maxDiscount"
                    value={formData.maxDiscount}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Usage Limit</label>
                <input
                  type="number"
                  name="usageLimit"
                  value={formData.usageLimit}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="Leave empty for unlimited"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Valid From *</label>
                  <input
                    type="date"
                    name="validFrom"
                    value={formData.validFrom}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Valid Until *</label>
                  <input
                    type="date"
                    name="validUntil"
                    value={formData.validUntil}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  {editMode ? 'Update' : 'Create'}
                </button>
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PromoCode