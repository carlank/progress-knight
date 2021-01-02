import {
  gameData
} from '../../main.js';

import Requirement from '../Requirement.js';

export default class CoinRequirement extends Requirement {
    constructor(elements, requirements) {
        super(elements, requirements)
        this.type = "coins"
    }

    getCondition(requirement) {
        return gameData.coins >= requirement.requirement
    }
}