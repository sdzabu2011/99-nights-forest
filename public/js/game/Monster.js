class MonsterManager {
  constructor(scene) {
    this.scene = scene;
    this.monsters = new Map();
  }

  updateMonsters(monsterPositions) {
    // Track which monsters are still active
    const activeIds = new Set();

    monsterPositions.forEach(data => {
      activeIds.add(data.id);

      if (this.monsters.has(data.id)) {
        // Update existing monster
        this.updateMonster(data);
      } else {
        // Create new monster
        this.createMonster(data);
      }
    });

    // Remove monsters that are no longer active
    this.monsters.forEach((monster, id) => {
      if (!activeIds.has(id)) {
        this.removeMonster(id);
      }
    });
  }

  createMonster(data) {
    const group = new THREE.Group();
    let mesh;

    switch (data.type) {
      case 'wendigo':
        mesh = this.createWendigo();
        break;
      case 'shadow':
        mesh = this.createShadow();
        break;
      case 'crawler':
        mesh = this.createCrawler();
        break;
      case 'ghost':
        mesh = this.createGhost();
        break;
      default:
        mesh = this.createShadow();
    }

    group.add(mesh);

    // Add eyes glow
    const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({
      color: data.type === 'ghost' ? 0x44aaff : 0xff0000,
      emissive: data.type === 'ghost' ? 0x44aaff : 0xff0000
    });

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.15, data.type === 'crawler' ? 0.5 : 1.7, 0.3);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.15, data.type === 'crawler' ? 0.5 : 1.7, 0.3);
    group.add(rightEye);

    // Add point light for atmosphere
    const light = new THREE.PointLight(
      data.type === 'ghost' ? 0x4444ff : 0xff0000,
      0.5,
      8
    );
    light.position.y = 1;
    group.add(light);

    group.position.set(data.position.x, data.position.y || 0, data.position.z);

    this.scene.add(group);
    this.monsters.set(data.id, {
      group: group,
      type: data.type,
      state: data.state
    });
  }

  createWendigo() {
    const group = new THREE.Group();

    // Tall, thin body
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x2a1a1a,
      roughness: 0.9
    });

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 2, 0.3),
      bodyMat
    );
    body.position.y = 1.5;
    group.add(body);

    // Long arms
    const armGeo = new THREE.BoxGeometry(0.15, 1.5, 0.15);
    const leftArm = new THREE.Mesh(armGeo, bodyMat);
    leftArm.position.set(-0.4, 1.2, 0);
    leftArm.rotation.z = -0.3;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, bodyMat);
    rightArm.position.set(0.4, 1.2, 0);
    rightArm.rotation.z = 0.3;
    group.add(rightArm);

    // Antler-like protrusions
    const antlerMat = new THREE.MeshStandardMaterial({
      color: 0x4a3a2a,
      roughness: 0.8
    });

    for (let side = -1; side <= 1; side += 2) {
      const antler = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.05, 0.8, 4),
        antlerMat
      );
      antler.position.set(side * 0.2, 2.5, 0);
      antler.rotation.z = side * 0.4;
      group.add(antler);
    }

    // Head
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.5, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x3a2a2a })
    );
    head.position.y = 2.2;
    group.add(head);

    return group;
  }

  createShadow() {
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x050505,
      transparent: true,
      opacity: 0.7,
      roughness: 1
    });

    // Amorphous body
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 8, 8),
      bodyMat
    );
    body.position.y = 1;
    body.scale.set(1, 1.5, 0.8);
    group.add(body);

    // Tendrils
    for (let i = 0; i < 4; i++) {
      const tendril = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.15, 1.5, 4),
        bodyMat
      );
      const angle = (i / 4) * Math.PI * 2;
      tendril.position.set(
        Math.cos(angle) * 0.4,
        0.3,
        Math.sin(angle) * 0.4
      );
      tendril.rotation.z = (Math.random() - 0.5) * 0.5;
      group.add(tendril);
    }

    return group;
  }

  createCrawler() {
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x3a2a1a,
      roughness: 0.9
    });

    // Low body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.4, 1.2),
      bodyMat
    );
    body.position.y = 0.3;
    group.add(body);

    // Head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 6, 6),
      bodyMat
    );
    head.position.set(0, 0.4, 0.7);
    group.add(head);

    // Legs
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 3; i++) {
        const leg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 0.6, 4),
          bodyMat
        );
        leg.position.set(side * 0.5, 0.15, -0.3 + i * 0.4);
        leg.rotation.z = side * 0.5;
        group.add(leg);
      }
    }

    return group;
  }

  createGhost() {
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x8888cc,
      transparent: true,
      opacity: 0.4,
      roughness: 0.5,
      emissive: 0x222244,
      emissiveIntensity: 0.3
    });

    // Ethereal body
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.8, 2, 8),
      bodyMat
    );
    body.position.y = 1;
    group.add(body);

    // Head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 8, 8),
      bodyMat
    );
    head.position.y = 2.2;
    group.add(head);

    return group;
  }

  updateMonster(data) {
    const monster = this.monsters.get(data.id);
    if (!monster) return;

    // Smooth position update
    const targetPos = new THREE.Vector3(
      data.position.x,
      data.position.y || 0,
      data.position.z
    );
    monster.group.position.lerp(targetPos, 0.1);

    // Animate based on state
    const time = Date.now() * 0.003;

    if (data.type === 'ghost') {
      // Ghost floats
      monster.group.position.y += Math.sin(time) * 0.02;
      monster.group.children.forEach(child => {
        if (child.material && child.material.opacity !== undefined) {
          child.material.opacity = 0.3 + Math.sin(time * 2) * 0.15;
        }
      });
    }

    if (data.type === 'shadow') {
      // Shadow pulses
      const scale = 1 + Math.sin(time) * 0.1;
      monster.group.scale.set(scale, scale, scale);
    }

    if (data.state === 'chasing') {
      // Faster animation when chasing
      monster.group.rotation.y += 0.01;
    }

    monster.state = data.state;
  }

  removeMonster(id) {
    const monster = this.monsters.get(id);
    if (monster) {
      this.scene.remove(monster.group);
      this.monsters.delete(id);
    }
  }

  getNearestMonster(position) {
    let nearest = null;
    let nearestDist = Infinity;

    this.monsters.forEach((monster, id) => {
      const dist = Helpers.distance2D(position, monster.group.position);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = { id, distance: dist, type: monster.type, state: monster.state };
      }
    });

    return nearest;
  }
}