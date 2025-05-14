require("dotenv").config()
const { Client, GatewayIntentBits, ActivityType } = require("discord.js")
const path = require("path")
const fs = require("fs")
const { fetchServerData } = require("./apiHandler")
const { formatEmbed } = require("./embedBuilder")
const { getOrCreateMessage } = require("./utils")

// Replace with your actual bot token and channel ID
const TOKEN = process.env.DISCORD_TOKEN // Use environment variable for security
const CHANNEL_ID = "1358455464299335822" // Replace with your actual channel ID
const MESSAGE_ID_FILE = path.join(__dirname, "message_id.txt") // File to store the last message ID
const AUTHORIZED_DEBUG_USER = "657620287483019300" // Your Discord ID for debug command

// Debug setting
const DEBUG = false // Set to false to disable debug messages

// Create a new Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
})

// Array of activities to rotate through
const activities = [
  { type: ActivityType.Watching, message: "Monitoring MotorStorm Arctic Edge servers" },
  { type: ActivityType.Watching, message: "{totalPlayers} players online" }, // Placeholder for dynamic player count
]

let activityIndex = 0
let totalPlayers = 0

// Function to update bot activity
function updateBotActivity() {
  const activity = activities[activityIndex]
  let activityMessage = activity.message

  if (activityIndex === 1) {
    activityMessage = activityMessage.replace("{totalPlayers}", totalPlayers)
  }

  client.user.setActivity({
    name: activityMessage,
    type: activity.type,
  })

  // Rotate to the next activity
  activityIndex = (activityIndex + 1) % activities.length
}

// Event: Bot is ready
client.once("ready", () => {
  console.log(`Bot is online: ${client.user.tag}`)
  if (DEBUG) {
    console.log(
      `Available channels:`,
      client.channels.cache
        .map((channel) => `${channel.id} - ${channel.name || "Unnamed Channel"}`)
        .join("\n"),
    )
  }

  // How often to check for server status updates (in milliseconds)
  const statusCheckInterval = 10000 // 10 seconds

  // How often to rotate the bot's activity status (in milliseconds)
  const activityRotationInterval = 30000 // 30 seconds

  setInterval(checkServerStatus, statusCheckInterval)
  setInterval(updateBotActivity, activityRotationInterval)
})

// Update the status every 10 seconds
async function checkServerStatus() {
  try {
    console.log(`Checking server status...`)
    const channel = client.channels.cache.get(CHANNEL_ID)
    if (!channel) {
      if (DEBUG) console.error("Channel not found.")
      console.log(`Channel with ID ${CHANNEL_ID} not found.`)
      return
    }

    if (channel.type !== 0) {
      // 0 = GuildText
      console.error(`Channel with ID ${CHANNEL_ID} is not a text channel.`)
      return
    }

    console.log(`Channel found: ${channel.id} - ${channel.name}`)

    const data = await fetchServerData()
    if (!data) {
      console.log(`Failed to fetch server data.`)
      return
    }

    console.log(`Server data fetched successfully.`)

    const embed = formatEmbed(data) // Get the embed object
    console.log(`Embed created successfully.`)

    const message = await getOrCreateMessage(channel, MESSAGE_ID_FILE, data, formatEmbed)
    if (!message) {
      console.log(`Failed to get or create message.`)
      return
    }

    console.log(`Message found or created: ${message.id}`)

    await message.edit({ embeds: [embed] }) // Edit the message with the new embed
    console.log("🔔 Status updated.")

    // Update total players count - use the actual player count we found
    totalPlayers = data.motorstorm_ae.summary.total_players

    // No need to call updateBotActivity here
    // updateBotActivity();
  } catch (error) {
    console.error("Error in checkServerStatus:", error)
  }
}

// Command: Manually request the server status
client.on("messageCreate", async (message) => {
  try {
    if (message.content === "!status") {
      console.log(`Command "!status" received from user: ${message.author.tag}`)
      const data = await fetchServerData()
      if (data) {
        const embed = formatEmbed(data) // Get the embed object
        await message.channel.send({ embeds: [embed] }) // Send the message with the embed
        console.log(`Status sent to channel: ${message.channel.name}`)
      } else {
        await message.channel.send("Failed to fetch server status.")
        console.log(`Failed to fetch server status for command "!status".`)
      }
    }
  } catch (error) {
    console.error("Error in messageCreate event:", error)
  }
})

// Log in to Discord
client.login(TOKEN)

