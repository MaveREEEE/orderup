import React, { useState, useEffect, useContext } from 'react'
import './Header.css'
import { StoreContext } from '../../context/StoreContext'
import FoodItemModal from '../FoodItemModal/FoodItemModal'
import { useNavigate } from 'react-router-dom'

const Header = () => {
   const navigate = useNavigate();
    const { food_list, url, addToCart } = useContext(StoreContext);
    const [heroSettings, setHeroSettings] = useState({
       heroBackground: '',
       heroTitle: 'Delicious Food Delivered Fast',
       heroSubtitle: 'Order your favorite meals and enjoy them at home',
    });
       useEffect(() => {
          const fetchSettings = async () => {
             try {
                const res = await fetch(url + '/api/settings/');
                const data = await res.json();
                if (data.success && data.data) {
                   setHeroSettings({
                      heroBackground: data.data.heroBackground || '',
                      heroTitle: data.data.heroTitle || 'Delicious Food Delivered Fast',
                      heroSubtitle: data.data.heroSubtitle || 'Order your favorite meals and enjoy them at home',
                   });
                }
             } catch {
                  console.error("Error fetching settings");
             }
          };
          fetchSettings();
       }, [url]);
   const [carouselItems, setCarouselItems] = useState([]);
   const [currentIndex, setCurrentIndex] = useState(0);
   const [showModal, setShowModal] = useState(false);
   const [selectedItem, setSelectedItem] = useState(null);

   const getImageUrl = (img) => {
      if (!img) return ''
      return img.startsWith('http') ? img : ''
   }

   const getTodaySeed = () => {
      const today = new Date();
      return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
   };

   const seededRandom = (seed) => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
   };

   useEffect(() => {
      if (food_list && food_list.length > 0) {
         const sorted = [...food_list].sort((a, b) => {
            const ratingCountA = a.ratings?.length || 0;
            const ratingCountB = b.ratings?.length || 0;
            return ratingCountB - ratingCountA;
         });
         const bestSellers = sorted.slice(0, 5).map(item => ({ ...item, badge: 'Best Seller' }));

         const remainingItems = food_list.filter(item => 
            !bestSellers.some(bs => bs._id === item._id)
         );

         const seed = getTodaySeed();
         const shuffled = [...remainingItems].sort(() => seededRandom(seed) - 0.5);
         const featured = shuffled.slice(0, 3).map(item => ({ ...item, badge: 'Featured' }));

         setCarouselItems([...bestSellers, ...featured]);
      }
   }, [food_list]);

   useEffect(() => {
      if (carouselItems.length === 0) return;
      
      const interval = setInterval(() => {
         setCurrentIndex((prevIndex) => 
            prevIndex === carouselItems.length - 1 ? 0 : prevIndex + 1
         );
      }, 3000);

      return () => clearInterval(interval);
   }, [carouselItems]);

   const goToSlide = (index) => {
      setCurrentIndex(index);
   };

   const goToPrevious = () => {
      setCurrentIndex((prevIndex) => 
         prevIndex === 0 ? carouselItems.length - 1 : prevIndex - 1
      );
   };

   const goToNext = () => {
      setCurrentIndex((prevIndex) => 
         prevIndex === carouselItems.length - 1 ? 0 : prevIndex + 1
      );
   };

   return (
      <div className='header'>
         <div className="hero-banner" style={heroSettings.heroBackground ? { backgroundImage: `url(${heroSettings.heroBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
            <div className="hero-overlay"></div>
            <div className="hero-content">
               <h1 className="hero-title">{heroSettings.heroTitle}</h1>
               <p className="hero-subtitle">{heroSettings.heroSubtitle}</p>
               <div className="hero-buttons">
                  <button className="hero-btn primary" onClick={() => navigate('/order')}>Order Now</button>
                  <button className="hero-btn secondary" onClick={() => document.getElementById('explore-menu')?.scrollIntoView({ behavior: 'smooth' })}>View Menu</button>
               </div>
            </div>

            {carouselItems.length > 0 && (
               <div className="hero-carousel">
                  <div className="carousel-container-hero">
                     <button className="carousel-btn prev" onClick={goToPrevious}>❮</button>
                     <div className="best-seller-card">
                        <div className={`best-seller-badge ${carouselItems[currentIndex].badge === 'Featured' ? 'featured' : ''}`}>
                           {carouselItems[currentIndex].badge}
                        </div>
                        <img
                           src={getImageUrl(carouselItems[currentIndex].image)}
                           alt={carouselItems[currentIndex].name}
                           className="best-seller-image"
                        />
                        <div className="best-seller-info">
                           <div className="best-seller-header">
                              <h4>{carouselItems[currentIndex].name}</h4>
                              <span className="best-seller-price">₱{carouselItems[currentIndex].price}</span>
                           </div>
                           <div className="best-seller-footer">
                              <button className="best-seller-btn" onClick={() => {
                                 setSelectedItem(carouselItems[currentIndex]);
                                 setShowModal(true);
                              }}>Order Now</button>
                           </div>
                        </div>
                     </div>
                     <button className="carousel-btn next" onClick={goToNext}>❯</button>
                  </div>
                  <div className="carousel-dots">
                     {carouselItems.map((_, index) => (
                        <span
                           key={index}
                           className={`dot ${index === currentIndex ? 'active' : ''}`}
                           onClick={() => goToSlide(index)}
                        ></span>
                     ))}
                  </div>
               </div>
            )}
         </div>

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
               onItemClick={(item) => setSelectedItem(item)}
            />
         )}
      </div>
   )
}

export default Header
