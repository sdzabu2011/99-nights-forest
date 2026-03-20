class CampfireManager {
  constructor(scene) {
    this.scene = scene;
    this.campfires = [];
  }

  createCampfires(campfireData) {
    campfireData.forEach(data => {
      this.createCampfire(data);
    });
  }

  createCampfire(data) {
    const group = new THREE.Group();

    // Stone ring
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const stone = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.2, 0),
        new THREE.MeshStandardMaterial({
          color: 0x555555,
          roughness: 0.9
        })
      );
      stone.position.set(
        Math.cos(angle) * 0.8,
        0.1,
        Math.sin(angle) * 0.8
      );
      group.add(stone);
    }

    // Logs
    for (let i = 0; i < 3; i++) {
      const log = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, 0.8, 6),
        new THREE.MeshStandardMaterial({
          color: 0x3a2510,
          roughness: 0.9
        })
      );
      const angle = (i / 3) * Math.PI * 2;
      log.position.set(
        Math.cos(angle) * 0.2,
        0.15,
        Math.sin(angle) * 0.2
      );
      log.rotation.x = Math.PI / 2;
      log.rotation.z = angle;
      group.add(log);
    }

    // Fire light
    const fireLight = new THREE.PointLight(0xff6600, 0, 15);
    fireLight.position.y = 1;
    group.add(fireLight);

    // Fire particles (simple mesh approach)
    const fireParticles = [];
    if (data.isLit) {
      fireLight.intensity = 1.5;

      for (let i = 0; i < 8; i++) {
        const particle = new THREE.Mesh(
          new THREE.PlaneGeometry(0.3, 0.5),
          new THREE.MeshBasicMaterial({
            color: i < 4 ? 0xff4400 : 0xffaa00,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide,
            depthWrite: false
          })
        );
        particle.position.set(
          (Math.random() - 0.5) * 0.3,
          0.3 + Math.random() * 0.5,
          (Math.random() - 0.5) * 0.3
        );
        particle.userData.baseY = particle.position.y;
        particle.userData.speed = 1 + Math.random() * 2;
        particle.userData.phase = Math.random() * Math.PI * 2;
        group.add(particle);
        fireParticles.push(particle);
      }
    }

    // Safe zone indicator (subtle)
    const safeZone = new THREE.Mesh(
      new THREE.RingGeometry(data.safeRadius - 0.5, data.safeRadius, 32),
      new THREE.MeshBasicMaterial({
        color: data.isLit ? 0x00ff44 : 0x444444,
        transparent: true,
        opacity: 0.05,
        side: THREE.DoubleSide
      })
    );
    safeZone.rotation.x = -Math.PI / 2;
    safeZone.position.y = 0.01;
    group.add(safeZone);

    group.position.set(data.position.x, 0, data.position.z);

    this.scene.add(group);
    this.campfires.push({
      group,
      data,
      fireLight,
      fireParticles,
      isLit: data.isLit
    });
  }

  update(delta) {
    const time = Date.now() * 0.003;

    this.campfires.forEach(campfire => {
      if (!campfire.isLit) return;

      // Flicker fire light
      campfire.fireLight.intensity = 1.2 + Math.sin(time * 5) * 0.3 + Math.random() * 0.2;
      campfire.fireLight.color.setHex(
        Math.random() > 0.5 ? 0xff6600 : 0xff4400
      );

      // Animate fire particles
      campfire.fireParticles.forEach(particle => {
        particle.position.y = particle.userData.baseY +
          Math.sin(time * particle.userData.speed + particle.userData.phase) * 0.15;
        particle.rotation.y = time * particle.userData.speed;
        particle.material.opacity = 0.5 + Math.sin(time * 3 + particle.userData.phase) * 0.2;
      });
    });
  }

  isInSafeZone(position) {
    for (const campfire of this.campfires) {
      if (!campfire.isLit) continue;

      const dist = Helpers.distance2D(position, campfire.group.position);
      if (dist < campfire.data.safeRadius) {
        return true;
      }
    }
    return false;
  }
}