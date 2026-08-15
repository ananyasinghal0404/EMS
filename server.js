import express from "express";
import cors from "cors";
import dotenv from "dotenv/config";
import multer from "multer";
import connectDB from "./config/db.js";
import aurthRouter from "./routes/aurthRoutes.js";
import employeesRouter from "./routes/employeeRoutes.js"
import profileRouter from "./routes/profileRoutes.js";
import attendanceRouter from "./routes/attendanceRoutes.js";
import leaveRouter from "./routes/leaveRoutes.js";
import payslipRouter from "./routes/payslipRoutes.js";
import dashboardRouter from "./routes/dashboardRoutes.js";



const app = express();
const PORT = process.env.PORT || 4000;

await connectDB(); // Connect to MongoDB

//Middleware
app.use(cors());
app.use(express.json());
app.use(multer().none());

//Routes
app.get("/", (req, res) => {
  res.send("Server is running");
});
app.use("/api/auth" , aurthRouter)
app.use("/api/employees" , employeesRouter)
app.use("/api/profile" , profileRouter)
app.use("/api/attendance", attendanceRouter)
app.use("/api/leaves", leaveRouter)
app.use("/api/payslips", payslipRouter)
app.use("/api/dashboard", dashboardRouter)


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
