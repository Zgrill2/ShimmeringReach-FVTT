export class SRCombatant extends Combatant {


	constructor(...args) {
    super(...args);
	console.log("firing combatant construction");
	console.log((this.getFlag("shimmeringreach","order")));
	if (!(this.getFlag("shimmeringreach","order"))){
		this.setFlag("shimmeringreach", "order",0);
		console.log("new order");
	}
	
  }


	get order(){
		return this.getFlag("shimmeringreach","order");;
	}

}