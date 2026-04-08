import React, { useState, useEffect, useCallback } from 'react'
import './Allergens.css'
import axios from 'axios'
import { toast } from 'react-toastify'

const Allergens = ({ url }) => {
  const [allergens, setAllergens] = useState([])
  const [newAllergen, setNewAllergen] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')

  const fetchAllergens = useCallback(async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${url}/api/allergens`)
      if (response.data.success) {
        setAllergens(response.data.data || [])
      }
    } catch {
      toast.error('Failed to load allergens')
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    fetchAllergens()
  }, [fetchAllergens])

  const handleAdd = async () => {
    if (!newAllergen.trim()) {
      toast.error('Please enter an allergen name')
      return
    }

    try {
      const response = await axios.post(`${url}/api/allergens`, {
        name: newAllergen.trim()
      })

      if (response.data.success) {
        setAllergens([...allergens, response.data.data])
        setNewAllergen('')
        toast.success('Allergen added successfully')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add allergen')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this allergen?')) {
      try {
        const response = await axios.delete(`${url}/api/allergens/${id}`)
        if (response.data.success) {
          setAllergens(allergens.filter(a => a._id !== id))
          toast.success('Allergen deleted successfully')
        }
      } catch {
        toast.error('Failed to delete allergen')
      }
    }
  }

  const handleUpdate = async (id) => {
    if (!editValue.trim()) {
      toast.error('Please enter an allergen name')
      return
    }

    try {
      const response = await axios.put(`${url}/api/allergens/${id}`, {
        name: editValue.trim()
      })

      if (response.data.success) {
        setAllergens(allergens.map(a => a._id === id ? response.data.data : a))
        setEditingId(null)
        toast.success('Allergen updated successfully')
      }
    } catch {
      toast.error('Failed to update allergen')
    }
  }

  return (
    <div className="allergens-container">
      <h1>Manage Allergens</h1>
      <p className="subtitle">Add and manage allergen options that users can select during signup</p>

      <div className="allergens-card">
        <div className="add-section">
          <h2>Add New Allergen</h2>
          <div className="input-group">
            <input
              type="text"
              value={newAllergen}
              onChange={(e) => setNewAllergen(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="E.g., Peanuts, Dairy, Gluten..."
              className="allergen-input"
            />
            <button onClick={handleAdd} className="add-btn">Add Allergen</button>
          </div>
        </div>

        <div className="list-section">
          <h2>Allergens List</h2>
          {loading ? (
            <p className="loading">Loading allergens...</p>
          ) : allergens.length === 0 ? (
            <p className="empty">No allergens added yet</p>
          ) : (
            <div className="allergens-list">
              {allergens.map((allergen) => (
                <div key={allergen._id} className="allergen-item">
                  {editingId === allergen._id ? (
                    <div className="edit-mode">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="edit-input"
                      />
                      <div className="action-buttons">
                        <button 
                          onClick={() => handleUpdate(allergen._id)}
                          className="save-btn"
                        >
                          Save
                        </button>
                        <button 
                          onClick={() => setEditingId(null)}
                          className="cancel-btn"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="view-mode">
                      <span className="allergen-name">{allergen.name}</span>
                      <div className="action-buttons">
                        <button 
                          onClick={() => {
                            setEditingId(allergen._id)
                            setEditValue(allergen.name)
                          }}
                          className="edit-btn"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(allergen._id)}
                          className="delete-btn"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Allergens
