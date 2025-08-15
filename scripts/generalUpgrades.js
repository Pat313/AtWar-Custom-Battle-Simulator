var generalUpgrades = {
   "General: Defence": {
    image: " img/upgrades/general defence.png",
    description: "Your General adds +1 defence to all units in the stack.",
    "*": { attack: 0, defence: 1, hp: 0, critical: 0, defbonus: [] },
  },
  "General: Ground Secondary Defence": {
    image: " img/upgrades/general ground secondary defence.png",
    description: "Your General adds +1 HP to all Ground Secondary Defence units in the stack.",
    "ground_secondary_defence": { attack: 0, defence: 0, hp: 1, critical: 0, defbonus: [] },
  },
  "General: Ground Main Defence": {
    image: " img/upgrades/general ground main defence.png",
    description: "Your General adds +1 attack to all Ground Main Defence units in the stack.",
    "ground_main_defence": { attack: 1, defence: 0, hp: 0, critical: 0, defbonus: [] },
  },
  "General: Ground Main Attack": {
    image: " img/upgrades/general ground main attack.png",
    description: "Your General adds +1 attack to all Ground Main Attack units in the stack.",
    "ground_main_attack": { attack: 1, defence: 0, hp: 0, critical: 0, defbonus: [] },
  },
  "Lucky General": {
    image: " img/upgrades/lucky general.png",
    description: "Your General adds +2 critical chance to all units in the stack.",
    "*": { attack: 0, defence: 0, hp: 0, critical: 2, defbonus: [] },
  },
  "General: Air Main Attack": {
    image: " img/upgrades/general air main attack.png",
    description: "Your General adds +1 attack to all Air Main Attack units in the stack.",
    "air_main_attack": { attack: 1, defence: 0, hp: 0, critical: 0, defbonus: [] },
  },
  "General: Ground Stealth Attack": {
    image: " img/upgrades/general ground stealth attack.png",
    description: "Your General adds +1 attack to all Ground Stealth Attack units in the stack.",
    "ground_stealth": { attack: 1, defence: 0, hp: 0, critical: 0, defbonus: [] },
  },
};
