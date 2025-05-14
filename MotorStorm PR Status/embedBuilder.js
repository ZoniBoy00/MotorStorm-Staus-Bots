const { EmbedBuilder } = require("discord.js")

function formatEmbed(data) {
  const embed = new EmbedBuilder()
    .setTitle(
      "<:mspr:1199137477504536666> MotorStorm Pacific Rift Status <:mspr:1199137477504536666>",
    )
    .setDescription("Real-time status of all lobbies and players.\nhttps://psrewired.com/servers/21624")
    .setColor("#050505")
    .setTimestamp(new Date())

  // Add summary fields for PR
  embed.addFields({
    name: "📊 MotorStorm PR",
    value: `**Active Lobbies:** \`${data.motorstorm_pr.summary.active_lobbies}\`\n**Total Players Online:** \`${data.motorstorm_pr.summary.total_players}\``,
    inline: true,
  })

  // Add lobby status field for Pacific Rift US
  embed.addFields({
    name: "🌐 Pacific Rift",
    value: `**Players Online:** \`${data.motorstorm_pr.general_lobby.player_count}\`\n**Players:** \`${data.motorstorm_pr.general_lobby.players.length ? data.motorstorm_pr.general_lobby.players.join(", ") : "No players online"}\``,
    inline: false,
  })

  // Add active lobbies for PR - filter out "MotorStorm PR East"
  for (const lobby of data.motorstorm_pr.lobbies) {
    // Skip inactive lobbies and "MotorStorm PR East"
    if (!lobby.is_active || lobby.name.includes("PR East")) continue

    let playerStatus =
      lobby.player_count > 0 && !lobby.players.length
        ? "Players are joining..."
        : lobby.players.length
          ? lobby.players.join(", ")
          : "No players online"

    // If player count doesn't match displayed players, add a note
    if (lobby.players.length > 0 && lobby.players.length < lobby.player_count) {
      playerStatus += ` + ${lobby.player_count - lobby.players.length} more`
    }

    embed.addFields({
      name: `${lobby.player_count > 0 ? "🟢" : "🔴"} ${lobby.name}`,
      value: `**Players Online:** \`${lobby.player_count}/${lobby.max_players}\`\n**Players:** \`${playerStatus}\``,
      inline: false,
    })
  }

  // Combine "Last Updated" and "Made with ❤️ by ZoniBoy00" in the footer
  embed.setFooter({
    text: `Made with ❤️ by ZoniBoy00 • Last Updated`,
    iconURL: "https://i.imgur.com/swjSj1B.png", // Optional: Add an icon URL if needed
  })

  return embed
}

module.exports = { formatEmbed }

