class Wildlife {
  constructor(scene) {
    this.scene = scene;
    this.animals = [];
    this.maxAnimals = 12;
  }

  spawnInitialAnimals() {
    for (var i = 0; i < this.maxAnimals; i++) {
      this.spawnDeer();
    }
    console.log('🦌 Spawned ' + this.animals.length + ' deer');
  }

  spawnDeer() {
    var group = new THREE.Group();

    // Body
    var bodyMat = new THREE.MeshStandardMaterial({
      color: 0x8B6914,
      roughness: 0.8,
      metalness: 0.0
    });

    var body = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.45, 1.0),
      bodyMat
    );
    body.position.y = 0.7;
    body.castShadow = false;
    group.add(body);

    // Belly (lighter)
    var bellyMat = new THREE.MeshStandardMaterial({
      color: 0xC4A24E,
      roughness: 0.8
    });
    var belly = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.15, 0.8),
      bellyMat
    );
    belly.position.set(0, 0.5, 0);
    group.add(belly);

    // Neck
    var neck = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.35, 0.2),
      bodyMat
    );
    neck.position.set(0, 1.05, 0.4);
    neck.rotation.x = -0.3;
    group.add(neck);

    // Head
    var headMat = new THREE.MeshStandardMaterial({
      color: 0x7A5C10,
      roughness: 0.7
    });
    var head = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.2, 0.25),
      headMat
    );
    head.position.set(0, 1.25, 0.55);
    group.add(head);

    // Snout
    var snout = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.1, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x5a4a2a, roughness: 0.8 })
    );
    snout.position.set(0, 1.2, 0.7);
    group.add(snout);

    // Nose
    var nose = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 6, 6),
      new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 })
    );
    nose.position.set(0, 1.22, 0.76);
    group.add(nose);

    // Eyes
    var eyeMat = new THREE.MeshStandardMaterial({ color: 0x1a1000, roughness: 0.3 });
    var leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), eyeMat);
    leftEye.position.set(-0.1, 1.3, 0.62);
    group.add(leftEye);

    var rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), eyeMat);
    rightEye.position.set(0.1, 1.3, 0.62);
    group.add(rightEye);

    // Ears
    var earMat = new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.8 });
    for (var side = -1; side <= 1; side += 2) {
      var ear = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.12, 0.04),
        earMat
      );
      ear.position.set(side * 0.1, 1.4, 0.5);
      ear.rotation.z = side * 0.3;
      group.add(ear);

      var earInner = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.08, 0.02),
        new THREE.MeshStandardMaterial({ color: 0xDDB88A })
      );
      earInner.position.set(side * 0.1, 1.4, 0.52);
      earInner.rotation.z = side * 0.3;
      group.add(earInner);
    }

    // Antlers (50% chance - male deer)
    if (Math.random() > 0.5) {
      var antlerMat = new THREE.MeshStandardMaterial({
        color: 0x6B4226,
        roughness: 0.7,
        metalness: 0.1
      });

      for (var side = -1; side <= 1; side += 2) {
        // Main antler
        var antler1 = new THREE.Mesh(
          new THREE.CylinderGeometry(0.015, 0.02, 0.3, 4),
          antlerMat
        );
        antler1.position.set(side * 0.08, 1.5, 0.48);
        antler1.rotation.z = side * 0.5;
        antler1.rotation.x = -0.2;
        group.add(antler1);

        // Branch 1
        var antler2 = new THREE.Mesh(
          new THREE.CylinderGeometry(0.01, 0.015, 0.18, 4),
          antlerMat
        );
        antler2.position.set(side * 0.15, 1.6, 0.45);
        antler2.rotation.z = side * 0.8;
        antler2.rotation.x = 0.3;
        group.add(antler2);

        // Branch 2
        var antler3 = new THREE.Mesh(
          new THREE.CylinderGeometry(0.008, 0.012, 0.12, 4),
          antlerMat
        );
        antler3.position.set(side * 0.12, 1.65, 0.52);
        antler3.rotation.z = side * 1.2;
        group.add(antler3);
      }
    }

    // Tail
    var tail = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.08, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xEEDDCC, roughness: 0.7 })
    );
    tail.position.set(0, 0.85, -0.55);
    group.add(tail);

    // Legs
    var legMat = new THREE.MeshStandardMaterial({ color: 0x6B4C14, roughness: 0.8 });
    var hoofMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6 });

    var legPositions = [
      { x: -0.15, z: 0.3, name: 'fl' },
      { x: 0.15, z: 0.3, name: 'fr' },
      { x: -0.15, z: -0.3, name: 'bl' },
      { x: 0.15, z: -0.3, name: 'br' }
    ];

    legPositions.forEach(function (lp) {
      // Upper leg
      var upper = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.3, 0.08),
        legMat
      );
      upper.position.set(lp.x, 0.38, lp.z);
      upper.name = 'leg_' + lp.name;
      group.add(upper);

      // Lower leg
      var lower = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.25, 0.06),
        legMat
      );
      lower.position.set(lp.x, 0.13, lp.z);
      lower.name = 'lowerleg_' + lp.name;
      group.add(lower);

      // Hoof
      var hoof = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, 0.05, 0.08),
        hoofMat
      );
      hoof.position.set(lp.x, 0.02, lp.z);
      group.add(hoof);
    });

    // White spots on back (fawn pattern)
    if (Math.random() > 0.5) {
      var spotMat = new THREE.MeshStandardMaterial({
        color: 0xEEDDCC,
        roughness: 0.8,
        transparent: true,
        opacity: 0.6
      });

      for (var s = 0; s < 6; s++) {
        var spot = new THREE.Mesh(
          new THREE.SphereGeometry(0.03, 4, 4),
          spotMat
        );
        spot.position.set(
          (Math.random() - 0.5) * 0.3,
          0.85 + Math.random() * 0.1,
          (Math.random() - 0.5) * 0.6
        );
        group.add(spot);
      }
    }

    // Place in world
    var angle = Math.random() * Math.PI * 2;
    var radius = 20 + Math.random() * 70;
    group.position.set(
      Math.cos(angle) * radius,
      0,
      Math.sin(angle) * radius
    );
    group.rotation.y = Math.random() * Math.PI * 2;

    this.scene.add(group);

    this.animals.push({
      group: group,
      type: 'deer',
      state: 'grazing',
      speed: 1.5 + Math.random() * 1.5,
      runSpeed: 6 + Math.random() * 3,
      wanderAngle: Math.random() * Math.PI * 2,
      stateTimer: 3 + Math.random() * 5,
      fleeFrom: null,
      grazeTimer: 0,
      headBob: 0,
      legPhase: Math.random() * Math.PI * 2
    });
  }

  update(delta, playerPosition, monsterPositions) {
    var self = this;

    this.animals.forEach(function (animal) {
      animal.stateTimer -= delta;

      // Check for nearby threats (player too close or monsters)
      var fleeing = false;
      var fleeX = 0;
      var fleeZ = 0;

      // Flee from player if too close
      if (playerPosition) {
        var pdx = animal.group.position.x - playerPosition.x;
        var pdz = animal.group.position.z - playerPosition.z;
        var playerDist = Math.sqrt(pdx * pdx + pdz * pdz);

        if (playerDist < 12) {
          fleeing = true;
          fleeX = pdx;
          fleeZ = pdz;
        }
      }

      // Flee from monsters
      if (monsterPositions && !fleeing) {
        for (var m = 0; m < monsterPositions.length; m++) {
          var mp = monsterPositions[m];
          var mdx = animal.group.position.x - mp.position.x;
          var mdz = animal.group.position.z - mp.position.z;
          var mDist = Math.sqrt(mdx * mdx + mdz * mdz);

          if (mDist < 20) {
            fleeing = true;
            fleeX = mdx;
            fleeZ = mdz;
            break;
          }
        }
      }

      if (fleeing) {
        // RUN AWAY
        animal.state = 'fleeing';
        var fleeDist = Math.sqrt(fleeX * fleeX + fleeZ * fleeZ);
        if (fleeDist > 0.1) {
          var speed = animal.runSpeed * delta;
          animal.group.position.x += (fleeX / fleeDist) * speed;
          animal.group.position.z += (fleeZ / fleeDist) * speed;
          animal.group.rotation.y = Math.atan2(fleeX, fleeZ);
        }

        // Fast leg animation
        self.animateLegs(animal, delta, 12);

      } else if (animal.stateTimer <= 0) {
        // Change state
        var rand = Math.random();
        if (rand < 0.4) {
          animal.state = 'grazing';
          animal.stateTimer = 3 + Math.random() * 6;
        } else if (rand < 0.7) {
          animal.state = 'walking';
          animal.wanderAngle += (Math.random() - 0.5) * 1.5;
          animal.stateTimer = 2 + Math.random() * 4;
        } else if (rand < 0.85) {
          animal.state = 'looking';
          animal.stateTimer = 1 + Math.random() * 2;
        } else {
          animal.state = 'idle';
          animal.stateTimer = 2 + Math.random() * 3;
        }
      }

      // Apply state behavior
      switch (animal.state) {
        case 'grazing':
          // Head goes down to eat
          animal.grazeTimer += delta * 2;
          var headBob = Math.sin(animal.grazeTimer) * 0.15;

          animal.group.children.forEach(function (child) {
            if (child.position.y > 1.0 && child.position.z > 0.3) {
              // Head parts bob down
              child.position.y += headBob * 0.01;
            }
          });

          // Slight movement while grazing
          if (Math.random() < 0.01) {
            animal.wanderAngle += (Math.random() - 0.5) * 0.3;
          }
          var gs = animal.speed * 0.1 * delta;
          animal.group.position.x += Math.sin(animal.wanderAngle) * gs;
          animal.group.position.z += Math.cos(animal.wanderAngle) * gs;
          break;

        case 'walking':
          var ws = animal.speed * delta;
          animal.group.position.x += Math.sin(animal.wanderAngle) * ws;
          animal.group.position.z += Math.cos(animal.wanderAngle) * ws;
          animal.group.rotation.y = animal.wanderAngle;

          // Walking leg animation
          self.animateLegs(animal, delta, 5);
          break;

        case 'looking':
          // Slowly turn head/body
          animal.group.rotation.y += Math.sin(Date.now() * 0.001) * 0.005;
          break;

        case 'idle':
          // Ear twitch
          animal.group.children.forEach(function (child) {
            if (child.position.y > 1.35 && Math.abs(child.position.x) > 0.05) {
              child.rotation.z += Math.sin(Date.now() * 0.005 + child.position.x * 10) * 0.002;
            }
          });
          break;
      }

      // Tail wag (subtle)
      animal.group.children.forEach(function (child) {
        if (child.position.z < -0.5 && child.position.y > 0.8 && child.position.y < 0.9) {
          child.rotation.y = Math.sin(Date.now() * 0.003) * 0.2;
        }
      });

      // Keep in world bounds
      var maxDist = 100;
      var dist = Math.sqrt(
        animal.group.position.x * animal.group.position.x +
        animal.group.position.z * animal.group.position.z
      );
      if (dist > maxDist) {
        animal.wanderAngle += Math.PI;
        animal.group.position.x *= 0.98;
        animal.group.position.z *= 0.98;
      }

      // Keep on ground
      animal.group.position.y = 0;
    });
  }

  animateLegs(animal, delta, speed) {
    animal.legPhase += delta * speed;

    animal.group.children.forEach(function (child) {
      if (!child.name) return;

      if (child.name === 'leg_fl' || child.name === 'lowerleg_fl') {
        child.rotation.x = Math.sin(animal.legPhase) * 0.4;
      }
      if (child.name === 'leg_br' || child.name === 'lowerleg_br') {
        child.rotation.x = Math.sin(animal.legPhase) * 0.4;
      }
      if (child.name === 'leg_fr' || child.name === 'lowerleg_fr') {
        child.rotation.x = Math.sin(animal.legPhase + Math.PI) * 0.4;
      }
      if (child.name === 'leg_bl' || child.name === 'lowerleg_bl') {
        child.rotation.x = Math.sin(animal.legPhase + Math.PI) * 0.4;
      }
    });
  }

  getNearestAnimal(position, range) {
    var nearest = null;
    var nearestDist = range;

    this.animals.forEach(function (animal) {
      var dx = animal.group.position.x - position.x;
      var dz = animal.group.position.z - position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = { animal: animal, distance: dist };
      }
    });

    return nearest;
  }
}