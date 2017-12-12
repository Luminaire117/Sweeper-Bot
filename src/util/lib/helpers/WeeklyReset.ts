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

export class WeeklyResetManager {
	private client: SweeperClient;
	public constructor(client: SweeperClient) {
		this.client = client;
		registerListeners(this.client, this);
	}

	public async init(): Promise<void> {
		const channel: TextChannel = <TextChannel> this.client.channels.get(Constants.bungieAnnouncements);

		if (channel) {
			try {
				let _this: WeeklyResetManager = this;

				await Schedule.scheduleJob('3 12 * * 2', async function() {
					await _this.weeklyReset(channel);
				});

			}
			catch (err) { console.log(`Could not schedule Weekly Reset cron job`); }
		}
		else
			console.log(`Could not locate channel to send weekly reset message.`);

	}

	public async weeklyReset(channel: TextChannel): Promise<void> {
		try {
			const traveler = new Traveler({
				apikey: Constants.destinyAPIKey,
				userAgent: 'sweeper-bot'
			});

			try {
				var res = await traveler.getPublicMilestones();
			} catch (e) {
				console.log(`getPublicMilestones error ${e}`);
			}
			var data = res.Response;
			// get hashes for name and modifiers(if available) of current nightfall and raid
			const nfHash = data['2171429505']['availableQuests'][0]['activity']['activityHash'];
			const modHashes = data['2171429505']['availableQuests'][0]['activity']['modifierHashes'];
			const leviathanNormalHash = data['3660836525']['availableQuests'][0]['activity']['activityHash'].toString();
			const leviathanPrestigeHash = data['3660836525']['availableQuests'][0]['activity']['variants'][1]['activityHash'].toString();
			const flashpointHash = data['463010297']['availableQuests'][0]['questItemHash'].toString();

			const meditations = data['3245985898']['availableQuests'];
			const meditationNames = [];
			for (let i = 0, l = meditations.length; i < l; i++) {
				let meditationHash = meditations[i]['activity']['activityHash'];
				let meditationDefinition = await traveler.getDestinyEntityDefinition('DestinyActivityDefinition', meditationHash);
				let meditationName = meditationDefinition.Response.displayProperties.name;
				if (meditationName.includes('Meditation')) {
					meditationName = meditationName.replace('Meditation: \'', '');
					meditationName = meditationName.slice(0, -1);
				}
				meditationNames.push(meditationName);
			}

			// resolve hashes into name and description
			try {
				var nf = await traveler.getDestinyEntityDefinition('DestinyActivityDefinition', nfHash);
			} catch (e) {
				console.log(`nfHash error ${e}`);
			}
			const nfName = nf.Response.displayProperties.name;
			const nfDescription = nf.Response.displayProperties.description;

			// resolve modifier hashes into name and description of modifiers
			var modifierNames = [];
			var modifierDescriptions = [];
			for (let i = 0, l = modHashes.length; l > i; i++) {
				let modHash = modHashes[i];
				var modifier;
				try {
					modifier = await traveler.getDestinyEntityDefinition('DestinyActivityModifierDefinition', modHash);
				} catch (e) {
					console.log(`modHash error ${e}`);
				}
				var modifierName = modifier.Response['displayProperties']['name'];
				var modifierDescription = modifier.Response['displayProperties']['description'];
				modifierNames.push(modifierName);
				modifierDescriptions.push(modifierDescription);
			}
			// raid order
			var order;
			if (Constants.raidOrder[leviathanNormalHash][0] === '' && Constants.raidOrder[leviathanPrestigeHash][0] === '') {
				channel.send(`This week's raid order is not recorded yet, ${leviathanNormalHash}, ${leviathanPrestigeHash}.`);
			} else {
				if (Constants.raidOrder[leviathanNormalHash][0] !== '') {
					order = Constants.raidOrder[leviathanNormalHash];
				}
				else if (Constants.raidOrder[leviathanPrestigeHash][0] !== '') {
					order = Constants.raidOrder[leviathanPrestigeHash];
				}
			// flashpoint
			var flashpointPlanet = Constants.flashpoint[flashpointHash];

			let now = moment().format('LL');
			channel.send(`**Weekly Reset: ${now}**\n\n`
				+ `${Constants.tricornEmoji}__**${nfName}**__ - ${nfDescription}\n`
				+ `__Modifiers:__\n`
				+ `**${modifierNames[0]}**- ${modifierDescriptions[0]}\n`
				+ `**${modifierNames[1]}** - ${modifierDescriptions[1]}\n\n`

				+ `${Constants.raidEmoji}__**Leviathan Raid - Encounter rotation order:**__\n`
				+ `-${order[0]}\n`
				+ `-${order[1]}\n`
				+ `-${order[2]}\n`
				+ `-Calus\n\n`

				+ `${Constants.tricornEmoji}__**Flashpoint:**__ ${flashpointPlanet}\n`
				+ `*Don't forget to buy the Treasure Maps from Cayde-6 as well.*\n\n`

				+ `${Constants.tricornEmoji}__**Meditations:**__\n`
				+ `-${meditationNames.join('\n-')}`
			);
			}
			return;
		} catch (err) { return; }
	}
}
