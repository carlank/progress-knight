import jobBaseData from './data/jobs.js'
import skillBaseData from './data/skills.js'
import itemBaseData from './data/items.js'
import tooltips from './data/tooltips.js'

import {
  jobCategories,
  skillCategories,
  itemCategories,
  headerRowColors,
  updateSpeed,
  baseGameSpeed,
  debugSpeed,
  baseLifespan,
  units
} from './config.js'

import {
  applyMultipliers,
  applySpeed,
  daysToYears,
  getGameSpeed,
  getLifespan,
  isAlive,
  yearsToDays,
  getDay,
  getIncome,
  getExpense,
  getNet,
  getHappiness,
  getBindedItemEffect,
  getBindedTaskEffect,
  getEvilGain,
  setTask,
  setProperty,
  setMisc
} from './utils.js'

import Task from './classes/Task.js'
import Item from './classes/Item.js'
import Job from './classes/tasks/Job.js'
import Skill from './classes/tasks/Skill.js'
import Requirement from './classes/Requirement.js'
import TaskRequirement from './classes/requirements/Task.js'
import CoinRequirement from './classes/requirements/Coin.js'
import AgeRequirement from './classes/requirements/Age.js'
import EvilRequirement from './classes/requirements/Evil.js'

import {
  updateTaskRows,
  updateItemRows,
  updateHeaderRows,
  updateText,
  setSignDisplay,
  format,
  formatCoins,
  getTaskElement,
  getItemElement,
  getElementsByClass,
  createRequiredRow,
  createHeaderRow,
  createRow,
  createAllRows,
  updateRequiredRows,
  updateUI
} from './ui.js'

let gameData = {
  taskData: {},
  itemData: {},

  coins: 0,
  days: 365 * 14,
  evil: 0,
  paused: false,
  timeWarpingEnabled: true,

  rebirthOneCount: 0,
  rebirthTwoCount: 0,

  currentJob: null,
  currentSkill: null,
  currentProperty: null,
  currentMisc: null
}

const tempData = {}

let skillWithLowestMaxXp = null

const autoPromoteElement = document.getElementById('autoPromote')
const autoLearnElement = document.getElementById('autoLearn')

const permanentUnlocks = ['Scheduling', 'Shop', 'Automation']

const jobTabButton = document.getElementById('jobTabButton')

function getBaseLog (x, y) {
  return Math.log(y) / Math.log(x)
}

function addMultipliers () {
  for (const taskName in gameData.taskData) {
    const task = gameData.taskData[taskName]

    task.xpMultipliers = []
    if (task instanceof Job) task.incomeMultipliers = []

    task.xpMultipliers.push(task.getMaxLevelMultiplier.bind(task))
    task.xpMultipliers.push(getHappiness)
    task.xpMultipliers.push(getBindedTaskEffect('Dark influence'))
    task.xpMultipliers.push(getBindedTaskEffect('Demon training'))

    if (task instanceof Job) {
      task.incomeMultipliers.push(task.getLevelMultiplier.bind(task))
      task.xpMultipliers.push(getBindedTaskEffect('Productivity'))
      task.xpMultipliers.push(getBindedItemEffect('Personal squire'))
    } else if (task instanceof Skill) {
      task.xpMultipliers.push(getBindedTaskEffect('Concentration'))
      task.xpMultipliers.push(getBindedItemEffect('Book'))
      task.xpMultipliers.push(getBindedItemEffect('Study desk'))
      task.xpMultipliers.push(getBindedItemEffect('Library'))
    }

    if (jobCategories.Military.includes(task.name)) {
      task.incomeMultipliers.push(getBindedTaskEffect('Strength'))
      task.xpMultipliers.push(getBindedTaskEffect('Battle tactics'))
      task.xpMultipliers.push(getBindedItemEffect('Steel longsword'))
    } else if (task.name == 'Strength') {
      task.xpMultipliers.push(getBindedTaskEffect('Muscle memory'))
      task.xpMultipliers.push(getBindedItemEffect('Dumbbells'))
    } else if (skillCategories.Magic.includes(task.name)) {
      task.xpMultipliers.push(getBindedItemEffect('Sapphire charm'))
    } else if (jobCategories['The Arcane Association'].includes(task.name)) {
      task.xpMultipliers.push(getBindedTaskEffect('Mana control'))
    } else if (skillCategories['Dark magic'].includes(task.name)) {
      task.xpMultipliers.push(getEvil)
    }
  }

  for (const itemName in gameData.itemData) {
    const item = gameData.itemData[itemName]
    item.expenseMultipliers = []
    item.expenseMultipliers.push(getBindedTaskEffect('Bargaining'))
  }
}

function setCustomEffects () {
  const bargaining = gameData.taskData.Bargaining
  bargaining.getEffect = function () {
    let multiplier = 1 - getBaseLog(7, bargaining.level + 1) / 10
    if (multiplier < 0.1) {
      multiplier = 0.1
    }
    return multiplier
  }

  const immortality = gameData.taskData.Immortality
  immortality.getEffect = function () {
    const multiplier = 1 + getBaseLog(33, immortality.level + 1)
    return multiplier
  }
}

function getEvil () {
  return gameData.evil
}

function applyExpenses () {
  const coins = applySpeed(getExpense())
  gameData.coins -= coins
  if (gameData.coins < 0) {
    goBankrupt()
  }
}

function goBankrupt () {
  gameData.coins = 0
  gameData.currentProperty = gameData.itemData.Homeless
  gameData.currentMisc = []
}

function setTab (element, selectedTab) {
  const tabs = Array.prototype.slice.call(document.getElementsByClassName('tab'))
  tabs.forEach(function (tab) {
    tab.style.display = 'none'
  })
  document.getElementById(selectedTab).style.display = 'block'

  const tabButtons = document.getElementsByClassName('tabButton')
  for (const tabButton of tabButtons) {
    tabButton.classList.remove('w3-blue-gray')
  }
  element.classList.add('w3-blue-gray')
}

function setPause () {
  gameData.paused = !gameData.paused
}

function setTimeWarping () {
  gameData.timeWarpingEnabled = !gameData.timeWarpingEnabled
}

function createData (data, baseData) {
  for (const key in baseData) {
    const entity = baseData[key]
    createEntity(data, entity)
  }
}

function createEntity (data, entity) {
  if ('income' in entity) {
    data[entity.name] = new Job(entity)
  } else if ('maxXp' in entity) {
    data[entity.name] = new Skill(entity)
  } else {
    data[entity.name] = new Item(entity)
  }
  data[entity.name].id = 'row ' + entity.name
}

function createItemData (baseData) {
  for (const item of baseData) {
    gameData.itemData[item.name] = 'happiness' in item ? new Property(task) : new Misc(task)
    gameData.itemData[item.name].id = 'item ' + item.name
  }
}

function doCurrentTask (task) {
  task.increaseXp()
  if (task instanceof Job) {
    increaseCoins()
  }
}

function increaseCoins () {
  const coins = applySpeed(getIncome())
  gameData.coins += coins
}

function getCategoryFromEntityName (categoryType, entityName) {
  for (const categoryName in categoryType) {
    const category = categoryType[categoryName]
    if (category.includes(entityName)) {
      return category
    }
  }
}

function getNextEntity (data, categoryType, entityName) {
  const category = getCategoryFromEntityName(categoryType, entityName)
  const nextIndex = category.indexOf(entityName) + 1
  if (nextIndex > category.length - 1) return null
  const nextEntityName = category[nextIndex]
  const nextEntity = data[nextEntityName]
  return nextEntity
}

function autoPromote () {
  if (!autoPromoteElement.checked) return
  const nextEntity = getNextEntity(gameData.taskData, jobCategories, gameData.currentJob.name)
  if (nextEntity == null) return
  const requirement = gameData.requirements[nextEntity.name]
  if (requirement.isCompleted()) gameData.currentJob = nextEntity
}

function setSkillWithLowestMaxXp () {
  const xpDict = {}

  for (const skillName in gameData.taskData) {
    const skill = gameData.taskData[skillName]
    const requirement = gameData.requirements[skillName]
    if (skill instanceof Skill && requirement.isCompleted()) {
      xpDict[skill.name] = skill.level // skill.getMaxXp() / skill.getXpGain()
    }
  }

  const skillName = getKeyOfLowestValueFromDict(xpDict)
  skillWithLowestMaxXp = gameData.taskData[skillName]
}

function getKeyOfLowestValueFromDict (dict) {
  const values = []
  for (const key in dict) {
    const value = dict[key]
    values.push(value)
  }

  values.sort(function (a, b) { return a - b })

  for (const key in dict) {
    const value = dict[key]
    if (value == values[0]) {
      return key
    }
  }
}

function autoLearn () {
  if (!autoLearnElement.checked || !skillWithLowestMaxXp) return
  gameData.currentSkill = skillWithLowestMaxXp
}

function increaseDays () {
  const increase = applySpeed(1)
  gameData.days += increase
}

function rebirthOne () {
  gameData.rebirthOneCount += 1

  rebirthReset()
}

function rebirthTwo () {
  gameData.rebirthTwoCount += 1
  gameData.evil += getEvilGain()

  rebirthReset()

  for (const taskName in gameData.taskData) {
    const task = gameData.taskData[taskName]
    task.maxLevel = 0
  }
}

function rebirthReset () {
  setTab(jobTabButton, 'jobs')

  gameData.coins = 0
  gameData.days = 365 * 14
  gameData.currentJob = gameData.taskData.Beggar
  gameData.currentSkill = gameData.taskData.Concentration
  gameData.currentProperty = gameData.itemData.Homeless
  gameData.currentMisc = []

  for (const taskName in gameData.taskData) {
    const task = gameData.taskData[taskName]
    if (task.level > task.maxLevel) task.maxLevel = task.level
    task.level = 0
    task.xp = 0
  }

  for (const key in gameData.requirements) {
    const requirement = gameData.requirements[key]
    if (requirement.completed && permanentUnlocks.includes(key)) continue
    requirement.completed = false
  }
}

function assignMethods () {
  for (const key in gameData.taskData) {
    let task = gameData.taskData[key]
    if (task.baseData.income) {
      task.baseData = jobBaseData[task.name]
      task = Object.assign(new Job(jobBaseData[task.name]), task)
    } else {
      task.baseData = skillBaseData[task.name]
      task = Object.assign(new Skill(skillBaseData[task.name]), task)
    }
    gameData.taskData[key] = task
  }

  for (const key in gameData.itemData) {
    let item = gameData.itemData[key]
    item.baseData = itemBaseData[item.name]
    item = Object.assign(new Item(itemBaseData[item.name]), item)
    gameData.itemData[key] = item
  }

  for (const key in gameData.requirements) {
    let requirement = gameData.requirements[key]
    if (requirement.type == 'task') {
      requirement = Object.assign(new TaskRequirement(requirement.elements, requirement.requirements), requirement)
    } else if (requirement.type == 'coins') {
      requirement = Object.assign(new CoinRequirement(requirement.elements, requirement.requirements), requirement)
    } else if (requirement.type == 'age') {
      requirement = Object.assign(new AgeRequirement(requirement.elements, requirement.requirements), requirement)
    } else if (requirement.type == 'evil') {
      requirement = Object.assign(new EvilRequirement(requirement.elements, requirement.requirements), requirement)
    }

    const tempRequirement = tempData.requirements[key]
    requirement.elements = tempRequirement.elements
    requirement.requirements = tempRequirement.requirements
    gameData.requirements[key] = requirement
  }

  gameData.currentJob = gameData.taskData[gameData.currentJob.name]
  gameData.currentSkill = gameData.taskData[gameData.currentSkill.name]
  gameData.currentProperty = gameData.itemData[gameData.currentProperty.name]
  const newArray = []
  for (const misc of gameData.currentMisc) {
    newArray.push(gameData.itemData[misc.name])
  }
  gameData.currentMisc = newArray
}

function replaceSaveDict (dict, saveDict) {
  for (const key in dict) {
    if (!(key in saveDict)) {
      saveDict[key] = dict[key]
    }
  }

  for (const key in saveDict) {
    if (!(key in dict)) {
      delete saveDict[key]
    }
  }
}

function saveGameData () {
  localStorage.setItem('gameDataSave', JSON.stringify(gameData))
}

function loadGameData () {
  const gameDataSave = JSON.parse(localStorage.getItem('gameDataSave'))

  if (gameDataSave !== null) {
    replaceSaveDict(gameData, gameDataSave)
    replaceSaveDict(gameData.requirements, gameDataSave.requirements)
    replaceSaveDict(gameData.taskData, gameDataSave.taskData)
    replaceSaveDict(gameData.itemData, gameDataSave.itemData)

    gameData = gameDataSave
  }

  assignMethods()
}

function update () {
  increaseDays()
  autoPromote()
  autoLearn()
  doCurrentTask(gameData.currentJob)
  doCurrentTask(gameData.currentSkill)
  applyExpenses()
  updateUI()
}

function resetGameData () {
  localStorage.clear()
  location.reload()
}

function importGameData () {
  const importExportBox = document.getElementById('importExportBox')
  const data = JSON.parse(window.atob(importExportBox.value))
  gameData = data
  saveGameData()
  location.reload()
}

function exportGameData () {
  const importExportBox = document.getElementById('importExportBox')
  importExportBox.value = window.btoa(JSON.stringify(gameData))
}

// Init

createAllRows(jobCategories, 'jobTable')
createAllRows(skillCategories, 'skillTable')
createAllRows(itemCategories, 'itemTable')

createData(gameData.taskData, jobBaseData)
createData(gameData.taskData, skillBaseData)
createData(gameData.itemData, itemBaseData)

gameData.currentJob = gameData.taskData.Beggar
gameData.currentSkill = gameData.taskData.Concentration
gameData.currentProperty = gameData.itemData.Homeless
gameData.currentMisc = []

gameData.requirements = {
  // Other
  'The Arcane Association': new TaskRequirement(getElementsByClass('The Arcane Association'), [{ task: 'Concentration', requirement: 200 }, { task: 'Meditation', requirement: 200 }]),
  'Dark magic': new EvilRequirement(getElementsByClass('Dark magic'), [{ requirement: 1 }]),
  Shop: new CoinRequirement([document.getElementById('shopTabButton')], [{ requirement: gameData.itemData.Tent.getExpense() * 50 }]),
  'Rebirth tab': new AgeRequirement([document.getElementById('rebirthTabButton')], [{ requirement: 25 }]),
  'Rebirth note 1': new AgeRequirement([document.getElementById('rebirthNote1')], [{ requirement: 45 }]),
  'Rebirth note 2': new AgeRequirement([document.getElementById('rebirthNote2')], [{ requirement: 65 }]),
  'Rebirth note 3': new AgeRequirement([document.getElementById('rebirthNote3')], [{ requirement: 200 }]),
  'Evil info': new EvilRequirement([document.getElementById('evilInfo')], [{ requirement: 1 }]),
  'Time warping info': new EvilRequirement([document.getElementById('timeWarping')], [{ requirement: 1000 }]),
  Automation: new AgeRequirement([document.getElementById('automation')], [{ requirement: 20 }]),

  // Common work
  Beggar: new TaskRequirement([getTaskElement('Beggar')], []),
  Farmer: new TaskRequirement([getTaskElement('Farmer')], [{ task: 'Beggar', requirement: 10 }]),
  Fisherman: new TaskRequirement([getTaskElement('Fisherman')], [{ task: 'Farmer', requirement: 10 }]),
  Miner: new TaskRequirement([getTaskElement('Miner')], [{ task: 'Strength', requirement: 10 }, { task: 'Fisherman', requirement: 10 }]),
  Blacksmith: new TaskRequirement([getTaskElement('Blacksmith')], [{ task: 'Strength', requirement: 30 }, { task: 'Miner', requirement: 10 }]),
  Merchant: new TaskRequirement([getTaskElement('Merchant')], [{ task: 'Bargaining', requirement: 50 }, { task: 'Blacksmith', requirement: 10 }]),

  // Military
  Squire: new TaskRequirement([getTaskElement('Squire')], [{ task: 'Strength', requirement: 5 }]),
  Footman: new TaskRequirement([getTaskElement('Footman')], [{ task: 'Strength', requirement: 20 }, { task: 'Squire', requirement: 10 }]),
  'Veteran footman': new TaskRequirement([getTaskElement('Veteran footman')], [{ task: 'Battle tactics', requirement: 40 }, { task: 'Footman', requirement: 10 }]),
  Knight: new TaskRequirement([getTaskElement('Knight')], [{ task: 'Strength', requirement: 100 }, { task: 'Veteran footman', requirement: 10 }]),
  'Veteran knight': new TaskRequirement([getTaskElement('Veteran knight')], [{ task: 'Battle tactics', requirement: 150 }, { task: 'Knight', requirement: 10 }]),
  'Elite knight': new TaskRequirement([getTaskElement('Elite knight')], [{ task: 'Strength', requirement: 300 }, { task: 'Veteran knight', requirement: 10 }]),
  'Holy knight': new TaskRequirement([getTaskElement('Holy knight')], [{ task: 'Mana control', requirement: 500 }, { task: 'Elite knight', requirement: 10 }]),
  'Legendary knight': new TaskRequirement([getTaskElement('Legendary knight')], [{ task: 'Mana control', requirement: 1000 }, { task: 'Battle tactics', requirement: 1000 }, { task: 'Holy knight', requirement: 10 }]),

  // The Arcane Association
  Student: new TaskRequirement([getTaskElement('Student')], [{ task: 'Concentration', requirement: 200 }, { task: 'Meditation', requirement: 200 }]),
  'Apprentice mage': new TaskRequirement([getTaskElement('Apprentice mage')], [{ task: 'Mana control', requirement: 400 }, { task: 'Student', requirement: 10 }]),
  Mage: new TaskRequirement([getTaskElement('Mage')], [{ task: 'Mana control', requirement: 700 }, { task: 'Apprentice mage', requirement: 10 }]),
  Wizard: new TaskRequirement([getTaskElement('Wizard')], [{ task: 'Mana control', requirement: 1000 }, { task: 'Mage', requirement: 10 }]),
  'Master wizard': new TaskRequirement([getTaskElement('Master wizard')], [{ task: 'Mana control', requirement: 1500 }, { task: 'Wizard', requirement: 10 }]),
  Chairman: new TaskRequirement([getTaskElement('Chairman')], [{ task: 'Mana control', requirement: 2000 }, { task: 'Master wizard', requirement: 10 }]),

  // Fundamentals
  Concentration: new TaskRequirement([getTaskElement('Concentration')], []),
  Productivity: new TaskRequirement([getTaskElement('Productivity')], [{ task: 'Concentration', requirement: 5 }]),
  Bargaining: new TaskRequirement([getTaskElement('Bargaining')], [{ task: 'Concentration', requirement: 20 }]),
  Meditation: new TaskRequirement([getTaskElement('Meditation')], [{ task: 'Concentration', requirement: 30 }, { task: 'Productivity', requirement: 20 }]),

  // Combat
  Strength: new TaskRequirement([getTaskElement('Strength')], []),
  'Battle tactics': new TaskRequirement([getTaskElement('Battle tactics')], [{ task: 'Concentration', requirement: 20 }]),
  'Muscle memory': new TaskRequirement([getTaskElement('Muscle memory')], [{ task: 'Concentration', requirement: 30 }, { task: 'Strength', requirement: 30 }]),

  // Magic
  'Mana control': new TaskRequirement([getTaskElement('Mana control')], [{ task: 'Concentration', requirement: 200 }, { task: 'Meditation', requirement: 200 }]),
  Immortality: new TaskRequirement([getTaskElement('Immortality')], [{ task: 'Apprentice mage', requirement: 10 }]),
  'Super immortality': new TaskRequirement([getTaskElement('Super immortality')], [{ task: 'Chairman', requirement: 1000 }]),

  // Dark magic
  'Dark influence': new EvilRequirement([getTaskElement('Dark influence')], [{ requirement: 1 }]),
  'Evil control': new EvilRequirement([getTaskElement('Evil control')], [{ requirement: 2 }]),
  'Demon training': new EvilRequirement([getTaskElement('Demon training')], [{ requirement: 25 }]),
  'Blood meditation': new EvilRequirement([getTaskElement('Blood meditation')], [{ requirement: 75 }]),
  'Time warping': new EvilRequirement([getTaskElement('Time warping')], [{ requirement: 1000 }]),

  // Properties
  Homeless: new CoinRequirement([getItemElement('Homeless')], [{ requirement: 0 }]),
  Tent: new CoinRequirement([getItemElement('Tent')], [{ requirement: 0 }]),
  'Wooden hut': new CoinRequirement([getItemElement('Wooden hut')], [{ requirement: gameData.itemData['Wooden hut'].getExpense() * 100 }]),
  Cottage: new CoinRequirement([getItemElement('Cottage')], [{ requirement: gameData.itemData.Cottage.getExpense() * 100 }]),
  House: new CoinRequirement([getItemElement('House')], [{ requirement: gameData.itemData.House.getExpense() * 100 }]),
  'Large house': new CoinRequirement([getItemElement('Large house')], [{ requirement: gameData.itemData['Large house'].getExpense() * 100 }]),
  'Small palace': new CoinRequirement([getItemElement('Small palace')], [{ requirement: gameData.itemData['Small palace'].getExpense() * 100 }]),
  'Grand palace': new CoinRequirement([getItemElement('Grand palace')], [{ requirement: gameData.itemData['Grand palace'].getExpense() * 100 }]),

  // Misc
  Book: new CoinRequirement([getItemElement('Book')], [{ requirement: 0 }]),
  Dumbbells: new CoinRequirement([getItemElement('Dumbbells')], [{ requirement: gameData.itemData.Dumbbells.getExpense() * 100 }]),
  'Personal squire': new CoinRequirement([getItemElement('Personal squire')], [{ requirement: gameData.itemData['Personal squire'].getExpense() * 100 }]),
  'Steel longsword': new CoinRequirement([getItemElement('Steel longsword')], [{ requirement: gameData.itemData['Steel longsword'].getExpense() * 100 }]),
  Butler: new CoinRequirement([getItemElement('Butler')], [{ requirement: gameData.itemData.Butler.getExpense() * 100 }]),
  'Sapphire charm': new CoinRequirement([getItemElement('Sapphire charm')], [{ requirement: gameData.itemData['Sapphire charm'].getExpense() * 100 }]),
  'Study desk': new CoinRequirement([getItemElement('Study desk')], [{ requirement: gameData.itemData['Study desk'].getExpense() * 100 }]),
  Library: new CoinRequirement([getItemElement('Library')], [{ requirement: gameData.itemData.Library.getExpense() * 100 }])
}

tempData.requirements = {}
for (const key in gameData.requirements) {
  const requirement = gameData.requirements[key]
  tempData.requirements[key] = requirement
}

loadGameData()

setCustomEffects()
addMultipliers()

setTab(jobTabButton, 'jobs')

update()
setInterval(update, 1000 / updateSpeed)
setInterval(saveGameData, 3000)
setInterval(setSkillWithLowestMaxXp, 1000)

document.getElementById('debugSlider').oninput = function () {
  debugSpeed = Math.pow(2, this.value / 12)
  document.getElementById('debugSpeedDisplay').textContent = debugSpeed.toFixed(1)
}

document.getElementById('debug').style.display = 'none'

/* Setup event handlers */

for (const tabButton of document.getElementsByClassName('tabButton')) {
  tabButton.addEventListener('click', () => setTab(tabButton, tabButton.getAttribute('tab-id')))
}

document.getElementById('pauseButton').addEventListener('click', setPause)
document.getElementById('eyeButton').addEventListener('click', rebirthOne)
document.getElementById('evilButton').addEventListener('click', rebirthTwo)
document.getElementById('timeWarpingButton').addEventListener('click', setTimeWarping)
document.getElementById('importButton').addEventListener('click', importGameData)
document.getElementById('exportButton').addEventListener('click', exportGameData)
document.getElementById('resetButton').addEventListener('click', resetGameData)

export { gameData }
