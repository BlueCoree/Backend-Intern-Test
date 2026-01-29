const router = require('express').Router();
const apiRouter = require('./api.routes')

router.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API is running',
    server_time: new Date().toISOString(),
    influx_host: process.env.INFLUX_HOST || 'http://localhost:8181'
  });
});
router.use('/api', apiRouter)

module.exports = router;