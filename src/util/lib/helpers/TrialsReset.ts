import { Collection, Guild, Message, RichEmbed, TextChannel } from 'discord.js';
import { GuildStorage, ListenerUtil } from 'yamdbf';
import { SweeperClient } from '../SweeperClient';
import * as Schedule from 'node-schedule';
import * as WebRequest from 'web-request';
import Constants from '../../Constants';
import Traveler from 'the-traveler';
import { ComponentType } from 'the-traveler/build/enums';
import * as moment from 'moment';

const { on, registerListeners } = ListenerUtil;

export class TrialsResetManager {
	private client: SweeperClient;
	public constructor(client: SweeperClient) {
		this.client = client;
		registerListeners(this.client, this);
	}

	public async init(): Promise<void> {
		const channel: TextChannel = <TextChannel> this.client.channels.get(Constants.bungieAnnouncements);

		if (channel) {
			try {
				let _this: TrialsResetManager = this;

				await Schedule.scheduleJob('5 9 * * 5', async function() {
					await _this.trialsReset(channel);
				});

			}
			catch (err) { console.log(`Could not schedule Trials Reset cron job`); }
		}
		else
			console.log(`Could not locate channel to send trials message.`);

	}

	public async trialsReset(channel: TextChannel): Promise<void> {
		const modChannel: TextChannel = <TextChannel> this.client.channels.get(Constants.modChannelId);

		try {
			const traveler = new Traveler({
				apikey: Constants.destinyAPIKey,
				userAgent: 'sweeper-bot'
			});

			try {
				var res = await traveler.getPublicMilestones();
			} catch (e) {
				modChannel.send('Bungie\'s API is currently unavailable and the automatic trials info was unable to be posted. Please run .trials once servers are back up to post info.');
				console.log(`getPublicMilestones error ${e}`);

			}
			var data = res.Response;
			// get hash for trials
			if (!('3551755444' in data)) {
				modChannel.send('Automatic trials post failed, trials is not currently active.');
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
			let until = moment().add(4, 'days').format('LL');
			channel.send(`Trials of the Nine is now live until the weekly reset occuring on ${until}\n\n`
				+ `**Map:** ${trialsMap}\n`
				+ `**Mode:** ${gameMode}`
			);
			return;
		} catch (err) { return; }
	}
}