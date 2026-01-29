const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const influxdbService = require('./services/influxdb.service');
const mqttService = require('./services/mqtt.service');
const indexRoutes = require('./routes/index.routes');
const errorHandler = require('./middlewares/errorHandling');

const app = express();
const port = config.server.port || 3000;

app.use(cors());
app.use(express.json());
app.use('/', indexRoutes);

app.use(errorHandler);

async function startServer() {
  try {
    console.log('Starting server...');
    await influxdbService.connect();

    mqttService.connect(); 
    app.listen(port, () => {
      console.log(`\n API Server: http://localhost:${port}`);
      console.log(`Dashboard Data: http://localhost:${port}/api/realtime`);
      console.log(`Yearly Stats: http://localhost:${port}/api/stats/yearly`);
    });

  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('\n Shutting down...');
  mqttService.disconnect();
  await influxdbService.close();
  process.exit(0);
});

startServer();