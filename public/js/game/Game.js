class Game {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.clock = new THREE.Clock();

    // Game systems
    this.forest = null;
    this.dayNightCycle = null;
    this.weatherSystem = null;
    this.monsterManager = null;
    this.campfireManager = null;
    this.inventory = null;
    this.audioManager = null;
    this.minimap = null;

    // Network
    this.networkManager = null;
    this.chat = null;

    // UI
    this.uiManager = null;

    // Player
    this.localPlayer = null;
    this.remotePlayers = new Map();
    this.playerData = null;

    // Game state
    this.isRunning = false;
    this.gameState = {
      timeOfDay: 0.25,
      isNight: false,
      currentNight: 1,
      weather: 'clear',
      monsterPositions: []
    };

    // Movement update throttle
    this.lastMovementUpdate = 0;
    this.movementUpdateInterval = 50; // 20 updates per second

    // Footstep timer
    this.footstepTimer = 0;

    // Monster damage check
    this.damageCheckTimer = 0;
  }

  init() {
    // Setup Three.js
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.8;

    document.getElementById('game-container').appendChild(this.renderer.domElement);

    // Controls
    this.controls = new Controls(this.camera, this.renderer.domElement);

    // Initialize systems
    this.forest = new Forest(this.scene);
    this.dayNightCycle = new DayNightCycle(this.scene);
    this.weatherSystem = new WeatherSystem(this.scene);
    this.monsterManager = new MonsterManager(this.scene);
    this.campfireManager = new CampfireManager(this.scene);
    this.inventory = new Inventory();
    this.audioManager = new AudioManager();
    this.minimap = new HUDMinimap();
    this.uiManager = new UIManager();

    // Network
    this.networkManager = new NetworkManager();
    this.chat = new Chat(this.networkManager);

    // Setup network callbacks
    this.setupNetworkCallbacks();

    // Connect
    this.networkManager.connect();

    // Handle resize
    window.addEventListener('resize', () => this.onResize());

    // Handle key inputs
    this.setupGameInputs();

    // Add vignette
    const vignette = document.createElement('div');
    vignette.className = 'vignette';
    document.body.appendChild(vignette);
  }

  setupNetworkCallbacks() {
    const net = this.networkManager;

    net.on('registerResult', (data) => {
      if (data.success) {
        this.onRegistered(data);
      } else {
        document.getElementById('login-error').textContent = data.message;
      }
    });

    net.on('playerJoined', (data) => {
      this.addRemotePlayer(data.player);
      this.chat.addMessage(null, `${data.player.username} entered the forest`, true);
      this.uiManager.addAnnouncement(`${data.player.username} joined!`);
    });

    net.on('playerLeft', (data) => {
      this.removeRemotePlayer(data.id);
    });

    net.on('playerMoved', (data) => {
      this.updateRemotePlayer(data);
    });

    net.on('flashlightToggled', (data) => {
      const player = this.remotePlayers.get(data.id);
      if (player) {
        player.setFlashlight(data.flashlightOn);
      }
    });

    net.on('gameStateUpdate', (data) => {
      this.gameState = data;
      this.dayNightCycle.update(data.timeOfDay);
      this.weatherSystem.setWeather(data.weather);
      this.monsterManager.updateMonsters(data.monsterPositions);
      this.uiManager.updateTimeDisplay(data.timeOfDay, data.isNight);
      this.uiManager.updateWeather(data.weather);
      this.audioManager.setNightAmbience(data.isNight);
    });

    net.on('statsUpdate', (data) => {
      this.uiManager.updateStats(data.health, data.stamina, data.hunger, data.sanity);

      if (this.playerData) {
        this.playerData.health = data.health;
        this.playerData.stamina = data.stamina;
        this.playerData.hunger = data.hunger;
        this.playerData.sanity = data.sanity;
      }
    });

    net.on('chatMessage', (data) => {
      this.chat.addMessage(data.username, data.message);
    });

    net.on('itemPickedUp', (data) => {
      this.inventory.addItem(data.item);
      this.audioManager.playPickup();
    });

    net.on('itemRemoved', (data) => {
      this.forest.removeItemMesh(data.itemId);
    });

    net.on('itemsSpawned', (data) => {
      data.items.forEach(item => {
        this.forest.addItemMesh(item);
      });
    });

    net.on('itemUsed', (data) => {
      this.inventory.removeItem(data.itemId);
    });

    net.on('playerDied', (data) => {
      if (this.playerData && data.id === this.playerData.id) {
        // Local player died
        this.controls.disable();
        this.uiManager.showDeath(
          data.cause,
          this.playerData.currentNight,
          this.playerData.score || 0
        );
        if (this.localPlayer) {
          this.localPlayer.die();
        }
      } else {
        // Remote player died
        const player = this.remotePlayers.get(data.id);
        if (player) {
          player.die();
        }
        this.chat.addMessage(null, `${data.username} was killed by ${data.cause}`, true);
      }
    });

    net.on('respawned', (data) => {
      this.playerData = data.player;
      if (this.localPlayer) {
        this.localPlayer.respawn(data.player.position);
        this.localPlayer.isAlive = true;
      }
      this.inventory.clear();
      this.uiManager.hideDeath();
      this.uiManager.showGame();
      this.controls.enable();
    });

    net.on('playerRespawned', (data) => {
      const player = this.remotePlayers.get(data.id);
      if (player) {
        player.respawn(data.position);
      }
    });

    net.on('nightProgression', (data) => {
      this.playerData.currentNight = data.currentNight;
      this.playerData.score = data.score;
      this.uiManager.updateNight(data.currentNight);
      this.uiManager.updateScore(data.score);
    });

    net.on('announcement', (data) => {
      this.uiManager.addAnnouncement(data.message);
    });
  }

  setupGameInputs() {
    document.addEventListener('keydown', (e) => {
      if (!this.isRunning) return;
      if (this.chat.isOpen) return;

      switch (e.code) {
        case 'KeyF':
          // Toggle flashlight
          if (this.localPlayer) {
            const isOn = this.localPlayer.toggleFlashlight();
            this.networkManager.toggleFlashlight();
            this.uiManager.updateFlashlight(isOn);
          }
          break;

        case 'KeyE':
          // Interact
          this.tryInteract();
          break;

        case 'KeyQ':
          // Use selected item
          this.useSelectedItem();
          break;
      }
    });
  }

  onRegistered(data) {
    this.playerData = data.player;

    // Show loading
    this.uiManager.showLoading();

    // Build world
    setTimeout(() => {
      this.uiManager.updateLoadingProgress(20, 'Generating forest...');

      setTimeout(() => {
        this.forest.buildWorld(data.worldData);
        this.uiManager.updateLoadingProgress(50, 'Creating campfires...');

        setTimeout(() => {
          this.campfireManager.createCampfires(data.worldData.campfires);
          this.uiManager.updateLoadingProgress(70, 'Spawning creatures...');

          setTimeout(() => {
            // Create local player
            this.localPlayer = new Player(this.scene, data.player, true);
            this.camera.position.set(
              data.player.position.x,
              1.6,
              data.player.position.z
            );

            this.uiManager.updateLoadingProgress(85, 'Loading other players...');

            setTimeout(() => {
              // Add existing players
              data.existingPlayers.forEach(p => {
                this.addRemotePlayer(p);
              });

              // Initialize audio
              this.audioManager.init();

              this.uiManager.updateLoadingProgress(100, 'Welcome to the forest...');

              setTimeout(() => {
                this.uiManager.showGame();
                this.controls.enable();
                this.isRunning = true;
                this.audioManager.resume();
                this.audioManager.startAmbient();
                this.animate();
              }, 500);
            }, 200);
          }, 200);
        }, 200);
      }, 200);
    }, 200);
  }

  addRemotePlayer(playerData) {
    const player = new Player(this.scene, playerData, false);
    this.remotePlayers.set(playerData.id, player);
    this.updatePlayerListUI();
  }

  removeRemotePlayer(playerId) {
    const player = this.remotePlayers.get(playerId);
    if (player) {
      player.dispose();
      this.remotePlayers.delete(playerId);
      this.updatePlayerListUI();
    }
  }

  updateRemotePlayer(data) {
    const player = this.remotePlayers.get(data.id);
    if (player) {
      player.updateRemote(data, 0.016);
    }
  }

  updatePlayerListUI() {
    const players = [];

    if (this.playerData) {
      players.push({
        username: this.playerData.username + ' (You)',
        isAlive: this.localPlayer ? this.localPlayer.isAlive : true
      });
    }

    this.remotePlayers.forEach(player => {
      players.push({
        username: player.username,
        isAlive: player.isAlive
      });
    });

    this.uiManager.updatePlayerList(players);
  }

  tryInteract() {
    if (!this.localPlayer || !this.localPlayer.isAlive) return;

    const pos = this.localPlayer.getPosition();
    const nearbyItem = this.forest.getNearbyItem(pos, 3);

    if (nearbyItem) {
      this.networkManager.pickupItem(nearbyItem.itemId);
    }
  }

  useSelectedItem() {
    const item = this.inventory.getSelectedItem();
    if (item) {
      this.networkManager.useItem(item.id);
    }
  }

  animate() {
    if (!this.isRunning) return;

    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.1);

    // Update local player
    if (this.localPlayer && this.localPlayer.isAlive) {
      this.localPlayer.updateLocal(this.controls, delta, this.forest);

      // Send movement to server (throttled)
      const now = Date.now();
      if (now - this.lastMovementUpdate > this.movementUpdateInterval) {
        this.networkManager.sendMovement(
          this.localPlayer.getPosition(),
          { y: this.controls.getYaw() },
          this.localPlayer.animationState,
          this.controls.isRunning
        );
        this.lastMovementUpdate = now;
      }

      // Stamina drain when running
      if (this.controls.isRunning && this.playerData) {
        if (this.playerData.stamina <= 0) {
          this.controls.isRunning = false;
        }
      }

      // Footstep sounds
      if (this.localPlayer.animationState !== 'idle') {
        this.footstepTimer += delta;
        const interval = this.localPlayer.animationState === 'running' ? 0.3 : 0.5;
        if (this.footstepTimer >= interval) {
          this.audioManager.playFootstep();
          this.footstepTimer = 0;
        }
      }

      // Check for nearby items
      const pos = this.localPlayer.getPosition();
      const nearbyItem = this.forest.getNearbyItem(pos, 3);
      if (nearbyItem) {
        this.uiManager.showInteraction(`pick up ${nearbyItem.name}`);
      } else {
        this.uiManager.hideInteraction();
      }

      // Check monster proximity and damage
      this.damageCheckTimer += delta;
      if (this.damageCheckTimer >= 1) {
        this.damageCheckTimer = 0;
        this.checkMonsterDamage();
      }

      // Check campfire safe zone
      const inSafeZone = this.campfireManager.isInSafeZone(pos);
      if (inSafeZone && this.playerData) {
        // Slowly restore sanity near campfire
        // Handled server-side but we can show visual
      }

      // Update minimap
      const otherPlayersData = [];
      this.remotePlayers.forEach(p => {
        otherPlayersData.push({
          position: p.group ? p.group.position : { x: 0, z: 0 },
          isAlive: p.isAlive
        });
      });

      this.minimap.update(
        pos,
        otherPlayersData,
        this.gameState.monsterPositions,
        this.forest.campfirePositions
      );
    }

    // Update game systems
    this.forest.update(delta, this.gameState.timeOfDay);
    this.weatherSystem.update(delta, this.camera.position);
    this.campfireManager.update(delta);

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  checkMonsterDamage() {
    if (!this.localPlayer || !this.localPlayer.isAlive) return;

    const pos = this.localPlayer.getPosition();
    const nearest = this.monsterManager.getNearestMonster(pos);

    if (nearest && nearest.distance < 3 && nearest.state === 'attacking') {
      // Check if in safe zone
      if (!this.campfireManager.isInSafeZone(pos)) {
        const damage = {
          wendigo: 25,
          shadow: 15,
          crawler: 20,
          ghost: 10
        };
        const dmg = damage[nearest.type] || 15;
        this.networkManager.sendDamage(dmg, nearest.type);
        this.uiManager.showDamageOverlay();
        this.audioManager.playDamage();
      }
    }

    // Play monster sound if nearby
    if (nearest && nearest.distance < 20) {
      if (Math.random() < 0.1) {
        this.audioManager.playMonsterSound();
      }
    }
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}