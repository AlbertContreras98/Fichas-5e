/* Inventario de rasgos de clase y subclase (prueba 1a): recorre data/classes.js y busca en js/ dónde se usa cada rasgo, como primera criba.
   Uso: node tests/inventario-clases.js [--json | --md]   La clasificación final (Sola / Parcial / Solo texto) está revisada a mano en tests/inventario-clases.md. */
'use strict';
const fs = require('fs'),
  path = require('path'),
  vm = require('vm');
const ROOT = path.join(__dirname, '..');
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'data/classes.js'), 'utf8'), ctx);
const CL = ctx.window.CLASSES;

/* Código de la app (sin data/ ni master.js, que no toca rasgos de la ficha) */
const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.js')) files.push(p);
  }
})(path.join(ROOT, 'js'));
const src = files.map(f => [path.relative(ROOT, f), fs.readFileSync(f, 'utf8').split('\n')]);
const norm = s =>
  String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
function hits(term) {
  const t = norm(term),
    out = [];
  for (const [f, lines] of src)
    lines.forEach((l, i) => {
      if (norm(l).includes(t)) out.push(`${f}:${i + 1}`);
    });
  return out;
}
/* Recursos (res) e info de clase y subclase: dan usos y recuperación automáticos */
const resNames = (def, sub) => [...(def.res || []), ...((sub && sub.res) || [])].map(r => r.n);

const rows = [];
for (const [ck, def] of Object.entries(CL)) {
  const add = (sk, sub, lv, n, t) => {
    const res = resNames(def, sub).filter(r => norm(r) === norm(n) || norm(r).startsWith(norm(n) + ' '));
    const h = hits(n).filter(x => !/^js\/features\/master/.test(x));
    rows.push({ cls: ck, sub: sk || '', lv: +lv, n, res, hits: h, len: t.length });
  };
  for (const lv in def.f) for (const [n, t] of def.f[lv]) add('', null, lv, n, t);
  for (const [sk, sub] of Object.entries(def.subs || {}))
    for (const lv in sub.f || {}) for (const [n, t] of sub.f[lv]) add(sk, sub, lv, n, t);
}
/* Claves de clase/subclase que el código compara directamente */
const keyHits = {};
for (const [f, lines] of src)
  lines.forEach((l, i) => {
    let m;
    const re = /(classKey|subclassKey)\s*[!=]==?\s*'([a-zA-Z]+)'/g;
    while ((m = re.exec(l))) (keyHits[m[2]] = keyHits[m[2]] || []).push(`${f}:${i + 1}`);
  });

/* Clasificación revisada a mano (2026-11-09) leyendo el código: clase|subclase|nivel|rasgo|estado|nota.
   Estado: S = la app lo hace sola · P = parcial · T = solo texto. Lo que no sale aquí es T sin nota. */
const CLASIF = `
barbarian||1|Furia|P|Contador de usos (2–6; 1 en descanso corto, todos en largo), botón en Acción adicional y aviso. Falta: efecto con duración (hasta 10 min), sumar el daño de furia a los ataques de FUE, aplicar la resistencia al recibir daño y avisar de que no puedes lanzar conjuros ni concentrarte.
barbarian||1|Defensa sin armadura|P|Calcula 10 + DES + CON solo si tienes alguna armadura o escudo en el equipo. Sin ninguna (lo normal en un bárbaro), la CA se queda fija en la de la creación y no cambia al subir CON o DES.
barbarian||1|Maestría con armas|S|Cada arma lleva su maestría (casilla por arma) y Datos de clase dice cuántas puedes tener; no comprueba que no te pases.
barbarian||2|Sentir el peligro|T|
barbarian||2|Ataque temerario|T|No hay botón ni efecto «atacan con ventaja contra ti hasta tu turno».
barbarian||3|Conocimiento primigenio|T|La habilidad se marca a mano en Editar.
barbarian||5|Ataque adicional|S|Combate dice «haces 2 ataques» y los va descontando.
barbarian||5|Movimiento rápido|T|No suma +10 pies a la velocidad.
barbarian||7|Instinto salvaje|T|Al empezar el combate no avisa de la ventaja en iniciativa.
barbarian||11|Furia implacable|T|No lleva la CD que sube ni salta al caer a 0 PG.
barbarian||15|Furia persistente|T|
barbarian||20|Campeón primigenio|T|Las características se suben a mano.
barbarian|berserker|14|Presencia intimidante|T|Sin contador de 1 uso por descanso largo.
barbarian|worldtree|3|Vitalidad del árbol|T|No da los PG temporales (nivel de bárbaro) al entrar en furia.
barbarian|zealot|3|Guerrero de los dioses|T|La reserva de d12 no tiene contador.
barbarian|zealot|10|Presencia fanática|T|Sin contador de 1 uso por descanso largo.
bard||1|Inspiración bárdica|S|Contador con usos = CAR (mín. 1), recupera en largo (en corto desde nivel 5), botón en Acción adicional y dado por nivel en Datos de clase.
bard||1|Lanzamiento de conjuros|S|Espacios, CD, ataque, trucos y preparados por nivel.
bard||2|Pericia|T|Se marca a mano en Editar (la app sí suma el doble de competencia); el asistente no la pide.
bard||2|Aprendiz de todo|T|No suma la mitad de la competencia a las pruebas sin competencia (tampoco a la iniciativa).
bard||5|Fuente de inspiración|P|La recuperación pasa sola a descanso corto; gastar un espacio para recuperar un uso es a mano.
bard||9|Pericia|T|Igual que la de nivel 2.
bard||10|Secretos mágicos|T|El buscador filtra por la lista de bardo; los de otras listas se buscan quitando el filtro.
bard||20|Palabras de creación|P|Los dos conjuros quedan siempre preparados; el segundo objetivo es texto.
bard|dance|3|Juego de pies deslumbrante|T|La CA 10 + DES + CAR no se calcula (solo se calcula la del bárbaro, el monje y el dracónico).
bard|glamour|3|Magia cautivadora|P|Hechizar persona e Imagen múltiple quedan siempre preparados; el efecto extra tras lanzar es texto.
bard|glamour|6|Manto de majestad|P|Orden imperiosa siempre preparado; los lanzamientos gratis durante 1 minuto (1 por descanso largo) no se llevan.
bard|lore|6|Descubrimientos mágicos|T|Los dos conjuros se añaden a mano y no quedan marcados como siempre preparados.
bard|valor|3|Entrenamiento marcial|T|No añade armas marciales, armadura media ni escudos a las competencias (la app avisará «sin competencia»).
bard|valor|6|Ataque adicional|S|2 ataques por acción; cambiar uno por un truco es texto.
cleric||1|Lanzamiento de conjuros|S|Espacios, CD, ataque, trucos y preparados por nivel; tras un descanso largo ofrece cambiar los preparados.
cleric||1|Orden divino|T|El asistente no lo pregunta: ni armas marciales y armadura pesada (Protector) ni truco extra y bonificador a Conocimiento arcano y Religión (Taumaturgo).
cleric||2|Canalizar divinidad|P|Contador (2/3/4; 1 en corto, todos en largo) y botón en Acción. No dice cuánto cura o daña Chispa divina (1d8–4d8 + SAB) ni la CD de Expulsar muertos vivientes.
cleric||10|Intervención divina|P|Contador de 1 uso por descanso largo y botón; no deja elegir y lanzar gratis el conjuro.
cleric|knowledge|3|Conjuros del dominio|S|Siempre preparados según el nivel.
cleric|life|3|Discípulo de la vida|T|Al lanzar un conjuro de curación no suma ni recuerda los 2 + nivel del espacio.
cleric|life|3|Conjuros del dominio|S|Siempre preparados según el nivel.
cleric|life|3|Preservar la vida|T|Gasta Canalizar divinidad a mano; no reparte la curación.
cleric|light|3|Conjuros del dominio|S|Siempre preparados según el nivel.
cleric|light|3|Destello protector|T|Sin contador (SAB usos por descanso largo; desde nivel 6 también en corto).
cleric|light|17|Corona de luz|T|Sin contador (SAB usos por descanso largo).
cleric|trickery|3|Conjuros del dominio|S|Siempre preparados según el nivel.
druid||1|Druídico|S|Hablar con los animales queda siempre preparado; el idioma secreto es texto.
druid||1|Orden primigenio|T|El asistente no lo pregunta: ni truco extra y bonificador a Conocimiento arcano y Naturaleza (Mago) ni armas marciales y armadura media (Guardián).
druid||1|Lanzamiento de conjuros|S|Espacios, CD, ataque, trucos y preparados por nivel; tras un descanso largo ofrece cambiar los preparados.
druid||2|Forma salvaje|S|Contador (2/3/4; 1 en corto), formas guardadas con VD y límite por nivel, PG temporales = nivel, efecto que dura la mitad del nivel en horas, usa los ataques de la forma, bloquea los conjuros y botón para volver.
druid||2|Compañero salvaje|S|Desde Forma salvaje gasta un uso y crea el familiar (o le devuelve los PG).
druid||5|Resurgir salvaje|T|
druid||18|Conjuros bestiales|T|La app sigue bloqueando los conjuros en forma salvaje (ver fallos).
druid||20|Archidruida|T|
druid|land|3|Conjuros del círculo|T|No añade los conjuros del terreno elegido (no están en la lista de siempre preparados).
druid|land|6|Recuperación natural|T|Ni el lanzamiento gratis ni la recuperación de espacios.
druid|moon|3|Formas del círculo|S|VD máximo = nivel ÷ 3, CA mínima 13 + SAB y PG temporales ×3, aplicados al transformarte.
druid|moon|3|Conjuros del círculo|S|Siempre preparados y se pueden lanzar transformado (Fuente de luz de luna no está en el SRD).
druid|moon|10|Paso a la luz de la luna|T|Sin contador (SAB usos por descanso largo).
druid|sea|3|Conjuros del círculo|S|Siempre preparados según el nivel.
druid|sea|3|Ira del mar|T|Gasta Forma salvaje a mano; no crea el aura de 10 minutos.
druid|stars|3|Mapa estelar|P|Orientación y Saeta guía siempre preparados; los lanzamientos gratis de Saeta guía (SAB por descanso largo) no tienen contador.
druid|stars|3|Forma estrellada|T|Gasta Forma salvaje a mano; no crea el efecto de 10 minutos.
druid|stars|6|Presagio cósmico|T|Sin contador (SAB usos por descanso largo).
fighter||1|Estilo de combate|S|El asistente pide la dote de estilo y aplica lo calculable (CA, ataque, daño).
fighter||1|Tomar aliento|P|Contador (2–4; 1 en corto) y botón en Acción adicional; no dice qué tirar (1d10 + nivel) ni suma los PG.
fighter||1|Maestría con armas|S|Cada arma lleva su maestría y Datos de clase dice cuántas; no comprueba el máximo.
fighter||2|Oleada de acción|S|Contador (1–2, descanso corto) y botón que te devuelve la acción del turno.
fighter||2|Mente táctica|T|Gasta Tomar aliento a mano.
fighter||5|Ataque adicional|S|2 ataques por acción.
fighter||9|Indómito|S|Contador (1–3 por descanso largo) y botón sin gastar acción; el + nivel lo sumas tú.
fighter||11|Dos ataques adicionales|S|3 ataques por acción.
fighter||20|Tres ataques adicionales|S|4 ataques por acción.
fighter|battlemaster|3|Superioridad en combate|P|Contador de dados (4–6, descanso corto) y tamaño del dado; no hay lista de maniobras ni se muestra la CD de maniobra.
fighter|battlemaster|10|Superioridad en combate mejorada|S|El dado pasa a d10 en Datos de clase.
fighter|battlemaster|18|Superioridad en combate definitiva|S|El dado pasa a d12.
fighter|champion|3|Crítico mejorado|T|Los ataques no recuerdan que haces crítico con 19.
fighter|champion|3|Atleta excepcional|T|Ni la ventaja en iniciativa ni en Atletismo.
fighter|champion|7|Estilo de combate adicional|S|El asistente vuelve a pedir una dote de estilo.
fighter|champion|18|Superviviente|T|No cura al empezar el turno.
fighter|eldritch|3|Lanzamiento de conjuros|S|Espacios de un tercio de lanzador, trucos y preparados por nivel.
fighter|psiwarrior|3|Poder psiónico|P|Contador de dados (4–12; 1 en corto) y tamaño del dado; los tres usos son texto.
fighter|psiwarrior|18|Maestro telequinético|P|Telequinesis siempre preparado; lanzarlo gratis no tiene contador.
monk||1|Artes marciales|P|Opción «Golpe desarmado» en Acción adicional y dado en Datos de clase. Falta un ataque de golpe desarmado con DES y el dado, y que las armas de monje usen DES y el dado.
monk||1|Defensa sin armadura|P|Calcula 10 + DES + SAB solo si tienes alguna armadura o escudo en el equipo; si no (lo normal), la CA queda fija en la de la creación.
monk||2|Concentración del monje|P|Contador de puntos (descanso corto) y opciones Ráfaga de golpes, Defensa paciente y Paso del viento que gastan 1 punto y la acción adicional. Faltan las versiones gratis (Destrabarse o Correr sin gastar punto).
monk||2|Movimiento sin armadura|P|Datos de clase muestran los pies extra, pero la velocidad no los suma.
monk||2|Metabolismo asombroso|P|Contador y botón; no recupera los puntos ni dice qué curar (dado de artes marciales + nivel).
monk||3|Desviar ataques|T|No hay reacción que reste el daño.
monk||5|Ataque adicional|S|2 ataques por acción.
monk||5|Golpe aturdidor|P|Opción sin gastar acción que gasta 1 punto y recuerda la salvación de CON; no muestra la CD (8 + competencia + SAB).
monk|openhand|6|Plenitud corporal|T|Sin contador (SAB usos por descanso largo).
monk|mercy|3|Mano sanadora|T|Gasta puntos a mano; no hay botón ni curación.
monk|mercy|3|Mano dañina|T|Gasta puntos a mano.
paladin||1|Imposición de manos|P|Reserva de 5 × nivel con botón en Acción adicional que pregunta cuántos gastas; no suma los PG curados (ni a ti) ni avisa de que 5 PG quitan Envenenado.
paladin||1|Lanzamiento de conjuros|S|Espacios, CD, ataque y preparados; tras un descanso largo ofrece cambiar uno.
paladin||1|Maestría con armas|S|Cada arma lleva su maestría; no comprueba el máximo.
paladin||2|Estilo de combate|S|Dote de estilo o la opción de trucos (estos, a mano).
paladin||2|Castigo del paladín|S|Castigo divino siempre preparado y 1 lanzamiento gratis por descanso largo enlazado al conjuro.
paladin||3|Canalizar divinidad|P|Contador (2/3; 1 en corto) y botón en Acción; Sentido divino y las opciones del juramento son texto.
paladin||5|Ataque adicional|S|2 ataques por acción.
paladin||5|Corcel fiel|P|Encontrar montura siempre preparado y ficha de montura con casilla «es gratis», pero el uso gratis por descanso largo no tiene contador.
paladin||6|Aura de protección|T|No suma CAR (mín. +1) a tus salvaciones.
paladin||11|Golpes radiantes|T|Los ataques cuerpo a cuerpo no recuerdan el +1d8 radiante.
paladin|devotion|3|Conjuros del juramento|S|Siempre preparados según el nivel.
paladin|glory|3|Conjuros del juramento|S|Siempre preparados según el nivel.
paladin|ancients|3|Conjuros del juramento|S|Siempre preparados según el nivel.
paladin|vengeance|3|Conjuros del juramento|S|Siempre preparados según el nivel.
paladin|vengeance|3|Voto de enemistad|T|Gasta Canalizar divinidad a mano; no crea el efecto de 1 minuto.
paladin|glory|7|Aura de presteza|T|No suma +10 pies a la velocidad.
paladin|glory|15|Defensa gloriosa|T|Sin contador (CAR usos por descanso largo).
ranger||1|Enemigo predilecto|S|Marca del cazador siempre preparada y contador de lanzamientos gratis (2–6 por descanso largo) enlazado al conjuro.
ranger||1|Lanzamiento de conjuros|S|Espacios, CD, ataque y preparados; tras un descanso largo ofrece cambiar uno.
ranger||1|Maestría con armas|S|Cada arma lleva su maestría; no comprueba el máximo.
ranger||2|Explorador hábil|T|La pericia y los idiomas se ponen a mano.
ranger||2|Estilo de combate|S|Dote de estilo o la opción de trucos (estos, a mano).
ranger||5|Ataque adicional|S|2 ataques por acción.
ranger||6|Errante|T|No suma +10 pies ni pone velocidad de trepar y nadar.
ranger||9|Pericia|T|Se marca a mano en Editar.
ranger||10|Incansable|P|Contador (SAB por descanso largo) y botón en Acción; no dice qué tirar (1d8 + SAB) ni suma los PG temporales, ni quita agotamiento en el descanso corto.
ranger||13|Cazador implacable|T|La app sigue pidiendo salvación de concentración al recibir daño con Marca del cazador.
ranger||14|Velo de la naturaleza|T|Sin contador (SAB usos por descanso largo).
ranger|beastmaster|3|Compañero primigenio|S|Ficha de la bestia calculada con tu nivel y SAB (CA, PG, golpe) y botón «Ordenar» en Acción adicional.
ranger|beastmaster|7|Entrenamiento excepcional|T|Aparece como texto en los rasgos de la bestia.
ranger|beastmaster|11|Furia bestial|S|La bestia ataca dos veces (×2 en el botón «Ordenar»).
ranger|beastmaster|15|Compartir conjuros|T|Aparece como texto en los rasgos de la bestia.
ranger|feywanderer|3|Conjuros del trotamundos|S|Siempre preparados según el nivel (los que no están en el SRD, a mano).
ranger|gloomstalker|3|Emboscador terrible|T|No suma SAB a la iniciativa ni lleva el contador de daño extra (SAB por descanso largo).
ranger|gloomstalker|3|Conjuros del acechador|S|Siempre preparados según el nivel (los que no están en el SRD, a mano).
rogue||1|Pericia|T|Se marca a mano en Editar (la app sí suma el doble de competencia); el asistente no la pide.
rogue||1|Ataque furtivo|P|Datos de clase muestran los dados (1d6–10d6); en Combate no hay recordatorio de «una vez por turno» ni de las condiciones.
rogue||1|Maestría con armas|S|Cada arma lleva su maestría; no comprueba el máximo.
rogue||2|Acción astuta|S|Opción en Acción adicional (Correr, Destrabarse o Esconderse).
rogue||3|Apuntar con calma|T|No hay opción en Acción adicional.
rogue||5|Esquiva asombrosa|T|No hay reacción que divida el daño a la mitad.
rogue||6|Pericia|T|Se marca a mano en Editar.
rogue||7|Talento fiable|T|
rogue||20|Golpe de suerte|S|Contador de 1 uso por descanso corto con botón.
rogue|arcanetrickster|3|Lanzamiento de conjuros|S|Espacios de un tercio de lanzador, trucos y preparados (Mano de mago se añade a mano).
rogue|soulknife|3|Poder psiónico|P|Contador de dados (4–12; 1 en corto) y tamaño; los usos son texto.
rogue|soulknife|3|Cuchillas psíquicas|T|No crea el ataque de las cuchillas (1d6 psíquico + la segunda de 1d4).
rogue|soulknife|13|Velo psíquico|T|Sin contador.
sorcerer||1|Hechicería innata|P|Contador (2 por descanso largo) y botón en Acción adicional; no crea el efecto de 1 minuto ni sube la CD ni recuerda la ventaja.
sorcerer||1|Lanzamiento de conjuros|S|Espacios, CD, ataque, trucos y preparados por nivel.
sorcerer||2|Fuente de magia|P|Contador de puntos de hechicería (nivel, descanso largo); convertir puntos en espacios (o al revés) se hace a mano y sin la tabla de costes.
sorcerer||2|Metamagia|T|No hay catálogo de opciones; el recuento «Metamagias conocidas» cuenta de más (ver fallos).
sorcerer||5|Restauración hechicera|P|Contador de 1 uso por descanso largo; no devuelve los puntos (mitad del nivel) en el descanso corto.
sorcerer||10|Metamagia|T|Igual que la de nivel 2.
sorcerer||17|Metamagia|T|Igual que la de nivel 2.
sorcerer|aberrant|3|Conjuros psiónicos|S|Siempre preparados según el nivel.
sorcerer|clockwork|3|Conjuros mecánicos|S|Siempre preparados según el nivel.
sorcerer|clockwork|3|Restaurar el equilibrio|T|Sin contador (CAR usos por descanso largo).
sorcerer|draconic|3|Resistencia dracónica|P|Suma +1 PG por nivel al subir (y los atrasados al elegirla). La CA 10 + DES + CAR solo se calcula si tienes alguna armadura o escudo en el equipo; si no (lo normal en un hechicero), se queda la CA de la creación.
sorcerer|draconic|3|Conjuros dracónicos|S|Siempre preparados según el nivel.
sorcerer|draconic|14|Alas de dragón|T|Sin contador ni efecto de 1 hora.
sorcerer|wildmagic|3|Oleada de magia salvaje|T|Al lanzar con espacio no recuerda tirar el d20.
sorcerer|wildmagic|3|Mareas del caos|S|Contador de 1 uso por descanso largo con botón; recuperarlo tras una oleada es a mano.
warlock||1|Invocaciones sobrenaturales|S|El asistente y el botón «Invocaciones» eligen del catálogo con requisitos y máximo por nivel, y añaden los conjuros gratis y las dotes. El recuento de la ficha cuenta una de más (ver fallos).
warlock||1|Magia de pacto|S|Espacios de pacto (número y nivel), se recuperan en descanso corto, CD y ataque con CAR.
warlock||2|Astucia mágica|P|Contador de 1 uso por descanso largo, pero no devuelve los espacios de pacto (la mitad del máximo, redondeando arriba): hay que marcarlos a mano.
warlock||9|Contactar con el patrón|P|Contactar con otro plano siempre preparado y contador de 1 uso, pero no están enlazados: al lanzarlo pide espacio de pacto.
warlock||11|Arcano místico|P|Contador de usos (1–4) y deja añadir conjuros de nivel 6–9, pero lanzarlos no se enlaza con el contador y sale «Sin espacios».
warlock||13|Arcano místico|P|Igual que el de nivel 11.
warlock||15|Arcano místico|P|Igual que el de nivel 11.
warlock||17|Arcano místico|P|Igual que el de nivel 11.
warlock||20|Maestro sobrenatural|T|
warlock|archfey|3|Conjuros del archifeérico|S|Siempre preparados según el nivel.
warlock|archfey|3|Pasos de las hadas|P|Contador (CAR por descanso largo), pero no está enlazado a Paso brumoso (que gasta espacio de pacto) y en Combate sale como «sin gastar acción» en vez de acción adicional.
warlock|celestial|3|Conjuros celestiales|S|Siempre preparados según el nivel.
warlock|celestial|3|Luz sanadora|P|Reserva de d6 (1 + nivel) con botón en Acción adicional que pregunta cuántos gastas; no limita a CAR dados ni suma la curación.
warlock|fiend|3|Bendición del oscuro|T|No hay botón para ganar los PG temporales (CAR + nivel) cuando cae un enemigo.
warlock|fiend|3|Conjuros infernales|S|Siempre preparados según el nivel.
warlock|fiend|6|Suerte del oscuro|S|Contador de CAR usos por descanso largo (desde nivel 6) con botón sin gastar acción.
warlock|greatoldone|3|Conjuros del primigenio|S|Siempre preparados según el nivel.
warlock|greatoldone|10|Maleficio sobrenatural|P|Maleficio siempre preparado; la desventaja extra es texto.
wizard||1|Lanzamiento de conjuros|P|Espacios, CD, ataque, trucos y preparados por nivel, pero no hay libro de conjuros: al cambiar los preparados se elige de toda la lista de mago.
wizard||1|Ritualista|T|Sin libro, no se puede lanzar como ritual un conjuro no preparado.
wizard||1|Recuperación arcana|P|Contador de 1 uso por descanso largo; no deja elegir y recuperar los espacios (nivel total = mitad del nivel de mago).
wizard||2|Erudito|T|La pericia se marca a mano en Editar.
wizard|abjurer|3|Custodia arcana|T|La custodia no tiene contador de PG ni absorbe el daño.
wizard|diviner|3|Portento|P|Contador (2; 3 desde nivel 14) con botón; no hay sitio para apuntar los números que sacaste.
wizard|diviner|14|Gran portento|S|El contador de Portento pasa a 3.
wizard|evoker|3|Truco potente|T|
wizard|illusionist|6|Criaturas fantasmales|P|Al invocar bestia o feérico hay casilla «ilusoria» que pone la mitad de PG; el uso gratis no tiene contador y los conjuros no se añaden como siempre preparados.
`;
const EST = { S: 'Sola', P: 'Parcial', T: 'Solo texto' };
const clas = {};
for (const l of CLASIF.trim().split('\n')) {
  const [cls, sub, lv, n, e, nota] = l.split('|');
  clas[`${cls}|${sub}|${lv}|${n}`] = { e, nota: nota || '' };
}
const usados = new Set();
for (const r of rows) {
  const k = `${r.cls}|${r.sub}|${r.lv}|${r.n}`,
    v = clas[k];
  if (v) usados.add(k);
  r.e = v ? v.e : 'T';
  r.nota = v ? v.nota : '';
}
const sobran = Object.keys(clas).filter(k => !usados.has(k));
if (sobran.length) console.error('Claves de CLASIF que no existen en data/classes.js:', sobran);

/* --md: resumen y tablas en Markdown (para tests/inventario-clases.md) */
if (process.argv.includes('--md')) {
  const out = [];
  const subN = (ck, sk) => (sk ? CL[ck].subs[sk].n : '—');
  out.push('| Clase | Rasgos | Sola | Parcial | Solo texto | Niv. 1–5: Sola / Parcial / Texto |', '|---|---|---|---|---|---|');
  const T = { n: 0, S: 0, P: 0, T: 0, l5: { S: 0, P: 0, T: 0 } };
  for (const ck of Object.keys(CL)) {
    const rs = rows.filter(r => r.cls === ck),
      c = e => rs.filter(r => r.e === e).length,
      c5 = e => rs.filter(r => r.e === e && r.lv <= 5).length;
    out.push(`| ${CL[ck].n} | ${rs.length} | ${c('S')} | ${c('P')} | ${c('T')} | ${c5('S')} / ${c5('P')} / ${c5('T')} |`);
    T.n += rs.length;
    for (const e of ['S', 'P', 'T']) (T[e] += c(e)), (T.l5[e] += c5(e));
  }
  out.push(`| **Total** | **${T.n}** | **${T.S}** | **${T.P}** | **${T.T}** | **${T.l5.S} / ${T.l5.P} / ${T.l5.T}** |`);
  out.push('@@TABLAS@@');
  for (const ck of Object.keys(CL)) {
    out.push('', `### ${CL[ck].n}`, '', '| Rasgo | Subclase | Nivel | Estado | Qué hace / qué falta |', '|---|---|---|---|---|');
    const rs = rows.filter(r => r.cls === ck).sort((a, b) => !!a.sub - !!b.sub || (a.sub || '').localeCompare(b.sub || '') || a.lv - b.lv);
    for (const r of rs) out.push(`| ${r.n} | ${subN(ck, r.sub)} | ${r.lv} | ${EST[r.e]} | ${r.nota} |`);
  }
  console.log(out.join('\n'));
  process.exit(0);
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ rows, keyHits }, null, 1));
} else {
  const tot = {};
  for (const r of rows) {
    const k = r.cls;
    tot[k] = tot[k] || { rasgos: 0, conRecurso: 0, citadoEnJs: 0 };
    tot[k].rasgos++;
    if (r.res.length) tot[k].conRecurso++;
    if (r.hits.length) tot[k].citadoEnJs++;
  }
  console.log('Criba automática (recurso = tiene usos en data; citado = su nombre aparece en js/):');
  console.table(tot);
  console.log('\nClaves de clase/subclase comparadas en el código:', keyHits);
  console.log('\nRasgos citados por nombre en js/ (revisar a mano):');
  for (const r of rows)
    if (r.hits.length || r.res.length)
      console.log(`- ${r.cls}${r.sub ? '/' + r.sub : ''} ${r.lv} «${r.n}» res=[${r.res}] js=[${r.hits.slice(0, 4).join(', ')}${r.hits.length > 4 ? ', …' : ''}]`);
  console.log(`\nTotal: ${rows.length} rasgos.`);
}
