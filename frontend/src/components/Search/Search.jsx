import React, { useContext, useState } from 'react'
import './Search.css'
import { StoreContext } from '../../context/StoreContext'
import { assets } from '../../assets/assets'
import FoodItemModal from '../FoodItemModal/FoodItemModal'

const Search = ({ onClose }) => { // Add onClose prop
    const { food_list, addToCart, url } = useContext(StoreContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(true); // Start with true
    const [selectedFood, setSelectedFood] = useState(null);
    const [sortBy, setSortBy] = useState('relevance'); // relevance, price-low, price-high, rating
    const [filterCategory, setFilterCategory] = useState('all');
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [categories, setCategories] = useState([]);

    // Get unique categories from food list
    React.useEffect(() => {
        const uniqueCategories = [...new Set(food_list.map(item => item.category))];
        setCategories(uniqueCategories);
    }, [food_list]);

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);

        if (value.trim() === '') {
            setSearchResults([]);
            return;
        }

        // Filter food items based on search term
        const results = food_list.filter(item =>
            item.name.toLowerCase().includes(value.toLowerCase()) ||
            item.description.toLowerCase().includes(value.toLowerCase()) ||
            item.category.toLowerCase().includes(value.toLowerCase())
        );

        // Apply category filter
        const categoryFiltered = filterCategory === 'all' 
            ? results 
            : results.filter(item => item.category === filterCategory);

        // Apply price range filter
        let priceFiltered = categoryFiltered;
        if (priceRange.min !== '') {
            priceFiltered = priceFiltered.filter(item => item.price >= parseFloat(priceRange.min));
        }
        if (priceRange.max !== '') {
            priceFiltered = priceFiltered.filter(item => item.price <= parseFloat(priceRange.max));
        }

        // Apply sorting
        let sorted = [...priceFiltered];
        switch (sortBy) {
            case 'price-low':
                sorted.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                sorted.sort((a, b) => b.price - a.price);
                break;
            case 'rating':
                sorted.sort((a, b) => {
                    const avgA = a.ratings?.length ? a.ratings.reduce((sum, r) => sum + r.rating, 0) / a.ratings.length : 0;
                    const avgB = b.ratings?.length ? b.ratings.reduce((sum, r) => sum + r.rating, 0) / b.ratings.length : 0;
                    return avgB - avgA;
                });
                break;
            default: // relevance
                break;
        }

        setSearchResults(sorted);
    };

    const handleFilterChange = () => {
        // Reapply search with current filters
        handleSearch({ target: { value: searchTerm } });
    };

    // Re-apply filters when they change
    React.useEffect(() => {
        if (searchTerm) {
            handleFilterChange();
        }
    }, [sortBy, filterCategory, priceRange]);

    const handleFoodClick = (food) => {
        setSelectedFood(food);
        setShowResults(false);
    };

    const handleCloseModal = () => {
        setSelectedFood(null);
        setShowResults(true);
    };

    const handleAddToCart = (id, amount) => {
        for (let i = 0; i < amount; i++) {
            addToCart(id);
        }
    };

    const handleClose = () => {
        if (onClose) {
            onClose();
        }
    };

    const getImageUrl = (img) => {
        if (!img) return ''
        return img.startsWith('http') ? img : ''
    }

    return (
        <>
            <div className={`search-overlay ${selectedFood ? 'hidden' : ''}`} onClick={handleClose}>
                <div className='search-modal' onClick={(e) => e.stopPropagation()}>
                    <div className='search-header'>
                        <h2>Search Menu</h2>
                        <button className='search-close-btn' onClick={handleClose}>✕</button>
                    </div>

                    <div className='search-bar'>
                        <img src={assets.search_icon} alt="search" />
                        <input
                            type="text"
                            placeholder='Search for food...'
                            value={searchTerm}
                            onChange={handleSearch}
                            autoFocus
                        />
                        {searchTerm && (
                            <button 
                                className='clear-search'
                                onClick={() => {
                                    setSearchTerm('');
                                    setSearchResults([]);
                                }}
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {searchTerm && (
                        <div className='filters-container'>
                            <div className='filter-group'>
                                <label>Category:</label>
                                <select 
                                    value={filterCategory} 
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                >
                                    <option value='all'>All Categories</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div className='filter-group'>
                                <label>Sort by:</label>
                                <select 
                                    value={sortBy} 
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    <option value='relevance'>Relevance</option>
                                    <option value='price-low'>Price: Low to High</option>
                                    <option value='price-high'>Price: High to Low</option>
                                    <option value='rating'>Highest Rated</option>
                                </select>
                            </div>

                            <div className='filter-group price-filter'>
                                <label>Price Range:</label>
                                <div className='price-inputs'>
                                    <input 
                                        type='number' 
                                        placeholder='Min' 
                                        value={priceRange.min}
                                        onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                                    />
                                    <span>-</span>
                                    <input 
                                        type='number' 
                                        placeholder='Max' 
                                        value={priceRange.max}
                                        onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {showResults && (
                        <>
                            {searchResults.length > 0 ? (
                                <div className='search-results-list'>
                                    <p className='results-count'>{searchResults.length} items found</p>
                                    {searchResults.map((item) => (
                                        <div 
                                            key={item._id} 
                                            className='search-result-item'
                                            onClick={() => handleFoodClick(item)}
                                        >
                                            <img 
                                                src={getImageUrl(item.image)} 
                                                alt={item.name} 
                                            />
                                            <div className='search-result-info'>
                                                <h4>{item.name}</h4>
                                                <p className='search-result-category'>{item.category}</p>
                                                <p className='search-result-description'>{item.description}</p>
                                                <p className='search-result-price'>₱{item.price}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : searchTerm ? (
                                <div className='no-results'>
                                    <p>No food items match "{searchTerm}"</p>
                                    <p>Try searching with different keywords</p>
                                </div>
                            ) : (
                                <div className='search-placeholder'>
                                    <img src={assets.search_icon} alt="search" />
                                    <p>Start typing to search for food items</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {selectedFood && (
                <FoodItemModal 
                    item={selectedFood}
                    items={food_list}
                    onClose={handleCloseModal}
                    onAddToCart={handleAddToCart}
                    url={url}
                    onItemClick={(item) => setSelectedFood(item)}
                />
            )}
        </>
    )
}

export default Search