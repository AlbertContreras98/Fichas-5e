/* Especies, trasfondos y dotes de origen de D&D 5e (reglas de 2024). Resúmenes breves escritos para esta app.
   Especies: size, speed (pies), dv (visión en la oscuridad, pies), traits [nombre, resumen],
   spells {nivel de personaje: [id de conjuro]}, res (recursos con usos: by 'pb' = bonificador de competencia, o número),
   lin (linajes/legados/ascendencias a elegir), extraSkill (habilidades extra a elegir), hpPerLevel (PG extra por nivel). */
(function(){
const DRAGON=[['black','Negro','ácido'],['blue','Azul','relámpago'],['brass','Latón','fuego'],['bronze','Bronce','relámpago'],['copper','Cobre','ácido'],['gold','Oro','fuego'],['green','Verde','veneno'],['red','Rojo','fuego'],['silver','Plata','frío'],['white','Blanco','frío']];
const GIANT=[['cloud','Nube','Salto de las nubes','Acción adicional: te teletransportas hasta 30 pies a un espacio que veas.'],
  ['fire','Fuego','Quemadura de fuego','Al impactar con un ataque, haces 1d10 de daño de fuego extra.'],
  ['frost','Escarcha','Frío de la escarcha','Al impactar con un ataque, haces 1d6 de daño de frío extra y la velocidad del objetivo baja 10 pies.'],
  ['hill','Colina','Caída de la colina','Al impactar a una criatura Grande o menor, puedes derribarla.'],
  ['stone','Piedra','Aguante de piedra','Reacción al recibir daño: tiras 1d12 + CON y reduces el daño en esa cantidad.'],
  ['storm','Tormenta','Trueno de la tormenta','Reacción cuando una criatura a 60 pies te daña: recibe 1d8 de daño de trueno.']];
window.SPECIES={
aasimar:{n:'Aasimar',size:'M o P',speed:30,dv:60,
  traits:[['Resistencia celestial','Resistencia al daño necrótico y radiante.'],['Manos sanadoras','Acción mágica: tocas a una criatura y le curas tantos d4 como tu bonificador de competencia. 1 vez por descanso largo.'],['Portador de luz','Conoces el truco Luz (usa CAR para lanzarlo).']],
  spells:{1:['light']},res:[{n:'Manos sanadoras',by:1,rec:'largo'},{n:'Revelación celestial',by:1,rec:'largo',from:3}],
  lv:{3:[['Revelación celestial','Acción adicional, 1 minuto: eliges Alas celestiales (volar), Resplandor interior (luz y daño radiante a tu alrededor) o Manto necrótico (asustar). Una vez por turno haces daño extra igual a tu bonificador de competencia. 1 vez por descanso largo.']]}},
dragonborn:{n:'Dracónido',size:'M',speed:30,dv:60,linLabel:'Ascendencia dracónica',
  traits:[['Arma de aliento','Al atacar puedes sustituir un ataque por una exhalación en cono de 15 pies o línea de 30 pies: salvación de DES (CD 8 + CON + competencia), 1d10 de daño (2d10 a nivel 5, 3d10 a 11, 4d10 a 17), mitad si la superan. Usos: tu bonificador de competencia por descanso largo.']],
  res:[{n:'Arma de aliento',by:'pb',rec:'largo'},{n:'Vuelo dracónico',by:1,rec:'largo',from:5}],
  lv:{5:[['Vuelo dracónico','Acción adicional: alas espectrales con velocidad de vuelo igual a tu velocidad durante 10 minutos. 1 vez por descanso largo.']]},
  lin:Object.fromEntries(DRAGON.map(([k,n,t])=>[k,{n:`Dragón ${n.toLowerCase()} (${t})`,traits:[['Resistencia al daño',`Resistencia al daño de ${t}. Tu Arma de aliento hace daño de ${t}.`]]}]))},
dwarf:{n:'Enano',size:'M',speed:30,dv:120,hpPerLevel:1,
  traits:[['Resistencia enana','Resistencia al daño de veneno y ventaja en salvaciones para evitar o acabar con el estado envenenado.'],['Dureza enana','Tus PG máximos aumentan en 1 por cada nivel (ya sumado).'],['Afinidad con la piedra','Acción adicional: ganas sentido de la vibración a 60 pies durante 10 minutos si estás sobre piedra. Usos: tu bonificador de competencia por descanso largo.']],
  res:[{n:'Afinidad con la piedra',by:'pb',rec:'largo'}]},
elf:{n:'Elfo',size:'M',speed:30,dv:60,linLabel:'Linaje élfico',extraSkill:{n:1,from:['insight','perception','survival'],label:'Sentidos agudos'},
  traits:[['Ascendencia feérica','Ventaja en salvaciones para evitar o acabar con el estado hechizado.'],['Sentidos agudos','Competencia en Perspicacia, Percepción o Supervivencia.'],['Trance','No necesitas dormir; un descanso largo te lleva 4 horas de trance.']],
  lin:{drow:{n:'Drow',dv:120,traits:[['Magia drow','Visión en la oscuridad de 120 pies. Conoces Luces danzantes; a nivel 3 Fuego feérico y a nivel 5 Oscuridad (1 vez cada uno por descanso largo sin espacio). Aptitud: INT, SAB o CAR.']],spells:{1:['dancing-lights'],3:['faerie-fire'],5:['darkness']},res:[{n:'Fuego feérico (gratis)',by:1,rec:'largo',from:3},{n:'Oscuridad (gratis)',by:1,rec:'largo',from:5}]},
       high:{n:'Alto elfo',traits:[['Magia de alto elfo','Conoces Prestidigitación (puedes cambiarlo por otro truco de mago en un descanso largo); a nivel 3 Detectar magia y a nivel 5 Paso brumoso (1 vez cada uno por descanso largo sin espacio). Aptitud: INT, SAB o CAR.']],spells:{1:['prestidigitation'],3:['detect-magic'],5:['misty-step']},res:[{n:'Detectar magia (gratis)',by:1,rec:'largo',from:3},{n:'Paso brumoso (gratis)',by:1,rec:'largo',from:5}]},
       wood:{n:'Elfo silvano',speed:35,traits:[['Magia de elfo silvano','Velocidad de 35 pies. Conoces Druidismo; a nivel 3 Zancada prodigiosa y a nivel 5 Pasar sin dejar rastro (1 vez cada uno por descanso largo sin espacio). Aptitud: INT, SAB o CAR.']],spells:{1:['druidcraft'],3:['longstrider'],5:['pass-without-trace']},res:[{n:'Zancada prodigiosa (gratis)',by:1,rec:'largo',from:3},{n:'Pasar sin dejar rastro (gratis)',by:1,rec:'largo',from:5}]}}},
gnome:{n:'Gnomo',size:'P',speed:30,dv:60,linLabel:'Linaje gnómico',
  traits:[['Astucia gnómica','Ventaja en salvaciones de INT, SAB y CAR.']],
  lin:{forest:{n:'Gnomo de los bosques',traits:[['Magia de los bosques','Conoces Ilusión menor y siempre tienes preparado Hablar con los animales, que puedes lanzar sin espacio tantas veces como tu bonificador de competencia por descanso largo.']],spells:{1:['minor-illusion','speak-with-animals']},res:[{n:'Hablar con los animales (gratis)',by:'pb',rec:'largo'}]},
       rock:{n:'Gnomo de las rocas',traits:[['Ingenio de las rocas','Conoces Reparar y Prestidigitación. Puedes fabricar pequeños aparatos mecánicos de relojería (hasta 3 a la vez).']],spells:{1:['mending','prestidigitation']}}}},
goliath:{n:'Goliat',size:'M',speed:35,dv:0,linLabel:'Ascendencia gigante',
  traits:[['Complexión poderosa','Ventaja para acabar con el estado agarrado y cuentas como una talla más para cargar peso.']],
  res:[{n:'Forma grande',by:1,rec:'largo',from:5}],
  lv:{5:[['Forma grande','Acción adicional, 10 minutos: te vuelves Grande, con ventaja en pruebas de FUE y +10 pies de velocidad. 1 vez por descanso largo.']]},
  lin:Object.fromEntries(GIANT.map(([k,n,f,t])=>[k,{n:`Gigante de ${n.toLowerCase()}`,traits:[[f,t+' Usos: tu bonificador de competencia por descanso largo.']],res:[{n:f,by:'pb',rec:'largo'}]}]))},
halfling:{n:'Mediano',size:'P',speed:30,dv:0,
  traits:[['Valiente','Ventaja en salvaciones para evitar o acabar con el estado asustado.'],['Agilidad mediana','Puedes moverte a través del espacio de criaturas más grandes que tú.'],['Suerte','Cuando sacas un 1 en el d20 de una prueba d20, puedes repetir la tirada y usar el nuevo resultado.'],['Sigiloso por naturaleza','Puedes intentar esconderte detrás de criaturas más grandes que tú.']]},
human:{n:'Humano',size:'M o P',speed:30,dv:0,extraSkill:{n:1,from:null,label:'Habilidoso'},
  traits:[['Ingenioso','Ganas Inspiración heroica al terminar cada descanso largo (la app la activa sola).'],['Habilidoso','Competencia en una habilidad a tu elección.'],['Versátil','Ganas una dote de origen a tu elección.']]},
orc:{n:'Orco',size:'M',speed:30,dv:120,
  traits:[['Subidón de adrenalina','Acción adicional para Correr y ganar PG temporales iguales a tu bonificador de competencia. Usos: tu bonificador de competencia por descanso corto o largo.'],['Aguante incansable','Si caes a 0 PG sin morir, te quedas a 1 PG. 1 vez por descanso largo.']],
  res:[{n:'Subidón de adrenalina',by:'pb',rec:'corto'},{n:'Aguante incansable',by:1,rec:'largo'}]},
tiefling:{n:'Tiefling',size:'M o P',speed:30,dv:60,linLabel:'Legado infernal',
  traits:[['Presencia sobrenatural','Conoces el truco Taumaturgia (usa la misma aptitud que tu legado).']],spells:{1:['thaumaturgy']},
  lin:{abyssal:{n:'Abisal',traits:[['Legado abisal','Resistencia al daño de veneno. Conoces Rociada venenosa; a nivel 3 Rayo nauseabundo y a nivel 5 Inmovilizar persona (1 vez cada uno por descanso largo sin espacio). Aptitud: INT, SAB o CAR.']],spells:{1:['poison-spray'],3:['ray-of-sickness'],5:['hold-person']},res:[{n:'Rayo nauseabundo (gratis)',by:1,rec:'largo',from:3},{n:'Inmovilizar persona (gratis)',by:1,rec:'largo',from:5}]},
       chthonic:{n:'Ctónico',traits:[['Legado ctónico','Resistencia al daño necrótico. Conoces Toque gélido; a nivel 3 Falsa vida y a nivel 5 Rayo debilitador (1 vez cada uno por descanso largo sin espacio). Aptitud: INT, SAB o CAR.']],spells:{1:['chill-touch'],3:['false-life'],5:['ray-of-enfeeblement']},res:[{n:'Falsa vida (gratis)',by:1,rec:'largo',from:3},{n:'Rayo debilitador (gratis)',by:1,rec:'largo',from:5}]},
       infernal:{n:'Infernal',traits:[['Legado infernal','Resistencia al daño de fuego. Conoces Descarga de fuego; a nivel 3 Represión infernal y a nivel 5 Oscuridad (1 vez cada uno por descanso largo sin espacio). Aptitud: INT, SAB o CAR.']],spells:{1:['fire-bolt'],3:['hellish-rebuke'],5:['darkness']},res:[{n:'Represión infernal (gratis)',by:1,rec:'largo',from:3},{n:'Oscuridad (gratis)',by:1,rec:'largo',from:5}]}}}
};

/* Dotes de origen: efectos que la app aplica sola (hpPerLevel, initPB, res, skills extra) */
window.FEATS={
alert:{n:'Alerta',text:'Sumas tu bonificador de competencia a la iniciativa (la app lo suma sola) y puedes intercambiar tu iniciativa con un aliado dispuesto.',initPB:true},
crafter:{n:'Artesano',text:'Competencia con tres herramientas de artesano, 20 % de descuento en objetos no mágicos y fabricas objetos sencillos en un descanso largo.'},
healer:{n:'Sanador',text:'Con un kit de sanador estabilizas y curas (1 dado de golpe + competencia) como acción; repites los 1 en tiradas de curación.'},
lucky:{n:'Afortunado',text:'Tienes puntos de suerte (tu bonificador de competencia por descanso largo): gasta uno para tener ventaja en una prueba d20 o imponer desventaja a un ataque contra ti.',res:[{n:'Puntos de suerte',by:'pb',rec:'largo'}]},
'magic-cleric':{n:'Iniciado en la magia (clérigo)',text:'Aprendes dos trucos y un conjuro de nivel 1 de la lista de clérigo (búscalos con «Buscar conjuros»). Lanzas el de nivel 1 sin espacio 1 vez por descanso largo. Aptitud: INT, SAB o CAR.',res:[{n:'Conjuro de iniciado (gratis)',by:1,rec:'largo'}],magic:'cleric'},
'magic-druid':{n:'Iniciado en la magia (druida)',text:'Aprendes dos trucos y un conjuro de nivel 1 de la lista de druida (búscalos con «Buscar conjuros»). Lanzas el de nivel 1 sin espacio 1 vez por descanso largo. Aptitud: INT, SAB o CAR.',res:[{n:'Conjuro de iniciado (gratis)',by:1,rec:'largo'}],magic:'druid'},
'magic-wizard':{n:'Iniciado en la magia (mago)',text:'Aprendes dos trucos y un conjuro de nivel 1 de la lista de mago (búscalos con «Buscar conjuros»). Lanzas el de nivel 1 sin espacio 1 vez por descanso largo. Aptitud: INT, SAB o CAR.',res:[{n:'Conjuro de iniciado (gratis)',by:1,rec:'largo'}],magic:'wizard'},
musician:{n:'Músico',text:'Competencia con tres instrumentos. Tras un descanso corto o largo, puedes dar Inspiración heroica a tantos aliados como tu bonificador de competencia.'},
'savage-attacker':{n:'Atacante salvaje',text:'Una vez por turno, al impactar con un arma, tiras los dados de daño dos veces y eliges el resultado.'},
skilled:{n:'Hábil',text:'Competencia en tres habilidades o herramientas a tu elección.',skills:3},
'tavern-brawler':{n:'Camorrista',text:'Golpe desarmado de 1d4 + FUE, repites los 1 de daño de armas improvisadas y puedes empujar 5 pies al impactar con un golpe desarmado.'},
tough:{n:'Duro',text:'Tus PG máximos aumentan en 2 por cada nivel (la app lo suma sola).',hpPerLevel:2}
};

/* Trasfondos: características que puedes aumentar, habilidades, herramienta y dote de origen */
window.BACKGROUNDS={
acolyte:{n:'Acólito',ab:['int','wis','cha'],skills:['insight','religion'],tool:'Útiles de caligrafía',feat:'magic-cleric'},
artisan:{n:'Artesano',ab:['str','dex','int'],skills:['investigation','persuasion'],tool:'Herramientas de artesano (una)',feat:'crafter'},
charlatan:{n:'Charlatán',ab:['dex','con','cha'],skills:['deception','sleight'],tool:'Útiles de falsificación',feat:'skilled'},
criminal:{n:'Criminal',ab:['dex','con','int'],skills:['sleight','stealth'],tool:'Herramientas de ladrón',feat:'alert'},
entertainer:{n:'Artista',ab:['str','dex','cha'],skills:['acrobatics','performance'],tool:'Instrumento musical (uno)',feat:'musician'},
farmer:{n:'Granjero',ab:['str','con','wis'],skills:['animal','nature'],tool:'Herramientas de carpintero',feat:'tough'},
guard:{n:'Guardia',ab:['str','int','wis'],skills:['athletics','perception'],tool:'Juego (uno)',feat:'alert'},
guide:{n:'Guía',ab:['dex','con','wis'],skills:['stealth','survival'],tool:'Herramientas de cartógrafo',feat:'magic-druid'},
hermit:{n:'Ermitaño',ab:['con','wis','cha'],skills:['medicine','religion'],tool:'Útiles de herborista',feat:'healer'},
merchant:{n:'Mercader',ab:['con','int','cha'],skills:['animal','persuasion'],tool:'Herramientas de navegante',feat:'lucky'},
noble:{n:'Noble',ab:['str','int','cha'],skills:['history','persuasion'],tool:'Juego (uno)',feat:'skilled'},
sage:{n:'Sabio',ab:['con','int','wis'],skills:['arcana','history'],tool:'Útiles de caligrafía',feat:'magic-wizard'},
sailor:{n:'Marinero',ab:['str','dex','wis'],skills:['acrobatics','perception'],tool:'Herramientas de navegante',feat:'tavern-brawler'},
scribe:{n:'Escriba',ab:['dex','int','wis'],skills:['investigation','perception'],tool:'Útiles de caligrafía',feat:'skilled'},
soldier:{n:'Soldado',ab:['str','dex','con'],skills:['athletics','intimidation'],tool:'Juego (uno)',feat:'savage-attacker'},
wayfarer:{n:'Vagabundo',ab:['dex','wis','cha'],skills:['insight','stealth'],tool:'Herramientas de ladrón',feat:'lucky'}
};
})();
