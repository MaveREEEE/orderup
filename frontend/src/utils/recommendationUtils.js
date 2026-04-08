import { useState, useEffect } from 'react';
import axios from 'axios';

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
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        const response = await axios.get(`${backendUrl}/api/recommend/${userId}?top_n=${topN}`, {
          timeout: 30000
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

export const getRecommendations = async (userId, topN = 10) => {
  try {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    const response = await axios.get(`${backendUrl}/api/recommend/${userId}?top_n=${topN}`, {
      timeout: 30000
    });
    return response.data.recommendations || [];
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return [];
  }
};
