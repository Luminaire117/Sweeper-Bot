const config: any = require('../config.json');
const vendors: any = require('../vendors.json');

export type BotConstants = {
	// ID
	assignmentChannelId: string;
	serverId: string;
	modChannelId: string;
	logChannelId: string;
	botDMServerId: string;
	destiny2ChanId: string;
	baseVoiceChannelIdOne: string;
	baseVoiceChannelIdTwo: string;
	baseVoiceChannelIdThree: string;
	whitelistedChannels: Array<string>;
	antispamBypassId: string;
	voiceCategoryOpenId: string;
	voiceCategoryInUseId: string;

	// API Data
	vendorEngramsAPIBase: string;
	vendorEngramsAPIKey: string;
	vendorEngramsVendors: any;

	// RegExp
	platformRegExp: RegExp;
	pcRegExp: RegExp;
	psRegExp: RegExp;
	xbRegExp: RegExp;
	discordInviteRegExp: RegExp;
	discordInviteCodeRegExp: RegExp;
	twitchRegExp: RegExp;

	// Embed color
	embedColor: string;
	muteEmbedColor: string;
	warnEmbedColor: string;
	banEmbedColor: string;
	kickEmbedColor: string;

	// Misc emoji
	spacerEmoji: string;
	sweeperbot: string;
	// Platforms
	blizzEmjoi: string;
	psEmoji: string;
	xbEmoji: string;
	removeEmoji: string;
	// Spoiler Channel access
	D2Emoji: string;
	// Faction Wars
	DOEmoji: string;
	FWCEmoji: string;
	NMEmoji: string;

	serverInvite: string;
	appealsServer: string;

	channelNames: Array<string>;
	footer: string;
	footerGeneral: string;
};

// tslint:disable-next-line:variable-name
const Constants: BotConstants = <any> {};

// IDs
Constants.assignmentChannelId = config.ServerData.assignmentChannelId;
Constants.serverId = config.ServerData.serverId;
Constants.modChannelId = config.ServerData.modChannelId;
Constants.logChannelId = config.ServerData.logChannelId;
Constants.botDMServerId = config.ServerData.botDMServerId;
Constants.destiny2ChanId = config.ServerData.destiny2ChanId;
Constants.baseVoiceChannelIdOne = config.ServerData.baseVoiceChannelIdOne;
Constants.baseVoiceChannelIdTwo = config.ServerData.baseVoiceChannelIdTwo;
Constants.baseVoiceChannelIdThree = config.ServerData.baseVoiceChannelIdThree;
Constants.whitelistedChannels = ['255099898897104908', '323564629139652619', '361987348705312788', '322490463770640385',
								'342111927788634114', '297866918839451651', '322492361861103616', '332354014903664641',
								'368940297876668427', '369952267975000081', '360193326365933599', '370065490065883137'];
Constants.antispamBypassId = config.ServerData.antispamBypassId;
Constants.voiceCategoryOpenId = config.ServerData.voiceCategoryOpenId;
Constants.voiceCategoryInUseId = config.ServerData.voiceCategoryInUseId;

// API Data
Constants.vendorEngramsAPIBase = 'https://api.vendorengrams.xyz/getVendorDrops?key=';
Constants.vendorEngramsAPIKey = config.APIKeys.VendorEngramsXYZ;
Constants.vendorEngramsVendors = vendors;

// RegExp
Constants.platformRegExp = new RegExp('(\\bpc\\b)|(\\bpsn\\b)|(\\bps\\b)|(\\bxbl\\b)|(\\bxb\\b)|(\\bxbox\\b)', 'i');
Constants.pcRegExp = new RegExp('([A-Za-z0-9\-\_\#]{3,16})', 'i');
Constants.psRegExp = new RegExp('([A-Za-z0-9\-\_]{3,16})', 'i');
Constants.xbRegExp = new RegExp('(?:.me\\sset\\sxb|.me\\sset\\sxbl|.me\\sset\\sxbox)\\s([A-Za-z0-9\-\_\\s]{1,15})', 'i');
Constants.discordInviteRegExp = new RegExp(/discord(?:app\.com|\.gg|\.me)\/(?:invite\/)?(?![a-zA-Z0-9\-]+\/\w)(?:[a-zA-Z0-9\-]+)/, 'i');
Constants.discordInviteCodeRegExp = new RegExp(/\/(.*)/, 'i');
Constants.twitchRegExp = new RegExp(/twitch\.tv(\\|\/).+/, 'i');

// Embed color
Constants.embedColor = '0xFF8C00';
Constants.muteEmbedColor = '0xFFCC00';
Constants.warnEmbedColor = '0xFFEF00';
Constants.banEmbedColor = '0xE50000';
Constants.kickEmbedColor = '0x0083FF';

// Misc emoji
Constants.spacerEmoji = '<:spacer:328352361569583105>';
Constants.sweeperbot = '<:sweeperbot:361145141173682177>';
// Platforms
Constants.blizzEmjoi = '<:blizz:328322843227979778>';
Constants.psEmoji = '<:ps:328322843198881792>';
Constants.xbEmoji = '<:xb:328322843798405133>';
// Spoiler Channel access
Constants.D2Emoji = '<:D2:336634217712582656>';
// Faction Wars emojis
Constants.DOEmoji = '<:do:247889245333618688>';
Constants.FWCEmoji = '<:fwc:247889245337944064>';
Constants.NMEmoji = '<:nm:247889245421699082>';

Constants.serverInvite = 'https://discord.gg/DestinyReddit';
Constants.appealsServer = 'https://discord.gg/r9w8EfP';
Constants.channelNames = ['Abyss', 'Acolyte', 'Adjuticator', 'Adonna', 'Agah', 'Agema', 'Agenda-5', 'Ahamkara', 'Aksis', 'Aksor',
'Alak-Hul', 'Alessa', 'Alpha Lupi', 'Alzok', 'Amanda', 'Amytis', 'Ana', 'Andal', 'Anomaly', 'Arach', 'Aral', 'Arath', 'Archon',
'Arcblade', 'Arcology', 'Arcstrider', 'Armillary', 'Aru\'Un', 'Ascendant Raisins', 'Asher', 'Atheon', 'Aurash', 'Avalon', 'Azzir',
'Baby Dog', 'B\'Ael', 'Ballyhoo', 'Bamberga', 'Banshee-44', 'Barricade', 'Baseline', 'Baxx', 'Beltrik', 'Bladedancer', 'Blight',
'Bone', 'Bracus', 'Brakion', 'Brask', 'Bray', 'Breakpoint', 'Brevin', 'Brother Vance', 'Bryl', 'Cabal', 'Caliban', 'Calus', 'Camo',
'Captain America', 'Carybdis', 'Celery', 'Celestial', 'Charlemagne', 'Chioma', 'Chronoglass', 'Cipher', 'Citan', 'Clovis', 'Coldheart',
'Colovance', 'Complex', 'Compute', 'Confused', 'Copperhead', 'Corrector', 'Cozmo-23', 'Crescent', 'Crest', 'Crota', 'Crux', 'Cryptarch',
'Dakaua', 'Darci', 'Darkblade', 'Dawnblade', 'Deathsinger', 'DeeJ', 'Defiant', 'Devastation', 'Devils', 'Devrim', 'Dictata', 'Dinklebot',
'Dogma', 'Draksis', 'Drang', 'Dredgen', 'Dreg', 'Drevis', 'Droysen', 'Dunemarchers', 'Echo', 'EDZ', 'Ego', 'Eliksni', 'Emperor',
'Emissary', 'Encore', 'Eriana-3', 'Eris Morn', 'Eternity', 'Eva Levante', 'Everis', 'Exile', 'Exo Stranger', 'Exotic', 'Fallen',
'Fatebringer', 'Feizel', 'Felwinter', 'Fenchurch', 'Finnala', 'Flashpoint', 'Foetracer', 'Foresight', 'Gatekeeper', 'Gensym', 'Ghaul',
'Ghost', 'Gilmanovich', 'Gjallarhorn', 'GodWave', 'Golden', 'Golgoroth', 'Gornuk', 'Gravekeeper', 'Grayor', 'Grenade', 'Guide', 'Gulrot',
'Halak', 'Halfdan', 'Hallowfire', 'Hammer', 'Harbinger', 'Harpy', 'Hassa', 'Haunted', 'Havoc', 'Hawkmoon', 'Hawthorne', 'Hemisphere',
'Hezen', 'Hildean', 'Hohmann', 'Holborn', 'Holliday', 'Honeycomb', 'HopeEater', 'Hunter', 'Hygiea', 'Illyn', 'Io', 'Irxis', 'Ir Yut',
'Ivonovich', 'Jacobson', 'Jagi', 'Jalaal', 'Jaren', 'Jolyon', 'Jovians', 'Judgment', 'Kadi 55-30', 'Kagathos', 'Kagoor', 'Kaharn', 'Kaliks',
'Kay', 'Keksis', 'Kells', 'Kellship', 'Khvostov', 'Kingfisher', 'Kings', 'Knight', 'Knucklehead', 'Korus', 'Kovik', 'Kraghoor', 'Kranox',
'Kressler', 'Krughor', 'Lakpha', 'Lakshmi-2', 'Lancelot', 'Lanshu', 'Legendary', 'Lincoln', 'Lissyl', 'Long Walk', 'Lokaar', 'Loken', 'Lomar',
'Lonwabo', 'Lord Saladin', 'Lord Shaxx', 'Louis', 'LV36 Captain', 'Malahayati', 'Malok', 'Malphur', 'Mamba', 'Man o\'War', 'Mara Sov',
'Maraid', 'Martyr', 'Massyrian', 'Matador 64', 'Mecher', 'Medulla', 'Mengoor', 'Merciless', 'Micha', 'MIDA', 'Milestone', 'Mindbreaker',
'Minerva', 'Minotaurs', 'Minuet', 'Mir', 'Modris', 'Moon', 'Moonrider', 'Mormu', 'M\'Orn', 'Murmur', 'Nanotech', 'Nascia', 'Nemo', 'Nessus',
'Nezarec', 'Nicha', 'Nighthawk', 'Nightshade', 'Ning', 'Noble', 'Nolg', 'Novarro', 'Oboe', 'Offense', 'Ogre', 'Omnigul', 'Oort', 'Optimacy',
'Orbiks', 'Oracle', 'Origin', 'Oryx', 'Osiris', 'Oversoul', 'Pacific', 'Palamon', 'PallasBane', 'Parixas', 'Paskin', 'Peacekeepers', 'Peekis',
'Perseverance', 'Persuader', 'Petra', 'Philomath', 'Phoenix', 'Piccolo', 'Pinar', 'Pirsis', 'Praxic', 'Prophet', 'Prosecutor', 'Prospector',
'Protheon', 'Psion', 'Qiao', 'Qodron', 'Queenbreakers', 'Qugu', 'Quickfang', 'Quria', 'Racin', 'Radegast', 'Rafriit', 'Rahndel', 'Raiden',
'Ralph the Chicken', 'Rapture', 'Rasputin', 'Rat King', 'Red Legion', 'Redjack', 'Reefborn', 'Relentless', 'Revenge', 'Rezyl', 'Rience',
'Rift', 'Riksis', 'Riskrunner', 'Roni', 'Rose', 'SABER', 'Saint-14', 'Sardok', 'Sardon', 'Sathona', 'Savathun', 'Saviks', 'Sayeth', 'Scathelocke',
'Scavenger', 'Scorpion', 'Scout', 'Sedia', 'Segoth', 'Sekrion', 'Sepiks', 'Seven-Six-Five', 'Shadestep', 'Shadowshot', 'Shelter', 'Shieldbreaker',
'Shim', 'Shirazi', 'Shiro-4', 'Shotgun', 'Showrunner', 'Shift', 'Shuro', 'Sidearm', 'Siege Engine', 'Silent Fang', 'Silimar', 'Simiks', 'Simulator',
'Skate', 'Skolas', 'Skoriks', 'Skorri', 'Skriviks', 'Skullfort', 'Skyburners', 'Sloane', 'Sojourner', 'Solarium', 'Solkis', 'Sovereign', 'Speedpunk',
'Spindle', 'Squid', 'Starchaser', 'Starcutters', 'Stormcaller', 'Stormtrance', 'Sturm', 'Sundaresh', 'Sunshot', 'Suros', 'Sweeper Bot', 'Swiftling',
'Swordbearer', 'Sylok', 'Synthoceps', 'Ta\'Aurc', 'Taeko', 'Taishibethi', 'Taken', 'Tango', 'Talon', 'Taniks', 'Taox', 'Tarlowe', 'Teben', 'Techeun',
'Telesto', 'Telstar', 'Telthor', 'Tempests', 'Templar', 'Tescan', 'Tevis', 'Thalnok', 'Thaviks', 'The Speaker', 'The Traveler', 'Theosyion',
'Tho\'Ourg', 'Thrall', 'Thuria', 'Timepiece', 'Timewarp', 'Timur', 'Tinette', 'Titan', 'Token', 'Toland', 'Tover', 'Transversive', 'Trax', 'Trenn',
'Tubach', 'Tuyet', 'Uldren Sov', 'Unassailable', 'Uriel', 'Urrox', 'Urzok', 'Uzoma', 'Va\'Ase', 'Valiant', 'Valus', 'Vandal', 'Vekis', 'Veliniks',
'Velor', 'Vengeance', 'Venj', 'Verdict', 'Vestan', 'Vestian', 'Vex', 'Vigilance', 'Virixas', 'Voidwalker', 'Vorlog', 'Vosik', 'Ward', 'Warlock',
'Warmind', 'Warpriest', 'Warsat', 'Wayfarer', 'Wei Ning', 'Weksis', 'Wicked', 'Wildwood', 'Wintership', 'Wizened', 'Wolves', 'WorldRender',
'Wormfood', 'Wormwood', 'Wrecked', 'Xander 99-40', 'Xivu', 'Xol', 'Xur', 'Xyor', 'Yavek', 'Yor', 'Zahn', 'Zarin', 'Zhalo', 'Zire', 'Zydron',
'Zyre', 'Zyrok'];

Constants.footer = `\n\n**Special Note:** If you reply to this message it will be sent to the moderator team. If you are unable to reply to the bot, please check that you have not blocked the bot, disabled server messages, and share a server with the bot. If you do not share a server with the bot, you may join this one: ${Constants.appealsServer}.`;
Constants.footerGeneral = `\n\n**Special Note:** If you reply to this message it will be sent to the moderator team.`;
export default Constants;
