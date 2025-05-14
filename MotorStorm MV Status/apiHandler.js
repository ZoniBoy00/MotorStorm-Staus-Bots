const axios = require("axios")
const { parsePlayerName } = require("./utils")

/**
 * Fetch server data from the API for MotorStorm Monument Valley.
 */
async function fetchServerData(retries = 3, delay = 10000) {
  try {
    console.log(`Fetching server data...`)

    // Fetch data for MotorStorm MV (applicationId: 20764)
    const mvRoomsResponse = await axios.get("https://api.psrewired.com/us/api/rooms?applicationId=20764")
    const mvPlayersResponse = await axios.get("https://api.psrewired.com/us/api/universes/players?applicationId=20764")
    const mvUniverseResponse = await axios.get("https://api.psrewired.com/us/api/universes?applicationId=20764")

    console.log(`Server data fetched successfully.`)

    // Parse data for MotorStorm MV
    const mvRoomsData = mvRoomsResponse.data
    const mvPlayersData = mvPlayersResponse.data.map((player) => parsePlayerName(player.name))
    const mvUniverseData = mvUniverseResponse.data[0]
    const mvLobbies = await processRooms(mvRoomsData, mvPlayersData)

    return {
      motorstorm_mv: {
        general_lobby: {
          name: mvUniverseData.name || "MotorStorm NTSC",
          player_count: mvUniverseData.playerCount,
          players: mvPlayersData,
        },
        lobbies: mvLobbies,
        summary: {
          active_lobbies: mvRoomsData.filter((room) => (room.playerCount || 0) > 0).length,
          total_players: mvRoomsData.reduce((sum, room) => sum + (room.playerCount || 0), 0),
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
      } else if (typeof roomPlayersData === "object" && roomPlayersData.players) {
        players = roomPlayersData.players.map((player) => parsePlayerName(player.name))
      }

      // Remove these players from the remainingPlayers list
      for (const player of players) {
        const index = remainingPlayers.indexOf(player)
        if (index !== -1) remainingPlayers.splice(index, 1)
      }

      // Adjust playerCount if there's a mismatch
      if (!players.length && playerCount > 0) {
        playerCount = 0
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

