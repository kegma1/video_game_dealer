const axios = require('axios');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { currency } = require('../../config.json');

const searchURL = "https://steamcommunity.com/actions/SearchApps"
const detailsURL = `https://store.steampowered.com/api/appdetails?filters=price_overview&cc=${currency}&appids=`

module.exports = {
	data: new SlashCommandBuilder()
		.setName('search')
		.setDescription('Checks if a given game is on sale!')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('The game you want to check')
                .setRequired(true)),
	async execute(interaction) {
		const titleGiven = await interaction.options.getString('title')

		const getListOfGames = {
			method: 'get',
		  	maxBodyLength: Infinity,
			url: `${searchURL}/${titleGiven}`,
			headers: { }
		};
		
		axios(getListOfGames)
			.then(async gamesList => {
				let games = []
				for(const game of gamesList.data) {
					const gameID = game["appid"]
					const gameTitle = game["name"]
					const gameThumb = game["logo"]
					const getGamePricing = {
						method: 'get',
						maxBodyLength: Infinity,
						url: `${detailsURL}${gameID}`,
						headers: { }
					};
					
					await axios(getGamePricing)
						.then(priceInfo => {
							const discount = priceInfo.data[gameID]["data"]["price_overview"]["discount_percent"]
							const priceBefore = priceInfo.data[gameID]["data"]["price_overview"]["initial_formatted"]
							const priceAfter = priceInfo.data[gameID]["data"]["price_overview"]["final_formatted"]
							
							games.push(makeGameEmbed(gameTitle, gameID, gameThumb, discount, priceBefore, priceAfter))
						})
						.catch(error => {
							console.log(error);
						})

				}
				
				if(games.length > 0) {
					interaction.reply({ embeds: games })
				} else {
					interaction.reply(`No games with the name "${titleGiven}" where found`);
				}
			})
			.catch(error => {
				console.log(error);
			});
	},
};

function makeGameEmbed(title, id, thumb, discount, priceB, priceA) {
	let embed = new EmbedBuilder()
	.setColor(0x0099FF)
	.setTitle(title)
	.setURL("https://store.steampowered.com/app/" + id)
	.setThumbnail(thumb)

	if(discount != 0) {
		embed.addFields(
			{name: "Discount", value : `**${discount}%**`, inline: true},
			{name: "Price", value : `~~${priceB}~~ ${priceA}`, inline: true},
		)
	} else {
		embed.addFields(
			{name: "Price", value : priceA}
		)
	}
	
	return embed
}
