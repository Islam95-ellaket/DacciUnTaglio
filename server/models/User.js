import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Il nome è obbligatorio"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "L'email è obbligatoria"],
      unique: true, // indice unico: due utenti non possono avere la stessa email
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      // Salviamo SEMPRE l'hash bcrypt, mai la password in chiaro
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
