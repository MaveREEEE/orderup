import mongoose from 'mongoose'

const allergenSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false })

const allergenModel = mongoose.models.allergen || mongoose.model("allergen", allergenSchema)

export default allergenModel
