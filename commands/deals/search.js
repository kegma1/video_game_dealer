const axios = require("axios");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { currency } = require("../../config.json");

const searchURL = "https://steamcommunity.com/actions/SearchApps";
const detailsURL = `https://store.steampowered.com/api/appdetails?filters=price_overview&cc=${currency}&appids=`;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("search")
    .setDescription("Checks if a given game is on sale!")
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("The game you want to check")
        .setRequired(true),
    ),
  async execute(interaction) {
    const titleGiven = await interaction.options.getString("title");

    const getListOfGames = {
      method: "get",
      maxBodyLength: Infinity,
      url: `${searchURL}/${titleGiven}`,
      headers: {},
    };

    axios(getListOfGames)
      .then(async (gamesList) => {
        const appIds = gamesList.data.map((game) => game.appid).join(",");
        const getGamePricing = {
          method: "get",
          maxBodyLength: Infinity,
          url: `${detailsURL}${appIds}`,
          headers: {},
        };

        await axios(getGamePricing)
          .then((priceInfo) => {
            const games = [];
            for (const game of gamesList.data) {
              const gameID = game.appid;
              const gameTitle = game.name;
              const gameThumb = game.logo;
              const gamePrice =
                priceInfo.data[gameID]["data"]["price_overview"];
              let discount, priceBefore, priceAfter;
              if (gamePrice) {
                discount = gamePrice.discount_percent;
                priceBefore = gamePrice.initial_formatted;
                priceAfter = gamePrice.final_formatted;
              } else {
                discount = 0;
                priceBefore = "";
                priceAfter = "FREE";
              }

              games.push(
                makeGameEmbed(
                  gameTitle,
                  gameID,
                  gameThumb,
                  discount,
                  priceBefore,
                  priceAfter,
                ),
              );
            }

            if (games.length > 0) {
              interaction.reply({ embeds: games });
            } else {
              interaction.reply(
                `No games with the name "${titleGiven}" were found`,
              );
            }
          })
          .catch((error) => {
            console.log(error);
          });
      })
      .catch((error) => {
        console.log(error);
      });
  },
};

function makeGameEmbed(title, id, thumb, discount, priceB, priceA) {
  let embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle(title)
    .setURL("https://store.steampowered.com/app/" + id)
    .setThumbnail(thumb);

  if (discount !== 0) {
    embed.addFields(
      { name: "Discount", value: `**${discount}%**`, inline: true },
      { name: "Price", value: `~~${priceB}~~ ${priceA}`, inline: true },
    );
  } else {
    embed.addFields({ name: "Price", value: priceA });
  }

  return embed;
}
