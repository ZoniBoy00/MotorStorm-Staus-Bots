const fs = require("fs")

/**
 * Remove UUID prefixes from strings.
 * Examples:
 * - "fffff7fb-ZoniBoy0" -> "ZoniBoy0"
 */
function removeUuidPrefix(str) {
  // If string is empty or not a string, return empty string
  if (!str || typeof str !== "string") return ""

  // Check if the string has a UUID format prefix (like "fffff7fb-" or "0000016f-")
  const uuidPrefixMatch = str.match(/^[0-9a-f]+-/i)
  if (uuidPrefixMatch) {
    // Remove the UUID prefix
    return str.substring(uuidPrefixMatch[0].length).trim()
  }

  return str.trim()
}

/**
 * Parse the player name by removing UUID prefixes.
 */
function parsePlayerName(name) {
  return removeUuidPrefix(name)
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

module.exports = { removeUuidPrefix, parsePlayerName, getOrCreateMessage }

