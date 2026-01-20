import React, { useState, useContext } from 'react'
import './Home.css'
import Header from '../../components/Header/Header'
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu'
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay'
import Recommendations from '../../components/Recommendations/Recommendations'
import { StoreContext } from '../../context/StoreContext'

const Home = ({ showLogin }) => {

 const [category, setCategory] = useState('All');
 const { userId } = useContext(StoreContext);
 const url = import.meta.env.VITE_API_URL || "http://localhost:4000";

  return (
    <div>
      <Header />
      {userId && <Recommendations userId={userId} />}
      <ExploreMenu url={url} category={category} setCategory={setCategory} />
      <FoodDisplay category={category}/>  
    </div>
  )
}

export default Home
