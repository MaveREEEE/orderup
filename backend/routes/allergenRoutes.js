import express from 'express'
import { getAllergens, addAllergen, updateAllergen, deleteAllergen } from '../controllers/allergenController.js'

const allergenRoutes = express.Router()

allergenRoutes.get('/', getAllergens)
allergenRoutes.post('/', addAllergen)
allergenRoutes.put('/:id', updateAllergen)
allergenRoutes.delete('/:id', deleteAllergen)

export default allergenRoutes
