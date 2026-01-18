import React, { useState } from 'react'
import './Home.css'
import Header from '../../components/Header/Header'
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu'
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay'

const Home = ({ showLogin }) => {

 const [category, setCategory] = useState('All');
 const url = import.meta.env.VITE_API_URL || "http://localhost:4000";

  return (
    <div>
      <Header />
      <ExploreMenu url={url} category={category} setCategory={setCategory} />
      <FoodDisplay category={category}/>  
    </div>
  )
}

export default Home
