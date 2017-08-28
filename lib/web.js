const express = require('express');

const config = require('./config');
const serviceState = require('./service-state');

const port = config.get('web_port');

express()
.set('view engine', 'pug')
.get('/', (req, res) => {
  res.render('index', { title: 'Hey', services: serviceState.services });
})
.listen(port);
