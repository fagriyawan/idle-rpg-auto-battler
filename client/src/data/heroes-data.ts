import type { HeroDetail } from '../types/hero-detail';

export const HEROES_DETAIL: HeroDetail[] = [
  {
    id: '1',
    name: 'Elise',
    level: 30,
    stars: 2,
    classType: 'Warrior',
    classIcon: '⚔️',
    spine: {
      jsonUrl: '/assets/heroes/character_spine3875/001/action.json',
      atlasUrl: '/assets/heroes/character_spine3875/001/action.atlas',
    },
    active: true,
    attributes: { attack: 245, armor: 180, hp: 3200 },
    skills: [
      {
        name: 'Slash',
        level: 5,
        icon: '🗡️',
        description: 'A powerful sword slash that deals physical damage to a single enemy.',
      },
      {
        name: 'Shield Bash',
        level: 3,
        icon: '🛡️',
        description: 'Stuns the target for 1 turn and deals moderate damage.',
      },
    ],
    runes: [
      { id: 'r1', name: 'Rune of Strength', icon: '💎', level: 3 },
      { id: 'r2', name: 'Rune of Vitality', icon: '❤️', level: 2 },
      { id: 'r3', name: 'Rune of Iron', icon: '🔷', level: 1 },
      null,
    ],
  },
  {
    id: '2',
    name: 'Ray',
    level: 26,
    stars: 3,
    classType: 'Mage',
    classIcon: '🔮',
    spine: {
      jsonUrl: '/assets/heroes/character_spine3875/002/action.json',
      atlasUrl: '/assets/heroes/character_spine3875/002/action.atlas',
    },
    active: true,
    attributes: { attack: 320, armor: 90, hp: 2100 },
    skills: [
      {
        name: 'Fireball',
        level: 6,
        icon: '🔥',
        description: 'Launches a fireball that deals AoE magic damage to enemies.',
      },
      {
        name: 'Arcane Shield',
        level: 4,
        icon: '✨',
        description: 'Creates a magic barrier that absorbs incoming damage for 2 turns.',
      },
    ],
    runes: [
      { id: 'r4', name: 'Rune of Wisdom', icon: '📘', level: 4 },
      { id: 'r5', name: 'Rune of Focus', icon: '🔮', level: 3 },
      { id: 'r6', name: 'Rune of Mana', icon: '💧', level: 2 },
      { id: 'r7', name: 'Rune of Insight', icon: '👁️', level: 1 },
    ],
  },
  {
    id: '3',
    name: 'Rika',
    level: 25,
    stars: 4,
    classType: 'Archer',
    classIcon: '🏹',
    spine: {
      jsonUrl: '/assets/heroes/character_spine3875/003/H30058.json',
      atlasUrl: '/assets/heroes/character_spine3875/003/H30058.atlas',
    },
    active: true,
    attributes: { attack: 290, armor: 110, hp: 2400 },
    skills: [
      {
        name: 'Piercing Arrow',
        level: 5,
        icon: '🏹',
        description: 'Fires an arrow that pierces through enemies in a line.',
      },
      {
        name: 'Rain of Arrows',
        level: 3,
        icon: '🌧️',
        description: 'Rains arrows on all enemies dealing moderate damage.',
      },
    ],
    runes: [
      { id: 'r8', name: 'Rune of Agility', icon: '💨', level: 3 },
      null,
      { id: 'r9', name: 'Rune of Precision', icon: '🎯', level: 2 },
      { id: 'r10', name: 'Rune of Wind', icon: '🌀', level: 1 },
    ],
  },
  {
    id: '4',
    name: 'Nami',
    level: 25,
    stars: 3,
    classType: 'Healer',
    classIcon: '💚',
    spine: {
      jsonUrl: '/assets/heroes/character_spine3875/004/H30107.json',
      atlasUrl: '/assets/heroes/character_spine3875/004/H30107.atlas',
    },
    active: true,
    attributes: { attack: 150, armor: 130, hp: 2800 },
    skills: [
      {
        name: 'Healing Light',
        level: 7,
        icon: '💚',
        description: 'Restores HP to the ally with the lowest health.',
      },
      {
        name: 'Purify',
        level: 4,
        icon: '🌿',
        description: 'Removes all debuffs from a single ally and heals a small amount.',
      },
    ],
    runes: [
      { id: 'r11', name: 'Rune of Healing', icon: '💖', level: 5 },
      { id: 'r12', name: 'Rune of Serenity', icon: '🕊️', level: 3 },
      { id: 'r13', name: 'Rune of Life', icon: '🌱', level: 2 },
      { id: 'r14', name: 'Rune of Grace', icon: '🌸', level: 1 },
    ],
  },
];
