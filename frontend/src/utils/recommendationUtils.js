import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Custom hook to fetch food recommendations from the recommender API
 * @param {string} userId - The user ID to get recommendations for
 * @param {number} topN - Number of recommendations to fetch (default: 10)
 * @returns {Object} - { recommendations, loading, error }
 */
export const useRecommendations = (userId, topN = 10) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setRecommendations([]);
      return;
    }

    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);
      try {
        const recommenderUrl = import.meta.env.VITE_RECOMMENDER_URL || 'http://127.0.0.1:8000';
        const response = await axios.get(`${recommenderUrl}/recommend/${userId}?top_n=${topN}`, {
          timeout: 5000 // 5 second timeout
        });
        
        if (response.data && response.data.recommendations) {
          setRecommendations(response.data.recommendations);
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError(err.message || 'Failed to fetch recommendations');
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [userId, topN]);

  return { recommendations, loading, error };
};

/**
 * Utility function to get recommendations (without hook)
 * Useful for one-time calls outside of React components
 */
export const getRecommendations = async (userId, topN = 10) => {
  try {
    const recommenderUrl = import.meta.env.VITE_RECOMMENDER_URL || 'http://127.0.0.1:8000';
    const response = await axios.get(`${recommenderUrl}/recommend/${userId}?top_n=${topN}`, {
      timeout: 5000
    });
    return response.data.recommendations || [];
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return [];
  }
};
