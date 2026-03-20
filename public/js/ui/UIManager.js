class UIManager {
  constructor() {
    this.damageOverlayTimeout = null;
  }

  showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('game-hud').style.display = 'none';
    document.getElementById('death-screen').style.display = 'none';
    document.body.classList.remove('in-game');
    document.body.classList.add('in-menu');
  }

  showLoading() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('loading-screen').style.display = 'flex';
  }

  updateLoadingProgress(progress, text) {
    document.getElementById('loading-progress').style.width = progress + '%';
    document.getElementById('loading-text').textContent = text;
  }

  showGame() {
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('game-hud').style.display = 'block';
    document.getElementById('death-screen').style.display = 'none';
    document.body.classList.add('in-game');
    document.body.classList.remove('in-menu');
  }

  showDeath(cause, nights, score) {
    document.getElementById('death-screen').style.display = 'flex';

    const causeMessages = {
      'starvation': 'You starved to death...',
      'insanity': 'Your mind shattered in the darkness...',
      'monster': 'A creature of the forest took your life...',
      'wendigo': 'The Wendigo claimed another victim...',
      'shadow': 'The shadows consumed you...',
      'crawler': 'Something dragged you into the darkness...',
      'ghost': 'A restless spirit stole your breath...'
    };

    document.getElementById('death-cause').textContent =
      causeMessages[cause] || 'The forest claimed another soul...';
    document.getElementById('death-nights').textContent = nights;
    document.getElementById('death-score').textContent = score;
  }

  hideDeath() {
    document.getElementById('death-screen').style.display = 'none';
  }

  updateStats(health, stamina, hunger, sanity) {
    document.getElementById('health-bar').style.width = health + '%';
    document.getElementById('health-value').textContent = Math.round(health);

    document.getElementById('stamina-bar').style.width = stamina + '%';
    document.getElementById('stamina-value').textContent = Math.round(stamina);

    document.getElementById('hunger-bar').style.width = hunger + '%';
    document.getElementById('hunger-value').textContent = Math.round(hunger);

    document.getElementById('sanity-bar').style.width = sanity + '%';
    document.getElementById('sanity-value').textContent = Math.round(sanity);

    // Sanity visual effects
    if (sanity < 30) {
      document.getElementById('game-container').classList.add('sanity-low');
    } else {
      document.getElementById('game-container').classList.remove('sanity-low');
    }

    // Low health warning
    if (health < 25) {
      document.getElementById('health-bar').style.animation = 'deathPulse 0.5s infinite';
    } else {
      document.getElementById('health-bar').style.animation = '';
    }
  }

  updateTimeDisplay(timeOfDay, isNight) {
    const progress = document.getElementById('time-progress');
    const icon = document.getElementById('time-icon');

    progress.style.width = (timeOfDay * 100) + '%';
    icon.style.left = (timeOfDay * 100) + '%';
    icon.textContent = isNight ? '🌙' : '☀️';
  }

  updateNight(nightNumber) {
    document.getElementById('night-number').textContent = nightNumber;
  }

  updateWeather(weather) {
    const weatherIcons = {
      clear: '☀️ Clear',
      foggy: '🌫️ Foggy',
      rainy: '🌧️ Rainy',
      stormy: '⛈️ Stormy'
    };
    document.getElementById('weather-display').textContent =
      weatherIcons[weather] || '☀️ Clear';
  }

  updateFlashlight(isOn) {
    const indicator = document.getElementById('flashlight-indicator');
    indicator.textContent = isOn ? '🔦 ON' : '🔦 OFF';
    indicator.className = isOn ?
      'flashlight-indicator on' : 'flashlight-indicator';
  }

  updateScore(score) {
    document.getElementById('score-value').textContent = score;
  }

  showInteraction(text) {
    const prompt = document.getElementById('interaction-prompt');
    document.getElementById('interaction-text').textContent = text;
    prompt.style.display = 'block';
  }

  hideInteraction() {
    document.getElementById('interaction-prompt').style.display = 'none';
  }

  showDamageOverlay() {
    // Create damage flash
    const flash = document.createElement('div');
    flash.className = 'damage-flash';
    document.body.appendChild(flash);

    if (this.damageOverlayTimeout) {
      clearTimeout(this.damageOverlayTimeout);
    }

    this.damageOverlayTimeout = setTimeout(() => {
      if (flash.parentNode) {
        flash.parentNode.removeChild(flash);
      }
    }, 300);
  }

  addAnnouncement(message) {
    const container = document.getElementById('announcements');
    const el = document.createElement('div');
    el.className = 'announcement';
    el.textContent = message;
    container.appendChild(el);

    setTimeout(() => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }, 3000);
  }

  updatePlayerList(players) {
    const list = document.getElementById('player-list-items');
    list.innerHTML = '';

    players.forEach(player => {
      const li = document.createElement('li');
      li.className = player.isAlive ? '' : 'dead';
      li.innerHTML = `<span class="dot"></span> ${player.username}`;
      list.appendChild(li);
    });
  }
}