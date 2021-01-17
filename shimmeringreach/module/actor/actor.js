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
	//Calculate bars. Will probably add some extra calls that boost these further
	data.health.max = data.abilities.bod.value + 16;
	data.mana.max = data.abilities.int.value + 16;
	data.stamina.max = data.abilities.wil.value + 16;

	
	//Calculate soaks via JSON defined formulas of attribute weighting
	var i;
	for (let [key, soak] of Object.entries(data.soaks)) {
		soak.value = 0;
		for (i = 0; i <soak.attr.length; i++)
		{
			soak.value += abilitybox[soak.attr[i]].value * soak.weights[i];
		}
		soak.value = Math.ceil((soak.value) / soak.attr.length );
	}
	
	

	for (let [key, def] of Object.entries(data.defenses)) {
		
		def.passive = 0;
		for (i = 0; i <def.attr.length; i++)
		{
			def.passive += abilitybox[def.attr[i]].value;
		}
		console.log(skillbox[def.skill].value);
		console.log(def.passive);
		def.active = def.passive + skillbox[def.skill].value;
		
		if (!def.allowpassive)
		{
			def.passive = 0;
		}
	}
	
    //let update_skill_val = {}
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
            //Object.entries(data.skills)[k].value = skill_group.value;
            //update_skill_val[k] = skill_group.value
        });
    }s
	for (let [key, skill] of Object.entries(data.skills)) {
      // Calculate the modifier using d20 rules.
	  if (skill.attr != "none") {
		skill.dicepool = skill.value + abilitybox[skill.attr].value + Math.min(skill.value,Math.ceil(data.tradition.rank.value / 2));
	  }
    }
	//console.log(abilitybox);
  }

}