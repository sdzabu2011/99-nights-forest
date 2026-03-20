class Chat {
  constructor(networkManager) {
    this.network = networkManager;
    this.isOpen = false;
    this.messages = [];
    this.maxMessages = 50;

    this.setupInput();
  }

  setupInput() {
    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyT' && !this.isOpen) {
        e.preventDefault();
        this.open();
      } else if (e.code === 'Escape' && this.isOpen) {
        this.close();
      } else if (e.code === 'Enter' && this.isOpen) {
        this.send();
      }
    });
  }

  open() {
    this.isOpen = true;
    const container = document.getElementById('chat-input-container');
    const input = document.getElementById('chat-input');
    container.style.display = 'block';
    input.focus();

    // Exit pointer lock for typing
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  close() {
    this.isOpen = false;
    const container = document.getElementById('chat-input-container');
    const input = document.getElementById('chat-input');
    container.style.display = 'none';
    input.value = '';
    input.blur();
  }

  send() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (message.length > 0) {
      this.network.sendChatMessage(message);
    }

    this.close();
  }

  addMessage(username, message, isSystem) {
    const container = document.getElementById('chat-messages');

    const el = document.createElement('div');
    el.className = 'chat-message';

    if (isSystem) {
      el.innerHTML = `<span class="system">${message}</span>`;
    } else {
      el.innerHTML = `<span class="username">${username}:</span> ${this.escapeHtml(message)}`;
    }

    container.appendChild(el);

    // Limit messages
    while (container.children.length > this.maxMessages) {
      container.removeChild(container.firstChild);
    }

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;

    // Fade out old messages
    setTimeout(() => {
      el.style.opacity = '0.5';
    }, 10000);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}