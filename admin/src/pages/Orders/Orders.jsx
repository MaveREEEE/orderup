import React, { useState, useEffect } from 'react'
import './Orders.css'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../../assets/assets'

const Orders = ({ url }) => {
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [paymentFilter, setPaymentFilter] = useState('All')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const getImageUrl = (img) => {
    if (!img) return ''
    return img.startsWith('http') ? img : `${url}/uploads/items/${img}`
  }

  const parseAddress = (address) => {
    if (!address) return {}
    if (typeof address === 'string') {
      return { name: '', phone: '', fullAddress: address }
    }
    const fullAddress = address.address || address.street || ''
    return { ...address, fullAddress }
  }

  // Get token from localStorage
  const token = localStorage.getItem("token")

  const fetchAllOrders = async () => {
    try {
      const response = await axios.get(url + "/api/order/list", {
        headers: { token }
      })
      if (response.data.success) {
        // Sort by date (newest first)
        const sortedOrders = response.data.data.sort((a, b) => {
          return new Date(b.date) - new Date(a.date)
        })
        setOrders(sortedOrders)
        setFilteredOrders(sortedOrders)
      } else {
        toast.error("Error fetching orders")
      }
    } catch {
      toast.error("Network error")
    }
  }

  useEffect(() => {
    fetchAllOrders()
    // eslint-disable-next-line
  }, [])

  // Apply filters
  useEffect(() => {
    let result = orders

    // Search filter
    if (searchTerm) {
      result = result.filter(order => {
        const addr = parseAddress(order.address)
        const customerName = addr.name
          ? addr.name
          : `${addr.firstName || ''} ${addr.lastName || ''}`.trim() || 'Customer'
        const orderId = order._id.toLowerCase()
        const items = order.items.map(i => i.name.toLowerCase()).join(' ')

        return customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          orderId.includes(searchTerm.toLowerCase()) ||
          items.includes(searchTerm.toLowerCase())
      })
    }

    // Status filter
    if (statusFilter !== 'All') {
      result = result.filter(order => order.status === statusFilter)
    }

    // Type filter
    if (typeFilter !== 'All') {
      result = result.filter(order => order.orderType === typeFilter)
    }

    // Payment filter
    if (paymentFilter !== 'All') {
      result = result.filter(order => order.paymentMethod === paymentFilter)
    }

    // Sort by date after filtering (newest first)
    result = result.sort((a, b) => new Date(b.date) - new Date(a.date))

    setFilteredOrders(result)
  }, [searchTerm, statusFilter, typeFilter, paymentFilter, orders])

  const statusHandler = async (e, orderId) => {
    try {
      const response = await axios.post(url + "/api/order/status", {
        orderId,
        status: e.target.value
      }, {
        headers: { token }
      })
      if (response.data.success) {
        fetchAllOrders()
        toast.success("Status updated")
      } else {
        toast.error("Update failed")
      }
    } catch {
      toast.error("Network error")
    }
  }

  const formatReservation = (address) => {
    if (!address.reservationDate) return ''
    const time = address.reservationTime ? address.reservationTime : ''
    const size = address.partySize ? ` | ${address.partySize} ${address.partySize === 1 ? 'person' : 'people'}` : ''
    return `${address.reservationDate}${time ? ' @ ' + time : ''}${size}`
  }

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

  const resetFilters = () => {
    setSearchTerm('')
    setStatusFilter('All')
    setTypeFilter('All')
    setPaymentFilter('All')
  }

  const openModal = (order) => {
    setSelectedOrder(order)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedOrder(null)
  }

  return (
    <div className="list-container">
      <div className="list-header">
        <p className="list-title">Orders Management</p>
        <div className="list-stats">
          <span className="stats-badge">Total: {orders.length}</span>
          <span className="stats-badge">Processing: {orders.filter(o => o.status === "Food Processing").length}</span>
          <span className="stats-badge">Ready: {orders.filter(o => o.status === "Food Ready").length}</span>
          <span className="stats-badge">Delivered: {orders.filter(o => o.status === "Delivered").length}</span>
        </div>
      </div>

      {/* Filters Section */}
      <div className="list-filters">
        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Search by customer, order ID, or items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Status</option>
            <option value="Food Processing">Food Processing</option>
            <option value="Food Ready">Food Ready</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Type:</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Types</option>
            <option value="Dine In">Dine In</option>
            <option value="Pick Up">Pick Up</option>
            <option value="Pre-Order">Pre-Order</option>
            <option value="Delivery">Delivery</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Payment:</label>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Payments</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
          </select>
        </div>

        {(searchTerm || statusFilter !== 'All' || typeFilter !== 'All' || paymentFilter !== 'All') && (
          <button className="clear-filters-btn" onClick={resetFilters}>
            Clear Filters
          </button>
        )}
      </div>

      <div className="list-table-wrapper">
        <table className="list-table">
          <thead>
            <tr>
              <th>Order Date</th>
              <th>ID</th>
              <th>Type</th>
              <th>Customer / Info</th>
              <th>Order Details</th>
              <th>Payment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map(order => {
                const addr = parseAddress(order.address)
                return (
                  <tr key={order._id}>
                    <td className="date-cell">{formatDate(order.date)}</td>
                    <td className="order-id-cell">
                      {order._id.slice(-6)}
                    </td>
                    <td>
                      <span className={`badge type-${(order.orderType || 'Other').toLowerCase().replace(/\s+/g, '-')}`}>
                        {order.orderType || 'Other'}
                      </span>
                    </td>
                    <td className="customer-cell">
                      <div className="customer-name">
                        {addr.name
                          ? addr.name
                          : `${addr.firstName || ''} ${addr.lastName || ''}`.trim() || 'Customer'}
                      </div>
                      {addr.phone && (
                        <div className="sub-info">{addr.phone}</div>
                      )}
                      {order.orderType === 'Pick Up' && addr.pickupNumber && (
                        <div className="sub-info">Pickup #{addr.pickupNumber}</div>
                      )}
                      {addr.tableNumber && (
                        <div className="sub-info">Table {addr.tableNumber}</div>
                      )}
                      {addr.reservationDate && (
                        <div className="sub-info reservation">
                          {formatReservation(addr)}
                        </div>
                      )}
                    </td>
                    <td>
                      {order.orderType === 'Delivery' && (addr.fullAddress || addr.address) && (
                        <div className="sub-info">{addr.fullAddress || addr.address}</div>
                      )}
                      <button
                        className="view-details-btn"
                        onClick={() => openModal(order)}
                      >
                        View Details
                      </button>
                    </td>
                    <td className="payment-cell">{order.paymentMethod}</td>
                    <td>
                      <select
                        className={`status-select ${order.status.toLowerCase().replace(/\s+/g, '-')}`}
                        value={order.status}
                        onChange={(e) => statusHandler(e, order._id)}
                      >
                        <option value="Food Processing">Food Processing</option>
                        <option value="Food Ready">Food Ready</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan="7" className="no-results">
                  {searchTerm || statusFilter !== 'All' || typeFilter !== 'All' || paymentFilter !== 'All'
                    ? 'No orders match your filters'
                    : 'No orders available'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details</h2>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>

            <div className="modal-body">

              <div className="items-section">
                <h3>Ordered Items</h3>
                <div className="items-list">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="item-card">
                      <img
                        src={getImageUrl(item.image)}
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="order-summary">
                {(() => {
                  const addr = parseAddress(selectedOrder.address)
                  
                  if (selectedOrder.orderType === 'Pick Up' || selectedOrder.orderType === 'Pre-Order') return null
                  if (!addr.fullAddress && !addr.address) return null
                  return (
                    <div className="summary-row">
                      <span>Address:</span>
                      <span className="address-text">{addr.fullAddress || addr.address}</span>
                    </div>
                  )
                })()}
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

export default Orders