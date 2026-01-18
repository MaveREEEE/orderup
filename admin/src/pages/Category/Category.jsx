import React, { useState, useEffect, useRef } from 'react'
import './Category.css'
import axios from 'axios'
import { toast } from 'react-toastify'

const Category = ({ url, token }) => {
    const [categories, setCategories] = useState([])
    const [archivedCategories, setArchivedCategories] = useState([])
    const [showArchived, setShowArchived] = useState(false)
    const [name, setName] = useState("")
    const [image, setImage] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [editMode, setEditMode] = useState(false)
    const [editId, setEditId] = useState(null)
    const [loading, setLoading] = useState(false)
    const fileInputRef = useRef(null)

    useEffect(() => {
        fetchCategories()
    }, [])

    const getImageUrl = (img) => {
        if (!img) return null;
        return img.startsWith('http') ? img : `${url}/uploads/categories/${img}`;
    }

    useEffect(() => {
        console.log("Category Debug:");
        console.log("  Token:", token ? "Present" : "Missing");
        console.log("  User Role:", localStorage.getItem("userRole"));
        console.log("  URL:", url);
    }, [token])

    const fetchCategories = async () => {
        try {
            setLoading(true)
            console.log("Fetching categories from:", `${url}/api/category/list`);
            
            const response = await axios.get(`${url}/api/category/list`);
            console.log("Categories response:", response.data);
            
            if (response.data.success) {
                setCategories(response.data.data || []);
                if (response.data.data?.length === 0) {
                    toast.info("No categories found. Add your first category!");
                }
            } else {
                toast.error(response.data.message || "Failed to fetch categories");
            }
        } catch (error) {
            console.error("Fetch error:", error);
            toast.error(error.response?.data?.message || "Failed to fetch categories");
        } finally {
            setLoading(false)
        }
    }

    const fetchArchivedCategories = async () => {
        if (!token) {
            toast.error("Please login to view archived categories");
            return;
        }

        try {
            setLoading(true)
            console.log("Fetching archived categories...");
            
            const response = await axios.get(`${url}/api/category/archived/list`, {
                headers: { token }
            });
            
            console.log("Archived response:", response.data);
            
            if (response.data.success) {
                setArchivedCategories(response.data.data || []);
                setShowArchived(true);
                
                if (response.data.data?.length === 0) {
                    toast.info("No archived categories found");
                } else {
                    toast.success(`Found ${response.data.data.length} archived categories`);
                }
            } else {
                toast.error(response.data.message || "Failed to fetch archived categories");
            }
        } catch (error) {
            console.error("Fetch archived error:", error);
            console.error("Error details:", error.response?.data);
            
            if (error.response?.status === 401) {
                toast.error("Session expired. Please login again");
            } else {
                toast.error(error.response?.data?.message || "Failed to fetch archived categories");
            }
        } finally {
            setLoading(false)
        }
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!token) {
            toast.error("Please login to perform this action");
            return;
        }

        if (!name.trim()) {
            toast.error("Category name is required");
            return;
        }

        const formData = new FormData();
        formData.append("name", name.trim());
        if (image) {
            formData.append("image", image);
        }

        try {
            setLoading(true)
            let response;
            
            if (editMode) {
                console.log("Updating category:", editId);
                response = await axios.put(
                    `${url}/api/category/update/${editId}`,
                    formData,
                    { 
                        headers: { 
                            token,
                            'Content-Type': 'multipart/form-data'
                        } 
                    }
                );
            } else {
                console.log("Adding new category");
                response = await axios.post(
                    `${url}/api/category/add`,
                    formData,
                    { 
                        headers: { 
                            token,
                            'Content-Type': 'multipart/form-data'
                        } 
                    }
                );
            }

            console.log("Response:", response.data);

            if (response.data.success) {
                toast.success(response.data.message || "Operation successful");
                resetForm();
                fetchCategories();
            } else {
                toast.error(response.data.message || "Operation failed");
            }
        } catch (error) {
            console.error("Submit error:", error);
            toast.error(error.response?.data?.message || "Operation failed");
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (category) => {
        setEditMode(true);
        setEditId(category._id);
        setName(category.name);
        setImage(null);
        setImagePreview(getImageUrl(category.image));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const handleDelete = async (id) => {
        if (!token) {
            toast.error("Please login to perform this action");
            return;
        }

        if (!window.confirm("Are you sure you want to archive this category?")) {
            return;
        }

        try {
            setLoading(true)
            console.log("Deleting category:", id);
            
            const response = await axios.post(
                `${url}/api/category/remove`,
                { id },
                { headers: { token } }
            );
            
            console.log("Response:", response.data);

            if (response.data.success) {
                toast.success(response.data.message || "Category archived successfully");
                fetchCategories();
            } else {
                toast.error(response.data.message || "Failed to archive category");
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast.error(error.response?.data?.message || "Failed to archive category");
        } finally {
            setLoading(false)
        }
    }

    const handleRestore = async (id) => {
        if (!token) {
            toast.error("Please login to perform this action");
            return;
        }

        if (!window.confirm("Are you sure you want to restore this category?")) {
            return;
        }

        try {
            setLoading(true)
            console.log("Restoring category:", id);
            
            const response = await axios.post(
                `${url}/api/category/restore`,
                { id },
                { headers: { token } }
            );
            
            console.log("Response:", response.data);

            if (response.data.success) {
                toast.success(response.data.message || "Category restored successfully");
                fetchArchivedCategories();
                fetchCategories();
            } else {
                toast.error(response.data.message || "Failed to restore category");
            }
        } catch (error) {
            console.error("Restore error:", error);
            toast.error(error.response?.data?.message || "Failed to restore category");
        } finally {
            setLoading(false)
        }
    }

    const handlePermanentDelete = async (id) => {
        if (!token) {
            toast.error("Please login to perform this action");
            return;
        }

        if (!window.confirm("⚠️ This will PERMANENTLY delete this category and its image. This cannot be undone. Are you sure?")) {
            return;
        }

        try {
            setLoading(true)
            console.log("Permanently deleting category:", id);
            
            const response = await axios.post(
                `${url}/api/category/permanently-delete`,
                { id },
                { headers: { token } }
            );
            
            console.log("Response:", response.data);

            if (response.data.success) {
                toast.success(response.data.message || "Category permanently deleted");
                fetchArchivedCategories();
            } else {
                toast.error(response.data.message || "Failed to permanently delete category");
            }
        } catch (error) {
            console.error("Permanent delete error:", error);
            toast.error(error.response?.data?.message || "Failed to permanently delete category");
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setEditMode(false);
        setEditId(null);
        setName("");
        setImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    const cancelEdit = () => {
        resetForm();
    }

    const handleHideArchived = () => {
        setShowArchived(false);
        setArchivedCategories([]);
    }

    if (loading && categories.length === 0) {
        return (
            <div className="category-container">
                <div className="loading-message">
                    <p>Loading categories...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="category-container">
            <form onSubmit={handleSubmit} className="category-form">
                <h2>{editMode ? 'Edit Category' : 'Add Category'}</h2>
                
                <div className="form-group">
                    <label>Category Name *</label>
                    <input
                        type="text"
                        placeholder="Enter category name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={loading}
                        maxLength={50}
                    />
                </div>

                <div className="form-group">
                    <label>Category Image</label>
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleImageChange}
                        accept="image/*"
                        disabled={loading}
                    />
                    {imagePreview && (
                        <div className="image-preview">
                            <img src={imagePreview} alt="Preview" />
                        </div>
                    )}
                </div>

                <div className="form-buttons">
                    <button type="submit" disabled={loading} className="submit-btn">
                        {loading ? 'Processing...' : (editMode ? 'Update Category' : 'Add Category')}
                    </button>
                    {editMode && (
                        <button 
                            type="button" 
                            onClick={cancelEdit} 
                            className="cancel-btn" 
                            disabled={loading}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            <div className="categories-list">
                <div className="list-header">
                    <h2>{showArchived ? 'Archived Categories' : 'Categories'}</h2>
                    <div className="header-buttons">
                        {!showArchived && (
                            <button 
                                onClick={fetchArchivedCategories}
                                disabled={loading || !token}
                                className="archive-btn"
                            >
                                {loading ? 'Loading...' : 'Show Archived'}
                            </button>
                        )}
                        {showArchived && (
                            <button 
                                onClick={handleHideArchived}
                                disabled={loading}
                                className="hide-archive-btn"
                            >
                                Hide Archived
                            </button>
                        )}
                    </div>
                </div>

                <div className="categories-grid">
                    {showArchived ? (
                        archivedCategories.length > 0 ? (
                            archivedCategories.map((category) => (
                                <div key={category._id} className="category-card archived">
                                    {category.image && (
                                        <div className="category-image">
                                            <img
                                                src={getImageUrl(category.image)}
                                                alt={category.name}
                                                onError={(e) => {
                                                    e.target.src = 'https://via.placeholder.com/200?text=No+Image';
                                                }}
                                            />
                                        </div>
                                    )}
                                    <div className="category-info">
                                        <h3>{category.name}</h3>
                                        <p className="archived-date">
                                            Archived: {new Date(category.deletedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="category-actions">
                                        <button 
                                            onClick={() => handleRestore(category._id)} 
                                            disabled={loading}
                                            className="restore-btn"
                                        >
                                            Restore
                                        </button>
                                        <button 
                                            onClick={() => handlePermanentDelete(category._id)} 
                                            disabled={loading}
                                            className="permanent-delete-btn"
                                        >
                                            Delete Forever
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <p>No archived categories found.</p>
                            </div>
                        )
                    ) : (
                        categories.length > 0 ? (
                            categories.map((category) => (
                                <div key={category._id} className="category-card">
                                    {category.image && (
                                        <div className="category-image">
                                            <img
                                                src={getImageUrl(category.image)}
                                                alt={category.name}
                                                onError={(e) => {
                                                    e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="%23ddd" width="200" height="200"/><text fill="%23999" x="50%" y="50%" text-anchor="middle" dy=".3em">No Image</text></svg>';
                                                }}
                                            />
                                        </div>
                                    )}
                                    <div className="category-info">
                                        <h3>{category.name}</h3>
                                    </div>
                                    <div className="category-actions">
                                        <button 
                                            onClick={() => handleEdit(category)} 
                                            disabled={loading}
                                            className="edit-btn"
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(category._id)} 
                                            disabled={loading}
                                            className="delete-btn"
                                        >
                                            Archive
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <p>No categories found. Add your first category!</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    )
}

export default Category