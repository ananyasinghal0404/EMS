import Employee from "../models/Employee.js";
import Payslip from "../models/Payslip.js";

const getSession = (req) => req.session || req.user;
const isAdmin = (req) => getSession(req)?.role === "ADMIN";

const getEmployeeForRequest = async (req) => {
  const session = getSession(req);
  const userId = session?.userId || session?._id;

  if (!userId) return null;

  return Employee.findOne({ userId, isDeleted: false });
};

const toAmount = (value, fallback) => {
  if (value === undefined || value === null || value === "") return Number(fallback || 0);

  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
};

export const getPayslips = async (req, res) => {
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

    if (req.query.month) filter.month = Number(req.query.month);
    if (req.query.year) filter.year = Number(req.query.year);

    const payslips = await Payslip.find(filter)
      .populate("employeeId", "firstName lastName email position department")
      .sort({ year: -1, month: -1 });

    return res.json({ success: true, data: payslips });
  } catch (error) {
    console.error("Get payslips error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch payslips" });
  }
};

export const createPayslip = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, message: "Only admins can generate payslips" });
    }

    const { employeeId, month, year, basicSalary, allowances, deductions } = req.body;

    if (!employeeId || !month || !year) {
      return res.status(400).json({ success: false, message: "Employee, month, and year are required" });
    }

    const employee = await Employee.findOne({ _id: employeeId, isDeleted: false });

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const salary = toAmount(basicSalary, employee.basicSalary);
    const allowanceAmount = toAmount(allowances, employee.allowances);
    const deductionAmount = toAmount(deductions, employee.deductions);

    if ([salary, allowanceAmount, deductionAmount].some((amount) => amount === null)) {
      return res.status(400).json({ success: false, message: "Salary values must be non-negative numbers" });
    }

    const existingPayslip = await Payslip.findOne({ employeeId, month: Number(month), year: Number(year) });

    if (existingPayslip) {
      return res.status(409).json({ success: false, message: "A payslip already exists for this period" });
    }

    const netSalary = Math.max(0, Number((salary + allowanceAmount - deductionAmount).toFixed(2)));
    const payslip = await Payslip.create({
      employeeId,
      month: Number(month),
      year: Number(year),
      basicSalary: salary,
      allowances: allowanceAmount,
      deductions: deductionAmount,
      netSalary,
    });

    return res.status(201).json({ success: true, message: "Payslip generated", data: payslip });
  } catch (error) {
    console.error("Create payslip error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate payslip" });
  }
};

export const getPayslipById = async (req, res) => {
  try {
    const payslip = await Payslip.findById(req.params.id).populate(
      "employeeId",
      "firstName lastName email position department"
    );

    if (!payslip) {
      return res.status(404).json({ success: false, message: "Payslip not found" });
    }

    if (!isAdmin(req)) {
      const employee = await getEmployeeForRequest(req);

      if (!employee || payslip.employeeId._id.toString() !== employee._id.toString()) {
        return res.status(403).json({ success: false, message: "You cannot access this payslip" });
      }
    }

    return res.json({ success: true, data: payslip });
  } catch (error) {
    console.error("Get payslip error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch payslip" });
  }
};
