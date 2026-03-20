class DayNightCycle {
  constructor(scene) {
    this.scene = scene;
    this.timeOfDay = 0.25;
    this.isNight = false;

    // Ambient light
    this.ambientLight = new THREE.AmbientLight(0x404060, 0.3);
    scene.add(this.ambientLight);

    // Directional light (sun/moon)
    this.sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.sunLight.position.set(50, 100, 50);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 200;
    this.sunLight.shadow.camera.left = -100;
    this.sunLight.shadow.camera.right = 100;
    this.sunLight.shadow.camera.top = 100;
    this.sunLight.shadow.camera.bottom = -100;
    scene.add(this.sunLight);

    // Hemisphere light
    this.hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x362d1a, 0.4);
    scene.add(this.hemiLight);

    // Fog
    this.scene.fog = new THREE.FogExp2(0x000000, 0.015);

    // Sky
    this.createSky();
  }

  createSky() {
    const skyGeo = new THREE.SphereGeometry(500, 32, 32);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x0a0a2a) },
        bottomColor: { value: new THREE.Color(0x1a1a1a) },
        offset: { value: 20 },
        exponent: { value: 0.4 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide
    });
    this.sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.sky);

    // Stars
    this.createStars();

    // Moon
    this.createMoon();
  }

  createStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starPositions = [];

    for (let i = 0; i < 2000; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = 450;

      starPositions.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));

    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.5,
      transparent: true,
      opacity: 0
    });

    this.stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(this.stars);
  }

  createMoon() {
    const moonGeo = new THREE.SphereGeometry(15, 16, 16);
    const moonMat = new THREE.MeshBasicMaterial({
      color: 0xaaaacc,
      transparent: true,
      opacity: 0
    });
    this.moon = new THREE.Mesh(moonGeo, moonMat);
    this.moon.position.set(0, 300, -200);
    this.scene.add(this.moon);
  }

  update(timeOfDay) {
    this.timeOfDay = timeOfDay;
    this.isNight = timeOfDay > 0.75 || timeOfDay < 0.25;

    // Calculate sun angle
    const sunAngle = timeOfDay * Math.PI * 2 - Math.PI / 2;
    const sunHeight = Math.sin(sunAngle);
    const sunX = Math.cos(sunAngle) * 100;

    this.sunLight.position.set(sunX, Math.max(sunHeight * 100, -20), 50);

    // Adjust lighting based on time of day
    if (this.isNight) {
      // Night time
      const nightIntensity = 0.05;
      this.sunLight.intensity = nightIntensity;
      this.sunLight.color.setHex(0x4444aa);
      this.ambientLight.intensity = 0.05;
      this.ambientLight.color.setHex(0x101030);
      this.hemiLight.intensity = 0.05;

      // Stars visible
      this.stars.material.opacity = 0.8;
      this.moon.material.opacity = 0.8;

      // Dark sky
      this.sky.material.uniforms.topColor.value.setHex(0x050520);
      this.sky.material.uniforms.bottomColor.value.setHex(0x0a0a0a);

      // Dense fog at night
      this.scene.fog.density = 0.025;
      this.scene.fog.color.setHex(0x050505);

    } else if (timeOfDay > 0.25 && timeOfDay < 0.35) {
      // Dawn
      const t = (timeOfDay - 0.25) / 0.1;
      this.sunLight.intensity = Helpers.lerp(0.05, 0.6, t);
      this.sunLight.color.setHex(0xff8844);
      this.ambientLight.intensity = Helpers.lerp(0.05, 0.25, t);
      this.ambientLight.color.lerp(new THREE.Color(0x404060), t);
      this.hemiLight.intensity = Helpers.lerp(0.05, 0.3, t);

      this.stars.material.opacity = 1 - t;
      this.moon.material.opacity = 1 - t;

      this.sky.material.uniforms.topColor.value.lerp(new THREE.Color(0xff6622), t);
      this.sky.material.uniforms.bottomColor.value.lerp(new THREE.Color(0x332211), t);

      this.scene.fog.density = Helpers.lerp(0.025, 0.012, t);
      this.scene.fog.color.lerp(new THREE.Color(0x665544), t);

    } else if (timeOfDay > 0.35 && timeOfDay < 0.65) {
      // Day
      this.sunLight.intensity = 0.7;
      this.sunLight.color.setHex(0xffffdd);
      this.ambientLight.intensity = 0.3;
      this.ambientLight.color.setHex(0x404060);
      this.hemiLight.intensity = 0.4;

      this.stars.material.opacity = 0;
      this.moon.material.opacity = 0;

      this.sky.material.uniforms.topColor.value.setHex(0x1a3a1a);
      this.sky.material.uniforms.bottomColor.value.setHex(0x556644);

      this.scene.fog.density = 0.01;
      this.scene.fog.color.setHex(0x556644);

    } else if (timeOfDay > 0.65 && timeOfDay < 0.75) {
      // Dusk
      const t = (timeOfDay - 0.65) / 0.1;
      this.sunLight.intensity = Helpers.lerp(0.6, 0.05, t);
      this.sunLight.color.setHex(0xff4422);
      this.ambientLight.intensity = Helpers.lerp(0.25, 0.05, t);
      this.hemiLight.intensity = Helpers.lerp(0.3, 0.05, t);

      this.stars.material.opacity = t;
      this.moon.material.opacity = t;

      this.sky.material.uniforms.topColor.value.lerp(new THREE.Color(0x050520), t);
      this.sky.material.uniforms.bottomColor.value.lerp(new THREE.Color(0x0a0a0a), t);

      this.scene.fog.density = Helpers.lerp(0.012, 0.025, t);
      this.scene.fog.color.lerp(new THREE.Color(0x050505), t);
    }

    // Moon position
    const moonAngle = timeOfDay * Math.PI * 2 + Math.PI / 2;
    this.moon.position.x = Math.cos(moonAngle) * 200;
    this.moon.position.y = Math.max(Math.sin(moonAngle) * 300, -50);
    this.moon.position.z = -200;
  }
}