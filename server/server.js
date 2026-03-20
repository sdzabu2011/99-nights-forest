const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const GameManager = require('./game/GameManager');
const PlayerManager = require('./game/PlayerManager');
const WorldManager = require('./game/WorldManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Game state
const gameManager = new GameManager();
const playerManager = new PlayerManager();
const worldManager = new WorldManager();

// Initialize world
worldManager.generateWorld();

// Store active players
const activePlayers = new Map();
const registeredUsernames = new Set();

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Handle username registration
  socket.on('register', (data) => {
    const { username } = data;

    if (!username || username.trim().length < 2) {
      socket.emit('registerResult', {
        success: false,
        message: 'Username must be at least 2 characters!'
      });
      return;
    }

    if (username.trim().length > 16) {
      socket.emit('registerResult', {
        success: false,
        message: 'Username must be 16 characters or less!'
      });
      return;
    }

    if (registeredUsernames.has(username.toLowerCase())) {
      socket.emit('registerResult', {
        success: false,
        message: 'Username already taken!'
      });
      return;
    }

    // Register the player
    const playerId = uuidv4();
    const spawnPoint = worldManager.getRandomSpawnPoint();

    const playerData = {
      id: playerId,
      socketId: socket.id,
      username: username.trim(),
      position: spawnPoint,
      rotation: { x: 0, y: 0, z: 0 },
      health: 100,
      stamina: 100,
      hunger: 100,
      sanity: 100,
      inventory: [],
      isAlive: true,
      currentNight: 1,
      score: 0,
      flashlightOn: false,
      isRunning: false,
      animation: 'idle'
    };

    activePlayers.set(socket.id, playerData);
    registeredUsernames.add(username.toLowerCase());
    playerManager.addPlayer(playerData);

    socket.emit('registerResult', {
      success: true,
      player: playerData,
      worldData: worldManager.getWorldData(),
      existingPlayers: Array.from(activePlayers.values()).filter(
        p => p.socketId !== socket.id
      )
    });

    // Notify other players
    socket.broadcast.emit('playerJoined', {
      player: playerData
    });

    console.log(`Player registered: ${username} (${playerId})`);
  });

  // Handle player movement
  socket.on('playerMove', (data) => {
    const player = activePlayers.get(socket.id);
    if (!player || !player.isAlive) return;

    player.position = data.position;
    player.rotation = data.rotation;
    player.animation = data.animation || 'idle';
    player.isRunning = data.isRunning || false;

    socket.broadcast.emit('playerMoved', {
      id: player.id,
      position: player.position,
      rotation: player.rotation,
      animation: player.animation,
      isRunning: player.isRunning
    });
  });

  // Handle flashlight toggle
  socket.on('toggleFlashlight', () => {
    const player = activePlayers.get(socket.id);
    if (!player) return;

    player.flashlightOn = !player.flashlightOn;

    io.emit('flashlightToggled', {
      id: player.id,
      flashlightOn: player.flashlightOn
    });
  });

  // Handle chat messages
  socket.on('chatMessage', (data) => {
    const player = activePlayers.get(socket.id);
    if (!player) return;

    io.emit('chatMessage', {
      username: player.username,
      message: data.message.substring(0, 200),
      timestamp: Date.now()
    });
  });

  // Handle item pickup
  socket.on('pickupItem', (data) => {
    const player = activePlayers.get(socket.id);
    if (!player) return;

    const item = worldManager.pickupItem(data.itemId, player.id);
    if (item) {
      player.inventory.push(item);
      socket.emit('itemPickedUp', { item });
      socket.broadcast.emit('itemRemoved', { itemId: data.itemId });
    }
  });

  // Handle item use
  socket.on('useItem', (data) => {
    const player = activePlayers.get(socket.id);
    if (!player) return;

    const itemIndex = player.inventory.findIndex(i => i.id === data.itemId);
    if (itemIndex === -1) return;

    const item = player.inventory[itemIndex];
    const result = gameManager.useItem(player, item);

    if (result.consumed) {
      player.inventory.splice(itemIndex, 1);
    }

    socket.emit('itemUsed', {
      itemId: data.itemId,
      result: result,
      playerStats: {
        health: player.health,
        stamina: player.stamina,
        hunger: player.hunger,
        sanity: player.sanity
      }
    });
  });

  // Handle player damage
  socket.on('playerDamaged', (data) => {
    const player = activePlayers.get(socket.id);
    if (!player) return;

    player.health = Math.max(0, player.health - data.damage);

    if (player.health <= 0) {
      player.isAlive = false;
      io.emit('playerDied', {
        id: player.id,
        username: player.username,
        cause: data.cause
      });
    }

    socket.emit('statsUpdate', {
      health: player.health,
      stamina: player.stamina,
      hunger: player.hunger,
      sanity: player.sanity
    });
  });

  // Handle night progression
  socket.on('nightComplete', () => {
    const player = activePlayers.get(socket.id);
    if (!player) return;

    player.currentNight++;
    player.score += 100 * player.currentNight;

    socket.emit('nightProgression', {
      currentNight: player.currentNight,
      score: player.score
    });

    io.emit('announcement', {
      message: `${player.username} survived night ${player.currentNight - 1}!`
    });
  });

  // Handle respawn
  socket.on('respawn', () => {
    const player = activePlayers.get(socket.id);
    if (!player) return;

    const spawnPoint = worldManager.getRandomSpawnPoint();
    player.position = spawnPoint;
    player.health = 100;
    player.stamina = 100;
    player.hunger = 100;
    player.sanity = 100;
    player.isAlive = true;
    player.inventory = [];
    player.currentNight = 1;

    socket.emit('respawned', { player });
    socket.broadcast.emit('playerRespawned', {
      id: player.id,
      position: player.position
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const player = activePlayers.get(socket.id);
    if (player) {
      console.log(`Player disconnected: ${player.username}`);
      registeredUsernames.delete(player.username.toLowerCase());
      playerManager.removePlayer(player.id);
      activePlayers.delete(socket.id);

      io.emit('playerLeft', { id: player.id });
    }
  });
});

// Game loop - runs every 100ms (10 ticks per second)
const TICK_RATE = 100;
setInterval(() => {
  const gameState = gameManager.update(activePlayers, worldManager);

  // Update player stats over time
  for (const [socketId, player] of activePlayers) {
    if (!player.isAlive) continue;

    // Decrease hunger over time
    player.hunger = Math.max(0, player.hunger - 0.02);

    // Decrease sanity at night
    if (gameState.isNight) {
      player.sanity = Math.max(0, player.sanity - 0.03);
    } else {
      player.sanity = Math.min(100, player.sanity + 0.05);
    }

    // Regenerate stamina when not running
    if (!player.isRunning) {
      player.stamina = Math.min(100, player.stamina + 0.1);
    }

    // Take damage from hunger
    if (player.hunger <= 0) {
      player.health = Math.max(0, player.health - 0.05);
    }

    // Low sanity effects
    if (player.sanity <= 20) {
      player.health = Math.max(0, player.health - 0.02);
    }

    // Check death
    if (player.health <= 0 && player.isAlive) {
      player.isAlive = false;
      io.to(socketId).emit('playerDied', {
        id: player.id,
        username: player.username,
        cause: player.hunger <= 0 ? 'starvation' : 'insanity'
      });
    }

    // Send stats update
    io.to(socketId).emit('statsUpdate', {
      health: Math.round(player.health * 10) / 10,
      stamina: Math.round(player.stamina * 10) / 10,
      hunger: Math.round(player.hunger * 10) / 10,
      sanity: Math.round(player.sanity * 10) / 10
    });
  }

  // Broadcast game state
  io.emit('gameStateUpdate', {
    timeOfDay: gameState.timeOfDay,
    isNight: gameState.isNight,
    currentNightGlobal: gameState.currentNight,
    weather: gameState.weather,
    monsterPositions: gameState.monsterPositions
  });

}, TICK_RATE);

// Spawn items periodically
setInterval(() => {
  const newItems = worldManager.spawnRandomItems();
  if (newItems.length > 0) {
    io.emit('itemsSpawned', { items: newItems });
  }
}, 30000); // Every 30 seconds

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🌲 99 Nights in the Forest server running on port ${PORT}`);
  console.log(`🎮 Open http://localhost:${PORT} to play!`);
});