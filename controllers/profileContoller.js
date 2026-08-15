import Employee from "../models/Employee.js";

export const getProfile = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      userId: req.session.userId,
      isDeleted: false,
    });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    return res.json({ success: true, profile: employee });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const session = req.session;

    const employee = await Employee.findOne({
      userId: session.userId,
    });

    if (!employee) {
      return res.status(404).json({
        error: "Employee not found",
      });
    }

    if (employee.isDeleted) {
      return res.status(403).json({
        error: "Your account is deactivated, you cannot update your profile",
      });
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      employee._id,
      {
        bio: req.body.bio,
      },
      {
        new: true,
      }
    );

    return res.json({
      success: true,
      profile: updatedEmployee,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to update profile",
    });
  }
};
