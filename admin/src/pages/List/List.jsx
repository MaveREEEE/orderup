import React, { useEffect, useState } from 'react'
import './List.css'
import axios from "axios"
import { toast } from "react-toastify"

const List = ({ url, token }) => {

  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({ 
    name: "", 
    category: "", 
    price: "", 
    description: "",
    allergens: [],
    image: null,
    imagePreview: ""
  });
  const [list, setList] = useState([]);
  const [archivedList, setArchivedList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [sortBy, setSortBy] = useState("a-z");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(false);

  const allergensList = [
    "Milk",
    "Eggs",
    "Fish",
    "Shellfish",
    "Tree Nuts",
    "Peanuts",
    "Wheat",
    "Soybeans",
    "Sesame",
    "Gluten"
  ];

  // Normalize allergens coming from API (array or comma-separated string)
  const normalizeAllergens = (val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === "string" && val.length) {
      // Try JSON parse first to handle strings like '["Milk","Eggs"]'
      try {
        const parsed = JSON.parse(val)
        if (Array.isArray(parsed)) return parsed
      } catch (_) { /* ignore */ }
      return val.split(",").map(a => a.replace(/\[|\]|"/g, "").trim()).filter(Boolean)
    }
    return [];
  };

  const fetchList = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${url}/api/food/list`);
      if (response.data.success) {
        const normalized = (response.data.data || []).map(item => ({
          ...item,
          allergens: normalizeAllergens(item.allergens)
        }));
        setList(normalized)
        setFilteredList(normalized)
        if (response.data.data?.length === 0) {
          toast.info("No food items found. Add your first item!");
        }
      } else {
        toast.error("Error fetching food items")
      }
    } catch (error) {
      console.error("Fetch list error:", error);
      toast.error("Failed to fetch food items")
    } finally {
      setLoading(false)
    }
  }

  const fetchArchivedList = async () => {
    if (!token) {
      toast.error("Please login to view archived items");
      return;
    }

    try {
      setLoading(true)
      console.log("Fetching archived items...");
      const response = await axios.get(`${url}/api/food/archived/list`, {
        headers: { 
          token: token,
          'Content-Type': 'application/json'
        }
      });
      console.log("Archived response:", response.data)
      
      if (response.data.success) {
        const normalized = (response.data.data || []).map(item => ({
          ...item,
          allergens: normalizeAllergens(item.allergens)
        }));
        setArchivedList(normalized)
        setShowArchived(true)
        
        if (response.data.data?.length === 0) {
          toast.info("No archived items found");
        } else {
          toast.success(`Found ${response.data.data.length} archived items`);
        }
      } else {
        toast.error(response.data.message || "Error fetching archived items")
      }
    } catch (error) {
      console.error("Fetch archived error:", error);
      console.error("Error response:", error.response?.data)
      
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again");
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to view archived items");
      } else if (error.response?.status === 404) {
        toast.error("Archived items endpoint not found");
      } else {
        toast.error(error.response?.data?.message || "Failed to fetch archived items")
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${url}/api/category/list`);
      
      if (response.data.success) {
        setCategories(response.data.data || []);
      } else {
        toast.error("Failed to fetch categories");
      }
    } catch (error) {
      console.error("Fetch categories error:", error);
      toast.error("Failed to fetch categories");
    }
  };

  useEffect(() => {
    fetchList();
    fetchCategories();
  }, [url]);

  useEffect(() => {
    let result = [...list];

    if (filterCategory !== "all") {
      result = result.filter(item => item.category === filterCategory);
    }

    if (searchTerm) {
      result = result.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    switch (sortBy) {
      case "a-z":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "z-a":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "category":
        result.sort((a, b) => a.category.localeCompare(b.category));
        break;
      default:
        break;
    }

    setFilteredList(result);
  }, [list, sortBy, filterCategory, searchTerm]);

  const removeFood = async (foodId) => {
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    try {
      setLoading(true)
      console.log("Archiving food:", foodId);
      const response = await axios.post(`${url}/api/food/remove`, 
        { id: foodId },
        { headers: { token } }
      );
      
      console.log("Response:", response.data);

      if (response.data.success) {
        toast.success(response.data.message || "Food archived successfully")
        await fetchList();
      } else {
        toast.error(response.data.message || "Error archiving food item")
      }
    } catch (error) {
      console.error("Archive error:", error);
      if (error.response?.status === 401) {
        toast.error("Authentication failed. Please login again.");
      } else {
        toast.error(error.response?.data?.message || "Failed to archive food item");
      }
    } finally {
      setLoading(false)
    }
  }

  const restoreFood = async (foodId) => {
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    if (!window.confirm("Are you sure you want to restore this item?")) {
      return;
    }

    try {
      setLoading(true)
      console.log("Restoring food:", foodId);
      const response = await axios.post(`${url}/api/food/restore`, 
        { id: foodId },
        { headers: { token } }
      );
      
      console.log("Response:", response.data);

      if (response.data.success) {
        toast.success(response.data.message || "Food restored successfully")
        await fetchArchivedList();
        await fetchList();
      } else {
        toast.error(response.data.message || "Error restoring food item")
      }
    } catch (error) {
      console.error("Restore error:", error);
      if (error.response?.status === 401) {
        toast.error("Authentication failed. Please login again.");
      } else {
        toast.error(error.response?.data?.message || "Failed to restore food item");
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePermanentDelete = async (foodId) => {
    if (!token) {
      toast.error("Please login to perform this action");
      return;
    }

    if (!window.confirm("⚠️ This will PERMANENTLY delete this item and its image. This cannot be undone. Are you sure?")) {
      return;
    }

    try {
      setLoading(true)
      console.log("Permanently deleting food:", foodId);
      
      const response = await axios.post(
        `${url}/api/food/permanently-delete`,
        { id: foodId },
        { headers: { token } }
      );
      
      console.log("Response:", response.data);

      if (response.data.success) {
        toast.success(response.data.message || "Food permanently deleted");
        await fetchArchivedList();
      } else {
        toast.error(response.data.message || "Failed to permanently delete food item");
      }
    } catch (error) {
      console.error("Permanent delete error:", error);
      toast.error(error.response?.data?.message || "Failed to permanently delete food item");
    } finally {
      setLoading(false)
    }
  }

  const handleAllergenToggle = (allergen) => {
    setEditData(prevData => {
      const allergens = prevData.allergens.includes(allergen)
        ? prevData.allergens.filter(a => a !== allergen)
        : [...prevData.allergens, allergen];
      return { ...prevData, allergens };
    });
  }

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditData(prevData => ({
          ...prevData,
          image: file,
          imagePreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  }

  const updateFood = async (e) => {
    e.preventDefault();
    
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    try {
      setLoading(true)
      const formData = new FormData();
      formData.append('name', editData.name);
      formData.append('category', editData.category);
      formData.append('price', editData.price);
      formData.append('description', editData.description);
      formData.append('allergens', (editData.allergens || []).join(','));
      
      // Add image if new one was selected
      if (editData.image) {
        formData.append('image', editData.image);
      }

      const response = await axios.put(`${url}/api/food/update/${editId}`, formData, {
        headers: { 
          token,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        toast.success("Product updated successfully!");
        setEditId(null);
        fetchList();
      } else {
        toast.error(response.data.message || "Failed to update product.");
      }
    } catch (error) {
      console.error("Update error:", error);
      if (error.response?.status === 401) {
        toast.error("Authentication failed. Please login again.");
      } else {
        toast.error("Failed to update product");
      }
    } finally {
      setLoading(false)
    }
  }

  const handleHideArchived = () => {
    setShowArchived(false);
    setArchivedList([]);
  }
  
  return (
    <div className='list-container'>
      <div className="list-header">
        <h1 className="list-title">{showArchived ? 'Archived Foods' : 'All Foods List'}</h1>
        <div className="list-stats">
          {!showArchived && <span className="stats-badge">Total: {filteredList.length}</span>}
          {!showArchived && (
            <button 
              className="archived-btn"
              onClick={fetchArchivedList}
              disabled={loading || !token}
              title={!token ? "Please login to view archived items" : ""}
            >
              {loading ? 'Loading...' : 'Show Archived'}
            </button>
          )}
          {showArchived && (
            <button 
              className="hide-archived-btn"
              onClick={handleHideArchived}
              disabled={loading}
            >
              Hide Archived
            </button>
          )}
        </div>
      </div>

      {showArchived ? (
        <>
          {archivedList.length > 0 ? (
            <div className="archived-grid">
              {archivedList.map((item) => (
                <div key={item._id} className="archived-card">
                  <div className="archived-image">
                    <img 
                      src={`${url}/uploads/items/${item.image}`} 
                      alt={item.name}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/200?text=No+Image';
                      }}
                    />
                  </div>
                  <div className="archived-info">
                    <h3>{item.name}</h3>
                    <p className="archived-category">{item.category}</p>
                    <p className="archived-price">₱{Number(item.price).toFixed(2)}</p>
                    <p className="archived-date">
                      Archived: {new Date(item.deletedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="archived-actions">
                    <button 
                      className="restore-btn"
                      onClick={() => restoreFood(item._id)}
                      disabled={loading}
                    >
                      Restore
                    </button>
                    <button 
                      className="permanent-delete-btn"
                      onClick={() => handlePermanentDelete(item._id)}
                      disabled={loading}
                    >
                      Delete Forever
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No archived items found.</p>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="list-filters">
            <div className="filter-group">
              <label>Search:</label>
              <input
                type="text"
                placeholder="Search by name or description..."
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
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
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
                setSortBy("a-z");
                setFilterCategory("all");
                setSearchTerm("");
              }}
            >
              Clear Filters
            </button>
          </div>

          <div className="list-table-wrapper">
            <table className="list-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Allergens</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length > 0 ? (
                  filteredList.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <img src={`${url}/uploads/items/${item.image}`} alt={item.name} />
                      </td>
                      <td className="name-cell">{item.name}</td>
                      <td className="description-cell">{item.description}</td>
                      <td>{item.category}</td>
                      <td className="price-cell">₱{Number(item.price).toFixed(2)}</td>
                      <td className="allergens-cell">
                        {item.allergens && item.allergens.length > 0 
                          ? item.allergens.join(", ") 
                          : "None"}
                      </td>
                      <td className="action-cell">
                        <button className='edit-btn' onClick={() => {
                          setEditId(item._id);
                          setEditData({ 
                            name: item.name,
                            category: item.category,
                            price: item.price,
                            description: item.description,
                            allergens: normalizeAllergens(item.allergens),
                            image: null,
                            imagePreview: `${url}/uploads/items/${item.image}`
                          });
                        }} disabled={loading}>Edit</button>
                        <button
                          onClick={() => setDeleteId(item._id)}
                          className='delete-btn'
                          disabled={loading}
                        >
                          Archive
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="no-results">
                      No items found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {editId && (
        <div className="edit-popup">
          <div className="edit-popup-overlay" onClick={() => setEditId(null)}></div>
          <form className="edit-popup-container" onSubmit={updateFood}>
            <h3>Edit Product</h3>
            
            {/* Image Section */}
            <div className="edit-image-section">
              {editData.imagePreview && (
                <div className="edit-image-preview">
                  <img src={editData.imagePreview} alt="Preview" />
                </div>
              )}
              <label htmlFor="edit-image">Product Image</label>
              <input
                id="edit-image"
                type="file"
                accept="image/*"
                onChange={handleEditImageChange}
                disabled={loading}
              />
            </div>
            
            <label htmlFor="edit-name">Name</label>
            <input
              id="edit-name"
              type="text"
              value={editData.name}
              onChange={e => setEditData({ ...editData, name: e.target.value })}
              placeholder="Name"
              required
              disabled={loading}
            />
            <div className="edit-row">
              <div>
                <label htmlFor="edit-category">Category</label>
                <select
                  id="edit-category"
                  value={editData.category}
                  onChange={e => setEditData({ ...editData, category: e.target.value })}
                  required
                  disabled={loading}
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="edit-price">Price</label>
                <input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={editData.price}
                  onChange={e => setEditData({ ...editData, price: e.target.value })}
                  placeholder="Price"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <label htmlFor="edit-description">Description</label>
            <textarea
              id="edit-description"
              value={editData.description}
              onChange={e => setEditData({ ...editData, description: e.target.value })}
              placeholder="Description"
              rows={4}
              disabled={loading}
            />
            
            <label>Allergens</label>
            <div className="edit-allergens-grid">
              {allergensList.map((allergen) => (
                <label key={allergen} className="edit-allergen-checkbox">
                  <input
                    type="checkbox"
                    checked={editData.allergens.includes(allergen)}
                    onChange={() => handleAllergenToggle(allergen)}
                    disabled={loading}
                  />
                  <span> {allergen}</span>
                </label>
              ))}
            </div>
            
            <div className="edit-buttons">
              <button type="submit" disabled={loading}>Save Changes</button>
              <button type="button" onClick={() => setEditId(null)} disabled={loading}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      
      {deleteId && (
        <div className="delete-popup">
          <div className="delete-popup-overlay" onClick={() => setDeleteId(null)}></div>
          <div className="delete-popup-container">
            <h3>Confirm Archive</h3>
            <p>Are you sure you want to archive this food item?</p>
            <div className="delete-popup-actions">
              <button
                className="confirm-delete"
                onClick={async () => {
                  await removeFood(deleteId);
                  setDeleteId(null);
                }}
                disabled={loading}
              >
                Yes, Archive
              </button>
              <button className="cancel-delete" onClick={() => setDeleteId(null)} disabled={loading}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default List