import preferenceModel from '../models/preferenceModel.js'

// Get all preferences
const getPreferences = async (req, res) => {
    try {
        const preferences = await preferenceModel.find().sort({ createdAt: -1 })
        res.json({
            success: true,
            data: preferences
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

// Add preference
const addPreference = async (req, res) => {
    try {
        const { name } = req.body

        if (!name || !name.trim()) {
            return res.json({
                success: false,
                message: "Preference name is required"
            })
        }

        // Check if preference already exists
        const exists = await preferenceModel.findOne({ name: name.trim() })
        if (exists) {
            return res.json({
                success: false,
                message: "This preference already exists"
            })
        }

        const preference = new preferenceModel({
            name: name.trim()
        })

        const savedPreference = await preference.save()
        res.json({
            success: true,
            message: "Preference added successfully",
            data: savedPreference
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

// Update preference
const updatePreference = async (req, res) => {
    try {
        const { id } = req.params
        const { name } = req.body

        if (!name || !name.trim()) {
            return res.json({
                success: false,
                message: "Preference name is required"
            })
        }

        // Check if another preference with this name exists
        const exists = await preferenceModel.findOne({ 
            name: name.trim(),
            _id: { $ne: id }
        })
        if (exists) {
            return res.json({
                success: false,
                message: "This preference name already exists"
            })
        }

        const updatedPreference = await preferenceModel.findByIdAndUpdate(
            id,
            { name: name.trim() },
            { new: true }
        )

        if (!updatedPreference) {
            return res.json({
                success: false,
                message: "Preference not found"
            })
        }

        res.json({
            success: true,
            message: "Preference updated successfully",
            data: updatedPreference
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

// Delete preference
const deletePreference = async (req, res) => {
    try {
        const { id } = req.params

        const deletedPreference = await preferenceModel.findByIdAndDelete(id)

        if (!deletedPreference) {
            return res.json({
                success: false,
                message: "Preference not found"
            })
        }

        res.json({
            success: true,
            message: "Preference deleted successfully",
            data: deletedPreference
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

export { getPreferences, addPreference, updatePreference, deletePreference }
