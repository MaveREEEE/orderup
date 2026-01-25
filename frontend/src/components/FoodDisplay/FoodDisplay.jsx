import React, { useContext, useState } from 'react';
import './foodDisplay.css';
import { StoreContext } from '../../context/StoreContext';
import FoodItem from '../FoodItem/FoodItem';
import FoodItemModal from '../FoodItemModal/FoodItemModal';

const FoodDisplay = ({ category }) => {
  const { food_list, addToCart, url } = useContext(StoreContext);
  const [selectedItem, setSelectedItem] = useState(null);

  return (
    <div className='food-display' id='food-display'>
      <h2>Available Dishes</h2>
      <div className="food-display-list">
        {food_list.map((item, index) => {
          if (category === "All" || category === item.category) {
            return (
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
            );
          }
          return null;
        })}
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