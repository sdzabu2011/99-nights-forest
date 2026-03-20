class Inventory {
  constructor() {
    this.items = [];
    this.maxSlots = 8;
    this.selectedSlot = 0;

    this.setupInput();
  }

  setupInput() {
    document.addEventListener('keydown', (e) => {
      // Number keys 1-8 for slot selection
      const num = parseInt(e.key);
      if (num >= 1 && num <= 8) {
        this.selectSlot(num - 1);
      }
    });

    // Click on inventory slots
    document.querySelectorAll('.inv-slot').forEach(slot => {
      slot.addEventListener('click', () => {
        const slotIndex = parseInt(slot.dataset.slot);
        this.selectSlot(slotIndex);
      });
    });
  }

  addItem(item) {
    if (this.items.length >= this.maxSlots) {
      return false;
    }

    this.items.push(item);
    this.updateUI();
    return true;
  }

  removeItem(itemId) {
    const index = this.items.findIndex(i => i.id === itemId);
    if (index !== -1) {
      this.items.splice(index, 1);
      this.updateUI();
      return true;
    }
    return false;
  }

  getSelectedItem() {
    return this.items[this.selectedSlot] || null;
  }

  selectSlot(index) {
    this.selectedSlot = index;
    this.updateUI();
  }

  updateUI() {
    const slots = document.querySelectorAll('.inv-slot');

    slots.forEach((slot, index) => {
      slot.classList.remove('active', 'has-item');
      slot.innerHTML = '';
      slot.title = '';

      if (index === this.selectedSlot) {
        slot.classList.add('active');
      }

      if (this.items[index]) {
        const item = this.items[index];
        slot.classList.add('has-item');
        slot.innerHTML = Helpers.getItemEmoji(item.type);
        slot.title = item.name;
      }
    });
  }

  clear() {
    this.items = [];
    this.updateUI();
  }
}