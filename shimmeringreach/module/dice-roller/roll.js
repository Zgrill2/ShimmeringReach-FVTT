/**
 * An error that occurs during the rolling of dice.
 */
export class DiceError extends Error {
    constructor(message) {
        super(message);
    }
}

// import Roll

export class RollDP extends Roll {

    constructor(formula =0, actor = -1, explode = false, applyWounds = false) {
    //    console.log("initializing dicepool roller$$$");
        
		console.log(formula);
		if (applyWounds){
			formula -= actor.wound_penalty.value;
		}
		formula = formula.toString();
		formula += "d6";
		if (explode){
			formula += "x=6";
		}
		formula +="cf=1cs>=5";
		console.log(explode);
		console.log(formula);
		
		super(formula);
		
		this._formula = formula;
        this._actor = actor;
        this._explode = explode;
		this._applyWounds = applyWounds;
        this.dicepool = this.terms[0]["number"];
		if (applyWounds){
			this.dicepool -= actor.wound_penalty.value;
		}
		console.log(this);
    }

    roll() {
        //const result = super.roll(this.formula);
        //console.log(result);
        //Object.assign(this, result);
//        let formula = this.dicepool;//`${count}d6`;
//        formula += `d6cf=1cs>=5`;
       let r = new Roll(this._formula)
        //console.log(formula);
        //console.log(r);
        return r;
		//super();
    }
/*
    async render(chatOptions = {}) {
		console.log("ding");
    chatOptions = mergeObject({
      user: game.user._id,
      flavor: null,
      template: this.constructor.CHAT_TEMPLATE,
      blind: false
    }, chatOptions);
    const isPrivate = chatOptions.isPrivate;

    // Execute the roll, if needed
    if (!this._rolled) this.roll();

    // Define chat data
    const chatData = {
    //  formula: isPrivate ? "???" : this._formula,
	  formula: "Blah",
      flavor: isPrivate ? null : chatOptions.flavor,
      user: chatOptions.user,
      tooltip: isPrivate ? "" : await this.getTooltip(),
      total: isPrivate ? "?" : Math.round(this.total * 100) / 100
    };

    // Render the roll display template
    return renderTemplate(chatOptions.template, chatData);
  }
    
    toMessage(...args){
        console.log("Testing toMessage inheritence");
        return super.toMessage(...args);
    }*/
    
    // Override render inheritence
	
    render(chatOptions) {
        return super.render(chatOptions);
    }
    
    // Override tooltip inheritence
    getTooltip() {
        return super.getTooltip();
    }
    // Override render inheritence
    render() {
        return super.render();
    }
    
    count_result_faces(count_me) {
        var hits = 0;
        let i;
        for (i = 0; i < count_me.length; i++) {
            let x;
            for (x = 0; x < this.terms[0].results.length; x++) {
                if (this.terms[0].results[x]["result"] == count_me[i]) {
                    hits += 1
                }
            }
        }
        return hits;
    }
    
    count_sucesses() {
        /*
        * purpose: count 5s and 6s in a resulting dicepool
        * Should this function take control of setting value in Roll class?
        */
        let sucesses = this.count_result_faces([5,6]);
        return sucesses;
    }
    
    count_failures() {
        let failures = this.count_result_faces([1]);
        return failures;
    }
    
    is_fumble() {
        return (this.count_failures() > this.terms[0]["number"] / 2.0);
    }
    
    is_critical_fumble(){
        return (this.is_fumble() && this.count_sucesses() == 0);
    }
    
}
