class WeatherSystem {
  constructor(scene) {
    this.scene = scene;
    this.currentWeather = 'clear';
    this.rainParticles = null;
    this.rainCount = 3000;

    this.setupRain();
  }

  setupRain() {
    const rainGeo = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];

    for (let i = 0; i < this.rainCount; i++) {
      positions.push(
        (Math.random() - 0.5) * 200,
        Math.random() * 50,
        (Math.random() - 0.5) * 200
      );
      velocities.push(0, -15 - Math.random() * 10, 0);
    }

    rainGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0xaaaacc,
      size: 0.1,
      transparent: true,
      opacity: 0
    });

    this.rainParticles = new THREE.Points(rainGeo, rainMat);
    this.scene.add(this.rainParticles);
    this.rainVelocities = velocities;
  }

  setWeather(weather) {
    this.currentWeather = weather;

    switch (weather) {
      case 'clear':
        this.rainParticles.material.opacity = 0;
        break;
      case 'foggy':
        this.rainParticles.material.opacity = 0;
        if (this.scene.fog) {
          this.scene.fog.density = 0.04;
        }
        break;
      case 'rainy':
        this.rainParticles.material.opacity = 0.4;
        break;
      case 'stormy':
        this.rainParticles.material.opacity = 0.7;
        break;
    }
  }

  update(delta, cameraPosition) {
    if (this.currentWeather === 'rainy' || this.currentWeather === 'stormy') {
      const positions = this.rainParticles.geometry.attributes.position.array;

      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += this.rainVelocities[i + 1] * delta;

        if (positions[i + 1] < 0) {
          positions[i] = cameraPosition.x + (Math.random() - 0.5) * 100;
          positions[i + 1] = 40 + Math.random() * 10;
          positions[i + 2] = cameraPosition.z + (Math.random() - 0.5) * 100;
        }
      }

      this.rainParticles.geometry.attributes.position.needsUpdate = true;
    }

    // Lightning flash during storm
    if (this.currentWeather === 'stormy') {
      if (Math.random() < 0.001) {
        this.lightningFlash();
      }
    }
  }

  lightningFlash() {
    const flash = new THREE.PointLight(0xffffff, 5, 200);
    flash.position.set(
      (Math.random() - 0.5) * 100,
      50,
      (Math.random() - 0.5) * 100
    );
    this.scene.add(flash);

    setTimeout(() => {
      flash.intensity = 0;
      setTimeout(() => {
        flash.intensity = 3;
        setTimeout(() => {
          this.scene.remove(flash);
        }, 100);
      }, 50);
    }, 100);
  }
}