const express = require("express");
const { getDashboardAnalytics } = require("../controllers/analytics");

const router = express.Router();

router.get("/dashboard", getDashboardAnalytics);

module.exports = router;
