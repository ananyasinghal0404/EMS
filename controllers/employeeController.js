import bcrypt from "bcrypt";
import Employee from "../models/Employee.js";
import User from "../models/User.js";

// GET ALL EMPLOYEES
export const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({
      isDeleted: false,
    }).populate("userId", "email role");

    return res.status(200).json({
      success: true,
      message: "Employees fetched successfully",
      data: employees,
    });
  } catch (error) {
    console.error("Get employees error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch employees",
    });
  }
};

// CREATE EMPLOYEE
export const createEmployee = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      position,
      phone,
      basicSalary,
      allowances,
      deductions,
      employmentStatus,
      joinDate,
      image,
      bio,
      department,
    } = req.body;

    // Required fields
    if (!firstName || !lastName || !email || !password || !position) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const user = await User.create({
      email,
      password: hashedPassword,
      role: "EMPLOYEE",
    });

    // Create Employee
    const employee = await Employee.create({
      userId: user._id,
      firstName,
      lastName,
      email,
      position,
      phone,
      basicSalary,
      allowances,
      deductions,
      employmentStatus: employmentStatus || "ACTIVE",
      joinDate,
      image: image || null,
      bio: bio || "",
      department,
      isDeleted: false,
    });

    return res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: employee,
    });
  } catch (error) {
    console.error("Create employee error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create employee",
    });
  }
};

// UPDATE EMPLOYEE
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      firstName,
      lastName,
      email,
      position,
      phone,
      basicSalary,
      allowances,
      deductions,
      employmentStatus,
      joinDate,
      image,
      bio,
      department,
    } = req.body;

    const employee = await Employee.findById(id);

    if (!employee || employee.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Update only fields that were provided
    if (firstName !== undefined) employee.firstName = firstName;
    if (lastName !== undefined) employee.lastName = lastName;
    if (email !== undefined) employee.email = email;
    if (position !== undefined) employee.position = position;
    if (phone !== undefined) employee.phone = phone;
    if (basicSalary !== undefined) employee.basicSalary = basicSalary;
    if (allowances !== undefined) employee.allowances = allowances;
    if (deductions !== undefined) employee.deductions = deductions;
    if (employmentStatus !== undefined) {
      employee.employmentStatus = employmentStatus;
    }
    if (joinDate !== undefined) employee.joinDate = joinDate;
    if (image !== undefined) employee.image = image;
    if (bio !== undefined) employee.bio = bio;
    if (department !== undefined) employee.department = department;

    await employee.save();

    // If email was changed, update the User as well
    if (email !== undefined) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: employee.userId },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email is already being used by another user",
        });
      }

      await User.findByIdAndUpdate(employee.userId, {
        email,
      });
    }

    const updatedEmployee = await Employee.findById(id).populate(
      "userId",
      "email role"
    );

    return res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: updatedEmployee,
    });
  } catch (error) {
    console.error("Update employee error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update employee",
    });
  }
};

// DELETE EMPLOYEE
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id);

    if (!employee || employee.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Soft delete
    employee.isDeleted = true;

    await employee.save();

    return res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error) {
    console.error("Delete employee error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete employee",
    });
  }
};
