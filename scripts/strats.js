var strats = {
	"Blitzkrieg": {
		"*": { attack: 0, defence: -1, hp: 0, critical: 0, defbonus: [] },
		"ground_main_defence": { attack: 0, defence: 0, hp: 0, critical: 0, defbonus: [
			{ unit_id: "in_own_city", defbonus: -1 },
		] },
	},
	"Covert Operation": {
		"ground_main_defence": { attack: 0, defence: -1, hp: 0, critical: 0, defbonus: [] },
		"ground_main_attack": { attack: -2, defence: 0, hp: 0, critical: 0, defbonus: [] },
		"air_main_attack": { attack: -1, defence: 0, hp: 0, critical: 0, defbonus: [] },
		"air_special_attack": { attack: 2, defence: 0, hp: 0, critical: 0, defbonus: [
			{ unit_id: "air_stealth", defbonus: 1 },
		] },
	},
	"Desert Storm": {
		"ground_main_defence": { attack: -1, defence: -1, hp: 0, critical: 0, defbonus: [] },
		"ground_main_attack": { attack: -1, defence: -1, hp: 0, critical: 0, defbonus: [] },
		"ground_stealth": { attack: -3, defence: 3, hp: 0, critical: 0, defbonus: [
			{ unit_id: "ground_main_defence", defbonus: -1 },
		] },
		"naval_stealth": { attack: -2, defence: 2, hp: 0, critical: 0, defbonus: [] },
	},
	"Great Combinator": {
		"ground_main_defence": { attack: -2, defence: 0, hp: 1, critical: 0, defbonus: [] },
		"ground_main_attack": { attack: 0, defence: -2, hp: 1, critical: 0, defbonus: [] },
	},
	"Guerrilla Warfare": {
		"ground_secondary_defence": { attack: 1, defence: 1, hp: 0, critical: 2, defbonus: [] },
		"ground_main_defence": { attack: -2, defence: -2, hp: 0, critical: 0, defbonus: [] },
		"ground_main_attack": { attack: -2, defence: -2, hp: 0, critical: 0, defbonus: [] },
	},
	"Hybrid Warfare": {
		"ground_secondary_defence": { attack: 1, defence: -1, hp: 0, critical: 0, defbonus: [] },
		"ground_main_defence": { attack: -3, defence: 1, hp: 0, critical: 0, defbonus: [] },
		"ground_main_attack": { attack: 1, defence: -3, hp: 0, critical: 0, defbonus: [] },
		"ground_stealth": { attack: -1, defence: -1, hp: 0, critical: 0, defbonus: [
			{ unit_id: "in_defence_line", defbonus: -1 },
			{ unit_id: "in_own_city", defbonus: -1 },
		] },
		"naval_stealth": { attack: -2, defence: -2, hp: 0, critical: 0, defbonus: [] },
		"air_main_attack": { attack: -2, defence: -2, hp: 0, critical: 0, defbonus: [] },
		"air_stealth": { attack: -2, defence: -2, hp: 0, critical: 0, defbonus: [] },
	},
	"Imperialist": {
		"*": { attack: -1, defence: 0, hp: 0, critical: 0, defbonus: [] },
		"ground_secondary_defence": { attack: 0, defence: 0, hp: 0, critical: 0, defbonus: [
			{ unit_id: "in_defence_line", defbonus: 1 },
			{ unit_id: "in_own_city", defbonus: 1 },
		] },
	},
	"Insurrection": {
		"ground_secondary_defence": { attack: 1, defence: 0, hp: 1, critical: 0, defbonus: [] },
		"ground_main_attack": { attack: -1, defence: 0, hp: 0, critical: 0, defbonus: [] },
		"ground_stealth": { attack: -1, defence: 0, hp: 0, critical: 0, defbonus: [] },
		"naval_stealth": { attack: -1, defence: 0, hp: 0, critical: 0, defbonus: [] },
		"naval_main_attack": { attack: -1, defence: 0, hp: 0, critical: 0, defbonus: [] },
		"air_main_attack": { attack: -1, defence: 0, hp: 0, critical: 0, defbonus: [] },
		"air_special_attack": { attack: -1, defence: 0, hp: 0, critical: 0, defbonus: [] },
		"air_stealth": { attack: -1, defence: 0, hp: 0, critical: 0, defbonus: [] },
	},
	"Iron Fist": {
		"*": { attack: 0, defence: 0, hp: 2, critical: 0, defbonus: [] },
	},
	"Logistic Wizard": {
		"naval_transport": { attack: 0, defence: 1, hp: 2, critical: 0, defbonus: [] },
		"naval_main_attack": { attack: -7, defence: 1, hp: 0, critical: 0, defbonus: [] },
		"air_main_attack": { attack: -3, defence: 2, hp: 0, critical: 0, defbonus: [] },
		"air_transport": { attack: 0, defence: 1, hp: 2, critical: 0, defbonus: [] },
	},
	"Lucky Bastard": {
		"*": { attack: 0, defence: 0, hp: 0, critical: 10, defbonus: [] },
	},
	"Master of Stealth": {
		"ground_main_attack": { attack: -1, defence: -1, hp: 0, critical: 0, defbonus: [] },
		"ground_stealth": { attack: 1, defence: 0, hp: 0, critical: 0, defbonus: [] },
		"naval_stealth": { attack: 2, defence: 1, hp: 0, critical: 2, defbonus: [] },
		"naval_main_attack": { attack: -1, defence: -1, hp: 0, critical: 0, defbonus: [] },
		"air_stealth": { attack: 2, defence: 0, hp: 0, critical: 2, defbonus: [] },
	},
	"Naval Commander": {
		"ground_main_attack": { attack: -1, defence: -1, hp: 0, critical: -2, defbonus: [] },
		"naval_stealth": { attack: 2, defence: 2, hp: 0, critical: 2, defbonus: [] },
		"naval_transport": { attack: 0, defence: 1, hp: 2, critical: 0, defbonus: [] },
		"naval_main_attack": { attack: 2, defence: 2, hp: 1, critical: 2, defbonus: [] },
	},
	"None": { },
	"Perfect Defence": {
		"ground_main_defence": { attack: 0, defence: 1, hp: 0, critical: 0, defbonus: [
			{ unit_id: "ground_main_attack", defbonus: 1 },
		] },
		"ground_secondary_defence": { attack: 0, defence: 1, hp: 0, critical: 2, defbonus: [] },
		"ground_main_attack": { attack: -1, defence: 0, hp: 0, critical: -2, defbonus: [] },
		"naval_main_attack": { attack: -1, defence: 0, hp: 0, critical: -2, defbonus: [] },
		"air_main_attack": { attack: -1, defence: 0, hp: 0, critical: -2, defbonus: [] },
	},
	"Sky Menace": {
		"ground_main_defence": { attack: -1, defence: 0, hp: 0, critical: -2, defbonus: [] },
		"ground_main_attack": { attack: -1, defence: -1, hp: 0, critical: -2, defbonus: [] },
		"air_main_attack": { attack: 2, defence: -1, hp: 0, critical: 2, defbonus: [] },
		"air_stealth": { attack: 2, defence: 0, hp: 0, critical: 0, defbonus: [] },
		"air_transport": { attack: 1, defence: 1, hp: 2, critical: 2, defbonus: [] },
	},
	// Add more strategies as needed
};
