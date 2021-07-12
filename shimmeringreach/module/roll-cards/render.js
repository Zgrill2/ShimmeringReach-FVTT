import { SRActor } from '../actor/Actor.js';
import { SRItem } from '../item/Item.js';



export async function customAttackDialog(event,actor,options) {
	const template = "systems/shimmeringreach/templates/dialog/attack-dialog.html";
	
	
	//console.log(options);
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
		//render: html => console.log("Register interactivity in the rendered dialog"),
		close: html =>{

			//console.log("This always is logged no matter which option is chosen")
			
			if(confirmed) {
				options.dvMod = parseInt(html.find('[name=dvMod]')[0].value);
				options.dicepoolMod = parseInt(html.find('[name=dicepoolMod]')[0].value);
				
				//console.log('wounds',html.find('[name=chk-wounds]')[0].checked);
				if(html.find('[name=chk-wounds]')[0].checked)
				{
					options.wounds = true;
				}
				if(html.find('[name=chk-explode]')[0].checked)
				{
					options.explode = true;
				}
				
				//console.log(options);
				renderAttackChatData(event,actor,options);
			}
		}
	},
	{width: 300});
	d.render(true);
	
}

export async function customDefenseDialog(event,options) {
	const template = "systems/shimmeringreach/templates/dialog/defense-dialog.html";
	
	
	//console.log(options);
	
	
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
		//render: html => console.log("Register interactivity in the rendered dialog"),
		close: html =>{

			//console.log("This always is logged no matter which option is chosen")
			
			if(confirmed) {
				options.dicepoolMod = parseInt(html.find('[name=dicepoolMod]')[0].value);
				
				//console.log('wounds',html.find('[name=chk-wounds]')[0].checked);
				if(html.find('[name=chk-wounds]')[0].checked)
				{
					options.wounds = true;
				}
				if(html.find('[name=chk-explode]')[0].checked)
				{
					options.explode = true;
				}
				
				//console.log(options);
				addDefenseMessages(event,options);
			}
		}
	},
	{width: 300});
	d.render(true);
	
}

export async function customSoakDialog(event) {
	const template = "systems/shimmeringreach/templates/dialog/soak-dialog.html";
	
	let dataset = $(event.currentTarget).parentsUntil('.block').parent()[0].dataset;
	//console.log("dataset",dataset);
	
	//console.log(event);
	let actor = {};
	
	if (dataset.token_id == ""){
		actor = game.actors.get(dataset.actor_id);
	}
	else {
		actor = game.actors.tokens[dataset.token_id];
	}
	let actor_info = {
		dv: dataset.dv,
		armor: actor.data.data.abilities.bod,
		hp: actor.data.data.health,
		stam: actor.data.data.stamina,
		reswound: actor.data.data.wound_penalty.resilient_wounds
	}
	
	let options = {};
	let stammiss = (actor_info.stam.max - actor_info.stam.value)%(6+actor_info.reswound);
	let hpmiss = (actor_info.hp.max - actor_info.hp.value)%(6+actor_info.reswound);
	//console.log("stuff",stammiss,hpmiss);
	let optimalhp = 0;
	let optimalwounds = 99;
	let currwound = 0;
	for (let i = parseInt(actor_info.dv); i>= Math.max(0,dataset.dv - Math.min(actor_info.armor.value, actor_info.stam.value-1)); i--){
		currwound = Math.floor((i + hpmiss)/(6+actor_info.reswound)) + Math.floor((actor_info.dv - i + stammiss)/(6+actor_info.reswound))
		//console.log("currwound",i,currwound);
		if (currwound <= optimalwounds){
			optimalwounds = currwound;
			optimalhp = i;
		}
	}
	/*
	//console.log("optimal hp",optimalhp);
	//console.log("ainfo",actor_info.armor);
	//console.log("dv",parseInt(dataset.dv));
	//console.log("min",parseInt(dataset.dv) - actor_info.armor.value);*/
	
	let slide = {
		max: dataset.dv,
		min: Math.max(0,parseInt(dataset.dv) - Math.min(actor_info.armor.value, actor_info.stam.value)),
		value: optimalhp
	}
	
	actor_info.newstam = actor_info.stam.value - (dataset.dv - optimalhp);
	actor_info.newhp = actor_info.hp.value - optimalhp;
	
	let disp = {
		red: optimalhp,
		green: dataset.dv - optimalhp,
		greenwidth1: actor_info.newstam / actor_info.stam.max * 100,
		greenwidth2: (actor_info.stam.value - actor_info.newstam) / actor_info.stam.max * 100,
		redwidth1: actor_info.newhp / actor_info.hp.max * 100,
		redwidth2: (actor_info.hp.value - actor_info.newhp) / actor_info.hp.max * 100
	}
	
	let redwounds = [];
	let greenwounds = [];
	
	let fgw = actor_info.stam.max % (6+actor_info.reswound);
	let frw = actor_info.hp.max % (6+actor_info.reswound);
	
	greenwounds[0] = fgw;
	redwounds[0] = frw;
	
	for( let i = 1; i*(6+actor_info.reswound) + fgw <= actor_info.stam.max; i++){
		greenwounds[i] = (6+actor_info.reswound)
	}
	for( let i = 1; i*(6+actor_info.reswound) + fgw <= actor_info.hp.max; i++){
		redwounds[i] = (6+actor_info.reswound)
	}
	
	
	
	disp.greenwidth3 = 100 - disp.greenwidth1 - disp.greenwidth2;
	disp.redwidth3 = 100 - disp.redwidth1 - disp.redwidth2;
	//console.log("disp",disp);
	
	let local_data = {
		actor: actor,
		slide: slide,
		disp: disp,
		actor_info: actor_info,
		redwounds: redwounds,
		greenwounds: greenwounds
	}
	
	let message = game.messages.get(event.currentTarget.closest('[data-message-id]').dataset.messageId);
		
	let confirmed = false;
	let d = new Dialog({
		title: "Custom Soak",
		content: await renderTemplate(template, local_data),
		buttons: {
		rollbutton: {
		icon: '<i class="fas fa-check"></i>',
		label: "Apply",
		callback: () => confirmed = true
		},
		abortbutton: {
		icon: '<i class="fas fa-times"></i>',
		label: "Cancel",
		callback: () => confirmed = false
		}
		},
		default: "abortbutton",
		render: html => {
			let red = document.getElementById("myRed");
			let green = document.getElementById("myGreen");
			let slider = document.getElementById("mySlider");
			let soakmod = document.getElementById("soakMod");
			let newhp = document.getElementById("newhp");
			let newstam = document.getElementById("newstam");
			
			let green1 = document.getElementById("green1");
			let green2 = document.getElementById("green2");
			let green3 = document.getElementById("green3");
			
			let red1 = document.getElementById("red1");
			let red2 = document.getElementById("red2");
			let red3 = document.getElementById("red3");
			
			
			
			let mydv = document.getElementById("myDv");
			slider.oninput = function() {
				red2.innerHTML = ( parseInt(this.value) != 0 ? parseInt(this.value) : "");
				red2.style.width = (parseInt(this.value) / actor_info.hp.max)*100 +"%";
				green2.innerHTML =  ( parseInt(this.max) - parseInt(this.value) != 0 ? parseInt(this.max) - parseInt(this.value) : "");
				green2.style.width = (parseInt(this.max) - parseInt(this.value))*100 / actor_info.stam.max + "%";
				
				
				red1.innerHTML = actor_info.hp.value - parseInt(this.value);
				red1.style.width = (actor_info.hp.value - parseInt(this.value))/actor_info.hp.max * 100 +"%";
				
				green1.innerHTML = actor_info.stam.value -parseInt(this.max) + parseInt(this.value);
				green1.style.width = (actor_info.stam.value -parseInt(this.max) + parseInt(this.value))/actor_info.stam.max * 100 + "%";
				
				//red3.style.width = (actor_info.hp.max - actor_info.hp.value) / actor_info.hp.max * 100 + "%";
				//green3.style.width = (actor_info.stam.max - actor_info.stam.value) / actor_info.stam.max * 100 + "%";
			}
			
			soakmod.oninput = function() {
				mydv.innerHTML = actor_info.dv - parseInt(this.value);
				slider.max = Math.max(0,actor_info.dv - parseInt(this.value));
				slider.min = slider.max - Math.min(actor_info.armor.value,actor_info.stam.value);
				//console.log(slider);
				
				
				let optimalhp = 0;
				let optimalwounds = 99;
				let currwound = 0;
				for (let i = parseInt(actor_info.dv) - parseInt(this.value); i>= Math.max(0,dataset.dv - parseInt(this.value) - Math.min(actor_info.armor.value, actor_info.stam.value-1)); i--){
					currwound = Math.floor((i + hpmiss)/(6+actor_info.reswound)) + Math.floor((actor_info.dv - i + stammiss)/(6+actor_info.reswound))
					////console.log("currwound",i,currwound);
					if (currwound <= optimalwounds){
						optimalwounds = currwound;
						optimalhp = i;
					}
				}
				
				slider.value = optimalhp;
				
				red2.innerHTML = ( parseInt(slider.value) != 0 ? parseInt(slider.value) : "");
				red2.style.width = (parseInt(slider.value) / actor_info.hp.max)*100 +"%";
				green2.innerHTML =  ( parseInt(slider.max) - parseInt(slider.value) != 0 ? parseInt(slider.max) - parseInt(slider.value) : "");
				green2.style.width = (parseInt(slider.max) - parseInt(slider.value))*100 / actor_info.stam.max + "%";
				
				
				red1.innerHTML = actor_info.hp.value - parseInt(slider.value);
				red1.style.width = (actor_info.hp.value - parseInt(slider.value))/actor_info.hp.max * 100 +"%";
				
				green1.innerHTML = actor_info.stam.value -parseInt(slider.max) + parseInt(slider.value);
				green1.style.width = (actor_info.stam.value -parseInt(slider.max) + parseInt(slider.value))/actor_info.stam.max * 100 + "%";
			}
		},
		close: html =>{

			//console.log("This always is logged no matter which option is chosen")
			
			if(confirmed) {
				options.hp = parseInt(document.getElementById("red2").innerHTML);
				options.stam = parseInt(document.getElementById("green2").innerHTML);
				//console.log(options);
				//console.log(actor);
				actor.update({"data.health.value" : actor_info.hp.value - options.hp});
				actor.update({"data.stamina.value" : actor_info.stam.value - options.stam});
				//console.log(actor_info.hp.value - options.hp);
				//console.log(actor_info.stam.value - options.stam);
				//console.log(actor);
			}
		}
	},
	{width: 300});
	d.render(true);
	
}

export async function customSkillDialog(event,actor,options) {
	const template = "systems/shimmeringreach/templates/dialog/skill-dialog.html";
	
	
	
		
	let title = "Custom " + actor.data.data.skills[event.currentTarget.dataset.label].name + " Roll";
	let confirmed = false;
	let d = new Dialog({
		title: title,
		content: await renderTemplate(template,{"actor": actor}),
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
		//render: html => console.log("Register interactivity in the rendered dialog"),
		close: html =>{

			
			if(confirmed) {
				options.dicepoolMod = parseInt(html.find('[name=dicepoolMod]')[0].value);
				
				////console.log('wounds',html.find('[name=chk-wounds]')[0].checked);
				if(html.find('[name=chk-wounds]')[0].checked)
				{
					options.wounds = true;
				}
				if(html.find('[name=chk-explode]')[0].checked)
				{
					options.explode = true;
				}
				
				////console.log(options);
				renderSkillChatData(event,actor,options);
			}
		}
	},
	{width: 300});
	d.render(true);
	
}

export async function simpleSoak(event) {
	
	const template = "systems/shimmeringreach/templates/dialog/soak-dialog.html";
		
	let dataset = $(event.currentTarget).parentsUntil('.block').parent()[0].dataset;
	
	let actor = {};
	
	if (dataset.token_id == ""){
		actor = game.actors.get(dataset.actor_id);
	}
	else {
		actor = game.actors.tokens[dataset.token_id];
	}
	
	let data = {
		one: "one",
		two: "two",
		three: "three"
	}
	
	
	let message = game.messages.get(event.currentTarget.closest('[data-message-id]').dataset.messageId);
	
	
	
	if (actor.permission == 3) {
		
		
		let actor_info = {
			dv: dataset.dv,
			armor: actor.data.data.abilities.bod,
			hp: actor.data.data.health,
			stam: actor.data.data.stamina,
			reswound: actor.data.data.wound_penalty.resilient_wounds
		}
		
		let stamdmg = Math.max(0,Math.min(actor_info.armor.value,actor_info.stam.value-1));
		let hpdmg = dataset.dv - stamdmg;
		
		if (hpdmg >= actor_info.hp.value && actor_info.armor.value >= actor_info.stam.value && actor_info.stam.value > 0){
			stamdmg +=1;
			hpdmg -=1;
		}
		
		actor.update({"data.health.value" : actor_info.hp.value - hpdmg});
		actor.update({"data.stamina.value" : actor_info.stam.value - stamdmg});
	}
	else {
		ui.notifications.warn("You do not have permission to soak for this actor.");
	}
			
}

function findWeaponByID(stringID, actor) {
	
	let weapon = "";
	Object.entries(actor.data.items).forEach(weapn => {
		////console.log(weapn);
		////console.log(stringID);
		if (stringID == weapn[1]._id){
			////console.log("bloop");
			weapon = weapn[1];
			////console.log(weapn[1]);
		}
	});
	////console.log(weapon);
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
			////console.log("actor list",actor_list);
			////console.log("Selecting at least one token",);
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
		////console.log("atk item",options.weapon);
		
		let newdp = (weapon.data.dicepool + (options.dicepoolMod ? options.dicepoolMod : 0))
		let diceroll = new RollDP( newdp, actor.data.data, (options.explode ? options.explode : false), (options.wounds ? options.wounds : true)).evaluate();
		
		let q = diceroll.terms[0].results;
		q.sort((a, b) => {
			return (b.result - a.result);
		});
		////console.log("actor",options.actor);
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
		////console.log("msg",msg);
}

export async function renderSkillChatData(event, actor, options){
		
		const template = "systems/shimmeringreach/templates/chat/skill-card.html";

		////console.log(actor.data.data.skills[event.currentTarget.dataset.label].dicepool);
		////console.log(event.currentTarget.dataset);

		
		let newdp = (actor.data.data.skills[event.currentTarget.dataset.label].dicepool + (options.dicepoolMod ? options.dicepoolMod : 0))
		let diceroll = new RollDP( newdp, actor.data.data, (options.explode ? options.explode : false), (options.wounds ? options.wounds : true)).evaluate();
		
		let q = diceroll.terms[0].results;
		q.sort((a, b) => {
			return (b.result - a.result);
		});
		////console.log("actor",options.actor);
		let content = {
			actor: actor.data,
			skillname: event.currentTarget.dataset.label,
			displayname: actor.data.data.skills[event.currentTarget.dataset.label].name,
			diceroll: diceroll,
			dicepoolMod: (options.dicepoolMod ? options.dicepoolMod : 0),
			display_hits: diceroll._total 
		}
			
		let chatData = {
			user: game.user._id,
			content: await renderTemplate(template,content),
			flags:{ "shimmeringreach": content}
		}
		
		let msg = ChatMessage.create(chatData);
		////console.log("msg",msg);
}

export async function addDefenseMessages(event,options){
	
	let dataset = event.currentTarget.dataset;
	let message = game.messages.get(event.currentTarget.closest('[data-message-id]').dataset.messageId);
	let defender_list = getSelectedActors();
	let tokens = {...canvas.tokens.controlled};
	
	////console.log(event.currentTarget.src);
	
	let spl =  "/modules" + event.currentTarget.src.split("modules")[1];

	let hue = 0;
	if (dataset.state == "passive"){
		hue = -50
	}
	else{
		hue = 150
	}
	
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
		////console.log(old_defenders);
		Object.entries(old_defenders).forEach(old_actor => {
			////console.log(old_actor);
			////console.log(actor);
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
			
			let defenseDP = actor[1].data.data.defenses[dataset.defense][dataset.state];
			
			let diceroll = new RollDP( defenseDP + (options.dicepoolMod ? options.dicepoolMod : 0), actor[1].data.data, (options.explode ? options.explode : false), (options.wounds ? options.wounds : true)).evaluate();
			
			let q = diceroll.terms[0].results;
			q.sort((a, b) => {
				return (b.result - a.result);
			});
			
			let defenderOptions = {
				actor: actor[1].data,
				defense_type: dataset.defense,
				defense_state: dataset.state,
				dicepoolMod: (options.dicepoolMod ? options.dicepoolMod : 0),
				diceroll: diceroll,
				icon: spl,
				hue: hue
			};
			////console.log("this is what diceroll looks like",diceroll);
			
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
	
	////console.log("new defenders",new_defenders);
	
	await message.setFlag("shimmeringreach","defenders",new_defenders);
	
	await updateCombatantFlags(message);
	
	//await updateCombatContent(options.message);
	////console.log(options.message);
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
	////console.log("UCF message",message);
	const template = "systems/shimmeringreach/templates/chat/attack-card.html";
	let attacker = message.getFlag("shimmeringreach","attacker");
	let defenders = message.getFlag("shimmeringreach","defenders");
	
	////console.log("UPDATE FLAGS",attacker);
	
	const display_dv = attacker.weapon.data.dv + attacker.dvMod;
	const display_hits = attacker.diceroll.total + (attacker.reroll ? attacker.reroll.total : 0); //Future proofing for when abilities can add free hits
	
	attacker.display_dv = display_dv;
	attacker.display_hits = display_hits;
	
	////console.log("defenders befpre",defenders);
	
	let defender_holder = [];
	
	let new_defenders = {};
	
	if (defenders != undefined){
		
		let i = 0;
		
		Object.entries(defenders).forEach(defender => {
			const d_display_hits = defender[1].diceroll._total + (defender[1].reroll ? defender[1].reroll.total : 0); //Future proofing for when abilities can add free hits
			defender[1].display_hits = d_display_hits;
			////console.log("defender", defender[0], defender[1]);
			////console.log("ddisplay hits",d_display_hits);
			
			if ( display_hits > d_display_hits) {
				
				
				//defender[1].update({"avoided" : false});
				defender[1].avoided = false;
				defender[1].net_hits = display_hits - d_display_hits;
				//////console.log("attacker weapon",attacker.weapon.data.soak);
				//////console.log("indexing",defender[1].actor.data.soaks);
				const damage = display_hits - d_display_hits + display_dv - defender[1].actor.data.soaks[attacker.weapon.data.soak].value;
				//////console.log("damage",damage);
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
		////console.log("latest new defenders",new_defenders);
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
		////console.log("trgt",$(event.currentTarget).parentsUntil('.block').parent().find('.dice-roll-content'));
		
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
	////console.log(event);
	////console.log(event.currentTarget.dataset);
	////console.log($(event.currentTarget));
	
	if(game.users.current.data.role == 4){
		let dataset = $(event.currentTarget).parentsUntil('.block').parent()[0].dataset;
		let message = game.messages.get(event.currentTarget.closest('[data-message-id]').dataset.messageId);
		
		////console.log(message);
		
		let defenders = [];
		const old_defenders = message.getFlag("shimmeringreach","defenders");
		////console.log("dataset",dataset);
		Object.entries(old_defenders).forEach(defender => {
			////console.log(defender[1]);
			
				////console.log(defender[1].hasOwnProperty('token_id'));
			
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
	else {
		ui.notifications.warn("You do not have permission to delete this roll.");
	}
}

export async function rerollChatCard(event){
	let dataset = $(event.currentTarget).parentsUntil('.block').parent()[0].dataset;
	let message = game.messages.get(event.currentTarget.closest('[data-message-id]').dataset.messageId);
	
	if(message.getFlag("shimmeringreach","attacker")){
		rerollCombatCard(event);
	}
	else if(message.getFlag("shimmeringreach","skillname")){
		rerollSkillCard(event);
	}
}
	
	
async function rerollCombatCard(event){

	let dataset = $(event.currentTarget).parentsUntil('.block').parent()[0].dataset;
	let message = game.messages.get(event.currentTarget.closest('[data-message-id]').dataset.messageId);
	
	let defenders = message.getFlag("shimmeringreach","defenders");
	let attacker = message.getFlag("shimmeringreach","attacker");
	
	
	
	////console.log(dataset);
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
					////console.log('rerolling defender');
					let dicepool = defender[1].diceroll.terms[0].number - defender[1].diceroll._total
					
					//////console.log(defender);
					//////console.log(dicepool);
					
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
					//////console.log(message);
					//////console.log("full reroll",fullreroll);
					//////console.log("blooperd");
					//await message.update({str : fullreroll});
				}
				else {
					ui.notifications.warn("This reroll has already been used.");
				}
			}
			i++;
		});
		
		//////console.log("defenders",defenders);
		
	await message.setFlag("shimmeringreach","defenders",null);
	
	await message.setFlag("shimmeringreach","defenders",defenders);
		
	}
	await updateCombatantFlags(message);
	//await updateCombatContent(message);
	////console.log(message);
}



async function rerollSkillCard(event){
	const template = "systems/shimmeringreach/templates/chat/skill-card.html";

	let dataset = $(event.currentTarget).parentsUntil('.block').parent()[0].dataset;
	let message = game.messages.get(event.currentTarget.closest('[data-message-id]').dataset.messageId);
	
	
	
	
	
	////console.log(dataset);
	////console.log(message.data.flags.shimmeringreach);
	
	let old_content = message.data.flags.shimmeringreach;
	
	if (!old_content.hasOwnProperty('reroll')){
		let dicepool = old_content.diceroll.terms[0].number - old_content.diceroll.total;
		let reroll = new RollDP( dicepool, old_content.actor, false, false).evaluate();
		
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
		
		old_content.reroll = fullreroll;
		
		old_content.display_hits = old_content.diceroll.total + fullreroll.total;
		
		await message.update({"flags.shimmeringreach": old_content});
		await message.update({"content": await renderTemplate(template,old_content)});
		
	}
	else {
		ui.notifications.warn("This reroll has already been used.");
	}
	
}

