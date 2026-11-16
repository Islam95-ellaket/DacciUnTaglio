import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import Shop from "./models/Shop.js";
import User from "./models/User.js";

dotenv.config();

const ADMIN_NAME = process.env.ADMIN_NAME || "Admin";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@dacciuntaglio.it";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

async function seed() {
    await connectDB();
    console.log("Connesso a MongoDB");

    // --- Shop ---
    const shopCount = await Shop.countDocuments();

    if (shopCount === 0) {
        const workingHours = [];
        const recurringBlocks = [];

        for (let day = 1; day <= 6; day++) {
            workingHours.push({
                dayOfWeek: day,
                open: "09:00",
                close: "19:00",
            });
            recurringBlocks.push({
                dayOfWeek: day,
                open: "13:00",
                close: "14:00",
                reason: "Pausa pranzo",
            });
        }


        await Shop.create({
            name: "DacciUnTaglio",
            address: "Via Roma 1, Milano",
            phone: "+39 02 1234567",
            timezone: "Europe/Rome",
            workingHours,
            blockedSlots: [],
            recurringBlocks,
        });

        console.log("Shop creato (lun-sab 09:00-19:00)");
    } else {
        console.log("Shop già presente, skip");
    }

    // --- Admin ---
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });

    if (!existingAdmin) {
        const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

        await User.create({
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            passwordHash,
            role: "admin",
        });

        console.log("Admin creato");
        console.log(`Credenziali admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    } else {
        console.log("Admin già presente, skip");
    }

    await mongoose.disconnect();
    console.log("Seed completato");
}

seed().catch((error) => {
    console.error("Errore durante il seed:", error);
    process.exit(1);
});
