import * as Sequelize from 'sequelize';
import Model from './Model';

export default class MsgDataModel extends Model {
	public constructor(connection: any) {
		super({
			serverid: {
				type: Sequelize.TEXT,
				field: 'serverid',
				allowNull: false
			},
			userid: {
				type: Sequelize.TEXT,
				field: 'userid',
				allowNull: false
			},
			channelid: {
				type: Sequelize.TEXT,
				field: 'channelid',
				allowNull: false
			},
			channelname: {
				type: Sequelize.TEXT,
				field: 'channelname',
				allowNull: false
			},
			messageid: {
				type: Sequelize.TEXT,
				field: 'messageid',
				allowNull: false
			},
			msgcreated: {
				type: Sequelize.DATE,
				field: 'msgcreated',
				allowNull: false
			}
		}, 'message_data', connection);
	}
}
