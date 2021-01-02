import { gameData } from './main.js'
import tooltips from './data/tooltips.js'
import {
  itemCategories,
  jobCategories,
  skillCategories,
  headerRowColors,
  units
} from './config.js'
import { removeSpaces, daysToYears, getDay, getLifespan, getIncome, getExpense, getNet, getHappiness, getEvilGain, setTask, setProperty, setMisc } from './utils.js'

import Task from './classes/Task.js'
// import Item from './classes/Item.js';
import Job from './classes/tasks/Job.js'
import Skill from './classes/tasks/Skill.js'
import Requirement from './classes/Requirement.js'
import TaskRequirement from './classes/requirements/Task.js'
import CoinRequirement from './classes/requirements/Coin.js'
import AgeRequirement from './classes/requirements/Age.js'
import EvilRequirement from './classes/requirements/Evil.js'

export function createRequiredRow (categoryName) {
  const requiredRow = document.getElementsByClassName('requiredRowTemplate')[0].content.firstElementChild.cloneNode(true)
  requiredRow.classList.add('requiredRow')
  requiredRow.classList.add(removeSpaces(categoryName))
  requiredRow.id = categoryName
  return requiredRow
}

export function createHeaderRow (templates, categoryType, categoryName) {
  const headerRow = templates.headerRow.content.firstElementChild.cloneNode(true)
  headerRow.getElementsByClassName('category')[0].textContent = categoryName
  if (categoryType != itemCategories) {
    headerRow.getElementsByClassName('valueType')[0].textContent = categoryType == jobCategories ? 'Income/day' : 'Effect'
  }

  headerRow.style.backgroundColor = headerRowColors[categoryName]
  headerRow.style.color = '#ffffff'
  headerRow.classList.add(removeSpaces(categoryName))
  headerRow.classList.add('headerRow')

  return headerRow
}

export function createRow (templates, name, categoryName, categoryType) {
  const row = templates.row.content.firstElementChild.cloneNode(true)
  row.getElementsByClassName('name')[0].textContent = name
  row.getElementsByClassName('tooltipText')[0].textContent = tooltips[name]
  row.id = 'row ' + name
  if (categoryType != itemCategories) {
    row.getElementsByClassName('progressBar')[0].onclick = function () { setTask(name) }
  } else {
    row.getElementsByClassName('button')[0].onclick = categoryName == 'Properties' ? function () { setProperty(name) } : function () { setMisc(name) }
  }

  return row
}

export function createAllRows (categoryType, tableId) {
  const templates = {
    headerRow: document.getElementsByClassName(categoryType == itemCategories ? 'headerRowItemTemplate' : 'headerRowTaskTemplate')[0],
    row: document.getElementsByClassName(categoryType == itemCategories ? 'rowItemTemplate' : 'rowTaskTemplate')[0]
  }

  const table = document.getElementById(tableId)

  for (const categoryName in categoryType) {
    const headerRow = createHeaderRow(templates, categoryType, categoryName)
    table.appendChild(headerRow)

    const category = categoryType[categoryName]
    category.forEach(function (name) {
      const row = createRow(templates, name, categoryName, categoryType)
      table.appendChild(row)
    })

    const requiredRow = createRequiredRow(categoryName)
    table.append(requiredRow)
  }
}

function hideEntities () {
  for (const key in gameData.requirements) {
    const requirement = gameData.requirements[key]
    const completed = requirement.isCompleted()
    for (const element of requirement.elements) {
      if (completed) {
        element.classList.remove('hidden')
      } else {
        element.classList.add('hidden')
      }
    }
  }
}

export function updateRequiredRows (data, categoryType) {
  const requiredRows = document.getElementsByClassName('requiredRow')
  for (const requiredRow of requiredRows) {
    let nextEntity = null
    const category = categoryType[requiredRow.id]
    if (category == null) { continue }
    for (let i = 0; i < category.length; i++) {
      const entityName = category[i]
      if (i >= category.length - 1) break
      const requirements = gameData.requirements[entityName]
      if (requirements && i == 0) {
        if (!requirements.isCompleted()) {
          nextEntity = data[entityName]
          break
        }
      }

      const nextIndex = i + 1
      if (nextIndex >= category.length) { break }
      const nextEntityName = category[nextIndex]
      const nextEntityRequirements = gameData.requirements[nextEntityName]

      if (!nextEntityRequirements.isCompleted()) {
        nextEntity = data[nextEntityName]
        break
      }
    }

    if (nextEntity == null) {
      requiredRow.classList.add('hiddenTask')
    } else {
      requiredRow.classList.remove('hiddenTask')
      const requirementObject = gameData.requirements[nextEntity.name]
      const requirements = requirementObject.requirements

      const coinElement = requiredRow.getElementsByClassName('coins')[0]
      const levelElement = requiredRow.getElementsByClassName('levels')[0]
      const evilElement = requiredRow.getElementsByClassName('evil')[0]

      coinElement.classList.add('hiddenTask')
      levelElement.classList.add('hiddenTask')
      evilElement.classList.add('hiddenTask')

      let finalText = ''
      if (data == gameData.taskData) {
        if (requirementObject instanceof EvilRequirement) {
          evilElement.classList.remove('hiddenTask')
          evilElement.textContent = format(requirements[0].requirement) + ' evil'
        } else {
          levelElement.classList.remove('hiddenTask')
          for (const requirement of requirements) {
            const task = gameData.taskData[requirement.task]
            if (task.level >= requirement.requirement) continue
            const text = ' ' + requirement.task + ' level ' + format(task.level) + '/' + format(requirement.requirement) + ','
            finalText += text
          }
          finalText = finalText.substring(0, finalText.length - 1)
          levelElement.textContent = finalText
        }
      } else if (data == gameData.itemData) {
        coinElement.classList.remove('hiddenTask')
        formatCoins(requirements[0].requirement, coinElement)
      }
    }
  }
}

export function updateTaskRows () {
  for (const key in gameData.taskData) {
    const task = gameData.taskData[key]
    const row = document.getElementById('row ' + task.name)
    row.getElementsByClassName('level')[0].textContent = task.level
    row.getElementsByClassName('xpGain')[0].textContent = format(task.getXpGain())
    row.getElementsByClassName('xpLeft')[0].textContent = format(task.getXpLeft())

    const maxLevel = row.getElementsByClassName('maxLevel')[0]
    maxLevel.textContent = task.maxLevel
    gameData.rebirthOneCount > 0 ? maxLevel.classList.remove('hidden') : maxLevel.classList.add('hidden')

    const progressFill = row.getElementsByClassName('progressFill')[0]
    progressFill.style.width = task.xp / task.getMaxXp() * 100 + '%'
    task == gameData.currentJob || task == gameData.currentSkill ? progressFill.classList.add('current') : progressFill.classList.remove('current')

    const valueElement = row.getElementsByClassName('value')[0]
    valueElement.getElementsByClassName('income')[0].style.display = task instanceof Job
    valueElement.getElementsByClassName('effect')[0].style.display = task instanceof Skill
    if (task instanceof Job) {
      formatCoins(task.getIncome(), valueElement.getElementsByClassName('income')[0])
    } else {
      valueElement.getElementsByClassName('effect')[0].textContent = task.getEffectDescription()
    }
  }
}

export function updateItemRows () {
  for (const key in gameData.itemData) {
    const item = gameData.itemData[key]
    const row = document.getElementById('row ' + item.name)
    const button = row.getElementsByClassName('button')[0]
    button.disabled = gameData.coins < item.getExpense()
    const active = row.getElementsByClassName('active')[0]
    const color = itemCategories.Properties.includes(item.name) ? headerRowColors.Properties : headerRowColors.Misc
    active.style.backgroundColor = gameData.currentMisc.includes(item) || item == gameData.currentProperty ? color : 'white'
    row.getElementsByClassName('effect')[0].textContent = item.getEffectDescription()
    formatCoins(item.getExpense(), row.getElementsByClassName('expense')[0])
  }
}

export function updateHeaderRows (categories) {
  for (const categoryName in categories) {
    const className = removeSpaces(categoryName)
    const headerRow = document.getElementsByClassName(className)[0]
    const maxLevelElement = headerRow.getElementsByClassName('maxLevel')[0]
    gameData.rebirthOneCount > 0 ? maxLevelElement.classList.remove('hidden') : maxLevelElement.classList.add('hidden')
  }
}

export function updateText () {
  // Sidebar
  document.getElementById('ageDisplay')
    .textContent = daysToYears(gameData.days)
  document.getElementById('dayDisplay')
    .textContent = getDay()
  document.getElementById('lifespanDisplay')
    .textContent = daysToYears(getLifespan())
  document.getElementById('pauseButton')
    .textContent = gameData.paused ? 'Play' : 'Pause'

  formatCoins(gameData.coins, document.getElementById('coinDisplay'))
  setSignDisplay()
  formatCoins(getNet(), document.getElementById('netDisplay'))
  formatCoins(getIncome(), document.getElementById('incomeDisplay'))
  formatCoins(getExpense(), document.getElementById('expenseDisplay'))

  document.getElementById('happinessDisplay')
    .textContent = getHappiness()
      .toFixed(1)

  document.getElementById('evilDisplay')
    .textContent = gameData.evil.toFixed(1)
  document.getElementById('evilGainDisplay')
    .textContent = getEvilGain()
      .toFixed(1)

  document.getElementById('timeWarpingDisplay')
    .textContent = 'x' + gameData.taskData['Time warping'].getEffect()
      .toFixed(2)
  document.getElementById('timeWarpingButton')
    .textContent = gameData.timeWarpingEnabled ? 'Disable warp' : 'Enable warp'
}

export function setSignDisplay () {
  const signDisplay = document.getElementById('signDisplay')
  if (getIncome() > getExpense()) {
    signDisplay.textContent = '+'
    signDisplay.style.color = 'green'
  } else if (getExpense() > getIncome()) {
    signDisplay.textContent = '-'
    signDisplay.style.color = 'red'
  } else {
    signDisplay.textContent = ''
    signDisplay.style.color = 'gray'
  }
}

export function format (number) {
  // what tier? (determines SI symbol)
  const tier = Math.log10(number) / 3 | 0

  // if zero, we don't need a suffix
  if (tier == 0) return number

  // get suffix and determine scale
  const suffix = units[tier]
  const scale = Math.pow(10, tier * 3)

  // scale the number
  const scaled = number / scale

  // format number and add suffix
  return scaled.toFixed(1) + suffix
}

export function formatCoins (coins, element) {
  const tiers = ['p', 'g', 's']
  const colors = {
    p: '#79b9c7',
    g: '#E5C100',
    s: '#a8a8a8',
    c: '#a15c2f'
  }
  let leftOver = coins
  let i = 0
  for (const tier of tiers) {
    const x = Math.floor(leftOver / Math.pow(10, (tiers.length - i) * 2))
    leftOver = Math.floor(leftOver - x * Math.pow(10, (tiers.length - i) * 2))
    const text = format(String(x)) + tier + ' '
    element.children[i].textContent = x > 0 ? text : ''
    element.children[i].style.color = colors[tier]
    i += 1
  }
  if (leftOver == 0 && coins > 0) { element.children[3].textContent = ''; return }
  const text = String(Math.floor(leftOver)) + 'c'
  element.children[3].textContent = text
  element.children[3].style.color = colors.c
}

export function getTaskElement (taskName) {
  const task = gameData.taskData[taskName]
  const element = document.getElementById(task.id)
  return element
}

export function getItemElement (itemName) {
  const item = gameData.itemData[itemName]
  const element = document.getElementById(item.id)
  return element
}

export function getElementsByClass (className) {
  const elements = document.getElementsByClassName(removeSpaces(className))
  return elements
}

export function updateUI () {
  updateTaskRows()
  updateItemRows()
  updateRequiredRows(gameData.taskData, jobCategories)
  updateRequiredRows(gameData.taskData, skillCategories)
  updateRequiredRows(gameData.itemData, itemCategories)
  updateHeaderRows(jobCategories)
  updateHeaderRows(skillCategories)
  hideEntities()
  updateText()
}
