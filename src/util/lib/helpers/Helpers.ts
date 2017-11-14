import { Collection, GuildChannel, GuildMember, Guild, Invite, Message, RichEmbed, Role, User, TextChannel, VoiceChannel } from 'discord.js';
import { GuildStorage, Logger, logger } from 'yamdbf';
import { SweeperClient } from '../SweeperClient';
import { MuteManager } from '../mod/managers/MuteManager';
import Constants from '../../Constants';
import * as moment from 'moment';
import * as Schedule from 'node-schedule';

export class Helpers
{
	@logger private readonly logger: Logger;
	private _client: SweeperClient;
	public constructor(client: SweeperClient)
	{
		this._client = client;
	}

	public async init(): Promise<void> {
		let _this: Helpers = this;
		const guild: Guild = <Guild> this._client.guilds.get(Constants.serverId);

		await _this.logServerStats(guild);
		await Schedule.scheduleJob('1 * * * *', async function() {
			await _this.logServerStats(guild);
		});

		this.logger.log('Helpers: Stats', `Stats Logging Started.`);
	}

	// Antispam - Discord Invite Links
	public async antispamDiscordInvites(message: Message, msgChannel: TextChannel): Promise<void>
	{
		const antispamType: string = 'Discord Invites Blacklisted';
		const regexMatch: string = Constants.discordInviteRegExp.exec(message.content)[0];
		const regexInviteCode: string = Constants.discordInviteCodeRegExp.exec(regexMatch)[1];
		let discordInvites: Collection<string, Invite> = await message.guild.fetchInvites().then(invites => invites);

		if (message.member.hasPermission('MANAGE_MESSAGES') || message.member.roles.exists('id', Constants.antispamBypassId)) return;
		if (regexInviteCode && discordInvites) {
			let inviteCodes = discordInvites.map(invite => invite.code);
			if (inviteCodes.includes(regexInviteCode))
				return;
		}

		message.delete();
		this.logMessage(message, regexMatch, antispamType);

		await message.member.user.send(`You have been warned on **${message.guild.name}**.\n\n**A message from the mods:**\n\n"Discord invite links are not permitted."`)
			.then((res) => {
				// Inform in chat that the warn was success, wait a few sec then delete that success msg
				this._client.database.commands.warn.addWarn(message.guild.id, this._client.user.id, message.member.user.id, `Warned: ${antispamType}`);
				this.logger.log('Helpers Warn', `Warned user (${antispamType}): '${message.member.user.tag}' in '${message.guild.name}'`);
			})
			.catch((err) => {
				const modChannel: TextChannel = <TextChannel> message.guild.channels.get(Constants.modChannelId);
				modChannel.send(`There was an error informing ${message.member.user.tag} (${message.member.user.id}) of their warning (automatically). This user posted a **Discord Invite Link**. Their DMs may be disabled.\n\n**Error:**\n${err}`);
				this.logger.log('Helpers Warn', `Unable to warn user: '${message.member.user.tag}' in '${message.guild.name}'`);
				throw new Error(err);
			});
	}

	// Antispam - Mass Mentions
	public async antispamMassMentions(message: Message, msgChannel: TextChannel): Promise<void>
	{
		if (message.member.hasPermission('MANAGE_MESSAGES') || message.member.roles.exists('id', Constants.antispamBypassId)) return;
		message.delete();
		const antispamType: string = 'Mass Mention Spam';

		const regexMatch: string = '6+ mentions';
		this.logMessage(message, regexMatch, antispamType);

		await message.member.user.send(`You have been warned on **${message.guild.name}**.\n\n**A message from the mods:**\n\n"Do not spam mentions. This includes mentioning a lot of users at once."`)
			.then((res) => {
				this._client.database.commands.warn.addWarn(message.guild.id, this._client.user.id, message.member.user.id, `Warned: ${antispamType}`);
				this.logger.log('Helpers Warn', `Warned user (${antispamType}): '${message.member.user.tag}' in '${message.guild.name}'`);
			})
			.catch((err) => {
				const modChannel: TextChannel = <TextChannel> message.guild.channels.get(Constants.modChannelId);
				modChannel.send(`There was an error informing ${message.member.user.tag} (${message.member.user.id}) of their warning (automatically). This user **spammed mentions**. Their DMs may be disabled.\n\n**Error:**\n${err}`);
				this.logger.log('Helpers Warn', `Unable to warn user: '${message.member.user.tag}' in '${message.guild.name}'`);
				throw new Error(err);
			});
	}

	// Antispam - repeating messages
	public async antispamRepeatingMessages(message: Message): Promise<void>
	{
		if (message.member.hasPermission('MANAGE_MESSAGES') || message.member.roles.exists('id', Constants.antispamBypassId) || message.author.bot) return;
		const antispamRepeatingMessagesEnabled: boolean = true;
		if (!message.member.spamContent) { // Initializes the spamcontent for bot restarts/new user.
			message.member.spamContent = message.cleanContent.toLowerCase();
			message.member.spamCounter = 0;
			message.member.spamTimer   = message.createdTimestamp;
		}
		if (message.createdTimestamp - message.member.spamTimer > 180000) {
			message.member.spamCounter = 1;
		}
		if (message.createdTimestamp - message.member.spamTimer < 1000 || message.cleanContent.toLowerCase() === message.member.spamContent) {
			message.member.spamCounter += 1;
		} else {
			message.member.spamContent = message.cleanContent.toLowerCase();
			message.member.spamCounter = 1;
		}
		message.member.spamTimer = message.createdTimestamp;

		if (message.member.spamCounter === 4) {
			if (antispamRepeatingMessagesEnabled) {
				message.channel.send(`<@${message.member.id}>, You are sending too many messages too quickly, or the same message too many times. Please slow down and don't post repetative messages or you will be muted.`);
				message.delete()
					.then((msg) => { return; })
					.catch((err) => this.logger.error('Helpers AntiSpam', `Unable to delete spam message: '${message.member.user.tag}' in '${message.guild.name}'. Error: ${err}`));
			} else {
				message.channel.send(`<@!82942340309716992> - Alert type 1`);
			}
		}

		if (message.member.spamCounter > 4) {
			if (antispamRepeatingMessagesEnabled) {
				if (await new MuteManager(this._client).isMuted(message.member)) return;
				this._client.commands.find('name', 'mute').action(message, [message.member.id, '20m', 'Repeating/quick message spam.']);
				message.member.spamCounter = 0;
				const modChannel: TextChannel = <TextChannel> message.guild.channels.get(Constants.modChannelId);
				const embed: RichEmbed = new RichEmbed()
					.setColor(Constants.muteEmbedColor)
					.setAuthor(this._client.user.tag, this._client.user.avatarURL)
					.setDescription(`**Member:** ${message.author.tag} (${message.author.id})\n`
						+ `**Action:** Mute\n`
						+ `**Length:** 20m\n`
						+ `**Reason:** Repeating/quick message spam.\n`
						+ `**Channel:** #${message.channel instanceof TextChannel ? message.channel.name : ''} (${message.channel.id})`)
					.setTimestamp();
				modChannel.send({ embed: embed });
				message.delete()
					.then((msg) => { return; })
					.catch((err) => this.logger.error('Helpers AntiSpam', `Unable to delete spam message: '${message.member.user.tag}' in '${message.guild.name}'. Error: ${err}`));
			} else {
				message.member.spamCounter = 0;
				message.channel.send(`<@!82942340309716992> - Alert type 2`);
			}
		}
	}

	// Antispam - Twitch Links
	public async antispamTwitchLinks(message: Message, msgChannel: TextChannel): Promise<void>
	{
		if (message.member.hasPermission('MANAGE_MESSAGES') || message.member.roles.exists('id', Constants.antispamBypassId)) return;
		if (message.content.includes('twitch.tv/bungie') || message.content.includes('twitch.tv\\bungie') || message.content.includes('clips.twitch.tv')) return;
		message.delete();
		const antispamType: string = 'Twitch Links Blacklisted';

		const regexMatch: string = Constants.twitchRegExp.exec(message.content)[0];
		this.logMessage(message, regexMatch, antispamType);

		await message.member.user.send(`You have been warned on **${message.guild.name}**.\n\n**A message from the mods:**\n\n"Do not post twitch links without mod approval."`)
			.then((res) => {
				this._client.database.commands.warn.addWarn(message.guild.id, this._client.user.id, message.member.user.id, `Warned: ${antispamType}`);
				this.logger.log('Helpers Warn', `Warned user (${antispamType}): '${message.member.user.tag}' in '${message.guild.name}'`);
			})
			.catch((err) => {
				const modChannel: TextChannel = <TextChannel> message.guild.channels.get(Constants.modChannelId);
				modChannel.send(`There was an error informing ${message.member.user.tag} (${message.member.user.id}) of their warning (automatically). This user **posted a twitch link**. Their DMs may be disabled.\n\n**Error:**\n${err}`);
				this.logger.log('Helpers Warn', `Unable to warn user: '${message.member.user.tag}' in '${message.guild.name}'`);
				throw new Error(err);
			});
	}

	// Logs message in channel
	public async logMessage(message: Message, regexMatch: string, reason: string): Promise<void>
	{
		const logChannel: TextChannel = <TextChannel> message.guild.channels.get(Constants.logChannelId);
		const embed: RichEmbed = new RichEmbed()
			.setColor(Constants.warnEmbedColor)
			.setAuthor(`${message.member.user.tag} (${message.member.id})`, message.member.user.avatarURL)
			.setDescription(`**Action:** Message Deleted\n`
				+ `**Reason:** ${reason}\n`
				+ `**Match:** ${regexMatch}\n`
				+ `**Channel:** #${message.channel instanceof TextChannel ? message.channel.name : ''} (${message.channel.id})\n`
				+ `**Message:** (${message.id})\n\n`
				+ `${message.cleanContent}`)
			.setTimestamp();
		logChannel.send({ embed: embed });
		return;
	}

	public async logServerStats(guild: Guild): Promise<void>
	{
		try {
			const concurrentUsers: number = this._client.users.filter(u => u.presence.status !== 'offline').size;
			const totalUsers: number = guild.memberCount;
			let totalVoiceUsers: number = 0;

			let nonEmptyChannels = await this.getNonEmptyVoiceChannels(guild).map((channel: VoiceChannel) => { return channel; });
			for (let vChannel of nonEmptyChannels) {
				totalVoiceUsers += vChannel.members.size;
			}

			this._client.database.commands.stats.add(Constants.serverId, totalUsers, concurrentUsers, totalVoiceUsers);

		} catch (err) {
			return this.logger.error('CMD stats', `Error logging bot stats. Error: ${err}`);
		}
	}

	public getNonEmptyVoiceChannels(guild: Guild): Collection<string, GuildChannel> {
		return guild.channels.filter((channel: VoiceChannel, key: string, collection: Collection<string, VoiceChannel>) => {
			return (
				channel.type === 'voice' &&
				channel.members.size !== 0);
		});
	}

}
