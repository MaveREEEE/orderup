import React, { useState } from 'react'
import './Home.css'
import Header from '../../components/Header/Header'
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu'
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay'

const Home = ({ showLogin }) => {

 const [category, setCategory] = useState('All');

  return (
    <div>
      <Header />
      <ExploreMenu url="http://localhost:4000" category={category} setCategory={setCategory} />
      <FoodDisplay category={category}/>  
    </div>
  )
}

export default Home
