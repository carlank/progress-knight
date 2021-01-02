import { gameData } from '../../main.js'
import Requirement from '../Requirement.js'

export default class TaskRequirement extends Requirement {
  constructor (elements, requirements) {
    super(elements, requirements)
    this.type = 'task'
  }

  getCondition (requirement) {
    return gameData.taskData[requirement.task].level >= requirement.requirement
  }
}
