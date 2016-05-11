/*
	Slack bot for team #ghostbusters on Habitica!
*/

import { default as Slack } from 'slack-client';
import { map, filter } from 'lodash/collection';
import { has } from 'lodash/object';
import { readFileSync } from 'fs';
import * as commands from './commands';


// import api token
const token = process.env.SLACK_HABITICA_BOT_TOKEN || readFileSync('apiToken', { encoding: 'utf8' });
const autoReconnect = true;
const autoMark = true;

const slack = new Slack(token, autoReconnect, autoMark);

function isCommand(string) {
	return has(commands, string);
}

function runCommand(command, ...args) {
	return commands[command](...args);
} 

function parseCommand(channel, user, text) {
	const [command, ...args] = text.split(' ');
	if (isCommand(command)) {
		runCommand(command, channel, user, ...args);
	} else {
		console.log("not a command", command);
	}
}

function currentChannels(channels) {
	return map(
		filter(channels, (channel, key) => channel.is_member),
		(channel, key) => channel.name
	);
}

function currentGroups(groups) {
	return map(
		filter(groups, () => group.is_open && !group.is_archived),
		(group, key) => group.name
	);
}

function isDirect(id, text) {
	const tag = `<@${id}>`;
	return text && text.substr(0, tag.length) === tag;
}

function isDM(message) {
	return message && message.channel[0] == "D";
}

function stripTag(id, text) {
	const tag = `<@${id}>: `;
	return text.substr(tag.length);
}

slack.on('open', () => {
	const channels = currentChannels(slack.channels);
	const groups = currentGroups(slack.groups);
	const unreads = slack.getUnreadCount();

	console.log(`In channels: ${channels.join(', ')}`);
	console.log(`In groups: ${groups.join(', ')}`);
	console.log(`Unread messages: ${unreads}`);
});

slack.on('message', (message) => {
	const channel = slack.getChannelGroupOrDMByID(message.channel);
	const user = slack.getUserByID(message.user);
	const {type, ts, text} = message;

	if (isDirect(slack.self.id, text)) {
		const userName = has(user, 'name') ? user.name : 'UKNNOWN_USER';
		const channelName = channel ? channel.name : 'UKNOWN_CHANNEL';
		const msg = stripTag(slack.self.id, text);

		console.log(`[${type}:#${channelName}] ${userName} ${ts}> ${msg}`);

		parseCommand(channel, user, msg);
	} else {
		if(isDM(message)) {
			console.log("new DM from ", user.name);
			console.log("dm channel:", channel.id);
			console.log(text);

			console.log(`[DM:@${user.name}] ${ts}> ${text}`);

			parseCommand(channel, user, text);
			// now we need to break the message down into commands and route properly
		}
	}
});

slack.on('error', (err) => console.error(err));

// let's go
slack.login();

var responses = [
	"Huh?  What?  I'm totally awake...",
	"FUCKING WHAT?!",
	"I live to serve.",
	"Moar work?",
	"Assphinctersayswhat?",
	"I am here.",
	"There's always money in the banana stand..."
];

require("http").createServer(function(req, res) {
	console.log("Wake-up call.");
    res.end(responses[Math.floor(Math.random()*responses.length)]);
}).listen(process.env.PORT || 5000);
