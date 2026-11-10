/* Constantes de reglas: características, habilidades, estados, monedas, categorías de objetos y accesos a los datos. */
'use strict';

const KEY = 'fichas-dnd-2024-v1';
const ABIL = [
  ['str', 'FUE', 'Fuerza'],
  ['dex', 'DES', 'Destreza'],
  ['con', 'CON', 'Constitución'],
  ['int', 'INT', 'Inteligencia'],
  ['wis', 'SAB', 'Sabiduría'],
  ['cha', 'CAR', 'Carisma'],
];
const AB = Object.fromEntries(ABIL.map(a => [a[0], a]));
const SKILLS = [
  ['acrobatics', 'Acrobacias', 'dex'],
  ['animal', 'Trato con animales', 'wis'],
  ['arcana', 'Conocimiento arcano', 'int'],
  ['athletics', 'Atletismo', 'str'],
  ['deception', 'Engaño', 'cha'],
  ['history', 'Historia', 'int'],
  ['insight', 'Perspicacia', 'wis'],
  ['intimidation', 'Intimidación', 'cha'],
  ['investigation', 'Investigación', 'int'],
  ['medicine', 'Medicina', 'wis'],
  ['nature', 'Naturaleza', 'int'],
  ['perception', 'Percepción', 'wis'],
  ['performance', 'Interpretación', 'cha'],
  ['persuasion', 'Persuasión', 'cha'],
  ['religion', 'Religión', 'int'],
  ['sleight', 'Juego de manos', 'dex'],
  ['stealth', 'Sigilo', 'dex'],
  ['survival', 'Supervivencia', 'wis'],
];
const SK = Object.fromEntries(SKILLS.map(s => [s[0], s]));
const CONDS = [
  ['Agarrado', 'Velocidad 0. Desventaja al atacar a cualquiera que no sea quien te agarra.'],
  ['Apresado', 'Velocidad 0. Desventaja en ataques y salvaciones de DES; te atacan con ventaja.'],
  [
    'Asustado',
    'Desventaja en pruebas y ataques mientras veas la fuente del miedo; no puedes acercarte a ella.',
  ],
  ['Aturdido', 'Incapacitado. Fallas salvaciones de FUE y DES; te atacan con ventaja.'],
  ['Cegado', 'Fallas pruebas que requieran vista. Tus ataques con desventaja; te atacan con ventaja.'],
  [
    'Derribado',
    'Solo puedes arrastrarte (cada pie cuesta 1 más) o levantarte (gasta la mitad de tu velocidad). Desventaja al atacar. Los ataques contra ti tienen ventaja si quien ataca está a 5 pies o menos, y desventaja si está más lejos.',
  ],
  ['Ensordecido', 'No oyes y fallas pruebas que requieran oído.'],
  ['Envenenado', 'Desventaja en tiradas de ataque y pruebas de característica.'],
  ['Hechizado', 'No puedes atacar a quien te hechizó y tiene ventaja en interacciones sociales contigo.'],
  [
    'Incapacitado',
    'Sin acciones, acciones adicionales ni reacciones. No puedes hablar. Pierdes la concentración. Tiras la iniciativa con desventaja.',
  ],
  [
    'Inconsciente',
    'Incapacitado y derribado; sueltas lo que llevas y no te enteras de nada. Velocidad 0. Fallas salvaciones de FUE y DES. Te atacan con ventaja y los golpes desde 5 pies son críticos.',
  ],
  [
    'Invisible',
    'Ventaja en la iniciativa. Tus ataques tienen ventaja y los ataques contra ti, desventaja (salvo que quien ataca pueda verte de algún modo).',
  ],
  [
    'Paralizado',
    'Incapacitado. Velocidad 0. Fallas salvaciones de FUE y DES. Te atacan con ventaja y los golpes desde 5 pies son críticos.',
  ],
  [
    'Petrificado',
    'Convertido en piedra (pesas 10 veces más): incapacitado y velocidad 0. Fallas salvaciones de FUE y DES y te atacan con ventaja. Resistencia a todo el daño y no te pueden envenenar.',
  ],
];
const TIME = { A: 'Acción', AA: 'Acción adicional', BA: 'Acción adicional', R: 'Reacción' };
const FULL = [
  [2],
  [3],
  [4, 2],
  [4, 3],
  [4, 3, 2],
  [4, 3, 3],
  [4, 3, 3, 1],
  [4, 3, 3, 2],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 2, 1, 1],
];
const CATS = [
  ['arma', 'Armas'],
  ['armadura', 'Armaduras y escudos'],
  ['municion', 'Munición'],
  ['pocion', 'Pociones'],
  ['pergamino', 'Pergaminos de conjuro'],
  ['comida', 'Comida y bebida'],
  ['consumible', 'Consumibles'],
  ['herramienta', 'Herramientas'],
  ['mapa', 'Mapas'],
  ['tesoro', 'Tesoros'],
  ['otro', 'Otros'],
];
const CATN = Object.fromEntries(CATS);
const USABLE = new Set(['municion', 'pocion', 'pergamino', 'comida', 'consumible']);
const COINS = [
  ['pp', 'PPt', 1000],
  ['gp', 'PO', 100],
  ['ep', 'PE', 50],
  ['sp', 'PP', 10],
  ['cp', 'PC', 1],
];
const COINV = Object.fromEntries(COINS.map(c => [c[0], c[2]]));
const COINN = Object.fromEntries(COINS.map(c => [c[0], c[1]]));
const REC = {
  corto: 'descanso corto o largo',
  largo: 'descanso largo',
  corto1: '1 en descanso corto, todos en largo',
};
const CL = window.CLASSES,
  SP = window.SPELLS,
  SPBY = Object.fromEntries(SP.map(s => [s.id, s]));
const SPEC = window.SPECIES,
  FEATS = window.FEATS,
  BG = window.BACKGROUNDS;
