import React, { useCallback, useEffect, useState } from 'react'
import './Inventory.css'
import axios from 'axios'
import { toast } from 'react-toastify'

const Inventory = ({ url }) => {
    const [inventory, setInventory] = useState([])
    const [lowStockItems, setLowStockItems] = useState([])
    const [expiringItems, setExpiringItems] = useState([])
    const [showAddBatchModal, setShowAddBatchModal] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null)
    const [filteredInventory, setFilteredInventory] = useState([])
    const [searchTerm, setSearchTerm] = useState("")
    const [sortBy, setSortBy] = useState("a-z")
    const [filterCategory, setFilterCategory] = useState("all")
    const [categories, setCategories] = useState([])
    const [batchForm, setBatchForm] = useState({
        quantity: '',
        productionDate: '',
        expirationDate: '',
        hasExpiry: false
    })

    const fetchInventory = useCallback(async () => {
        try {
            const token = sessionStorage.getItem("token")
            const response = await axios.get(url + "/api/inventory/list", {
                headers: { token }
            })
            if (response.data.success) {
                const sortedInventory = response.data.data.sort((a, b) => 
                    a.name.localeCompare(b.name)
                )
                setInventory(sortedInventory)
                setFilteredInventory(sortedInventory)
            } else {
                toast.error(response.data.message || "Error fetching inventory")
            }
        } catch (error) {
            console.log("Error fetching inventory:", error)
            toast.error("Error fetching inventory")
        }
    }, [url])

    const fetchCategories = useCallback(async () => {
        try {
            const response = await axios.get(url + "/api/category/list")
            if (response.data.success) {
                setCategories(response.data.data || [])
            } else {
                toast.error("Failed to fetch categories")
            }
        } catch (error) {
            console.log("Error fetching categories:", error)
            toast.error("Failed to fetch categories")
        }
    }, [url])

    const fetchLowStockItems = useCallback(async () => {
        try {
            const token = sessionStorage.getItem("token")
            const response = await axios.get(url + "/api/inventory/low-stock", {
                headers: { token }
            })
            if (response.data.success) {
                const itemsWithStock = response.data.data.map(item => ({
                    ...item,
                    totalStock: item.batches?.reduce((sum, batch) => sum + batch.quantity, 0) || 0
                }))
                const sortedItems = itemsWithStock.sort((a, b) => 
                    a.name.localeCompare(b.name)
                )
                setLowStockItems(sortedItems)
            }
        } catch (error) {
            console.log("Error fetching low stock items:", error)
        }
    }, [url])

    const fetchExpiringItems = useCallback(async () => {
        try {
            const token = sessionStorage.getItem("token")
            const response = await axios.get(url + "/api/inventory/expiring-soon", {
                headers: { token }
            })
            if (response.data.success) {
                const sortedItems = response.data.data.sort((a, b) => 
                    a.name.localeCompare(b.name)
                )
                setExpiringItems(sortedItems)
            }
        } catch (error) {
            console.log("Error fetching expiring items:", error)
        }
    }, [url])

    const addBatch = async (e) => {
        e.preventDefault()
        
        if (!batchForm.quantity) {
            toast.error("Please fill in quantity")
            return
        }

        const isDessert = isDessertCategory(selectedItem.category)
        
        if (isDessert && !batchForm.productionDate) {
            toast.error("Please fill in production date for desserts")
            return
        }

        if (isDessert && batchForm.hasExpiry && !batchForm.expirationDate) {
            toast.error("Please fill in expiration date")
            return
        }
        
        const batchData = {
            itemId: selectedItem._id,
            quantity: parseInt(batchForm.quantity),
            productionDate: isDessert ? batchForm.productionDate : null,
            expirationDate: isDessert && batchForm.hasExpiry ? batchForm.expirationDate : null
        }

        try {
            const token = sessionStorage.getItem("token")
            const response = await axios.post(url + "/api/inventory/add-batch", batchData, {
                headers: { token }
            })
            if (response.data.success) {
                toast.success("Batch added successfully")
                setShowAddBatchModal(false)
                setBatchForm({ quantity: '', productionDate: '', expirationDate: '', hasExpiry: false })
                fetchInventory()
                fetchLowStockItems()
                fetchExpiringItems()
            } else {
                toast.error(response.data.message || "Error adding batch")
            }
        } catch (error) {
            console.log("Error adding batch:", error)
            toast.error(error.response?.data?.message || "Error adding batch")
        }
    }

    const removeBatch = async (itemId, batchId) => {
        try {
            const token = sessionStorage.getItem("token")
            const response = await axios.post(url + "/api/inventory/remove-batch", {
                itemId,
                batchId
            }, {
                headers: { token }
            })
            if (response.data.success) {
                toast.success("Batch removed successfully")
                fetchInventory()
                fetchLowStockItems()
                fetchExpiringItems()
            } else {
                toast.error(response.data.message || "Error removing batch")
            }
        } catch (error) {
            console.log("Error removing batch:", error)
            toast.error(error.response?.data?.message || "Error removing batch")
        }
    }

    const getDaysUntilExpiry = (expiryDate) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const expiry = new Date(expiryDate)
        expiry.setHours(0, 0, 0, 0)
        const diffTime = expiry - today
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }

    const isDessertCategory = (category) => {
        return category && category.toLowerCase().trim().includes('dessert')
    }

    useEffect(() => {
        fetchInventory()
        fetchCategories()
        fetchLowStockItems()
        fetchExpiringItems()
    }, [fetchCategories, fetchExpiringItems, fetchInventory, fetchLowStockItems])

    useEffect(() => {
        let result = [...inventory]

        if (filterCategory !== "all") {
            result = result.filter(item => item.category === filterCategory)
        }

        if (searchTerm) {
            result = result.filter(item => 
                item.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        switch (sortBy) {
            case "a-z":
                result.sort((a, b) => a.name.localeCompare(b.name))
                break
            case "z-a":
                result.sort((a, b) => b.name.localeCompare(a.name))
                break
            case "stock-low":
                result.sort((a, b) => {
                    const stockA = a.batches?.reduce((sum, batch) => sum + batch.quantity, 0) || 0
                    const stockB = b.batches?.reduce((sum, batch) => sum + batch.quantity, 0) || 0
                    return stockA - stockB
                })
                break
            case "stock-high":
                result.sort((a, b) => {
                    const stockA = a.batches?.reduce((sum, batch) => sum + batch.quantity, 0) || 0
                    const stockB = b.batches?.reduce((sum, batch) => sum + batch.quantity, 0) || 0
                    return stockB - stockA
                })
                break
            case "category":
                result.sort((a, b) => a.category.localeCompare(b.category))
                break
            default:
                break
        }

        setFilteredInventory(result)
    }, [inventory, sortBy, filterCategory, searchTerm])

    const getImageUrl = (img) => {
        if (!img) return ''
        return img.startsWith('http') ? img : `${url}/uploads/items/${img}`
    }

    return (
        <div className="inventory-container">
            <div className="inventory-header">
                <h2>Inventory Management</h2>
            </div>

            <div className="alerts-section">
                {expiringItems.length > 0 && (
                    <div className="alert-box expiring-alert-box">
                        <h3>⏰ Expiring Soon ({expiringItems.length})</h3>
                        <div className="alert-list">
                            {expiringItems.map(item => (
                                <div key={`${item._id}-${item.batchId}`} className="alert-item expiring-alert">
                                    <img src={getImageUrl(item.image)} alt={item.name} />
                                    <div className="alert-details">
                                        <strong>{item.name}</strong>
                                        <span>Batch expires in {getDaysUntilExpiry(item.expirationDate)} days</span>
                                        <span className="alert-date">Quantity: {item.quantity} | Exp: {formatDate(item.expirationDate)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {lowStockItems.length > 0 && (
                    <div className="alert-box low-stock-alert-box">
                        <h3>Low Stock Alerts ({lowStockItems.length})</h3>
                        <div className="alert-list">
                            {lowStockItems.map(item => (
                                <div key={item._id} className={`alert-item ${item.totalStock === 0 ? 'out-of-stock-alert' : 'low-stock-alert'}`}>
                                    <img src={getImageUrl(item.image)} alt={item.name} />
                                    <div className="alert-details">
                                        <strong>{item.name}</strong>
                                        <span>
                                            {item.totalStock === 0
                                                ? `OUT OF STOCK!`
                                                : `Only ${item.totalStock} left!`
                                            }
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {expiringItems.length === 0 && lowStockItems.length === 0 && (
                    <div className="alert-box success-card">
                        <h3>✅ All Good!</h3>
                        <p>No expiring items or low stock alerts at the moment.</p>
                    </div>
                )}
            </div>

            <div className="inventory-list">
                <div className="list-header">
                    <h2>All Items ({filteredInventory.length})</h2>
                </div>

                <div className="inventory-filters">
                    <div className="filter-group">
                        <label>Search:</label>
                        <input
                            type="text"
                            placeholder="Search by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    <div className="filter-group">
                        <label>Sort by:</label>
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
                            <option value="a-z">A-Z</option>
                            <option value="z-a">Z-A</option>
                            <option value="stock-low">Stock: Low to High</option>
                            <option value="stock-high">Stock: High to Low</option>
                            <option value="category">Category</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Category:</label>
                        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="filter-select">
                            <option value="all">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat._id} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <button 
                        className="clear-filters-btn"
                        onClick={() => {
                            setSortBy("a-z")
                            setFilterCategory("all")
                            setSearchTerm("")
                        }}
                    >
                        Clear Filters
                    </button>
                </div>

                {filteredInventory.length > 0 ? (
                    <div className="inventory-grid">
                        {filteredInventory.map((item) => {
                            const totalStock = item.batches?.reduce((sum, batch) => sum + batch.quantity, 0) || 0
                            const hasBatches = item.batches && item.batches.length > 0
                            
                            return (
                                <div key={item._id} className="inventory-card">
                                    <div className="inventory-item-image">
                                        <img src={getImageUrl(item.image)} alt={item.name} />
                                    </div>
                                    
                                    <div className="inventory-card-info">
                                        <h3>{item.name}</h3>
                                        <p className="card-category">{item.category}</p>
                                        
                                        <div className="card-meta">
                                            <span className="stock-label">Stock:</span>
                                            <span className={`stock-badge ${totalStock <= (item.lowStockThreshold || 10) ? 'low' : ''} ${totalStock === 0 ? 'out' : ''}`}>
                                                {totalStock}
                                            </span>
                                        </div>

                                        {hasBatches ? (
                                            <div className="batches-list">
                                                {item.batches.map((batch, idx) => {
                                                    const isDessert = isDessertCategory(item.category)
                                                    const daysLeft = batch.expirationDate ? getDaysUntilExpiry(batch.expirationDate) : null
                                                    const isExpiring = daysLeft !== null && daysLeft <= 3
                                                    const isExpired = daysLeft !== null && daysLeft < 0
                                                    
                                                    return (
                                                        <div key={batch._id || idx} className={`batch-item ${isExpired ? 'expired' : isExpiring ? 'expiring' : ''}`}>
                                                            <div className="batch-info">
                                                                <span className="batch-qty">Quantity: {batch.quantity}</span>
                                                                {isDessert && batch.productionDate && (
                                                                    <span className="batch-prod">Prod: {formatDate(batch.productionDate)}</span>
                                                                )}
                                                                {isDessert && batch.expirationDate && (
                                                                    <span className="batch-exp">
                                                                        Exp: {formatDate(batch.expirationDate)}
                                                                        {daysLeft !== null && (
                                                                            <span className={`days-left ${isExpired ? 'expired-text' : isExpiring ? 'expiring-text' : ''}`}>
                                                                                ({isExpired ? 'Expired' : `${daysLeft}d`})
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <button
                                                                className="remove-batch-btn"
                                                                onClick={() => removeBatch(item._id, batch._id)}
                                                                title="Remove batch"
                                                                type="button"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        ) : (
                                            <span className="no-batches">No stock</span>
                                        )}
                                    </div>

                                    <div className="card-actions">
                                        <button
                                            className="add-batch-btn"
                                            onClick={() => {
                                                setSelectedItem(item)
                                                setShowAddBatchModal(true)
                                                setBatchForm({ 
                                                    quantity: '', 
                                                    productionDate: new Date().toISOString().split('T')[0], 
                                                    expirationDate: '',
                                                    hasExpiry: false 
                                                })
                                            }}
                                            type="button"
                                        >
                                            + Add Batch
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="empty-state">
                        <p>No inventory items found</p>
                    </div>
                )}
            </div>

            {showAddBatchModal && selectedItem && (
                <div className="modal-overlay" onClick={() => setShowAddBatchModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Add New Batch</h3>
                            <button className="modal-close" onClick={() => setShowAddBatchModal(false)} type="button">×</button>
                        </div>
                        
                        <form onSubmit={addBatch} className="batch-form">
                            <div className="form-group">
                                <label>Item:</label>
                                <div className="selected-item">
                                    <img src={getImageUrl(selectedItem.image)} alt={selectedItem.name} />
                                    <span>{selectedItem.name}</span>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="quantity">Quantity: <span className="required">*</span></label>
                                <input
                                    id="quantity"
                                    type="number"
                                    min="1"
                                    value={batchForm.quantity}
                                    onChange={(e) => setBatchForm({ ...batchForm, quantity: e.target.value })}
                                    required
                                    placeholder="Enter quantity"
                                />
                            </div>

                            {isDessertCategory(selectedItem.category) && (
                                <>
                                    <div className="form-group">
                                        <label htmlFor="productionDate">Production Date: <span className="required">*</span></label>
                                        <input
                                            id="productionDate"
                                            type="date"
                                            value={batchForm.productionDate}
                                            onChange={(e) => setBatchForm({ ...batchForm, productionDate: e.target.value })}
                                            required
                                            max={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>

                                    <div className="form-group checkbox-group">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={batchForm.hasExpiry}
                                                onChange={(e) => setBatchForm({ ...batchForm, hasExpiry: e.target.checked, expirationDate: '' })}
                                            />
                                            <span>This dessert has an expiration date</span>
                                        </label>
                                        <small>Check this for perishable desserts</small>
                                    </div>

                                    {batchForm.hasExpiry && (
                                        <div className="form-group">
                                            <label htmlFor="expirationDate">Expiration Date: <span className="required">*</span></label>
                                            <input
                                                id="expirationDate"
                                                type="date"
                                                value={batchForm.expirationDate}
                                                onChange={(e) => setBatchForm({ ...batchForm, expirationDate: e.target.value })}
                                                required
                                                min={batchForm.productionDate || new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="modal-actions">
                                <button type="submit" className="btn-submit">Add Batch</button>
                                <button type="button" className="btn-cancel" onClick={() => setShowAddBatchModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Inventory
