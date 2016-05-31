// commands file

import { Promise } from 'bluebird';
import moment from 'moment-timezone';
import { habitApi } from './habit.js';
import { has, get } from 'lodash/object';
import * as alerts from './alerts';


moment.tz.setDefault("America/New_York");

const help_text = {

	"default": 
`I am a helper bot for your Habitica party! Here is my current list of commands:
	- say <message>: say something in your channel
	- list: get the current list of party members
	- stats <stat>: get the current value of <stat> for each party member. Type 'help stats' for more info.
	- chat <limit>: get the last <limit> chat messages for the party.
	- partyData <path>: retrieve the raw group object and output the value at <path> [volatile]
If you have any questions, concerns, or praise, heap it upon lilactown. Thanks!`,

	"stats":
`Example: @habitbot: stats hp
	Available stats are: per, int, con, str, points, class, lvl, gp, exp, mp, hp`,

	"chat":
`Example: @habitbot: chat 50
	Returns the last N (i.e. 50) chat messages from the party chat`
};

function sendToChannel(channel) {
	return function (text) {
		channel.send(text);
		console.log(`[#${channel.name}] > ${text}`);
	};
}

function statBelow(stat, threshold) {
	return () => habitApi
		.getPartyMembersInfo()
		.then((members) => members.filter((member) => member.stats[stat] < threshold))
		.then((members) => {
			const names = members.map((member) => member.profile.name).join(', ');
			return members.length ? `${stat} alert: ${names} ${members.length > 1 ? 'are' : 'is'} in danger (<${threshold})!` : `${stat} alert: Everyone is fine (>${threshold})! (for now)`;
		});
}

const commands = {
	hello(channel, user) {
		const message = `Hello, ${user.name}! My name is habitbot. Type "@habitbot: help" for more info.`;
		sendToChannel(channel)(message);
	},
	help(channel, user, command) {
		if(has(help_text,command)) {
			sendToChannel(channel)(help_text[command]);
		} else {
			sendToChannel(channel)(help_text.default);
		}
	},
	say(channel, user, ...parts) {
		const message = parts.join(" ");
		sendToChannel(channel)(message);
	},
	partyData(channel, user, path) {
		const send = sendToChannel(channel);
		const getPath = (json) => {
			if (has(json, path)) {
				console.log(get(json, path));
				return get(json, path);
			}
			else {
				return "Value is undefined.";
			}
		};

		const sendValue = (value) => send(JSON.stringify(value));

		habitApi
			.getParty()
			.then(getPath)
			.then(sendValue)
			.catch((err) => console.error(err));
	},
	chat(channel,user,limit=10) {
		const send = sendToChannel(channel);
		const _chat = {
			"text": `Last ${limit} party chat messages:`,
			"as_user": true,
			"token": channel._client.token
		};

		if(limit>20) {
			limit = 20;
		}

		habitApi
			.getParty()
			.then((json) => json.chat.slice(0,limit))
			.then((chats) => chats.map((chat) => { 
					console.log(chat.timestamp);
					return {
						"text": `(${moment(chat.timestamp).calendar()}) *${chat.user || 'habitica'}*: ${chat.text}`,
						"color": (!chat.user) ? (/attacks party for [^0]/i.test(chat.text) ? "danger" : "good") : "#439FE0",
						"mrkdwn_in": ["text"]
					};
				})
			)
			.then((atts) => { 
				_chat.attachments = atts.reverse();
				return channel.postMessage(_chat);
			})
			.catch((err) => console.error(err));
	},
	list(channel, user) {
		const send = sendToChannel(channel);
		habitApi
			.getParty()
			.then((json) => json.members.map((member) => member.profile.name).join(', '))
			.then(send)
			.catch((err) => console.error(err));
	},
	stats(channel, user, stat) {
		const send = sendToChannel(channel);
		habitApi
			.getPartyMembersInfo()
			.then((members) => members.map((member) => `${member.profile.name}: ${typeof member.stats[stat] === 'number' ? Math.round(member.stats[stat]) : member.stats[stat]} ${stat}`).join('\n'))
			.then(send)
			.catch((err) => console.error(err));
	},
	alerts(channel, user, command, stat, threshold) {
		const send = sendToChannel(channel);
		if (command === 'register') {
			alerts.register(statBelow(stat, threshold));
			send(`Alert registered: member ${stat} falls below ${threshold}`)
		}
		else {
			alerts.runEach(send);
		}
	}
};

module.exports = commands;
