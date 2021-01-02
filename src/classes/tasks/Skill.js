import Task from '../Task.js'

export default class Skill extends Task {
  constructor (baseData) {
    super(baseData)
  }

  getEffect () {
    return 1 + this.baseData.effect * this.level
  }

  getEffectDescription () {
    const description = this.baseData.description
    const text = 'x' + String(this.getEffect().toFixed(2)) + ' ' + description
    return text
  }
}
