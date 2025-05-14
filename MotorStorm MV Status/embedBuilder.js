const { EmbedBuilder } = require("discord.js")

function formatEmbed(data) {
  const embed = new EmbedBuilder()
    .setTitle("<:motorstorm:1080620669714305054> MotorStorm Monument Valley Status <:motorstorm:1080620669714305054>")
    .setDescription(
      "Real-time status of all lobbies and players.\nhttps://psrewired.com/servers/20764",
    )
    .setColor("#fccd14")
    .setTimestamp(new Date())

  // Add summary fields for MV
  embed.addFields({
    name: "📊 MotorStorm MV",
    value: `**Active Lobbies:** \`${data.motorstorm_mv.summary.active_lobbies}\`\n**Total Players Online:** \`${data.motorstorm_mv.summary.total_players}\``,
    inline: true,
  })

  // Add lobby status field for MotorStorm NTSC
  embed.addFields({
    name: "🌐 Monument Valley",
    value: `**Players Online:** \`${data.motorstorm_mv.general_lobby.player_count}\`\n**Players:** \`${data.motorstorm_mv.general_lobby.players.length ? data.motorstorm_mv.general_lobby.players.join(", ") : "No players online"}\``,
    inline: false,
  })

  // Add active lobbies for MV
  for (const lobby of data.motorstorm_mv.lobbies) {
    if (!lobby.is_active) continue

    const playerStatus =
      lobby.player_count > 0 && !lobby.players.length
        ? "Player is joining..."
        : lobby.players.length
          ? lobby.players.join(", ")
          : "No players online"

    embed.addFields({
      name: `${lobby.player_count > 0 ? "🟢" : "🔴"} ${lobby.name}`,
      value: `**Players Online:** \`${lobby.player_count}/${lobby.max_players}\`\n**Players:** \`${playerStatus}\``,
      inline: false,
    })
  }

  // Combine "Last Updated" and "Made with ❤️ by ZoniBoy00" in the footer
  embed.setFooter({
    text: `Made with ❤️ by ZoniBoy00 • Last Updated`,
    iconURL: "https://i.imgur.com/haIBKrD.png", // Optional: Add an icon URL if needed
  })

  return embed
}

module.exports = { formatEmbed }

