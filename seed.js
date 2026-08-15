import "dotenv/config";
import bcrypt from "bcrypt";

import connectDB from "./config/db.js";
import User from "./models/user.js";

const temporaryPassword = "admin123";

async function registerAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail) {
      console.error("Missing ADMIN_EMAIL variable");
      process.exit(1);
    }

    await connectDB();

    const existingAdmin = await User.findOne({
      email: adminEmail,
    });

    if (existingAdmin) {
      console.log(
        `User already exists with role: ${existingAdmin.role}`
      );
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(
      temporaryPassword,
      10
    );

    const admin = await User.create({
      email: adminEmail,
      password: hashedPassword,
      role: "ADMIN",
    });

    console.log("Admin was created");
    console.log(`\nEmail: ${admin.email}`);
    console.log(`Password: ${temporaryPassword}`);
    console.log("\nChange the password after login.");

    process.exit(0);

  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

registerAdmin();