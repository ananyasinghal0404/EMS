import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Employee from "../models/Employee.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check required fields
    if (!email || !password ) {
      return res.status(400).json({
        success: false,
        message: "Email, password and role are required",
      });
    }

    // 2. Find user by email
    const user = await User.findOne({
      email,
      isDeleted: false,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 3. Check role
    if (role_type === "admin" && user.role !== "ADMIN"){
      return res.status(403).json({
        success: false,
        message: "Invalid role for this account",
      });
    }

    if (role_type === "employee" && user.role !== "EMPLOYEE") {
      return res.status(403).json({
        success: false,
        message: "Invalid role for this account",
      });
    }

    // 4. Compare password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 5. Create JWT

    const payload = {
         userId: user._id.toString(),
        role: user.role,
        email: user.email,
    }

    const token = jwt.sign(playload, process.env.JWT_SECRET,
        {expiresIn: "7d"});

        return res.json({user: payload, token})



    // 6. Get employee information if employee
    let employee = null;

    if (user.role === "EMPLOYEE") {
      employee = await Employee.findOne({
        userId: user._id,
        isDeleted: false,
      });
    }

    // 7. Send response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      employee,
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const session = (req, res) => {
    const session = req.session;
    return res.json({user: session})
}

export const changePassword = async (req, res) => {
  try {
    const { userId } = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });

  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
