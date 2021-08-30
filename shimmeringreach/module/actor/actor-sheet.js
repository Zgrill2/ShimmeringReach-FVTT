/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
 
 import {renderAttackChatData,customAttackDialog,renderSkillChatData,customSkillDialog} from '../roll-cards/render.js';
 
 
 
export class SRActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["shimmeringreach", "sheet", "actor"],
      template: "systems/shimmeringreach/templates/actor/actor-sheet.html",
      width: 600,
      height: 600,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "stats" }]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    data.dtypes = ["String", "Number", "Boolean"];
    for (let attr of Object.values(data.data.attributes)) {
      attr.isCheckbox = attr.dtype === "Boolean";
    }

    // Prepare items.
    if (this.actor.data.type == 'character') {
      this._prepareCharacterItems(data);
    }

    return data;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterItems(sheetData) {
    const actorData = sheetData.actor;

    // Initialize containers.
    const gear = [];
    const features = [];
	const weapons = [];
    const spells = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
      8: [],
      9: []
    };
	const know_skills = [];

    // Iterate through items, allocating to containers
    // let totalWeight = 0;
    for (let i of sheetData.items) {
      let item = i.data;
      i.img = i.img || DEFAULT_TOKEN;
      // Append to gear.
      if (i.type === 'item') {
        gear.push(i);
      }
	  // Append to weapons.
      if (i.type === 'weapon') {
        weapons.push(i);
      }
      // Append to features.
      else if (i.type === 'feature') {
        features.push(i);
      }
      // Append to spells.
      else if (i.type === 'spell') {
        if (i.data.spellLevel != undefined) {
          spells[i.data.spellLevel].push(i);
        }
      }
	  else if (i.type === 'skill') {
        know_skills.push(i);
      }
    }

    // Assign and return
    actorData.gear = gear;
    actorData.features = features;
    actorData.spells = spells;
	actorData.weapons =  weapons;
	actorData.know_skills = know_skills;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Update Inventory Item
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getOwnedItem(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      this.actor.deleteOwnedItem(li.data("itemId"));
      li.slideUp(200, () => this.render(false));
    });

    // Rollable abilities.
    html.find('.bland-roll').click(this._onRoll.bind(this));
	html.find('.skill-roll').click(this._skillRoll.bind(this));

	// high level item checkboxes
	
	html.find('.group-toggle').click(this._groupToggle.bind(this));
	html.find('.buff-toggle').click(this._buffToggle.bind(this));
	html.find('.attack-message').click(this._attackMessage.bind(this));
	html.find('.page-edit-toggle').click(this._editToggle.bind(this));
	

    // Drag events for macros.
    if (this.actor.owner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];

    // Finally, create the item!
    return this.actor.createOwnedItem(itemData);
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    if (dataset.roll) {
      let roll = new RollDP(dataset.roll, this.actor.data.data, dataset.explode, dataset.applywounds);
      let label = dataset.label ? `Rolling ${dataset.label}` : '';
	  console.log("onRoll event");
	  //console.log(dataset.explode);
      roll.roll().toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label
      });
    }
  }
	
	_skillRoll(event) {
		event.preventDefault();
		
		if (!event.shiftKey){
			renderSkillChatData(event,this.actor,{});
		}
		else {
			customSkillDialog(event,this.actor,{});
		}
	}



  /**  Generates a chat message attack  **/
  
//event.currentTarget.dataset.weapon  
  
   _attackMessage(event) {
	event.preventDefault();
		/*const CMO = {
			weapon_id: event.currentTarget.dataset.weapon,
			actor: this.actor,
			type: "attack",
			shift: event.shiftKey
		};
		srChatMessage(CMO);*/
		if (!event.shiftKey){
			renderAttackChatData(event,this.actor, {});
		}
		else {
			customAttackDialog(event,this.actor,{});
		}
		
		
	}

	_editToggle(event){/*
		event.preventDefault();
		
	   const element = event.currentTarget;
	   const dataset = element.dataset;
			
			
			
	let message = $(event.currentTarget).parentsUntil('.sheet-body');
		console.log(event);
		console.log(this);
		console.log(document);
		
			let red3 = document.getElementsByClassName("page-edit-toggle");
			console.log(red3);
			//red3[0].hidden = true;
			console.log(red3);*/
	}





/** Toggles a buff **/
   _buffToggle(event) {
	   event.preventDefault();
	   
	   const element = event.currentTarget;
	   const dataset = element.dataset;
	   
	   let buffs = this.actor.items;
	   
	   let id = dataset.buff;
	   
	   buffs.forEach(buff =>{
		  if (buff.data.type === 'feature'){
			if (buff.data._id === id)
			{
				buff.data.data.active = !buff.data.data.active;
				const newdata = buff.data;
				
				
				
				this.actor.updateEmbeddedEntity("OwnedItem",newdata);
			}
		  }			  
	   });
	   
   }

   _groupToggle(event) {
	event.preventDefault();
	const element = event.currentTarget;
	const dataset = element.dataset;
	
	let id = dataset.weapon;
	
	let weapons = this.actor.items;
	//console.log(weapons);
	//console.log(id);
	let a = [];
	weapons.forEach(weapon => {
	//console.log(weapon.data._id);
		//console.log(weapon);
		if (weapon.data.type === 'weapon'){
			//console.log(weapon);
						
			if(weapon.data._id === id)
			{
				//console.log('flipping weapon');
				weapon.data.data.active = !weapon.data.data.active;
				const newdata = weapon.data;
				//console.log(newdata);
				a.push(newdata);
				//this.actor.updateEmbeddedEntity("OwnedItem", newdata);
				//this.actor.updateOwnedItem(weapon.data);
				
				//console.log('flipped weapon');
				
			}
			else if(weapon.data.data.active === true)
			{
				//console.log('unequipping weapon');
				weapon.data.data.active = false;
				
				const newdata = weapon.data;
				
				a.push(newdata);
				//console.log(newdata);
				
				//this.actor.updateEmbeddedEntity("OwnedItem",newdata);
				//console.log('unequipped weapon');
				
			}
			
		}
	});
	
		this.updateWeapons(a);
  }

	async updateWeapons(weapons)
	{
		//console.log(weapons);
		let i = 0;
		weapons.forEach(weapon => {
			setTimeout(function(){this.actor.updateEmbeddedEntity("OwnedItem",weapon)}.bind(this),i*50);
			//console.log(weapon);
			//await this.actor.updateEmbeddedEntity("OwnedItem",weapon);
			i +=1;
		});
	}


}
