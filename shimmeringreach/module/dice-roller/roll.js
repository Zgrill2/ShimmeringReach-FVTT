// import Roll

export class RollDP extends Roll {
    constructor(formula, data) {
        console.log("initializing dicepool roller");
        super(formula, data);
    }
    
    my_func() {
        return "foo";
    }
}