const got = require('got');
const mqtt = require('mqtt');
const config = require('loke-config').create('servicemonitor-mqtt');
const { parse } = require('url');
const tcpp = require('tcp-ping');

let mqttConnected = false;

const mqttHost = config.get('mqtt_host');
const mqttTopic = config.get('mqtt_topic');
const services = config.get('services');
const interval = 1000 * config.get('interval');

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

setInterval(() => {
  Promise.all(services.map(checkService));
}, interval);

function checkService(service) {
  if (service.url.indexOf('tcp://') === 0) {
    return checkTcp(service);
  }
  return checkHttp(service);
}

function checkTcp(service) {
  const url = parse(service.url);

  return probe(url.hostname, url.port)
  .then(available => {
    if (available) setOnline(service);
    else setOffline(service);
  })
  .catch(err => {
    setOffline(service);
  });
}

function checkHttp(service) {
  return got.get(service.url, { timeout: 5000, retries: 3 })
  .then(response => {
    if (response.statusCode === 200) setOnline(service);
    else setOffline(service);
  })
  .catch(err => {
    setOffline(service);
  });
}

function setOnline(service) {
  if (service.online === true) return; // already online
  if (service.online === undefined) return; // don't notify when starting
  service.online = true;
  publish(service);
}

function setOffline(service) {
  if (service.online === false) return; // already offline
  service.online = false;
  publish(service);
}

function publish(service) {
  console.log('PUBLISHING', mqttTopic, service);
  client.publish(mqttTopic, JSON.stringify(service));
}

function probe(host, port) {
  return new Promise((resolve, reject) => {
    tcpp.probe(host, port, (err, available) => {
      if (err) return reject(err);
      resolve(available);
    });
  });
}
