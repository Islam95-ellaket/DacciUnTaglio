import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // SEMPRE in UTC nel database
    start: {
      type: Date,
      required: true,
    },
    end: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "completed", "no-show"],
      default: "active",
    },
  },
  { timestamps: true } // createdAt, updatedAt automatici
);

// Indice unico parziale: impedisce due appuntamenti "active"
// con lo stesso shopId + start. I "cancelled" non contano.
appointmentSchema.index(
  { shopId: 1, start: 1 },
  { unique: true, partialFilterExpression: { status: "active" } }
);

export default mongoose.model("Appointment", appointmentSchema);
