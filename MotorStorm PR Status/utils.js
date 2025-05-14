const fs = require("fs")

/**
 * Parse the player name by removing numeric prefixes and special characters.
 * Example: "fffff7fb-ZoniBoy0" -> "ZoniBoy0"
 */
function parsePlayerName(name) {
  if (!name) return "Unknown"

  // Handle format like "fffff7fb-ZoniBoy0"
  if (name.includes("-")) {
    return name.split("-")[1].trim()
  }

  // Handle format with hex prefix
  const match = name.match(/[0-9a-f]+-(.+)/i)
  if (match && match[1]) {
    return match[1].trim()
  }

  // Handle format with just hex prefix without dash
  const hexPrefixMatch = name.match(/^[0-9a-f]{8,}(.+)/i)
  if (hexPrefixMatch && hexPrefixMatch[1]) {
    return hexPrefixMatch[1].trim()
  }

  return name.trim()
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

