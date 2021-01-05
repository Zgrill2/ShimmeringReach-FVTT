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

    constructor(formula, limit = -1, explode = false) {
        console.log("initializing dicepool roller$$$");
        super(formula);
        this._limit = limit;
        this._explode = explode;
        this.dicepool = this.terms[0]["number"];
    }

    roll() {
        //const result = super.roll(this.formula);
        //console.log(result);
        //Object.assign(this, result);
        let formula = this.formula;//`${count}d6`;
        formula += `cs>=5`;
        let r = new Roll(formula)
        console.log(formula);
        console.log(r);
        return r;
    }

    /*async render(chatOptions) {
        return await super.render(chatOptions);
    }*/
    
    toMessage(args){
        console.log("Testing toMessage inheritence");
        return super.toMessage(args);
    }
    
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
        if (this.count_failures() > this.terms[0]["number"] / 2.0) {
            return true;
        }
        return false;
    }
    
    is_critical_fumble(){
        if (this.is_fumble() && this.count_sucesses() == 0) {
            return true;
        }
        return false;
    }
    
}
