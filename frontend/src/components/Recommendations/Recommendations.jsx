import React, { useContext, useState } from 'react';
import './Recommendations.css';
import { StoreContext } from '../../context/StoreContext';
import { useRecommendations } from '../../utils/recommendationUtils';
import FoodItem from '../FoodItem/FoodItem';
import FoodItemModal from '../FoodItemModal/FoodItemModal';


const Recommendations = ({ userId, showTitle = true }) => {
  const { food_list, url, addToCart  } = useContext(StoreContext);
  const { recommendations, loading, error } = useRecommendations(userId, 10);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Filter food_list to get only recommended items
  const recommendedFoods = recommendations
    .map(foodId => food_list.find(item => item._id?.toString() === foodId?.toString()))
    .filter(item => item !== undefined);

  if (!userId) {
    return null;
  }

  if (loading) {
    return (
      <div className='recommendations-section'>
        {showTitle && <h2>Recommended For You</h2>}
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading recommendations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Recommendations error:', error);
    return null; // Silently fail without breaking the UI
  }

  if (recommendedFoods.length === 0) {
    return null; // No recommendations to show
  }

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedItem(null);
  };

  return (
    <div className='recommendations-section'>
      {showTitle && <h2>Recommended For You</h2>}
      <div className="recommendations-list scrollable-horizontal">
        {recommendedFoods.slice(0, 10).map((item, index) => (
          <div
            key={index}
            className="recommendation-item-wrapper"
            onClick={() => !modalOpen && handleItemClick(item)}
            style={{ cursor: modalOpen ? 'default' : 'pointer' }}
          >
            <FoodItem
              id={item._id}
              name={item.name}
              description={item.description}
              price={item.price}
              image={item.image}
              batches={item.batches}
              ratings={item.ratings}
              averageRating={item.averageRating}
              url={url}
              hideButton={true}
            />
          </div>
        ))}
      </div>
      {modalOpen && selectedItem && (
        <FoodItemModal
          item={selectedItem}
          items={recommendedFoods}
          url={url}
          onClose={handleCloseModal}
          onAddToCart={(addToCart ) => {}}
          onItemClick={item => {
            setSelectedItem(item);
          }}
        />
      )}
    </div>
  );
};

export default Recommendations;
