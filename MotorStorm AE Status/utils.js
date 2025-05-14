const fs = require("fs")

/**
 * Simplify player name by cutting everything after the first space.
 * Since MotorStorm Arctic Edge usernames can't have spaces, this effectively
 * removes all platform indicators and other suffixes.
 */
function simplifyName(name) {
  if (!name) return ""
  return name.split(" ")[0].trim()
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

module.exports = { simplifyName, getOrCreateMessage }

