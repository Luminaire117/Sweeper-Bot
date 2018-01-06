import { Collection, Guild, Message, RichEmbed, TextChannel } from 'discord.js';
import { GuildStorage, ListenerUtil } from 'yamdbf';
import { Logger, logger } from 'yamdbf';
import { SweeperClient } from '../SweeperClient';
import * as Schedule from 'node-schedule-tz';
import * as WebRequest from 'web-request';
import * as request from 'request';
import * as cheerio from 'cheerio';
import Constants from '../../Constants';
import Traveler from 'the-traveler';
import { ComponentType } from 'the-traveler/build/enums';
import * as moment from 'moment';

const { on, registerListeners } = ListenerUtil;

export class XurResetManager {
	private client: SweeperClient;
	@logger private readonly logger: Logger;
	public constructor(client: SweeperClient) {
		this.client = client;
		registerListeners(this.client, this);
	}

	public async init(): Promise<void> {
		const channel: TextChannel = <TextChannel> this.client.channels.get(Constants.bungieAnnouncements);

		if (channel) {
			try {
				let _this: XurResetManager = this;

				var rule = new Schedule.RecurrenceRule();
				rule.dayOfWeek = 5;
				rule.tz = 'America/Los_Angeles';
				rule.hour = 9;
				rule.minute = 10;

				await Schedule.scheduleJob(rule, async function() {
					await _this.xurReset(channel);
				});

			}
			catch (err) {
				return this.logger.error('Helper XurReset', 'Could not schedule Xur Reset cron job');
			}
		}
		else {
			return this.logger.error('Could not locate channel to send xur reset message.');
		}
	}

	public async xurReset(channel: TextChannel): Promise<void> {
		const modChannel: TextChannel = <TextChannel> this.client.channels.get(Constants.modChannelId);
		try {
			var baseUrl = 'https://whereisxur.com/xur-location-destiny-';
			var month = (moment().day(moment().day() >= 5 ? 5 : -2).month() + 1).toString();
			var day = moment().day(moment().day() >= 5 ? 5 : -2).date().toString();
			var year = moment().day(moment().day() >= 5 ? 5 : -2).year().toString();
			var URL = baseUrl + month + '-' + day + '-' + year;
			request(URL, function(error, response, body) {
				if (error !== null) {
					this.logger.error('Helper XurReset', `Request error ${error}`);
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
			});
		} catch (err) { return; }
	}
}
