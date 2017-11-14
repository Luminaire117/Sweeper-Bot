import * as Sequelize from 'sequelize';
import Model from './Model';

export default class StatsModel extends Model {
	public constructor(connection: any) {
		super({
			serverID: {
				type: Sequelize.TEXT,
				field: 'ServerID',
				allowNull: false
			},
			totalUsers: {
				type: Sequelize.INTEGER,
				field: 'TotalUsers',
				allowNull: true
			},
			concurrentUsers: {
				type: Sequelize.INTEGER,
				field: 'ConcurrentUsers',
				allowNull: true
			},
			totalVoiceUsers: {
				type: Sequelize.INTEGER,
				field: 'TotalVoiceUsers',
				allowNull: true
			}
		}, 'Statistics', connection);
	}
}
