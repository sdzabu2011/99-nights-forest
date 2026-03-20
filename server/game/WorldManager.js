const { v4: uuidv4 } = require('uuid');

class WorldManager {
  constructor() {
    this.trees = [];
    this.rocks = [];
    this.items = [];
    this.campfires = [];
    this.structures = [];
    this.worldSize = 200;
    this.spawnPoints = [];
  }

  generateWorld() {
    console.log('🌍 Generating world...');

    // Generate trees
    this.generateTrees(500);

    // Generate rocks
    this.generateRocks(100);

    // Generate campfire locations
    this.generateCampfires(8);

    // Generate structures (cabins, ruins)
    this.generateStructures(5);

    // Generate spawn points
    this.generateSpawnPoints(10);

    // Spawn initial items
    this.spawnInitialItems();

    console.log(`🌲 World generated: ${this.trees.length} trees, ${this.rocks.length} rocks, ${this.campfires.length} campfires`);
  }

  generateTrees(count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 10 + Math.random() * (this.worldSize / 2 - 10);

      this.trees.push({
        id: `tree_${i}`,
        position: {
          x: Math.cos(angle) * radius,
          y: 0,
          z: Math.sin(angle) * radius
        },
        type: Math.random() > 0.3 ? 'pine' : 'oak',
        scale: 0.8 + Math.random() * 0.6,
        rotation: Math.random() * Math.PI * 2
      });
    }
  }

  generateRocks(count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * (this.worldSize / 2);

      this.rocks.push({
        id: `rock_${i}`,
        position: {
          x: Math.cos(angle) * radius,
          y: 0,
          z: Math.sin(angle) * radius
        },
        scale: 0.3 + Math.random() * 1.5,
        type: Math.random() > 0.5 ? 'boulder' : 'stone',
        rotation: Math.random() * Math.PI * 2
      });
    }
  }

  generateCampfires(count) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 20 + Math.random() * 40;

      this.campfires.push({
        id: `campfire_${i}`,
        position: {
          x: Math.cos(angle) * radius,
          y: 0,
          z: Math.sin(angle) * radius
        },
        isLit: Math.random() > 0.5,
        fuel: 50 + Math.random() * 50,
        safeRadius: 10
      });
    }
  }

  generateStructures(count) {
    const types = ['cabin', 'ruins', 'tent', 'watchtower', 'cave_entrance'];

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const radius = 30 + Math.random() * 50;

      this.structures.push({
        id: `structure_${i}`,
        position: {
          x: Math.cos(angle) * radius,
          y: 0,
          z: Math.sin(angle) * radius
        },
        type: types[i % types.length],
        rotation: Math.random() * Math.PI * 2,
        hasLoot: true
      });
    }
  }

  generateSpawnPoints(count) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 15 + Math.random() * 20;

      this.spawnPoints.push({
        x: Math.cos(angle) * radius,
        y: 0,
        z: Math.sin(angle) * radius
      });
    }
  }

  spawnInitialItems() {
    const itemTypes = [
      { type: 'medkit', name: 'Medical Kit', rarity: 0.2 },
      { type: 'food', name: 'Canned Food', rarity: 0.4 },
      { type: 'energy_drink', name: 'Energy Drink', rarity: 0.3 },
      { type: 'sanity_pill', name: 'Sanity Pills', rarity: 0.15 },
      { type: 'flare', name: 'Flare', rarity: 0.25 },
      { type: 'battery', name: 'Battery', rarity: 0.35 },
      { type: 'wood', name: 'Firewood', rarity: 0.5 },
      { type: 'key', name: 'Mysterious Key', rarity: 0.05 }
    ];

    for (let i = 0; i < 40; i++) {
      const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
      if (Math.random() > itemType.rarity) continue;

      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * (this.worldSize / 2);

      this.items.push({
        id: uuidv4(),
        type: itemType.type,
        name: itemType.name,
        position: {
          x: Math.cos(angle) * radius,
          y: 0.5,
          z: Math.sin(angle) * radius
        },
        pickedUp: false,
        pickedUpBy: null
      });
    }
  }

  spawnRandomItems() {
    const newItems = [];
    const itemTypes = [
      { type: 'food', name: 'Canned Food' },
      { type: 'battery', name: 'Battery' },
      { type: 'wood', name: 'Firewood' },
      { type: 'medkit', name: 'Medical Kit' }
    ];

    const numItems = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < numItems; i++) {
      const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * (this.worldSize / 2);

      const item = {
        id: uuidv4(),
        type: itemType.type,
        name: itemType.name,
        position: {
          x: Math.cos(angle) * radius,
          y: 0.5,
          z: Math.sin(angle) * radius
        },
        pickedUp: false,
        pickedUpBy: null
      };

      this.items.push(item);
      newItems.push(item);
    }

    return newItems;
  }

  pickupItem(itemId, playerId) {
    const item = this.items.find(i => i.id === itemId && !i.pickedUp);
    if (item) {
      item.pickedUp = true;
      item.pickedUpBy = playerId;
      return { ...item };
    }
    return null;
  }

  getRandomSpawnPoint() {
    const spawn = this.spawnPoints[
      Math.floor(Math.random() * this.spawnPoints.length)
    ];
    return { ...spawn };
  }

  getWorldData() {
    return {
      trees: this.trees,
      rocks: this.rocks,
      campfires: this.campfires,
      structures: this.structures,
      items: this.items.filter(i => !i.pickedUp),
      worldSize: this.worldSize
    };
  }
}

module.exports = WorldManager;