import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";

const getSession = (req) => req.session || req.user;
const isAdmin = (req) => getSession(req)?.role === "ADMIN";

const getEmployeeForRequest = async (req) => {
  const userId = getSession(req)?.userId || getSession(req)?._id;

  if (!userId) return null;

  return Employee.findOne({ userId, isDeleted: false }).select("_id");
};

const normalizeDate = (value) => {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) return null;

  date.setUTCHours(0, 0, 0, 0);
  return date;
};

export const getAttendance = async (req, res) => {
  try {
    const filter = {};

    if (isAdmin(req) && req.query.employeeId) {
      filter.employeeId = req.query.employeeId;
    } else if (!isAdmin(req)) {
      const employee = await getEmployeeForRequest(req);

      if (!employee) {
        return res.status(404).json({ success: false, message: "Employee profile not found" });
      }

      filter.employeeId = employee._id;
    }

    const startDate = req.query.startDate ? normalizeDate(req.query.startDate) : null;
    const endDate = req.query.endDate ? normalizeDate(req.query.endDate) : null;

    if ((req.query.startDate && !startDate) || (req.query.endDate && !endDate)) {
      return res.status(400).json({ success: false, message: "Use valid start and end dates" });
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) {
        endDate.setUTCHours(23, 59, 59, 999);
        filter.date.$lte = endDate;
      }
    }

    const attendance = await Attendance.find(filter)
      .populate("employeeId", "firstName lastName email position department")
      .sort({ date: -1 });

    return res.json({ success: true, data: attendance });
  } catch (error) {
    console.error("Get attendance error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch attendance" });
  }
};

export const createAttendance = async (req, res) => {
  try {
    const { employeeId, date, status, checkIn, checkOut, notes } = req.body;
    const attendanceDate = normalizeDate(date);

    if (!attendanceDate) {
      return res.status(400).json({ success: false, message: "Use a valid attendance date" });
    }

    const resolvedEmployeeId = isAdmin(req)
      ? employeeId
      : (await getEmployeeForRequest(req))?._id;

    if (!resolvedEmployeeId) {
      return res.status(400).json({ success: false, message: "An employee is required for attendance" });
    }

    const existingAttendance = await Attendance.findOne({
      employeeId: resolvedEmployeeId,
      date: attendanceDate,
    });

    if (existingAttendance) {
      return res.status(409).json({ success: false, message: "Attendance already exists for this date" });
    }

    const attendance = await Attendance.create({
      employeeId: resolvedEmployeeId,
      date: attendanceDate,
      status: status?.toUpperCase() || "PRESENT",
      checkIn: checkIn || null,
      checkOut: checkOut || null,
      notes,
    });

    return res.status(201).json({ success: true, message: "Attendance recorded", data: attendance });
  } catch (error) {
    console.error("Create attendance error:", error);
    return res.status(500).json({ success: false, message: "Failed to record attendance" });
  }
};

export const updateAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({ success: false, message: "Attendance record not found" });
    }

    if (!isAdmin(req)) {
      const employee = await getEmployeeForRequest(req);

      if (!employee || attendance.employeeId.toString() !== employee._id.toString()) {
        return res.status(403).json({ success: false, message: "You cannot update this attendance record" });
      }
    }

    const { status, checkIn, checkOut, notes } = req.body;

    if (status !== undefined) attendance.status = status.toUpperCase();
    if (checkIn !== undefined) attendance.checkIn = checkIn || null;
    if (checkOut !== undefined) attendance.checkOut = checkOut || null;
    if (notes !== undefined) attendance.notes = notes;

    await attendance.save();

    return res.json({ success: true, message: "Attendance updated", data: attendance });
  } catch (error) {
    console.error("Update attendance error:", error);
    return res.status(500).json({ success: false, message: "Failed to update attendance" });
  }
};
