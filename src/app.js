const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");

dotenv.config();

const healthRouter = require("./routes/health");
const usersRouter = require("./routes/users");
const authRouter = require("./routes/auth");
const clientsRouter = require("./routes/clients");
const projectsRouter = require("./routes/projects");
const transactionsRouter = require("./routes/transactions");
const employeesRouter = require("./routes/employees");
const salaryTransactionsRouter = require("./routes/salaryTransactions");
const profitLossRouter = require("./routes/profitLoss");
const expensesRouter = require("./routes/expenses");
const expenseLimitsRouter = require("./routes/expenseLimits");

const app = express();

app.use(morgan("dev"));
app.use(express.json());

const corsOrigin = process.env.CORS_ORIGIN;
const defaultCorsOrigins = [
  "https://nexum-erp-frontend.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];
const resolvedCorsOrigin = (() => {
  if (!corsOrigin) return true;
  if (corsOrigin.trim() === "*") return true;
  const envOrigins = corsOrigin
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return Array.from(new Set([...envOrigins, ...defaultCorsOrigins]));
})();
app.use(
  cors({
    origin: resolvedCorsOrigin,
    credentials: true,
  }),
);

app.get("/", (req, res) => {
  res.json({
    ok: true,
    name: "erpnexum-backend",
  });
});

app.use("/health", healthRouter);
app.use("/api/users", usersRouter);
app.use("/api/auth", authRouter);
app.use("/api/clients", clientsRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/employees", employeesRouter);
app.use("/api/salary-transactions", salaryTransactionsRouter);
app.use("/api/profit-loss", profitLossRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/expense-limits", expenseLimitsRouter);

// 404
app.use((req, res) => {
  res.status(404).json({ ok: false, error: "Not Found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ ok: false, error: "Internal Server Error" });
});

module.exports = app;
