// Global game instance
let game = null;

// Initialize when page loads
window.addEventListener('load', () => {
  game = new Game();
  game.init();
  game.uiManager.showLogin();

  // Focus username input
  document.getElementById('username-input').focus();

  // Enter key on username input
  document.getElementById('username-input').addEventListener('keydown', (e) => {
    if (e.code === 'Enter') {
      startGame();
    }
  });
});

function startGame() {
  const username = document.getElementById('username-input').value.trim();

  if (!username) {
    document.getElementById('login-error').textContent = 'Please enter a username!';
    return;
  }

  if (username.length < 2) {
    document.getElementById('login-error').textContent = 'Username must be at least 2 characters!';
    return;
  }

  if (username.length > 16) {
    document.getElementById('login-error').textContent = 'Username must be 16 characters or less!';
    return;
  }

  document.getElementById('login-error').textContent = '';
  document.getElementById('play-btn').textContent = 'Connecting...';
  document.getElementById('play-btn').disabled = true;

  game.networkManager.register(username);
}

function respawn() {
  if (game) {
    game.networkManager.requestRespawn();
  }
}