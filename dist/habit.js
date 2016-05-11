// habitica API
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _bluebird = require('bluebird');

var _fs = require('fs');

var _https = require('https');

var config;

if (process.env.SLACK_HABITICA_BOT_UID && process.env.SLACK_HABITICA_BOT_KEY && process.env.SLACK_HABITICA_BOT_GID) {
	config = {
		uid: process.env.SLACK_HABITICA_BOT_UID,
		key: process.env.SLACK_HABITICA_BOT_KEY,
		groupId: process.env.SLACK_HABITICA_BOT_GID
	};
} else {
	config = JSON.parse((0, _fs.readFileSync)('habit.json'));
}

function parseJSON(resolve, reject, response) {
	var jsonBody = '';
	response.on('data', function (chunk) {
		jsonBody += chunk;
	});
	response.on('end', function () {
		resolve(JSON.parse(jsonBody));
	});
	response.on('error', function (err) {
		reject(err);
	});
};

var habitApi = {
	endpoint: function endpoint(_endpoint) {
		for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
			args[_key - 1] = arguments[_key];
		}

		// console.log(args);
		var urlArgs = args.join('/');
		var path = '/api/v2/' + _endpoint + '/' + urlArgs;
		return new _bluebird.Promise(function (resolve, reject) {
			var options = {
				hostname: 'habitica.com',
				path: path,
				port: 443,
				headers: {
					"x-api-user": config.uid,
					"x-api-key": config.key
				}
			};
			var resolveJSON = function resolveJSON(res) {
				return parseJSON(resolve, reject, res);
			};

			(0, _https.get)(options, resolveJSON);
		});
	},
	getParty: function getParty() {
		return this.endpoint('groups', config.groupId);
	},
	getMember: function getMember(id) {
		return this.endpoint('members', id);
	},
	getPartyMembersInfo: function getPartyMembersInfo() {
		return this.getParty().then(function (json) {
			return json.members.map(function (member) {
				return member._id;
			});
		}).then(function (idArray) {
			return _bluebird.Promise.all(idArray.map(function (id) {
				return habitApi.getMember(id);
			}));
		});
	}
};
exports.habitApi = habitApi;
//# sourceMappingURL=habit.js.map
