import { Command } from 'yamdbf';
import { Logger, logger } from 'yamdbf';
import { Collection, GuildMember, Message, RichEmbed, Role, User, TextChannel } from 'discord.js';
import Constants from '../../util/Constants';
import Traveler from 'the-traveler';
import { ComponentType } from 'the-traveler/build/enums';
import * as moment from 'moment';
const config: any = require('../../config.json');

export default class Weekly extends Command {
	@logger private readonly logger: Logger;
	public constructor() {
		super({
			name: 'weekly',
			desc: 'Posts weekly reset info from Bungie API.',
			usage: '<prefix>weekly',
			group: 'modtools',
			guildOnly: true,
			callerPermissions: ['MANAGE_MESSAGES']
		});
	}

	public async action(message: Message, args: string[]): Promise<any> {
		const channel: TextChannel = <TextChannel> this.client.channels.get(Constants.bungieAnnouncements);
		const modChannel: TextChannel = <TextChannel> this.client.channels.get(Constants.modChannelId);
		// start typing
		channel.startTyping();

		const traveler = new Traveler({
			apikey: Constants.destinyAPIKey,
			userAgent: 'sweeper-bot'
		});

		try {
			var res = await traveler.getPublicMilestones();
		} catch (e) {
			modChannel.send('Unable to reach Destiny API, if maintenance is ongoing, please try again after.');
			this.logger.error('CMD Weekly', `Unable to reach Destiny API.\n\n**Error:** ${e}`);
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
			modChannel.send('An error has occured, please try again later or let a dev know.');
			this.logger.error('CMD Weekly', `Nightfall hash error has occured ${e}`);
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
				modChannel.send('An error has occured, please try again later or let a dev know.');
				this.logger.error('CMD Weekly', `Nightfall modifier hash error has occured ${e}`);
			}
			var modifierName = modifier.Response['displayProperties']['name'];
			var modifierDescription = modifier.Response['displayProperties']['description'];
			modifierNames.push(modifierName);
			modifierDescriptions.push(modifierDescription);
		}
		// raid order
		var order;
		if (Constants.raidOrder[leviathanNormalHash][0] === '' && Constants.raidOrder[leviathanPrestigeHash][0] === '') {
			modChannel.send(`This week's raid order is not recorded yet, ${leviathanNormalHash}, ${leviathanPrestigeHash}.`);
		} else {
			if (Constants.raidOrder[leviathanNormalHash][0] !== '') {
				order = Constants.raidOrder[leviathanNormalHash];
			}
			else if (Constants.raidOrder[leviathanPrestigeHash][0] !== '') {
				order = Constants.raidOrder[leviathanPrestigeHash];
			}
		// flashpoint
		var flashpointPlanet = Constants.flashpoint[flashpointHash];
			let tuesday = moment().day(moment().day() >= 2 ? 2 : -5).format('LL');
			channel.send(`**Weekly Reset: ${tuesday}**\n\n`
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
			channel.stopTyping();
			return;
		}
	}
