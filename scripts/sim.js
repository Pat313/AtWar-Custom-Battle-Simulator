function initSimulator() {
var DEFAULT_COUNT_OF_UNITS = localStorage.getItem('aw_defaultCount') || 5;
var BATTLE_SIMULATOR_URL   = 'https://nnbu2q2491.execute-api.us-east-1.amazonaws.com/default/BattleRequest';
var ALL_UNITS_KEY          = localStorage.getItem('aw_unitsKey') || '*';

	var unitTemplate = document.getElementById('unitrow-template');
	var unitDefTemplate = document.getElementById('defbonus-template');
	var stackTemplate = document.getElementById('stack-template');

	var stackContainer = document.getElementById('stack-container');
	var battleResults = document.getElementById('battle-results');
	var currentStacks = {};
	var currentStackNum = 1;

    var errorBar = document.getElementById('error-bar');
    const ERROR_LEVELS = {
    NO_DEFENDER   : { name: "No defending stack", icon:'fa-shield-halved',  msg:'None of the stacks are set to Defending. There may be slight inaccuracies in the calculation.', level:'warning' },
    TOO_MANY_UNITS: { name: "Too many units", icon:'fa-users',          msg:"You've added more than 1000 units, consider reducing the number of simulations.", level:'warning' },
    HIGH_SIMS     : { name: "High simulation count", icon:'fa-stopwatch',      msg:'Going above 10.000 number of simulations is not recommended. It will result in a longer calculation time.', level:'warning' },
    LOW_SIMS      : { name: "Low simulation count", icon:'fa-chart-line',     msg:'Less than 1000 number of simulations increase the risk of inaccurate results.', level:'warning' },
    EMPTY_STACK   : { name: "Stack(s) without units", icon:'fa-box-open',       msg:'One or more stacks have no units in them.', level:'info' },
    NO_STRAT      : { name: "No strategy selected", icon:'fa-chess-board',    msg:'One or more stacks have no strategy selected.', level:'info' },
    ALL_ALLIED    : { name: "Every stack is allied", icon:'fa-handshake',      msg:'The stacks are all allied to each other. This will confuse the simulator.', level:'error' },
    TOO_FEW_STACKS: { name: "Too few stacks", icon:'fa-layer-group',    msg:"There's currently 1 or less stacks. Please add at least 2 stacks before running the simulation.", level:'info' },
    BUILDING_NOT_DEFENDING: { name: "Buildings cannot attack", icon: 'fa-city', msg: "One or more stacks have building in them, while not set to Defending.", level: 'warning' },
};

	var generalIds = [];
	//var unitBeingDragged = null;

    var TOTAL_UPGRADES = 0;
      
	function replaceAll(string, variables) {
		var keys = [];
		for (var key in variables) {
			if (variables.hasOwnProperty(key)) {
				keys.push('\\' + key);
			}
		}
		var re = new RegExp(keys.join('|'), 'gi');
		return string.replace(re, function (matched) {
			return variables[matched];
		});
	}

var allyMap = {};

function updateAllyMap(stackName, allyName, add) {
        if (!allyMap[stackName]) allyMap[stackName] = new Set();
        if (!allyMap[allyName])  allyMap[allyName]  = new Set();
        add ? allyMap[stackName].add(allyName) && allyMap[allyName].add(stackName)
            : allyMap[stackName].delete(allyName) && allyMap[allyName].delete(stackName);
    }

	function renderTemplate(template, variables) {
		return replaceAll(template.innerHTML, variables);
	}

	// Events

	function onDragUnit(event) {
		event.dataTransfer.setData('text/plain', this.dataset.unitid);
	}

	function onRemoveUnit(event) {
		var eventNode = $(event.currentTarget).parents('tr');
		var stackNode = eventNode.parents('.stack');
		var stackName = stackNode.data('name');
		var unitId = eventNode.data('unitid');

		if (!stackName) {
			return;
		}

		delete currentStacks[stackName].units[unitId];
		refreshStack(stackName);
         updateErrorBar();
	}

	function onSubmit() {
$('#loading-icon').show();          // show spinner
    try {
        var stacks = {};
        var times = Number(document.getElementById('times').value);
        var data = { times: times, stacks: stacks };

        stackContainer.querySelectorAll('.stack').forEach(function (stack) {
            var unitsMap = {};
            var name = stack.querySelector('.stack-title').innerHTML.trim();
            var isDefending = stack.querySelector('input[name="is-defending"]').checked;
            var isInCity = stack.querySelector('input[name="in-city"]').checked;
            var isInDefenceLine = stack.querySelector('input[name="in-defence-line"]').checked;
            var stratId = $(stack).find('.select2-strategies').val();
            var currentStrategy = strats[stratId];
            // --- collect the same data that refreshStack uses ---
            const enableUpgrades = stack.querySelector('input[name="enable-upgrades"]').checked;

            // 1. count generals
            let generalCount = 0;
            stack.querySelectorAll('tbody tr').forEach(tr => {
                if (generalIds.includes(tr.dataset.unitid)) {
                    generalCount += Number(tr.querySelector('.quantity-cell').value || 1);
                }
            });

            // 2. building buff (same code as in refreshStack)
            const buildingBuff = { attack: 0, defence: 0, hp: 0, critical: 0, defbonus: [] };
            const idsWithRole = new Set();
            stack.querySelectorAll('tbody tr').forEach(tr => {
                const id   = tr.dataset.unitid;
                const role = units[id]?.unit_role_id;
                if (buildingBonus[role]) idsWithRole.add(id);
            });
            idsWithRole.forEach(id => {
                const role = units[id].unit_role_id;
                const b    = buildingBonus[role];
                buildingBuff.attack   += b.attack   || 0;
                buildingBuff.defence  += b.defence  || 0;
                buildingBuff.hp       += b.hp       || 0;
                buildingBuff.critical += b.critical || 0;
            });

            // 3. chosen upgrades
            const chosenUpgrades        = enableUpgrades
                ? currentStacks[name].upgrades
                : [];
            const chosenGeneralUpgrades = enableUpgrades && generalCount > 0
                ? currentStacks[name].generalUpgrades
                : [];

            stack.querySelectorAll('tbody tr').forEach(function (unitRow) {
                var unitId = unitRow.dataset.unitid;
                var count = Number(unitRow.querySelector('.quantity-cell').value);
                var currentUnit = units[unitId];

                if (!currentUnit) {
                    console.error("Missing unit data for ID:", unitId);
                    return;
                }

                const p  = Number(currentUnit.crit) / 100;   // 0‒1
                const baseValue = isDefending
                        ? Number(currentUnit.max_defence)   // defender → use defence
                        : Number(currentUnit.max_attack);   // attacker → use attack

                const map   = computeMapping(baseValue, p);  // adjustAtkCrit.js
                const Mprime = Math.round(map.Mprime);
                const qPct = Math.round(map.q * 100);

                unitsMap[unitId] = {
                    attack:  isDefending ? Number(currentUnit.max_attack) : Mprime,
                    defense: isDefending ? Mprime : Number(currentUnit.max_defence),
                    hp:      Number(currentUnit.hp),
                    critical: qPct,         // <-- was currentUnit.crit
                    count:    count,
                    defbonus: (function(bonuses) {
    if (!Array.isArray(bonuses)) return {};
    var result = {};
    bonuses.forEach(function(b) {
        // API only needs unit_id and defense
        result[b.unit_id] = { defense: b.defbonus };
    });
    return result;
})(currentUnit.defbonus)
};

                // Apply improvements
                var improvement = getUnitImprovements(
                    currentUnit,
                    currentStrategy,
                    isInCity,
                    isInDefenceLine,
                    generalCount,
                    enableUpgrades,
                    buildingBuff,
                    chosenUpgrades,
                    chosenGeneralUpgrades
                );

                unitsMap[unitId].attack   += improvement.attack;
                unitsMap[unitId].defense  += improvement.defence;
                unitsMap[unitId].critical += improvement.critical;
                unitsMap[unitId].hp       += improvement.hp;
            });

            // Build enemies list
            const allNames = Object.keys(currentStacks);
            const allies   = allyMap[name] || new Set();
            const enemies  = allNames.filter(n => n !== name && !allies.has(n));

            stacks[name] = {
                defending: isDefending,
                units: unitsMap,
                enemies: enemies
            };
        });

        console.log("Payload to API:", JSON.stringify(data, null, 2));

        $.ajax({
            url: BATTLE_SIMULATOR_URL,
            type: 'POST',
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function (results) {
$('#loading-icon').hide();   // hide on success
    var resultNodeText = 'Simulation Result:\n';
    var resultTemplate =
        '\n\n$name ($position):\n' +
        'Wins: $wins%\n' +
        'Avg.Att: $avgAttack\n' +
        'Avg.Def: $avgDefence\n' +
        'Avg.Alive: $avgUnitsAlive\n';

    // Prefer the server's "times", fall back to the requested "times"
    var denominator = (results && results.times) ? results.times : times;

    // Safety: if results.stacks is missing, show something useful
    var stacksResults = (results && results.stacks) ? results.stacks : {};

    Object.keys(stacksResults).forEach(function (stackName) {
        var stackResult = stacksResults[stackName] || {};
        var currentStack = stacks[stackName] || { defending: false };

        var winsPct = denominator ? (100 * (stackResult.victories || 0) / denominator) : 0;

        resultNodeText += replaceAll(resultTemplate, {
            $name: stackName,
            $position: currentStack.defending ? 'defending' : 'attacking',
            $wins: winsPct.toFixed(2),
            $avgAttack: (stackResult.AvgAttack || 0).toFixed(2),
            $avgDefence: (stackResult.AvgDefence || 0).toFixed(2),
            $avgUnitsAlive: (stackResult.AvgUnitsAlive || 0).toFixed(2),
        });
    });

    // <pre id="battle-results"> uses white-space: pre-wrap; textContent preserves newlines safely
    battleResults.textContent = resultNodeText;
},

            error: function (jqXHR, textStatus, errorThrown) {
$('#loading-icon').hide();   // hide on error too
                console.error("API Error:", textStatus, errorThrown, jqXHR.responseText);
                battleResults.innerHTML =
                    'Error running simulation: ' + textStatus + ' - ' + errorThrown +
                    '\n' + (jqXHR.responseJSON ? JSON.stringify(jqXHR.responseJSON, null, 2) : jqXHR.responseText);
            }
        });

    } catch (err) {
$('#loading-icon').hide();       // hide on JS exception too
        console.error("Submit error:", err);
        battleResults.innerHTML = "Error preparing simulation: " + err.message;
    }
}

	function createDefBonus(defbonus) {
    var bonuses = [];

    /* 1. special city/defence-line buffs */
    if (defbonus.unit_id === 'in_own_city') {
        bonuses.push({
            unit_id: -1,
            name: 'In own city',
            image: 'img/special/InOwnCity.gif',
            defbonus: Number(defbonus.defence_bonus || defbonus.defbonus)
        });
        return bonuses;               // nothing else to do
    }
    else if (defbonus.unit_id === 'in_defence_line') {
        bonuses.push({
            unit_id: -1,
            name: 'In defence line',
            image: 'img/special/InDefenceLine.gif',
            defbonus: Number(defbonus.defence_bonus || defbonus.defbonus)
        });
        return bonuses;
    }

    /* 2. role-based bonuses */
    var attackers = [];
    for (var unitId in units) {
        var currentUnit = units[unitId];
        if (unitId === defbonus.unit_id ||
            currentUnit.unit_role_id === defbonus.unit_id) {
            attackers.push(currentUnit);
        }
    }

    attackers.forEach(function (attacker) {
        var unitKey = Object.keys(units).find(key => units[key] === attacker);
        bonuses.push({
            unit_id: unitKey,
            name: 'against ' + unitKey,
            image: attacker.image,
            defbonus: Number(defbonus.defbonus || defbonus.defence_bonus)
        });
    });

    return bonuses;
}

	function setValueToUnitCell(cell, currentValue, incrementValue) {
		var isIncrement = incrementValue > 0;
		var totalStat = Number(currentValue) + Number(incrementValue);
		var statColor = isIncrement ? 'green' : 'lightred';
		var sign = isIncrement ? '+' : '';
		cell.html(
			'<span class="' +
			statColor +
			'">' +
			totalStat +
			' <span class="dark mini">(' +
			sign +
			incrementValue +
			')</span></span>'
		);
	}

	function applyStratImprovementsToUnitRow(unitrow, unit, improvement) {
    if (improvement.attack != 0) {
        setValueToUnitCell(
            unitrow.find('.attack-cell'),
            unit['max_attack'],
            improvement.attack
        );
    }
    if (improvement.defence != 0) {
        setValueToUnitCell(
            unitrow.find('.defence-cell'),
            unit['max_defence'],
            improvement.defence
        );
    }
    if (improvement.critical != 0) {
        setValueToUnitCell(
            unitrow.find('.critical-cell'),
            unit['crit'],
            improvement.critical
        );
    }
    if (improvement.hp != 0) {
        setValueToUnitCell(
            unitrow.find('.hp-cell'),
            unit['hp'],
            improvement.hp
        );
    }

// -------------- DEFBONUS --------------
if (improvement.defbonus && improvement.defbonus.length) {
    var defcell = $(unitrow.find('.defbonus-cell'));
    defcell.empty();

    improvement.defbonus.forEach(function (bonus) {
        var chips = createDefBonus(bonus);   // returns [] or 1-N chips
        chips.forEach(function (chip) {
            defcell.append(
                renderTemplate(unitDefTemplate, {
                    $name:  chip.name,
                    $image: chip.image,
                    $bonus: '<span class="' + (chip.defbonus > 0 ? 'green' : 'lightred') + '">' + (chip.defbonus > 0 ? '+' : '') + chip.defbonus + '</span>'
                })
            );
        });
    });
}

}

	const defaultImprovement = {
		attack: 0,
		defence: 0,
		hp: 0,
		critical: 0,
		defbonus: [],
	};

	function mergeImprovement(improvement1, improvement2) {
		improvement1 = improvement1 || $.extend({}, defaultImprovement);
		improvement2 = improvement2 || $.extend({}, defaultImprovement);
		return {
			attack: improvement1.attack + improvement2.attack,
			defence: improvement1.defence + improvement2.defence,
			hp: improvement1.hp + improvement2.hp,
			critical: improvement1.critical + improvement2.critical,
			defbonus: $.merge(
				$.merge([], improvement1.defbonus),
				improvement2.defbonus
			),
		};
	}

    function multiplyImprovement(imp, factor) {
    if (!imp || factor === 1) return imp;
    return {
        attack:   (imp.attack   || 0) * factor,
        defence:  (imp.defence  || 0) * factor,
        hp:       (imp.hp       || 0) * factor,
        critical: (imp.critical || 0) * factor,
        defbonus: imp.defbonus || []   // defbonus is not additive per-general
    };
}

	function getUnitImprovements(
    currentUnit,
    strategy,
    inCity,
    inDefenceLine,
    generalCount,
    enableUpgrades,
    buildingBuff,
    chosenUpgrades,
    chosenGeneralUpgrades,
) {
    var improvement = $.extend({}, defaultImprovement);

    // --- apply strategy ---
    if (strategy) {
        improvement = mergeImprovement(improvement, strategy[ALL_UNITS_KEY]);
        if (strategy[currentUnit.unit_role_id]) {
            improvement = mergeImprovement(improvement, strategy[currentUnit.unit_role_id]);
        }
    }

    // --- apply upgrades ---
    if (enableUpgrades) {
  chosenUpgrades.forEach(key => {
    const upgradeObj = upgrades[key];
    if (!upgradeObj) return;

    // look for a bonus that matches this unit's role
    const bonus = upgradeObj[currentUnit.unit_role_id] || upgradeObj['*'];
    if (bonus) {
      improvement = mergeImprovement(improvement, bonus);
    }
  });
}

// --- apply general upgrades ---
if (generalCount > 0) {
    improvement = mergeImprovement(improvement, multiplyImprovement(generalUpgrades[ALL_UNITS_KEY], generalCount));
        if (generalUpgrades[currentUnit.unit_role_id]) {
            improvement = mergeImprovement(improvement, multiplyImprovement(generalUpgrades[currentUnit.unit_role_id], generalCount));
        }

        if (Array.isArray(chosenGeneralUpgrades)) {
chosenGeneralUpgrades.forEach(key => {
    const bonusObj = generalUpgrades[key];
    if (!bonusObj) return;

    const bonus = bonusObj[currentUnit.unit_role_id] || bonusObj['*'];
    if (bonus) {
      improvement = mergeImprovement(improvement, multiplyImprovement(bonus, generalCount));
    }
  });
        }
}


// --- apply buildings ---
improvement = mergeImprovement(improvement, buildingBuff);

    // --- apply static unit bonuses (from units.js) ---
    if (currentUnit.defbonus && currentUnit.defbonus.length) {
        // convert them to the same format
        var staticBonuses = currentUnit.defbonus.map(function (b) {
            return { unit_id: b.unit_id, defbonus: b.defbonus };
        });
        improvement.defbonus = improvement.defbonus.concat(staticBonuses);
    }

// --- apply conditional defence bonuses (city / defence line) ---
improvement.defbonus.forEach(function (bonus) {
    if (inCity && bonus.unit_id === 'in_own_city') {
        improvement.defence += Number(bonus.defence_bonus || bonus.defbonus || 0);
    }
    if (inDefenceLine && bonus.unit_id === 'in_defence_line') {
        improvement.defence += Number(bonus.defence_bonus || bonus.defbonus || 0);
    }
});

    return improvement;
}



	function refreshStack(stackName) {
	var currentStack = currentStacks[stackName];
	var stackNode = $('.stack[data-name="' + stackName + '"]');
	var stratId = stackNode.find('.select2-strategies').val();
	var currentStrategy = strats[stratId];
	var isInCity = stackNode.find('input[name="in-city"]')[0].checked;
	var isInDefenceLine = stackNode.find('input[name="in-defence-line"]')[0].checked;
	var generalCount = 0;
	var enableUpgrades = stackNode.find('input[name="enable-upgrades"]')[0].checked;

	// Before refreshing, save unit count.
	var currentUnitsNodes = stackNode.find('tbody tr');
	var quantityMap = {};

	$.each(currentUnitsNodes, function (idx, unitNode) {
		var unitId = unitNode.dataset.unitid;
		quantityMap[unitId] = Number(
			unitNode.querySelector('.quantity-cell').value
		);
	});

	// Empty
	stackNode.find('tbody').empty();
	var tbody = stackNode.find('tbody')[0];

	$.each(currentStack.units, function (unitId) {
		var unitNode = createUnitRow(unitId);
		if (quantityMap[unitId]) {
			unitNode.querySelector('.quantity-cell').value = quantityMap[unitId];
		}
		tbody.append(unitNode);
		unitNode
			.querySelector('img[draggable="true"]')
			.addEventListener('dragend', onRemoveUnit);
	});

    // General helper
 stackNode.find('tbody tr').each(function () {
        const unitId = $(this).data('unitid');
        if (generalIds.includes(unitId)) {
            generalCount += Number($(this).find('.quantity-cell').val() || 1);
        }
    });

// Building buffs
var idsWithRole = new Set();
stackNode.find('tbody tr').each(function () {
    var id   = this.dataset.unitid;
    var role = units[id]?.unit_role_id;
    if (buildingBonus[role]) idsWithRole.add(id);   // one entry per distinct ID
});

var buildingBuff = {
    attack: 0, defence: 0, hp: 0, critical: 0, defbonus: []
};

idsWithRole.forEach(function (id) {
    var role = units[id].unit_role_id;
    var b    = buildingBonus[role];
    buildingBuff.attack   += b.attack   || 0;
    buildingBuff.defence  += b.defence  || 0;
    buildingBuff.hp       += b.hp       || 0;
    buildingBuff.critical += b.critical || 0;
});

// Upgrade buffs
var chosenUpgrades = enableUpgrades
    ? currentStacks[stackName].upgrades
    : [];

var chosenGeneralUpgrades = (generalCount > 0 && enableUpgrades)
    ? currentStacks[stackName].generalUpgrades
    : [];

let upgradeBuff = { attack: 0, defence: 0, hp: 0, critical: 0, defbonus: [] };

chosenUpgrades.forEach(key => {
  const upgradeObj = upgrades[key];
  if (!upgradeObj) return;                       // missing key → skip

  Object.keys(upgradeObj)
        .filter(k => k !== 'image' && k !== 'description')
        .forEach(role => {
          const bonus = upgradeObj[role];
          if (!bonus || typeof bonus !== 'object') return; // <-- NEW guard
          upgradeBuff = mergeImprovement(upgradeBuff, bonus);
        });
});

	tbody.querySelectorAll('tr').forEach(function (unitrow) {
		unitrow = $(unitrow);
		var unitId = unitrow.data('unitid');
		var currentUnit = units[unitId];
		var unitImprovement = getUnitImprovements(
			currentUnit,
			currentStrategy,
			isInCity,
			isInDefenceLine,
			generalCount,
			enableUpgrades,
			buildingBuff,
			chosenUpgrades,
    			chosenGeneralUpgrades,
		);
		applyStratImprovementsToUnitRow(unitrow, currentUnit, unitImprovement);
	});
}

function refreshUpgradeLabel(stackName) {
    const stackNode = document.querySelector(`.stack[data-name="${stackName}"]`);
    if (!stackNode) return;

    const data = currentStacks[stackName] || {};
    const enabledCount = (data.upgrades        || []).length +
                         (data.generalUpgrades || []).length;

    const label = stackNode.querySelector('.upgrade-count-label');
    TOTAL_UPGRADES = 
        Object.keys(upgrades || {}).length +
        Object.keys(generalUpgrades || {}).length;
    if (label) {
        label.textContent = `${enabledCount} / ${TOTAL_UPGRADES}`;
    }
}


	function onUpgradesEnable(event) {
		var stackName = $(event.currentTarget).parents('.stack').data('name');
		refreshStack(stackName);
	}

	function onStratChange(event) {
		var stackName = $(event.currentTarget).parents('.stack').data('name');
		refreshStack(stackName);
	}

	function createUnitRow(unitId) {
	var selectedUnit = units[unitId];
	if (!selectedUnit) {
		console.error("Unit not found for ID:", unitId);
		return null;
	}

	var defbonus = '';
	selectedUnit.defbonus.forEach(function (bonus) {
		defbonus += renderTemplate(unitDefTemplate, {
			$name: "against " + bonus.unit_id,
			$image: units[bonus.unit_id].image,
			$bonus: (bonus.defbonus >= 0 ? '+' : '') + bonus.defbonus,
		});
	});

	var newUnitNode = renderTemplate(unitTemplate, {
		$id: unitId,
		$name: unitId,
		$image: selectedUnit.image,
		$attack: selectedUnit.max_attack,
		$defence: selectedUnit.max_defence,
		$hp: selectedUnit.hp,
		$count:
(generalIds.includes(unitId) ||
 (units[unitId].unit_role_id || '').indexOf('building') === 0)
? 1
: DEFAULT_COUNT_OF_UNITS,
		$critical: selectedUnit.crit,
		$defbonus: defbonus,
	});

	return htmlToElement(newUnitNode);
}


	function onDropUnit(event, target) {
  event.preventDefault();
  const stackName = event.currentTarget.dataset.name;
  const unitId = event.dataTransfer.getData('text/plain');
  currentStacks[stackName].units[unitId] = {};
  refreshStack(stackName);
   updateErrorBar();
}

	function onIsDefending(event) {
  // 1. ensure only one defending checkbox is active
  document.querySelectorAll('input[name="is-defending"]').forEach(cb => {
    if (cb !== event.currentTarget) cb.checked = false;
  });

  // 2. for every stack, sync city/defence-line
  document.querySelectorAll('.stack').forEach(stack => {
    const isDef = stack.querySelector('input[name="is-defending"]').checked;
    const city = stack.querySelector('input[name="in-city"]');
    const line = stack.querySelector('input[name="in-defence-line"]');

    city.disabled = !isDef;
    line.disabled = !isDef;

    // un-tick if defending is off
    if (!isDef) {
      city.checked = false;
      line.checked = false;
    }
  });
}

	function onInCity(event) {
		event.preventDefault();
		$(event.currentTarget)
			.closest('.stack')
			.find('input[name="in-defence-line"]')[0].checked = false;
		var stackName = $(event.currentTarget)
			.parents('.stack')
			.find('.stack-title')
			.html();
		refreshStack(stackName);
	}

	function onInDefenceLine(event) {
		event.preventDefault();
		$(event.currentTarget)
			.closest('.stack')
			.find('input[name="in-city"]')[0].checked = false;
		var stackName = $(event.currentTarget)
			.parents('.stack')
			.find('.stack-title')
			.html();
		refreshStack(stackName);
	}

	function refreshAllianceSelect() {
    $('.stack').each(function () {
        const myName = $(this).find('.stack-title').text();
        const $sel   = $(this).find('.select2-allies');

        /* 1. build the option list from *current* DOM stacks */
        const others = Array.from(document.querySelectorAll('.stack'))
                            .map(s => s.querySelector('.stack-title').textContent.trim())
                            .filter(n => n !== myName);

        /* 2. replace options */
        $sel.empty().append(others.map(n => new Option(n, n)));

        /* 3. set current allies silently */
        const current = Array.from(allyMap[myName] || []);
        $sel.val(current).trigger('change.select2');
    });
}

	function htmlToElement(html) {
		var template = document.createElement('template');
		html = html.trim(); // Never return a text node of whitespace as the result
		template.innerHTML = html;
		return template.content.firstChild;
	}

	function addEventsToStack(stackNode) {
		stackNode.addEventListener('dragover', function (event) {
			event.preventDefault();
		});
		stackNode.addEventListener('drop', onDropUnit);
		$(stackNode)
			.find('select[name="strategy"]')
			.on('change', onStratChange);
		stackNode
			.querySelector('input[name="in-city"]')
			.addEventListener('change', onInCity);
		stackNode
			.querySelector('input[name="in-defence-line"]')
			.addEventListener('change', onInDefenceLine);
		stackNode
			.querySelector('input[name="is-defending"]')
			.addEventListener('change', onIsDefending);
		stackNode
			.querySelector('input[name="enable-upgrades"]')
			.addEventListener('change', onUpgradesEnable);
		stackNode
			.querySelector('.stack-delete')
			.addEventListener('click', removeStack);
stackNode.querySelector('input[name="is-defending"]')
     .addEventListener('change', onIsDefending);

    const onAllyChange = function () {
    const myName = $(this).closest('.stack').find('.stack-title').text();
    const newAllies = new Set($(this).val() || []);

    // 1. bidirectional sync
    const oldAllies = allyMap[myName] || new Set();

    // 1a. remove dropped alliances
    oldAllies.forEach(a => {
        if (!newAllies.has(a)) {
            updateAllyMap(myName, a, false);
        }
    });

    // 1b. add new alliances
    newAllies.forEach(a => {
        if (!oldAllies.has(a)) {
            updateAllyMap(myName, a, true);
        }
    });

    // 2. refresh UI
    refreshAllianceSelect();
    updateErrorBar();
};

    $(stackNode).find('.select2-allies')
            .select2({ data: [], placeholder: 'Click to add an ally stack' })
            .on('change', onAllyChange);
	}

	function addInitialEventHandlers() {
    document.querySelector('.stack-add').addEventListener('click', addStack);

    refreshUnitList();

    document.getElementById('submit-button')
        .addEventListener('click', onSubmit);
}

function refreshUnitList() {
  const sortAlphabetically = localStorage.getItem('aw_sort') !== 'false';
  const term = (window.unitSearchTerm || '').toLowerCase();
  const list = document.getElementById('units-list');
  list.innerHTML = '';

  const buckets = { General: [], Ground: [], Naval: [], Air: [], Building: [], Other: [] };

  Object.keys(units).forEach(id => {
    const roleID = units[id].unit_role_id;
    if (roleID === 'player_general')        buckets.General.push(id);
    else if (roleID.startsWith('ground'))   buckets.Ground.push(id);
    else if (roleID.startsWith('naval'))    buckets.Naval.push(id);
    else if (roleID.startsWith('air'))      buckets.Air.push(id);
    else if (roleID.startsWith('building')) buckets.Building.push(id);
    else                                    buckets.Other.push(id);
  });

  if (sortAlphabetically) Object.keys(buckets).forEach(k => buckets[k].sort());

  /* render groups */
  Object.keys(buckets).forEach(groupName => {
    const ids = buckets[groupName].filter(id => id.toLowerCase().includes(term));
    if (!ids.length) return;

    const liHeader = document.createElement('li');
liHeader.className = 'group-header group-' + groupName.toLowerCase();
liHeader.textContent = groupName;
    list.appendChild(liHeader);

    ids.forEach(unitId => {
      const unit = units[unitId];
      const li   = document.createElement('li');

      const wrap = document.createElement('div');
      wrap.draggable = true;
      wrap.dataset.unitid = unitId;
      wrap.style.cssText = 'cursor:grab;display:inline-flex;align-items:center';
      wrap.addEventListener('dragstart', onDragUnit);

      const img = document.createElement('img');
      img.src = unit.image;
      img.style.cssText = 'width:40px;height:27px;object-fit:cover;margin-right:8px';

      wrap.appendChild(img);
      wrap.appendChild(document.createTextNode(unitId));
      li.appendChild(wrap);
      list.appendChild(li);
    });
  });
}

$(document).off('input', '#units-list-search').on('input', '#units-list-search', function () {
  window.unitSearchTerm = this.value.toLowerCase();
  refreshUnitList();
});

	function addStack() {
    var name = 'Stack ' + currentStackNum;
    currentStackNum++;
    var stackNode = htmlToElement(
        renderTemplate(stackTemplate, {
            $name: name,
        })
    );

    stackContainer.append(stackNode);

    addEventsToStack(stackNode);

    // Initialize with all upgrades checked by default
    currentStacks[name] = {
        name: name,
        units: {},
        upgrades: Object.keys(upgrades),
        generalUpgrades: Object.keys(generalUpgrades)
    };

    refreshAllianceSelect();
    initStrategies($(stackNode).find('.select2-strategies'));
    refreshUpgradeLabel(name);
    updateErrorBar(); 
}

function removeStack(evt) {
    const stackNode = evt.currentTarget.closest('.stack');
    const name = stackNode.querySelector('.stack-title').textContent.trim();

    /* 0.  update the data model EARLY */
    delete currentStacks[name];

    /* 1.  drop this name from every other stack’s allies */
    $('.stack').each(function () {
        const $sel = $(this).find('.select2-allies');
        const val = $sel.val() || [];
        const newVal = val.filter(n => n !== name);
        $sel.val(newVal).trigger('change.select2');
    });

    /* 2.  remove the reverse links in allyMap */
    Object.keys(allyMap).forEach(stack => allyMap[stack].delete(name));
    delete allyMap[name];

    /* 3.  remove the node itself */
    stackNode.remove();

    /* 4.  now refresh the selects with the correct list of stacks */
    refreshAllianceSelect();
    updateErrorBar();
}

	function initStrategies($target) {
    $target.select2({ data: $.map(strats, (v, k) => ({ id: k, text: k })) })
           .val('None')
           .trigger('change');
}

	function init() {
		addInitialEventHandlers();
		addStack(); // Add initial stack 1
		addStack(); // Add initial stack 2
	
for (var unitId in units) {
    if (units[unitId].unit_role_id === 'player_general') {
        generalIds.push(unitId);
    }
}
	}

	init();
    

    // -------------  ERROR BAR  -------------

function updateErrorBar() {
    // clear all icons
    errorBar.innerHTML = '';

    // 1. Defender check
    const defendingStacks = Array.from(document.querySelectorAll('.stack'))
                                 .filter(s => s.querySelector('input[name="is-defending"]').checked);
    if (defendingStacks.length === 0) addIcon('NO_DEFENDER');

    // 2. Total unit count
    let totalUnits = 0;
    document.querySelectorAll('.stack tbody tr').forEach(tr => {
        totalUnits += Number(tr.querySelector('.quantity-cell').value || 0);
    });
    if (totalUnits > 1000) addIcon('TOO_MANY_UNITS');

    // 3. Simulation count
    const sims = Number(document.getElementById('times').value || 0);
    if (sims > 10000) addIcon('HIGH_SIMS');
    else if (sims < 1000) addIcon('LOW_SIMS');

    // 4. Empty stacks
    const emptyStacks = Array.from(document.querySelectorAll('.stack'))
                             .filter(s => s.querySelectorAll('tbody tr').length === 0);
    if (emptyStacks.length) addIcon('EMPTY_STACK');

    // 5. No strategy
    const noStratStacks = Array.from(document.querySelectorAll('.stack'))
                           .filter(s => {
                               const sel = s.querySelector('.select2-strategies');
                               return sel && sel.value === 'None';
                           });
    if (noStratStacks.length) addIcon('NO_STRAT');

    // 6. All stacks allied
    const stackNames = Array.from(document.querySelectorAll('.stack'))
                            .map(s => s.querySelector('.stack-title').textContent.trim());
    const allAllied = stackNames.every(a =>
        stackNames.every(b => a === b || allyMap[a + b])
    );
    if (stackNames.length > 1 && allAllied) addIcon('ALL_ALLIED');

    // 7. Too few stacks
    const stacksCount = document.querySelectorAll('.stack').length;
    if (stacksCount <= 1) addIcon('TOO_FEW_STACKS');

    // 8. Buildings not defending
    // 8. Non-defending stacks with buildings
document.querySelectorAll('.stack').forEach(stack => {
    const isDefending = Array.from(stack.querySelectorAll('input[name="is-defending"]'))
                             .some(input => input.checked);

    if (!isDefending) {
        const hasBuilding = Array.from(stack.querySelectorAll('tbody tr')).some(tr => {
            const unitName = tr.querySelector('img[data-unitid]')?.dataset.unitid?.trim();
            if (!unitName) return false;

            const unit = units[unitName];  // your units object
            return unit?.unit_role_id?.startsWith('building');
        });

        if (hasBuilding) addIcon('BUILDING_NOT_DEFENDING');
    }
});


}

function addIcon(key) {
    const { icon, msg, level, name } = ERROR_LEVELS[key];

    const label = name;

    const wrapper = document.createElement('div');
    wrapper.className = 'tooltip-wrapper';

    const i = document.createElement('i');
    i.className = `fa-solid ${icon} fa-icon`;
    i.style.color = level === 'error'   ? '#e74c3c'
                  : level === 'warning' ? '#f39c12'
                                        : '#3498db';

    const tooltip = document.createElement('div');
    tooltip.className = `tooltip tooltip-${level}`;
    tooltip.innerHTML = `<strong><i class="fa-solid ${icon}"></i> ${label}</strong><br>${msg}`;

    wrapper.appendChild(i);
    wrapper.appendChild(tooltip);
    errorBar.appendChild(wrapper);
}



// Hook into any event that can change rules
['change', 'drop', 'keyup'].forEach(evt =>
    document.addEventListener(evt, updateErrorBar, true)
);
$(document)
  .on('change', '.select2-allies', updateErrorBar)   // allies combobox
  .on('change', '.select2-strategies', updateErrorBar);

updateErrorBar(); // initial run


window.getUpgradeData = stackName => currentStacks[stackName];
   window.setUpgradeData = (stackName, globalUpgrades, generalUpgrades) => {
    currentStacks[stackName].upgrades        = globalUpgrades;
    currentStacks[stackName].generalUpgrades = generalUpgrades;
    refreshStack(stackName);
    refreshUpgradeLabel(stackName);
};

    window.refreshUnitList = refreshUnitList;
}

// The require(['select2'], function () { ... }); part is typical for RequireJS.
// For a simple HTML file, you can just call initSimulator directly once the document is ready.
$(document).ready(function () {
	initSimulator();
});