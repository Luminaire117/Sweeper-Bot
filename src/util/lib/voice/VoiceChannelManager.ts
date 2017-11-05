import { Collection, Guild, GuildChannel, GuildMember, VoiceChannel } from 'discord.js';
import { GuildStorage, ListenerUtil, Logger, logger } from 'yamdbf';
import { SweeperClient } from '../SweeperClient';
import Constants from '../../Constants';
import * as Schedule from 'node-schedule';
const fetch = require('snekfetch');

export default class VoiceChannelManager {
	@logger
	private readonly logger: Logger;

	private client: SweeperClient;

	public constructor(client: SweeperClient) {
		this.client = client;
	}

	public async init(): Promise<void> {
		let _this: VoiceChannelManager = this;
		const guild: Guild = <Guild> this.client.guilds.get(Constants.serverId);

		await _this.curateChannels(guild);
		await Schedule.scheduleJob('*/1 * * * *', async function() {
			await _this.curateChannels(guild);
		});

		await _this.curateNonEmptyChannels(guild);
		await Schedule.scheduleJob('*/5 * * * *', async function() {
			await _this.curateNonEmptyChannels(guild);
		});

		this.logger.log('VoiceChannelManager', `Curation Task Started.`);
	}

	public async curateChannels(guild: Guild): Promise<void> {
		let emptyChannels: Array<VoiceChannel> = this.getEmptyVoiceChannels(guild).map((channel: VoiceChannel) => { return channel; });
		let channelsForDeletion: Array<VoiceChannel> = this.getChannelsForDeletion(guild).map((channel: VoiceChannel) => { return channel; });

		// If more than 6 total open channels then remove all but 2
		if (emptyChannels.length > 5) {
			let numbChanToRemove: number = channelsForDeletion.length - 2;
			for (let x: number = 0; x < numbChanToRemove; x++) {
				await channelsForDeletion[x].delete();
				this.logger.log('VoiceChannelManager', `Deleted Voice Channel: ${channelsForDeletion[x].name}.`);
			}
		}

		emptyChannels = await this.getEmptyVoiceChannels(guild).map((channel: VoiceChannel) => { return channel; });
		for (let vChannel of emptyChannels) {
			// If voice channel is empty, move to empty category
			if (vChannel.members.size === 0) {
				await this.moveChannelInsideCategory(vChannel, Constants.voiceCategoryOpenId);
				// this.logger.log('VoiceChannelManager', `Moved Voice Channel: ${vChannel.name} to Open Category.`);
			}
		}
	}

	public async curateNonEmptyChannels(guild: Guild): Promise<void> {
		let nonEmptyChannels = await this.getNonEmptyVoiceChannels(guild).map((channel: VoiceChannel) => { return channel; });
		for (let vChannel of nonEmptyChannels) {
			// If voice channel is empty, move to in use category
			if (vChannel.members.size > 1) {
				await this.moveChannelInsideCategory(vChannel, Constants.voiceCategoryInUseId);
				// this.logger.log('VoiceChannelManager', `Moved Voice Channel: ${vChannel.name} to In Use Category.`);
			}
		}
	}

	public async createChannel(member: GuildMember): Promise<void> {
		let baseChannelOne: VoiceChannel = member.guild.channels.find('id', Constants.baseVoiceChannelIdOne) as VoiceChannel;
		let channelName: string = this.getChannelName();
		let currentChannelNames: Array<string> = this.getCurrentChannelNames(member.guild);
		let fireTeamSize: number = 6;

		do { channelName = this.getChannelName(); }
		while (currentChannelNames.indexOf(channelName) !== -1);

		let newChannel: VoiceChannel;

		try {
			newChannel = await baseChannelOne.clone(channelName, true, true) as VoiceChannel;
			await this.setChannelSize(newChannel);
			await this.moveChannelInsideCategory(newChannel, '375115211385864193');
			this.logger.info('VoiceChannelManager', `Created Voice Channel: ${channelName}.`);
		}
		catch (err) {
			this.logger.error(err);
		}
	}

	public async setChannelSize(channel: VoiceChannel){
		await channel.edit({position: 0, userLimit: 6, bitrate: 64000});
	}

	public async moveChannelInsideCategory(channel: VoiceChannel, parent: string) {
		try {
			const data = [{
				id: `${channel.id}`,
				parent_id: parent,
				lock_permissions: true
				}];
			const request = fetch['patch'](`https://discordapp.com/api/v6/guilds/${channel.guild.id}/channels`);
				request.set('Authorization', `Bot ${this.client.token}`);
				request.set('Content-Type', 'application/json');
				request.send(data);
				request.end();
			await new Promise((r: any) => setTimeout(r, 500));
			return;
		}
		catch (error) {
			return this.logger.error('VoiceChannelManager', `Error moving channel: ${channel}. Error: ${error}`);
		}
	}

	public getChannelsForDeletion(guild: Guild): Collection<string, GuildChannel> {
		return guild.channels.filter((channel: VoiceChannel, key: string, collection: Collection<string, VoiceChannel>) => {
			return (
				channel.type === 'voice' &&
				channel.members.size === 0 &&
				channel.name.startsWith('Fireteam ') &&
				channel.id !== Constants.baseVoiceChannelIdOne &&
				channel.id !== Constants.baseVoiceChannelIdTwo &&
				channel.id !== Constants.baseVoiceChannelIdThree) ? true : false;
		});
	}

	public getEmptyVoiceChannels(guild: Guild): Collection<string, GuildChannel> {
		return guild.channels.filter((channel: VoiceChannel, key: string, collection: Collection<string, VoiceChannel>) => {
			return (
				channel.type === 'voice' &&
				channel.members.size === 0 &&
				channel.name.startsWith('Fireteam ')) ? true : false;
		});
	}

	public getNonEmptyVoiceChannels(guild: Guild): Collection<string, GuildChannel> {
		return guild.channels.filter((channel: VoiceChannel, key: string, collection: Collection<string, VoiceChannel>) => {
			return (
				channel.type === 'voice' &&
				channel.members.size !== 0 &&
				channel.name.startsWith('Fireteam ')) ? true : false;
		});
	}

	public getUsedChannelsCount(guild: Guild): number {
		return guild.channels.filter((channel: VoiceChannel, key: string, collection: Collection<string, VoiceChannel>) => {
			return ((channel.type === 'voice' && channel.name.startsWith('Fireteam ')) && channel.members.size !== 0) ? true : false;
		}).size;
	}

	public getCurrentChannelNames(guild: Guild): Array<string> {
		let voiceChannels: Collection<string, GuildChannel> = guild.channels.filter((channel: GuildChannel, key: string, collection: Collection<string, GuildChannel>) => {
			return (channel.type === 'voice' && channel.name.startsWith('Fireteam ')) ? true : false;
		});

		return voiceChannels.map((channel: GuildChannel) => channel.name);
	}

	public getChannelName(): string {
		return 'Fireteam ' + Constants.channelNames[Math.floor(Math.random() * Constants.channelNames.length)];
	}
}
