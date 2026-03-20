// Utility functions
const Helpers = {
  // Generate a random color
  randomColor() {
    const colors = [
      0xff4444, 0x44ff44, 0x4444ff, 0xffff44,
      0xff44ff, 0x44ffff, 0xff8844, 0x8844ff
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  },

  // Distance between two 3D points
  distance3D(a, b) {
    const dx = a.x - b.x;
    const dy = (a.y || 0) - (b.y || 0);
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  },

  // Distance between two 2D points (ignore Y)
  distance2D(a, b) {
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  },

  // Lerp
  lerp(a, b, t) {
    return a + (b - a) * t;
  },

  // Clamp
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },

  // Random range
  randomRange(min, max) {
    return min + Math.random() * (max - min);
  },

  // Create simple texture from canvas
  createTexture(width, height, drawCallback) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    drawCallback(ctx, width, height);
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  },

  // Create ground texture
  createGroundTexture() {
    return Helpers.createTexture(512, 512, (ctx, w, h) => {
      // Base color - dark forest ground
      ctx.fillStyle = '#1a2a0a';
      ctx.fillRect(0, 0, w, h);

      // Add noise
      for (let i = 0; i < 5000; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const size = Math.random() * 3;
        const brightness = Math.floor(Math.random() * 40 + 20);
        ctx.fillStyle = `rgb(${brightness}, ${brightness + 10}, ${brightness - 10})`;
        ctx.fillRect(x, y, size, size);
      }

      // Add some leaves/debris
      for (let i = 0; i < 200; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        ctx.fillStyle = `rgba(${50 + Math.random() * 30}, ${40 + Math.random() * 20}, ${10}, 0.5)`;
        ctx.beginPath();
        ctx.ellipse(x, y, 2 + Math.random() * 4, 1 + Math.random() * 2, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  },

  // Create bark texture
  createBarkTexture() {
    return Helpers.createTexture(128, 256, (ctx, w, h) => {
      ctx.fillStyle = '#3a2510';
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < 100; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const lineH = 5 + Math.random() * 20;
        ctx.strokeStyle = `rgba(${20 + Math.random() * 30}, ${15 + Math.random() * 20}, ${5}, 0.6)`;
        ctx.lineWidth = 1 + Math.random() * 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (Math.random() - 0.5) * 5, y + lineH);
        ctx.stroke();
      }
    });
  },

  // Create leaves texture
  createLeavesTexture() {
    return Helpers.createTexture(128, 128, (ctx, w, h) => {
      ctx.fillStyle = '#0a3a0a';
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < 300; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const g = 30 + Math.random() * 60;
        ctx.fillStyle = `rgba(${10 + Math.random() * 20}, ${g}, ${5 + Math.random() * 10}, 0.8)`;
        ctx.beginPath();
        ctx.ellipse(x, y, 2 + Math.random() * 4, 1 + Math.random() * 3, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  },

  // Create rock texture
  createRockTexture() {
    return Helpers.createTexture(128, 128, (ctx, w, h) => {
      ctx.fillStyle = '#444';
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < 500; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const gray = 40 + Math.random() * 60;
        ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
        ctx.fillRect(x, y, 1 + Math.random() * 3, 1 + Math.random() * 3);
      }
    });
  },

  // Item emoji mapping
  getItemEmoji(type) {
    const emojis = {
      medkit: '🩹',
      food: '🥫',
      energy_drink: '⚡',
      sanity_pill: '💊',
      flare: '🔥',
      battery: '🔋',
      wood: '🪵',
      key: '🔑'
    };
    return emojis[type] || '📦';
  },

  // Format time
  formatTime(timeOfDay) {
    const hours = Math.floor(timeOfDay * 24);
    const minutes = Math.floor((timeOfDay * 24 - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
};