// Import Modules
import { SRActor } from "./actor/actor.js";
import { SRActorSheet } from "./actor/actor-sheet.js";
import { SRItem } from "./item/item.js";
import { SRItemSheet } from "./item/item-sheet.js";

import { RollDP } from "./dice-roller/roll.js";

import { SRCombat } from "./srcombat/srcombat.js";

import {measureDistances } from "./canvas/canvas.js";

import {findMessageRelatives} from "./jsquery/jsquery-helpers.js";
import {srChatMessage, customCombatDialog} from './roll-cards/render.js';
Hooks.once('init', async function() {

	var phrase = `Loading Shimmering Reach System                                                       
   _____  __     _                                    _                  ____                      __   
  / ___/ / /_   (_)____ ___   ____ ___   ___   _____ (_)____   ____ _   / __ \\ ___   ____ _ _____ / /_  
  \\__ \\ / __ \\ / // __ '__ \\ / __ '__ \\ / _ \\ / ___// // __ \\ / __  /  / /_/ // _ \\ / __ '// ___// __ \\ 
 ___/ // / / // // / / / / // / / / / //  __// /   / // / / // /_/ /  / _, _//  __// /_/ // /__ / / / / 
/____//_/ /_//_//_/ /_/ /_//_/ /_/ /_/ \\___//_/   /_//_/ /_/ \\__, /  /_/ |_| \\___/ \\__,_/ \\___//_/ /_/  
                                                            /____/                                      
	`;

	console.log(phrase);


  game.shimmeringreach = {
    SRActor,
    SRItem,
    rollItemMacro,
    RollDP,
	SRCombat,
  };

  globalThis.RollDP = RollDP

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  
  //  formula: "@initiative.dice d6 + @abilities.rea.value",
  CONFIG.Combat.initiative = {
    formula: "@initiative.dice d6 + @abilities.rea.value",
    decimals: 2
  };


  // Define custom Entity classes
  CONFIG.Actor.entityClass = SRActor;
  CONFIG.Item.entityClass = SRItem;
  CONFIG.Combat.entityClass = SRCombat;
  //CONFIG.Roll.entityClass = RollDP;
  
  
  //Roll.CHAT_TEMPLATE = "templates/dice/roll.html";
  //RollDP.CHAT_TEMPLATE = "templates/dice/roll.html";

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("shimmeringreach", SRActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("shimmeringreach", SRItemSheet, { makeDefault: true });
  
  Handlebars.registerHelper('isInSkillGroup', function(skill_group_members, skill_name) {
      return skill_group_members.includes(skill_name);
  });

  // If you need to add Handlebars helpers, here are a few useful examples:
  Handlebars.registerHelper('concat', function() {
    var outStr = '';
    for (var arg in arguments) {
      if (typeof arguments[arg] != 'object') {
        outStr += arguments[arg];
      }
    }
    return outStr;
  });

  Handlebars.registerHelper('toLowerCase', function(str) {
    return str.toLowerCase();
  });
});


Hooks.once("ready", async function() {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createSRMacro(data, slot));
});

// diagonal movement
Hooks.on("canvasInit", function() {

  // Extend Diagonal Measurement
  SquareGrid.prototype.measureDistances = measureDistances;
});

Hooks.on("init", function() {
	$(document).on('click','.hits-block', (event)	=> { 
		event.preventDefault();
		
		let target = $(event.currentTarget).parentsUntil('.message-content').find('.dice-roll-content')[0];
		
			
		if(target.style.display =="flex"){
			target.style.display = "none";
		}
		else {
			target.style.display = "flex";
		}
	});
	
	$(document).on('click','.defense-block', (event) => {
		event.preventDefault();
		let dataset = event.currentTarget.dataset;
		const attacker_data = game.messages.get(event.currentTarget.closest('[data-message-id]').dataset.messageId).data.flags.data;
		/*
		console.log("_________");
		console.log("game",game);
		console.log("current user", game.users.current.data);
		console.log("tokens selected",canvas.tokens.controlled);*/
				
		let actor_list = [];
		
		if(canvas.tokens.controlled.length == 0 && game.users.current.data.character)
		{
			let result = game.actors.map(x => x).filter(actor => {
				return actor.data._id == game.users.current.data.character;
			})
			actor_list.push(result);
		}
		else if(canvas.tokens.controlled.length > 0)
		{
			
			//fix this for tokens that are NOT linked to actors
			Object.entries(canvas.tokens.controlled).forEach(token => {
				actor_list.push(token[1].actor);
			});
			
			console.log("Selecting at least one token",);
		}
		else{
			ui.notifications.warn("Select a token to use this function.");
			return
		}
		
		//console.log("all the actors",actor_list);
		/*
		Object.entries(actor_list).forEach(actor => {
			console.log(actor[1]);
			console.log("before",actor[1].data.data.health.value);
			actor[1].update({'data.health.value': (actor[1].data.data.health.value -1)});
			console.log("after",actor[1].data.data.health.value);
		});*/
		
		const CMO = {
				
				defense_type: dataset.defense,
				defense_state: dataset.state,
				actor_list: actor_list,
				type: "defense",
				attacker_data: attacker_data
			   
			};
			
			if (!event.shiftKey){
				srChatMessage(CMO);
			}
			else{
				customCombatDialog(CMO);
			}
		
		
		
		
		//defenseChatMessage(actor_list,attacker_data,event.currentTarget.dataset.defense,event.currentTarget.dataset.state);
		
		
		//console.log("_________");
		/*
		console.log("attacker data",attacker_data);
		console.log(event.currentTarget.dataset.defense,event.currentTarget.dataset.state,event.currentTarget.title);
		*/
		
	});
	
	$(document).on('click','.defense-block-active', (event) => {
		event.preventDefault();
		
	});
});

/*
Hooks.on("renderChatMessage", (message,data,html) => {
        // NOTE: This depends on the exact card template HTML structure.
		
		html.on('click', '.dice-roll-content', event => {
			event.preventDefault();
		
		
		console.log("html",html);
		console.log("data",data);
		console.log("message",message);
		});
		
	
	
	
});*/







/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createSRMacro(data, slot) {
  if (data.type !== "Item") return;
  if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
  const item = data.data;

  // Create the macro command
  const command = `game.shimmeringreach.rollItemMacro("${item.name}");`;
  let macro = game.macros.entities.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "shimmeringreach.itemMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  const item = actor ? actor.items.find(i => i.name === itemName) : null;
  if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

  // Trigger the item roll
  return item.roll();
}