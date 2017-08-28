const mqtt = require('mqtt');

const config = require('./config');
const serviceState = require('./service-state');

let mqttConnected = false;

const mqttHost = config.get('mqtt_host');
const mqttTopic = config.get('mqtt_topic');

const client  = mqtt.connect('mqtt://' + mqttHost);

client.on('connect', () => {
  console.log('Connected');
  mqttConnected = true;
})

client.on('close', () => {
  console.log('Close');
  mqttConnected = false;
});

client.on('offline', () => {
  console.log('Offline');
  mqttConnected = false;
});

serviceState.on('online', publish);
serviceState.on('offline', publish);

function publish(service) {
  console.log('PUBLISHING', mqttTopic, service);
  client.publish(mqttTopic, JSON.stringify(service));
}
