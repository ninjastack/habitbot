/*
	Slack bot for team #ghostbusters on Habitica!
*/

'use strict';

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

var _slackClient = require('slack-client');

var _slackClient2 = _interopRequireDefault(_slackClient);

var _lodashCollection = require('lodash/collection');

var _lodashObject = require('lodash/object');

var _fs = require('fs');

var _commands = require('./commands');

var commands = _interopRequireWildcard(_commands);

// import api token
var token = (0, _fs.readFileSync)('apiToken', { encoding: 'utf8' });
var autoReconnect = true;
var autoMark = true;

var slack = new _slackClient2['default'](token, autoReconnect, autoMark);

function isCommand(string) {
	return (0, _lodashObject.has)(commands, string);
}

function runCommand(command) {
	for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
		args[_key - 1] = arguments[_key];
	}

	return commands[command].apply(commands, args);
}

function parseCommand(channel, user, text) {
	var _text$split = text.split(' ');

	var _text$split2 = _toArray(_text$split);

	var command = _text$split2[0];

	var args = _text$split2.slice(1);

	if (isCommand(command)) {
		runCommand.apply(undefined, [command, channel, user].concat(_toConsumableArray(args)));
	} else {
		console.log("not a command", command);
	}
}

function currentChannels(channels) {
	return (0, _lodashCollection.map)((0, _lodashCollection.filter)(channels, function (channel, key) {
		return channel.is_member;
	}), function (channel, key) {
		return channel.name;
	});
}

function currentGroups(groups) {
	return (0, _lodashCollection.map)((0, _lodashCollection.filter)(groups, function () {
		return group.is_open && !group.is_archived;
	}), function (group, key) {
		return group.name;
	});
}

function isDirect(id, text) {
	var tag = '<@' + id + '>';
	return text && text.substr(0, tag.length) === tag;
}

function isDM(message) {
	return message && message.channel[0] == "D";
}

function stripTag(id, text) {
	var tag = '<@' + id + '>: ';
	return text.substr(tag.length);
}

slack.on('open', function () {
	var channels = currentChannels(slack.channels);
	var groups = currentGroups(slack.groups);
	var unreads = slack.getUnreadCount();

	console.log('In channels: ' + channels.join(', '));
	console.log('In groups: ' + groups.join(', '));
	console.log('Unread messages: ' + unreads);
});

slack.on('message', function (message) {
	var channel = slack.getChannelGroupOrDMByID(message.channel);
	var user = slack.getUserByID(message.user);
	var type = message.type;
	var ts = message.ts;
	var text = message.text;

	if (isDirect(slack.self.id, text)) {
		var userName = (0, _lodashObject.has)(user, 'name') ? user.name : 'UKNNOWN_USER';
		var channelName = channel ? channel.name : 'UKNOWN_CHANNEL';
		var msg = stripTag(slack.self.id, text);

		console.log('[' + type + ':#' + channelName + '] ' + userName + ' ' + ts + '> ' + msg);

		parseCommand(channel, user, msg);
	} else {
		if (isDM(message)) {
			console.log("new DM from ", user.name);
			console.log("dm channel:", channel.id);
			console.log(text);

			console.log('[DM:@' + user.name + '] ' + ts + '> ' + text);

			parseCommand(channel, user, text);
			// now we need to break the message down into commands and route properly
		}
	}
});

slack.on('error', function (err) {
	return console.error(err);
});

// let's go
slack.login();
//# sourceMappingURL=index.js.map
