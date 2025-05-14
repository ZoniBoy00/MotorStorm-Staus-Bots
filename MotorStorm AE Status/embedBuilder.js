const { EmbedBuilder } = require("discord.js")
const { simplifyName } = require("./utils")

function formatEmbed(data) {
  const embed = new EmbedBuilder()
    .setTitle("<:msae2:1187864931824046131> MotorStorm Arctic Edge Status <:msae2:1187864931824046131>")
    .setDescription(
      "Real-time status of all lobbies and players.\nhttps://agracingfoundation.org/listing",
    )
    .setColor("#7db3d5")
    .setTimestamp(new Date())

  // Add summary fields for AE - without the explanatory text
  embed.addFields({
    name: "📊 MotorStorm AE",
    value: `**Active Lobbies:** \`${data.motorstorm_ae.summary.active_lobbies}\`
**Total Players Online:** \`${data.motorstorm_ae.summary.total_players}\``,
    inline: true,
  })

  // Add lobby status field for MotorStorm Arctic Edge
  embed.addFields({
    name: "🌐 Arctic Edge",
    value: `**Players Online:** \`${data.motorstorm_ae.general_lobby.player_count}\`
**Players:** \`${data.motorstorm_ae.general_lobby.players.length ? data.motorstorm_ae.general_lobby.players.join(", ") : "No players online"}\``,
    inline: false,
  })

  // Add active lobbies for AE
  for (const lobby of data.motorstorm_ae.lobbies) {
    if (!lobby.is_active) continue

    const playerStatus =
      lobby.player_count > 0 && !lobby.players.length
        ? "Player is joining..."
        : lobby.players.length
          ? lobby.players.join(", ")
          : "No players online"

    embed.addFields({
      name: `${lobby.player_count > 0 ? "🟢" : "🔴"} ${lobby.name}`,
      value: `**Players Online:** \`${lobby.player_count}/${lobby.max_players}\`
**Players:** \`${playerStatus}\``,
      inline: false,
    })
  }

  // Combine "Last Updated" and "Made with ❤️ by ZoniBoy00" in the footer
  embed.setFooter({
    text: `Made with ❤️ by ZoniBoy00 • Last Updated`,
    iconURL: "https://i.imgur.com/Aswk17R.jpeg", // Optional: Add an icon URL if needed
  })

  return embed
}

module.exports = { formatEmbed }

