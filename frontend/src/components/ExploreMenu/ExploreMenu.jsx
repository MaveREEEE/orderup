import React, { useEffect, useState } from 'react'
import './ExploreMenu.css'
const ExploreMenu = ({ category, setCategory, url }) => {
  const [categories, setCategories] = useState([]);
  
  const getImageUrl = (img) => {
    if (!img) return ''
    return img.startsWith('http') ? img : ''
  }
  
  useEffect(() => {
    const fetchCategories = async () => {
      const res = await fetch(`${url}/api/category/list`);
      const data = await res.json();
      if (data.success && Array.isArray(data.categories)) {
        setCategories(data.categories);
      }
    };
    fetchCategories();
  }, [url]);

  return (
    <div className='explore-menu' id='explore-menu'>
      <h1>Explore Our Menu</h1>
      <div className="explore-menu-list">
        {categories.map((item) => (
          <div
            key={item._id}
            className="explore-menu-list-item"
            onClick={() => setCategory(category === item.name ? "All" : item.name)}
          >
            <img
              src={getImageUrl(item.image)}
              alt={item.name}
              className={category === item.name ? 'active' : ''}
            />
            <p>{item.name}</p>
          </div>
          
        ))}
      </div>
    </div>
  );
};

export default ExploreMenu;
