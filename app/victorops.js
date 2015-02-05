// ============
// VICTOROPS Alarm Action
// ============
// Send an alert to VictorOps
// ------------

var _ = require('underscore');
var _async = require('async');
var _format = require('util').format;
var _request = require('request');

var VICTOROPS_URI = 'https://alert.victorops.com/integrations/generic/20131114/alert/%s%s';

function getOptions(apiToken, routingKey, messageId, messageName, messageType, messageBody) {
	var route = routingKey ? '/' + routingKey : '';

	return {
		uri: _format(VICTOROPS_URI, apiToken, route),
		headers: {
			'User-Agent': 'Boundary (service@boundary.com)'
		},
		json: {
			'entity_id': messageId,
			'entity_display_name': messageName,
			'message_type': messageType,
			'monitoring_tool': 'Boundary',
			'state_message': messageBody
		}
	};
}

function postmessage(action, alarm, alarmlog, cb) {
	var stats = {
		victorops_messages: 0,
		victorops_errors: 0
	};

	function handleRequest(err, resp, body, cb) {
		if (err || resp.statusCode < 200 || resp.statusCode >= 300) {
			stats.victorops_errors++;
		}
		else {
			stats.victorops_messages++;
		}

		cb(null, stats);
	}

	var config = action && action.configuration && action.configuration || undefined;
	if (!config) {
		return cb('VictorOps Action::No configuration found.');
	}

	if (!config.apiToken) {
		return cb('VictorOps Action::No API Token found.');
	}

	var meta = alarm._meta;
	var links = meta.alarmLinks || [];
	var note = alarm.note ? '\n\nNOTE: ' + alarm.note : '';
	var type = 'CRITICAL'; // Default value is CRITICAL

	// Valid message types: INFO, WARNING, CRITICAL
	if (config.messageType && (config.messageType === 'INFO' || config.messageType === 'WARNING' || config.messageType === 'CRITICAL')) {
		type = config.messageType;
	}

	var alertFuncs = [];

	_.each(links, function(server) {
		var messageId = _format('ALARM/%s/%s/%s', alarm.id, server.serverName, alarm.name);
		var messageName = alarm.name;
		var messageType = server.isSet === false ? 'RECOVERY' : type;
		var messageBody = _format("%s\n\nview dashboard - %s%s", server.labelText, server.link, note);

		var opts = getOptions(config.apiToken, config.routingKey, messageId, messageName, messageType, messageBody);

		function alertFunction(innercb) {
			_request.post(opts, function(err, resp, body) {
				handleRequest(err, resp, body, innercb);
			});
		}

		alertFuncs.push(alertFunction);
	});

	_async.series(alertFuncs, function(err, results) {
		cb(null, stats);
	});

}

module.exports = {
	run : postmessage
};
