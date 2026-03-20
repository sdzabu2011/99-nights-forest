class PlayerManager {
  constructor() {
    this.players = new Map();
  }

  addPlayer(playerData) {
    this.players.set(playerData.id, playerData);
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
  }

  getPlayer(playerId) {
    return this.players.get(playerId);
  }

  getAllPlayers() {
    return Array.from(this.players.values());
  }

  getAlivePlayers() {
    return this.getAllPlayers().filter(p => p.isAlive);
  }

  getPlayerCount() {
    return this.players.size;
  }
}

module.exports = PlayerManager;