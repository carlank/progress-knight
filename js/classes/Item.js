import { gameData } from '../main.js';
import { applyMultipliers } from '../utils.js';

import { itemCategories } from '../config.js';

export default class Item {
    constructor(baseData) {  
        this.baseData = baseData
        this.name = baseData.name
        this.expenseMultipliers = []
    }

    getEffect() {
        if (gameData.currentProperty != this && !gameData.currentMisc.includes(this)) return 1
        const effect = this.baseData.effect
        return effect
    }

    getEffectDescription() {
        let description = this.baseData.description
        if (itemCategories["Properties"].includes(this.name)){
            description = "Happiness"
        }
        const text = "x" + this.baseData.effect.toFixed(1) + " " + description
        return text
    }

    getExpense() {
        return applyMultipliers(this.baseData.expense, this.expenseMultipliers)
    }
}