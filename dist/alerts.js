// alerts

"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.register = register;
exports.runEach = runEach;
var _alerts = [];

function register(alertFn) {
	_alerts.push(alertFn);
}

function runEach(cb) {
	_alerts.length || cb("No alerts set at this time.");
	_alerts.forEach(function (alert) {
		return alert().then(cb);
	});
}
//# sourceMappingURL=alerts.js.map
