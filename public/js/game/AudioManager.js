class AudioManager {
  constructor() {
    this.audioContext = null;
    this.initialized = false;
    this.sounds = {};
    this.musicVolume = 0.3;
    this.sfxVolume = 0.5;
  }

  init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
      this.createSounds();
    } catch (e) {
      console.log('Audio not supported');
    }
  }

  createSounds() {
    if (!this.initialized) return;

    // Create procedural ambient sounds
    this.createAmbientWind();
  }

  createAmbientWind() {
    if (!this.audioContext) return;

    // Create white noise for wind
    const bufferSize = this.audioContext.sampleRate * 2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.01;
    }

    this.windSource = this.audioContext.createBufferSource();
    this.windSource.buffer = buffer;
    this.windSource.loop = true;

    const windFilter = this.audioContext.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 400;

    const windGain = this.audioContext.createGain();
    windGain.gain.value = this.musicVolume * 0.3;

    this.windSource.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.audioContext.destination);

    this.windGain = windGain;
  }

  startAmbient() {
    if (this.windSource && this.audioContext && this.audioContext.state === 'running') {
      try {
        this.windSource.start();
      } catch (e) {}
    }
  }

  playFootstep() {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'square';
    oscillator.frequency.value = 80 + Math.random() * 40;

    gainNode.gain.setValueAtTime(this.sfxVolume * 0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  playPickup() {
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.15);

    gain.gain.setValueAtTime(this.sfxVolume * 0.2, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.start();
    osc.stop(this.audioContext.currentTime + 0.2);
  }

  playDamage() {
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sawtooth';
    osc.frequency.value = 150;

    gain.gain.setValueAtTime(this.sfxVolume * 0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.start();
    osc.stop(this.audioContext.currentTime + 0.3);
  }

  playMonsterSound() {
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.audioContext.currentTime + 1);

    gain.gain.setValueAtTime(this.sfxVolume * 0.15, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1);

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.start();
    osc.stop(this.audioContext.currentTime + 1);
  }

  setNightAmbience(isNight) {
    if (this.windGain) {
      const targetVolume = isNight ? this.musicVolume * 0.5 : this.musicVolume * 0.2;
      this.windGain.gain.setTargetAtTime(
        targetVolume,
        this.audioContext.currentTime,
        0.5
      );
    }
  }

  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}