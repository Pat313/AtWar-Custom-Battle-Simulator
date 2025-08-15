function initSimulator() {
	var DEFAULT_COUNT_OF_UNITS = 5;
	var BATTLE_SIMULATOR_URL =
		'https://nnbu2q2491.execute-api.us-east-1.amazonaws.com/default/BattleRequest      ';
	var ALL_UNITS_KEY = '*';

	var unitTemplate = document.getElementById('unitrow-template');
	var unitDefTemplate = document.getElementById('defbonus-template');
	var stackTemplate = document.getElementById('stack-template');

	var stackContainer = document.getElementById('stack-container');
	var battleResults = document.getElementById('battle-results');
	var currentStacks = {};
	var currentStackNum = 1;

	var generalId = null;
	var unitBeingDragged = null;

	function replaceAll(string, variables) {
		var keys = [];
		for (var key in variables) {
			if (variables.hasOwnProperty(key)) {
				keys.push('\\' + key); // to escape the $ variable sign.
			}
		}
		var re = new RegExp(keys.join('|'), 'gi');
		return string.replace(re, function (matched) {
			return variables[matched];
		});
	}

	function renderTemplate(template, variables) {
		return replaceAll(template.innerHTML, variables);
	}

	// Events

	function onDragUnit(event) {
		unitBeingDragged = event.target;
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
	}

	function createAllyMap() {
		var allyMap = {};

		stackContainer.querySelectorAll('.stack').forEach(function (stack) {
			var name = stack.querySelector('.stack-title').innerHTML;
			var allies = $(stack.querySelector('.select2-allies')).select2('data');

			for (var idx = 0; idx < allies.length; idx++) {
				var value = allies[idx].text;
				allyMap[name + value] = true;
				allyMap[value + name] = true;
			}
		});
		return allyMap;
	}

	function onSubmit() {
$('#loading-icon').show();          // show spinner
    try {
        var stacks = {};
        var times = Number(document.getElementById('times').value);
        var data = { times: times, stacks: stacks };
        var allyMap = createAllyMap();

        stackContainer.querySelectorAll('.stack').forEach(function (stack) {
            var unitsMap = {};
            var name = stack.querySelector('.stack-title').innerHTML.trim();
            var isDefending = stack.querySelector('input[name="is-defending"]').checked;
            var isInCity = stack.querySelector('input[name="in-city"]').checked;
            var isInDefenceLine = stack.querySelector('input[name="in-defence-line"]').checked;

            var stratId = $(stack).find('.select2-strategies').val();
            var currentStrategy = strats[stratId];
            var hasGeneral = stack.querySelector('tr[data-unitid="' + generalId + '"]');

            stack.querySelectorAll('tbody tr').forEach(function (unitRow) {
                var unitId = unitRow.dataset.unitid;
                var count = Number(unitRow.querySelector('.quantity-cell').value);
                var currentUnit = units[unitId];

                if (!currentUnit) {
                    console.error("Missing unit data for ID:", unitId);
                    return;
                }

                // Use unit ID as the key
                unitsMap[unitId] = {
                    attack: Number(currentUnit.max_attack),
                    defense: Number(currentUnit.max_defence),
                    hp: Number(currentUnit.hp),
                    critical: Number(currentUnit.crit),
                    count: count,
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
                    hasGeneral
                );

                unitsMap[unitId].attack += improvement.attack;
                unitsMap[unitId].defense += improvement.defence;
                unitsMap[unitId].critical += improvement.critical;
                unitsMap[unitId].hp += improvement.hp;
            });

            // Build enemies list
            var enemies = [];
            for (var allyName in currentStacks) {
                if (name !== allyName && !allyMap[allyName + name]) {
                    enemies.push(allyName);
                }
            }

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

    /* 2. role-based bonuses – keep the existing loop unchanged */
    var attackers = [];
    for (var unit in units) {
        var currentUnit = units[unit];
        if (
            currentUnit['unit_role_id'] == defbonus['attacking_unit_role_id'] ||
            unit == defbonus['attacking_unit_id']
        ) {
            attackers.push(units[unit]);
        }
    }
    $.each(attackers, function (index, attacker) {
        bonuses.push({
            unit_id: attacker['unit_id'],
            name: 'against ' + attacker.name,
            image: attacker['image'],
            defbonus: defbonus['defence_bonus'],
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
        if (bonus.unit_id === "in_own_city" || bonus.unit_id === "in_defence_line") {
            createDefBonus(bonus).forEach(function (disp) {
                defcell.append(
                    renderTemplate(unitDefTemplate, {
                        $name: disp.name,
                        $image: disp.image,
                        $bonus:
                            '<span class="' +
                            (disp.defbonus > 0 ? 'green' : 'lightred') +
                            '">' +
                            (disp.defbonus > 0 ? '+' : '') +
                            disp.defbonus +
                            '</span>'
                    })
                );
            });
        } else {
            var label = 'against ' + bonus.unit_id;
            var img = (units[bonus.unit_id] && units[bonus.unit_id].image);

		defcell.append(
                    renderTemplate(unitDefTemplate, {
                        $name: label,
                        $image: img,
                        $bonus:
                            '<span class="' +
                            (bonus.defbonus > 0 ? 'green' : 'lightred') +
                            '">' +
                            (bonus.defbonus > 0 ? '+' : '') +
                            bonus.defbonus +
                            '</span>'
                    })
                );

        }
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

	function getUnitImprovements(
    currentUnit,
    strategy,
    inCity,
    inDefenceLine,
    hasGeneral,
    enableUpgrades,
    buildingBuff,
    chosenUpgrades,
    chosenGeneralUpgrades,
) {
    var improvement = $.extend({}, defaultImprovement);

    // --- apply general & upgrades---
    if (hasGeneral) {
        improvement = mergeImprovement(improvement, generalUpgrades[ALL_UNITS_KEY]);
        if (generalUpgrades[currentUnit.unit_role_id]) {
            improvement = mergeImprovement(improvement, generalUpgrades[currentUnit.unit_role_id]);
        }
    }

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
if (hasGeneral && Array.isArray(chosenGeneralUpgrades)) {
  chosenGeneralUpgrades.forEach(key => {
    const bonusObj = generalUpgrades[key];
    if (!bonusObj) return;

    const bonus = bonusObj[currentUnit.unit_role_id] || bonusObj['*'];
    if (bonus) {
      improvement = mergeImprovement(improvement, bonus);
    }
  });
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
	var hasGeneral = Boolean(currentStack.units[generalId]);
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

var chosenGeneralUpgrades = (hasGeneral && enableUpgrades)
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
			hasGeneral,
			enableUpgrades,
			buildingBuff,
			chosenUpgrades,
    			chosenGeneralUpgrades,
		);
		applyStratImprovementsToUnitRow(unitrow, currentUnit, unitImprovement);
	});
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
  (generalId === unitId ||
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
		var stackName = event.currentTarget.dataset.name;
		var unitId = unitBeingDragged.dataset.unitid;
		currentStacks[stackName].units[unitId] = {};
		refreshStack(stackName);
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
    var allyData = Object.keys(currentStacks).map(function (name) {
        return { id: name, text: name };
    });

    $('.stack').each(function () {
        var $sel    = $(this).find('.select2-allies');
        var selVals = $sel.val() || [];
        var myName  = $(this).find('.stack-title').text();
        var newData = allyData.filter(function (item) {
            return item.text !== myName;
        });

        // only touch it if it is already a Select2 instance
        if ($sel.hasClass('select2-hidden-accessible')) {
            $sel.select2('destroy');
        }

        $sel.empty()
            .select2({ data: newData, placeholder: 'Click to add an ally stack' })
            .val(selVals).trigger('change');
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
	}

	function addInitialEventHandlers() {
    document.querySelector('.stack-add').addEventListener('click', addStack);

    var unitsList = document.getElementById('units-list');
    Object.keys(units)
        .sort()                                    // alphabetical order
        .forEach(function(unitId) {
            var unit = units[unitId];
            var listItem = document.createElement('li');

            var img = document.createElement('img');
            img.src = unit.image;
            img.draggable = true;
            img.dataset.unitid = unitId;
            img.title = unitId;
            img.addEventListener('dragstart', onDragUnit);

            listItem.appendChild(img);
            listItem.appendChild(document.createTextNode(unitId));
            unitsList.appendChild(listItem);
        });

document.getElementById('submit-button')
        .addEventListener('click', onSubmit);
}

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
    initStrategies();
}

function removeStack(evt) {
    var stackNode = evt.currentTarget.closest('.stack'); // the .stack div
    var name = stackNode.querySelector('.stack-title').innerHTML;

    delete currentStacks[name];
    stackNode.remove();               // remove only this .stack
    refreshAllianceSelect();
}

	function initStrategies() {
    var stratOptions = $.map(strats, function (val, key) {
        return { id: key, text: key };
    });

    var node = $('.select2-strategies').select2({ data: stratOptions });
    node.on('change', onStratChange);
    node.val('None').trigger('change');

$('.select2-allies').each(function () {
    $(this).select2({
      placeholder: 'Click to add an ally stack'
    });
  });
}

	function init() {
		addInitialEventHandlers();
		addStack(); // Add initial stack 1
		addStack(); // Add initial stack 2
	
for (var unitId in units) {
    var unit = units[unitId];
    if (unit['unit_role_id'] === "player_general") {
        generalId = unitId;
        break;
    }
}
	}

	init();

$(document).on('click', '.gear-icon', function () {
    const $stack = $(this).closest('.stack');
    const stackName = $stack.find('.stack-title').text();
    const $modal = $stack.find('.upgrade-modal');
    fillUpgradeModal($modal, stackName);
    $modal.fadeIn(150);
})
  .on('click', '.modal-close', function () {
    $(this).closest('.upgrade-modal').fadeOut(150);
  })
  .on('click', '.btn-apply', function () {
  const $modal   = $(this).closest('.upgrade-modal');
  const $stack   = $modal.closest('.stack');
  const stackName = $stack.find('.stack-title').text();

  // collect separately
  const chosenGlobals = $modal.find('.global-upgrades input[type=checkbox]:checked')
                              .map((_, el) => el.value).get();
  const chosenGenerals = $modal.find('.general-upgrades input[type=checkbox]:checked')
                               .map((_, el) => el.value).get();

  currentStacks[stackName].upgrades = chosenGlobals;
  currentStacks[stackName].generalUpgrades = chosenGenerals;

  $modal.fadeOut(150);
  refreshStack(stackName);
})
  .on('click', '.upgrade-desc-toggle', function () {
    $(this).next('.upgrade-desc').slideToggle(150);
});

function fillUpgradeModal($modal, stackName) {
    // If nothing was saved, default to all keys ON
    const activeGlobals = currentStacks[stackName].upgrades || Object.keys(upgrades);
    const activeGenerals = currentStacks[stackName].generalUpgrades || Object.keys(generalUpgrades);

    // Helper to build HTML from a given object
    function buildList(sourceObj, activeKeys) {
  return Object.keys(sourceObj).map(key => {
    const item = sourceObj[key];
    const img = item.image || 'https://dummyimage.com/40x27/8c8c8c/ffffff&text=error';
    const desc = item.description || 'No description available.';
    const checked = activeKeys.includes(key) ? 'checked' : '';

    return `
      <div class="upgrade-item">
        <div class="upgrade-row">
          <img src="${img}"">
          <span>${key}</span>
          <input type="checkbox" value="${key}" ${checked}>
          <span class="upgrade-desc-toggle" title="Details">ℹ️</span>
        </div>
        <div class="upgrade-desc">${desc}</div>
      </div>`;
  }).join('');
}

$modal.find('.upgrade-desc-toggle').off('click').on('click', function () {
  $(this).next('.upgrade-desc').slideToggle(150);
});

    // Populate the modal with global and general upgrades
    $modal.find('.global-upgrades').html(buildList(upgrades, activeGlobals));
    $modal.find('.general-upgrades').html(buildList(generalUpgrades, activeGenerals));

$modal.off('click', '.upgrade-desc-toggle').on('click', '.upgrade-desc-toggle', function () {
  $(this).closest('.upgrade-item').find('.upgrade-desc').slideToggle(150);
});

    // Attach event listeners to "Select All" checkboxes
    $modal.on('change', '.select-all-global', function () {
        const checked = $(this).is(':checked');
        $modal.find('.global-upgrades input[type=checkbox]').prop('checked', checked);
    });

    $modal.on('change', '.select-all-general', function () {
        const checked = $(this).is(':checked');
        $modal.find('.general-upgrades input[type=checkbox]').prop('checked', checked);
    });
}

}

// The require(['select2'], function () { ... }); part is typical for RequireJS.
// For a simple HTML file, you can just call initSimulator directly once the document is ready.
$(document).ready(function () {
	initSimulator();
});