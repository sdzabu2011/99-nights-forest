class Controls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.isRunning = false;
    this.isJumping = false;
    this.canJump = true;

    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.PI_2 = Math.PI / 2;

    this.mouseSensitivity = 0.002;
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();

    this.isLocked = false;
    this.enabled = false;

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onPointerlockChange = this.onPointerlockChange.bind(this);

    this.setupListeners();
  }

  setupListeners() {
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousemove', this.onMouseMove);
    this.domElement.addEventListener('click', this.onClick);
    document.addEventListener('pointerlockchange', this.onPointerlockChange);
  }

  onClick() {
    if (!this.enabled) return;
    if (!this.isLocked) {
      this.domElement.requestPointerLock();
    }
  }

  onPointerlockChange() {
    this.isLocked = document.pointerLockElement === this.domElement;
  }

  onMouseMove(event) {
    if (!this.isLocked || !this.enabled) return;

    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;

    this.euler.setFromQuaternion(this.camera.quaternion);
    this.euler.y -= movementX * this.mouseSensitivity;
    this.euler.x -= movementY * this.mouseSensitivity;
    this.euler.x = Math.max(-this.PI_2, Math.min(this.PI_2, this.euler.x));

    this.camera.quaternion.setFromEuler(this.euler);
  }

  onKeyDown(event) {
    if (!this.enabled) return;

    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.isRunning = true;
        break;
      case 'Space':
        if (this.canJump) {
          this.isJumping = true;
          this.canJump = false;
        }
        break;
    }
  }

  onKeyUp(event) {
    if (!this.enabled) return;

    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.isRunning = false;
        break;
    }
  }

  getMovement() {
    return {
      forward: this.moveForward,
      backward: this.moveBackward,
      left: this.moveLeft,
      right: this.moveRight,
      running: this.isRunning,
      jumping: this.isJumping
    };
  }

  getDirection() {
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    return direction;
  }

  getYaw() {
    return this.euler.y;
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.isRunning = false;
  }

  dispose() {
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    this.domElement.removeEventListener('click', this.onClick);
    document.removeEventListener('pointerlockchange', this.onPointerlockChange);
  }
}