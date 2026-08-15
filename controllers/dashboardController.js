import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import Leave from "../models/Leave.js";
import Payslip from "../models/Payslip.js";

const getSession = (req) => req.session || req.user;

const getCurrentEmployee = async (req) => {
  const session = getSession(req);
  const userId = session?.userId || session?._id;

  if (!userId) return null;

  return Employee.findOne({ userId, isDeleted: false });
};

const getMonthBounds = () => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  return { start, end };
};

export const getAdminDashboard = async (req, res) => {
  try {
    const session = getSession(req);

    if (session?.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin access denied" });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const [totalEmployees, departments, todayAttendance, pendingLeaves] = await Promise.all([
      Employee.countDocuments({ isDeleted: false, employeeStatus: "ACTIVE" }),
      Employee.distinct("department", { isDeleted: false, department: { $ne: null } }),
      Attendance.countDocuments({
        date: { $gte: today, $lt: tomorrow },
        status: { $in: ["PRESENT", "HALF_DAY"] },
      }),
      Leave.countDocuments({ status: "PENDING" }),
    ]);

    return res.json({
      success: true,
      data: {
        role: "ADMIN",
        totalEmployees,
        totalDepartments: departments.length,
        todayAttendance,
        pendingLeaves,
      },
    });
  } catch (error) {
    console.error("Get admin dashboard error:", error);
    return res.status(500).json({ success: false, message: "Failed to load dashboard" });
  }
};

export const getEmployeeDashboard = async (req, res) => {
  try {
    const employee = await getCurrentEmployee(req);

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee profile not found" });
    }

    const { start, end } = getMonthBounds();
    const [currentMonthAttendance, pendingLeaves, latestPayslip] = await Promise.all([
      Attendance.countDocuments({
        employeeId: employee._id,
        date: { $gte: start, $lt: end },
        status: { $in: ["PRESENT", "HALF_DAY"] },
      }),
      Leave.countDocuments({ employeeId: employee._id, status: "PENDING" }),
      Payslip.findOne({ employeeId: employee._id }).sort({ year: -1, month: -1 }),
    ]);

    return res.json({
      success: true,
      data: {
        role: "EMPLOYEE",
        currentMonthAttendance,
        pendingLeaves,
        latestPayslip,
        employee: {
          firstName: employee.firstName,
          lastName: employee.lastName,
          position: employee.position,
          department: employee.department,
        },
      },
    });
  } catch (error) {
    console.error("Get employee dashboard error:", error);
    return res.status(500).json({ success: false, message: "Failed to load dashboard" });
  }
};
