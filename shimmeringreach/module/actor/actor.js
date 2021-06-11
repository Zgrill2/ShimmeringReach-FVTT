/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class SRActor extends Actor {

  /**
   * Augment the basic actor data with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    const actorData = this.data;
    const data = actorData.data;
    const flags = actorData.flags;
	

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    if (actorData.type === 'character') this._prepareCharacterData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    const data = actorData.data;

    // Make modifications to data here. For example:
	
	

	//Populate attribute values for reference
	let abilitybox = {};
	for (let [key, ability] of Object.entries(data.abilities)){
		abilitybox[key] = ability;
	}
	let skillbox = {};
	for (let [key, skill] of Object.entries(data.skills)){
		skillbox[key] = skill;
	}
	
	//assigning cast stat to perceive magic
	data.skills.perceive_magic.attr = data.skills.spellcasting.attr;
	
	//Calculate bars. Will probably add some extra calls that boost these further
	
	data.health.max += data.abilities.bod.value;
	data.mana.max += data.abilities[data.skills.spellcasting.attr].value;
	data.stamina.max += data.abilities.wil.value;
	//declaring various dicepool penalties
	let shield_bonuses = [0,1,4,5,7];
	let shield_penalty = [0,0,0,0,-2];
	data.wound_penalty.value = Math.ceil(Math.floor((data.health.max - data.health.value)/(data.wound_penalty.resilient_wounds+6)) +  Math.floor((data.stamina.max - data.stamina.value)/(data.wound_penalty.resilient_wounds+6)) +  Math.floor((data.mana.max - data.mana.value)/(data.wound_penalty.resilient_wounds+6))-data.wound_penalty.ignore_wounds,0);
	// reso;oemt_wounds ignore_wounds
	//Calculate soaks via JSON defined formulas of attribute weighting
	var i;
	for (let [key, soak] of Object.entries(data.soaks)) {
		
		
		for (i = 0; i <soak.attr.length; i++)
		{
			soak.value += abilitybox[soak.attr[i]].value * soak.weights[i];
		}
		soak.value = Math.ceil(soak.value);
	}
	
	//drain soak
	data.drainres.value = data.abilities.wil.value * 2;
	
	
	//defense pools
	for (let [key, def] of Object.entries(data.defenses)) {
		
		
		
		
		//def.passive = 0;
		for (i = 0; i <def.attr.length; i++)
		{
			def.passive += abilitybox[def.attr[i]].value;
		}
		def.active = def.passive + skillbox[def.skill].value + Math.min(skillbox[def.skill].value,Math.ceil(data.tradition.rank.value / 2));
		/*console.log(key);
		console.log(def.passive);
		console.log(def.active);*/
		/*if (!def.allowpassive)
		{
			def.passive = 0;
		}*/
	}
	//console.log(data.defenses);
	
	

	
    //Updating skills
	for (let [key, skill_group] of Object.entries(data.skill_groups)) {
        Object.entries(data.skills).forEach(k => {
            let [key, val] = k
            if (skill_group.members.includes(key)) {
              if (skill_group.value > 0) {
                val.value = skill_group.value;
                val.isGroupRanked = true;
              }
              else {
                val.isGroupRanked = false;
              }
            }
        });
    }
	for (let [key, skill] of Object.entries(data.skills)) {
		
		
		
		
	  if (skill.attr != "none") {
		skill.dicepool += skill.value + abilitybox[skill.attr].value + Math.min(skill.value,Math.ceil(data.tradition.rank.value / 2)) -1 * (skill.value == 0);
	  }
    }
	
	data.equipped_weapon.dicepool = data.equipped_weapon.reach + data.skills.weapon_skill.dicepool;


	// Prepare weapon DV and dicepool
	
	
	const weapons = actorData.items;
	//console.log(weapons);
	
	Object.entries(weapons).forEach(weapon => {
		//weapon[1].data.type == 'weapon'
		if (weapon[1].type == 'weapon')
		{
			console.log(weapon[1].data.attr);
			if (weapon[1].data.attr != "none"){
				weapon[1].data.dv = weapon[1].data.power + data.abilities[weapon[1].data.attr].value;
			}
			weapon[1].data.dicepool = weapon[1].data.reach + data.skills.weapon_skill.dicepool;
		
			if (weapon[1].data.active)
			{
				data.defenses.block.active += shield_bonuses[weapon[1].data.shield];
				data.defenses.parry.active += weapon[1].data.reach;
				//console.log(weapon);
			}
		}
		
	});
	
	
	
	
	
  }

}