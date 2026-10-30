/* Catálogo de pociones y armaduras (reglas de 2024 / SRD 5.2).
   Beber o dar una poción es una acción adicional. */
const POTIONS={
  healing:{n:'Poción de curación',heal:'2d4 + 2',d:'Recuperas 2d4 + 2 PG.'},
  healing2:{n:'Poción de curación mayor',heal:'4d4 + 4',d:'Recuperas 4d4 + 4 PG.'},
  healing3:{n:'Poción de curación superior',heal:'8d4 + 8',d:'Recuperas 8d4 + 8 PG.'},
  healing4:{n:'Poción de curación suprema',heal:'10d4 + 20',d:'Recuperas 10d4 + 20 PG.'},
  heroism:{n:'Poción de heroísmo',temp:10,eff:['Heroísmo',{m:60}],d:'Ganas 10 PG temporales y, durante 1 hora, el efecto de Bendecir: sumas 1d4 a tus tiradas de ataque y de salvación.'},
  invisibility:{n:'Poción de invisibilidad',eff:['Invisible',{m:60}],d:'Eres invisible durante 1 hora. Termina antes si atacas, haces daño o lanzas un conjuro.'},
  speed:{n:'Poción de velocidad',eff:['Acelerado',{r:10}],d:'Durante 1 minuto tienes el efecto de Acelerar: +2 a la CA, velocidad doble, ventaja en salvaciones de DES y una acción extra limitada por turno.'},
  flying:{n:'Poción de vuelo',eff:['Vuelo',{m:60}],d:'Durante 1 hora tienes velocidad de vuelo igual a tu velocidad y puedes flotar.'},
  climbing:{n:'Poción de trepar',eff:['Trepar',{m:60}],d:'Durante 1 hora tienes velocidad de trepar igual a tu velocidad y ventaja en las pruebas de FUE (Atletismo) para trepar.'},
  waterbreathing:{n:'Poción de respirar bajo el agua',eff:['Respirar bajo el agua',{m:60}],d:'Puedes respirar bajo el agua durante 1 hora.'},
  resistance:{n:'Poción de resistencia',eff:['Resistencia',{m:60}],d:'Durante 1 hora tienes resistencia al tipo de daño de la poción (ácido, frío, fuego, fuerza, necrótico, psíquico, radiante, relámpago, trueno o veneno).',ask:'Tipo de daño'},
  giantstr:{n:'Poción de fuerza de gigante',eff:['Fuerza de gigante',{m:60}],d:'Durante 1 hora tu FUE pasa a ser la del gigante: colinas 21, escarcha o piedra 23, fuego 25, nubes 27, tormenta 29.',ask:'Tipo de gigante'},
  gaseous:{n:'Poción de forma gaseosa',eff:['Forma gaseosa',{m:60}],d:'Durante 1 hora tienes el efecto de Forma gaseosa. Puedes terminarlo antes con una acción adicional.'},
  firebreath:{n:'Poción de aliento de fuego',eff:['Aliento de fuego',{m:60}],d:'Durante 1 hora, con una acción adicional exhalas fuego sobre un objetivo a 30 pies: salvación de DES CD 13 o 4d6 de fuego (la mitad si la supera). Hasta 3 veces.'},
  other:{n:'Otra poción',d:''}};
/* t: l ligera, m media, h pesada, s escudo; ac base; str: fuerza mínima; st: desventaja en Sigilo */
const ARMORS={
  padded:{n:'Armadura acolchada',t:'l',ac:11,st:1},
  leather:{n:'Armadura de cuero',t:'l',ac:11},
  studded:{n:'Armadura de cuero tachonado',t:'l',ac:12},
  hide:{n:'Armadura de pieles',t:'m',ac:12},
  chainshirt:{n:'Camisote de mallas',t:'m',ac:13},
  scale:{n:'Cota de escamas',t:'m',ac:14,st:1},
  breastplate:{n:'Coraza',t:'m',ac:14},
  halfplate:{n:'Semiplacas',t:'m',ac:15,st:1},
  ring:{n:'Cota de anillas',t:'h',ac:14,st:1},
  chainmail:{n:'Cota de mallas',t:'h',ac:16,str:13,st:1},
  splint:{n:'Armadura de bandas',t:'h',ac:17,str:15,st:1},
  plate:{n:'Armadura de placas',t:'h',ac:18,str:15,st:1},
  shield:{n:'Escudo',t:'s',ac:2}};
const ARMOR_T={l:'Ligera',m:'Intermedia',h:'Pesada',s:'Escudo'};
