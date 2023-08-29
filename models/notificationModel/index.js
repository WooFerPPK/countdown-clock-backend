const notification = require('./notification');
const pushover = require('./pushover');

module.exports = {
  ...notification,
  ...pushover
};
