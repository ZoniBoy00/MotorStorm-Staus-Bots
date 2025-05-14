const axios = require("axios")
const { parsePlayerName } = require("./utils")

/**
 * Fetch server data from the API for MotorStorm Pacific Rift.
 */
async function fetchServerData(retries = 3, delay = 10000) {
  try {
    console.log(`Fetching server data...`)

    // Fetch data for MotorStorm PR (applicationId: 21624)
    const prRoomsResponse = await axios.get("https://api.psrewired.com/us/api/rooms?applicationId=21624")
    const prPlayersResponse = await axios.get("https://api.psrewired.com/us/api/universes/players?applicationId=21624")

    console.log(`Server data fetched successfully.`)

    // Parse data for MotorStorm PR
    const prRoomsData = prRoomsResponse.data
    const prPlayersData = prPlayersResponse.data.map((player) => parsePlayerName(player.name))
    const prLobbies = await processRooms(prRoomsData, prPlayersData)

    return {
      motorstorm_pr: {
        general_lobby: {
          name: "Pacific Rift",
          player_count: prRoomsData.reduce((sum, room) => sum + (room.playerCount || 0), 0),
          players: prPlayersData,
        },
        lobbies: prLobbies,
        summary: {
          active_lobbies: prRoomsData.filter((room) => (room.playerCount || 0) > 0).length,
          total_players: prRoomsData.reduce((sum, room) => sum + (room.playerCount || 0), 0),
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
      return null
    }
  }
}

/**
 * Process rooms data and extract lobby information.
 */
async function processRooms(roomsData, allPlayers) {
  const lobbies = []
  const remainingPlayers = [...allPlayers] // Copy of all players for distribution

  for (const room of roomsData) {
    try {
      const roomId = room.id
      let roomName = room.name || "Unknown Lobby"
      let playerCount = room.playerCount || 0
      const maxPlayers = room.maxPlayers || 12

      // Fetch player data for this specific room
      const roomPlayersResponse = await axios.get(`https://api.psrewired.com/us/api/rooms/${roomId}`)
      const roomPlayersData = roomPlayersResponse.data

      // Update room name from /rooms/{roomId} endpoint
      if (Array.isArray(roomPlayersData) && roomPlayersData.length > 0) {
        roomName = roomPlayersData[0].name || roomName
      } else if (typeof roomPlayersData === "object") {
        roomName = roomPlayersData.name || roomName
      }

      // Handle different response formats (list or dictionary)
      let players = []
      if (Array.isArray(roomPlayersData)) {
        for (const item of roomPlayersData) {
          if (item.players) {
            players = players.concat(item.players.map((player) => parsePlayerName(player.name)))
          }
        }
      } else if (typeof roomPlayersData === "object") {
        if (roomPlayersData.players) {
          players = roomPlayersData.players.map((player) => parsePlayerName(player.name))
        } else if (roomPlayersData.playerCount && roomPlayersData.playerCount > 0) {
          // If we have a player count but no player list, try to match from allPlayers
          // This helps when the API doesn't return all player names
          const roomNamePrefix = roomName.split("-")[0]
          if (roomNamePrefix) {
            // Try to find players with matching prefix in their name
            const matchingPlayers = allPlayers.filter((player) =>
              player.toLowerCase().includes(roomName.split("-")[1]?.toLowerCase() || ""),
            )
            players = matchingPlayers.slice(0, roomPlayersData.playerCount)
          }
        }
      }

      // Remove these players from the remainingPlayers list
      for (const player of players) {
        const index = remainingPlayers.indexOf(player)
        if (index !== -1) remainingPlayers.splice(index, 1)
      }

      // Adjust playerCount if there's a mismatch
      if (players.length > 0 && players.length !== playerCount) {
        // If we have players but count doesn't match, update the count to match reality
        playerCount = players.length
      }

      lobbies.push({
        name: roomName, // Use the updated room name here
        player_count: playerCount,
        max_players: maxPlayers,
        players: players,
        is_active: playerCount > 0,
      })
    } catch (error) {
      console.error(`Error processing room with ID ${room.id}:`, error)
    }
  }

  return lobbies
}

module.exports = { fetchServerData }

