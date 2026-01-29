const mqtt = require('mqtt');
const config = require('../config/config');
const influxdbService = require('./influxdb.service');

class MQTTService {
  constructor() {
    this.client = null;
  }

  connect() {
    this.client = mqtt.connect(config.mqtt.broker);

    this.client.on('connect', () => {
      console.log('Connected to MQTT Broker:', config.mqtt.broker);
      
      config.mqtt.topics.forEach(topic => {
        this.client.subscribe(topic);
        console.log(`Subscribed to: ${topic}`);
      });
    });

  this.client.on('message', async (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        const topicParts = topic.split('/');
        const panelId = topicParts[topicParts.length - 1];

        if (payload.status === 'OK' && payload.data) {
          await influxdbService.writeData(panelId, payload.data);
        }
      } catch (error) {
        console.error(' MQTT Process Error:', error.message);
      }
    });

    this.client.on('error', (err) => console.error('MQTT Error:', err.message));
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      console.log('MQTT Disconnected');
    }
  }
}

module.exports = new MQTTService();