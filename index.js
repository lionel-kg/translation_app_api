const express = require("express");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
const authMiddleware = require("./src/middleware/auth.middleware");
const authRoutes = require("./src/routes/auth.routes");
const router = require("./src/routes/index.js");

const app = express();
const port = process.env.port;

app.use(morgan("combined"));
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);
app.use(bodyParser.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({ test: "***salut***" });
});

// Auth routes (public)
app.use("/api/auth", authRoutes);

// All other routes (protected)
app.use("/api", authMiddleware, router);

app.listen(port, () => console.log("Server Started on port " + port));
