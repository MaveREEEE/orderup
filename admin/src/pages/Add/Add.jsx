import React, { useState, useEffect } from 'react'
import './add.css'
import { assets } from '../../assets/assets'
import axios from "axios"
import { toast } from 'react-toastify'

const Add = ({ url, token }) => {
    const [image, setImage] = useState(false);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState({
        name: "",
        description: "",
        price: "",
        category: "",
        stock: 0,
        lowStockThreshold: 10,
        allergens: []
    })

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

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                console.log("Fetching categories from:", `${url}/api/category/list`);
                
                const response = await axios.get(`${url}/api/category/list`);
                console.log("Categories response:", response.data);
                
                if (response.data.success) {
                    const categoryList = response.data.data || [];
                    setCategories(categoryList);
                    
                    if (categoryList.length > 0) {
                        setData(prevData => ({ 
                            ...prevData, 
                            category: categoryList[0].name 
                        }));
                    } else {
                        toast.info("No categories found. Please add categories first.");
                    }
                } else {
                    toast.error(response.data.message || "Failed to fetch categories");
                }
            } catch (error) {
                console.error("Fetch categories error:", error);
                toast.error("Failed to fetch categories");
            }
        };
        
        fetchCategories();
    }, [url]);

    const onChangeHandler = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        
        if (name === "description" && value.length > 300) {
            return;
        }
        
        setData(data => ({ ...data, [name]: value }));
    }

    const handleAllergenToggle = (allergen) => {
        setData(prevData => {
            const allergens = prevData.allergens.includes(allergen)
                ? prevData.allergens.filter(a => a !== allergen)
                : [...prevData.allergens, allergen];
            return { ...prevData, allergens };
        });
    }

    const onSubmitHandler = async (event) => {
        event.preventDefault();

        if (!data.name.trim()) {
            toast.error("Product name is required");
            return;
        }

        if (!data.description.trim()) {
            toast.error("Product description is required");
            return;
        }

        if (data.description.trim().length > 300) {
            toast.error("Description must not exceed 300 characters");
            return;
        }

        if (!data.price || parseFloat(data.price) <= 0) {
            toast.error("Valid price is required");
            return;
        }

        if (!data.category) {
            toast.error("Please select a category");
            return;
        }

        if (!image) {
            toast.error("Please upload an image");
            return;
        }

        if (!token) {
            toast.error("Authentication required. Please login again.");
            return;
        }

        try {
            setLoading(true);
            
            const formData = new FormData();
            formData.append("name", data.name.trim());
            formData.append("description", data.description.trim());
            formData.append("price", Number(data.price));
            formData.append("category", data.category);
            formData.append("stock", Number(data.stock));
            formData.append("lowStockThreshold", 10);
            formData.append("allergens", JSON.stringify(data.allergens));
            formData.append("image", image);

            console.log("Submitting food item...");

            const response = await axios.post(`${url}/api/food/add`, formData, {
                headers: {
                    'token': token,
                    'Content-Type': 'multipart/form-data'  
                }
            });

            console.log("Add food response:", response.data);

            if (response.data.success) {
                setData({
                    name: "",
                    description: "",
                    price: "",
                    category: categories[0]?.name || "",
                    stock: 0,
                    lowStockThreshold: 10,
                    allergens: []
                });
                setImage(false);
                toast.success(response.data.message || "Product added successfully!");
            } else {
                toast.error(response.data.message || "Failed to add product");
            }
        } catch (error) {
            console.error("Error adding food:", error);
            console.error("Error response:", error.response?.data);
            
            if (error.response?.status === 401) {
                toast.error("Authentication failed. Please login again.");
            } else if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error("Error adding food item. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className='add'>
            <h2>Add New Item</h2>
            
            <form className='flex-col' onSubmit={onSubmitHandler}>
                <div className="add-img-upload flex-col">
                    <p>Upload Image</p>
                    <label htmlFor="image">
                        <img src={image ? URL.createObjectURL(image) : assets.upload_area} alt="" />
                    </label>
                    <input 
                        onChange={(e) => setImage(e.target.files[0])} 
                        type="file" 
                        id="image" 
                        hidden 
                        required 
                        disabled={loading}
                    />
                </div>
                <div className="add-product-name flex-col">
                    <p>Product Name</p>
                    <input 
                        onChange={onChangeHandler} 
                        value={data.name} 
                        type="text" 
                        name='name' 
                        placeholder='Type here' 
                        disabled={loading}
                    />
                </div>
                <div className="add-product-description flex-col">
                    <p>Product Description</p>
                    <textarea 
                        onChange={onChangeHandler} 
                        value={data.description} 
                        name="description" 
                        rows="6" 
                        placeholder='Write content here (max 300 characters)' 
                        maxLength="300"
                        required
                        disabled={loading}
                    ></textarea>
                    <p style={{ 
                        fontSize: '12px', 
                        color: data.description.length >= 300 ? '#ff4444' : '#666',
                        marginTop: '5px',
                        textAlign: 'right'
                    }}>
                        {data.description.length}/300 characters
                    </p>
                </div>
                <div className="add-category-price">
                    <div className="add-category flex-col">
                        <p>Product Category</p>
                        <select 
                            onChange={onChangeHandler} 
                            name="category" 
                            value={data.category}
                            disabled={loading || categories.length === 0}
                        >
                            {categories.length > 0 ? (
                                categories.map(cat => (
                                    <option key={cat._id} value={cat.name}>{cat.name}</option>
                                ))
                            ) : (
                                <option value="">No categories available</option>
                            )}
                        </select>
                    </div>
                    <div className="add-price flex-col">
                        <p>Product price</p>
                        <input 
                            onChange={onChangeHandler} 
                            value={data.price} 
                            type="Number" 
                            name='price' 
                            placeholder='₱20' 
                            disabled={loading}
                        />
                    </div>
                </div>
                <div className="add-allergens flex-col">
                    <p>Allergens (select all that apply)</p>
                    <div className="allergens-grid">
                        {allergensList.map((allergen) => (
                            <label key={allergen} className="allergen-checkbox">
                                <input
                                    type="checkbox"
                                    checked={data.allergens.includes(allergen)}
                                    onChange={() => handleAllergenToggle(allergen)}
                                    disabled={loading}
                                />
                                <span>{allergen}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <button type='submit' className='add-btn' disabled={loading || categories.length === 0}>
                    {loading ? 'ADDING...' : 'ADD'}
                </button>
            </form>
        </div>
    )
}

export default Add