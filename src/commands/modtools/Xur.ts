import { Command } from 'yamdbf';
import { Logger, logger } from 'yamdbf';
import { Collection, GuildMember, Message, RichEmbed, Role, User, TextChannel } from 'discord.js';
import Constants from '../../util/Constants';
import Traveler from 'the-traveler';
import { ComponentType } from 'the-traveler/build/enums';
import * as moment from 'moment';
const config: any = require('../../config.json');
import * as request from 'request';
import * as cheerio from 'cheerio';

export default class Xur extends Command {
	@logger private readonly logger: Logger;
	public constructor() {
		super({
			name: 'xur',
			desc: 'Posts xur\'s items from API.',
			usage: '<prefix>xur',
			group: 'modtools',
			guildOnly: true,
			callerPermissions: ['MANAGE_MESSAGES']
		});
	}

	public async action(message: Message, args: string[]): Promise<any> {

		const channel: TextChannel = <TextChannel> this.client.channels.get(Constants.bungieAnnouncements);
		const modChannel: TextChannel = <TextChannel> this.client.channels.get(Constants.modChannelId);
		channel.startTyping();
		var baseUrl = 'https://whereisxur.com/xur-location-destiny-';
		var month = (moment().day(moment().day() >= 5 ? 5 : -2).month() + 1).toString();
		var day = moment().day(moment().day() >= 5 ? 5 : -2).date().toString();
		var year = moment().day(moment().day() >= 5 ? 5 : -2).year().toString();
		var URL = baseUrl + month + '-' + day + '-' + year;
		request(URL, function(error, response, body) {
			if (error !== null) {
				this.logger.error('CMD Xur', `Error reaching xur website ${error}`);
				return modChannel.send('Xur\'s API is currently unavailable and the automatic xur post wasn\'t able to run. Please run .xur once servers are back up to post info.');
			}
			const $ = cheerio.load(body);
			var location = $('h4[class=title]').text().slice(0, -4);
			var itemRow = $('.et_pb_row_5');
			var xurItems: Array<string> = [];
			itemRow.children().find('h4').each(function(i, elem) {
				xurItems[i] = $(this).text();
			});
			channel.send(`${Constants.xurEmoji}**${location}**${Constants.xurEmoji}\n\n`
				+ `**Selling:**\n`
				+ `**Warlock:** ${xurItems[3]} - 23 shards\n`
				+ `**Titan:** ${xurItems[2]} - 23 shards\n`
				+ `**Hunter:** ${xurItems[1]} - 23 shards\n`
				+ `**Gun:** ${xurItems[0]} - 29 shards\n\n`
				+ `Three of Coins - 31 shards\n`
				+ `Fated Engram - 97 shards (Reminder: **Once per account per week**)`);
			channel.stopTyping();
		});
	}
}
