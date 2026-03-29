
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const authRoutes = require("./modules/auth/auth.routes");
const usersRoutes = require("./modules/users/users.routes");
const attendanceRoutes = require("./modules/attendance/attendance.routes");
const salaryRoutes = require("./modules/salary/salary.routes");
const keysRoutes = require("./modules/keys/keys.routes");

const { errorMiddleware } = require("./middlewares/errorMiddleware");


const app = express();


app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());


app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "API funcionando" });
});


app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/salary", salaryRoutes);
app.use("/api/keys", keysRoutes);


app.use(errorMiddleware);

module.exports = app;