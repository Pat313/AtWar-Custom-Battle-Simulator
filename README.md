# Custom Battle Simulator for AtWar

## Features

This is a heavily modified version of the official AtWar battle simulator. It works directly through the official AtWar API and includes numerous bug fixes and improvements that many of us have been asking for.

- Works like the official AtWar battle simulator but without its limitations.  
- Supports custom units, strategies, and upgrades.  
- QoL improvements and bug fixes from the original version (e. g. buildings not working).  
- Interactive error handling (icons) to further reduce confusion.
- Unit sorting, grouping and searching by name.
- Added upgrades (completely missing in the original). Also customizable per stack.
- Customizable unit templates with plug and play to change between scenarios or the default unit set.

---

## Getting Started

1. Open `index.html` in a web browser to run the simulator.  
2. Alternatively, you can host it locally using:
> Although this is not recommended, as it was purposefully built to work without one.
   - Node.js
   - PHP
   - Python
   - Ruby
   - VSCode (Live Server)
3. Download the units from your chosen map (next paragraph) and refresh the page or reopen it.

*The simulator does not work offline as it relies on the API.*

---

## Downloading custom units

### Bookmarklet setup
1. In your custom sim, navigate to `bookmarklet/` and open `exportUnits.txt`.
2. Copy everything in side, carefully.
3. Open your browser’s bookmarks bar.
4. Right-click → **Add Page** (or Add Bookmark).
5. Name it something like `"Export AtWar Units"`.
6. Paste the code you copied into the URL field.
7. Go to the front of the URL (home key) and paste `javascript:`.
8. Save it.

### Usage
1. Go into any atwar map; either start it, join one, or be in the editor (lobby won't work).
2. Click on the bookmarklet.
3. Save it to your custom sim → `units/` folder.
> If you want to download multiple unit templates, do it all before the next step.
4. Click on `createCatalog.bat`.
5. Close it when it's finished.
6. Open `index.html` or refresh it.

> **Note:** You need to press `createCatalog.bat` after this process because we need to create an index file. This is a simple semi-automatic solution without a server (auto-fetching).

---

**Author:** Patricky (Discord: patrick0365)

---
