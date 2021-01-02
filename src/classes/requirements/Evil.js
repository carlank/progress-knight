import { gameData } from '../../main.js'
import Requirement from '../Requirement.js'

export default class EvilRequirement extends Requirement {
  constructor (elements, requirements) {
    super(elements, requirements)
    this.type = 'evil'
  }

  getCondition (requirement) {
    return gameData.evil >= requirement.requirement
  }
}
