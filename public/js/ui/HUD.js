class HUDMinimap {
  constructor() {
    this.canvas = document.getElementById('minimap-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.size = 150;
    this.scale = 0.7; // World units to pixels
  }

  update(playerPos, otherPlayers, monsterPositions, campfires) {
    const ctx = this.ctx;
    const cx = this.size / 2;
    const cy = this.size / 2;

    // Clear
    ctx.fillStyle = 'rgba(0, 10, 0, 0.8)';
    ctx.fillRect(0, 0, this.size, this.size);

    // Draw campfires
    if (campfires) {
      campfires.forEach(cf => {
        const x = cx + (cf.position.x - playerPos.x) * this.scale;
        const y = cy + (cf.position.z - playerPos.z) * this.scale;

        if (x > 0 && x < this.size && y > 0 && y < this.size) {
          ctx.fillStyle = cf.isLit ? '#ff6600' : '#444';
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // Draw other players
    if (otherPlayers) {
      otherPlayers.forEach(p => {
        const x = cx + (p.position.x - playerPos.x) * this.scale;
        const y = cy + (p.position.z - playerPos.z) * this.scale;

        if (x > 0 && x < this.size && y > 0 && y < this.size) {
          ctx.fillStyle = p.isAlive ? '#00ff44' : '#ff0000';
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // Draw monsters (red dots)
    if (monsterPositions) {
      monsterPositions.forEach(m => {
        const x = cx + (m.position.x - playerPos.x) * this.scale;
        const y = cy + (m.position.z - playerPos.z) * this.scale;

        if (x > 0 && x < this.size && y > 0 && y < this.size) {
          ctx.fillStyle = '#ff0000';
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // Draw player (center, white triangle)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();

    // Border circle
    ctx.strokeStyle = 'rgba(0, 255, 68, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
    ctx.stroke();

    // North indicator
    ctx.fillStyle = '#ff0000';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('N', cx, 12);
  }
}