

export class SRCombat extends Combat {
	
	constructor(...args) {
    super(...args);
  }
	
  
  /** @override */
	_sortCombatants(a, b) {
    const ia = Number.isNumeric(a.initiative) ? a.initiative : -9999;
    const ib = Number.isNumeric(b.initiative) ? b.initiative : -9999;
    let ci = ib - ia;
	
	let at = a.actor.data.data;
	let bt = b.actor.data.data;
	
	/* Sort by turn order.
	First pass through on new round all turn orders are identical, bypassing this part.
	Immediately afterwards the results of the sort are locked by writing them to turn order.
	*/
	let ord = a.order - b.order;
	if (ord !== 0 ) return ord;
	// sort by init
    if ( ci !== 0 ) return ci;
		
	// tiebreak by REA. Returns positive if B is bigger
	
	let dR = bt.abilities.rea.value - at.abilities.rea.value;
	if (dR !== 0 ) return dR;
	// tiebreak by LUK
	let dL = bt.luck.max.value - at.luck.max.value;
	if (dL !== 0 ) return dL;
	
	
	let dLC = bt.luck.current.value - at.luck.current.value;
	if (dLC !== 0 ) return dLC;
	
	// sorting by name
    let [an, bn] = [a.token?.name || "", b.token?.name || ""];
    let cn = an.localeCompare(bn);
    if ( cn !== 0 ) return cn;
	
	//sort by token ID
    return a.tokenId - b.tokenId;
  }
  
  async assignOrder()
  { 
  let firstInit = -10;
  for ( let [i, t] of this.turns.entries() ) {
	if(!t.order){
		//t.data.({order: i});
	}
	t.data.update({order: i, initiative: t.initiative + firstInit});
	if (i == 0){
		firstInit = 0;
	}
  }
	return null;
  }
  
  
  
	
	/** @override */
	async nextTurn() {
    let turn = this.turn;

    // Determine the next turn number
    let next = null;
	let hasinit = false;
	do {
      for ( let [i, t] of this.turns.entries() ) {
		if ( t.defeated ) continue; //if defeated don't get a turn
		if ( t.initiative <= 0 ) continue; //if 0 init no turn
		hasinit = true; //someone alive has init left, do not go to next round
        if ( i <= turn ) continue; //if you've already had a turn, no turn
        if ( t.actor?.effects.find(e => e.getFlag("core", "statusId") === CONFIG.Combat.defeatedStatusId ) ) continue;
        next = i;

		this.setInitiative(t.id, t.initiative -10);
        break;
      }
		if (!hasinit)
		{
			next = -1; //case for next round
		}
		else
		{
			turn = -1; //wrap back around
		}
		
	} while (next === null) ;
    // Maybe advance to the next round
    let round = this.round;
    if ( (this.round === 0) || (hasinit === false) ) {
      return this.nextRound();
    }

    // Update the encounter
    const advanceTime = CONFIG.time.turnTime;
	
    this.update({round: round, turn: next}, {advanceTime});
//	game.combat.rollAll();
  }
	
	
	/**  @override  */
	async nextRound() {
	
	let turn = 0;
    if ( this.settings.skipDefeated ) {
      turn = this.turns.findIndex(t => {
        return !(t.defeated ||
        t.actor?.effects.find(e => e.getFlag("core", "statusId") === CONFIG.Combat.defeatedStatusId ));
      });
      if (turn === -1) {
        ui.notifications.warn(game.i18n.localize("COMBAT.NoneRemaining"));
        turn = 0;
      }
    }
    let advanceTime = Math.max(this.turns.length - this.data.turn, 1) * CONFIG.time.turnTime;
    advanceTime += CONFIG.time.roundTime;

	await this.resetAll();
	await this.rollAll();
	await this.assignOrder();
	// not triggering correctly. Is this because it's an async call?

	
	return this.update({round: this.round+1, turn: turn}, {advanceTime});
	
	
	
  }


	 async resetAll() {
    for ( let c of this.combatants ) {
      c.data.update({initiative: null});
	  c.data.update({order: 0});
    }
    return this.update({combatants: this.combatants.toJSON()}, {diff: false});
  }



	
	
	
}