// import Roll

export class RollDP extends Roll {
    constructor(formula, data) {
        console.log("initializing dicepool roller");
        super(formula, data);
        let dicepool = len(data.results); // this needs to be handled pre evaluate() or we will have a potenital race condition
    }
    
    count_result_faces(count_me) {
        let hits = 0;
        for i in count_me {
            // todo: fix python syntax into js
            hits += len([for x in self.data.results if x == i]);
        }
        return hits;
    }
    
    count_sucesses() {
        /*
        * purpose: count 5s and 6s in a resulting dicepool
        * Should this function take control of setting value in Roll class?
        */
        sucesses = count_result_faces([5,6]);
        return sucesses;
    }
    
    count_failures() {
        failures = count_result_faces([1]);
        return failures;
    }
    
    is_fumble() {
        if count_failures() >= self.dicepool / 2.0 {
            return true;
        }
        return false;
    }
    
    is_critical_fumble(){
        if is_fumble() && count_sucesses() == 0{
            return true;
        }
        return false;
    }
    
}
