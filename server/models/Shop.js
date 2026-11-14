import mongoose from "mongoose";

const workingHourSchema = new mongoose.Schema(
    {
        dayOfWeek: {
            type: Number,
            required: true,
            min: 0,
            max: 6,
        },
        open: {
            type: String,
            required: true,
        },
        close: {
            type: String,
            required: true,
        },
        reason: {
            type: String
        },
    },
    { _id: false },
);

const blockedSlotSchema = new mongoose.Schema(
    {
        start: {
            type: Date,
            required: true,
        },
        end: {
            type: Date,
            required: true,
        },
        reason: {
            type: String,
        },
    },
    { _id: false },
);

const shopSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        address: {
            type: String,
            trim: true,
        },
        phone: {
            type: String,
            trim: true,
        },
        timezone: {
            type: String,
            default: "Europe/Rome",
        },
        slotInterval: {
            type: Number,
            default: 10,
        },
        maxBookingsPerDay: {
            type: Number,
            default: 1,
        },
        workingHours: [workingHourSchema],
        blockedSlots: [blockedSlotSchema],
        recurringBlocks: [workingHourSchema],
        bookingLockVersion: {
            type: Number,
            default: 0,
        },

    },
    { timestamps: true },
);

export default mongoose.model("Shop", shopSchema);
