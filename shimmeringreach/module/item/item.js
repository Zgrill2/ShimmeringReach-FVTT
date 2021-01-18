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

  }
  
  _prepareFeatureData(actorData, itemData) {
    //console.log(actorData);
    //console.log(itemData.selection);

    const adata = actorData;
    const idata = itemData;
    let [category, selection] = itemData.category.split(".")
	console.log("IN PREP FEATURE");
    
    if (!(selection == null)) {
        for (let [key, ob] of Object.entries(adata)) {
            if (key == category && ob.hasOwnProperty(selection)) {
                ob[selection].value += idata.bonus;
            }
        }
    }
    
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
