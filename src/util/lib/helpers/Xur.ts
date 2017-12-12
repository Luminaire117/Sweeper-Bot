import { Collection, Guild, Message, RichEmbed, TextChannel } from 'discord.js';
import { GuildStorage, ListenerUtil } from 'yamdbf';
import { SweeperClient } from '../SweeperClient';
import * as Schedule from 'node-schedule';
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
	public constructor(client: SweeperClient) {
		this.client = client;
		registerListeners(this.client, this);
	}

	public async init(): Promise<void> {
		const channel: TextChannel = <TextChannel> this.client.channels.get(Constants.bungieAnnouncements);

		if (channel) {
			try {
				let _this: XurResetManager = this;

				await Schedule.scheduleJob('5 12 * * 10', async function() {
					await _this.xurReset(channel);
				});

			}
			catch (err) { console.log(`Could not schedule Xur Reset cron job`); }
		}
		else
			console.log(`Could not locate channel to send xur reset message.`);

	}

	public async xurReset(channel: TextChannel): Promise<void> {
		try {
			var baseUrl = 'https://whereisxur.com/xur-location-destiny-';
			var month = (moment().month() + 1).toString();
			var day = moment().date().toString();
			var year = moment().year().toString();
			month = '12';
			day = '8';
			year = '2017';
			var URL = baseUrl + month + '-' + day + '-' + year;
			request(URL, function(error, response, body) {
				if (error !== null) {
					console.log('xur request error:', error);
				}
				const $ = cheerio.load(body);
				var location = $('h4[class=title]').text().slice(0, -4);
				var itemRow = $('.et_pb_row_5');
				var xurItems = [];
				itemRow.children().find('h4').each(function(i, elem) {
					xurItems[i] = $(this).text();
				});
				channel.send(`${Constants.xurEmoji}**${location}**${Constants.xurEmoji}\n\n`
					+ `**Selling:**\n`
					+ `**Warlock:** ${xurItems[3]} - 23 shards\n`
					+ `**Titan:** ${xurItems[2]} - 23 shards\n`
					+ `**Hunter:** ${xurItems[1]} - 23 shards\n`
					+ `**Gun:** ${xurItems[0]} - 29 shards`);
			});
		} catch (err) { return; }
	}
}
