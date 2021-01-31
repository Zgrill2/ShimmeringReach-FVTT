

export class SRCombat extends Combat {
	
	constructor(...args) {
    super(...args);

    /**
     * Track the sorted turn order of this combat encounter
     * @type {Combatant[]}
     */
    this.turns = this.turns || [];

    /**
     * Record the current round, turn, and tokenId to understand changes in the encounter state
     * @type {{round: number|null, turn: number|null, tokenId: string|null}}
     * @private
     */
    this.current = this.current || {
      round: null,
      turn: null,
      tokenId: null
    };

    /**
     * Track the previous round, turn, and tokenId to understand changes in the encounter state
     * @type {{round: number|null, turn: number|null, tokenId: string|null}}
     * @private
     */
    this.previous = this.previous || {
      round: null,
      turn: null,
      tokenId: null
    };

    /**
     * Track whether a sound notification is currently being played to avoid double-dipping
     * @type {boolean}
     * @private
     */
    this._soundPlaying = false;
  }
	
	
	/** @override */
	_sortCombatants(a, b) {
    const ia = Number.isNumeric(a.initiative) ? a.initiative : -9999;
    const ib = Number.isNumeric(b.initiative) ? b.initiative : -9999;
    let ci = ib - ia;
	let at = a.actor._data.data;
	let bt = b.actor._data.data;
	
//	console.log(at);
	
	// case for one or more lacking initiative
    if ( ci !== 0 ) return ci;
    let [an, bn] = [a.token?.name || "", b.token?.name || ""];
	
	// tiebreak by REA. Returns positive if B is bigger
	
	let dR = bt.abilities.rea.value - at.abilities.rea.value;
	if (dR !== 0 ) return dR;
	// tiebreak by LUK
	let dL = bt.luck.max.value - at.luck.max.value;
	if (dL !== 0 ) return dL;
	
	
	let dLC = bt.luck.current.value - at.luck.current.value;
	if (dLC !== 0 ) return dLC;
	
	// sorting by name
    let cn = an.localeCompare(bn);
    if ( cn !== 0 ) return cn;
	
	//sort by token ID
    return a.tokenId - b.tokenId;
  }
	
	async nextTurn() {
    let turn = this.turn;

    // Determine the next turn number
    let next = null;
	let hasinit = false;
	/*
	let acts_left = false;
	for ( let [i, t] of this.turns.entries() ) {
		acts_left = acts_left || !(t.acted);
	}
	if (!(acts_left)) {
		for ( let [i, t] of this.turns.entries() ) {
		t.acted = false
		}
	}*/
	do {
//	console.log(this.turns[0] ) ;
      for ( let [i, t] of this.turns.entries() ) {
//		  console.log(t);


		if ( t.initiative <= 0 ) continue; //if 0 init no turn
		hasinit = true;
        if ( i <= turn ) continue; //if you've already had a turn, no turn
        if ( t.defeated ) continue; //if defeated don't get a turn
        if ( t.actor?.effects.find(e => e.getFlag("core", "statusId") === CONFIG.Combat.defeatedStatusId ) ) continue;
        next = i;

		this.setInitiative(t._id, t.initiative -10);
        break;
      }
//	console.log(next);
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
//	console.log(this);
	this.resetAll();
	
//	console.log("next round");
//	console.log(this.turns);
	game.combat.rollAll();
	
	// not triggering correctly. Is this because it's an async call?
	return this.update({round: this.round+1, turn: turn}, {advanceTime});
  }
	
	
	
	async rollAll(...args) {
    const unrolled = this.turns.filter(t => t.owner && !t.initiative);
	console.log("unrolled");
	console.log(unrolled);
	console.log("this turns");
	console.log(this.turns);
    return this.rollInitiative(unrolled.map(t => t._id), ...args);
  }
	
	
	
	 /**
   * Roll initiative for one or multiple Combatants within the Combat entity
   * @param {string|string[]} ids     A Combatant id or Array of ids for which to roll
   * @param {string|null} [formula]   A non-default initiative formula to roll. Otherwise the system default is used.
   * @param {boolean} [updateTurn]    Update the Combat turn after adding new initiative scores to keep the turn on
   *                                  the same Combatant.
   * @param {object} [messageOptions] Additional options with which to customize created Chat Messages
   * @return {Promise<Combat>}        A promise which resolves to the updated Combat entity once updates are complete.
   */
  async rollInitiative(ids, {formula=null, updateTurn=true, messageOptions={}}={}) {

    // Structure input data
    ids = typeof ids === "string" ? [ids] : ids;
    const currentId = this.combatant._id;
	console.log("init roll IDs");
	console.log(ids);
    // Iterate over Combatants, performing an initiative roll for each
    const [updates, messages] = ids.reduce((results, id, i) => {
      let [updates, messages] = results;

      // Get Combatant data
      const c = this.getCombatant(id);
      if ( !c || !c.owner ) return results;

      // Roll initiative
      const cf = formula || this._getInitiativeFormula(c);
      const roll = this._getInitiativeRoll(c, cf);
      updates.push({_id: id, initiative: roll.total});

      // Determine the roll mode
      let rollMode = messageOptions.rollMode || game.settings.get("core", "rollMode");
      if (( c.token.hidden || c.hidden ) && (rollMode === "roll") ) rollMode = "gmroll";

      // Construct chat message data
      let messageData = mergeObject({
        speaker: {
          scene: canvas.scene._id,
          actor: c.actor ? c.actor._id : null,
          token: c.token._id,
          alias: c.token.name
        },
        flavor: `${c.token.name} rolls for Initiative!`,
        flags: {"core.initiativeRoll": true}
      }, messageOptions);
      const chatData = roll.toMessage(messageData, {create:false, rollMode});

      // Play 1 sound for the whole rolled set
      if ( i > 0 ) chatData.sound = null;
      messages.push(chatData);

      // Return the Roll and the chat data
      return results;
    }, [[], []]);
    if ( !updates.length ) return this;

    // Update multiple combatants
    await this.updateEmbeddedEntity("Combatant", updates);

    // Ensure the turn order remains with the same combatant
    if ( updateTurn ) {
      await this.update({turn: this.turns.findIndex(t => t._id === currentId)});
    }

    // Create multiple chat messages
    await CONFIG.ChatMessage.entityClass.create(messages);

    // Return the updated Combat
    return this;
  }

	
	
	
	
	
}