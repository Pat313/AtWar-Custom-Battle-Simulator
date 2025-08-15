# Custom Battle Simulator for AtWar

**Author:** Patricky (Discord: patrick0365)

This is a heavily modified version of the official AtWar battle simulator. It works directly through the official AtWar API and includes numerous bug fixes and improvements.

---

## Folder Structure

### `scripts`
Contains 6 script files:

- `sim.js` – Core simulator logic. **Do not edit.**
- `units.js` – Define and modify units.
- `strats.js` – Strategies logic.
- `upgrades.js` – Unit upgrades.
- `generalUpgrades.js` – General upgrades affecting gameplay.
- `buildingBonus.js` – Bonuses from buildings.

> **Tip:** You can edit all scripts except `sim.js`. For custom units, you will mostly need to modify `units.js`, though you can also tweak the others to experiment.

---

### `img`
Contains image assets:

- `units/` – Images of units for custom maps.
- `strats/` – Images of strategies.

You can create subfolders for organization, e.g., `img/units/IHYmap/`.  
When referencing these images in your scripts, use the correct relative path, e.g., `img/units/IHYmap/example.png`.

It has the default sim units and the existing game strategies/upgrades by default, although you can modify these as well.

---

## Getting Started

1. Open `index.html` in a web browser to run the simulator.  
2. Alternatively, you can host it locally using:
   - Node.js
   - PHP
   - Python
   - Ruby
   - VSCode (Live Server)

> The simulator does not work offline as it relies on the API.

---

## Features

- Works like the official AtWar battle simulator.  
- Supports custom units, strategies, and upgrades.  
- QoL improvements and bug fixes from the original version.  

---
