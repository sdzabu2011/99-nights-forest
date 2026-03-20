class Player {
  constructor(scene, playerData, isLocal) {
    this.scene = scene;
    this.id = playerData.id;
    this.username = playerData.username;
    this.isLocal = isLocal;
    this.isAlive = true;

    this.position = new THREE.Vector3(
      playerData.position.x,
      playerData.position.y || 1.6,
      playerData.position.z
    );

    this.rotation = new THREE.Euler(0, 0, 0);
    this.velocity = new THREE.Vector3();

    // Movement settings
    this.walkSpeed = 5;
    this.runSpeed = 9;
    this.jumpForce = 8;
    this.gravity = 20;
    this.onGround = true;

    // Create player mesh
    if (!isLocal) {
      this.createMesh(playerData);
    }

    // Flashlight
    this.flashlightOn = false;
    this.flashlight = null;
    this.createFlashlight();

    // Animation state
    this.animationState = 'idle';
    this.bobAmount = 0;
  }

  createMesh(playerData) {
    this.group = new THREE.Group();

    // Body
    const bodyGeo = new THREE.BoxGeometry(0.6, 1.2, 0.4);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: Helpers.randomColor(),
      roughness: 0.7
    });
    this.body = new THREE.Mesh(bodyGeo, bodyMat);
    this.body.position.y = 0.9;
    this.body.castShadow = true;
    this.group.add(this.body);

    // Head
    const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xffcc99,
      roughness: 0.6
    });
    this.head = new THREE.Mesh(headGeo, headMat);
    this.head.position.y = 1.7;
    this.head.castShadow = true;
    this.group.add(this.head);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.2, 0.8, 0.2);
    this.leftArm = new THREE.Mesh(armGeo, bodyMat);
    this.leftArm.position.set(-0.5, 0.9, 0);
    this.group.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, bodyMat);
    this.rightArm.position.set(0.5, 0.9, 0);
    this.group.add(this.rightArm);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.25, 0.8, 0.25);
    const legMat = new THREE.MeshStandardMaterial({
      color: 0x333344,
      roughness: 0.8
    });
    this.leftLeg = new THREE.Mesh(legGeo, legMat);
    this.leftLeg.position.set(-0.15, 0.25, 0);
    this.group.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, legMat);
    this.rightLeg.position.set(0.15, 0.25, 0);
    this.group.add(this.rightLeg);

    // Username label
    this.createNameLabel(playerData.username);

    this.group.position.copy(this.position);
    this.scene.add(this.group);
  }

  createNameLabel(username) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, 256, 64);

    ctx.fillStyle = '#00ff44';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(username, 128, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true
    });
    this.nameSprite = new THREE.Sprite(spriteMat);
    this.nameSprite.position.y = 2.3;
    this.nameSprite.scale.set(2, 0.5, 1);
    this.group.add(this.nameSprite);
  }

  createFlashlight() {
    this.flashlight = new THREE.SpotLight(0xffffcc, 0, 30, Math.PI / 6, 0.5, 1);
    this.flashlight.castShadow = true;
    this.flashlight.shadow.mapSize.width = 512;
    this.flashlight.shadow.mapSize.height = 512;

    if (this.isLocal) {
      this.scene.add(this.flashlight);
      this.scene.add(this.flashlight.target);
    } else if (this.group) {
      this.group.add(this.flashlight);
      this.group.add(this.flashlight.target);
    }
  }

  toggleFlashlight() {
    this.flashlightOn = !this.flashlightOn;
    this.flashlight.intensity = this.flashlightOn ? 2 : 0;
    return this.flashlightOn;
  }

  setFlashlight(isOn) {
    this.flashlightOn = isOn;
    this.flashlight.intensity = isOn ? 2 : 0;
  }

  updateLocal(controls, delta, forest) {
    if (!this.isAlive) return;

    const movement = controls.getMovement();
    const direction = controls.getDirection();

    // Calculate move direction
    const moveDir = new THREE.Vector3();
    const forward = new THREE.Vector3();
    forward.setFromMatrixColumn(controls.camera.matrix, 0);
    forward.crossVectors(controls.camera.up, forward);

    const right = new THREE.Vector3();
    right.setFromMatrixColumn(controls.camera.matrix, 0);

    if (movement.forward) moveDir.add(forward);
    if (movement.backward) moveDir.sub(forward);
    if (movement.left) moveDir.sub(right);
    if (movement.right) moveDir.add(right);

    moveDir.normalize();

    // Apply speed
    const speed = movement.running ? this.runSpeed : this.walkSpeed;
    const moveAmount = speed * delta;

    // Check collision and apply movement
    const newPos = this.position.clone();
    newPos.x += moveDir.x * moveAmount;
    newPos.z += moveDir.z * moveAmount;

    if (!forest.checkCollision({ x: newPos.x, z: newPos.z }, 0.3)) {
      this.position.x = newPos.x;
      this.position.z = newPos.z;
    }

    // Gravity and jumping
    if (movement.jumping && this.onGround) {
      this.velocity.y = this.jumpForce;
      this.onGround = false;
      controls.isJumping = false;
    }

    this.velocity.y -= this.gravity * delta;
    this.position.y += this.velocity.y * delta;

    if (this.position.y <= 1.6) {
      this.position.y = 1.6;
      this.velocity.y = 0;
      this.onGround = true;
      controls.canJump = true;
    }

    // Update camera position
    controls.camera.position.copy(this.position);

    // Head bob
    const isMoving = moveDir.length() > 0;
    if (isMoving) {
      this.bobAmount += delta * (movement.running ? 12 : 8);
      const bobIntensity = movement.running ? 0.08 : 0.04;
      controls.camera.position.y += Math.sin(this.bobAmount) * bobIntensity;
    }

    // Update flashlight position
    if (this.flashlightOn) {
      this.flashlight.position.copy(controls.camera.position);
      const targetPos = controls.camera.position.clone();
      targetPos.add(direction.multiplyScalar(10));
      this.flashlight.target.position.copy(targetPos);
    }

    // Determine animation state
    if (isMoving) {
      this.animationState = movement.running ? 'running' : 'walking';
    } else {
      this.animationState = 'idle';
    }

    // World bounds
    const maxDist = 95;
    const distFromCenter = Math.sqrt(this.position.x ** 2 + this.position.z ** 2);
    if (distFromCenter > maxDist) {
      const scale = maxDist / distFromCenter;
      this.position.x *= scale;
      this.position.z *= scale;
    }
  }

  updateRemote(data, delta) {
    if (!this.group) return;

    // Smooth interpolation
    const targetPos = new THREE.Vector3(
      data.position.x,
      data.position.y || 0,
      data.position.z
    );

    this.group.position.lerp(targetPos, 0.15);
    this.group.rotation.y = data.rotation.y || 0;

    // Animate
    const time = Date.now() * 0.005;
    if (data.animation === 'walking' || data.animation === 'running') {
      const speed = data.animation === 'running' ? 2 : 1;
      if (this.leftLeg) {
        this.leftLeg.rotation.x = Math.sin(time * speed) * 0.5;
        this.rightLeg.rotation.x = -Math.sin(time * speed) * 0.5;
        this.leftArm.rotation.x = -Math.sin(time * speed) * 0.3;
        this.rightArm.rotation.x = Math.sin(time * speed) * 0.3;
      }
    } else {
      // Idle
      if (this.leftLeg) {
        this.leftLeg.rotation.x = 0;
        this.rightLeg.rotation.x = 0;
        this.leftArm.rotation.x = Math.sin(time * 0.5) * 0.05;
        this.rightArm.rotation.x = -Math.sin(time * 0.5) * 0.05;
      }
    }
  }

  getPosition() {
    return {
      x: this.position.x,
      y: this.position.y,
      z: this.position.z
    };
  }

  getRotation() {
    return {
      x: this.rotation.x,
      y: this.rotation.y,
      z: this.rotation.z
    };
  }

  die() {
    this.isAlive = false;
    if (this.group) {
      // Death animation - fall over
      this.group.rotation.x = Math.PI / 2;
      this.group.position.y = 0.3;
    }
  }

  respawn(position) {
    this.isAlive = true;
    this.position.set(position.x, 1.6, position.z);
    if (this.group) {
      this.group.rotation.x = 0;
      this.group.position.copy(this.position);
    }
  }

  dispose() {
    if (this.group) {
      this.scene.remove(this.group);
    }
    if (this.flashlight) {
      this.scene.remove(this.flashlight);
      this.scene.remove(this.flashlight.target);
    }
  }
}