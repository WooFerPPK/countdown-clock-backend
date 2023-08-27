const express = require('express');
const cors = require('cors');
const router = require('./router');
const scheduler = require('../tasks/scheduler');

const app = express();

app.use(express.json());
app.use(cors());
app.use('/', router);

scheduler.startAll();

module.exports = app;
