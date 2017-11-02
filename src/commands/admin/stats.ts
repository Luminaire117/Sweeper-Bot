import { Command, Guild, Logger, logger } from 'yamdbf';
import { Collection, GuildChannel, GuildMember, Message, VoiceChannel } from 'discord.js';
import { SweeperClient } from '../../util/lib/SweeperClient';

export default class Mute extends Command<SweeperClient> {
	@logger private readonly logger: Logger;

	public constructor() {
		super({
			name: 'stats',
			desc: 'Shows stats about the bot.',
			usage: '<prefix>stats',
			group: 'admin',
			guildOnly: true,
			callerPermissions: ['MANAGE_GUILD']
		});
	}

	public async action(message: Message): Promise<any> {
		try {
			const concurrentUsers: number = message.client.users.filter(u => u.presence.status !== 'offline').size;
			const totalUsers: number = message.guild.memberCount;
			let totalVoiceUsers: number = 0;

			let nonEmptyChannels = await this.getNonEmptyVoiceChannels(message.guild).map((channel: VoiceChannel) => { return channel; });
			for (let vChannel of nonEmptyChannels) {
				totalVoiceUsers += vChannel.members.size;
			}
			return message.channel.send(`__**Server Stats:**__` +
										`\n\n` +
										`**Total Server Users:** ${totalUsers}\n` +
										`**Total Concurrent Users:** ${concurrentUsers}\n` +
										`**Total Voice Users:** ${totalVoiceUsers}`);

		} catch (err) {
			return this.logger.log('CMD stats', `Error posting bot stats. Error: ${err}`);
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
