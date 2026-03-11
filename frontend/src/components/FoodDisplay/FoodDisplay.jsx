import React, { useContext, useState } from 'react';
import './foodDisplay.css';
import { StoreContext } from '../../context/StoreContext';
import FoodItem from '../FoodItem/FoodItem';
import FoodItemModal from '../FoodItemModal/FoodItemModal';

const FoodDisplay = ({ category }) => {
  const { food_list, addToCart, url } = useContext(StoreContext);
  const [selectedItem, setSelectedItem] = useState(null);

  // Filter items by category and sort so unavailable items appear at bottom
  const displayItems = food_list
    .filter(item => category === "All" || category === item.category)
    .sort((a, b) => {
      const aStock = a.batches?.reduce((sum, batch) => sum + batch.quantity, 0) || 0;
      const bStock = b.batches?.reduce((sum, batch) => sum + batch.quantity, 0) || 0;
      const aUnavailable = aStock === 0;
      const bUnavailable = bStock === 0;
      
      // Available items first, unavailable at bottom
      if (aUnavailable && !bUnavailable) return 1;
      if (!aUnavailable && bUnavailable) return -1;
      return 0;
    });

  return (
    <div className='food-display' id='food-display'>
      <h2>Available Dishes</h2>
      <div className="food-display-list">
        {displayItems.map((item, index) => (
          <FoodItem
            key={index}
            id={item._id}
            name={item.name}
            description={item.description}
            price={item.price}
            image={item.image}
            batches={item.batches}
            ratings={item.ratings}
            averageRating={item.averageRating}
            onView={() => setSelectedItem(item)}
            url={url}
            hideDescriptionOnMobile={true}
          />
        ))}
      </div>

      {selectedItem && (
        <FoodItemModal
          item={selectedItem}
          items={food_list}
          onClose={() => setSelectedItem(null)}
          onAddToCart={addToCart}
          url={url}
          onItemClick={(item) => setSelectedItem(item)}
        />
      )}
    </div>
  );
};

export default FoodDisplay;