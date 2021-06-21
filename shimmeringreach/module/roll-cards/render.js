import { SRActor } from '../actor/Actor.js';
import { SRItem } from '../item/Item.js';



export async function customAttackDialog(event,actor,options) {
	const template = "systems/shimmeringreach/templates/dialog/attack-dialog.html";
	
	
	console.log(options);
	let weapon_id = event.currentTarget.dataset.weapon;
	let weapon = findWeaponByID(weapon_id,actor);
	
	let localOptions = {
		weapon: weapon,
		actor: actor
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
				renderAttackChatData(event,actor,options);
			}
		}
	},
	{width: 300});
	d.render(true);
	
}

export async function customDefenseDialog(event,options) {
	const template = "systems/shimmeringreach/templates/dialog/defense-dialog.html";
	
	
	console.log(options);
	
	
	let dataset = event.currentTarget.dataset;
	let defense_type = dataset.defense;
	let defense_state = dataset.state;
	let message = game.messages.get(event.currentTarget.closest('[data-message-id]').dataset.messageId);
	let defender_list = getSelectedActors();
	
		
	let confirmed = false;
	let d = new Dialog({
		title: "Custom Defense Roll",
		content: await renderTemplate(template,{"defenders": defender_list}),
		buttons: {
		rollbutton: {
		icon: '<i class="fas fa-check"></i>',
		label: "Roll",
		callback: () => confirmed = true
		},
		abortbutton: {
		icon: '<i class="fas fa-times"></i>',
		label: "Cancel",
		callback: () => confirmed = false
		}
		},
		default: "abortbutton",
		render: html => console.log("Register interactivity in the rendered dialog"),
		close: html =>{

			console.log("This always is logged no matter which option is chosen")
			
			if(confirmed) {
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
				//renderAttackChatData(event,actor,options);
			}
		}
	},
	{width: 300});
	d.render(true);
	
}

function findWeaponByID(stringID, actor) {
	
	let weapon = "";
	Object.entries(actor.data.items).forEach(weapn => {
		//console.log(weapn);
		//console.log(stringID);
		if (stringID == weapn[1]._id){
			console.log("bloop");
			weapon = weapn[1];
			console.log(weapn[1]);
		}
	});
	//console.log(weapon);
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
			//console.log("actor list",actor_list);
			//console.log("Selecting at least one token",);
		}
		else{
			ui.notifications.warn("Select a token to use this function.");
		}
		return actor_list;
}
	
export async function renderAttackChatData(event, actor, options){
		
		let weapon_id = event.currentTarget.dataset.weapon;
		let weapon = findWeaponByID(weapon_id,actor);
		
		
		const template = "systems/shimmeringreach/templates/chat/attack-card.html";
		//console.log("atk item",options.weapon);
		
		let newdp = (weapon.data.dicepool + (options.dicepoolMod ? options.dicepoolMod : 0))
		let diceroll = new RollDP( newdp, actor.data.data, options.explode, options.wounds).evaluate();
		
		let q = diceroll.terms[0].results;
		q.sort((a, b) => {
			return (b.result - a.result);
		});
		//console.log("actor",options.actor);
		let attacker_info = {
			actor: actor.data,
			weapon: weapon,
			diceroll: diceroll,
			dicepoolMod: (options.dicepoolMod ? options.dicepoolMod : 0),
			dvMod: (options.dvMod ? options.dvMod : 0),
			display_dv: weapon.data.dv + (options.dvMod ? options.dvMod : 0),
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
		//console.log("msg",msg);
}

export async function addDefenseMessages(event,options){
	
	let dataset = event.currentTarget.dataset;
	let defense_type = dataset.defense;
	let defense_state = dataset.state;
	let message = game.messages.get(event.currentTarget.closest('[data-message-id]').dataset.messageId);
	let defender_list = getSelectedActors();
	let tokens = {...canvas.tokens.controlled};
	
	
	
	const template = "systems/shimmeringreach/templates/chat/attack-card.html";
		
	let old_defenders = (message.getFlag("shimmeringreach","defenders") ? message.getFlag("shimmeringreach","defenders") : {});
		
	let defenders = [];
	
	if (old_defenders.length !=0){
		Object.entries(old_defenders).forEach(defender => {
			defenders.push(defender[1]);
		});
	}
	
	Object.assign(defenders, old_defenders);
	
	Object.entries(defender_list).forEach(actor => {
		
		
		let present = false;
		//console.log(old_defenders);
		Object.entries(old_defenders).forEach(old_actor => {
			//console.log(old_actor);
			//console.log(actor);
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
			
			let defenseDP = actor[1].data.data.defenses[defense_type][defense_state];
			
			let diceroll = new RollDP( defenseDP + (options.dicepoolMod ? options.dicepoolMod : 0), actor[1].data.data, options.explode, options.wounds).evaluate();
			
			let q = diceroll.terms[0].results;
			q.sort((a, b) => {
				return (b.result - a.result);
			});
			
			let defenderOptions = {
				actor: actor[1].data,
				defense_type: defense_type,
				defense_state: defense_state,
				dicepoolMod: (options.dicepoolMod ? options.dicepoolMod : 0),
				diceroll: diceroll
			};
			//console.log("this is what diceroll looks like",diceroll);
			
			if(actor[1].token){
				defenderOptions.token_id = actor[1].token.data._id;
			}
			defenders.push(defenderOptions);
		}
	});
	
	let new_defenders = {};
	
	let i = 0;
	
	Object.entries(defenders).forEach(defender => {
		
		let q = i + "";
		
		new_defenders[q] = defender[1];
		i++;
		
	});
	
	//console.log("new defenders",new_defenders);
	
	await message.setFlag("shimmeringreach","defenders",new_defenders);
	
	await updateCombatantFlags(message);
	
	//await updateCombatContent(options.message);
	//console.log(options.message);
}

async function updateCombatContent(message){
	const template = "systems/shimmeringreach/templates/chat/attack-card.html";
	const combatInfo = 
		{
			attacker: await message.getFlag("shimmeringreach","attacker"),
			defenders: await message.getFlag("shimmeringreach","defenders")
		}
	message.update({"content": await renderTemplate(template,combatInfo)});
}


async function updateCombatantFlags(message) {
	//console.log("UCF message",message);
	const template = "systems/shimmeringreach/templates/chat/attack-card.html";
	let attacker = message.getFlag("shimmeringreach","attacker");
	let defenders = message.getFlag("shimmeringreach","defenders");
	
	//console.log("UPDATE FLAGS",attacker);
	
	const display_dv = attacker.weapon.data.dv + attacker.dvMod;
	const display_hits = attacker.diceroll.total + (attacker.reroll ? attacker.reroll.total : 0); //Future proofing for when abilities can add free hits
	
	attacker.display_dv = display_dv;
	attacker.display_hits = display_hits;
	
	//console.log("defenders befpre",defenders);
	
	let defender_holder = [];
	
	let new_defenders = {};
	
	if (defenders != undefined){
		
		let i = 0;
		
		Object.entries(defenders).forEach(defender => {
			const d_display_hits = defender[1].diceroll._total + (defender[1].reroll ? defender[1].reroll.total : 0); //Future proofing for when abilities can add free hits
			defender[1].display_hits = d_display_hits;
			//console.log("defender", defender[0], defender[1]);
			//console.log("ddisplay hits",d_display_hits);
			
			if ( display_hits > d_display_hits) {
				
				
				//defender[1].update({"avoided" : false});
				defender[1].avoided = false;
				defender[1].net_hits = display_hits - d_display_hits;
				////console.log("attacker weapon",attacker.weapon.data.soak);
				////console.log("indexing",defender[1].actor.data.soaks);
				const damage = display_hits - d_display_hits + display_dv - defender[1].actor.data.soaks[attacker.weapon.data.soak].value;
				////console.log("damage",damage);
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
			defender_holder.push(defender[1]);
		});
		
		Object.entries(defender_holder).forEach(defender => {
			
			let q = i + "";
			
			new_defenders[q] = defender[1];
			i++;
			
		});
		//console.log("latest new defenders",new_defenders);
		await message.setFlag("shimmeringreach","defenders",null);
		await message.setFlag("shimmeringreach","defenders",new_defenders);
	}
	
	
	
	message.setFlag("shimmeringreach","attacker", attacker);
	
	
	//await message.update({"data.flags.shimmeringreach.defenders" : new_defenders});
	
	const combatInfo = 
		{
			attacker: attacker,
			defenders: defenders
		}
	
	await message.update({"content": await renderTemplate(template,combatInfo)});
}

export function toggleDicerollDisplay(event){
	
		let targets = $(event.currentTarget).parentsUntil('.block').parent().find('.dice-roll-content');
		//console.log("trgt",$(event.currentTarget).parentsUntil('.block').parent().find('.dice-roll-content'));
		
		Object.entries(targets).forEach(target => {
			if (!isNaN(target[0])){
				if(target[1].style.display == "flex"){
					target[1].style.display = "none";
				}
				else {
					target[1].style.display = "flex";
				}
			}
		});
}

export async function deleteDefenderMessage(event){
	//console.log(event);
	//console.log(event.currentTarget.dataset);
	//console.log($(event.currentTarget));
	
	let dataset = event.currentTarget.dataset;
	let message = game.messages.get(event.currentTarget.closest('[data-message-id]').dataset.messageId);
	
	//console.log(message);
	
	let defenders = [];
	const old_defenders = message.getFlag("shimmeringreach","defenders");
	
	Object.entries(old_defenders).forEach(defender => {
		//console.log(defender[1]);
		
			//console.log(defender[1].hasOwnProperty('token_id'));
		
		if (defender[1].hasOwnProperty('token_id')){
			if (defender[1].token_id != dataset.token_id){
				defenders.push(defender[1]);
			}
		}
		else {
			if (defender[1].actor._id != dataset.actor_id){
				defenders.push(defender[1]);
			}
		}
		
	});
	
	let new_defenders = {};
	
	let i = 0;
	
	Object.entries(defenders).forEach(defender => {
		
		let q = i + "";
		
		new_defenders[q] = defender[1];
		i++;
		
	});
	
	await message.setFlag("shimmeringreach","defenders",null);
	
	await message.setFlag("shimmeringreach","defenders",new_defenders);
	
	await updateCombatContent(message);
	
}

export async function rerollCombatant(event){
	
	//console.log(event.currentTarget.dataset);
	
	let dataset = event.currentTarget.dataset;
	let message = game.messages.get(event.currentTarget.closest('[data-message-id]').dataset.messageId);
	
	let defenders = message.getFlag("shimmeringreach","defenders");
	let attacker = message.getFlag("shimmeringreach","attacker");
	
	let new_defenders = [];
	let i = 0;
	if(dataset.hasOwnProperty('attacker')){
		if (!attacker.hasOwnProperty('reroll')){
			let dicepool = attacker.diceroll.terms[0].number - attacker.diceroll.total;
			let reroll = new RollDP( dicepool, attacker.actor, false, false).evaluate();
			
			let q = reroll.terms[0].results;
				q.sort((a, b) => {
				return (b.result - a.result);
			});
			
			const fullreroll = {
				class: "RollDP",
				dice: [],
				formula: reroll._formula,
				total: reroll._total,
				results: reroll.results,
				terms: [{...reroll.terms[0]}]
			};
			
			await message.update({"flags.shimmeringreach.attacker.reroll": fullreroll});
		}
		else {
			ui.notifications.warn("This reroll has already been used.");
		}
	}
	else if (!dataset.hasOwnProperty('attacker')){
		Object.entries(defenders).forEach(async function (defender) {
				
				
			if ((defender[1].token_id == null && defender[1].actor._id == dataset.actor_id) || (defender[1].token_id == dataset.token_id)){
					
				if (!defender[1].hasOwnProperty('reroll')){
					//console.log('rerolling defender');
					let dicepool = defender[1].diceroll.terms[0].number - defender[1].diceroll._total
					
					////console.log(defender);
					////console.log(dicepool);
					
					let reroll = new RollDP( dicepool, defender[1].actor, false, false).evaluate();
					
					let q = reroll.terms[0].results;
						q.sort((a, b) => {
						return (b.result - a.result);
					});
					
					let fullreroll = {
						class: "RollDP",
						dice: [],
						formula: reroll._formula,
						total: reroll._total,
						results: reroll.results,
						terms: [{...reroll.terms[0]}]
					};
					defender[1].reroll= fullreroll;
					
					let str = "data.flags.shimmeringreach.defenders." + i + ".reroll";
					////console.log(message);
					////console.log("full reroll",fullreroll);
					////console.log("blooperd");
					//await message.update({str : fullreroll});
				}
				else {
					ui.notifications.warn("This reroll has already been used.");
				}
			}
			i++;
		});
		
		////console.log("defenders",defenders);
		
	await message.setFlag("shimmeringreach","defenders",null);
	
	await message.setFlag("shimmeringreach","defenders",defenders);
		
	}
	await updateCombatantFlags(message);
	//await updateCombatContent(message);
	//console.log(message);
}
