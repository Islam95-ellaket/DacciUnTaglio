import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
    {
        shopId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shop",
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        durationMinutes: {
            type: Number,
            required: true,
            min: 1,
        },
        // Immagine del servizio: URL (da Cloudinary), vuoto = immagine di default
        imageUrl: {
            type: String,
            default: "",
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true },
);

export default mongoose.model("Service", serviceSchema);
