const ITEMS = {
  weapons: [
    { id: 'sword_iron', name: 'Iron Sword', type: 'weapon', damage: 10, rarity: 'common', slot: 'weapon' },
    { id: 'staff_fire', name: 'Fire Staff', type: 'weapon', damage: 15, magic: 20, rarity: 'rare', slot: 'weapon' },
    { id: 'bow_elven', name: 'Elven Bow', type: 'weapon', damage: 12, range: 300, rarity: 'epic', slot: 'weapon' }
  ],
  armor: [
    { id: 'armor_chain', name: 'Chainmail', type: 'armor', defense: 8, rarity: 'common', slot: 'armor' },
    { id: 'robe_mage', name: 'Mage Robe', type: 'armor', defense: 5, magicResist: 10, rarity: 'rare', slot: 'armor' }
  ],
  potions: [
    { id: 'potion_hp', name: 'Health Potion', type: 'potion', heal: 50, rarity: 'common' },
    { id: 'potion_mana', name: 'Mana Potion', type: 'potion', restore: 30, rarity: 'common' }
  ],
  materials: [
    { id: 'wood', name: 'Wood', type: 'material', amount: 1 },
    { id: 'ore', name: 'Iron Ore', type: 'material', amount: 1 }
  ]
};

module.exports = { ITEMS };