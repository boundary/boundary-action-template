var _expect = require('chai').expect;
var _mockAlarm = require('./mockAlarm').getAlarm();
var _nock = require('nock');
var _victorops = require('../app/victorops');

// Set this to true to see debug messages in the console output
var consoleOutput = false;

var apiToken = '7b37e7c0-1d42-40b3-a2f3-760001fea15b';
var routingKey = 'level3';

var victorOpsUrl = 'https://alert.victorops.com';
var urlPath1 = '/integrations/generic/20131114/alert/' + apiToken + '/' + routingKey;
var urlPath2 = '/integrations/generic/20131114/alert/' + apiToken;

var mockAction1 = {
	configuration: {
		apiToken: apiToken,
		routingKey: routingKey,
		messageType: 'CRITICAL'
	}
};

var mockAction2 = {
	configuration: {
		apiToken: apiToken,
		messageType: 'CRITICAL'
	}
};

var mockAction3 = {
	configuration: {
		apiToken: apiToken,
		routingKey: routingKey,
		messageType: 'WARNING'
	}
};

var mockAction4 = {
	configuration: {
		apiToken: apiToken,
		messageType: 'WARNING'
	}
};

var mockAction5 = {
	configuration : {
		apiToken : apiToken,
		routingKey : routingKey,
		messageType : 'INFO'
	}
};

var mockAction6 = {
	configuration: {
		apiToken: apiToken,
		messageType: 'INFO'
	}
};

var expectedRequestBody1 = {
	"entity_id": "ALARM/40506/www-server-1/CPU usage is high",
	"entity_display_name": "CPU usage is high",
	"message_type": "CRITICAL",
	"monitoring_tool": "Boundary",
	"state_message": "Server www-server-1's avg cpu utilization is 82.5%\n\nview dashboard - https://premium.boundary.com/home/5733/standard?ival=60&marker=1422377400000!network\n\nNOTE: CPU Utilization has exceeded 80% over a 60s duration"
};

var expectedRequestBody2 = {
	"entity_id": "ALARM/40506/www-server-1/CPU usage is high",
	"entity_display_name": "CPU usage is high",
	"message_type": "WARNING",
	"monitoring_tool": "Boundary",
	"state_message": "Server www-server-1's avg cpu utilization is 82.5%\n\nview dashboard - https://premium.boundary.com/home/5733/standard?ival=60&marker=1422377400000!network\n\nNOTE: CPU Utilization has exceeded 80% over a 60s duration"
};

var expectedRequestBody3 = {
	"entity_id": "ALARM/40506/www-server-1/CPU usage is high",
	"entity_display_name": "CPU usage is high",
	"message_type": "INFO",
	"monitoring_tool": "Boundary",
	"state_message": "Server www-server-1's avg cpu utilization is 82.5%\n\nview dashboard - https://premium.boundary.com/home/5733/standard?ival=60&marker=1422377400000!network\n\nNOTE: CPU Utilization has exceeded 80% over a 60s duration"
};

var expectedStatistics1 = {
	"victorops_messages": 0,
	"victorops_errors": 4
};

var expectedStatistics2 = {
	"victorops_messages": 4,
	"victorops_errors": 0
};

function setupNock(urlPath, expectedRequestBody, debug) {
	if (debug) {
		console.log('\nurl ==>' + victorOpsUrl + urlPath + '<==');
	}

	// Set up nock...

	// www-server-1
	_nock(victorOpsUrl)
	.filteringRequestBody(
		function(reqBody) {
			var reqBodyObj = JSON.parse(reqBody);
			var reqBodyString = JSON.stringify(reqBodyObj, null, 2);
			_expect(reqBodyString).to.equal(JSON.stringify(expectedRequestBody, null, 2));
			if (debug) {
				console.log('reqBody ==>' + reqBodyString + '<==\n');
			}
		}
	)
	.post(urlPath)
	.reply(200, {
		result: 'success',
		entity_id: 'ALARM/40506/www-server-1/CPU usage is high'
	});

	// www-server-2
	_nock(victorOpsUrl)
	.filteringRequestBody(
		function(reqBody) {
			var reqBodyObj = JSON.parse(reqBody);
			var reqBodyString = JSON.stringify(reqBodyObj, null, 2);
			if (debug) {
				console.log('reqBody ==>' + reqBodyString + '<==\n');
			}
		}
	)
	.post(urlPath)
	.reply(200, {
		result: 'success',
		entity_id: 'ALARM/40506/www-server-2/CPU usage is high'
	});

	// www-server-3
	_nock(victorOpsUrl)
	.filteringRequestBody(
		function(reqBody) {
			var reqBodyObj = JSON.parse(reqBody);
			var reqBodyString = JSON.stringify(reqBodyObj, null, 2);
			if (debug) {
				console.log('reqBody ==>' + reqBodyString + '<==\n');
			}
		}
	)
	.post(urlPath)
	.reply(200, {
		result: 'success',
		entity_id: 'ALARM/40506/www-server-3/CPU usage is high'
	});

	// www-server-4
	_nock(victorOpsUrl)
	.filteringRequestBody(
		function(reqBody) {
			var reqBodyObj = JSON.parse(reqBody);
			var reqBodyString = JSON.stringify(reqBodyObj, null, 2);
			if (debug) {
				console.log('reqBody ==>' + reqBodyString + '<==\n');
			}
		}
	)
	.post(urlPath)
	.reply(200, {
		result: 'success',
		entity_id: 'ALARM/40506/www-server-4/CPU usage is high'
	});
}

afterEach(function() {
	_nock.cleanAll();
});

describe('VictorOps', function() {

	describe('Action', function() {

		it('should define a run() function.', function() {
			_expect(_victorops.run).to.not.be.undefined;
		});

		it('should return an error if there is no configuration.', function(done) {
			var action = {};
			var alarm = {};
			var alarmlog = {};
			var cb = function(err, statistics) {
				_expect(err).to.equal('VictorOps Action::No configuration found.');
			};

			_victorops.run(action, alarm, alarmlog, cb);

			setTimeout(function() {
				done();
			}, 50);
		});

		it('should return an error if there is no API key.', function(done) {
			var action = {
				configuration : {}
			};
			var alarm = {};
			var alarmlog = {};
			var cb = function(err, statistics) {
				_expect(err).to.equal('VictorOps Action::No API Token found.');
			};

			_victorops.run(action, alarm, alarmlog, cb);

			setTimeout(function() {
				done();
			}, 50);
		});

		it('should increment the error stats count when the status code returned from calling VictorOps is not a success code.', function(done) {
			_nock(victorOpsUrl)
			.post(urlPath1)
			.reply(500, {});

			var action = mockAction1;
			var alarm = _mockAlarm;
			var alarmlog = {};
			var cb = function(err, statistics) {
				_expect(err, 'Error parameter to callback should be null').to.be.null;
				var statsString = JSON.stringify(statistics, null, 2);
				_expect(statsString).to.equal(JSON.stringify(expectedStatistics1, null, 2), 'Statistics parameter to callback is not correct.');
			};

			_victorops.run(action, alarm, alarmlog, cb);

			setTimeout(function() {
				done();
			}, 50);
		});

		it('should have the correct statistics for an alarm with 4 servers, routing key is present, message type is CRITICAL.', function(done) {
			setupNock(urlPath1, expectedRequestBody1, consoleOutput);

			var action = mockAction1;
			var alarm = _mockAlarm;
			var alarmlog = {};
			var cb = function(err, statistics) {
				_expect(err, 'Error parameter to callback should be null').to.be.null;
				var statsString = JSON.stringify(statistics, null, 2);
				_expect(statsString).to.equal(JSON.stringify(expectedStatistics2, null, 2), 'Statistics parameter to callback is not correct.');
			};

			_victorops.run(action, alarm, alarmlog, cb);

			setTimeout(function() {
				done();
			}, 50);
		});

		it('should have the correct statistics for an alarm with 4 servers, routing key is not present, message type is CRITICAL.', function(done) {
			setupNock(urlPath2, expectedRequestBody1, consoleOutput);

			var action = mockAction2;
			var alarm = _mockAlarm;
			var alarmlog = {};
			var cb = function(err, statistics) {
				_expect(err, 'Error parameter to callback should be null').to.be.null;
				var statsString = JSON.stringify(statistics, null, 2);
				_expect(statsString).to.equal(JSON.stringify(expectedStatistics2, null, 2), 'Statistics parameter to callback is not correct.');
			};

			_victorops.run(action, alarm, alarmlog, cb);

			setTimeout(function() {
				done();
			}, 50);
		});

		it('should have the correct statistics for an alarm with 4 servers, routing key is present, message type is WARNING.', function(done) {
			setupNock(urlPath1, expectedRequestBody2, consoleOutput);

			var action = mockAction3;
			var alarm = _mockAlarm;
			var alarmlog = {};
			var cb = function(err, statistics) {
				_expect(err, 'Error parameter to callback should be null').to.be.null;
				var statsString = JSON.stringify(statistics, null, 2);
				_expect(statsString).to.equal(JSON.stringify(expectedStatistics2, null, 2), 'Statistics parameter to callback is not correct.');
			};

			_victorops.run(action, alarm, alarmlog, cb);

			setTimeout(function() {
				done();
			}, 50);
		});

		it('should have the correct statistics for an alarm with 4 servers, routing key is not present, message type is WARNING.', function(done) {
			setupNock(urlPath2, expectedRequestBody2, consoleOutput);

			var action = mockAction4;
			var alarm = _mockAlarm;
			var alarmlog = {};
			var cb = function(err, statistics) {
				_expect(err, 'Error parameter to callback should be null').to.be.null;
				var statsString = JSON.stringify(statistics, null, 2);
				_expect(statsString).to.equal(JSON.stringify(expectedStatistics2, null, 2), 'Statistics parameter to callback is not correct.');
			};

			_victorops.run(action, alarm, alarmlog, cb);

			setTimeout(function() {
				done();
			}, 50);
		});

		it('should have the correct statistics for an alarm with 4 servers, routing key is present, message type is INFO.', function(done) {
			setupNock(urlPath1, expectedRequestBody3, consoleOutput);

			var action = mockAction5;
			var alarm = _mockAlarm;
			var alarmlog = {};
			var cb = function(err, statistics) {
				_expect(err, 'Error parameter to callback should be null').to.be.null;
				var statsString = JSON.stringify(statistics, null, 2);
				_expect(statsString).to.equal(JSON.stringify(expectedStatistics2, null, 2), 'Statistics parameter to callback is not correct.');
			};

			_victorops.run(action, alarm, alarmlog, cb);

			setTimeout(function() {
				done();
			}, 50);
		});

		it('should have the correct statistics for an alarm with 4 servers, routing key is not present, message type is INFO.', function(done) {
			setupNock(urlPath2, expectedRequestBody3, consoleOutput);

			var action = mockAction6;
			var alarm = _mockAlarm;
			var alarmlog = {};
			var cb = function(err, statistics) {
				_expect(err, 'Error parameter to callback should be null').to.be.null;
				var statsString = JSON.stringify(statistics, null, 2);
				_expect(statsString).to.equal(JSON.stringify(expectedStatistics2, null, 2), 'Statistics parameter to callback is not correct.');
			};

			_victorops.run(action, alarm, alarmlog, cb);

			setTimeout(function() {
				done();
			}, 50);
		});
	});
});
