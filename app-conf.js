/*jslint node: true, nomen: true, vars: true*/

'use strict';

var path = require('path');
var nconf = require('nconf').argv().env();

var node_env = nconf.get('NODE_ENV');
if (!node_env) {
    console.error('NODE_ENV is required. Usage: NODE_ENV=[env] Available env values: dev, sit, uat, prd.');
    process.exit(1);
}

nconf.file({file: path.resolve(__dirname, 'configs', node_env + '.json')});

module.exports = nconf;
