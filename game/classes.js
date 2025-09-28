const CLASSES = {
  Warrior: {
    baseStats: { str: 10, agi: 5, int: 2, vit: 8 },
    skills: ['Cleave', 'Shield Bash', 'Taunt']
  },
  Mage: {
    baseStats: { str: 2, agi: 4, int: 12, vit: 4 },
    skills: ['Fireball', 'Ice Shield', 'Teleport']
  },
  Rogue: {
    baseStats: { str: 6, agi: 12, int: 4, vit: 5 },
    skills: ['Backstab', 'Stealth', 'Poison']
  },
  Archer: {
    baseStats: { str: 5, agi: 10, int: 5, vit: 6 },
    skills: ['Multishot', 'Aim', 'Trap']
  },
  Paladin: {
    baseStats: { str: 8, agi: 4, int: 6, vit: 10 },
    skills: ['Heal', 'Holy Light', 'Divine Shield']
  },
  Necromancer: {
    baseStats: { str: 3, agi: 3, int: 14, vit: 5 },
    skills: ['Raise Dead', 'Life Drain', 'Curse']
  }
};

module.exports = { CLASSES };