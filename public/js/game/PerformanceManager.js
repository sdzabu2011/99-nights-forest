(function () {

  function fix() {
    if (!window.game || !window.game.scene || !window.game.isRunning) return;

    var g = window.game;
    var scene = g.scene;
    var renderer = g.renderer;

    console.log('🔧 BALANCED PERFORMANCE FIX...');

    // ==============================
    // 1. REDUCE PIXEL RATIO (biggest FPS gain)
    // ==============================
    renderer.setPixelRatio(1);

    // ==============================
    // 2. RENDER AT 80% RESOLUTION
    // ==============================
    var scale = 0.8;
    var w = Math.floor(window.innerWidth * scale);
    var h = Math.floor(window.innerHeight * scale);
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    var origResize = g.onResize.bind(g);
    g.onResize = function () {
      g.camera.aspect = window.innerWidth / window.innerHeight;
      g.camera.updateProjectionMatrix();
      renderer.setSize(
        Math.floor(window.innerWidth * scale),
        Math.floor(window.innerHeight * scale),
        false
      );
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
    };

    // ==============================
    // 3. DISABLE SHADOWS (huge FPS gain)
    // ==============================
    renderer.shadowMap.enabled = false;
    scene.traverse(function (obj) {
      if (obj.castShadow) obj.castShadow = false;
      if (obj.receiveShadow) obj.receiveShadow = false;
    });

    // ==============================
    // 4. KEEP 300 TREES (looks like forest)
    // ==============================
    if (g.forest && g.forest.trees) {
      var trees = g.forest.trees;
      var keep = Math.min(trees.length, 300);

      if (trees.length > keep) {
        // Keep nearest trees
        var camX = g.camera.position.x || 0;
        var camZ = g.camera.position.z || 0;

        trees.sort(function (a, b) {
          var da = (a.position.x - camX) * (a.position.x - camX) +
                   (a.position.z - camZ) * (a.position.z - camZ);
          var db = (b.position.x - camX) * (b.position.x - camX) +
                   (b.position.z - camZ) * (b.position.z - camZ);
          return da - db;
        });

        for (var i = trees.length - 1; i >= keep; i--) {
          scene.remove(trees[i]);
          trees[i].traverse(function (child) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
              if (child.material.map) child.material.map.dispose();
              child.material.dispose();
            }
          });
        }

        g.forest.trees = trees.slice(0, keep);
      }
      console.log('🌲 Trees: ' + g.forest.trees.length);
    }

    // ==============================
    // 5. KEEP 50 ROCKS
    // ==============================
    if (g.forest && g.forest.rocks) {
      var rocks = g.forest.rocks;
      var keepR = Math.min(rocks.length, 50);

      for (var i = rocks.length - 1; i >= keepR; i--) {
        scene.remove(rocks[i]);
        rocks[i].traverse(function (child) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
      }
      g.forest.rocks = rocks.slice(0, keepR);
      console.log('🪨 Rocks: ' + g.forest.rocks.length);
    }

    // ==============================
    // 6. REDUCE FOG PARTICLES TO 10
    // ==============================
    if (g.forest && g.forest.fogParticles) {
      var fogP = g.forest.fogParticles;
      for (var i = fogP.length - 1; i >= 10; i--) {
        scene.remove(fogP[i]);
        if (fogP[i].geometry) fogP[i].geometry.dispose();
        if (fogP[i].material) fogP[i].material.dispose();
      }
      g.forest.fogParticles = fogP.slice(0, 10);
    }

    // ==============================
    // 7. REMOVE ITEM POINT LIGHTS (keep glow mesh)
    // ==============================
    if (g.forest && g.forest.itemMeshes) {
      g.forest.itemMeshes.forEach(function (mesh) {
        var rem = [];
        mesh.children.forEach(function (child) {
          if (child.isPointLight) rem.push(child);
        });
        rem.forEach(function (child) { mesh.remove(child); });
      });
    }

    // ==============================
    // 8. REDUCE RAIN PARTICLES
    // ==============================
    if (g.weatherSystem && g.weatherSystem.rainParticles) {
      // Just reduce count by making most invisible
      g.weatherSystem.rainCount = 500;
    }

    // ==============================
    // 9. REMOVE STARS
    // ==============================
    if (g.dayNightCycle && g.dayNightCycle.stars) {
      scene.remove(g.dayNightCycle.stars);
      g.dayNightCycle.stars = { material: { opacity: 0 } };
    }

    // ==============================
    // 10. REMOVE MONSTER POINT LIGHTS
    // ==============================
    if (g.monsterManager) {
      g.monsterManager.monsters.forEach(function (monster) {
        var rem = [];
        monster.group.children.forEach(function (child) {
          if (child.isPointLight) rem.push(child);
        });
        rem.forEach(function (child) { monster.group.remove(child); });
      });

      // Patch future monsters
      var origCreate = g.monsterManager.createMonster.bind(g.monsterManager);
      g.monsterManager.createMonster = function (data) {
        origCreate(data);
        var m = this.monsters.get(data.id);
        if (m) {
          var rem = [];
          m.group.children.forEach(function (c) { if (c.isPointLight) rem.push(c); });
          rem.forEach(function (c) { m.group.remove(c); });
        }
      };
    }

    // ==============================
    // 11. SIMPLIFY CAMPFIRE PARTICLES
    // ==============================
    if (g.campfireManager) {
      g.campfireManager.campfires.forEach(function (cf) {
        // Keep 2 fire particles, remove rest
        while (cf.fireParticles.length > 2) {
          var p = cf.fireParticles.pop();
          cf.group.remove(p);
          if (p.geometry) p.geometry.dispose();
          if (p.material) p.material.dispose();
        }
      });
    }

    // ==============================
    // 12. ADD BETTER GROUND COLOR
    // ==============================
    if (g.forest && g.forest.ground) {
      g.forest.ground.material.color.setHex(0x1a3010);
    }

    // ==============================
    // 13. ADD GRASS PATCHES (lightweight)
    // ==============================
    addGrassPatches(scene);

    // ==============================
    // 14. ADD BUSHES (lightweight)
    // ==============================
    addBushes(scene);

    // ==============================
    // 15. BETTER FOG
    // ==============================
    scene.fog = new THREE.FogExp2(0x0a1a0a, 0.012);

    // ==============================
    // 16. SPAWN DEER
    // ==============================
    g.wildlife = new Wildlife(scene);
    g.wildlife.spawnInitialAnimals();

    // ==============================
    // 17. PATCH ANIMATE TO UPDATE DEER
    // ==============================
    var origAnimate = g.animate.bind(g);
    var frameCount = 0;

    g.animate = function () {
      if (!this.isRunning) return;
      requestAnimationFrame(function () { g.animate(); });

      var delta = Math.min(this.clock.getDelta(), 0.1);
      frameCount++;

      // Normal game updates
      if (this.localPlayer && this.localPlayer.isAlive) {
        this.localPlayer.updateLocal(this.controls, delta, this.forest);

        var now = Date.now();
        if (now - this.lastMovementUpdate > 80) {
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

        // Update minimap (throttled)
        if (frameCount % 8 === 0) {
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

      // Update systems (throttled)
      if (frameCount % 3 === 0) {
        this.forest.update(delta, this.gameState.timeOfDay);
      }
      if (frameCount % 4 === 0) {
        this.campfireManager.update(delta);
      }

      // Update deer (throttled)
      if (frameCount % 2 === 0 && g.wildlife) {
        var pPos = this.localPlayer ? this.localPlayer.getPosition() : null;
        g.wildlife.update(delta * 2, pPos, this.gameState.monsterPositions);
      }

      // DISTANCE CULLING (throttled)
      if (frameCount % 5 === 0) {
        distanceCull(this.camera, this.forest, g.wildlife);
      }

      // Render
      this.renderer.render(this.scene, this.camera);
    };

    // ==============================
    // 18. REDUCE COLLIDERS
    // ==============================
    if (g.forest && g.forest.colliders && g.forest.colliders.length > 300) {
      g.forest.colliders = g.forest.colliders.slice(0, 300);
    }

    // ==============================
    // FPS COUNTER
    // ==============================
    var fpsDiv = document.createElement('div');
    fpsDiv.style.cssText = 'position:fixed;bottom:5px;left:5px;z-index:9999;color:#00ff44;font-size:12px;font-family:monospace;background:rgba(0,0,0,0.5);padding:3px 8px;border-radius:3px;pointer-events:none;';
    document.body.appendChild(fpsDiv);

    var fpsFrames = 0;
    var fpsLast = performance.now();
    function countFps() {
      fpsFrames++;
      var now = performance.now();
      if (now - fpsLast >= 1000) {
        fpsDiv.textContent = 'FPS: ' + fpsFrames;
        fpsDiv.style.color = fpsFrames > 40 ? '#00ff44' : fpsFrames > 25 ? '#ffaa00' : '#ff4444';
        fpsFrames = 0;
        fpsLast = now;
      }
      requestAnimationFrame(countFps);
    }
    countFps();

    // ==============================
    // DONE
    // ==============================
    var meshes = 0;
    var lights = 0;
    scene.traverse(function (obj) {
      if (obj.isMesh) meshes++;
      if (obj.isLight) lights++;
    });
    console.log('✅ DONE: ' + meshes + ' meshes, ' + lights + ' lights');
  }

  // ==============================
  // DISTANCE CULLING
  // ==============================
  function distanceCull(camera, forest, wildlife) {
    if (!camera || !forest) return;

    var cx = camera.position.x;
    var cz = camera.position.z;
    var maxDist = 70;
    var maxDistSq = maxDist * maxDist;

    // Cull trees
    if (forest.trees) {
      for (var i = 0; i < forest.trees.length; i++) {
        var t = forest.trees[i];
        if (!t) continue;
        var dx = t.position.x - cx;
        var dz = t.position.z - cz;
        t.visible = (dx * dx + dz * dz) < maxDistSq;
      }
    }

    // Cull rocks
    if (forest.rocks) {
      for (var i = 0; i < forest.rocks.length; i++) {
        var r = forest.rocks[i];
        if (!r) continue;
        var dx = r.position.x - cx;
        var dz = r.position.z - cz;
        r.visible = (dx * dx + dz * dz) < maxDistSq;
      }
    }

    // Cull items
    if (forest.itemMeshes) {
      forest.itemMeshes.forEach(function (mesh) {
        var dx = mesh.position.x - cx;
        var dz = mesh.position.z - cz;
        mesh.visible = (dx * dx + dz * dz) < maxDistSq;
      });
    }

    // Cull deer
    if (wildlife && wildlife.animals) {
      for (var i = 0; i < wildlife.animals.length; i++) {
        var a = wildlife.animals[i];
        var dx = a.group.position.x - cx;
        var dz = a.group.position.z - cz;
        a.group.visible = (dx * dx + dz * dz) < maxDistSq;
      }
    }
  }

  // ==============================
  // ADD GRASS PATCHES (very lightweight)
  // ==============================
  function addGrassPatches(scene) {
    var grassMat = new THREE.MeshStandardMaterial({
      color: 0x2a5a1a,
      roughness: 0.9,
      side: THREE.DoubleSide
    });

    var darkGrassMat = new THREE.MeshStandardMaterial({
      color: 0x1a4010,
      roughness: 0.9,
      side: THREE.DoubleSide
    });

    for (var i = 0; i < 80; i++) {
      var angle = Math.random() * Math.PI * 2;
      var radius = 5 + Math.random() * 60;

      var mat = Math.random() > 0.5 ? grassMat : darkGrassMat;

      // Small grass blade group
      var group = new THREE.Group();

      for (var b = 0; b < 3; b++) {
        var blade = new THREE.Mesh(
          new THREE.PlaneGeometry(0.08, 0.2 + Math.random() * 0.15),
          mat
        );
        blade.position.set(
          (Math.random() - 0.5) * 0.2,
          0.1 + Math.random() * 0.05,
          (Math.random() - 0.5) * 0.2
        );
        blade.rotation.y = Math.random() * Math.PI;
        blade.rotation.x = -0.1 + Math.random() * 0.2;
        group.add(blade);
      }

      group.position.set(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      );

      scene.add(group);
    }

    console.log('🌿 Added 80 grass patches');
  }

  // ==============================
  // ADD BUSHES (lightweight)
  // ==============================
  function addBushes(scene) {
    var bushMats = [
      new THREE.MeshStandardMaterial({ color: 0x1a4a1a, roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ color: 0x2a5a2a, roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ color: 0x1a3a0a, roughness: 0.9 })
    ];

    for (var i = 0; i < 40; i++) {
      var angle = Math.random() * Math.PI * 2;
      var radius = 8 + Math.random() * 65;

      var mat = bushMats[Math.floor(Math.random() * bushMats.length)];
      var size = 0.3 + Math.random() * 0.5;

      var bush = new THREE.Mesh(
        new THREE.SphereGeometry(size, 5, 4),
        mat
      );

      // Squash it a bit
      bush.scale.y = 0.6 + Math.random() * 0.3;

      bush.position.set(
        Math.cos(angle) * radius,
        size * 0.4,
        Math.sin(angle) * radius
      );

      scene.add(bush);
    }

    console.log('🌳 Added 40 bushes');
  }

  // ==============================
  // WAIT FOR GAME THEN FIX
  // ==============================
  var attempts = 0;
  var checker = setInterval(function () {
    attempts++;
    if (attempts > 120) { clearInterval(checker); return; }

    if (window.game && window.game.isRunning && window.game.scene &&
        window.game.forest && window.game.forest.trees &&
        window.game.forest.trees.length > 0) {
      clearInterval(checker);
      setTimeout(fix, 2000);
    }
  }, 500);

})();