const got = require('got');
const { parse } = require('url');
const tcpp = require('tcp-ping');

const config = require('./config');
const serviceState = require('./service-state');

const interval = 1000 * config.get('interval');

const services = serviceState.services;

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
}

function setOffline(service) {
  if (service.online === false) return; // already offline
  service.online = false;
}

function probe(host, port) {
  return new Promise((resolve, reject) => {
    tcpp.probe(host, port, (err, available) => {
      if (err) return reject(err);
      resolve(available);
    });
  });
}
