const fs = require("fs")

/**
 * Parse the player name by removing numeric prefixes and special characters.
 * Example: "fffff7fb-ZoniBoy0" -> "ZoniBoy0"
 */
function parsePlayerName(name) {
  const match = name.match(/[^0-9-]+/)
  return match ? name.substring(match.index).trim() : name.trim()
}

/**
 * Fetch the last message ID from the file or create a new message.
 */
async function getOrCreateMessage(channel, messageIdFile, data, formatEmbed) {
  if (fs.existsSync(messageIdFile)) {
    try {
      const messageId = fs.readFileSync(messageIdFile, "utf8").trim()
      const message = await channel.messages.fetch(messageId)
      return message
    } catch (error) {
      console.error("Error fetching message:", error)
    }
  }

  // Create a new message if no valid message ID exists
  const embed = formatEmbed(data) // Get the embed object

  const message = await channel.send({ embeds: [embed] })
  fs.writeFileSync(messageIdFile, message.id)
  return message
}

module.exports = { parsePlayerName, getOrCreateMessage }

