import { Client, ListenerUtil, Logger, logger } from 'yamdbf';
import { TextChannel, RichEmbed, Message, Guild, GuildMember, VoiceChannel } from 'discord.js';
import { Events } from './listeners/Events';
import { RoleManager } from './assignment/RoleManager';
import { VendorEngramManager } from './helpers/VendorEngrams';
import { ModLoader } from '../lib/mod/ModLoader';
import VoiceChannelManager from './voice/VoiceChannelManager';
import Database from '../../database/Database';
import Constants from '../Constants';

const { dmManager } = require('yamdbf-dm-manager');
const config: any = require('../../config.json');
const credentials: any = require('../../database.json');
const { once } = ListenerUtil;
const music = require('discord.js-musicbot-addon');

const testing: boolean = false;

export class SweeperClient extends Client {
	@logger private readonly logger: Logger;

	// properties
	public config: any;
	public events: any;
	public roleManager: RoleManager;
	public database: Database;
	public mod: ModLoader;
	public voiceChannelManager: VoiceChannelManager;
	public vendorEngramManager: VendorEngramManager;
	public music: any;

	// constructor
	public constructor() {
		super({
				token: config.token,
				owner: config.owner,
				statusText: config.status,
				unknownCommandError: false,
				commandsDir: __dirname + '/../../commands',
				disableBase: [
					'clearlimit',
					'disablegroup',
					'enablegroup',
					'limit',
					'listgroups',
					'reload'
				],
				readyText: 'Ready\u0007',
				ratelimit: '10/1m',
				pause: true,
				plugins: [dmManager(config.ServerData.botDMServerId)]
			},
			{
				messageCacheMaxSize: 2000,
				fetchAllMembers: true
			});

		this.config = config;
		this.database = new Database(credentials);
		this.logger.info('CORE', `Connected to: Database`);
		this.events = new Events(this);
		this.logger.info('CORE', `Connected to: Events`);
		this.roleManager = new RoleManager(this);
		this.mod = new ModLoader(this);
		this.voiceChannelManager = new VoiceChannelManager(this);
		this.vendorEngramManager = new VendorEngramManager(this);
	}

	@once('pause')
	private async _onPause(): Promise<void> {
		await this.setDefaultSetting('prefix', '.');
		this.emit('continue');
	}

	@once('clientReady')
	private async _onClientReady(): Promise<void>
	{
		await this.mod.init();
		this.logger.info('CORE', `Connected to: ModLoader`);
		await this.roleManager.init();
		this.logger.info('CORE', `Connected to: RoleManager`);
		await this.voiceChannelManager.init();
		this.logger.info('CORE', `Connected to: VoiceChannelManager`);
		await this.vendorEngramManager.init();
		this.logger.info('CORE', `Connected to: VendorEngramManager`);

		this.music = new music(this, {
			youtubeKey: Constants.youtubeAPIKey,
			musicVoiceChannelId: Constants.musicVoiceChannelId,
			prefix: '-',
			global: false,
			maxQueueSize: 25,
			helpCmd: 'help',
			playCmd: 'play',
			volumeCmd: 'volume',
			leaveCmd: 'stop',
			disableLoop: true,
			anyoneCanSkip: false,
			anyoneCanAdjust: false,
			defVolume: 20,
		});
		this.logger.info('CORE', `Connected to: Music`);

		if (!testing) {
			try {
				for (let [channelID, chanObj] of this.channels.filter(chan => chan.type === 'text')) {
					let channel: TextChannel = <TextChannel> this.channels.find('id', channelID);
					if (channel && channel.guild.id === config.ServerData.botDMServerId) { continue; }
					channel.fetchMessages({limit: 100})
						.then((res) => {
							this.logger.info('CORE', `Fetched message history for: ${channel.name} in ${channel.guild.name}`);
						})
						.catch((err) => {
							this.logger.info('CORE', `Error with fetchMessages in ${channel.name}: ${err}`);
						});
				}
			}
			catch (err) { this.logger.info('CORE', `Error retrieving message history: ${err}`); }
		}
	}

	@once('disconnect')
	private async _onDisconnect(): Promise<void> {
		process.exit(100);
	}
}
