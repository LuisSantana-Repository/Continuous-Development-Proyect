const express = require("express");
const userRoutes = require("./users");
const path = require("path");

const router = express.Router();

// Rutas principales
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/home.html"));
});

router.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/login.html"));
});

router.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/register.html"));
});

router.get("/views/components/:component", (req, res) => {
  const component = req.params.component;
  res.sendFile(path.join(__dirname, `../views/components/${component}`));
});

// Usar otras rutas
router.use("/users", userRoutes);

module.exports = router;
