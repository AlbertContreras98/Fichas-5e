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
/* Armas (reglas de 2024). c: s sencilla / m marcial; r: a distancia; p: propiedades; ms: maestría;
   th: alcance arrojadiza; am: [tipo de munición, alcance]; v: daño versátil */
const MASTERY={
  cleave:['Hendir','Si impactas, puedes hacer otro ataque contra una segunda criatura a 5 pies de la primera y a tu alcance, sin sumar tu modificador al daño. Una vez por turno.'],
  graze:['Rozar','Si fallas, el objetivo recibe igualmente daño igual a tu modificador de característica.'],
  nick:['Mellar','El ataque extra de la propiedad Ligera lo haces como parte de la acción de Atacar, no con la acción adicional. Una vez por turno.'],
  push:['Empujar','Si impactas, puedes empujar al objetivo hasta 10 pies en dirección contraria a ti si es Grande o menor.'],
  sap:['Debilitar','Si impactas, el objetivo tiene desventaja en su siguiente tirada de ataque antes de tu siguiente turno.'],
  slow:['Ralentizar','Si impactas y haces daño, la velocidad del objetivo baja 10 pies hasta el inicio de tu siguiente turno.'],
  topple:['Derribar','Si impactas, el objetivo hace una salvación de CON (CD 8 + tu modificador del ataque + tu competencia) o queda derribado.'],
  vex:['Molestar','Si impactas y haces daño, tienes ventaja en tu siguiente ataque contra esa criatura antes del final de tu siguiente turno.']};
const AMMO={arrow:['Flechas',20],bolt:['Virotes',20],slingbullet:['Balas de honda',20],firebullet:['Balas de arma de fuego',10],needle:['Agujas de cerbatana',50]};
const WEAPONS={
  club:{n:'Garrote',c:'s',d:'1d4',t:'contundente',p:['ligera'],ms:'slow'},
  dagger:{n:'Daga',c:'s',d:'1d4',t:'perforante',p:['sutil','ligera'],th:'20/60',ms:'nick'},
  greatclub:{n:'Gran garrote',c:'s',d:'1d8',t:'contundente',p:['a dos manos'],ms:'push'},
  handaxe:{n:'Hacha de mano',c:'s',d:'1d6',t:'cortante',p:['ligera'],th:'20/60',ms:'vex'},
  javelin:{n:'Jabalina',c:'s',d:'1d6',t:'perforante',p:[],th:'30/120',ms:'slow'},
  lighthammer:{n:'Martillo ligero',c:'s',d:'1d4',t:'contundente',p:['ligera'],th:'20/60',ms:'nick'},
  mace:{n:'Maza',c:'s',d:'1d6',t:'contundente',p:[],ms:'sap'},
  quarterstaff:{n:'Bastón',c:'s',d:'1d6',t:'contundente',p:[],v:'1d8',ms:'topple'},
  sickle:{n:'Hoz',c:'s',d:'1d4',t:'cortante',p:['ligera'],ms:'nick'},
  spear:{n:'Lanza',c:'s',d:'1d6',t:'perforante',p:[],th:'20/60',v:'1d8',ms:'sap'},
  dart:{n:'Dardo',c:'s',r:1,d:'1d4',t:'perforante',p:['sutil'],th:'20/60',ms:'vex'},
  lightcrossbow:{n:'Ballesta ligera',c:'s',r:1,d:'1d8',t:'perforante',p:['recarga','a dos manos'],am:['bolt','80/320'],ms:'slow'},
  shortbow:{n:'Arco corto',c:'s',r:1,d:'1d6',t:'perforante',p:['a dos manos'],am:['arrow','80/320'],ms:'vex'},
  sling:{n:'Honda',c:'s',r:1,d:'1d4',t:'contundente',p:[],am:['slingbullet','30/120'],ms:'slow'},
  battleaxe:{n:'Hacha de batalla',c:'m',d:'1d8',t:'cortante',p:[],v:'1d10',ms:'topple'},
  flail:{n:'Mayal',c:'m',d:'1d8',t:'contundente',p:[],ms:'sap'},
  glaive:{n:'Guja',c:'m',d:'1d10',t:'cortante',p:['pesada','alcance','a dos manos'],ms:'graze'},
  greataxe:{n:'Gran hacha',c:'m',d:'1d12',t:'cortante',p:['pesada','a dos manos'],ms:'cleave'},
  greatsword:{n:'Espadón',c:'m',d:'2d6',t:'cortante',p:['pesada','a dos manos'],ms:'graze'},
  halberd:{n:'Alabarda',c:'m',d:'1d10',t:'cortante',p:['pesada','alcance','a dos manos'],ms:'cleave'},
  lance:{n:'Lanza de caballería',c:'m',d:'1d10',t:'perforante',p:['pesada','alcance','a dos manos (salvo montado)'],ms:'topple'},
  longsword:{n:'Espada larga',c:'m',d:'1d8',t:'cortante',p:[],v:'1d10',ms:'sap'},
  maul:{n:'Mazo',c:'m',d:'2d6',t:'contundente',p:['pesada','a dos manos'],ms:'topple'},
  morningstar:{n:'Lucero del alba',c:'m',d:'1d8',t:'perforante',p:[],ms:'sap'},
  pike:{n:'Pica',c:'m',d:'1d10',t:'perforante',p:['pesada','alcance','a dos manos'],ms:'push'},
  rapier:{n:'Estoque',c:'m',d:'1d8',t:'perforante',p:['sutil'],ms:'vex'},
  scimitar:{n:'Cimitarra',c:'m',d:'1d6',t:'cortante',p:['sutil','ligera'],ms:'nick'},
  shortsword:{n:'Espada corta',c:'m',d:'1d6',t:'perforante',p:['sutil','ligera'],ms:'vex'},
  trident:{n:'Tridente',c:'m',d:'1d8',t:'perforante',p:[],th:'20/60',v:'1d10',ms:'topple'},
  warhammer:{n:'Martillo de guerra',c:'m',d:'1d8',t:'contundente',p:[],v:'1d10',ms:'push'},
  warpick:{n:'Pico de guerra',c:'m',d:'1d8',t:'perforante',p:[],v:'1d10',ms:'sap'},
  whip:{n:'Látigo',c:'m',d:'1d4',t:'cortante',p:['sutil','alcance'],ms:'slow'},
  blowgun:{n:'Cerbatana',c:'m',r:1,d:'1',t:'perforante',p:['recarga'],am:['needle','25/100'],ms:'vex'},
  handcrossbow:{n:'Ballesta de mano',c:'m',r:1,d:'1d6',t:'perforante',p:['ligera','recarga'],am:['bolt','30/120'],ms:'vex'},
  heavycrossbow:{n:'Ballesta pesada',c:'m',r:1,d:'1d10',t:'perforante',p:['pesada','recarga','a dos manos'],am:['bolt','100/400'],ms:'push'},
  longbow:{n:'Arco largo',c:'m',r:1,d:'1d8',t:'perforante',p:['pesada','a dos manos'],am:['arrow','150/600'],ms:'slow'},
  musket:{n:'Mosquete',c:'m',r:1,d:'1d12',t:'perforante',p:['recarga','a dos manos'],am:['firebullet','40/120'],ms:'slow'},
  pistol:{n:'Pistola',c:'m',r:1,d:'1d10',t:'perforante',p:['recarga'],am:['firebullet','30/90'],ms:'vex'}};
/* Pergaminos de conjuro: CD de salvación y bonificador de ataque según el nivel del conjuro */
const SCROLL_STATS=[[13,5],[13,5],[13,5],[15,7],[15,7],[17,9],[17,9],[18,10],[18,10],[19,11]];
