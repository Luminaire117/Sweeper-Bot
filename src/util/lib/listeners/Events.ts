import { GuildStorage, ListenerUtil, Logger, logger } from 'yamdbf';
import { Collection, TextChannel, RichEmbed, Message, MessageReaction, Guild, GuildMember, Role, User, VoiceChannel } from 'discord.js';
import { SweeperClient } from '../SweeperClient';
import * as MuteManager from '../mod/managers/MuteManager';
import Constants from '../../Constants';
import * as moment from 'moment';

const maint: any = require('../../../maintenance.json');
const { on, registerListeners } = ListenerUtil;
const fetch = require('snekfetch');

export class Events {
	private _client: SweeperClient;
	@logger private readonly logger: Logger;

	public constructor(client: SweeperClient)
	{
		this._client = client;
		registerListeners(this._client, this);
	}

	@on('guildMemberUpdate')
	private async _onGuildMemberUpdate(oldMember: GuildMember, newMember: GuildMember): Promise<void> {
		if (oldMember.roles.exists('id', Constants.moderatorRoleId) && !newMember.roles.exists('id', Constants.moderatorRoleId)) {
			this._client.mod.actions.setModStatus(newMember, false);
		} else if (!oldMember.roles.exists('id', Constants.moderatorRoleId) && newMember.roles.exists('id', Constants.moderatorRoleId)) {
			this._client.mod.actions.setModStatus(newMember, true);
		}
	}

	@on('voiceStateUpdate')
	private async _onVoiceStateUpdate(oldMember: GuildMember, newMember: GuildMember): Promise<void> {
		let oldUserChannel = oldMember.voiceChannel;
		let newUserChannel = newMember.voiceChannel;
		let emptyChannels: number = this._client.voiceChannelManager.getEmptyVoiceChannels(newMember.guild).size;
		let makeChannel: boolean = false;

		if (emptyChannels <= 2)
			makeChannel = true;

		if ((newMember.voiceChannel !== undefined && newMember.voiceChannelID !== null && newMember.voiceChannel.name.startsWith('Fireteam ')) && makeChannel) {
			this._client.voiceChannelManager.createChannel(newMember);
		}

		const voiceLogs: TextChannel = <TextChannel> newMember.guild.channels.find('name', 'voice-logs');
		let oldUsers: Array<User>;
		let newUsers: Array<User>;
		if (oldUserChannel !== undefined) {
			oldUsers = oldUserChannel.members.map((member: GuildMember) => member.user);
			oldUsers.push(oldMember.user);
		}
		if (newUserChannel !== undefined) {
			newUsers = newUserChannel.members.map((member: GuildMember) => member.user);
		}

		let channelStatus: string = '';
		if (oldUserChannel === undefined) {
			channelStatus = 'Joined Voice Channel';
		} else if (newUserChannel === undefined) {
			channelStatus = 'Left Voice Channel';
		} else if (oldUserChannel !== undefined && newUserChannel !== undefined) {
			channelStatus = 'Moved Voice channel';
		}

		let userAudioChange: boolean = false;
		if ((oldMember.mute && !newMember.mute) || (!oldMember.mute && newMember.mute) ||
			(oldMember.deaf && !oldMember.deaf) || (!oldMember.deaf && newMember.deaf)) {
			userAudioChange = true;
			return;
		}

		const embed: RichEmbed = new RichEmbed()
			.setColor(0xff69b4)
			.setAuthor(`${newMember.user.tag} (${newMember.id})`, newMember.user.avatarURL)
			.setDescription(`**Reason:** ${channelStatus}\n`
					+ `**Old Channel:** ${oldUserChannel ? oldUserChannel.name : ''} (${oldUserChannel ? oldUserChannel.id : ''})\n`
					+ `**Old Channel Users:** ${oldUsers ? oldUsers.toString() : ''}\n`
					+ `**New Channel:** ${newUserChannel ? newUserChannel.name : ''} (${newUserChannel ? newUserChannel.id : ''})\n`
					+ `**New Channel Users:** ${newUsers ? newUsers.toString() : ''}`)
			.setTimestamp();
		voiceLogs.send({ embed });
	}

	@on('messageReactionAdd')
	private async _onReaction(reaction: MessageReaction, user: User): Promise<any> {
		if (user.id === this._client.user.id)
			return;

		const reactionAuthor: GuildMember = await reaction.message.guild.fetchMember(user);
		let guildStorage: GuildStorage = await this._client.storage.guilds.get(reaction.message.guild.id);

		let platformMessageId: string = await guildStorage.get('Role Reaction Message');
		let spoilersMessageId: string = await guildStorage.get('Spoiler Reaction Message');
		let factionMessageId: string = await guildStorage.get('Faction Reaction Message');
		let serverNewsMessageId: string = await guildStorage.get('ServerNews Reaction Message');
		let bungieNewsMessageId: string = await guildStorage.get('BungieNews Reaction Message');

		let roles: Array<Role> = new Array();

		// Platform
		roles[0] = reaction.message.guild.roles.find('name', 'PC');
		roles[1] = reaction.message.guild.roles.find('name', 'PlayStation');
		roles[2] = reaction.message.guild.roles.find('name', 'Xbox');
		// Spoilers Enabled
		roles[3] = reaction.message.guild.roles.find('name', 'Spoilers Enabled');
		// Factions
		roles[4] = reaction.message.guild.roles.find('name', 'Dead Orbit');
		roles[5] = reaction.message.guild.roles.find('name', 'Future War Cult');
		roles[6] = reaction.message.guild.roles.find('name', 'New Monarchy');
		// Server/Bungie News
		roles[7] = reaction.message.guild.roles.find('name', 'Discord Server News'); // Discord Server News
		roles[8] = reaction.message.guild.roles.find('name', 'Bungie News'); // Bungie News

		// Platform Message
		if (reaction.message.id === platformMessageId) {
			switch (reaction.emoji.name) {
				case 'blizz':
					if (reactionAuthor.roles.has(roles[0].id)) return reaction.remove(user);
					else return await reactionAuthor.addRole(roles[0]);

				case 'ps':
					if (reactionAuthor.roles.has(roles[1].id)) return reaction.remove(user);
					else return await reactionAuthor.addRole(roles[1]);

				case 'xb':
					if (reactionAuthor.roles.has(roles[2].id)) return reaction.remove(user);
					else return await reactionAuthor.addRole(roles[2]);
			}
		}

		// Spoiler Message
		if (reaction.message.id === spoilersMessageId) {
			switch (reaction.emoji.name) {
				case 'D2':
					if (reactionAuthor.roles.has(roles[3].id)) return reaction.remove(user);
					else return await reactionAuthor.addRole(roles[3]);
			}
		}

		// Faction Wars Message
		if (reaction.message.id === factionMessageId) {
			switch (reaction.emoji.name) {
				case 'do':
					// If they already have the role, remove it so they can re-react to add it.
					if (reactionAuthor.roles.has(roles[4].id))
						reaction.remove(user);
					// Else if they don't have the role, give it to them.
					else
						await reactionAuthor.addRole(roles[4]);

					// If they have FWC or NM then remove those roles from them
					await reactionAuthor.removeRoles([roles[5], roles[6]]);
					// and also remove their reactions
					reaction.message.reactions.forEach(async (re: MessageReaction) => {
						await re.fetchUsers();
						if (re.emoji.name === 'do')
							return;
						await re.remove(user);
					});

					return;

				case 'fwc':
					// If they already have the role, remove it so they can re-react to add it.
					if (reactionAuthor.roles.has(roles[5].id))
						reaction.remove(user);
					// Else if they don't have the role, give it to them.
					else
						await reactionAuthor.addRole(roles[5]);

					// If they have DO or NM then remove those roles from them
					await reactionAuthor.removeRoles([roles[4], roles[6]]);
					// and also remove their reactions
					reaction.message.reactions.forEach(async (re: MessageReaction) => {
						await re.fetchUsers();
						if (re.emoji.name === 'fwc')
							return;
						await re.remove(user);
					});

					return;

				case 'nm':
					// If they already have the role, remove it so they can re-react to add it.
					if (reactionAuthor.roles.has(roles[6].id))
						reaction.remove(user);
					// Else if they don't have the role, give it to them.
					else
						await reactionAuthor.addRole(roles[6]);

					// If they have DO or FWC then remove those roles from them
					await reactionAuthor.removeRoles([roles[4], roles[5]]);
					// and also remove their reactions
					reaction.message.reactions.forEach(async (re: MessageReaction) => {
						await re.fetchUsers();
						if (re.emoji.name === 'nm')
							return;
						await re.remove(user);
					});

					return;
			}
		}

		// Discord Server News Message
		if (reaction.message.id === serverNewsMessageId) {
			switch (reaction.emoji.name) {
				case Constants.checkmark:
					if (reactionAuthor.roles.has(roles[7].id)) {
						this.logger.info('Events', `RA: Removed Discord Server News role for ${reactionAuthor.user.tag}`);
						return reaction.remove(user);
					} else {
						this.logger.info('Events', `RA: Added Discord Server News role for ${reactionAuthor.user.tag}`);
						return await reactionAuthor.addRole(roles[7]);
					}
			}
		}

		// Bungie News Message
		if (reaction.message.id === bungieNewsMessageId) {
			switch (reaction.emoji.name) {
				case Constants.checkmark:
					if (reactionAuthor.roles.has(roles[8].id)) {
						this.logger.info('Events', `RA: Removed Bungie News role for ${reactionAuthor.user.tag}`);
						return reaction.remove(user);
					} else {
						this.logger.info('Events', `RA: Added Bungie News role for ${reactionAuthor.user.tag}`);
						return await reactionAuthor.addRole(roles[8]);
					}
			}
		}
	}

	@on('messageReactionRemove')
	private async _onReactionRemove(reaction: MessageReaction, user: User): Promise<any> {
		const reactionAuthor: GuildMember = await reaction.message.guild.fetchMember(user);
		let guildStorage: GuildStorage = await this._client.storage.guilds.get(reaction.message.guild.id);

		let platformMessageId: string = await guildStorage.get('Role Reaction Message');
		let spoilersMessageId: string = await guildStorage.get('Spoiler Reaction Message');
		let factionMessageId: string = await guildStorage.get('Faction Reaction Message');
		let serverNewsMessageId: string = await guildStorage.get('ServerNews Reaction Message');
		let bungieNewsMessageId: string = await guildStorage.get('BungieNews Reaction Message');

		let roles: Array<Role> = new Array();

		// Platform
		roles[0] = reaction.message.guild.roles.find('name', 'PC');
		roles[1] = reaction.message.guild.roles.find('name', 'PlayStation');
		roles[2] = reaction.message.guild.roles.find('name', 'Xbox');
		// Spoilers Enabled
		roles[3] = reaction.message.guild.roles.find('name', 'Spoilers Enabled');
		// Factions
		roles[4] = reaction.message.guild.roles.find('name', 'Dead Orbit');
		roles[5] = reaction.message.guild.roles.find('name', 'Future War Cult');
		roles[6] = reaction.message.guild.roles.find('name', 'New Monarchy');
		// Server/Bungie News
		roles[7] = reaction.message.guild.roles.find('name', 'Discord Server News'); // Discord Server News
		roles[8] = reaction.message.guild.roles.find('name', 'Bungie News'); // Bungie News

		// Platform Message
		if (reaction.message.id === platformMessageId) {
			switch (reaction.emoji.name) {
				case 'blizz':
					return await reactionAuthor.removeRole(roles[0]);

				case 'ps':
					return await reactionAuthor.removeRole(roles[1]);

				case 'xb':
					return await reactionAuthor.removeRole(roles[2]);
			}
		}

		// Spoiler Message
		if (reaction.message.id === spoilersMessageId) {
			switch (reaction.emoji.name) {
				case 'D2':
					return await reactionAuthor.removeRole(roles[3]);
			}
		}

		// Faction Wars Message
		if (reaction.message.id === factionMessageId) {
			switch (reaction.emoji.name) {
				case 'do':
					return await reactionAuthor.removeRole(roles[4]);

				case 'fwc':
					return await reactionAuthor.removeRole(roles[5]);

				case 'nm':
					return await reactionAuthor.removeRole(roles[6]);
			}
		}

		// Discord Server News Message
		if (reaction.message.id === serverNewsMessageId) {
			switch (reaction.emoji.name) {
				case Constants.checkmark:
					this.logger.info('Events', `RR: Removed Discord Server News role for ${reactionAuthor.user.tag}`);
					return await reactionAuthor.removeRole(roles[7]);
			}
		}

		// Bungie News Message
		if (reaction.message.id === bungieNewsMessageId) {
			switch (reaction.emoji.name) {
				case Constants.checkmark:
					this.logger.info('Events', `RR: Removed Bungie News role for ${reactionAuthor.user.tag}`);
					return await reactionAuthor.removeRole(roles[8]);
			}
		}
	}

	@on('guildMemberRemove')
	private async _onGuildMemberRemove(member: GuildMember, joined: boolean = false): Promise<void> {
		this.logMember(member, joined);
		this._client.mod.actions.userPart(member, member.guild);

		if (!await this._client.mod.managers.mute.isMuted(member)) return;

		const user: User = member.user;
		this._client.mod.managers.mute.setEvasionFlag(member);
	}

	@on('guildMemberAdd')
	private async _onGuildMemberAdd(member: GuildMember, joined: boolean = true): Promise<void> {
		this.logMember(member, joined);
		this._client.mod.actions.userJoin(member, member.guild);

		if (!await this._client.mod.managers.mute.isMuted(member)) return;
		if (!await this._client.mod.managers.mute.isEvasionFlagged(member)) return;

		const mutedRole: Role = member.guild.roles.find('name', 'Muted');
		await member.setRoles([mutedRole]);
		this._client.mod.managers.mute.clearEvasionFlag(member);
	}

	private logMember(member: GuildMember, joined: boolean): void
	{
		if (!member.guild.channels.exists('name', 'members-log')) return;
		const type: 'join' | 'leave' = joined ? 'join' : 'leave';
		const memberLog: TextChannel = <TextChannel> member.guild.channels.find('name', 'members-log');

		const joinDiscord: string = moment(member.user.createdAt).format('lll') + '\n*' + moment(new Date()).diff(member.user.createdAt, 'days') + ' days ago*';
		const joinServer: string = moment(member.joinedAt).format('lll') + '\n*' + moment(new Date()).diff(member.joinedAt, 'days') + ' days ago*';

		const embed: RichEmbed = new RichEmbed()
			.setColor(joined ? 8450847 : 16039746)
			.setAuthor(`${member.user.tag} (${member.id})`, member.user.avatarURL)
			.addField('Joined Server', joinServer, true)
			.addField('Joined Discord', joinDiscord, true)
			.setFooter(joined ? 'User joined' : 'User left' , '')
			.setTimestamp();
		memberLog.send({ embed });
	}

	@on('messageDelete')
	private async onMessageDelete(message: Message): Promise<void>
	{
		// dm, group, text, voice
		if (message.channel.type !== 'text') return;
		if (Constants.whitelistedChannels.includes(message.channel.id)) return;
		if (message.guild.id === Constants.botDMServerId) return;

		const sweeperLogs: TextChannel = <TextChannel> message.member.guild.channels.find('name', 'deleted-logs');
		const msgChannel: TextChannel = <TextChannel> message.channel;
		const msgCreatedAt = moment(message.createdAt).utc();
		const embed: RichEmbed = new RichEmbed();
		embed.setColor(6039746);
		embed.setAuthor(`${message.member.user.tag} (${message.member.id})`, message.member.user.avatarURL);
		embed.setDescription(`**Reason:** A Message Was Deleted\n`
					// + `**Channel:** Name: ${message.channel.name} | Category Name: ${message.channel.parent.name} | ID: ${message.channel.id}\n`
					+ `**Channel:** #${msgChannel.name} (${message.channel.id})\n`
					+ `**Message Timestamp:** ${msgCreatedAt} UTC\n`
					+ `**Message:** (${message.id})\n\n`
					+ `${message.cleanContent}`);
		if (message.attachments.size !== 0) {
			embed.addField('Attachment:', message.attachments.map(file => file.url));
		}
		embed.setTimestamp();
		sweeperLogs.send(`${message.member.user.tag} (${message.member.id})`, { embed });
	}

	@on('message')
	private async onMessage(message: Message): Promise<void>
	{
		// Log message data
		this._client.mod.actions.logMessage(message);

		// dm, group, text, voice
		if (message.channel.type !== 'text') return;
		const msgChannel: TextChannel = <TextChannel> message.channel;

		// repeating messages spam
		this._client.mod.helpers.antispamRepeatingMessages(message);

		// Discord invite link spam
		if (Constants.discordInviteRegExp.test(message.content)) {
			this._client.mod.helpers.antispamDiscordInvites(message, msgChannel);
			return;
		}

		// Mess mention spam
		if (message.mentions.users.keyArray().length > 5) {
			this._client.mod.helpers.antispamMassMentions(message, msgChannel);
			return;
		}

		// Twitch link spam
		if (Constants.twitchRegExp.test(message.content)) {
			this._client.mod.helpers.antispamTwitchLinks(message, msgChannel);
			return;
		}

		// Mixer.com link spam
		if (message.content.includes('mixer.com')) {
			this._client.mod.helpers.antispamMixerLinks(message, msgChannel);
			return;
		}

		// Call response commands
		if (message.content.startsWith('!!')) {
			let keyword: string = message.content.split(' ')[0];
			let mentions: string = '';
			if (message.mentions) {
				let mentionsArray = Array.from(message.mentions.users.values());
				mentions = mentionsArray.join(', ');
			}

			switch (keyword) {
				case '!!role':
					message.channel.send(`Hello ${mentions}` +
										`\n\n` +
										`Please go to <#224197509738790922> and set your platform role(s). You can do this by clicking on the reaction/emote. This allows us to know what platform(s) you are on (or will play on), and **opens the LFG channel(s) as well as the voice channels** for you.`);
					return;

				case '!!raid':
					message.channel.send(`Hello ${mentions}` +
										`\n\n` +
										`Please take all raid discussion to <#357238438694748178>. If you don\'t see the room, grab the spoiler role from <#224197509738790922>. If you\'re looking for a team for the raid, please see your respective lfg rooms, which can also be unlocked by going to <#224197509738790922> and choosing a platform.`);
					return;

				case '!!spoiler':
				case '!!spoilers':
					message.channel.send(`Hello ${mentions}` +
										`\n\n` +
										`Please keep all Destiny 2 related spoilers in <#332152701829906432>. You can gain access to that channel by going to <#224197509738790922> and clicking the Destiny 2 icon on the message in there. Thank you.`);
					return;

				case '!!maint':
				case '!!maintenance':
					this.logger.log('Events Keyword', `Command !!maint called by user: '${message.member.user.tag}' in '${message.guild.name}'`);
					message.channel.send(`Hello ${mentions}` +
										`\n\n` +
										`Please note the following planned Destiny maintenance event(s).` +
										`\n\n` +
										`__**${maint.Date}**__\n` +
										`**STARTS:** ${maint.StartTime}\n` +
										`**ENDS:** ${maint.EndTime}\n` +
										`\n\n` +
										`Note: Maintenance times, including end time, are subject to change by Bungie without notice. For more info see @BungieHelp on Twitter or <https://www.bungie.net/en/Help/Article/13125> Thank you.`);
					return;

				case '!!burn':
					message.channel.send(`Ooooooh ${mentions} that burn must hurt! You should get that checked out: <https://en.wikipedia.org/wiki/List_of_burn_centers_in_the_United_States>`);
					return;
			}
		}
	}
}
