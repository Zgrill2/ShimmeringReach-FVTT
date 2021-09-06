// Import Modules
import { SRActor } from "./actor/actor.js";
import { SRActorSheet } from "./actor/actor-sheet.js";
import { SRItem } from "./item/item.js";
import { SRItemSheet } from "./item/item-sheet.js";

import { RollDP } from "./dice-roller/roll.js";

import { SRCombat } from "./srcombat/srcombat.js";

import {measureDistances } from "./canvas/canvas.js";

import {findMessageRelatives} from "./jsquery/jsquery-helpers.js";
import {deleteDefenderMessage,toggleDicerollDisplay,rerollChatCard,addDefenseMessages,customDefenseDialog,customSoakDialog,simpleSoak, registerRenderSocket, testEmit} from './roll-cards/render.js';
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
  
  registerRenderSocket();
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
		if (event.shiftKey){
			rerollChatCard(event);
		}
		else {
			toggleDicerollDisplay(event);
		}
	});
	
	$(document).on('click','.delete-defender', (event) => {
		event.preventDefault();
		deleteDefenderMessage(event);
		
	});
	
	$(document).on('click','.defense-block', (event) => {
		
		event.preventDefault();
		if (!event.shiftKey){
			addDefenseMessages(event, {});
		}
		else {
			customDefenseDialog(event,{});
		}
		
	});
	
	$(document).on('click','.defense-block-active', (event) => {
		event.preventDefault();
		if (!event.shiftKey){
			addDefenseMessages(event, {});
		}
		else {
			customDefenseDialog(event,{});
		}
	});
	
	$(document).on('click','.incoming-damage-block', (event) => {
		event.preventDefault();
		if (!event.shiftKey) {
			simpleSoak(event);
		}
		else {
			customSoakDialog(event);
		}
	});
});

Hooks.on("renderChatMessage", (event, html, messageData) => {
	Object.entries($(html).find('.delete-defender')).forEach(target => {
		if (target[0] != "length" && target[0] != "prevObject"){
			if (game.actors.get(target[1].dataset.actorId).permission != 3){
				target[1].style.display = "none";
			}
		}
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