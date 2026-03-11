import mongoose from 'mongoose'

const preferenceSchema = new mongoose.Schema({
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

const preferenceModel = mongoose.models.preference || mongoose.model("preference", preferenceSchema)

export default preferenceModel
