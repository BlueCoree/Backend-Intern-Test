require('dotenv').config();

module.exports = {
  influxdb: {
    host: process.env.INFLUX_HOST,
    token: process.env.INFLUX_TOKEN,
    database: process.env.INFLUX_DATABASE,
  },
  mqtt: {
    broker: process.env.MQTT_BROKER,
    topics: [
      'DATA/PM/PANEL_LANTAI_1',
      'DATA/PM/PANEL_LANTAI_2',
      'DATA/PM/PANEL_LANTAI_3'
    ]
  },
  server: {
    port: process.env.PORT || 3000
  }
};
