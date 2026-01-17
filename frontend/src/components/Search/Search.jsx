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

        setSearchResults(results);
    };

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

    return (
        <>
            <div className='search-overlay' onClick={handleClose}>
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
                                                src={item.image} 
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
                />
            )}
        </>
    )
}

export default Search