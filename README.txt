Custom Battle Simulator for AtWar made by Patricky (discord: patrick0365).

I used the official code from the game 1 : 1 and it is working through the official atwar API, not my own simulator. I heavily modified it and fixed a lot of issues though.

In the 'scripts' folder, you'll find 6 script files:
- sim.js
- units.js
- strats.js
- upgrades.js
- generalUpgrades.js
- buildingBonus.js

You can edit 5 of these (not sim.js) in notepad or some more advanced IDE (I'd recommend notepad++ at least). For custom units, you will likely need to edit units.js only, albeit you can edit the other 4 as well to play around with it. Leave sim.js alone.

In the 'img' folder, you'll find 'units' and 'strats'. You can copy-paste the images of the units in your custom maps into 'units'. You can even make different folders and put the images within them. As a sidenote, if you want to load your images from 'img -> units-> IHYmap' for example, don't forget to use the logic 'img/units/IHYmap/example.png' when populating the image parameter for the unit or anything else.

To start it, just click on sim.html and open it in a browser. Alternatively you can use nodejs, php, python, ruby, vscode, etc. to host it on a local server. Either way it works completely offline.

From that point on, it works the same way as the official battle simulator, with a few QoL extras.