// =============================================
// PERFORMANCE MANAGER - Fixes all lag issues
// Auto-patches the game, no other files need changes
// =============================================

(function () {

  const PERF_CONFIG = {
    // Draw distance - objects beyond this are hidden
    drawDistance: 80,

    // Max visible trees at once
    maxVisibleTrees: 150,

    // Max visible rocks at once
    maxVisibleRocks: 40,

    // Max visible fog particles
    maxVisibleFog: 15,

    // Shadow map size (lower = faster)
    shadowMapSize: 512,

    // Max pixel ratio (lower = faster)
    maxPixelRatio: 1,

    // Max lights active at once
    maxActiveLights: 8,

    // How often to update visibility (ms)
    cullInterval: 500,

    // Reduce monster update rate
    monsterUpdateInterval: 200,

    // Network send rate (ms)
    networkSendRate: 80,

    // Enable frustum culling
    frustumCulling: true,

    // Disable shadows on small objects
    smallObjectShadows: false,

    // Reduce fog particles
    reduceFog: true,

    // Auto quality detection
    autoQuality: true
  };

  // ==========================================
  // FPS Counter for auto quality adjustment
  // ==========================================
  let frameCount = 0;
  let lastFpsTime = Date.now();
  let currentFps = 60;
  let qualityLevel = 'medium'; // low, medium, high

  function measureFps() {
    frameCount++;
    const now = Date.now();
    if (now - lastFpsTime >= 1000) {
      currentFps = frameCount;
      frameCount = 0;
      lastFpsTime = now;

      // Auto adjust quality
      if (PERF_CONFIG.autoQuality) {
        if (currentFps < 20 && qualityLevel !== 'low') {
          setQuality('low');
        } else if (currentFps < 35 && qualityLevel === 'high') {
          setQuality('medium');
        } else if (currentFps > 50 && qualityLevel === 'low') {
          setQuality('medium');
        }
      }

      // Update FPS display
      const fpsEl = document.getElementById('fps-counter');
      if (fpsEl) {
        fpsEl.textContent = `FPS: ${currentFps}`;
        fpsEl.style.color = currentFps > 40 ? '#00ff44' : currentFps > 25 ? '#ffaa00' : '#ff4444';
      }
    }
  }

  function setQuality(level) {
    qualityLevel = level;
    console.log(`🎮 Quality set to: ${level}`);

    switch (level) {
      case 'low':
        PERF_CONFIG.drawDistance = 50;
        PERF_CONFIG.maxVisibleTrees = 80;
        PERF_CONFIG.maxVisibleRocks = 20;
        PERF_CONFIG.maxVisibleFog = 5;
        PERF_CONFIG.shadowMapSize = 256;
        PERF_CONFIG.maxPixelRatio = 0.75;
        PERF_CONFIG.maxActiveLights = 4;
        PERF_CONFIG.smallObjectShadows = false;
        break;

      case 'medium':
        PERF_CONFIG.drawDistance = 80;
        PERF_CONFIG.maxVisibleTrees = 150;
        PERF_CONFIG.maxVisibleRocks = 40;
        PERF_CONFIG.maxVisibleFog = 15;
        PERF_CONFIG.shadowMapSize = 512;
        PERF_CONFIG.maxPixelRatio = 1;
        PERF_CONFIG.maxActiveLights = 8;
        PERF_CONFIG.smallObjectShadows = false;
        break;

      case 'high':
        PERF_CONFIG.drawDistance = 120;
        PERF_CONFIG.maxVisibleTrees = 300;
        PERF_CONFIG.maxVisibleRocks = 80;
        PERF_CONFIG.maxVisibleFog = 30;
        PERF_CONFIG.shadowMapSize = 1024;
        PERF_CONFIG.maxPixelRatio = 1.5;
        PERF_CONFIG.maxActiveLights = 16;
        PERF_CONFIG.smallObjectShadows = true;
        break;
    }

    applyRendererSettings();
  }

  // ==========================================
  // Apply renderer optimizations
  // ==========================================
  function applyRendererSettings() {
    if (!window.game || !window.game.renderer) return;

    const renderer = window.game.renderer;

    // Reduce pixel ratio
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, PERF_CONFIG.maxPixelRatio));

    // Optimize shadow maps
    if (renderer.shadowMap) {
      renderer.shadowMap.autoUpdate = false;
      renderer.shadowMap.needsUpdate = true;
    }

    // Reduce tone mapping exposure for performance
    renderer.powerPreference = 'high-performance';
  }

  // ==========================================
  // Distance-based visibility culling
  // ==========================================
  let lastCullTime = 0;

  function cullObjects(camera) {
    const now = Date.now();
    if (now - lastCullTime < PERF_CONFIG.cullInterval) return;
    lastCullTime = now;

    if (!window.game || !window.game.forest) return;

    const camPos = camera.position;
    const drawDist = PERF_CONFIG.drawDistance;
    const drawDistSq = drawDist * drawDist;

    // Cull trees
    const forest = window.game.forest;
    if (forest.trees && forest.trees.length > 0) {
      let visibleTrees = 0;

      for (let i = 0; i < forest.trees.length; i++) {
        const tree = forest.trees[i];
        if (!tree) continue;

        const dx = tree.position.x - camPos.x;
        const dz = tree.position.z - camPos.z;
        const distSq = dx * dx + dz * dz;

        if (distSq < drawDistSq && visibleTrees < PERF_CONFIG.maxVisibleTrees) {
          if (!tree.visible) tree.visible = true;
          visibleTrees++;

          // Reduce detail for distant trees
          if (distSq > (drawDist * 0.6) * (drawDist * 0.6)) {
            tree.traverse(function (child) {
              if (child.castShadow) child.castShadow = false;
            });
          }
        } else {
          if (tree.visible) tree.visible = false;
        }
      }
    }

    // Cull rocks
    if (forest.rocks && forest.rocks.length > 0) {
      let visibleRocks = 0;

      for (let i = 0; i < forest.rocks.length; i++) {
        const rock = forest.rocks[i];
        if (!rock) continue;

        const dx = rock.position.x - camPos.x;
        const dz = rock.position.z - camPos.z;
        const distSq = dx * dx + dz * dz;

        if (distSq < drawDistSq && visibleRocks < PERF_CONFIG.maxVisibleRocks) {
          if (!rock.visible) rock.visible = true;
          visibleRocks++;
          rock.castShadow = PERF_CONFIG.smallObjectShadows;
        } else {
          if (rock.visible) rock.visible = false;
        }
      }
    }

    // Cull fog particles
    if (forest.fogParticles && forest.fogParticles.length > 0) {
      let visibleFog = 0;

      for (let i = 0; i < forest.fogParticles.length; i++) {
        const fog = forest.fogParticles[i];
        if (!fog) continue;

        const dx = fog.position.x - camPos.x;
        const dz = fog.position.z - camPos.z;
        const distSq = dx * dx + dz * dz;

        if (distSq < drawDistSq * 0.5 && visibleFog < PERF_CONFIG.maxVisibleFog) {
          if (!fog.visible) fog.visible = true;
          visibleFog++;
        } else {
          if (fog.visible) fog.visible = false;
        }
      }
    }

    // Cull item meshes
    if (forest.itemMeshes) {
      forest.itemMeshes.forEach(function (mesh) {
        const dx = mesh.position.x - camPos.x;
        const dz = mesh.position.z - camPos.z;
        const distSq = dx * dx + dz * dz;

        mesh.visible = distSq < drawDistSq;

        // Disable item lights when far
        mesh.children.forEach(function (child) {
          if (child.isPointLight) {
            child.visible = distSq < (drawDist * 0.3) * (drawDist * 0.3);
          }
        });
      });
    }

    // Update shadow map occasionally
    if (window.game.renderer && window.game.renderer.shadowMap) {
      window.game.renderer.shadowMap.needsUpdate = true;
    }
  }

  // ==========================================
  // Optimize lights
  // ==========================================
  function optimizeLights(scene, camera) {
    if (!scene || !camera) return;

    const camPos = camera.position;
    let activeLights = 0;
    const maxLights = PERF_CONFIG.maxActiveLights;
    const lightDistSq = (PERF_CONFIG.drawDistance * 0.5) * (PERF_CONFIG.drawDistance * 0.5);

    scene.traverse(function (obj) {
      if (obj.isPointLight || obj.isSpotLight) {
        // Skip the main sun/moon light
        if (obj.isDirectionalLight) return;

        const dx = obj.position.x - camPos.x;
        const dy = obj.position.y - camPos.y;
        const dz = obj.position.z - camPos.z;

        // Use world position if it's a child
        let worldPos = obj.position;
        if (obj.parent && obj.parent !== scene) {
          worldPos = new THREE.Vector3();
          obj.getWorldPosition(worldPos);
          const wdx = worldPos.x - camPos.x;
          const wdz = worldPos.z - camPos.z;

          if (wdx * wdx + wdz * wdz > lightDistSq || activeLights >= maxLights) {
            obj.visible = false;
          } else {
            obj.visible = true;
            activeLights++;
          }
        } else {
          const distSq = dx * dx + dz * dz;
          if (distSq > lightDistSq || activeLights >= maxLights) {
            obj.visible = false;
          } else {
            obj.visible = true;
            activeLights++;
          }
        }
      }
    });
  }

  // ==========================================
  // Optimize shadows
  // ==========================================
  function optimizeShadows(scene) {
    if (!scene) return;

    scene.traverse(function (obj) {
      if (obj.isMesh) {
        // Disable shadows on very small objects
        if (!PERF_CONFIG.smallObjectShadows) {
          if (obj.geometry) {
            const size = obj.geometry.boundingSphere;
            if (size && size.radius < 0.5) {
              obj.castShadow = false;
            }
          }
        }
      }

      // Reduce shadow map on directional light
      if (obj.isDirectionalLight && obj.shadow) {
        if (obj.shadow.mapSize.width !== PERF_CONFIG.shadowMapSize) {
          obj.shadow.mapSize.width = PERF_CONFIG.shadowMapSize;
          obj.shadow.mapSize.height = PERF_CONFIG.shadowMapSize;

          if (obj.shadow.map) {
            obj.shadow.map.dispose();
            obj.shadow.map = null;
          }
        }

        // Reduce shadow camera range
        obj.shadow.camera.far = PERF_CONFIG.drawDistance;
        const halfDist = PERF_CONFIG.drawDistance * 0.5;
        obj.shadow.camera.left = -halfDist;
        obj.shadow.camera.right = halfDist;
        obj.shadow.camera.top = halfDist;
        obj.shadow.camera.bottom = -halfDist;
      }
    });
  }

  // ==========================================
  // Optimize weather (rain particles)
  // ==========================================
  function optimizeWeather() {
    if (!window.game || !window.game.weatherSystem) return;

    const ws = window.game.weatherSystem;

    if (ws.rainParticles && ws.rainParticles.geometry) {
      // Reduce visible rain in low quality
      if (qualityLevel === 'low') {
        ws.rainParticles.material.size = 0.05;
        // Only update every other frame
        ws.rainParticles.frustumCulled = true;
      }
    }
  }

  // ==========================================
  // Optimize monsters
  // ==========================================
  function optimizeMonsters(camera) {
    if (!window.game || !window.game.monsterManager) return;

    const camPos = camera.position;
    const maxDist = PERF_CONFIG.drawDistance;
    const maxDistSq = maxDist * maxDist;

    window.game.monsterManager.monsters.forEach(function (monster) {
      if (!monster.group) return;

      const dx = monster.group.position.x - camPos.x;
      const dz = monster.group.position.z - camPos.z;
      const distSq = dx * dx + dz * dz;

      monster.group.visible = distSq < maxDistSq;

      // Disable monster lights when far
      monster.group.children.forEach(function (child) {
        if (child.isPointLight) {
          child.visible = distSq < (maxDist * 0.4) * (maxDist * 0.4);
        }
      });
    });
  }

  // ==========================================
  // Optimize buildings
  // ==========================================
  function optimizeBuildings(camera) {
    if (!window.game || !window.game.buildSystem) return;

    const camPos = camera.position;
    const maxDistSq = PERF_CONFIG.drawDistance * PERF_CONFIG.drawDistance;

    window.game.buildSystem.buildings.forEach(function (mesh) {
      const dx = mesh.position.x - camPos.x;
      const dz = mesh.position.z - camPos.z;
      const distSq = dx * dx + dz * dz;

      mesh.visible = distSq < maxDistSq;

      mesh.children.forEach(function (child) {
        if (child.isPointLight) {
          child.visible = distSq < (PERF_CONFIG.drawDistance * 0.3) * (PERF_CONFIG.drawDistance * 0.3);
        }
      });
    });
  }

  // ==========================================
  // Optimize campfires
  // ==========================================
  function optimizeCampfires(camera) {
    if (!window.game || !window.game.campfireManager) return;

    const camPos = camera.position;
    const maxDistSq = PERF_CONFIG.drawDistance * PERF_CONFIG.drawDistance;

    window.game.campfireManager.campfires.forEach(function (cf) {
      if (!cf.group) return;

      const dx = cf.group.position.x - camPos.x;
      const dz = cf.group.position.z - camPos.z;
      const distSq = dx * dx + dz * dz;

      cf.group.visible = distSq < maxDistSq;

      // Disable fire light when far
      if (cf.fireLight) {
        cf.fireLight.visible = distSq < (PERF_CONFIG.drawDistance * 0.4) * (PERF_CONFIG.drawDistance * 0.4);
      }

      // Hide fire particles when far
      cf.fireParticles.forEach(function (p) {
        p.visible = distSq < (PERF_CONFIG.drawDistance * 0.3) * (PERF_CONFIG.drawDistance * 0.3);
      });
    });
  }

  // ==========================================
  // Reduce geometry on scene load
  // ==========================================
  function reduceGeometry(scene) {
    if (!scene) return;

    let meshCount = 0;
    let lightCount = 0;

    scene.traverse(function (obj) {
      if (obj.isMesh) {
        meshCount++;

        // Enable frustum culling on all meshes
        obj.frustumCulled = true;

        // Disable matrix auto update for static objects
        if (obj.userData && !obj.userData.dynamic) {
          obj.matrixAutoUpdate = false;
          obj.updateMatrix();
        }
      }

      if (obj.isLight) lightCount++;
    });

    console.log(`🎮 Scene: ${meshCount} meshes, ${lightCount} lights`);
  }

  // ==========================================
  // Optimize the render loop
  // ==========================================
  function patchRenderLoop() {
    if (!window.game) return;

    // Store original animate
    const originalAnimate = window.game.animate.bind(window.game);

    // Optimization frame counter
    let optimizeFrame = 0;

    window.game.animate = function () {
      if (!this.isRunning) return;

      requestAnimationFrame(function () { window.game.animate(); });

      // Measure FPS
      measureFps();

      const delta = Math.min(this.clock.getDelta(), 0.1);

      // Run culling every few frames (not every frame)
      optimizeFrame++;
      if (optimizeFrame % 3 === 0) {
        cullObjects(this.camera);
        optimizeMonsters(this.camera);
        optimizeCampfires(this.camera);
        optimizeBuildings(this.camera);
      }

      if (optimizeFrame % 10 === 0) {
        optimizeLights(this.scene, this.camera);
      }

      // Run normal game logic
      if (this.localPlayer && this.localPlayer.isAlive) {
        this.localPlayer.updateLocal(this.controls, delta, this.forest);

        const now = Date.now();
        if (now - this.lastMovementUpdate > PERF_CONFIG.networkSendRate) {
          this.networkManager.sendMovement(
            this.localPlayer.getPosition(),
            { y: this.controls.getYaw() },
            this.localPlayer.animationState,
            this.controls.isRunning
          );
          this.lastMovementUpdate = now;
        }

        if (this.controls.isRunning && this.playerData && this.playerData.stamina <= 0) {
          this.controls.isRunning = false;
        }

        if (this.localPlayer.animationState !== 'idle') {
          this.footstepTimer += delta;
          var interval = this.localPlayer.animationState === 'running' ? 0.3 : 0.5;
          if (this.footstepTimer >= interval) {
            this.audioManager.playFootstep();
            this.footstepTimer = 0;
          }
        }

        var pos = this.localPlayer.getPosition();
        var nearbyItem = this.forest.getNearbyItem(pos, 4);
        if (nearbyItem) {
          this.uiManager.showInteraction('pick up ' + nearbyItem.name);
        } else {
          this.uiManager.hideInteraction();
        }

        this.damageCheckTimer += delta;
        if (this.damageCheckTimer >= 1) {
          this.damageCheckTimer = 0;
          this.checkMonsterDamage();
        }

        // Update minimap less frequently
        if (optimizeFrame % 5 === 0) {
          var otherPlayersData = [];
          this.remotePlayers.forEach(function (p) {
            otherPlayersData.push({
              position: p.group ? p.group.position : { x: 0, z: 0 },
              isAlive: p.isAlive
            });
          });
          this.minimap.update(pos, otherPlayersData, this.gameState.monsterPositions, this.forest.campfirePositions);
        }
      }

      // Update systems (skip some frames for performance)
      if (optimizeFrame % 2 === 0) {
        this.forest.update(delta, this.gameState.timeOfDay);
      }
      if (optimizeFrame % 3 === 0) {
        this.weatherSystem.update(delta, this.camera.position);
        this.campfireManager.update(delta);
      }

      // Render
      this.renderer.render(this.scene, this.camera);
    };
  }

  // ==========================================
  // Add FPS counter and quality buttons to UI
  // ==========================================
  function addPerformanceUI() {
    const container = document.createElement('div');
    container.id = 'perf-ui';
    container.style.cssText = 'position:fixed;bottom:5px;left:5px;z-index:999;font-size:11px;color:#888;pointer-events:auto;';

    container.innerHTML =
      '<div id="fps-counter" style="color:#00ff44;margin-bottom:3px;">FPS: --</div>' +
      '<div style="display:flex;gap:3px;">' +
      '<button onclick="setGameQuality(\'low\')" style="padding:2px 6px;background:#222;border:1px solid #444;color:#fff;cursor:pointer;font-size:10px;border-radius:2px;">LOW</button>' +
      '<button onclick="setGameQuality(\'medium\')" style="padding:2px 6px;background:#222;border:1px solid #00ff44;color:#00ff44;cursor:pointer;font-size:10px;border-radius:2px;">MED</button>' +
      '<button onclick="setGameQuality(\'high\')" style="padding:2px 6px;background:#222;border:1px solid #444;color:#fff;cursor:pointer;font-size:10px;border-radius:2px;">HIGH</button>' +
      '</div>';

    document.body.appendChild(container);

    // Global function for buttons
    window.setGameQuality = function (level) {
      setQuality(level);

      // Update button styles
      var buttons = container.querySelectorAll('button');
      buttons.forEach(function (btn) {
        btn.style.borderColor = '#444';
        btn.style.color = '#fff';
      });
      var idx = level === 'low' ? 0 : level === 'medium' ? 1 : 2;
      buttons[idx].style.borderColor = '#00ff44';
      buttons[idx].style.color = '#00ff44';
    };
  }

  // ==========================================
  // Main initialization
  // ==========================================
  function initPerformanceManager() {
    console.log('🚀 Performance Manager loading...');

    // Wait for game to be ready
    var checkInterval = setInterval(function () {
      if (window.game && window.game.isRunning && window.game.scene) {
        clearInterval(checkInterval);

        console.log('🚀 Performance Manager active!');

        // Apply initial optimizations
        applyRendererSettings();
        optimizeShadows(window.game.scene);
        reduceGeometry(window.game.scene);
        optimizeWeather();

        // Patch the render loop
        patchRenderLoop();

        // Add UI
        addPerformanceUI();

        // Set default quality based on device
        var isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
        var isLowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;

        if (isMobile) {
          setQuality('low');
          window.setGameQuality('low');
        } else if (isLowEnd) {
          setQuality('low');
          window.setGameQuality('low');
        } else {
          setQuality('medium');
        }

        console.log('🎮 Device cores:', navigator.hardwareConcurrency || 'unknown');
        console.log('🎮 Mobile:', isMobile);
        console.log('🎮 Quality:', qualityLevel);
      }
    }, 500);
  }

  // ==========================================
  // Start when page loads
  // ==========================================
  if (document.readyState === 'complete') {
    initPerformanceManager();
  } else {
    window.addEventListener('load', initPerformanceManager);
  }

})();