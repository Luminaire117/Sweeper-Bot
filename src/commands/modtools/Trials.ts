import { Command } from 'yamdbf';
import { Collection, GuildMember, Message, RichEmbed, Role, User, TextChannel } from 'discord.js';
import Constants from '../../util/Constants';
import Traveler from 'the-traveler';
import { ComponentType } from 'the-traveler/build/enums';
import * as moment from 'moment';
const config: any = require('../../config.json');

export default class Trials extends Command {
	public constructor() {
		super({
			name: 'trials',
			desc: 'Posts weekly trials info from Bungie API.',
			usage: '<prefix>trials',
			group: 'modtools',
			guildOnly: true,
			callerPermissions: ['MANAGE_MESSAGES']
		});
	}

	public async action(message: Message, args: string[]): Promise<any> {

		const channel: TextChannel = <TextChannel> this.client.channels.get(Constants.bungieAnnouncements);
		try {
			const traveler = new Traveler({
				apikey: Constants.destinyAPIKey,
				userAgent: 'sweeper-bot'
			});

			try {
				var res = await traveler.getPublicMilestones();
			} catch (e) {
				console.log(`getPublicMilestones error ${e}`);
				return message.reply('Bungie\'s API is currently unavailable, please try again later.');

			}
			var data = res.Response;
			// get hash for trials
			if (!('3551755444' in data)) {
				return message.reply('Trials is not currently active, please try again on Friday after 9AM Pacific.');
			}
			var trialsHash = data['3551755444']['availableQuests'][0]['activity']['activityHash'];
			var gameModeType = data['3551755444']['availableQuests'][0]['activity']['activityModeType'].toString();

			// get name of trials map
			var trialsActivity = await traveler.getDestinyEntityDefinition('DestinyActivityDefinition', trialsHash);
			var trialsMap = trialsActivity.Response['displayProperties']['name'];

			var gameMode;
			if (gameModeType === '41') {
				gameMode = 'Countdown';
			} else if (gameModeType === '42') {
				gameMode = 'Survival';
			}	else {
				return console.log('Unknown error has occured with trials API, game type was not 41 or 42');
			}
			let until = moment().day(moment().day() > 2 ? 2 : -5).add(1, 'week');
			channel.send(`Trials of the Nine is now live until the weekly reset occuring on ${until}\n\n`
				+ `**Map:** ${trialsMap}\n`
				+ `**Mode:** ${gameMode}`
			);
			return;
		} catch (err) { return; }
	}
}
