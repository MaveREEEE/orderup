import React, { useContext } from 'react';
import './Recommendations.css';
import { StoreContext } from '../../context/StoreContext';
import { useRecommendations } from '../../utils/recommendationUtils';
import FoodItem from '../FoodItem/FoodItem';

const Recommendations = ({ userId, showTitle = true }) => {
  const { food_list, url } = useContext(StoreContext);
  const { recommendations, loading, error } = useRecommendations(userId, 10);

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

  return (
    <div className='recommendations-section'>
      {showTitle && <h2>Recommended For You</h2>}
      <div className="recommendations-list">
        {recommendedFoods.slice(0, 5).map((item, index) => (
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
            url={url}
          />
        ))}
      </div>
    </div>
  );
};

export default Recommendations;
