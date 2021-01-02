import { gameData } from '../../main.js';
import { daysToYears } from '../../utils.js';

import Requirement from '../Requirement.js';

export default class AgeRequirement extends Requirement {
    constructor(elements, requirements) {
        super(elements, requirements)
        this.type = "age"
    }

    getCondition(requirement) {
        return daysToYears(gameData.days) >= requirement.requirement
    }
}