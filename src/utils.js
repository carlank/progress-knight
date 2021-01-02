import {
  updateSpeed,
  baseGameSpeed,
  debugSpeed,
  baseLifespan
} from './config.js';

import { gameData } from './main.js';

export function getLifespan() {
    const immortality = gameData.taskData["Immortality"]
    const superImmortality = gameData.taskData["Super immortality"]
    const lifespan = baseLifespan * immortality.getEffect() * superImmortality.getEffect()
    return lifespan
}

export function isAlive() {
    const condition = gameData.days < getLifespan()
    const deathText = document.getElementById("deathText")
    if (!condition) {
        gameData.days = getLifespan()
        deathText.classList.remove("hidden")
    }
    else {
        deathText.classList.add("hidden")
    }
    return condition
}

export function getGameSpeed() {
    const timeWarping = gameData.taskData["Time warping"]
    const timeWarpingSpeed = gameData.timeWarpingEnabled ? timeWarping.getEffect() : 1
    const gameSpeed = baseGameSpeed * +!gameData.paused * +isAlive() * timeWarpingSpeed * debugSpeed
    return gameSpeed
}

export function applyMultipliers(value, multipliers) {
    let finalMultiplier = 1
    multipliers.forEach(function(multiplierFunction) {
        const multiplier = multiplierFunction()
        finalMultiplier *= multiplier
    })
    const finalValue = Math.round(value * finalMultiplier)
    return finalValue
}

export function applySpeed(value) {
    const finalValue = value * getGameSpeed() / updateSpeed
    return finalValue
}

export function daysToYears(days) {
    const years = Math.floor(days / 365)
    return years
}
