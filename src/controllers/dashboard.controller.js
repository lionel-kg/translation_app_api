const dashboardService = require("../services/dashboard.service");

exports.getStats = async (req, res) => {
  try {
    const stats = await dashboardService.getDashboardStats(req.user.id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
