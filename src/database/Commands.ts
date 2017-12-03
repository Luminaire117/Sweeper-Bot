import { MuteCommands, WarnCommands, NoteCommands, BanCommands, UsersCommands, StatsCommands, MsgDataCommands } from './commands/Cmds';

export default class Commands {
	public readonly note: NoteCommands;
	public readonly mute: MuteCommands;
	public readonly warn: WarnCommands;
	public readonly ban: BanCommands;
	public readonly users: UsersCommands;
	public readonly stats: StatsCommands;
	public readonly msgData: MsgDataCommands;

	public constructor(connection: any) {
		this.note = new NoteCommands(connection);
		this.mute = new MuteCommands(connection);
		this.warn = new WarnCommands(connection);
		this.ban = new BanCommands(connection);
		this.users = new UsersCommands(connection);
		this.stats = new StatsCommands(connection);
		this.msgData = new MsgDataCommands(connection);
	}
}
