class NetworkManager {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.callbacks = {};
  }

  connect() {
    this.socket = io();

    this.socket.on('connect', () => {
      this.connected = true;
      console.log('Connected to server');
      this.trigger('connected');
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      console.log('Disconnected from server');
      this.trigger('disconnected');
    });

    // Game events
    this.socket.on('registerResult', (data) => this.trigger('registerResult', data));
    this.socket.on('playerJoined', (data) => this.trigger('playerJoined', data));
    this.socket.on('playerLeft', (data) => this.trigger('playerLeft', data));
    this.socket.on('playerMoved', (data) => this.trigger('playerMoved', data));
    this.socket.on('flashlightToggled', (data) => this.trigger('flashlightToggled', data));
    this.socket.on('gameStateUpdate', (data) => this.trigger('gameStateUpdate', data));
    this.socket.on('statsUpdate', (data) => this.trigger('statsUpdate', data));
    this.socket.on('chatMessage', (data) => this.trigger('chatMessage', data));
    this.socket.on('itemPickedUp', (data) => this.trigger('itemPickedUp', data));
    this.socket.on('itemRemoved', (data) => this.trigger('itemRemoved', data));
    this.socket.on('itemsSpawned', (data) => this.trigger('itemsSpawned', data));
    this.socket.on('itemUsed', (data) => this.trigger('itemUsed', data));
    this.socket.on('playerDied', (data) => this.trigger('playerDied', data));
    this.socket.on('playerRespawned', (data) => this.trigger('playerRespawned', data));
    this.socket.on('nightProgression', (data) => this.trigger('nightProgression', data));
    this.socket.on('announcement', (data) => this.trigger('announcement', data));
    this.socket.on('respawned', (data) => this.trigger('respawned', data));
  }

  register(username) {
    this.socket.emit('register', { username });
  }

  sendMovement(position, rotation, animation, isRunning) {
    this.socket.emit('playerMove', { position, rotation, animation, isRunning });
  }

  toggleFlashlight() {
    this.socket.emit('toggleFlashlight');
  }

  sendChatMessage(message) {
    this.socket.emit('chatMessage', { message });
  }

  pickupItem(itemId) {
    this.socket.emit('pickupItem', { itemId });
  }

  useItem(itemId) {
    this.socket.emit('useItem', { itemId });
  }

  sendDamage(damage, cause) {
    this.socket.emit('playerDamaged', { damage, cause });
  }

  sendNightComplete() {
    this.socket.emit('nightComplete');
  }

  requestRespawn() {
    this.socket.emit('respawn');
  }

  // Event system
  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }

  trigger(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(cb => cb(data));
    }
  }
}