// commands file

'use strict';

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _bluebird = require('bluebird');

var _momentTimezone = require('moment-timezone');

var _momentTimezone2 = _interopRequireDefault(_momentTimezone);

var _habitJs = require('./habit.js');

var _lodashObject = require('lodash/object');

var _alerts2 = require('./alerts');

var _alerts = _interopRequireWildcard(_alerts2);

_momentTimezone2['default'].tz.setDefault("America/Los_Angeles");

var help_text = {

	"default": 'I am a helper bot for your Habitica party! Here is my current list of commands:\n\t- say <message>: say something in your channel\n\t- list: get the current list of party members\n\t- stats <stat>: get the current value of <stat> for each party member. Type \'help stats\' for more info.\n\t- chat <limit>: get the last <limit> chat messages for the party.\n\t- partyData <path>: retrieve the raw group object and output the value at <path> [volatile]\nIf you have any questions, concerns, or praise, heap it upon lilactown. Thanks!',

	"stats": 'Example: @habitbot: stats hp\n\tAvailable stats are: per, int, con, str, points, class, lvl, gp, exp, mp, hp',

	"chat": 'Example: @habitbot: chat 50\n\tReturns the last N (i.e. 50) chat messages from the party chat'
};

function sendToChannel(channel) {
	return function (text) {
		channel.send(text);
		console.log('[#' + channel.name + '] > ' + text);
	};
}

function statBelow(stat, threshold) {
	return function () {
		return _habitJs.habitApi.getPartyMembersInfo().then(function (members) {
			return members.filter(function (member) {
				return member.stats[stat] < threshold;
			});
		}).then(function (members) {
			var names = members.map(function (member) {
				return member.profile.name;
			}).join(', ');
			return members.length ? stat + ' alert: ' + names + ' ' + (members.length > 1 ? 'are' : 'is') + ' in danger (<' + threshold + ')!' : stat + ' alert: Everyone is fine (>' + threshold + ')! (for now)';
		});
	};
}

var commands = {
	hello: function hello(channel, user) {
		var message = 'Hello, ' + user.name + '! My name is habitbot. Type "@habitbot: help" for more info.';
		sendToChannel(channel)(message);
	},
	help: function help(channel, user, command) {
		if ((0, _lodashObject.has)(help_text, command)) {
			sendToChannel(channel)(help_text[command]);
		} else {
			sendToChannel(channel)(help_text['default']);
		}
	},
	say: function say(channel, user) {
		for (var _len = arguments.length, parts = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
			parts[_key - 2] = arguments[_key];
		}

		var message = parts.join(" ");
		sendToChannel(channel)(message);
	},
	partyData: function partyData(channel, user, path) {
		var send = sendToChannel(channel);
		var getPath = function getPath(json) {
			if ((0, _lodashObject.has)(json, path)) {
				console.log((0, _lodashObject.get)(json, path));
				return (0, _lodashObject.get)(json, path);
			} else {
				return "Value is undefined.";
			}
		};

		var sendValue = function sendValue(value) {
			return send(JSON.stringify(value));
		};

		_habitJs.habitApi.getParty().then(getPath).then(sendValue)['catch'](function (err) {
			return console.error(err);
		});
	},
	chat: function chat(channel, user) {
		var limit = arguments.length <= 2 || arguments[2] === undefined ? 10 : arguments[2];

		var send = sendToChannel(channel);
		var _chat = {
			"text": 'Last ' + limit + ' party chat messages:',
			"as_user": true,
			"token": channel._client.token
		};

		if (limit > 20) {
			limit = 20;
		}

		_habitJs.habitApi.getParty().then(function (json) {
			return json.chat.slice(0, limit);
		}).then(function (chats) {
			return chats.map(function (chat) {
				console.log(chat.timestamp);
				return {
					"text": '(' + (0, _momentTimezone2['default'])(chat.timestamp).calendar() + ') *' + (chat.user || 'habitica') + '*: ' + chat.text,
					"color": !chat.user ? /attacks party for [^0]/i.test(chat.text) ? "danger" : "good" : "#439FE0",
					"mrkdwn_in": ["text"]
				};
			});
		}).then(function (atts) {
			_chat.attachments = atts.reverse();
			return channel.postMessage(_chat);
		})['catch'](function (err) {
			return console.error(err);
		});
	},
	list: function list(channel, user) {
		var send = sendToChannel(channel);
		_habitJs.habitApi.getParty().then(function (json) {
			return json.members.map(function (member) {
				return member.profile.name;
			}).join(', ');
		}).then(send)['catch'](function (err) {
			return console.error(err);
		});
	},
	stats: function stats(channel, user, stat) {
		var send = sendToChannel(channel);
		_habitJs.habitApi.getPartyMembersInfo().then(function (members) {
			return members.map(function (member) {
				return member.profile.name + ': ' + (typeof member.stats[stat] === 'number' ? Math.round(member.stats[stat]) : member.stats[stat]) + ' ' + stat;
			}).join('\n');
		}).then(send)['catch'](function (err) {
			return console.error(err);
		});
	},
	alerts: function alerts(channel, user, command, stat, threshold) {
		var send = sendToChannel(channel);
		if (command === 'register') {
			_alerts.register(statBelow(stat, threshold));
			send('Alert registered: member ' + stat + ' falls below ' + threshold);
		} else {
			_alerts.runEach(send);
		}
	}
};

module.exports = commands;
//# sourceMappingURL=commands.js.map
