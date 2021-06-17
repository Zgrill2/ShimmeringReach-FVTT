import { SRActor } from '../actor/Actor.js';
import { SRItem } from '../item/Item.js';



async function customAttackDialog(options) {
	const template = "systems/shimmeringreach/templates/dialog/attack-dialog.html";
	
	/**
	Coming in with the following data if attack
	Weapon
	Actor
	"attack"
	*/
	let weapon = findWeaponByID(options.weapon,options.actor);
	
	let localOptions = {
		dv: weapon.data.dv,
		dicepool: weapon.data.dicepool,
		weaponName: weapon.name
	}
	let confirmed = false;
	let d = new Dialog({
		title: "Custom Attack Roll",
		content: await renderTemplate(template,localOptions),
		buttons: {
		roll: {
		icon: '<i class="fas fa-check"></i>',
		label: "Roll",
		callback: () => confirmed = true
		},
		abort: {
		icon: '<i class="fas fa-times"></i>',
		label: "Cancel",
		callback: () => confirmed = false
		}
		},
		default: "abort",
		render: html => console.log("Register interactivity in the rendered dialog"),
		close: html =>{

			console.log("This always is logged no matter which option is chosen")
			
			if(confirmed) {
				options.dvMod = parseInt(html.find('[name=dvMod]')[0].value);
				options.dicepoolMod = parseInt(html.find('[name=dicepoolMod]')[0].value);
				
				console.log('wounds',html.find('[name=chk-wounds]')[0].checked);
				if(html.find('[name=chk-wounds]')[0].checked)
				{
					options.wounds = true;
				}
				if(html.find('[name=chk-explode]')[0].checked)
				{
					options.explode = true;
				}
				
				console.log(options);
				srChatMessage(options);
			}
		}
	});
	d.render(true);
	
}

function findWeaponByID(stringID, actor) {
	
	let weapon = "";
	Object.entries(actor.data.items).forEach(weapn => {
		if (stringID == weapn[1]._id){
			weapon = weapn[1];
		}
	});
	return weapon;
}

function getSelectedActors() {
	let actor_list = [];
		
		if(canvas.tokens.controlled.length == 0 && game.users.current.data.character)
		{
			let result = game.actors.map(x => x).filter(actor => {
				return actor.data._id == game.users.current.data.character;
			});
			actor_list.push(result);
		}
		else if(canvas.tokens.controlled.length > 0)
		{
			
			//fix this for tokens that are NOT linked to actors
			Object.entries({...canvas.tokens.controlled}).forEach(token => {
				actor_list.push(token[1].actor);
			});
			console.log("actor list",actor_list);
			console.log("Selecting at least one token",);
		}
		else{
			ui.notifications.warn("Select a token to use this function.");
		}
		return actor_list;
}

export function srChatMessage(options) {
		
		let chatData = [];
		if(options.type == "attack"){
			options.weapon = findWeaponByID(options.weapon_id,options.actor)
			if(!options.shift){
				renderAttackChatData(options);				
			}
			else{
				customAttackDialog(options);
			}
		}
		else if (options.type == "defense") {
			console.log("calling defense");
			options.defender_list = getSelectedActors();
			options.tokens = {...canvas.tokens.controlled};
			console.log("game",canvas);
			
			if(!options.shift){
				chatData = addDefenseMessages(options);
			}
			else {
			}
		}
		else {
			ui.notifications.error("Unhandled message type");
		}
		
	};
	
async function renderAttackChatData(options){
		
		const template = "systems/shimmeringreach/templates/chat/attack-card.html";
		console.log("atk item",options.weapon);
		
		let newdp = (options.weapon.data.dicepool + (options.dicepoolMod ? options.dicepoolMod : 0))
		let diceroll = new RollDP( newdp, options.actor.data.data, options.explode, options.wounds).evaluate();
		
		let q = diceroll.terms[0].results;
		q.sort((a, b) => {
			return (b.result - a.result);
		});
		console.log("actor",options.actor);
		let attacker_info = {
			actor: options.actor.data,
			weapon: options.weapon,
			diceroll: diceroll,
			dicepoolMod: (options.dicepoolMod ? options.dicepoolMod : 0),
			dvMod: (options.dvMod ? options.dvMod : 0),
			display_dv: options.weapon.data.dv + (options.dvMod ? options.dvMod : 0),
			display_hits: diceroll._total 
		}
		let combatInfo = {
			attacker: attacker_info
		}
			
		let chatData = {
			user: game.user._id,
			content: await renderTemplate(template,combatInfo),
			flags:{ "shimmeringreach": combatInfo}
		}
		
		let msg = ChatMessage.create(chatData);
		console.log("msg",msg);
}

async function addDefenseMessages(options){
	const template = "systems/shimmeringreach/templates/chat/attack-card.html";
		
	let old_defenders = (options.message.getFlag("shimmeringreach","defenders") ? options.message.getFlag("shimmeringreach","defenders") : []);
		
	let defenders = [];
	
	if (old_defenders.length !=0){
		Object.entries(old_defenders).forEach(defender => {
			defenders.push(defender[1]);
		});
	}
	
	Object.entries(options.defender_list).forEach(actor => {
		
		
		let present = false;
		
		Object.entries(old_defenders).forEach(old_actor => {
			
			if (actor[1].token && actor[1].token.data._id == old_actor[1].token_id){
				//Found token, skipping
				present = true;
			}
			else if (!(old_actor[1].token_id) && actor[1].data._id == old_actor[1].actor._id){
				//Found actor, skipping
				present = true;
			}
		});
		
		if (!present){
			
			let defenseDP = actor[1].data.data.defenses[options.defense_type][options.defense_state];
			
			let diceroll = new RollDP( defenseDP + (options.dicepoolMod ? options.dicepoolMod : 0), actor[1].data.data, options.explode, options.wounds).evaluate();
			
			let q = diceroll.terms[0].results;
			q.sort((a, b) => {
				return (b.result - a.result);
			});
			
			let defenderOptions = {
				actor: actor[1].data,
				defense_type: options.defense_type,
				defense_state: options.defense_state,
				dicepoolMod: (options.dicepoolMod ? options.dicepoolMod : 0),
				diceroll: diceroll
			};
			
			if(actor[1].token){
				defenderOptions.token_id = actor[1].token.data._id;
			}
			
			defenders.push(defenderOptions);
		}
	});
	
	await options.message.setFlag("shimmeringreach","defenders",defenders);
	
	await updateCombatantFlags(options.message);
	let combatInfo = 
		{
			attacker: await options.message.getFlag("shimmeringreach","attacker"),
			defenders: await options.message.getFlag("shimmeringreach","defenders")
		}
	options.message.update({"content": await renderTemplate(template,combatInfo)});
}

async function updateCombatantFlags(message) {
	let attacker = message.getFlag("shimmeringreach","attacker");
	let defenders = message.getFlag("shimmeringreach","defenders");
	
	console.log(attacker);
	
	const display_dv = attacker.weapon.data.dv + attacker.dvMod;
	const display_hits = attacker.diceroll.total; //Future proofing for when abilities can add free hits
	
	attacker.display_dv = display_dv;
	attacker.display_hits = display_hits;
	
	
	console.log("defenders befpre",defenders);
	
	Object.entries(defenders).forEach(defender => {
		const d_display_hits = defender[1].diceroll.total; //Future proofing for when abilities can add free hits
		defender[1].display_hits = d_display_hits;
		if ( display_hits > d_display_hits) {
			defender[1].avoided = false;
			defender[1].net_hits = display_hits - d_display_hits;
			console.log("attacker weapon",attacker.weapon.data.soak);
			console.log("indexing",defender[1].actor.data.soaks);
			let damage = display_hits - d_display_hits + display_dv - defender[1].actor.data.soaks[attacker.weapon.data.soak].value;
			console.log("damage",damage);
			if ( damage > 0){
				defender[1].damage = damage;
			}
			else {
				defender[1].damage = null;
			}
		}
		else{
			defender[1].avoided = true;
			defender[1].net_hits = null;
		}
	});
	console.log("defenders after",defenders);
	//await message.setFlag("shimmeringreach","attacker", attacker);
	//await message.setFlag("shimmeringreach","defenders",defenders);
	
	
}


async function deleteDefenderMessage(id){
	
}
