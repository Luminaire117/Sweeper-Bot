// Note: ModManager and and a few related aspects have come from https://github.com/zajrik/modbot

import { Command, GuildStorage, Time, Logger, logger } from 'yamdbf';
import { GuildMember, Message, RichEmbed, Role, TextChannel, User } from 'discord.js';
import Constants from '../../util/Constants';
import * as fuzzy from 'fuzzy';
import { SweeperClient } from '../../util/lib/SweeperClient';

const idRegex: RegExp = /^(?:<@!?)?(\d+)>?$/;

export default class Mute extends Command<SweeperClient> {
	@logger private readonly logger: Logger;

	public constructor() {
		super({
			name: 'mute',
			aliases: ['m'],
			desc: 'Mute a user',
			usage: '<prefix>mute <User> <Time>? <Note>?',
			info: 'If no time or note specified default values will be used. ' +
			'Valid times include (M)in, (H)our, (D)ay. Examples:\n\n' +
			'1m or 1min   : 1 Minute\n' +
			'2h or 2hours : 2 hours\n' +
			'3d or 3day   : 3 Days\n\n' +
			'To unmute someone see <prefix>unmute',
			group: 'modtools',
			guildOnly: true,
			callerPermissions: ['MANAGE_MESSAGES']
		});
	}

	public async action(message: Message, args: Array<any>): Promise<any> {
		// grab the storage
		const guildStorage: GuildStorage = this.client.storage.guilds.get(message.guild.id);
		let issuer: User;
		let user: User;

		// no user specified
		if (!args[0])
			return message.channel.send('Please provide a user to search for.');

		// if there was an attempt, args[0] was too short
		if (args[0] && args[0].length < 3)
			return message.channel.send('Please provide 3 or more letters for your search. For help see \`<prefix>help mute\`');

		// if there was an attempt listing a user
		if (args[0]) {

			// if that attempt was a mention, get very first one
			if (message.mentions.users.size === 1) {
				user = await message.client.fetchUser(message.mentions.users.first().id);

			// if no mentions, plaintext
			} else {
				// Check if it's a user ID first
				if (idRegex.test(args[0])) {
					try { user = await message.client.fetchUser(args[0].match(idRegex)[0]); }
					catch (err) { return message.channel.send(`Could not locate user **${args[0]}** from ID argument.`); }

				// Otherwise do a name search
				} else {
					// map users
					const users: Array<User> = message.guild.members.map((member: GuildMember) => member.user);

					// search for user
					let options: any = { extract: (el: User) => { return el.username; } };
					let results: any = fuzzy.filter(args[0].toString(), users, options);

					// user found
					if (results.length === 1) {
						// create user variables
						user = results[0].original;
					} else {
						// be more specfic
						if (results.length === 0)
							return message.channel.send(`**${results.length}** users found. Please be more specific.`);
						else
							return message.channel.send(`**${results.length}** users found: \`${results.map((el: any) => { return el.original.username; }).join('\`, \`')}\`. Please be more specific. You may need to use a User Mention or use the User ID.`);
					}
				}
			}
		} else {
			return message.channel.send(`No users found. Please specify a user by User Mention, User ID, or Display Name.`);
		}

		if (user) {
			// Workaround for antispam automute setting issuer as person being muted.
			if (message.member.user === user) {
				issuer = this.client.user;
			} else {
				issuer = message.member.user;
			}

			// Get milliseconds of mute length, otherwise set default
			let muteTimeMS: number;
			let muteTimeHUMN: string;
			let noteIndex: number;
			if (args[1]) {
				muteTimeMS = Time.parseShorthand(args[1]);
				muteTimeHUMN = args[1];
				noteIndex = 2;
			}
			if (!muteTimeMS) {
				muteTimeMS = 1200000;
				muteTimeHUMN = '20m';
				noteIndex = 1;
			}

			// Set note info
			let note: string = '';
			note = this.parseNote(args, noteIndex);
			if (note.length === 0) { note = 'Please be kind to each other and read our rules in #rules-and-info.'; }

			const mutedUser: GuildMember = await message.guild.fetchMember(user);

			if (mutedUser.roles.has(message.guild.roles.get(await guildStorage.settings.get('mutedrole')).id)) {
				message.channel.send('User is already muted.');
				return message.delete();
			}

			if (user.id === message.guild.ownerID || user.bot) {
				message.channel.send('You may not use this command on that user.');
				return message.delete();
			}
			// If message sent in the mod channel, then give full details, otherwise be vague
			let actionMsg: Message;
			if (message.channel.id === Constants.modChannelId) {
				actionMsg = <Message> await message.channel.send(`Initiating action. Please wait. Task List:\n\n` +
					`Set muted role: \n` +
					`Set mute duration: \n` +
					`Log to Database: \n` +
					`Inform User: `);
			} else {
				actionMsg = <Message> await message.channel.send(`Initiating action. Please wait.`);
			}
			this.logger.log('CMD Mute', `Initiating mute for user: '${mutedUser.user.tag}' in '${message.guild.name}'`);
			await this.client.mod.actions.mute(mutedUser, issuer, message.guild, muteTimeHUMN, note, muteTimeMS, actionMsg)
				.then(result => {
					this.logger.log('CMD Mute', `Muted user: '${mutedUser.user.tag}' in '${message.guild.name}'`);
					try {
						mutedUser.send(`You have been muted on **${message.guild.name}** for **${muteTimeHUMN}**.\n\n` +
										`**A message from the mods:**\n\n` +
										`"${note}"${Constants.footerGeneral}`)
							.then(res => {
								this.logger.log('CMD Mute', `Informed user of their mute: '${mutedUser.user.tag}' in '${message.guild.name}'`);
								if (actionMsg.channel.id === Constants.modChannelId) {
									actionMsg.edit(
										`Initiating action. Please wait. Task List:\n\n` +
										`Set muted role: :white_check_mark:\n` +
										`Set mute duration: :white_check_mark:\n` +
										`Log to Database: :white_check_mark:\n` +
										`Inform User: :white_check_mark:\n\n` +
										`Mute successful for: <@!${user.id}>. **Time:** *${muteTimeHUMN}*. ${Constants.animSweeperbot}`);
								} else {
									actionMsg.edit(`That action was successful. ${Constants.animSweeperbot}`);
									message.delete();
								}
							})
							.catch(error => {
								const modChannel: TextChannel = <TextChannel> message.guild.channels.get(Constants.modChannelId);
								modChannel.send(`Unable to inform <@!${user.id}> of their mute. Rest of mute action applied..`);
								this.logger.error('CMD Mute', `Error informing user of their muting: '${mutedUser.user.tag}' in '${message.guild.name}'.\n\n**Error:** ${error}`);
							});
					} catch (err) {
						const modChannel: TextChannel = <TextChannel> message.guild.channels.get(Constants.modChannelId);
						modChannel.send(`There was an error informing ${mutedUser.user.tag} of their mute. Their DMs may be disabled.\n\n**Error:**\n${err}`);
					}
				})
				.catch(error => {
					const modChannel: TextChannel = <TextChannel> message.guild.channels.get(Constants.modChannelId);
					modChannel.send(`There was an error while creating mute for <@${user.id}>. Please try again.`);
					this.logger.error('CMD Mute', `Error muting: '${mutedUser.user.tag}' in '${message.guild.name}'.\n\n**Error:** ${error}`);
				});

		} else { return message.channel.send('Unable to fetchMember for the user. Is the user still in the server?'); }
	}

	private parseNote(args: Array<any>, noteIndex: number): string {
		let text: string = '';
		for (let index = noteIndex; index < args.length; index++) {
			text += `${args[index].trim()} `;
		}
		return text.slice(0, -1);
	}
}
