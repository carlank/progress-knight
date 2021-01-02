import {
  updateSpeed,
  baseGameSpeed,
  debugSpeed,
  baseLifespan
} from './config.js'

import { gameData } from './main.js'

import Job from './classes/tasks/Job.js'

export function getLifespan () {
  const immortality = gameData.taskData.Immortality
  const superImmortality = gameData.taskData['Super immortality']
  const lifespan = baseLifespan * immortality.getEffect() * superImmortality.getEffect()
  return lifespan
}

export function isAlive () {
  const condition = gameData.days < getLifespan()
  const deathText = document.getElementById('deathText')
  if (!condition) {
    gameData.days = getLifespan()
    deathText.classList.remove('hidden')
  } else {
    deathText.classList.add('hidden')
  }
  return condition
}

export function getGameSpeed () {
  const timeWarping = gameData.taskData['Time warping']
  const timeWarpingSpeed = gameData.timeWarpingEnabled ? timeWarping.getEffect() : 1
  const gameSpeed = baseGameSpeed * +!gameData.paused * +isAlive() * timeWarpingSpeed * debugSpeed
  return gameSpeed
}

export function applyMultipliers (value, multipliers) {
  let finalMultiplier = 1
  multipliers.forEach(function (multiplierFunction) {
    const multiplier = multiplierFunction()
    finalMultiplier *= multiplier
  })
  const finalValue = Math.round(value * finalMultiplier)
  return finalValue
}

export function applySpeed (value) {
  const finalValue = value * getGameSpeed() / updateSpeed
  return finalValue
}

export function daysToYears (days) {
  const years = Math.floor(days / 365)
  return years
}

export function yearsToDays (years) {
  const days = years * 365
  return days
}

export function getDay () {
  const day = Math.floor(gameData.days - daysToYears(gameData.days) * 365)
  return day
}

export function removeSpaces (string) {
  return string.replace(/ /g, '')
}

export function getIncome () {
  return gameData.currentJob.getIncome()
}

export function getExpense () {
  let expense = 0
  expense += gameData.currentProperty.getExpense()
  for (const misc of gameData.currentMisc) {
    expense += misc.getExpense()
  }
  return expense
}

export function getNet () {
  const net = Math.abs(getIncome() - getExpense())
  return net
}
export function getHappiness () {
  const meditationEffect = getBindedTaskEffect('Meditation')
  const butlerEffect = getBindedItemEffect('Butler')
  const happiness = meditationEffect() * butlerEffect() * gameData.currentProperty.getEffect()
  return happiness
}
export function getEvilGain () {
  const evilControl = gameData.taskData['Evil control']
  const bloodMeditation = gameData.taskData['Blood meditation']
  const evil = evilControl.getEffect() * bloodMeditation.getEffect()
  return evil
}

export function getBindedTaskEffect (taskName) {
  const task = gameData.taskData[taskName]
  return task.getEffect.bind(task)
}

export function getBindedItemEffect (itemName) {
  const item = gameData.itemData[itemName]
  return item.getEffect.bind(item)
}

export function setTask (taskName) {
  const task = gameData.taskData[taskName]
  task instanceof Job ? gameData.currentJob = task : gameData.currentSkill = task
}

export function setProperty (propertyName) {
  const property = gameData.itemData[propertyName]
  gameData.currentProperty = property
}

export function setMisc (miscName) {
  const misc = gameData.itemData[miscName]
  if (gameData.currentMisc.includes(misc)) {
    for (let i = 0; i < gameData.currentMisc.length; i++) {
      if (gameData.currentMisc[i] == misc) {
        gameData.currentMisc.splice(i, 1)
      }
    }
  } else {
    gameData.currentMisc.push(misc)
  }
}
