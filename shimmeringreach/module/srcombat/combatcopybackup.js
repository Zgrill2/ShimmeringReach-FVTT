class SRCombat extends Combat {
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

  /* -------------------------------------------- */

  /**
   * The configuration setting used to record Combat preferences
   * @type {string}
   */
  static CONFIG_SETTING = "combatTrackerConfig";

  /* -------------------------------------------- */

  /** @override */
  static get config() {
    return {
      baseEntity: Combat,
      collection: game.combats,
      embeddedEntities: { "Combatant": "combatants" },
      label: "ENTITY.Combat"
    };
  }

	/* -------------------------------------------- */

  /**
   * Prepare Embedded Entities which exist within the parent Combat.
   * For example, in the case of an Actor, this method is responsible for preparing the Owned Items the Actor contains.
   */
	prepareEmbeddedEntities() {
	  this.turns = this.setupTurns();
  }

  /* -------------------------------------------- */

  /**
   * Return the Array of combatants sorted into initiative order, breaking ties alphabetically by name.
   * @return {Combatant[]}
   */
  setupTurns() {
    const combatants = this.data.combatants;
    const scene = game.scenes.get(this.data.scene);
    const players = game.users.players;
    const settings = game.settings.get("core", Combat.CONFIG_SETTING);

    // Determine the turn order and the current turn
    const turns = combatants.map(c => this._prepareCombatant(c, scene, players, settings)).sort(this._sortCombatants);
    this.data.turn = Math.clamped(this.data.turn, 0, turns.length-1);

	  // Update state tracking
    let c = turns[this.data.turn];
    this.current = {round: this.data.round, turn: this.data.turn, tokenId: c ? c.tokenId : null};
    return this.turns = turns;
  }

  /* -------------------------------------------- */

  /**
   * Prepare turn data for one specific combatant.
   * @private
   */
  _prepareCombatant(c, scene, players, settings={}) {

    // Populate data about the combatant
    c.token = scene.getEmbeddedEntity("Token", c.tokenId);
    c.actor = c.token ? Actor.fromToken(new Token(c.token, scene)) : null;
    c.name = c.name || c.token?.name || c.actor?.name || game.i18n.localize("COMBAT.UnknownCombatant");

    // Permissions and visibility
    c.permission = c.actor?.permission ?? 0;
    c.players = c.actor ? players.filter(u => c.actor.hasPerm(u, "OWNER")) : [];
    c.owner = game.user.isGM || (c.actor ? c.actor.owner : false);
    c.resource = c.actor ? getProperty(c.actor.data.data, settings.resource) : null;

    // Combatant thumbnail image
    c.img = c.img ?? c.token?.img ?? c.actor?.img ?? CONST.DEFAULT_TOKEN;

    // Set state information
    c.initiative = Number.isNumeric(c.initiative) ? Number(c.initiative) : null;
    c.visible = c.owner || !c.hidden;
    return c;
  }

  /* -------------------------------------------- */

  /**
   * Define how the array of Combatants is sorted in the displayed list of the tracker.
   * This method can be overridden by a system or module which needs to display combatants in an alternative order.
   * By default sort by initiative, falling back to name
   * @private
   */
  _sortCombatants(a, b) {
    const ia = Number.isNumeric(a.initiative) ? a.initiative : -9999;
    const ib = Number.isNumeric(b.initiative) ? b.initiative : -9999;
    let ci = ib - ia;
    if ( ci !== 0 ) return ci;
    let [an, bn] = [a.token?.name || "", b.token?.name || ""];
    let cn = an.localeCompare(bn);
    if ( cn !== 0 ) return cn;
    return a.tokenId - b.tokenId;
  }

  /* -------------------------------------------- */
  /*  Properties                                  */
  /* -------------------------------------------- */

  /**
   * A convenience reference to the Array of combatant data within the Combat entity
   * @type {object[]}
   */
  get combatants() {
    return this.data.combatants;
  }

  /* -------------------------------------------- */

  /**
   * Get the data object for the Combatant who has the current turn
   * @type {Combatant}
   */
  get combatant() {
    return this.turns[this.data.turn];
  }

  /* -------------------------------------------- */

  /**
   * The numeric round of the Combat encounter
   * @type {number}
   */
  get round() {
    return Math.max(this.data.round, 0);
  }

  /* -------------------------------------------- */

  /**
   * The numeric turn of the combat round in the Combat encounter
   * @type {number}
   */
  get turn() {
    return Math.max(this.data.turn, 0);
  }

  /* -------------------------------------------- */

  /**
   * Get the Scene entity for this Combat encounter
   * @return {Scene}
   */
  get scene() {
    return game.scenes.get(this.data.scene);
  }

  /* -------------------------------------------- */

  /**
   * Return the object of settings which modify the Combat Tracker behavior
   * @return {object}
   */
  get settings() {
    return this.collection.settings;
  }

  /* -------------------------------------------- */

  /**
   * Has this combat encounter been started?
   * @type {boolean}
   */
  get started() {
    return ( this.turns.length > 0 ) && ( this.round > 0 );
  }

  /* -------------------------------------------- */
  /*  Combat Control Methods                      */
  /* -------------------------------------------- */

  /**
   * Set the current Combat encounter as active within the Scene.
   * Deactivate all other Combat encounters within the viewed Scene and set this one as active
   * @return {Promise<Combat>}
   */
  async activate() {
    const scene = game.scenes.viewed;
    const updates = this.collection.entities.reduce((arr, c) => {
      if ( (c.data.scene === scene.id) && c.data.active ) arr.push({_id: c.data._id, active: false});
      return arr;
    }, []);
    updates.push({_id: this.id, active: true});
    return this.constructor.update(updates);
  }

  /* -------------------------------------------- */

  /**
   * Begin the combat encounter, advancing to round 1 and turn 1
   * @return {Promise<Combat>}
   */
  async startCombat() {
    return this.update({round: 1, turn: 0});
  }

  /* -------------------------------------------- */

  /**
   * Advance the combat to the next turn
   * @return {Promise<Combat>}
   */
  async nextTurn() {
    let turn = this.turn;
    let skip = this.settings.skipDefeated;

    // Determine the next turn number
    let next = null;
    if ( skip ) {
      for ( let [i, t] of this.turns.entries() ) {
        if ( i <= turn ) continue;
        if ( t.defeated ) continue;
        if ( t.actor?.effects.find(e => e.getFlag("core", "statusId") === CONFIG.Combat.defeatedStatusId ) ) continue;
        next = i;
        break;
      }
    }
    else next = turn + 1;

    // Maybe advance to the next round
    let round = this.round;
    if ( (this.round === 0) || (next === null) || (next >= this.turns.length) ) {
      return this.nextRound();
    }

    // Update the encounter
    const advanceTime = CONFIG.time.turnTime;
    this.update({round: round, turn: next}, {advanceTime});
  }

  /* -------------------------------------------- */

  /**
   * Rewind the combat to the previous turn
   * @return {Promise<Combat>}
   */
  async previousTurn() {
    if ( this.turn === 0 && this.round === 0 ) return Promise.resolve();
    else if ( this.turn === 0 ) return this.previousRound();
    const advanceTime = -1 * CONFIG.time.turnTime;
    return this.update({turn: this.turn - 1}, {advanceTime});

  }

  /* -------------------------------------------- */

  /**
   * Advance the combat to the next round
   * @return {Promise<Combat>}
   */
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
    return this.update({round: this.round+1, turn: turn}, {advanceTime});
  }

  /* -------------------------------------------- */

  /**
   * Rewind the combat to the previous round
   * @return {Promise<Combat>}
   */
  async previousRound() {
    let turn = ( this.round === 0 ) ? 0 : this.turns.length - 1;
    const round = Math.max(this.round - 1, 0);
    let advanceTime = -1 * this.data.turn * CONFIG.time.turnTime;
    if ( round > 0 ) advanceTime -= CONFIG.time.roundTime;
    return this.update({round, turn}, {advanceTime});
  }

  /* -------------------------------------------- */

  /**
   * Reset all combatant initiative scores, setting the turn back to zero
   * @return {Promise<Combat>}
   */
  async resetAll() {
    const updates = this.data.combatants.map(c => { return {
      _id: c._id,
      initiative: null
    }});
    await this.updateEmbeddedEntity("Combatant", updates);
    return this.update({turn: 0});
  }

  /* -------------------------------------------- */

  /**
   * Display a dialog querying the GM whether they wish to end the combat encounter and empty the tracker
   * @return {Promise<void>}
   */
  async endCombat() {
    return Dialog.confirm({
      title: "End Combat Encounter?",
      content: "<p>End this combat encounter and empty the turn tracker?</p>",
      yes: () => this.delete()
    });
  }

  /* -------------------------------------------- */
  /*  Combatant Management Methods                */
  /* -------------------------------------------- */

  /** @override */
  getCombatant(id) {
    return this.getEmbeddedEntity("Combatant", id);
  }

  /* -------------------------------------------- */

  /**
   * Get a Combatant using its Token id
   * @param {string} tokenId   The id of the Token for which to acquire the combatant
   */
  getCombatantByToken(tokenId) {
    return this.turns.find(c => c.tokenId === tokenId);
  }

  /* -------------------------------------------- */

  /**
   * Set initiative for a single Combatant within the Combat encounter.
   * Turns will be updated to keep the same combatant as current in the turn order
   * @param {string} id         The combatant ID for which to set initiative
   * @param {number} value      A specific initiative value to set
   */
  async setInitiative(id, value) {
    const currentId = this.combatant._id;
    await this.updateCombatant({_id: id, initiative: value}, {});
    await this.update({turn: this.turns.findIndex(c => c._id === currentId)});
  }

  /* -------------------------------------------- */

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

  /* -------------------------------------------- */

  /**
   * Acquire the default dice formula which should be used to roll initiative for a particular combatant.
   * Modules or systems could choose to override or extend this to accommodate special situations.
   * @private
   *
   * @param {object} combatant      Data for the specific combatant for whom to acquire an initiative formula. This
   *                                is not used by default, but provided to give flexibility for modules and systems.
   * @return {string}               The initiative formula to use for this combatant.
   */
  _getInitiativeFormula(combatant) {
    return CONFIG.Combat.initiative.formula || game.system.data.initiative;
  }

  /* -------------------------------------------- */

  /**
   * Get a Roll object which represents the initiative roll for a given combatant.
   * @private
   * @param {object} combatant      Data for the specific combatant for whom to acquire an initiative formula. This
   *                                is not used by default, but provided to give flexibility for modules and systems.
   * @param {string} formula        An explicit Roll formula to use for the combatant.
   * @return {Roll}                 The Roll instance to use for the combatant.
   */
  _getInitiativeRoll(combatant, formula) {
    const rollData = combatant.actor ? combatant.actor.getRollData() : {};
    return Roll.create(formula, rollData).roll();
  }

  /* -------------------------------------------- */

  /**
   * Roll initiative for all non-player actors who have not already rolled
   * @param {...*}  args    Additional arguments forwarded to the Combat.rollInitiative method
   */
  async rollNPC(...args) {
    const npcs = this.turns.filter(t => (!t.actor || !t.players.length) && !t.initiative);
    return this.rollInitiative(npcs.map(t => t._id), ...args);
  }

  /* -------------------------------------------- */

  /**
   * Roll initiative for all combatants which have not already rolled
   * @param {...*} args     Additional arguments forwarded to the Combat.rollInitiative method
   */
  async rollAll(...args) {
    const unrolled = this.turns.filter(t => t.owner && !t.initiative);
    return this.rollInitiative(unrolled.map(t => t._id), ...args);
  }

  /* -------------------------------------------- */

  /**
   * Create a new Combatant embedded entity
   * @see {@link Combat#createEmbeddedEntity}
   */
  async createCombatant(data, options) {
    return this.createEmbeddedEntity("Combatant", data, options);
  }

  /* -------------------------------------------- */

  /**
   * Update an existing Combatant embedded entity
   * @see {@link Combat#updateEmbeddedEntity}
   */
  async updateCombatant(data, options) {
    return this.updateEmbeddedEntity("Combatant", data, options);
  }

  /* -------------------------------------------- */

  /**
   * Delete an existing Combatant embedded entity
   * @see {@link Combat#deleteEmbeddedEntity}
   */
  async deleteCombatant(id, options) {
    return this.deleteEmbeddedEntity("Combatant", id, options);
  }

  /* -------------------------------------------- */
  /*  Socket Events and Handlers
  /* -------------------------------------------- */

  /** @override */
  _onCreate(...args) {
    if ( !this.collection.viewed ) ui.combat.initialize({combat: this});
  }

  /* -------------------------------------------- */

  /** @override */
	_onUpdate(data, ...args) {
	  super._onUpdate(data, ...args);
    this.previous = this.current;

	  // If the Combat was set as active, initialize the sidebar
    if ( (data.active === true) && ( this.data.scene === game.scenes.viewed._id ) ) {
      ui.combat.initialize({combat: this});
    }

    // Render the sidebar
    if ( ["combatants", "round", "turn"].some(k => data.hasOwnProperty(k)) ) {
      if ( data.combatants ) this.setupTurns();
      ui.combat.scrollToTurn();
    }
  }

  /* -------------------------------------------- */

  /** @override */
  _onDelete(...args) {
    if ( this.collection.viewed === this ) ui.combat.initialize();
  }

  /* -------------------------------------------- */

  /** @override */
  _onDeleteEmbeddedEntity(embeddedName, child, options, userId) {
    super._onDeleteEmbeddedEntity(embeddedName, child, options, userId);
    const deletedTurn = this.turns.findIndex(t => t._id === child._id);
    if ( deletedTurn <= this.turn ) return this.update({turn: this.turn - 1});
  }

  /* -------------------------------------------- */

  /** @override */
  _onModifyEmbeddedEntity(...args) {
    this.setupTurns();
    if ( this === this.collection.viewed ) this.collection.render();
  }
}