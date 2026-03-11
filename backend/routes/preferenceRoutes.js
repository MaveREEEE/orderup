import express from 'express'
import { getPreferences, addPreference, updatePreference, deletePreference } from '../controllers/preferenceController.js'

const preferenceRoutes = express.Router()

preferenceRoutes.get('/preferences', getPreferences)
preferenceRoutes.post('/preferences', addPreference)
preferenceRoutes.put('/preferences/:id', updatePreference)
preferenceRoutes.delete('/preferences/:id', deletePreference)

export default preferenceRoutes
