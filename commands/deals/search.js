const axios = require('axios');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('search')
		.setDescription('Checks if a given game is on sale!')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('The game you want to check')
                .setRequired(true)),
	async execute(interaction) {
		const config = {
			method: 'get',
		  	maxBodyLength: Infinity,
			url: 'https://www.cheapshark.com/api/1.0/games?limit=10&title=' + await interaction.options.getString('title'),
			headers: { }
		};

		axios(config)
			.then(response => {
				let games = []
				for(const game of response.data) {
					const gameTitle = game["external"]
					const gamePrice = game["cheapest"]
					const gameLink = game["cheapestDealID"]
					const gameThumb = game["thumb"]
					
					games.push(makeGameEmbed(gameTitle, gamePrice, gameLink, gameThumb))
					
				}
				interaction.reply({ embeds: games})
			})
			.catch(function (error) {
				console.log(error);
			});
	},
};

function makeGameEmbed(title, price, link, thumb) {
	return new EmbedBuilder()
	.setColor(0x0099FF)
	.setTitle(title)
	.setURL("https://www.cheapshark.com/redirect?dealID=" + link)
	.setThumbnail(thumb)
	.addFields(
		{name: "Discounted price", value : price}
	)
}
