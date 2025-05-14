const { EmbedBuilder } = require("discord.js")

function formatEmbed(data) {
  const embed = new EmbedBuilder()
    .setTitle("<:msa_icon:1056688524113498112> MotorStorm Apocalypse Status <:msa_icon:1056688524113498112>")
    .setDescription(
      "Real-time status of all lobbies and players.\nhttp://www.psorg-web-revival.us:15000/",
    )
    .setColor("#ce5c2b")
    .setTimestamp(new Date())

  // Add summary fields for MSA
  embed.addFields({
    name: "📊 MotorStorm Apocalypse",
    value: `**Active Lobbies:** \`${data.motorstorm_msa.summary.active_lobbies}\`\n**Total Players Online:** \`${data.motorstorm_msa.summary.total_players}\``,
    inline: true,
  })

  // Add lobby status field for MotorStorm Apocalypse
  embed.addFields({
    name: "🌐 Apocalypse",
    value: `**Players Online:** \`${data.motorstorm_msa.general_lobby.player_count}\`\n**Players:** \`${data.motorstorm_msa.general_lobby.players.length ? data.motorstorm_msa.general_lobby.players.join(", ") : "No players online"}\``,
    inline: false,
  })

  // Add active lobbies for MSA
  for (const lobby of data.motorstorm_msa.lobbies) {
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
    iconURL: "https://i.imgur.com/7cPzbJt.jpeg", // Optional: Add an icon URL if needed
  })

  return embed
}

module.exports = { formatEmbed }

