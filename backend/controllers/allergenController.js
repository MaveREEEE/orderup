import allergenModel from '../models/allergenModel.js'

//Get all allergens
const getAllergens = async (req, res) => {
    try {
        const allergens = await allergenModel.find().sort({ createdAt: -1 })
        res.json({
            success: true,
            data: allergens
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

//Add allergen
const addAllergen = async (req, res) => {
    try {
        const { name } = req.body

        if (!name || !name.trim()) {
            return res.json({
                success: false,
                message: "Allergen name is required"
            })
        }

        const exists = await allergenModel.findOne({ name: name.trim() })
        if (exists) {
            return res.json({
                success: false,
                message: "This allergen already exists"
            })
        }

        const allergen = new allergenModel({
            name: name.trim()
        })

        const savedAllergen = await allergen.save()
        res.json({
            success: true,
            message: "Allergen added successfully",
            data: savedAllergen
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

//Update allergen
const updateAllergen = async (req, res) => {
    try {
        const { id } = req.params
        const { name } = req.body

        if (!name || !name.trim()) {
            return res.json({
                success: false,
                message: "Allergen name is required"
            })
        }

        const exists = await allergenModel.findOne({ 
            name: name.trim(),
            _id: { $ne: id }
        })
        if (exists) {
            return res.json({
                success: false,
                message: "This allergen name already exists"
            })
        }

        const updatedAllergen = await allergenModel.findByIdAndUpdate(
            id,
            { name: name.trim() },
            { new: true }
        )

        if (!updatedAllergen) {
            return res.json({
                success: false,
                message: "Allergen not found"
            })
        }

        res.json({
            success: true,
            message: "Allergen updated successfully",
            data: updatedAllergen
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

//Delete allergen
const deleteAllergen = async (req, res) => {
    try {
        const { id } = req.params

        const deletedAllergen = await allergenModel.findByIdAndDelete(id)

        if (!deletedAllergen) {
            return res.json({
                success: false,
                message: "Allergen not found"
            })
        }

        res.json({
            success: true,
            message: "Allergen deleted successfully",
            data: deletedAllergen
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

export { getAllergens, addAllergen, updateAllergen, deleteAllergen }
