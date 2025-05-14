const axios = require("axios")
const { parsePlayerName, removeUuidPrefix } = require("./utils")

/**
 * Fetch server data from the API for MotorStorm Apocalypse.
 */
async function fetchServerData(retries = 3, delay = 5000) {
  try {
    console.log(`Fetching server data...`)

    // Fetch data for MotorStorm Apocalypse (AppID: 22500)
    const msaResponse = await axios.get("http://api.psorg-web-revival.us:61920/GetRooms/")

    console.log(`Server data fetched successfully.`)

    // Find the MotorStorm Apocalypse entry (AppId: 22500)
    const allRoomsData = msaResponse.data
    const msaEntry = allRoomsData.find((entry) => entry.AppId === "22500" || entry.AppId === 22500)

    if (!msaEntry) {
      console.log("MotorStorm Apocalypse (AppId: 22500) not found in API response")
      return createEmptyResponse()
    }

    // Process worlds and game sessions
    const worlds = msaEntry.Worlds || []

    const allGameSessions = []
    let allPlayers = []

    // Extract game sessions and players from all worlds
    worlds.forEach((world) => {
      const worldId = world.WorldId || "Unknown"

      // Check for GameSessions
      const gameSessions = world.GameSessions || []

      // Process each game session
      gameSessions.forEach((session) => {
        // Add world ID and processed client info to the session
        const processedSession = {
          ...session,
          WorldId: worldId,
          PlayerCount: 0,
          Players: [],
        }

        // Extract clients (players) from the session
        if (session.Clients && Array.isArray(session.Clients)) {
          const sessionPlayers = session.Clients.map((client) => {
            const name = client.Name || client.PlayerName || ""
            return parsePlayerName(name)
          }).filter((name) => name)

          // Add player names to the session
          processedSession.Players = sessionPlayers
          processedSession.PlayerCount = sessionPlayers.length

          // Add to the global player list
          allPlayers = allPlayers.concat(sessionPlayers)
        }

        allGameSessions.push(processedSession)
      })
    })

    // Remove duplicates from player list
    allPlayers = [...new Set(allPlayers)].filter((name) => name)

    // Process game sessions into lobbies
    const lobbies = processGameSessions(allGameSessions)

    // Calculate total players and active lobbies
    const totalPlayers = allPlayers.length
    const activeLobbies = lobbies.filter((lobby) => lobby.is_active).length

    return {
      motorstorm_msa: {
        general_lobby: {
          name: "MotorStorm Apocalypse",
          player_count: totalPlayers,
          players: allPlayers,
        },
        lobbies: lobbies,
        summary: {
          active_lobbies: activeLobbies,
          total_players: totalPlayers,
        },
      },
    }
  } catch (error) {
    if (retries > 0) {
      console.warn(`Retrying fetchServerData... Retries left: ${retries}`)
      await new Promise((resolve) => setTimeout(resolve, delay))
      return fetchServerData(retries - 1, delay)
    } else {
      console.error("Error fetching server data:", error.response ? error.response.data : error.message)
      return createEmptyResponse()
    }
  }
}

/**
 * Process game sessions into lobby information.
 */
function processGameSessions(gameSessions) {
  if (!gameSessions || gameSessions.length === 0) {
    return [] // Return empty array when no game sessions
  }

  return gameSessions.map((session) => {
    // Extract session name - remove UUID prefix if present
    let sessionName = session.Name || `Game Session (World ${session.WorldId})`
    sessionName = removeUuidPrefix(sessionName)

    // Get player count from Players array length or PlayerCount property
    const playerCount = session.Players ? session.Players.length : session.PlayerCount || 0
    const maxPlayers = 16 // Set to 16 players as requested

    // A session is active if it has players
    const isActive = playerCount > 0

    return {
      name: sessionName,
      player_count: playerCount,
      max_players: maxPlayers,
      players: session.Players || [],
      is_active: isActive,
    }
  })
}

/**
 * Create an empty response for when the server is offline or no data is available.
 */
function createEmptyResponse() {
  return {
    motorstorm_msa: {
      general_lobby: {
        name: "MotorStorm Apocalypse",
        player_count: 0,
        players: [],
      },
      lobbies: [],
      summary: {
        active_lobbies: 0,
        total_players: 0,
      },
    },
  }
}

module.exports = { fetchServerData }

