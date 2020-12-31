// import Roll

export class RollDP extends Roll {
    constructor(formula, data) {
        console.log("initializing dicepool roller");
        super(formula, data);
      //  let dicepool = this.terms[0]["number"];
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
        if (this.count_failures() >= this.terms[0]["number"] / 2.0) {
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