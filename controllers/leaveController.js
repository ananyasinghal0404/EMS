import Employee from "../models/Employee.js";
import Leave from "../models/Leave.js";

const getSession = (req) => req.session || req.user;
const isAdmin = (req) => getSession(req)?.role === "ADMIN";

const getEmployeeForRequest = async (req) => {
  const session = getSession(req);
  const userId = session?.userId || session?._id;

  if (!userId) return null;

  return Employee.findOne({ userId, isDeleted: false }).select("_id");
};

const toDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getLeaves = async (req, res) => {
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

    if (isAdmin(req) && req.query.status) {
      filter.status = req.query.status.toUpperCase();
    }

    const leaves = await Leave.find(filter)
      .populate("employeeId", "firstName lastName email position department")
      .populate("reviewedBy", "email role")
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: leaves });
  } catch (error) {
    console.error("Get leaves error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch leave requests" });
  }
};

export const createLeave = async (req, res) => {
  try {
    const { employeeId, type, startDate, endDate, reason } = req.body;
    const start = toDate(startDate);
    const end = toDate(endDate);

    if (!type || !reason || !start || !end) {
      return res.status(400).json({ success: false, message: "Type, dates, and reason are required" });
    }

    if (end < start) {
      return res.status(400).json({ success: false, message: "End date cannot be before start date" });
    }

    const resolvedEmployeeId = isAdmin(req)
      ? employeeId
      : (await getEmployeeForRequest(req))?._id;

    if (!resolvedEmployeeId) {
      return res.status(400).json({ success: false, message: "An employee is required for a leave request" });
    }

    const overlappingLeave = await Leave.findOne({
      employeeId: resolvedEmployeeId,
      status: { $in: ["PENDING", "APPROVED"] },
      startDate: { $lte: end },
      endDate: { $gte: start },
    });

    if (overlappingLeave) {
      return res.status(409).json({ success: false, message: "This leave overlaps an existing request" });
    }

    const leave = await Leave.create({
      employeeId: resolvedEmployeeId,
      type: type.toUpperCase(),
      startDate: start,
      endDate: end,
      reason,
    });

    return res.status(201).json({ success: true, message: "Leave request submitted", data: leave });
  } catch (error) {
    console.error("Create leave error:", error);
    return res.status(500).json({ success: false, message: "Failed to submit leave request" });
  }
};

export const updateLeaveStatus = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, message: "Only admins can review leave requests" });
    }

    const { status, reviewComment = "" } = req.body;
    const normalizedStatus = status?.toUpperCase();

    if (!["APPROVED", "REJECTED"].includes(normalizedStatus)) {
      return res.status(400).json({ success: false, message: "Status must be APPROVED or REJECTED" });
    }

    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave request not found" });
    }

    if (leave.status !== "PENDING") {
      return res.status(409).json({ success: false, message: "Only pending leave requests can be reviewed" });
    }

    leave.status = normalizedStatus;
    leave.reviewComment = reviewComment;
    leave.reviewedBy = getSession(req)?.userId || getSession(req)?._id;
    await leave.save();

    return res.json({ success: true, message: "Leave request updated", data: leave });
  } catch (error) {
    console.error("Update leave status error:", error);
    return res.status(500).json({ success: false, message: "Failed to update leave request" });
  }
};
