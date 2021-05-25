/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class SRItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    // Get the Item's data
    const itemData = this.data;
    const actorData = this.actor ? this.actor.data : {};
    const data = itemData.data;
    
    if (itemData.type === 'feature') this._prepareFeatureData(actorData.data, data);
	/*if (itemData.type === 'weapon') this._prepareWeaponData(actorData.data, data);*/

  }
  
  
  _prepareFeatureData(actorData, itemData) {
    //console.log(actorData);
    //console.log(itemData.selection);

    const adata = actorData;
    const idata = itemData;
	let qdata = adata;
    if (itemData.active != true){ return; }
    let [category, selection] = itemData.category.split(".")
	let parts = itemData.category.split(".");
	//console.log(itemData);
	//console.log(parts);
	let b = idata.bonus;
	let res = this.recursiveFeaturePrep(adata,parts,b);
	//console.log('res');
	//console.log(res);
	/*
	parts.forEach( part => {
		
		if (!isNaN(qdata[part]))
		{
			qdata[part] += idata.bonus;
		}
		else {
			qdata = qdata[part];
			console.log(qdata);
		}
	});*/
	//console.log(qdata);
	//console.log(actorData);
	
	
	/*
	for (let [key, ob] of Object.entries(qdata)) {
		if (key == parts[0]){
			console.log('ob 1');
			console.log(ob);
			console.log('qdata is now ob');
			qdata = ob;
			console.log(qdata);
		}
	}
	console.log('external qdata');
	console.log(qdata);
	for (let [key, ob] of Object.entries(qdata)) {
		if (key == parts[1]){
			console.log('____');
			console.log(ob);
			console.log('____');
			qdata = ob;
		}
	}
	console.log('external qdata2');
	console.log(qdata)
	for (let [key, ob] of Object.entries(qdata)) {
		if (key == parts[2]){
			console.log('____');
			console.log(ob);
			console.log('____');
			if(!isNaN(ob)){
				console.log('entered');
			}
		}
	}
	console.log('external qdata3');
	console.log(qdata);
	
	if(!isNaN(qdata))
	{
		console.log('rock bottom');
	}*/
	
	/*
	parts.forEach(part => {
		for (let [key, ob] of Object.entries(qdata)) {
			if (key == part ){
				
			}
		}
	});*/
	
	
	
	
    /*
    if (!(selection == null)) {
        for (let [key, ob] of Object.entries(adata)) {
            if (key == category && ob.hasOwnProperty(selection)) {
                if (itemData.selection == 0) {
                    ob[selection].value += 0;
                }
            }
        }
    }*/
    
  }
  
  
  
	recursiveFeaturePrep(adata,partz,bon){
		let actorData = adata;
		const parts = partz;
		const bonus = bon;
		
		if (parts.length > 0 && !(actorData[parts[0]] == undefined))
		{
			const p = parts.slice(1);
			const qData = actorData[parts[0]];
			const t = this.recursiveFeaturePrep(qData,p,bonus);
			if (t != false){
				actorData[parts[0]] = t;
				//console.log(t);
				return(actorData);
			}
		}
		if (parts.length == 0){
			/*console.log(actorData);
			console.log(isNaN(actorData));
			console.log(bonus);
			console.log(actorData);*/
			actorData += bonus;
			
			return (actorData);
		}
		return (false);
		
	}
  
  
  _prepareWeaponData(actorData, itemData) {
    //console.log(actorData);
    //console.log(itemData.selection);

    const adata = actorData;
    const idata = itemData;
	console.log('______');
	console.log(itemData);
	itemData.dv = itemData.power + actorData.abilities.str.value;
	itemData.dicepool = itemData.reach + actorData.skills.weapon_skill.dicepool;
	console.log(actorData.skills.weapon_skill.dicepool);
	console.log(itemData);
	
	console.log('______');
    /*if (itemData.active != true){ return; }
    let [category, selection] = itemData.category.split(".")
	console.log(itemData);
    
    if (!(selection == null)) {
        for (let [key, ob] of Object.entries(adata)) {
            if (key == category && ob.hasOwnProperty(selection)) {
                if (itemData.selection == 0) {
                    ob[selection].value += idata.bonus;
                }
            }
        }
    }*/
    
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    // Basic template rendering data
    const token = this.actor.token;
    const item = this.data;
    const actorData = this.actor ? this.actor.data.data : {};
    const itemData = item.data;

    let roll = new Roll('d20+@abilities.str.mod', actorData);
    let label = `Rolling ${item.name}`;
    roll.roll().toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: label
    });
  }
}
