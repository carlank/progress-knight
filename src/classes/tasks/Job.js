import { applyMultipliers } from '../../utils.js'

import Task from '../Task.js'

export default class Job extends Task {
  constructor (baseData) {
    super(baseData)
    this.incomeMultipliers = []
  }

  getLevelMultiplier () {
    return 1 + Math.log10(this.level + 1)
  }

  getIncome () {
    return applyMultipliers(this.baseData.income, this.incomeMultipliers)
  }
}
