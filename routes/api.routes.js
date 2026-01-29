const router = require('express').Router();
const energyController = require('../controllers/energy.controller');

router.get('/realtime', energyController.getRealtimeData);
router.get('/today/:panel', energyController.getTodayUsage);
router.get('/stats/yearly', energyController.getYearlyStats);

module.exports = router;
