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
    
            console.log(idata.category);
            
            console.log(idata.selection);
    if (idata.category in adata) {
        if (itemData.selection in adata[idata.category]){
            adata[idata.category][idata.selection].value += idata.bonus
            console.log(adata[idata.category])
            console.log(adata[idata.category][idata.selection])
            console.log(adata[idata.category][idata.selection].value);
            
            console.log(idata.category);
            
            console.log(idata.selection);
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
