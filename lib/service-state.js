const EventEmitter = require('events').EventEmitter;

const config = require('./config');

const services = config.get('services');
const emitter = new EventEmitter();

const proxyHandler = {
  set(target, property, value, receiver) {
    if (property === 'online') {
      target[property] = value;
      const evt = value ? 'online' : 'offline';
      console.log(`${target.name} is ${value ? 'online' : 'offline'}`);
      emitter.emit(evt, target);
    }

    // Indicate success
    return true;
  }
};

function proxyService(service) {
  return new Proxy(service, proxyHandler);
}

exports.services = services.map(s => proxyService(s));
exports.on = emitter.on.bind(emitter);
exports.once = emitter.once.bind(emitter);
exports.removeListener = emitter.removeListener.bind(emitter);
exports.removeAllListeners = emitter.removeAllListeners.bind(emitter);
