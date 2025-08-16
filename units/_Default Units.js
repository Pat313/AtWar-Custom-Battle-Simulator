window.units = {
	"General": {
		image: " img/units/general.jpg",
		max_attack: 1,
		max_defence: 1,
		hp: 1,
		crit: 0,
		unit_role_id: "player_general",
		defbonus: []
	},
	"Militia": {
		image: " img/units/militia.jpg",
		max_attack: 3,
		max_defence: 4,
		hp: 7,
		crit: 0,
		unit_role_id: "ground_secondary_defence",
		"defbonus": [
  			{ unit_id: "Helicopters", defbonus: -1 },
		]
	},
	"Infantry": {
		image: " img/units/infantry.jpg",
		max_attack: 4,
		max_defence: 6,
		hp: 7,
		crit: 5,
		unit_role_id: "ground_main_defence",
		defbonus: [
			{ unit_id: "Helicopters", defbonus: -2 },
		]
	},
	"Tanks": {
		image: " img/units/tanks.jpg",
		max_attack: 8,
		max_defence: 4,
		hp: 7,
		crit: 5,
		unit_role_id: "ground_main_attack",
		defbonus: []
	},
	"Marines": {
		image: " img/units/marines.jpg",
		max_attack: 7,
		max_defence: 3,
		hp: 7,
		crit: 5,
		unit_role_id: "ground_stealth",
		defbonus: [
			{ unit_id: "Infantry", defbonus: 1 },
		]
	},
	"Anti-aircraft": {
		image: " img/units/anti-aircraft.jpg",
		max_attack: 1,
		max_defence: 3,
		hp: 7,
		crit: 5,
		unit_role_id: "ground_special_defence",
		defbonus: [
			{ unit_id: "Sentry Plane", defbonus: 8 },
			{ unit_id: "Air Transport", defbonus: 8 },
			{ unit_id: "Bombers", defbonus: 8 },
			{ unit_id: "Stealth", defbonus: 8 },
			{ unit_id: "Helicopters", defbonus: 8 },
		]
	},
	"Submarine": {
		image: " img/units/submarine.jpg",
		max_attack: 7,
		max_defence: 5,
		hp: 7,
		crit: 5,
		unit_role_id: "naval_stealth",
		defbonus: []
	},
	"Transport": {
		image: " img/units/transport.jpg",
		max_attack: 1,
		max_defence: 2,
		hp: 7,
		crit: 5,
		unit_role_id: "naval_transport",
		defbonus: []
	},
	"Destroyer": {
		image: " img/units/destroyer.jpg",
		max_attack: 9,
		max_defence: 7,
		hp: 7,
		crit: 5,
		unit_role_id: "naval_main_attack",
		defbonus: [
			{ unit_id: "Bombers", defbonus: 1 },
		]
	},
	"Bombers": {
		image: " img/units/bombers.jpg",
		max_attack: 6,
		max_defence: 6,
		hp: 7,
		crit: 5,
		unit_role_id: "air_main_attack",
		defbonus: []
	},
	"Stealth": {
		image: " img/units/stealth.jpg",
		max_attack: 7,
		max_defence: 4,
		hp: 7,
		crit: 5,
		unit_role_id: "air_stealth",
		defbonus: []
	},
	"Helicopters": {
		image: " img/units/helicopters.jpg",
		max_attack: 6,
		max_defence: 4,
		hp: 7,
		crit: 5,
		unit_role_id: "air_special_attack",
		defbonus: []
	},
	"Sentry Plane": {
		image: " img/units/sentry plane.jpg",
		max_attack: 1,
		max_defence: 4,
		hp: 7,
		crit: 0,
		unit_role_id: "air_support",
		defbonus: []
	},
	"Air Transport": {
		image: " img/units/air transport.jpg",
		max_attack: 1,
		max_defence: 2,
		hp: 7,
		crit: 5,
		unit_role_id: "air_transport",
		defbonus: []
	},
	"Coastal Battery": {
		image: " img/units/coastal battery.jpg",
		max_attack: 0,
		max_defence: 1,
		hp: 20,
		crit: 5,
		unit_role_id: "building_other",
		"defbonus": [
			{ unit_id: "Sentry Plane", defbonus: 20 },
		]
	},
	"Recruitment Center": {
		image: " img/units/recruitment center.jpg",
		max_attack: 0,
		max_defence: 1,
		hp: 20,
		crit: 0,
		unit_role_id: "building_reinforcement",
		"defbonus": []
	},
	"Fortifications": {
		image: " img/units/fortifications.jpg",
		max_attack: 0,
		max_defence: 2,
		hp: 20,
		crit: 0,
		unit_role_id: "building_defence",
		"defbonus": []
	},
	"Radar Array": {
		image: " img/units/radar array.jpg",
		max_attack: 0,
		max_defence: 1,
		hp: 20,
		crit: 0,
		unit_role_id: "building_other",
		"defbonus": []
	},
	"Anti-Aircraft Defences": {
		image: " img/units/anti-aircraft defences.jpg",
		max_attack: 0,
		max_defence: 1,
		hp: 20,
		crit: 5,
		unit_role_id: "building_other",
		"defbonus": [
			{ unit_id: "Sentry Plane", defbonus: 20 },
			{ unit_id: "Stealth", defbonus: 20 },
			{ unit_id: "Bombers", defbonus: 20 },
			{ unit_id: "Air Transport", defbonus: 20 },
		]
	},
	"Bank": {
		image: " img/units/bank.jpg",
		max_attack: 0,
		max_defence: 1,
		hp: 20,
		crit: 0,
		unit_role_id: "building_other",
		"defbonus": []
	},
	"Custom Infantry": {
		image: " img/units/infantry.jpg",
		max_attack: 5,
		max_defence: 8,
		hp: 10,
		crit: 20,
		unit_role_id: "ground_main_defence",
		defbonus: []
	},
	// Add more units as needed
};