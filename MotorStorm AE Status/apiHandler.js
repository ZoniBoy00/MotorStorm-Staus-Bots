const axios = require("axios")
const { simplifyName } = require("./utils")
const { parseString } = require("xml2js")
const fs = require("fs")

/**
 * Parse XML string to JavaScript object using xml2js
 */
function parseXML(xmlString) {
  return new Promise((resolve, reject) => {
    parseString(xmlString, { explicitArray: false }, (err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

/**
 * Fetch server data from the API for MotorStorm Arctic Edge.
 * @param {number} retries - Number of retry attempts if API call fails
 * @param {number} delay - Delay in milliseconds between retry attempts
 */
async function fetchServerData(retries = 3, delay = 10000) {
  try {
    console.log(`Fetching server data...`)

    // Fetch data for MotorStorm Arctic Edge (AppId: 22204)
    const lobbyResponse = await axios.get(
      "https://svo.agracingfoundation.org/medius_db/api/GetLobbyListing?AppId=22204",
    )

    // Fetch player list using the filtered endpoint - this is all we need
    const playerListResponse = await axios.get(
      "https://svo.agracingfoundation.org/medius_db/api/GetPlayerCount?filter=FILTER_APP_ID&arg=22204",
    )

    console.log(`Server data fetched successfully.`)

    // Parse XML responses
    const lobbyData = await parseXML(lobbyResponse.data)
    const playerListData = await parseXML(playerListResponse.data)

    // Extract player names from the player list (filtered endpoint)
    let allPlayers = []
    let totalPlayers = 0

    if (playerListData?.GetPlayerCount?.Player) {
      // Handle both array and single player cases
      const playerList = Array.isArray(playerListData.GetPlayerCount.Player)
        ? playerListData.GetPlayerCount.Player
        : [playerListData.GetPlayerCount.Player]

      totalPlayers = playerList.length
      console.log(`Found ${totalPlayers} players in filtered player list API`)

      allPlayers = playerList
        .map((player) => {
          // Try different possible attribute locations
          let playerName = null

          // Check $ attributes first
          if (player.$) {
            playerName = player.$.AccountName || player.$.accountName || player.$.name || player.$.Name
          }

          // If not found in $, check direct properties
          if (!playerName) {
            playerName = player.AccountName || player.accountName || player.name || player.Name
          }

          // If still not found, check for nested structures
          if (!playerName && player.Account) {
            playerName = player.Account.Name || player.Account.name
          }

          // Use the simple name cleaner from utils
          return playerName ? simplifyName(playerName) : null
        })
        .filter((name) => name)
    }

    // Extract lobbies (if any)
    let lobbies = []
    const totalLobbies = Number.parseInt(lobbyData?.GetLobbyListing?.$?.totalEntries || 0)

    if (totalLobbies > 0 && lobbyData?.GetLobbyListing?.Lobby) {
      // If there's only one lobby, it won't be an array
      const lobbyList = Array.isArray(lobbyData.GetLobbyListing.Lobby)
        ? lobbyData.GetLobbyListing.Lobby
        : [lobbyData.GetLobbyListing.Lobby]

      // Process each lobby
      lobbies = lobbyList.map((lobby) => {
        // Extract player names from PlayerListCurrent field
        let lobbyPlayers = []
        if (lobby.$ && lobby.$.PlayerListCurrent) {
          // PlayerListCurrent contains a comma-separated list of player names
          const playerList = lobby.$.PlayerListCurrent.split(",").map((name) => name.trim())
          lobbyPlayers = playerList.map((player) => simplifyName(player)).filter((name) => name)
        }

        // Get player count
        const playerCount = Number.parseInt((lobby.$ && lobby.$.PlayerCount) || 0)

        // Get max players
        const maxPlayers = Number.parseInt((lobby.$ && lobby.$.MaxPlayers) || 6)

        // Get lobby name from GameName
        const lobbyName =
          lobby.$ && lobby.$.GameName
            ? lobby.$.GameName.split("~")[0] // Remove the hash part after ~
            : "Unknown Lobby"

        return {
          name: lobbyName,
          player_count: playerCount,
          max_players: maxPlayers,
          players: lobbyPlayers,
          is_active: playerCount > 0,
        }
      })
    }

    // Remove duplicates from player list
    allPlayers = [...new Set(allPlayers)].filter((name) => name)
    console.log(`Total players found: ${allPlayers.length}, Names: ${allPlayers.join(", ")}`)

    const activeLobbies = lobbies.filter((lobby) => lobby.is_active).length

    return {
      motorstorm_ae: {
        general_lobby: {
          name: "MotorStorm Arctic Edge",
          player_count: allPlayers.length,
          players: allPlayers,
        },
        lobbies: lobbies,
        summary: {
          active_lobbies: activeLobbies,
          total_players: allPlayers.length,
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

module.exports = { fetchServerData }

