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

    // Loop through ability scores, and add their modifiers to our sheet output.
    let abilitybox = {};
	for (let [key, ability] of Object.entries(data.abilities)){
		abilitybox[key] = ability;
	}
	
	
	
	for (let [key, skill] of Object.entries(data.skills)) {
      // Calculate the modifier using d20 rules.
	  if (skill.attr != "none") {
		skill.dicepool = skill.value + abilitybox[skill.attr].value;
	  }
    }
	//console.log(abilitybox);
  }

}