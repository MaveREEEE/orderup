import React, { useState, useEffect, useContext } from 'react'
import './Header.css'
import { StoreContext } from '../../context/StoreContext'
import FoodItemModal from '../FoodItemModal/FoodItemModal'

const Header = () => {
   const [menu, setMenu] = useState("home");
   const { food_list, url, addToCart } = useContext(StoreContext);
   const [bestSellers, setBestSellers] = useState([]);
   const [currentIndex, setCurrentIndex] = useState(0);
   const [showModal, setShowModal] = useState(false);
   const [selectedItem, setSelectedItem] = useState(null);

   useEffect(() => {
      // Get top 5 best selling items
      if (food_list && food_list.length > 0) {
         setBestSellers(food_list.slice(0, 5));
      }
   }, [food_list]);

   // Auto-swipe functionality
   useEffect(() => {
      if (bestSellers.length === 0) return;
      
      const interval = setInterval(() => {
         setCurrentIndex((prevIndex) => 
            prevIndex === bestSellers.length - 1 ? 0 : prevIndex + 1
         );
      }, 3000); // Auto-swipe every 3 seconds

      return () => clearInterval(interval);
   }, [bestSellers]);

   const goToSlide = (index) => {
      setCurrentIndex(index);
   };

   const goToPrevious = () => {
      setCurrentIndex((prevIndex) => 
         prevIndex === 0 ? bestSellers.length - 1 : prevIndex - 1
      );
   };

   const goToNext = () => {
      setCurrentIndex((prevIndex) => 
         prevIndex === bestSellers.length - 1 ? 0 : prevIndex + 1
      );
   };

   return (
      <div className='header'>

         {/* Best Sellers Carousel */}
         {bestSellers.length > 0 && (
            <>
               <h3 className="best-sellers-title">Best Sellers</h3>
               <div className="carousel-container">
                  <button className="carousel-btn prev" onClick={goToPrevious}>❮</button>
                  
                  <div className="best-seller-card">
                     <div className="best-seller-badge">Best Seller</div>
                     <img 
                        src={`${url}/uploads/items/${bestSellers[currentIndex].image}`} 
                        alt={bestSellers[currentIndex].name} 
                        className="best-seller-image" 
                     />
                     <div className="best-seller-info">
                        <h4>{bestSellers[currentIndex].name}</h4>
                        <div className="best-seller-footer">
                           <button className="best-seller-btn" onClick={() => {
                              setSelectedItem(bestSellers[currentIndex]);
                              setShowModal(true);
                           }}>Order Now</button>
                        </div>
                     </div>
                  </div>
                  
                  <button className="carousel-btn next" onClick={goToNext}>❯</button>
               </div>
               
               {/* Carousel Dots */}
               <div className="carousel-dots">
                  {bestSellers.map((_, index) => (
                     <span
                        key={index}
                        className={`dot ${index === currentIndex ? 'active' : ''}`}
                        onClick={() => goToSlide(index)}
                     ></span>
                  ))}
               </div>
            </>
         )}

         {/* Food Item Modal */}
         {showModal && selectedItem && (
            <FoodItemModal
               item={selectedItem}
               items={food_list}
               onClose={() => {
                  setShowModal(false);
                  setSelectedItem(null);
               }}
               onAddToCart={addToCart}
               url={url}
            />
         )}
      </div>
   )
}

export default Header
