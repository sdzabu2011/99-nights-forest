class Forest {
  constructor(scene) {
    this.scene = scene;
    this.trees = [];
    this.rocks = [];
    this.ground = null;
    this.colliders = [];

    // Textures
    this.groundTexture = Helpers.createGroundTexture();
    this.groundTexture.wrapS = THREE.RepeatWrapping;
    this.groundTexture.wrapT = THREE.RepeatWrapping;
    this.groundTexture.repeat.set(20, 20);

    this.barkTexture = Helpers.createBarkTexture();
    this.leavesTexture = Helpers.createLeavesTexture();
    this.rockTexture = Helpers.createRockTexture();
  }

  buildWorld(worldData) {
    this.createGround(worldData.worldSize);
    this.createTrees(worldData.trees);
    this.createRocks(worldData.rocks);
    this.createStructures(worldData.structures);
    this.createCampfires(worldData.campfires);
    this.createItems(worldData.items);
    this.addAtmosphericDetails();
  }

  createGround(worldSize) {
    const groundGeo = new THREE.PlaneGeometry(worldSize * 2, worldSize * 2, 64, 64);

    // Add some height variation
    const vertices = groundGeo.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      vertices[i + 2] += (Math.random() - 0.5) * 0.5; // Subtle height variation
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      map: this.groundTexture,
      roughness: 0.9,
      metalness: 0.0,
      color: 0x2a3a1a
    });

    this.ground = new THREE.Mesh(groundGeo, groundMat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
  }

  createTrees(treesData) {
    treesData.forEach(treeData => {
      const tree = this.createTree(treeData);
      this.trees.push(tree);
      this.scene.add(tree);

      // Add collider
      this.colliders.push({
        position: { x: treeData.position.x, z: treeData.position.z },
        radius: 0.8
      });
    });
  }

  createTree(data) {
    const group = new THREE.Group();
    const scale = data.scale || 1;

    if (data.type === 'pine') {
      // Pine tree trunk
      const trunkGeo = new THREE.CylinderGeometry(0.2 * scale, 0.35 * scale, 6 * scale, 8);
      const trunkMat = new THREE.MeshStandardMaterial({
        map: this.barkTexture,
        color: 0x4a3520,
        roughness: 0.9
      });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 3 * scale;
      trunk.castShadow = true;
      group.add(trunk);

      // Pine tree foliage (multiple cones)
      const foliageMat = new THREE.MeshStandardMaterial({
        map: this.leavesTexture,
        color: 0x0a4a0a,
        roughness: 0.8
      });

      for (let i = 0; i < 4; i++) {
        const fSize = (4 - i) * 0.6 * scale;
        const fHeight = (2.5 + i * 1.5) * scale;
        const coneGeo = new THREE.ConeGeometry(fSize, 2.5 * scale, 8);
        const cone = new THREE.Mesh(coneGeo, foliageMat);
        cone.position.y = fHeight;
        cone.castShadow = true;
        group.add(cone);
      }
    } else {
      // Oak tree trunk
      const trunkGeo = new THREE.CylinderGeometry(0.3 * scale, 0.5 * scale, 4 * scale, 8);
      const trunkMat = new THREE.MeshStandardMaterial({
        map: this.barkTexture,
        color: 0x3a2510,
        roughness: 0.9
      });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 2 * scale;
      trunk.castShadow = true;
      group.add(trunk);

      // Oak foliage (spheres)
      const foliageMat = new THREE.MeshStandardMaterial({
        map: this.leavesTexture,
        color: 0x1a5a1a,
        roughness: 0.8
      });

      const foliageGeo = new THREE.SphereGeometry(2.5 * scale, 8, 8);
      const foliage = new THREE.Mesh(foliageGeo, foliageMat);
      foliage.position.y = 5.5 * scale;
      foliage.castShadow = true;
      group.add(foliage);

      // Extra foliage spheres
      for (let i = 0; i < 3; i++) {
        const extraGeo = new THREE.SphereGeometry(1.5 * scale, 6, 6);
        const extra = new THREE.Mesh(extraGeo, foliageMat);
        const angle = (i / 3) * Math.PI * 2;
        extra.position.set(
          Math.cos(angle) * 1.5 * scale,
          4.5 * scale + Math.random() * scale,
          Math.sin(angle) * 1.5 * scale
        );
        extra.castShadow = true;
        group.add(extra);
      }
    }

    group.position.set(data.position.x, 0, data.position.z);
    group.rotation.y = data.rotation || 0;

    return group;
  }

  createRocks(rocksData) {
    rocksData.forEach(rockData => {
      const rock = this.createRock(rockData);
      this.rocks.push(rock);
      this.scene.add(rock);

      if (rockData.scale > 0.8) {
        this.colliders.push({
          position: { x: rockData.position.x, z: rockData.position.z },
          radius: rockData.scale
        });
      }
    });
  }

  createRock(data) {
    const scale = data.scale || 1;
    let geo;

    if (data.type === 'boulder') {
      geo = new THREE.DodecahedronGeometry(scale, 1);
    } else {
      geo = new THREE.OctahedronGeometry(scale * 0.7, 0);
    }

    // Deform vertices for natural look
    const vertices = geo.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      vertices[i] += (Math.random() - 0.5) * scale * 0.3;
      vertices[i + 1] += (Math.random() - 0.5) * scale * 0.2;
      vertices[i + 2] += (Math.random() - 0.5) * scale * 0.3;
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      map: this.rockTexture,
      color: 0x666666,
      roughness: 0.9,
      metalness: 0.1
    });

    const rock = new THREE.Mesh(geo, mat);
    rock.position.set(data.position.x, scale * 0.3, data.position.z);
    rock.rotation.set(
      Math.random() * 0.3,
      data.rotation || 0,
      Math.random() * 0.3
    );
    rock.castShadow = true;
    rock.receiveShadow = true;

    return rock;
  }

  createStructures(structuresData) {
    structuresData.forEach(structure => {
      const mesh = this.createStructure(structure);
      this.scene.add(mesh);

      this.colliders.push({
        position: { x: structure.position.x, z: structure.position.z },
        radius: 4
      });
    });
  }

  createStructure(data) {
    const group = new THREE.Group();

    switch (data.type) {
      case 'cabin':
        this.buildCabin(group);
        break;
      case 'ruins':
        this.buildRuins(group);
        break;
      case 'tent':
        this.buildTent(group);
        break;
      case 'watchtower':
        this.buildWatchtower(group);
        break;
      case 'cave_entrance':
        this.buildCaveEntrance(group);
        break;
    }

    group.position.set(data.position.x, 0, data.position.z);
    group.rotation.y = data.rotation || 0;

    return group;
  }

  buildCabin(group) {
    // Cabin walls
    const wallMat = new THREE.MeshStandardMaterial({
      map: this.barkTexture,
      color: 0x5a4030,
      roughness: 0.9
    });

    // Base
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(6, 3, 5),
      wallMat
    );
    base.position.y = 1.5;
    base.castShadow = true;
    group.add(base);

    // Roof
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x3a2a1a,
      roughness: 0.8
    });
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(5, 2, 4),
      roofMat
    );
    roof.position.y = 4;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(roof);

    // Door
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a });
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 2, 0.1),
      doorMat
    );
    door.position.set(0, 1, 2.55);
    group.add(door);
  }

  buildRuins(group) {
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.95
    });

    // Broken walls
    for (let i = 0; i < 4; i++) {
      const height = 1 + Math.random() * 2;
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(4, height, 0.3),
        wallMat
      );
      const angle = (i / 4) * Math.PI * 2;
      wall.position.set(
        Math.cos(angle) * 3,
        height / 2,
        Math.sin(angle) * 3
      );
      wall.rotation.y = angle;
      wall.castShadow = true;
      group.add(wall);
    }
  }

  buildTent(group) {
    const tentMat = new THREE.MeshStandardMaterial({
      color: 0x4a6a3a,
      roughness: 0.7,
      side: THREE.DoubleSide
    });

    const tentGeo = new THREE.ConeGeometry(2.5, 2.5, 4);
    const tent = new THREE.Mesh(tentGeo, tentMat);
    tent.position.y = 1.25;
    tent.rotation.y = Math.PI / 4;
    tent.castShadow = true;
    group.add(tent);
  }

  buildWatchtower(group) {
    const woodMat = new THREE.MeshStandardMaterial({
      map: this.barkTexture,
      color: 0x5a4030,
      roughness: 0.9
    });

    // Legs
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.2, 8, 6),
        woodMat
      );
      leg.position.set(
        Math.cos(angle) * 2,
        4,
        Math.sin(angle) * 2
      );
      leg.castShadow = true;
      group.add(leg);
    }

    // Platform
    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(5, 0.3, 5),
      woodMat
    );
    platform.position.y = 7;
    platform.castShadow = true;
    group.add(platform);

    // Railing
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x4a3520,
      roughness: 0.9
    });

    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(5, 1, 0.1),
        railMat
      );
      rail.position.set(
        Math.cos(angle) * 2.5 * (i % 2 === 0 ? 1 : 0),
        7.7,
        Math.sin(angle) * 2.5 * (i % 2 === 0 ? 0 : 1)
      );
      rail.rotation.y = i % 2 === 0 ? 0 : Math.PI / 2;
      group.add(rail);
    }
  }

  buildCaveEntrance(group) {
    const rockMat = new THREE.MeshStandardMaterial({
      map: this.rockTexture,
      color: 0x444444,
      roughness: 0.95
    });

    // Cave arch
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI;
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1 + Math.random() * 0.5, 0),
        rockMat
      );
      rock.position.set(
        Math.cos(angle) * 3,
        Math.sin(angle) * 3,
        0
      );
      rock.castShadow = true;
      group.add(rock);
    }

    // Dark interior
    const darkMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const interior = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 4),
      darkMat
    );
    interior.position.z = -0.5;
    interior.position.y = 2;
    group.add(interior);
  }

  createCampfires(campfiresData) {
    // Campfires will be handled by the Campfire class
    this.campfirePositions = campfiresData;
  }

  createItems(itemsData) {
    this.itemMeshes = new Map();

    itemsData.forEach(item => {
      this.addItemMesh(item);
    });
  }

  addItemMesh(item) {
    const geo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const mat = new THREE.MeshStandardMaterial({
      color: this.getItemColor(item.type),
      emissive: this.getItemColor(item.type),
      emissiveIntensity: 0.3,
      roughness: 0.5
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(item.position.x, item.position.y, item.position.z);
    mesh.userData = { itemId: item.id, type: item.type, name: item.name };

    // Add glow
    const glowGeo = new THREE.SphereGeometry(0.6, 8, 8);
    const glowMat = new THREE.MeshBasicMaterial({
      color: this.getItemColor(item.type),
      transparent: true,
      opacity: 0.15
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    mesh.add(glow);

    this.scene.add(mesh);
    this.itemMeshes.set(item.id, mesh);
  }

  removeItemMesh(itemId) {
    const mesh = this.itemMeshes.get(itemId);
    if (mesh) {
      this.scene.remove(mesh);
      this.itemMeshes.delete(itemId);
    }
  }

  getItemColor(type) {
    const colors = {
      medkit: 0xff0000,
      food: 0xff8800,
      energy_drink: 0xffff00,
      sanity_pill: 0x8800ff,
      flare: 0xff4400,
      battery: 0x00ff00,
      wood: 0x884400,
      key: 0xffdd00
    };
    return colors[type] || 0xffffff;
  }

  addAtmosphericDetails() {
    // Ground fog particles
    this.fogParticles = [];
    const fogGeo = new THREE.PlaneGeometry(5, 5);
    const fogMat = new THREE.MeshBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    for (let i = 0; i < 50; i++) {
      const fog = new THREE.Mesh(fogGeo, fogMat.clone());
      fog.position.set(
        (Math.random() - 0.5) * 150,
        0.5 + Math.random() * 2,
        (Math.random() - 0.5) * 150
      );
      fog.rotation.x = -Math.PI / 2;
      fog.rotation.z = Math.random() * Math.PI;
      fog.userData.speed = 0.1 + Math.random() * 0.3;
      fog.userData.originalX = fog.position.x;
      this.fogParticles.push(fog);
      this.scene.add(fog);
    }
  }

  update(delta, timeOfDay) {
    // Animate items (bob up and down, rotate)
    const time = Date.now() * 0.001;
    this.itemMeshes.forEach((mesh) => {
      mesh.position.y = mesh.userData.baseY || 0.5 + Math.sin(time * 2 + mesh.position.x) * 0.2;
      mesh.rotation.y += delta * 2;
    });

    // Animate fog
    if (this.fogParticles) {
      this.fogParticles.forEach(fog => {
        fog.position.x = fog.userData.originalX + Math.sin(time * fog.userData.speed) * 5;
        fog.material.opacity = timeOfDay > 0.75 || timeOfDay < 0.25 ? 0.15 : 0.05;
      });
    }
  }

  checkCollision(position, radius) {
    for (const collider of this.colliders) {
      const dx = position.x - collider.position.x;
      const dz = position.z - collider.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < radius + collider.radius) {
        return true;
      }
    }
    return false;
  }

  getNearbyItem(position, range) {
    let nearest = null;
    let nearestDist = range;

    this.itemMeshes.forEach((mesh, itemId) => {
      const dist = Helpers.distance2D(position, mesh.position);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = { itemId, ...mesh.userData, distance: dist };
      }
    });

    return nearest;
  }
}