'use strict';
/* ================= Constantes ================= */
const KEY='fichas-dnd-2024-v1';
const ABIL=[['str','FUE','Fuerza'],['dex','DES','Destreza'],['con','CON','Constitución'],['int','INT','Inteligencia'],['wis','SAB','Sabiduría'],['cha','CAR','Carisma']];
const AB=Object.fromEntries(ABIL.map(a=>[a[0],a]));
const SKILLS=[['acrobatics','Acrobacias','dex'],['animal','Trato con animales','wis'],['arcana','Conocimiento arcano','int'],['athletics','Atletismo','str'],['deception','Engaño','cha'],['history','Historia','int'],['insight','Perspicacia','wis'],['intimidation','Intimidación','cha'],['investigation','Investigación','int'],['medicine','Medicina','wis'],['nature','Naturaleza','int'],['perception','Percepción','wis'],['performance','Interpretación','cha'],['persuasion','Persuasión','cha'],['religion','Religión','int'],['sleight','Juego de manos','dex'],['stealth','Sigilo','dex'],['survival','Supervivencia','wis']];
const SK=Object.fromEntries(SKILLS.map(s=>[s[0],s]));
const CONDS=[['Agarrado','Velocidad 0. Desventaja al atacar a cualquiera que no sea quien te agarra.'],['Apresado','Velocidad 0. Desventaja en ataques y salvaciones de DES; te atacan con ventaja.'],['Asustado','Desventaja en pruebas y ataques mientras veas la fuente del miedo; no puedes acercarte a ella.'],['Aturdido','Incapacitado. Fallas salvaciones de FUE y DES; te atacan con ventaja.'],['Cegado','Fallas pruebas que requieran vista. Tus ataques con desventaja; te atacan con ventaja.'],['Derribado','Solo puedes arrastrarte o levantarte (mitad de movimiento). Desventaja al atacar; los ataques cuerpo a cuerpo contra ti tienen ventaja.'],['Ensordecido','No oyes y fallas pruebas que requieran oído.'],['Envenenado','Desventaja en tiradas de ataque y pruebas de característica.'],['Hechizado','No puedes atacar a quien te hechizó y tiene ventaja en interacciones sociales contigo.'],['Incapacitado','Sin acciones, acciones adicionales ni reacciones. Pierdes la concentración.'],['Inconsciente','Incapacitado y derribado; sueltas lo que llevas. Los golpes desde 5 pies son críticos.'],['Invisible','Tus ataques tienen ventaja; los ataques contra ti, desventaja.'],['Paralizado','Incapacitado. Fallas salvaciones de FUE y DES; los golpes desde 5 pies son críticos.'],['Petrificado','Convertido en piedra: incapacitado y con resistencia a todo el daño.']];
const TIME={A:'Acción',AA:'Acción adicional',BA:'Acción adicional',R:'Reacción'};
const FULL=[[2],[3],[4,2],[4,3],[4,3,2],[4,3,3],[4,3,3,1],[4,3,3,2],[4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2,1],[4,3,3,3,2,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1,1],[4,3,3,3,3,1,1,1,1],[4,3,3,3,3,2,1,1,1],[4,3,3,3,3,2,2,1,1]];
const CATS=[['arma','Armas'],['armadura','Armaduras y escudos'],['municion','Munición'],['pocion','Pociones'],['pergamino','Pergaminos de conjuro'],['comida','Comida y bebida'],['consumible','Otros consumibles'],['herramienta','Herramientas'],['tesoro','Tesoros'],['otro','Otros']];
const CATN=Object.fromEntries(CATS);
const USABLE=new Set(['municion','pocion','pergamino','comida','consumible']);
const COINS=[['pp','PPt',1000],['gp','PO',100],['ep','PE',50],['sp','PP',10],['cp','PC',1]];
const COINV=Object.fromEntries(COINS.map(c=>[c[0],c[2]]));
const COINN=Object.fromEntries(COINS.map(c=>[c[0],c[1]]));
const REC={corto:'descanso corto o largo',largo:'descanso largo',corto1:'1 en descanso corto, todos en largo'};
const CL=window.CLASSES,SP=window.SPELLS,SPBY=Object.fromEntries(SP.map(s=>[s.id,s]));
const SPEC=window.SPECIES,FEATS=window.FEATS,BG=window.BACKGROUNDS;

const $=s=>document.querySelector(s);
function getTheme(){try{return localStorage.getItem('fichas-theme')||''}catch(e){return''}}
function setTheme(t){const r=document.documentElement;if(t)r.dataset.theme=t;else delete r.dataset.theme;try{t?localStorage.setItem('fichas-theme',t):localStorage.removeItem('fichas-theme')}catch(e){}}
setTheme(getTheme());
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,10);
const mod=s=>Math.floor(((+s||0)-10)/2);
const sgn=n=>(n>=0?'+':'−')+Math.abs(n);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');

/* ================= Modelo ================= */
function blank(){return{
  formato:'fichas-dnd-2024/2',id:uid(),name:'Nuevo personaje',species:'',speciesKey:'',lineageKey:'',background:'',backgroundKey:'',featKeys:[],class:'',classKey:'',subclass:'',subclassKey:'',level:1,xp:0,
  abilities:{str:10,dex:10,con:10,int:10,wis:10,cha:10},saveProf:[],skills:{},
  ac:10,acBonus:0,speedFt:30,size:'M',initiativeBonus:0,
  hp:{max:8,current:8,temp:0},hitDice:{die:'d8',total:1,spent:0},deathSaves:{success:0,fail:0},
  inspiration:false,exhaustion:0,conditions:[],concentration:'',effects:[],companions:[],
  attacks:[],spellcasting:{ability:''},slots:Array.from({length:9},()=>({total:0,used:0})),pact:{level:0,total:0,used:0},spells:[],
  features:[],equipment:[],coins:{cp:0,sp:0,ep:0,gp:0,pp:0},languages:'',proficiencies:{armor:'',weapons:'',tools:''},notes:'',
  story:{img:'',alignment:'',age:'',appearance:'',personality:'',history:''},turn:{a:false,aa:false,r:false,atk:0},diary:{items:[]}}}
const NEW={
  attacks:()=>({name:'',atk:0,dmg:'',type:'',notes:'',ammo:''}),
  spells:()=>({level:0,name:'',time:'A',range:'',dur:'',conc:false,ritual:false,material:'',desc:'',ref:'',src:'',free:''}),
  features:()=>({name:'',source:'',text:'',when:'',uses:{max:0,used:0,recover:''}}),
  equipment:()=>({id:uid(),name:'',qty:1,cat:'otro',notes:''})};
function guessCat(n){n=norm(n);
  if(/flecha|virote|bala|dardo|aguja|municion/.test(n))return'municion';
  if(/pocion|elixir|antidoto|aceite/.test(n))return'pocion';
  if(/racion|comida|agua|odre|pan|queso|vino/.test(n))return'comida';
  if(/daga|espada|hoz|arco|ballesta|hacha|lanza|maza|martillo|baston|jabalina|cimitarra|estoque|honda|latigo|tridente|alabarda|garrote|mangual/.test(n))return'arma';
  if(/armadura|escudo|cota|cuero|coraza|placas|malla/.test(n))return'armadura';
  if(/kit|util|herramienta|instrumento|laud|flauta/.test(n))return'herramienta';
  if(/gema|joya|anillo|collar|idolo/.test(n))return'tesoro';
  return'otro'}
function matchSpell(name){const cands=[norm(name)];const m=String(name||'').match(/\(([^)]+)\)/);if(m)cands.push(norm(m[1]));cands.push(norm(String(name||'').replace(/\s*\(.*\)\s*/,'')));
  const d=SP.find(s=>cands.includes(norm(s.n))||cands.includes(norm(s.en)));return d?d.id:''}
function keyFrom(tbl,name){const n=norm(name);if(!n)return'';for(const k in tbl)if(n===norm(tbl[k].n)||n.startsWith(norm(tbl[k].n)))return k;return''}
function classKeyFrom(name){const n=norm(name);if(!n)return'';
  for(const k in CL){if(norm(CL[k].n)===n||norm(CL[k].en)===n||n.startsWith(norm(CL[k].n))||n.startsWith(norm(CL[k].en)))return k}return''}
function normalize(src){
  const c=Object.assign(blank(),JSON.parse(JSON.stringify(src||{}))),B=blank();
  for(const k of ['abilities','hp','hitDice','deathSaves','coins','proficiencies','spellcasting','pact','story','turn','diary']) c[k]=Object.assign(B[k],c[k]||{});
  if(!Array.isArray(c.diary.items))c.diary.items=[];
  if(!c.diary.items.length&&String(c.notes||'').trim())c.diary.items.push({id:uid(),type:'note',name:'Notas',parent:null,text:c.notes,updated:Date.now()});
  if(typeof c.skills!=='object'||!c.skills||Array.isArray(c.skills)) c.skills={};
  for(const k of ['saveProf','conditions','attacks','spells','features','equipment']) if(!Array.isArray(c[k])) c[k]=[];
  const sl=Array.isArray(c.slots)?c.slots:[];
  c.slots=Array.from({length:9},(_,i)=>({total:+(sl[i]&&sl[i].total)||0,used:+(sl[i]&&sl[i].used)||0}));
  c.attacks=c.attacks.map(x=>Object.assign(NEW.attacks(),x));
  c.spells=c.spells.map(x=>{const s=Object.assign(NEW.spells(),x);if(s.time==='BA')s.time='AA';if(!s.ref)s.ref=matchSpell(s.name);if(s.ref&&SPBY[s.ref])s.material=SPBY[s.ref].m;return s});
  c.equipment=c.equipment.map(x=>{const e=Object.assign(NEW.equipment(),x);if(!x.cat)e.cat=guessCat(e.name);if(!x.id)e.id=uid();return e});
  c.features=c.features.map(x=>{const f=Object.assign(NEW.features(),x);f.uses=Object.assign({max:0,used:0,recover:''},x&&x.uses||{});return f});
  c.level=clamp(+c.level||1,1,20);
  if(!c.classKey) c.classKey=classKeyFrom(c.class);
  if(!c.speciesKey) c.speciesKey=keyFrom(SPEC,c.species);
  if(!c.backgroundKey) c.backgroundKey=keyFrom(BG,c.background);
  if(!Array.isArray(c.featKeys)) c.featKeys=[];
  if(c.speciesKey&&!SPEC[c.speciesKey]) c.speciesKey='';
  if(c.lineageKey&&!(c.speciesKey&&SPEC[c.speciesKey].lin&&SPEC[c.speciesKey].lin[c.lineageKey])) c.lineageKey='';
  if(c.classKey&&!CL[c.classKey]) c.classKey='';
  if(c.subclassKey&&!(c.classKey&&CL[c.classKey].subs[c.subclassKey])) c.subclassKey='';
  if(!c.id) c.id=uid();
  c.formato='fichas-dnd-2024/2';
  return c}

function fillFromRef(s){const d=s.ref&&SPBY[s.ref];if(!d)return s;
  return Object.assign(s,{level:d.l,name:s.name||d.n,time:s.time&&s.time!=='A'?s.time:d.t,range:s.range||d.r,dur:s.dur||d.d,conc:s.conc||d.k,ritual:s.ritual||d.ri,material:s.material||d.m,desc:s.desc||''})}

let S={chars:[],active:null,tab:'play'};
function load(){
  try{const r=localStorage.getItem(KEY);if(r){const x=JSON.parse(r);S.chars=(x.chars||[]).map(normalize);S.active=x.active;if(x.tab)S.tab=x.tab;if(S.tab==='inv'||S.tab==='story')S.tab='pj';if(S.tab==='chars')S.tab='play'}}catch(e){}
  S.chars.forEach(linkWeapons);S.chars.forEach(linkGear);S.chars.forEach(syncEffects);S.chars.forEach(linkArmor);
  if(!S.chars.find(c=>c.id===S.active)) S.active=S.chars.length?S.chars[0].id:null}
const OLDK={'Familiar':'familiar','Montura':'other','Invocación':'other','Compañero animal':'other','Otro':'other'};
function syncEffects(c){if(!c)return;if(Array.isArray(c.attacks)&&Array.isArray(c.equipment))syncWeapons(c);if(Array.isArray(c.companions))c.companions.forEach(x=>{if(!CREA_KINDS[x.kind]){x.label=x.kind&&x.kind!=='Otro'&&x.kind!=='Familiar'?x.kind:'';x.kind=OLDK[x.kind]||'other'}if(!x.attacks)x.attacks=[];if(!x.hp)x.hp={max:0,current:0}});if(!Array.isArray(c.effects))c.effects=[];if(!Array.isArray(c.companions))c.companions=[];c.effects=c.effects.filter(e=>!e.conc||e.name===c.concentration);
  if(c.form&&!c.effects.some(e=>e.form))c.form=null;
  c.companions=c.companions.filter(x=>!x.conc||x.spell===c.concentration)}
function save(){syncEffects(C());try{localStorage.setItem(KEY,JSON.stringify({chars:S.chars,active:S.active,tab:S.tab}))}catch(e){}}
const C=()=>S.chars.find(c=>c.id===S.active);

/* ================= Reglas ================= */
const pbAt=L=>2+Math.floor((clamp(L,1,20)-1)/4);
const pb=c=>pbAt(+c.level||1);
const M=(c,k)=>mod(c.abilities[k]);
const miOn=e=>e.mi&&(!e.mi.att||e.mi.on);
const wearsArmor=c=>c.equipment.some(e=>e.armor&&ARMORS[e.armor]&&e.equipped);
const miAC=c=>c.equipment.reduce((t,e)=>t+(miOn(e)&&+e.mi.ac&&!(e.mi.noarm&&wearsArmor(c))?+e.mi.ac:0),0);
const miSave=c=>c.equipment.reduce((t,e)=>t+(miOn(e)?+e.mi.sv||0:0),0);
const attuned=c=>c.equipment.filter(e=>e.mi&&e.mi.att&&e.mi.on).length;
const saveB=(c,k)=>M(c,k)+(c.saveProf.includes(k)?pb(c):0)+miSave(c);
const skillB=(c,s)=>{const p=+c.skills[s[0]]||0;return M(c,s[2])+(p===2?2*pb(c):p===1?pb(c):0)};
const featsOf=c=>(c.featKeys||[]).map(k=>FEATS[k]).filter(Boolean);
const init=c=>M(c,'dex')+(+c.initiativeBonus||0)+(featsOf(c).some(f=>f.initPB)?pb(c):0);
const specOf=k=>SPEC[k]||null;
const linOf=(sk,lk)=>{const s=SPEC[sk];return s&&s.lin&&lk?s.lin[lk]||null:null};
function hpPerLevel(sk,feats){return((SPEC[sk]&&SPEC[sk].hpPerLevel)||0)+feats.reduce((t,k)=>t+((FEATS[k]&&FEATS[k].hpPerLevel)||0),0)}
function originRes(sk,lk,feats,L){const out=[],sp=specOf(sk),ln=linOf(sk,lk);
  for(const r of [...(sp&&sp.res||[]),...(ln&&ln.res||[]),...feats.flatMap(k=>FEATS[k]&&FEATS[k].res||[])]){
    if(L<(r.from||1))continue;const max=r.by==='pb'?pbAt(L):r.by;if(max>0)out.push({n:r.n,max,rec:r.rec,pool:false})}
  return out}
function originSpellIds(sk,lk,fromL,toL){const sp=specOf(sk),ln=linOf(sk,lk),ids=[];
  for(const src of [sp&&sp.spells,ln&&ln.spells])if(src)for(const l in src)if(+l>=fromL&&+l<=toL)ids.push(...src[l]);return ids}
function originSpellObj(id,sk,lk){const d=SPBY[id],o=spellObj(d);o.src=(linOf(sk,lk)||specOf(sk)).n||'Especie';
  const res=originRes(sk,lk,[],20).find(r=>r.n.startsWith(d.n));if(res&&d.l>0)o.free=res.n;return o}
const SPEN=Object.fromEntries(SP.map(s=>[s.en,s.id]));
function alwaysIds(ck,sk,from,to){const A=window.ALWAYS_PREPARED,ids=[];
  for(const src of [A.classes[ck],sk&&A.subs[sk]])if(src)for(const l in src)if(+l>=from&&+l<=to)src[l].forEach(n=>SPEN[n]&&ids.push(SPEN[n]));return ids}
const FREE_LINK={'hunters-mark':'Marca del cazador gratis','divine-smite':'Castigo del paladín gratis'};
function addAlways(c,ids){for(const id of ids)if(!c.spells.some(s=>s.ref===id)){const o=spellObj(SPBY[id]);o.src='Siempre preparado';if(FREE_LINK[id])o.free=FREE_LINK[id];c.spells.push(o)}
  c.spells.sort((a,b)=>a.level-b.level||a.name.localeCompare(b.name,'es'))}
function addOriginSpells(c,ids){for(const id of ids)if(!c.spells.some(s=>s.ref===id))c.spells.push(originSpellObj(id,c.speciesKey,c.lineageKey));c.spells.sort((a,b)=>a.level-b.level||a.name.localeCompare(b.name,'es'))}
function upsertRes(c,list,source){for(const r of list){let f=c.features.find(x=>x.name===r.n);
  if(!f){f={name:r.n,source,text:'',uses:{max:0,used:0,recover:''}};c.features.push(f)}
  f.uses.max=r.max;f.uses.recover=r.rec;f.uses.pool=r.pool;f.uses.used=clamp(f.uses.used||0,0,r.max)}}
function addFeature(c,n,t,src){const ex=c.features.find(f=>f.name===n);
  if(ex){if(t&&!ex.text.includes(t))ex.text=(ex.text?ex.text+'\n\n':'')+t}else c.features.push({name:n,source:src,text:t||'',uses:{max:0,used:0,recover:''}})}
const spMod=c=>c.spellcasting.ability?M(c,c.spellcasting.ability):null;
const spDC=c=>8+pb(c)+spMod(c);
const spAtk=c=>pb(c)+spMod(c);
const defOf=c=>CL[c.classKey]||null;
const subOf=(c,key)=>{const d=defOf(c);const k=key===undefined?c.subclassKey:key;return d&&k?d.subs[k]:null};
function casterOf(def,sub){
  if(!def) return null;
  if(def.cast) return{type:def.cast,ab:def.ab,list:def===CL.warlock?'warlock':Object.keys(CL).find(k=>CL[k]===def),cantrips:def.cantrips,prepared:def.prepared};
  if(sub&&sub.cast) return{type:sub.cast,ab:sub.ab,list:sub.list,cantrips:sub.cantrips,prepared:sub.prepared};
  return null}
function slotsFor(type,L){
  const z={slots:Array(9).fill(0),pact:{level:0,total:0}};
  if(type==='full') FULL[L-1].forEach((n,i)=>z.slots[i]=n);
  if(type==='half') FULL[Math.ceil(L/2)-1].forEach((n,i)=>z.slots[i]=n);
  if(type==='third'&&L>=3) FULL[Math.ceil(L/3)-1].forEach((n,i)=>z.slots[i]=n);
  if(type==='pact') z.pact={level:Math.min(5,Math.ceil(L/2)),total:L===1?1:L<11?2:L<17?3:4};
  return z}
function maxSpellLevel(type,L){const z=slotsFor(type,L);let m=0;z.slots.forEach((n,i)=>{if(n)m=i+1});
  if(type==='pact'){m=z.pact.level;if(L>=11)m=L>=17?9:L>=15?8:L>=13?7:6}return m}
function recAt(rec,L){if(typeof rec==='string')return rec;let r='';for(const k of Object.keys(rec).map(Number).sort((a,b)=>a-b))if(L>=k)r=rec[k];return r}
function resourcesFor(def,sub,L,abilities){
  const out=[];
  for(const r of [...(def?def.res:[]),...(sub&&sub.res||[])]){
    let max=0;
    if(r.by) max=r.by[L-1]||0;
    else if(r.mod){ if(L>=(r.from||1)) max=Math.max(1,mod(abilities[r.mod])) }
    if(max>0) out.push({n:r.n,max,rec:recAt(r.rec,L),pool:!!r.pool||max>12})}
  return out}
function infoFor(def,sub,L){const o={};for(const src of [def&&def.info,sub&&sub.info])if(src)for(const k in src){const v=src[k][L-1];if(v!==undefined&&v!=='—'&&v!==0)o[k]=v}return o}

/* ================= Glosario ================= */
const G=window.GLOSS;
const term=(label,k)=>`<button class="term" data-act="gloss" data-k="${k}">${label}</button>`;
function weaponTerms(text){const t=norm(text);return window.WEAPON_TERMS.filter(([k])=>t.includes(norm(k)))}
function showGloss(el){const c=C(),k=el.dataset.k;let t,d,roll='';
  if(k.startsWith('skill:')){const s=SK[k.slice(6)],pv=+c.skills[s[0]]||0;t=s[1];d=window.SKILL_DESC[s[0]]+` Usa ${AB[s[2]][2]}.`;roll=`Tira <b>1d20 ${sgn(skillB(c,s))}</b>${pv===2?' (con pericia)':pv?' (competente)':''}.`}
  else if(k.startsWith('abil:')){const a=k.slice(5);t=AB[a][2];d=window.ABIL_DESC[a];roll=`Prueba de ${AB[a][2]}: <b>1d20 ${sgn(M(c,a))}</b><br>Salvación de ${AB[a][2]}: <b>1d20 ${sgn(saveB(c,a))}</b>${c.saveProf.includes(a)?' (competente)':''}`}
  else if(k.startsWith('wp:')){const w=window.WEAPON_TERMS.find(x=>x[0]===k.slice(3));t=w[1];d=w[2]}
  else if(k.startsWith('cond:')){const x=CONDS.find(x=>x[0]===k.slice(5));t=x[0];d=x[1]}
  else{const g=G[k];if(!g)return;t=g.t;d=g.d;
    if(k==='init')roll=`Tira <b>1d20 ${sgn(init(c))}</b>.`;
    if(k==='spatk'&&spMod(c)!==null)roll=`Tira <b>1d20 ${sgn(spAtk(c))}</b>.`;
    if(k==='conc')roll=`Tu salvación de Constitución: <b>1d20 ${sgn(saveB(c,'con'))}</b>.`}
  openModal(`<h2>${esc(t)}</h2><p>${esc(d)}</p>${roll?`<p class="roll">${roll}</p>`:''}<div class="btns"><button class="b pri" data-act="close-modal">Entendido</button></div>`)}

/* ================= Avisos y modales ================= */
function toast(html,keep){
  const t=document.createElement('div');t.className='toast';
  t.innerHTML=html+'<button class="x" data-act="close-toast" aria-label="Cerrar">×</button>';
  const box=$('#toasts');box.prepend(t);while(box.children.length>3)box.lastChild.remove();
  setTimeout(()=>t.remove(),keep?30000:7000)}
function openModal(h,big){const m=$('#modal');m.innerHTML=`<div class="sheet${big?' big':''}" role="dialog" aria-modal="true">${h}</div>`;m.hidden=false;const f=m.querySelector('input:not([type=hidden]),button');f&&!big&&f.focus()}
function closeModal(){const m=$('#modal');m.hidden=true;m.innerHTML='';W=null;P=null;pendingEco=null;CX=null;NI=null}
let pendingEco=null,restOpen=false;
const INCAP=['Incapacitado','Aturdido','Paralizado','Petrificado','Inconsciente'];
let CX=null,lastCastL=0,effBack=false;
const druidLv=c=>c.classKey==='druid'?c.level:0;
function wsInfo(c){const L=druidLv(c);if(L<2)return null;const moon=c.subclassKey==='moon'&&L>=3;
  return{L,moon,known:L>=8?8:L>=4?6:4,cr:moon?String(L>=18?6:L>=15?5:L>=12?4:L>=9?3:L>=6?2:1):(L>=8?'1':L>=4?'1/2':'1/4'),fly:L>=8,temp:moon?3*L:L,hours:Math.floor(L/2)}}
const wsFeat=c=>c.features.find(f=>f.name==='Forma salvaje'&&f.uses.max>0);
const hitStr=c=>spMod(c)!==null?sgn(spAtk(c)):'tu ataque de conjuro';
const TRACKED=k=>k!=='form';
function creaStats(c,x){const st={ac:x.ac,hpMax:x.hp?+x.hp.max||0:0,speed:x.speed||'',atks:(x.attacks||[]).map(a=>[a.n,a.hit,a.dmg]),traits:x.notes||'',sub:'',rules:CREA_RULES[x.kind]||'',n:1};
  if(x.kind==='primal'){const P=PRIMAL[x.v]||PRIMAL.land,R=c.level,w=M(c,'wis'),[die,b]=P.dmg.split(' + ');
    Object.assign(st,{ac:13+w,hpMax:P.hp[0]+P.hp[1]*R,speed:P.speed,sub:P.n,n:R>=11&&c.classKey==='ranger'?2:1,
      atks:[['Golpe de bestia',hitStr(c),`${die} + ${+b+w} ${x.dtype||P.types[0]}`]],
      traits:`${P.trait}\nVínculo primigenio: suma tu bonificador de competencia (${sgn(pb(c))}) a sus pruebas y salvaciones.${R>=7?'\nEntrenamiento excepcional: al ordenarle una acción, también puede Correr, Destrabarse, Esquivar o Ayudar como acción adicional; su daño puede ser de fuerza.':''}${R>=15?'\nCompartir conjuros: los conjuros que te lances a ti también le afectan si está a 30 pies.':''}`})}
  else if(x.kind==='steed'){const T=STEED_TYPES[x.v]||STEED_TYPES.celestial,L=+x.L||2;
    Object.assign(st,{ac:10+L,hpMax:5+10*L,speed:L>=4?'60 pies, volar 60':'60 pies',sub:`${T[0]} · conjuro de nivel ${L}`,atks:[['Golpe de otro mundo',hitStr(c),`1d8 + ${L} ${T[1]}`]],traits:T[2]})}
  else if(x.kind==='summon'){const S=SUMMONS[x.s]||SUMMONS.beast,L=+x.L||S.L,v=S.vars[x.v]?x.v:Object.keys(S.vars)[0];let hp=S.hp(L,v);if(x.illus)hp=Math.floor(hp/2);
    Object.assign(st,{ac:S.ac(L,v),hpMax:hp,speed:typeof S.speed==='function'?S.speed():S.speed[v],n:Math.max(1,Math.floor(L/2)),
      sub:`${S.n}${Object.keys(S.vars).length>1?` (${S.vars[v]})`:''} · nivel ${L}${x.illus?' · ilusoria':''}`,
      atks:S.atk(v).map(([n,f])=>[n,hitStr(c),f(L)]),traits:(S.traits[v]||'')+(x.illus?'\nIlusoria (Ilusionista): tiene la mitad de los PG normales.':'')})}
  st.track=TRACKED(x.kind);return st}
function creaCard(c,x){const st=creaStats(c,x),isForm=x.kind==='form',active=c.form===x.id;
  if(st.track){x.hp.max=st.hpMax;x.hp.current=clamp(x.hp.current,0,st.hpMax)}
  const pct=st.track&&st.hpMax?clamp(x.hp.current/st.hpMax*100,0,100):0;
  const kindLbl=isForm?({wild:'Forma salvaje',poly:'Polimorfar',other:'Transformación'})[x.via||'other']:(x.label||CREA_KINDS[x.kind].n);
  let formBtn='';if(isForm){const ws=wsInfo(c),f=wsFeat(c);
    if(active)formBtn=`<button class="b pri" data-act="crea-revert">Volver a tu forma</button>`;
    else if(x.via==='wild')formBtn=ws&&f?`<button class="b pri" data-act="crea-transform" data-id="${x.id}" ${featLeft(f)>0?'':'disabled'}>${featLeft(f)>0?`Transformarte (quedan ${featLeft(f)})`:'Sin usos de Forma salvaje'}</button>`:'<p class="hint">La Forma salvaje es del druida a partir de nivel 2.</p>';
    else formBtn=`<button class="b pri" data-act="crea-transform" data-id="${x.id}">Transformarte</button>`}
  return`<div class="compc ${active?'active':''}">
    <div class="comp-top"><span><b>${esc(x.name||'Sin nombre')}</b> <small>${esc(st.sub||kindLbl)}${isForm&&x.cr?` · VD ${esc(x.cr)}`:''}</small></span><button class="b sm" data-act="crea-edit" data-id="${x.id}">Editar</button></div>
    <div class="comp-stats"><span>CA <b>${esc(st.ac===''||st.ac==null?'—':st.ac)}</b></span>${st.speed?`<span>${esc(st.speed)}</span>`:''}${isForm&&st.hpMax?`<span>PG de la bestia <b>${st.hpMax}</b></span>`:''}${x.conc?`<span>ligada a tu concentración</span>`:''}</div>
    ${st.track?`<div class="comp-hp"><span><b>${x.hp.current}</b> / ${st.hpMax} PG</span><div class="bar"><i class="${pct<=25?'low':''}" style="width:${pct}%"></i></div></div>
    <div class="hpctl"><input id="cp-${x.id}" type="number" inputmode="numeric" min="0" placeholder="PG" aria-label="PG de ${esc(x.name)}"><button class="b bad" data-act="crea-hp" data-m="dmg" data-id="${x.id}">Daño</button><button class="b good" data-act="crea-hp" data-m="heal" data-id="${x.id}">Curar</button></div>
    ${x.hp.current<=0?`<p class="hint warn">${x.kind==='other'?'A 0 PG: cae (pregunta al máster qué le pasa).':x.kind==='primal'?'A 0 PG muere. Puedes revivirlo durante la hora siguiente con una acción mágica gastando un espacio de conjuro.':'A 0 PG desaparece.'}</p>`:''}`:''}
    ${st.atks.length?`<ul class="catk">${st.atks.map(a=>`<li><b>${esc(a[0])}</b>${a[1]!==''&&a[1]!=null?` <span>${esc(a[1])}</span>`:''}${a[2]?` · ${esc(a[2])}`:''}</li>`).join('')}</ul>${st.n>1?`<p class="hint">Hace ${st.n} ataques por turno.</p>`:''}`:''}
    ${st.traits||st.rules?`<details><summary>Rasgos y reglas</summary>${st.traits?`<p class="comp-notes">${esc(st.traits).replace(/\n/g,'<br>')}</p>`:''}${st.rules?`<p class="comp-notes hint">${esc(st.rules)}</p>`:''}</details>`:''}
    ${formBtn?`<div class="btns">${formBtn}</div>`:''}</div>`}
function viewCrea(c){const forms=c.companions.filter(x=>x.kind==='form'),others=c.companions.filter(x=>x.kind!=='form'),ws=wsInfo(c),f=wsFeat(c);
  const wsBox=ws?`<section class="card"><h2>${term('Forma salvaje','wildshape')}</h2>
    <div class="kv"><span>Usos</span><b>${f?`${featLeft(f)} / ${f.uses.max}`:'—'}</b></div>
    <div class="kv"><span>Formas que puedes conocer</span><b>${ws.known}</b></div>
    <div class="kv"><span>VD máximo</span><b>${ws.cr}${ws.fly?'':' · sin velocidad de vuelo'}</b></div>
    <div class="kv"><span>Duración</span><b>${ws.hours} h</b></div>
    <div class="kv"><span>PG temporales al transformarte</span><b>${ws.temp}</b></div>
    ${ws.moon?`<div class="kv"><span>CA mínima (Círculo de la Luna)</span><b>${13+M(c,'wis')}</b></div>`:''}
    <p class="hint">Te transformas con una acción adicional y puedes volver igual. Mantienes tus PG, tus dados de golpe, INT, SAB y CAR, tus competencias y tus rasgos de clase; usas la CA, la velocidad, FUE, DES, CON y los ataques de la bestia. ${ws.moon?'Puedes lanzar los conjuros de tu círculo.':'No puedes lanzar conjuros, pero no pierdes la concentración.'} Termina al acabar la duración, si quedas incapacitado o si mueres.</p></section>`:'';
  return`<div class="ed"><div class="ed-head"><h2>Criaturas y formas</h2><button class="b pri" data-act="crea-new">+ Añadir</button></div>
    ${!c.companions.length?`<section class="card"><p>Aquí guardas las fichas extra que usa tu personaje:</p><ul class="kinds">${Object.values(CREA_KINDS).map(k=>`<li><b>${k.n}:</b> ${k.d}</li>`).join('')}</ul></section>`:''}
    <div class="cols crea">${wsBox||forms.length?`<div class="col">${wsBox}${forms.length?`<section class="card"><h2>Formas</h2>${forms.map(x=>creaCard(c,x)).join('')}</section>`:''}</div>`:''}
    ${others.length?`<div class="col"><section class="card"><h2>Compañeros e invocaciones</h2>${others.map(x=>creaCard(c,x)).join('')}</section></div>`:''}</div></div>`}
function creaPick(){openModal(`<h2>¿Qué quieres añadir?</h2><div class="charlist">${Object.entries(CREA_KINDS).map(([k,v])=>`<button class="b opt" data-act="crea-kind" data-k="${k}"><span><b>${v.n}</b><br><small>${v.d}</small></span></button>`).join('')}</div><div class="btns"><button class="b" data-act="close-modal">Cancelar</button></div>`)}
function creaBlank(c,k,o){o=o||{};const x={kind:k,name:'',attacks:[],notes:'',hp:{max:'',current:0}};
  if(k==='form'){x.via=wsInfo(c)?'wild':'poly'}
  if(k==='primal'){x.v='land';x.dtype='perforante';x.name='Compañero primigenio'}
  if(k==='steed'){x.v='celestial';x.L=o.L||2;x.name='Montura';x.spend=!o.cast}
  if(k==='summon'){x.s=o.s||'beast';x.L=o.L||SUMMONS[x.s].L;x.v=Object.keys(SUMMONS[x.s].vars)[0];x.name=SUMMONS[x.s].n.replace(/^Invocar /,'').replace(/^./,m=>m.toUpperCase());x.concNew=!o.cast;x.spend=!o.cast;x.fromCast=o.cast||''}
  if(k==='familiar'){x.name=''}
  return x}
function creaCollect(){if(!CX)return;const g=id=>{const e=$('#'+id);return e?(e.type==='checkbox'?e.checked:e.value):undefined};
  const set=(k,id,num)=>{const v=g(id);if(v!==undefined)CX[k]=num?(v===''?'':+v):v};
  set('name','cx-name');set('v','cx-v');set('s','cx-s');set('L','cx-L',1);set('via','cx-via');set('cr','cx-cr');set('dtype','cx-dtype');set('ac','cx-ac',1);set('speed','cx-speed');set('notes','cx-notes');set('label','cx-label');
  ['illus','spend','concNew'].forEach(k=>{const v=g('cx-'+k);if(v!==undefined)CX[k]=v});
  const mx=g('cx-max');if(mx!==undefined)CX.hp.max=mx===''?'':+mx;const cu=g('cx-cur');if(cu!==undefined&&cu!=='')CX.hp.current=+cu;
  if(CX.attacks)CX.attacks=CX.attacks.map((a,i)=>({n:g('cx-an'+i)??a.n,hit:g('cx-ah'+i)??a.hit,dmg:g('cx-ad'+i)??a.dmg}))}
function creaModal(){const c=C(),x=CX,isNew=!x.id,k=x.kind,ws=wsInfo(c);const f=(lbl,inner)=>`<label class="f"><span>${lbl}</span>${inner}</label>`;
  const inp=(id,val,extra)=>`<input id="${id}" value="${esc(val??'')}" autocomplete="off" ${extra||''}>`;
  const sel=(id,opts,val,rr)=>`<select id="${id}" ${rr?'data-rr="1"':''}>${opts.map(([v,t])=>`<option value="${v}" ${String(val)===String(v)?'selected':''}>${esc(t)}</option>`).join('')}</select>`;
  const lv=from=>Array.from({length:10-from},(_,i)=>[from+i,`Nivel ${from+i}`]);
  const atkRows=()=>`<h3>Ataques</h3>${x.attacks.map((a,i)=>`<div class="atkrow">${inp('cx-an'+i,a.n,'placeholder="Mordisco"')}${inp('cx-ah'+i,a.hit,'placeholder="+4" inputmode="text"')}${inp('cx-ad'+i,a.dmg,'placeholder="2d4 + 2 perforante"')}<button class="b sm sq" data-act="cx-atk-del" data-i="${i}" aria-label="Quitar ataque">✕</button></div>`).join('')}<button class="b sm" data-act="cx-atk-add">+ Ataque</button>`;
  let body='';
  if(k==='form'){const vias=[...(ws?[['wild','Forma salvaje (druida)']]:[]),['poly','Polimorfar o Polimorfar verdadero'],['other','Otra (Cambiar de forma, Formas animales…)']];
    body=`${f('Bestia o forma',inp('cx-name',x.name,'placeholder="Lobo"'))}${f('Cómo te transformas',sel('cx-via',vias,x.via,1))}
      ${x.via==='wild'&&ws?`<p class="hint">Puedes conocer ${ws.known} formas de VD ${ws.cr} como máximo${ws.fly?'':', sin velocidad de vuelo'}. Al transformarte ganas ${ws.temp} PG temporales.</p>`:x.via==='poly'?'<p class="hint">Polimorfar: ganas tantos PG temporales como los PG de la bestia, y la transformación termina cuando se te acaban.</p>':''}
      <div class="effdur3">${f('VD',inp('cx-cr',x.cr,'placeholder="1/4"'))}${f('CA',inp('cx-ac',x.ac,'type="number" inputmode="numeric"'))}${f('PG de la bestia',inp('cx-max',x.hp.max,'type="number" inputmode="numeric"'))}</div>
      ${f('Velocidad',inp('cx-speed',x.speed,'placeholder="40 pies"'))}${atkRows()}${f('Rasgos y sentidos',`<textarea id="cx-notes" rows="3" placeholder="Olfato agudo, Tácticas de manada…">${esc(x.notes)}</textarea>`)}`}
  else if(k==='primal'){const P=PRIMAL[x.v]||PRIMAL.land;if(!P.types.includes(x.dtype))x.dtype=P.types[0];
    body=`${f('Nombre',inp('cx-name',x.name))}${f('Tipo de bestia',sel('cx-v',Object.entries(PRIMAL).map(([v,o])=>[v,o.n]),x.v,1))}${P.types.length>1?f('Tipo de daño',sel('cx-dtype',P.types.map(t=>[t,t]),x.dtype)):''}${c.classKey!=='ranger'?'<p class="hint warn">Este compañero es del explorador Señor de las Bestias; se calcula con tu nivel y tu SAB.</p>':''}`}
  else if(k==='steed'){body=`${f('Nombre',inp('cx-name',x.name))}${f('Tipo',sel('cx-v',Object.entries(STEED_TYPES).map(([v,o])=>[v,o[0]]),x.v,1))}${f('Nivel del conjuro',sel('cx-L',lv(2),x.L,1))}
      ${isNew&&!x.fromCast?`<label class="chk"><input type="checkbox" id="cx-spend" ${x.spend?'checked':''}> Gastar un espacio de nivel ${x.L} (desmárcalo si es gratis, como el Corcel fiel del paladín)</label>`:''}`}
  else if(k==='summon'){const S=SUMMONS[x.s]||SUMMONS.beast;if(+x.L<S.L)x.L=S.L;if(!S.vars[x.v])x.v=Object.keys(S.vars)[0];
    body=`${f('Conjuro',sel('cx-s',Object.entries(SUMMONS).map(([v,o])=>[v,`${o.n} (nivel ${o.L})`]),x.s,1))}<p class="hint">${esc(S.who)}.</p>
      ${Object.keys(S.vars).length>1?f('Variante',sel('cx-v',Object.entries(S.vars),x.v,1)):''}${f('Nivel al que lo lanzas',sel('cx-L',lv(S.L),x.L,1))}${f('Nombre',inp('cx-name',x.name))}
      ${c.subclassKey==='illusionist'&&['beast','fey'].includes(x.s)?`<label class="chk"><input type="checkbox" id="cx-illus" ${x.illus?'checked':''}> Ilusoria (Criaturas fantasmales del Ilusionista: mitad de PG)</label>`:''}
      ${isNew&&!x.fromCast?`<label class="chk"><input type="checkbox" id="cx-concNew" ${x.concNew?'checked':''}> La acabo de invocar: empiezo a concentrarme en ${esc(S.n)}</label><label class="chk"><input type="checkbox" id="cx-spend" ${x.spend?'checked':''}> Gastar un espacio de nivel ${x.L}</label>`:''}`}
  else{body=`${f(k==='familiar'?'Nombre y forma':'Nombre',inp('cx-name',x.name,k==='familiar'?'placeholder="Ceniza (búho)"':''))}${k==='other'?f('Tipo (opcional)',inp('cx-label',x.label,'placeholder="Montura, esqueleto, aliado…"')):''}
      <div class="effdur3">${f('CA',inp('cx-ac',x.ac,'type="number" inputmode="numeric"'))}${f('PG máx.',inp('cx-max',x.hp.max,'type="number" inputmode="numeric" min="1"'))}${isNew?'':f('PG actuales',inp('cx-cur',x.hp.current,'type="number" inputmode="numeric" min="0"'))}</div>
      ${f('Velocidad',inp('cx-speed',x.speed,'placeholder="10 pies, volar 60 pies"'))}${k==='other'?atkRows():''}
      ${f(k==='familiar'?'Rasgos y sentidos':'Rasgos y notas',`<textarea id="cx-notes" rows="3">${esc(x.notes)}</textarea>`)}
      ${k==='familiar'?'<p class="hint">Copia los datos de la forma que elijas (murciélago, gato, rana, halcón, búho, rata, cuervo, araña…). Con el Pacto de la cadena hay formas especiales: diablillo, pseudodragón, quasit, esqueleto, renacuajo de slaad, esfinge de las maravillas, duendecillo o serpiente venenosa.</p>':''}`}
  if(!isNew&&TRACKED(k)&&k!=='other'&&k!=='familiar')body+=`<div class="effdur3">${f('PG actuales',inp('cx-cur',x.hp.current,'type="number" inputmode="numeric" min="0"'))}</div>`;
  if(['primal','steed','summon'].includes(k)){const st=creaStats(c,x);body+=`<div class="preview"><b>Vista previa:</b> CA ${st.ac} · ${st.hpMax} PG · ${esc(st.speed)}<br>${st.atks.map(a=>`${esc(a[0])} ${esc(a[1])} · ${esc(a[2])}`).join('<br>')}${st.n>1?`<br>${st.n} ataques por turno`:''}</div>`}
  openModal(`<h2>${isNew?'Añadir':'Editar'}: ${esc(CREA_KINDS[k].n.toLowerCase())}</h2>${body}<p class="hint" id="cx-msg" role="status"></p>
    <div class="btns"><button class="b pri" data-act="crea-save">Guardar</button>
      ${isNew?'':x.confirm?`<button class="b bad" data-act="crea-del-ok">Sí, borrar</button>`:`<button class="b bad" data-act="crea-del">Borrar</button>${['other','summon','familiar'].includes(k)?'<button class="b" data-act="crea-dup">Duplicar</button>':''}`}
      <button class="b" data-act="crea-cancel">Cancelar</button></div>`)}
function transformInto(c,x,opt){opt=opt||{};const ws=wsInfo(c);endEffects(c,e=>e.form);c.form=x.id;let msg='';
  if(x.via==='wild'&&ws){const t=ws.temp;c.hp.temp=Math.max(c.hp.temp,t);c.effects.push({id:uid(),name:`Forma salvaje: ${x.name}`,m:60*ws.hours,form:true,conc:false});msg=`Ganas ${t} PG temporales. Dura ${ws.hours} h.`}
  else if(x.via==='poly'){const t=+x.hp.max||0;c.hp.temp=Math.max(c.hp.temp,t);
    if(opt.conc)c.effects.push({id:uid(),name:opt.conc,m:60,form:true,conc:true});else c.effects.push({id:uid(),name:`Polimorfado: ${x.name}`,m:60,form:true,conc:false});
    msg=`Ganas ${t} PG temporales; la transformación termina cuando se te acaben.`}
  else{c.effects.push(Object.assign({id:uid(),name:opt.conc||`Transformado: ${x.name}`,form:true,conc:!!opt.conc},opt.conc?{m:60}:{inf:true}))}
  return msg}
const formOf=c=>c.form?c.companions.find(x=>x.id===c.form&&x.kind==='form'):null;
function formAC(c,x){const ws=wsInfo(c),b=+x.ac||0;return x.via==='wild'&&ws&&ws.moon?Math.max(b,13+M(c,'wis')):b}
function formPicker(via,conc){const c=C(),forms=c.companions.filter(x=>x.kind==='form'&&(via==='wild'?x.via==='wild':x.via!=='wild'));
  openModal(`<h2>${via==='wild'?'Forma salvaje':'¿En qué te transformas?'}</h2>
    ${forms.length?`<div class="charlist">${forms.map(x=>`<button class="b opt" data-act="form-go" data-id="${x.id}" data-via="${via}" data-conc="${esc(conc||'')}"><span><b>${esc(x.name)}</b> <small>CA ${formAC(c,x)}${x.hp.max?` · ${x.hp.max} PG`:''}${x.cr?` · VD ${esc(x.cr)}`:''}</small></span></button>`).join('')}</div>`:'<p>Aún no tienes formas guardadas. Créalas en la pestaña Criaturas (+ Añadir → Forma o transformación).</p>'}
    ${via==='wild'?`<div class="charlist"><button class="b opt" data-act="form-go" data-id="" data-via="wild"><span>Gastar el uso sin elegir forma</span></button>${c.companions.some(x=>x.kind==='familiar')||druidLv(c)>=2?`<button class="b opt" data-act="form-familiar"><span><b>Compañero salvaje</b><br><small>Gasta un uso para lanzar Encontrar familiar sin componentes</small></span></button>`:''}</div>`:''}
    <div class="btns"><button class="b" data-act="close-modal">Cancelar</button></div>`)}
const SUMMON_REF={};Object.entries(SUMMONS).forEach(([k,v])=>SUMMON_REF[v.ref]=k);
/* Duraciones: {r:rondas} | {m:minutos} | {inf:true} */
function parseDur(t){t=norm(t||'').replace(/^hasta\s+/,'');let m;
  if(/disipe/.test(t))return{inf:true};
  if((m=t.match(/^(\d+)\s*asaltos?/)))return{r:+m[1]};
  if((m=t.match(/^(\d+)\s*minutos?/)))return +m[1]<=1?{r:10*+m[1]}:{m:+m[1]};
  if((m=t.match(/^(\d+)\s*horas?/)))return{m:60*+m[1]};
  if((m=t.match(/^(\d+)\s*dias?/)))return{m:1440*+m[1]};
  return null}
function fmtEff(e){if(e.r!=null)return`${e.r} ronda${e.r===1?'':'s'}`;if(e.inf)return'hasta que se disipe';const m=e.m||0;
  return m<60?`${m} min`:m<1440?`${+(m/60).toFixed(1)} h`:`${+(m/1440).toFixed(1)} día${m===1440?'':'s'}`}
function addEffect(c,name,d,conc){if(!d)return;c.effects=c.effects.filter(e=>e.name!==name||(!!e.conc!==!!conc));c.effects.push(Object.assign({id:uid(),name,conc:!!conc},d))}
function endEffects(c,pred){const gone=c.effects.filter(pred);if(!gone.length)return[];c.effects=c.effects.filter(e=>!pred(e));if(gone.some(e=>e.conc))c.concentration='';if(gone.some(e=>e.form))c.form=null;return gone.map(e=>e.name)}
function effectsBar(c,inModal){const ce=c.concentration&&c.effects.find(e=>e.conc&&e.name===c.concentration);const pills=[];
  if(!inModal){c.conditions.forEach(n=>pills.push(`<button class="eff cond-pill" data-act="vida"><b>${esc(n)}</b></button>`));
    if(+c.exhaustion)pills.push(`<button class="eff cond-pill" data-act="vida"><b>Agotamiento ${c.exhaustion}</b></button>`)}
  if(c.concentration)pills.push(`<div class="eff conc-pill"><span>${term('Concentrado','conc')} en <b>${esc(c.concentration)}</b>${ce?` · ${fmtEff(ce)}`:''}</span><button class="b sm sq" data-act="end-conc" aria-label="Terminar concentración" title="Terminar concentración">✕</button></div>`);
  c.effects.filter(e=>!e.conc).forEach(e=>pills.push(`<div class="eff"><span><b>${esc(e.name)}</b> · ${fmtEff(e)}</span><button class="b sm sq" data-act="eff-del" data-id="${e.id}" aria-label="Quitar ${esc(e.name)}" title="Quitar">✕</button></div>`));
  return pills.length?`<div class="effrow">${pills.join('')}</div>`:''}const UNDO=[];

/* ================= Render: barra superior ================= */
function pips(kind,a,T,filled){let h='<span class="pips">';for(let k=0;k<T;k++)h+=`<button class="pip${k<filled?' full':''}" data-act="pip" data-kind="${kind}" data-a="${a}" data-i="${k}" aria-label="Casilla ${k+1} de ${T}"></button>`;return h+'</span>'}
function slotLine(c){const parts=[];
  c.slots.forEach((x,i)=>{if(x.total>0)parts.push(`<span class="sl"><small>${i+1}.º</small>${pips('slot',i,x.total,x.total-x.used)}</span>`)});
  if(c.pact.total>0)parts.push(`<span class="sl"><small>Pacto ${c.pact.level}.º</small>${pips('pact',0,c.pact.total,c.pact.total-c.pact.used)}</span>`);
  return parts.length?`<div class="slotline">${term('Espacios','slot')}${parts.join('')}</div>`:''}
const INFO_DESC={'Daño de furia':'Daño extra que sumas a tus ataques con Fuerza mientras estás en furia.',
  'Maestrías con armas':'Cuántas armas puedes usar con su propiedad de maestría. Puedes cambiar una tras un descanso largo.',
  'Dado de inspiración':'El dado que das con Inspiración bárdica. Quien lo tiene puede sumarlo a una tirada d20 que falle.',
  'Dado de superioridad':'El dado que gastas en tus maniobras (Maestro de batalla).',
  'Dado psiónico':'El dado de tu energía psiónica, que gastas en tus poderes de subclase.',
  'Dado de artes marciales':'El daño de tus golpes sin armas y de tus armas de monje (puedes usar DES para atacar con ellas).',
  'Movimiento sin armadura':'Pies que sumas a tu velocidad si no llevas armadura ni escudo.',
  'Ataque furtivo':'Daño extra, una vez por turno, si atacas con un arma sutil o a distancia y tienes ventaja (o un aliado está junto al objetivo).',
  'Metamagias conocidas':'Cuántas opciones de Metamagia conoces para modificar tus conjuros gastando puntos de hechicería.',
  'Invocaciones':'Poderes especiales del brujo. Unos funcionan siempre, otros te dejan lanzar un conjuro sin gastar espacio y otros tienen un coste concreto. Ninguno gasta espacios de conjuro.'};
function openInfo(){const c=C(),info=infoFor(defOf(c),subOf(c),c.level);
  const row=(lbl,k,val,desc)=>`<div class="inforow"><div class="kv"><span>${k?term(esc(lbl),k):esc(lbl)}</span><b>${esc(val)}</b></div>${desc?`<p class="hint">${esc(desc)}</p>`:''}</div>`;
  const list=pre=>c.features.filter(f=>norm(f.name).startsWith(norm(pre))).map(f=>`<details><summary>${esc(f.name.replace(/^[^:]*:\s*/,''))}</summary><p>${esc(f.text||'')}</p></details>`).join('');
  openModal(`<div class="wz-head"><h2>Datos de ${esc(c.name||'tu personaje')}</h2><button class="b sm" data-act="close-modal">Hecho</button></div>
    ${row('Dados de golpe','hd',`${c.hitDice.total-c.hitDice.spent} / ${c.hitDice.total} ${c.hitDice.die}`,`En un descanso corto gastas dados para curarte: tiras el dado y sumas tu CON (${sgn(M(c,'con'))}). Se recuperan en el descanso largo.`)}
    ${row('Bonificador de competencia','pb',sgn(pb(c)),'Lo sumas a todo aquello en lo que eres competente: ataques, habilidades, salvaciones, herramientas y conjuros. Sube con el nivel.')}
    ${row('Percepción pasiva','passive',String(10+skillB(c,SK.perception)),'Lo que notas sin tirar dados. El máster la usa para ver si detectas enemigos escondidos, trampas o a quien te sigue.')}
    ${Object.keys(info).length?`<h3>Datos de clase</h3>${Object.entries(info).map(([k,v])=>row(k,'',String(v),INFO_DESC[k]||'')+(k==='Invocaciones'?list('Invocación'):k==='Metamagias conocidas'?list('Metamagia'):'')).join('')}`:''}`,true)}
function renderTop(){
  const c=C(),fm=formOf(c),pct=c.hp.max?clamp(c.hp.current/c.hp.max*100,0,100):0;
  const sub=[c.species,c.class&&`${c.class} ${c.level}`,c.subclass,c.background].filter(Boolean).join(' · ');
  $('#top').innerHTML=`<div class="wrap"><div class="top-in">
    ${c.story.img?`<button class="avatar-btn" data-act="tab" data-t="pj" aria-label="Ver personaje"><img class="avatar" src="${c.story.img}" alt=""></button>`:''}<div class="whorow"><button class="who" data-act="chars" aria-label="Cambiar de personaje"><div class="nm">${esc(c.name||'Sin nombre')}<span class="caret" aria-hidden="true">▾</span></div><div class="sub">${esc(sub)}</div></button><button class="b sq infob" data-act="info" aria-label="Datos del personaje" title="Datos del personaje"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 10.8v6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="7.6" r="1.3" fill="currentColor"/></svg></button></div>
    <div class="vit">
      <button class="hpbox" data-act="vida" aria-label="Vida y estado: daño, curación y estados"><div class="hpnum"><b>${c.hp.current}</b> / ${c.hp.max}${c.hp.temp?`<em>+${c.hp.temp}</em>`:''}</div><div class="bar"><i class="${pct<=25?'low':''}" style="width:${pct}%"></i></div><small>Puntos de golpe</small></button>
      <button class="stat" data-act="gloss" data-k="ca"><b>${fm?formAC(c,fm):acOf(c)}</b><small>CA</small></button>
      <button class="stat" data-act="gloss" data-k="init"><b>${sgn(init(c))}</b><small>Inic.</small></button>
      <button class="stat" data-act="gloss" data-k="speed"><b>${Math.max(0,(fm&&parseInt(fm.speed)>=0?parseInt(fm.speed):c.speedFt-(armorAuto(c)&&acCalc(c).slow?10:0))-5*(+c.exhaustion||0))}</b><small>pies</small></button>
    </div>
    ${slotLine(c)}
    <div class="ctl quick">
      <div class="menuwrap"><button class="b qbtn icon" data-act="rest-menu" title="Descansar" aria-haspopup="true" aria-expanded="${restOpen}" aria-label="Descansar"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 8h7l-7 9h7M14 4h6l-6 7.5h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        ${restOpen?`<div class="popmenu" role="menu"><button class="b opt" role="menuitem" data-act="short"><span><b>Descanso corto</b><br><small>1 hora · dados de golpe</small></span></button><button class="b opt" role="menuitem" data-act="long"><span><b>Descanso largo</b><br><small>8 horas · lo recuperas todo</small></span></button></div>`:''}</div>
      <button class="b qbtn icon" data-act="diary" title="Diario" aria-label="Diario"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M5 4.5h10a1.5 1.5 0 0 1 1.5 1.5v13.5H6.5A1.5 1.5 0 0 1 5 18z"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M8 8.5h5.5M8 11.5h4"/><path fill="currentColor" d="M19.6 7.2l1.2 1.2-6.3 6.3-1.8.6.6-1.8z"/></svg></button>
      <button class="b qbtn icon" data-act="undo" title="Deshacer" aria-label="Deshacer el último cambio" ${UNDO.length?'':'disabled'}><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 14L4 9l5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <button class="b qbtn insp ${c.inspiration?'on':''}" data-act="insp" aria-pressed="${!!c.inspiration}" title="${c.inspiration?'Tienes inspiración heroica (toca para gastarla)':'Sin inspiración heroica (toca para ganarla)'}" aria-label="Inspiración heroica"><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path class="st" d="M12 2.5c.6 4.6 2.9 6.9 7.5 7.5-4.6.6-6.9 2.9-7.5 7.5-.6-4.6-2.9-6.9-7.5-7.5 4.6-.6 6.9-2.9 7.5-7.5z"/><path class="sm" d="M19 15.5c.25 1.7 1.05 2.5 2.75 2.75-1.7.25-2.5 1.05-2.75 2.75-.25-1.7-1.05-2.5-2.75-2.75 1.7-.25 2.5-1.05 2.75-2.75zM5 15.8c.2 1.3.8 1.9 2.1 2.1-1.3.2-1.9.8-2.1 2.1-.2-1.3-.8-1.9-2.1-2.1 1.3-.2 1.9-.8 2.1-2.1z"/></svg></button>
      <button class="b qbtn inv" data-act="inv" title="Objetos" aria-label="Objetos"><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M9 5.5V4.2A1.7 1.7 0 0 1 10.7 2.5h2.6A1.7 1.7 0 0 1 15 4.2v1.3" fill="none" stroke="#5e3a17" stroke-width="1.6"/><path d="M5 10.5A5 5 0 0 1 10 5.5h4a5 5 0 0 1 5 5V19a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 19z" fill="#9a6532" stroke="#5e3a17" stroke-width="1.2"/><path d="M5.2 11.5h13.6v2.3a1.8 1.8 0 0 1-1.8 1.8H7a1.8 1.8 0 0 1-1.8-1.8z" fill="#b97d43" stroke="#5e3a17" stroke-width="1.1"/><rect x="10.3" y="13.4" width="3.4" height="2.8" rx=".6" fill="#e6bd4f" stroke="#7a5212" stroke-width=".9"/><path d="M8 17.5v2.6M16 17.5v2.6" stroke="#5e3a17" stroke-width="1.2" stroke-linecap="round"/></svg></button>
      <button class="b qbtn money" data-act="money" aria-label="Dinero"><span class="coin" aria-hidden="true"></span><span>${(Math.floor(totalCp(c)/10)/10).toLocaleString('es-ES')} PO</span></button>
    </div>
    ${effectsBar(c)}</div>
    <div class="tabrow"><nav class="tabs">${[['play','Partida'],['combat','Combate'],['crea','Criaturas'],['pj',c.name||'Personaje']].map(([t,n])=>`<button class="${S.tab===t||(t==='pj'&&(S.tab==='edit'||S.tab==='data'))?'on':''}" data-act="tab" data-t="${t}">${esc(n)}</button>`).join('')}</nav>
    <button class="b gear" data-act="settings" aria-label="Ajustes"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1L15 3.3h-4l-.4 2.6a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.4 7.4 0 0 0 1.7 1l.4 2.6h4l.4-2.6a7.4 7.4 0 0 0 1.7-1l2.5 1 2-3.5zM13 15.5A3.5 3.5 0 1 1 13 8.5a3.5 3.5 0 0 1 0 7z" transform="translate(-1 0)"/></svg></button></div></div>`}

/* ================= Render: partida ================= */
function resRow(f,i){
  const u=f.uses,left=u.max-u.used;
  const ctl=u.pool||u.max>12
    ?`<span class="counter"><button class="b sq" data-act="res-d" data-i="${i}" data-d="-1" aria-label="Gastar 1">−</button><input id="res-${i}" type="number" inputmode="numeric" value="${left}" data-act-input="res-set" data-i="${i}" aria-label="Quedan"><span class="of">/ ${u.max}</span><button class="b sq" data-act="res-d" data-i="${i}" data-d="1" aria-label="Recuperar 1">+</button></span>`
    :pips('feat',i,u.max,left);
  return`<div class="slotrow"><span>${esc(f.name)}<br><small>${esc(REC[u.recover]||'sin recuperación automática')}</small></span>${ctl}</div>`}
function deathHTML(c){return c.hp.current<=0?`<div class="death"><div class="dl">A 0 PG: ${term('salvaciones contra muerte','death')}</div>
    <p class="hint">En tu turno tira un d20: 10 o más es éxito, menos es fallo. Un 1 cuenta como dos fallos y un 20 te devuelve 1 PG.</p>
    <div class="dsrow"><span>Éxitos</span>${pips('ds',0,3,c.deathSaves.success)}</div>
    <div class="dsrow"><span>Fallos</span>${pips('df',0,3,c.deathSaves.fail)}</div>
    <div class="btns"><button class="b sm" data-act="nat20">He sacado un 20</button><button class="b sm" data-act="nat1">He sacado un 1</button></div>
    ${c.deathSaves.fail>=3?'<p class="hint warn">Tres fallos: tu personaje muere.</p>':c.deathSaves.success>=3?'<p class="hint">Tres éxitos: estás estable, inconsciente pero sin tirar más.</p>':''}</div>`:''}
function vidaHTML(c){const active=CONDS.filter(x=>c.conditions.includes(x[0]));
  return`<p class="vida-hp">PG <b>${c.hp.current}</b> / ${c.hp.max}${c.hp.temp?` · <span class="tmp">+${c.hp.temp} temporales</span>`:''}</p>
    <div class="hpctl"><input id="hpAmt" type="number" inputmode="numeric" min="0" placeholder="0" aria-label="Cantidad de PG">
      <button class="b bad" data-act="hp" data-m="dmg">Daño</button><button class="b good" data-act="hp" data-m="heal">Curar</button><button class="b" data-act="hp" data-m="temp">PG temporales</button><button class="b sm help" data-act="gloss" data-k="temp" aria-label="Qué son los PG temporales">?</button></div>
    ${deathHTML(c)}
    <h3>Estados</h3><div class="chips">${CONDS.map(([n])=>`<button class="chip ${c.conditions.includes(n)?'on':''}" data-act="cond" data-n="${n}" aria-pressed="${c.conditions.includes(n)}">${n}</button>`).join('')}</div>
    ${active.length?`<ul class="condlist">${active.map(([n,ds])=>`<li><b>${n}:</b> ${esc(ds)}</li>`).join('')}</ul>`:'<p class="hint">Toca un estado para activarlo o quitarlo.</p>'}
    <div class="exh"><span>${term('Agotamiento','exh')}</span><button class="b sq" data-act="exh" data-d="-1" aria-label="Menos">−</button><b>${c.exhaustion}</b><button class="b sq" data-act="exh" data-d="1" aria-label="Más">+</button>
      <small>${c.exhaustion?`Resta ${2*c.exhaustion} a tus tiradas d20 y ${5*c.exhaustion} pies de velocidad${c.exhaustion>=6?' · nivel 6: muerte':''}`:'Ninguno'}</small></div>
    <h3>Efectos</h3>${effectsBar(c,true)||'<p class="hint">Ninguno activo.</p>'}<div class="btns"><button class="b sm" data-act="eff-add" data-from="vida">+ Efecto con duración</button></div>`}
function openVida(){restOpen=false;openModal(`<div class="wz-head"><h2>Vida y estado</h2><button class="b sm" data-act="close-modal">Hecho</button></div><div id="vida-body">${vidaHTML(C())}</div>`,true)}
function refreshVida(){const b=$('#vida-body');if(b&&C())b.innerHTML=vidaHTML(C())}
function viewCombat(c){return`${c.hp.current<=0?`<section class="card">${deathHTML(c)}</section>`:''}${viewTurn(c)}`}
function viewPlay(c){
  const p=pb(c),def=defOf(c),sub=subOf(c);
  // Recursos: espacios, rasgos con usos, consumibles, datos de clase
  const featRes=c.features.map((f,i)=>f.uses.max>0?resRow(f,i):'').join('');
  const cons=c.equipment.map((e,i)=>USABLE.has(e.cat)?`<div class="slotrow"><span>${esc(e.name)}<br><small>${CATN[e.cat]}</small></span><span class="counter"><button class="b sq" data-act="qty" data-i="${i}" data-d="-1" aria-label="Usar uno">−</button><b style="min-width:2rem;text-align:center">${e.qty}</b><button class="b sq" data-act="qty" data-i="${i}" data-d="1" aria-label="Añadir uno">+</button></span></div>`:'').join('');
  const mis=c.equipment.map((e,i)=>e.mi&&+e.mi.ch?`<div class="slotrow"><span>${esc(e.name)}<br><small>${e.mi.rec?`recupera ${esc(e.mi.rec)} al amanecer`:'cargas'}</small></span><span class="counter"><button class="b sq" data-act="mi-ch" data-i="${i}" data-d="1" aria-label="Gastar una carga">−</button><b style="min-width:3.2rem;text-align:center">${e.mi.ch-(+e.mi.used||0)}/${e.mi.ch}</b><button class="b sq" data-act="mi-ch" data-i="${i}" data-d="-1" aria-label="Recuperar una carga">+</button></span></div>`:'').join('');
  const res=`<section class="card"><h2>Recursos</h2>
    ${featRes?`<h3>Rasgos con usos</h3>${featRes}`:''}
    ${cons?`<h3>Consumibles</h3>${cons}`:''}
    ${mis?`<h3>Cargas de objetos mágicos</h3>${mis}`:''}
    ${!featRes&&!cons&&!mis?'<p class="empty">Aquí verás rasgos con usos limitados, consumibles (munición, comida, pociones…) y cargas de objetos mágicos. Añade objetos con el botón de la mochila. Los espacios de conjuro están arriba, bajo tu vida.</p>':''}
    </section>`;
  const abil=`<section class="card"><h2>Características</h2><div class="abil">${ABIL.map(([k,l])=>`<button class="ab" data-act="gloss" data-k="abil:${k}"><span class="lbl">${l}</span>
      <span class="mod">${sgn(M(c,k))}</span><span class="sc">${c.abilities[k]}</span>
      <span class="sv ${c.saveProf.includes(k)?'p':''}">Salv. ${sgn(saveB(c,k))}</span></button>`).join('')}</div>
    <p class="hint" style="margin-top:.6rem">Toca una característica para ver qué tirar. ${term('¿Puntuación o modificador?','mod')} · ${term('¿Qué es una salvación?','save')}</p></section>`;
  const sk=`<section class="card"><h2>Habilidades</h2>${SKILLS.map(s=>{const pv=+c.skills[s[0]]||0;return`<button class="skill" data-act="gloss" data-k="skill:${s[0]}"><span class="dot ${pv?'p':''}">${pv===2?'◆':pv?'●':'○'}</span><span>${s[1]}</span><span class="ak">${AB[s[2]][1]}</span><b>${sgn(skillB(c,s))}</b></button>`}).join('')}
    <p class="hint" style="margin-top:.5rem">Toca una habilidad para ver para qué sirve y qué tirar. ${term('● competente · ◆ pericia','prof')} · ${term('Ventaja y desventaja','adv')}</p></section>`;
  const atk=`<section class="card"><h2>Armas y ataques</h2>${c.attacks.length?`<div class="list">${c.attacks.map((a,i)=>{
      const am=a.ammo&&c.equipment.find(e=>e.id===a.ammo);
      return`<div class="it"><div class="it-head"><span class="it-name">${esc(a.name)}</span><span class="badge">${sgn(+a.atk||0)}</span>${a.dmg?`<span class="badge">${esc(a.dmg)}</span>`:''}
        ${am?`<button class="b sm" data-act="ammo" data-i="${i}" ${am.qty>0?'':'disabled'}>Disparar (quedan ${am.qty})</button>`:''}</div>
      <div class="meta">${esc([a.type,a.notes].filter(Boolean).join(' · '))}</div>
      ${weaponTerms(a.notes).length?`<div class="chips" style="margin-top:.3rem">${weaponTerms(a.notes).map(w=>`<button class="chip" data-act="gloss" data-k="wp:${w[0]}">${esc(w[1])}</button>`).join('')}</div>`:''}</div>`}).join('')}</div>`:'<p class="empty">Sin armas. Añádelas en ⚙ Ajustes → Editar ficha.</p>'}
    <p class="hint" style="margin-top:.5rem">Al atacar tira 1d20 + el primer número contra la CA del enemigo; si impactas, tira el daño. ${term('¿Y si saco un 20?','crit')}</p></section>`;
  let mag='';const scrolls=c.equipment.map((e,i)=>[e,i]).filter(([e])=>e.scroll&&SPBY[e.scroll]&&e.qty>0);
  if(scrolls.length||c.spells.length||c.slots.some(s=>s.total>0)||c.pact.total>0||c.spellcasting.ability){
    const groups={};c.spells.forEach((sp,i)=>{(groups[+sp.level||0]??=[]).push([sp,i])});
    const head=spMod(c)!==null?`<div class="spellhead"><span>Aptitud: <b>${AB[c.spellcasting.ability][2]}</b></span><span>${term('CD de salvación','dc')}: <b>${spDC(c)}</b></span><span>${term('Ataque de conjuro','spatk')}: <b>${sgn(spAtk(c))}</b></span></div>`:'';
    mag=`<section class="card"><div class="card-head"><h2>Magia</h2><button class="b sm" data-act="sp-open">Buscar conjuros</button></div>${head}
      ${Object.keys(groups).sort((a,b)=>a-b).map(L=>`<h3>${+L===0?term('Trucos (no gastan espacio)','cantrip'):`Nivel ${L}`}</h3><div class="list">${groups[L].map(([sp,i])=>{
        const ok=canCast(c,sp);
        const tags=(sp.src?`<span class="tag" title="No cuenta en tu límite de conjuros">${esc(sp.src)}</span>`:'')+(sp.conc?'<button class="tag" data-act="gloss" data-k="cconc">C</button>':'')+(sp.ritual?'<button class="tag" data-act="gloss" data-k="ritual">R</button>':'')+(sp.material?'<button class="tag" data-act="gloss" data-k="comp">M</button>':'');
        const d=sp.ref&&SPBY[sp.ref];
        const desc=sp.desc||(d?d.de+(d.hl?'\n\nA niveles superiores: '+d.hl:''):'');
        return`<div class="it"><div class="it-head"><span class="it-name">${esc(sp.name)}${tags}</span>
          <button class="b sm ${ok?'pri':''}" data-act="cast" data-i="${i}" ${ok?'':'disabled'}>${+sp.level===0?'Usar':ok?'Lanzar':'Sin espacios'}</button></div>
          <div class="meta">${esc([TIME[sp.time]||sp.time,sp.range,sp.dur,sp.material&&`M: ${sp.material}`].filter(Boolean).join(' · '))}</div>
          ${desc?`<details><summary>Qué hace</summary><p>${esc(desc)}</p></details>`:''}</div>`}).join('')}</div>`).join('')}
      ${scrolls.length?`<h3>Pergaminos</h3><div class="list">${scrolls.map(([e,i])=>{const d=SPBY[e.scroll];return`<div class="it"><div class="it-head"><span class="it-name">${esc(d.n)} <span class="tag">×${e.qty}</span></span><button class="b sm" data-act="scroll" data-i="${i}" ${e.qty>0?'':'disabled'}>Lanzar</button></div><div class="meta">${d.l?`Nivel ${d.l}`:'Truco'} · ${esc(TIME[d.t]||d.t)} · CD ${SCROLL_STATS[+d.l||0][0]} · ataque ${sgn(SCROLL_STATS[+d.l||0][1])}</div></div>`}).join('')}</div>`:''}
      ${!c.spells.length&&!scrolls.length?'<p class="empty">Sin conjuros. Pulsa «Buscar conjuros» para añadirlos.</p>':''}</section>`}
  const feats=`<section class="card"><h2>Rasgos y dotes</h2>${c.features.length?`<div class="list">${c.features.map(f=>`<div class="it"><div class="it-head"><span class="it-name">${esc(f.name)}</span>${f.uses.max>0?`<span class="badge">${f.uses.max-f.uses.used}/${f.uses.max}</span>`:''}</div>
      ${f.source?`<div class="meta">${esc(f.source)}</div>`:''}
      ${f.text?`<details><summary>Detalles</summary><p>${esc(f.text)}</p></details>`:''}</div>`).join('')}</div>`:'<p class="empty">Sin rasgos.</p>'}</section>`;
  const tl=toolsList(c);const tools=tl.length?`<section class="card"><h2>Herramientas</h2><div class="list">${tl.map(x=>toolDetail(c,x)).join('')}</div><p class="hint" style="margin-top:.5rem">Al usar una herramienta tiras 1d20 + ese bonificador contra la CD. Si además eres competente en una habilidad que encaje con la prueba (el máster decide cuál), tiras con ventaja.</p></section>`:'';
  return`<div class="cols"><div class="col">${res}</div><div class="col">${abil}${sk}${tools}</div><div class="col">${atk}${mag}${feats}</div></div>`}
function slotOptions(c,L){const o=[];
  if(c.pact.total>0&&c.pact.level>=L)o.push({kind:'pact',level:c.pact.level,avail:c.pact.total-c.pact.used});
  for(let l=L;l<=9;l++){const s=c.slots[l-1];if(s.total>0)o.push({kind:'slot',level:l,avail:s.total-s.used})}
  return o}
const freeUse=(c,sp)=>{if(!sp.free)return null;const f=c.features.find(x=>x.name===sp.free);return f&&f.uses.max-f.uses.used>0?f:null};
const canCast=(c,sp)=>{const L=+sp.level||0;return L===0||sp.ritual||!!freeUse(c,sp)||slotOptions(c,L).some(o=>o.avail>0)};
const slotLabel=o=>o.kind==='pact'?`Espacio de pacto (nivel ${o.level})`:`Espacio de nivel ${o.level}`;
function consume(c,kind,level){if(kind==='pact')c.pact.used=Math.min(c.pact.total,c.pact.used+1);else{const s=c.slots[level-1];s.used=Math.min(s.total,s.used+1)}}
function afterCast(sp,how){
  const c=C();let note='';
  if(pendingEco){spendEco(c,pendingEco);pendingEco=null}
  if(sp.conc){if(c.concentration&&c.concentration!==sp.name)note=`<div class="t-parts">Dejas de concentrarte en ${esc(c.concentration)}.</div>`;c.concentration=sp.name}
  addEffect(c,sp.name,parseDur(sp.dur),sp.conc);
  save();render();
  const extra=spMod(c)!==null?`<div class="t-parts">CD de salvación ${spDC(c)} · ataque de conjuro ${sgn(spAtk(c))}</div>`:'';
  const r=sp.ref||'';let cbtn='';
  if(SUMMON_REF[r])cbtn=`<button class="b sm pri" data-act="crea-from-cast" data-k="summon" data-s="${SUMMON_REF[r]}" data-l="${lastCastL||sp.level}" data-spell="${esc(sp.name)}">Crear la criatura</button>`;
  else if(r==='find-steed')cbtn=`<button class="b sm pri" data-act="crea-from-cast" data-k="steed" data-l="${lastCastL||sp.level}" data-spell="${esc(sp.name)}">Crear la montura</button>`;
  else if(r==='find-familiar')cbtn=c.companions.some(x=>x.kind==='familiar')?'':`<button class="b sm pri" data-act="crea-from-cast" data-k="familiar" data-spell="${esc(sp.name)}">Crear el familiar</button>`;
  else if(['polymorph','true-polymorph','shapechange'].includes(r))cbtn=`<button class="b sm pri" data-act="form-cast" data-spell="${esc(sp.name)}">Elegir forma</button>`;
  toast(`<div class="t-label">Lanzas</div><div class="t-big">${esc(sp.name)}</div><div class="t-parts">${esc(how)}${sp.conc?' · requiere concentración':''}</div>${extra}${note}${cbtn?`<div class="t-actions">${cbtn}</div>`:''}`,!!cbtn)}

/* ================= Tu turno ================= */
// Cuándo se usa cada rasgo con usos (por nombre). 'none' = no aparece en el turno (fuera de combate o ligado a un conjuro).
const WHEN={'Furia':'AA','Tomar aliento':'AA','Oleada de acción':'free','Indómito':'free','Inspiración bárdica':'AA','Canalizar divinidad':'A','Intervención divina':'A',
  'Forma salvaje':'AA','Hechicería innata':'AA','Metabolismo asombroso':'free','Dados de superioridad':'free','Dados de energía psiónica':'free','Mareas del caos':'free',
  'Portento':'free','Luz sanadora (d6)':'AA','Suerte del oscuro':'free','Golpe de suerte':'free','Imposición de manos (PG)':'AA','Manos sanadoras':'A',
  'Revelación celestial':'AA','Arma de aliento':'atk','Vuelo dracónico':'AA','Afinidad con la piedra':'AA','Subidón de adrenalina':'AA','Aguante incansable':'free',
  'Forma grande':'AA','Salto de las nubes':'AA','Quemadura de fuego':'free','Frío de la escarcha':'free','Caída de la colina':'free','Aguante de piedra':'R',
  'Trueno de la tormenta':'R','Puntos de suerte':'free','Incansable (PG temporales)':'A','Puntos de hechicería':'free','Puntos de concentración':'none',
  'Astucia mágica':'none','Contactar con el patrón':'none','Arcano místico':'none','Recuperación arcana':'none','Restauración hechicera':'none'};
const whenOf=f=>f.when||WHEN[f.name]||(/gratis/i.test(f.name)?'none':'free');
// Opciones derivadas de rasgos (gastan un recurso de otro rasgo o no gastan nada)
const DERIVED=[
  {need:'Puntos de concentración',n:'Ráfaga de golpes',t:'AA',cost:'Puntos de concentración',d:'Dos golpes desarmados (1 punto).'},
  {need:'Puntos de concentración',n:'Defensa paciente',t:'AA',cost:'Puntos de concentración',d:'Destrabarse y Esquivar (1 punto).'},
  {need:'Puntos de concentración',n:'Paso del viento',t:'AA',cost:'Puntos de concentración',d:'Destrabarse y Correr, salto doble (1 punto).'},
  {need:'Golpe aturdidor',n:'Golpe aturdidor',t:'free',cost:'Puntos de concentración',d:'Al impactar: salvación de CON o queda aturdido (1 punto).'},
  {need:'Artes marciales',n:'Golpe desarmado (Artes marciales)',t:'AA',d:'Un golpe desarmado extra.'},
  {need:'Acción astuta',n:'Correr, Destrabarse o Esconderse',t:'AA',d:'Acción astuta del pícaro.'},
  {need:'Pacto de la Espada',n:'Invocar arma de pacto',t:'AA',d:'Haces aparecer tu arma de pacto en la mano.'}];
const GENERIC=[['a_dash','Correr'],['a_disengage','Destrabarse'],['a_dodge','Esquivar'],['a_help','Ayudar'],['a_hide','Esconderse'],['a_influence','Influir'],['a_study','Estudiar'],['a_search','Buscar'],['a_ready','Preparar'],['a_utilize','Usar un objeto']];
function attacksPerAction(c){const has=n=>c.features.some(f=>norm(f.name).includes(norm(n)));
  return has('Tres ataques adicionales')?4:has('Dos ataques adicionales')?3:(has('Ataque adicional')||has('Hoja sedienta'))?2:1}
function spendEco(c,k){if(k==='A'){c.turn.a=true;c.turn.atk=0}else if(k==='AA')c.turn.aa=true;else if(k==='R')c.turn.r=true}
const featLeft=f=>f.uses.max-f.uses.used;
function viewTurn(c){
  const incap=c.conditions.find(n=>INCAP.includes(n));const T0=c.turn,T=incap?{a:true,aa:true,r:true,atk:0}:T0,aFree=!T.a,atkOn=aFree||T.atk>0,dis=b=>b?'disabled':'';
  const condNotes=[];if(incap)condNotes.push(`<b>${esc(incap)}:</b> no puedes hacer acciones, acciones adicionales ni reacciones${['Paralizado','Petrificado','Inconsciente'].includes(incap)?' y tu velocidad es 0':''}.`);
  if(c.conditions.includes('Derribado'))condNotes.push('<b>Derribado:</b> levantarte cuesta la mitad de tu velocidad. Tus ataques tienen desventaja; los cuerpo a cuerpo contra ti, ventaja.');
  if(c.conditions.includes('Agarrado'))condNotes.push('<b>Agarrado:</b> tu velocidad es 0. Puedes usar una acción para intentar soltarte.');
  if(c.conditions.includes('Apresado'))condNotes.push('<b>Apresado:</b> velocidad 0, desventaja en tus ataques y en salvaciones de DES; te atacan con ventaja.');
  if(c.conditions.includes('Envenenado'))condNotes.push('<b>Envenenado:</b> desventaja en tiradas de ataque y pruebas de característica.');
  if(c.conditions.includes('Asustado'))condNotes.push('<b>Asustado:</b> desventaja en pruebas y ataques mientras veas la fuente; no puedes acercarte a ella.');
  if(c.conditions.includes('Cegado'))condNotes.push('<b>Cegado:</b> tus ataques tienen desventaja; los ataques contra ti, ventaja.');
  if(c.conditions.includes('Invisible'))condNotes.push('<b>Invisible:</b> tus ataques tienen ventaja; los ataques contra ti, desventaja.');
  if(+c.exhaustion)condNotes.push(`<b>Agotamiento ${c.exhaustion}:</b> −${2*c.exhaustion} a tus tiradas d20.`);
  const row=(name,meta,btn)=>`<div class="trow"><div class="tname">${name}${meta?`<small>${meta}</small>`:''}</div>${btn}</div>`;
  const cols={A:[],AA:[],R:[],free:[]};
  // Atacar
  const nAtk=attacksPerAction(c),fm=formOf(c),ws=wsInfo(c),noSpells=fm&&!(fm.via==='wild'&&ws&&ws.moon);
  if(fm){cols.A.push(`<p class="hint">Transformado en <b>${esc(fm.name)}</b>: usas sus ataques.${noSpells?' No puedes lanzar conjuros.':' Solo puedes lanzar los conjuros de tu círculo.'}</p>`);
    (fm.attacks||[]).forEach((a,i)=>cols.A.push(row(esc(a.n),`${esc(a.hit||'')} · ${esc(a.dmg||'')}`,`<button class="b sm pri" data-act="t-fatk" data-i="${i}" ${dis(!aFree)}>Atacar</button>`)));
    if(fm.via==='wild')cols.AA.push(row('Volver a tu forma','Termina la Forma salvaje',`<button class="b sm" data-act="crea-revert" ${dis(T.aa)}>Usar</button>`))}
  c.companions.forEach(x=>{if(x.kind!=='primal'||x.hp.current<=0)return;const st=creaStats(c,x);
    cols.AA.push(row(`Ordenar a ${esc(x.name)}`,`Golpe de bestia${st.n>1?' ×2':''}: ${esc(st.atks[0][1])} · ${esc(st.atks[0][2])}`,`<button class="b sm" data-act="t-pcmd" data-id="${x.id}" ${dis(T.aa)}>Usar</button>`))});
  if(!fm)c.attacks.forEach((a,i)=>{const am=a.ammo&&c.equipment.find(e=>e.id===a.ammo);const noAmmo=am&&am.qty<=0;
    cols.A.push(row(`${esc(a.name)}`,`${sgn(+a.atk||0)} · ${esc(a.dmg||'')}${am?` · quedan ${am.qty}`:''}`,`<button class="b sm pri" data-act="t-atk" data-i="${i}" ${dis(!atkOn||noAmmo)}>Atacar</button>`))});
  // Conjuros por tiempo de lanzamiento
  if(!noSpells)c.equipment.forEach((e,i)=>{const d=e.scroll&&SPBY[e.scroll];if(!d||e.qty<=0)return;const t=d.t==='BA'?'AA':d.t;if(!['A','AA','R'].includes(t))return;
    const busy=t==='A'?!aFree:t==='AA'?T.aa:T.r;cols[t].push(row(`${esc(d.n)} <span class="tag">pergamino</span>`,`${d.l?'Nivel '+d.l:'Truco'} · quedan ${e.qty}`,`<button class="b sm" data-act="t-scroll" data-i="${i}" data-eco="${t}" ${dis(busy)}>Lanzar</button>`))});
  if(!noSpells)c.spells.forEach((sp,i)=>{const t=sp.time==='BA'?'AA':sp.time;if(!['A','AA','R'].includes(t))return;
    const busy=t==='A'?!aFree:t==='AA'?T.aa:T.r;const ok=canCast(c,sp);
    cols[t].push(row(`${esc(sp.name)}${sp.conc?' <span class="tag">C</span>':''}`,`${+sp.level?'Nivel '+sp.level:'Truco'}`,`<button class="b sm ${ok&&!busy?'pri':''}" data-act="t-cast" data-i="${i}" data-eco="${t}" ${dis(busy||!ok)}>${ok?(+sp.level?'Lanzar':'Usar'):'Sin espacios'}</button>`))});
  // Rasgos con usos
  c.features.forEach((f,i)=>{if(!(f.uses.max>0))return;const w=whenOf(f);if(w==='none')return;const left=featLeft(f);
    const k=w==='atk'?'A':w;const busy=w==='atk'?!atkOn:k==='A'?!aFree:k==='AA'?T.aa:k==='R'?T.r:false;
    cols[k].push(row(esc(f.name),`quedan ${left}/${f.uses.max}${w==='atk'?' · sustituye un ataque':''}`,`<button class="b sm" data-act="t-feat" data-i="${i}" ${dis(busy||left<=0)}>Usar</button>`))});
  // Derivadas
  DERIVED.forEach((o,j)=>{if(!c.features.some(f=>norm(f.name).includes(norm(o.need))))return;
    const src=o.cost&&c.features.find(f=>f.name===o.cost&&f.uses.max>0);if(o.cost&&!src)return;
    const busy=o.t==='A'?!aFree:o.t==='AA'?T.aa:o.t==='R'?T.r:false;
    cols[o.t].push(row(esc(o.n),esc(o.d)+(src?` · quedan ${featLeft(src)}`:''),`<button class="b sm" data-act="t-der" data-j="${j}" ${dis(busy||(src&&featLeft(src)<=0))}>Usar</button>`))});
  // Segunda arma ligera
  const lights=c.attacks.map((a,i)=>[a,i]).filter(([a])=>/ligera/i.test(a.notes||''));
  if(lights.length>=2)lights.forEach(([a,i])=>cols.AA.push(row(`${esc(a.name)} (arma ligera)`,'Ataque extra sin modificador al daño',`<button class="b sm" data-act="t-light" data-i="${i}" ${dis(T.aa)}>Atacar</button>`)));
  // Consumibles
  c.equipment.forEach((e,i)=>{const G=e.gear&&GEAR[e.gear];if(G){if(!G.act||G.act==='lit')return;const k=G.act==='atk'?'A':G.act,busy=G.act==='atk'?!atkOn:k==='A'?!aFree:T.aa;
      cols[k].push(row(esc(e.name),`${G.act==='atk'?'sustituye un ataque · ':''}${G.keep?'':`quedan ${e.qty}`}`,`<button class="b sm" data-act="t-gear" data-i="${i}" ${dis(busy||(!G.keep&&e.qty<=0))}>Usar</button>`));return}
    if(e.cat!=='pocion'&&e.cat!=='consumible')return;const k=e.cat==='pocion'?'AA':'A';const busy=k==='A'?!aFree:T.aa;
    cols[k].push(row(esc(e.name),`quedan ${e.qty}`,`<button class="b sm" data-act="t-item" data-i="${i}" data-eco="${k}" ${dis(busy||e.qty<=0)}>${e.cat==='pocion'?'Beber':'Usar'}</button>`))});
  c.equipment.forEach((e,i)=>{if(!e.mi||!+e.mi.ch||!miOn(e))return;const left=e.mi.ch-(+e.mi.used||0);
    cols.A.push(row(`${esc(e.name)} <span class="tag">mágico</span>`,`quedan ${left}/${e.mi.ch} cargas`,`<button class="b sm" data-act="t-mi" data-i="${i}" ${dis(!aFree||left<=0)}>Usar</button>`))});
  // Acciones de cualquiera
  const generic=`<div class="chips">${GENERIC.map(([k,n])=>`<button class="chip" data-act="t-gen" data-k="${k}" ${dis(!aFree)}>${n}</button>`).join('')}</div>`;
  cols.R.push(row(term('Ataque de oportunidad','a_opp'),'',`<button class="b sm" data-act="t-opp" ${dis(T.r)}>Usar</button>`));
  const pill=(lbl,k,used,extra)=>`<span class="pill ${used?'used':''}">${term(lbl,k)}<b>${extra||(used?'Gastada':'Disponible')}</b></span>`;
  const aState=T.a?(T.atk>0?`Atacando · ${T.atk} más`:'Gastada'):'';
  const col=(k,title,gk,body)=>`<div class="tcol ${k==='A'?(aFree||T.atk>0?'':'off'):k==='AA'?(T.aa?'off':''):k==='R'?(T.r?'off':''):''}"><h3>${term(title,gk)}</h3>${body||'<p class="empty">Nada por ahora.</p>'}</div>`;
  return`<section class="card turn"><div class="card-head"><h2>Tu turno</h2><div class="btns"><button class="b" data-act="t-end">Terminar turno</button></div></div>
    <div class="pills">${pill('Acción','action',T.a,incap?'Bloqueada':aState)}${pill('Acción adicional','bonus',T.aa,incap?'Bloqueada':'')}${pill('Reacción','reaction',T.r,incap?'Bloqueada':'')}</div>
    ${condNotes.length?`<div class="condnotes">${condNotes.map(n=>`<p>${n}</p>`).join('')}</div>`:''}
    <div class="tgrid">
      ${col('A','Acción','action',`${nAtk>1?`<p class="hint">Con la acción de Atacar haces ${nAtk} ataques.</p>`:''}${cols.A.join('')}<h3 class="sub3">Otras acciones</h3>${generic}`)}
      ${col('AA','Acción adicional','bonus',cols.AA.join(''))}
      ${col('R','Reacción','reaction',cols.R.join(''))}
      ${col('free','Sin gastar acción','free',cols.free.join(''))}
    </div></section>`}

/* ================= Render: inventario ================= */
function totalCp(c){return COINS.reduce((t,[k,,v])=>t+(+c.coins[k]||0)*v,0)}
function moneyHTML(c){const tot=totalCp(c);
  return`<div class="coins">${COINS.map(([k,l])=>`<label>${l}<input id="coin-${k}" type="number" inputmode="numeric" min="0" data-path="coins.${k}" data-num="1" value="${c.coins[k]}"></label>`).join('')}</div>
      <p class="total">Total: ${(tot/100).toLocaleString('es-ES',{maximumFractionDigits:2})} PO en monedas</p>
      <h3>Pagar o cobrar</h3>
      <div class="pay"><input id="pay-amt" type="number" inputmode="numeric" min="0" placeholder="0" aria-label="Cantidad"><select id="pay-coin" aria-label="Moneda">${COINS.map(([k,l])=>`<option value="${k}" ${k==='gp'?'selected':''}>${l}</option>`).join('')}</select>
        <button class="b bad" data-act="pay">Pagar</button><button class="b good" data-act="earn">Cobrar</button></div>
      <p class="hint" style="margin-top:.5rem">Al pagar, si no tienes monedas de ese tipo, se cambian monedas mayores y te quedas el cambio. 1 PPt = 10 PO = 20 PE = 100 PP = 1000 PC.</p>`}
function refreshMoney(){const b=$('#money-body');if(b)b.innerHTML=moneyHTML(C())}
function openMoney(){openModal(`<div class="wz-head"><h2>Dinero</h2><button class="b sm" data-act="money-close">Hecho</button></div><div id="money-body">${moneyHTML(C())}</div>`)}
function toolProf(c,T,v){const t=norm(c.proficiencies.tools||'');return t.includes(norm(T.n))||(!!v&&t.includes(norm(v)))||(T.vars&&/instrumento/.test(t)&&T===TOOLS.instrument)||(T===TOOLS.gaming&&/juego/.test(t))}
function toolBonus(c,T,v){const pr=toolProf(c,T,v);return{b:M(c,T.ab)+(pr?pb(c):0),pr}}
function toolsList(c){const out=[],seen=new Set();
  c.equipment.forEach(e=>{const T=e.tool&&TOOLS[e.tool];if(!T)return;const k=e.tool+'|'+(e.tvar||'');if(seen.has(k))return;seen.add(k);out.push({T,v:e.tvar||'',name:e.name,have:true})});
  const t=norm(c.proficiencies.tools||'');Object.entries(TOOLS).forEach(([k,T])=>{if(t.includes(norm(T.n))&&![...seen].some(x=>x.startsWith(k+'|')))out.push({T,v:'',name:T.n,have:false})});
  return out}
function toolDetail(c,x){const {b,pr}=toolBonus(c,x.T,x.v);
  return`<div class="it"><div class="it-head"><span class="it-name">${esc(x.name)}${x.have?'':' <span class="tag">no la llevas</span>'}</span><span class="badge">${AB[x.T.ab][1]} ${sgn(b)}</span></div>
    <div class="meta">${pr?'Competente: sumas tu bonificador de competencia':'Sin competencia: solo tu modificador de '+AB[x.T.ab][2]}</div>
    <details><summary>Usos y fabricación</summary><ul class="tuse">${x.T.use.map(u=>`<li>${esc(u[0])} <b>CD ${u[1]}</b></li>`).join('')}</ul>${x.T.craft?`<p class="meta"><b>Puedes fabricar:</b> ${esc(x.T.craft)}</p>`:''}</details></div>`}
function gearUse(i,eco){const c=C(),e=c.equipment[i],G=GEAR[e.gear];if(!G||(!G.keep&&e.qty<=0))return;const T=c.turn;let extra='';
  if(G.act==='atk'){if(!T.a){T.a=true;T.atk=attacksPerAction(c)-1}else T.atk=Math.max(0,T.atk-1);extra=`Salvación de ${G.save} CD <b>${8+M(c,'dex')+pb(c)}</b> · si falla: ${esc(G.dmg)}.`}
  else if(G.act==='A'||G.act==='AA')spendEco(c,G.act);
  if(!G.keep)e.qty=Math.max(0,e.qty-1);
  if(G.eff)c.effects.push(Object.assign({id:uid(),name:G.eff[0],conc:false},G.eff[1]));
  save();render();refreshInv();
  toast(`<div class="t-label">${G.act==='lit'?'Enciendes':'Usas'}</div><div class="t-big">${esc(e.name)}</div><div class="t-parts">${esc(G.d)}${extra?' '+extra:''}${G.keep?'':` Te quedan ${e.qty}${G.unit?' '+G.unit:''}.`}</div>`)}
function linkGear(c){if(c._gearLinked)return;c._gearLinked=true;
  c.equipment.forEach(e=>{if(e.tool||e.gear)return;const n=norm(e.name);
    const tk=Object.keys(TOOLS).find(k=>n===norm(TOOLS[k].n)||n.startsWith(norm(TOOLS[k].n)));if(tk){e.tool=tk;return}
    const gk=Object.keys(GEAR).find(k=>n===norm(GEAR[k].n)||(k==='rations'&&/^racion/.test(n))||(k==='torch'&&/^antorcha/.test(n))||(k==='waterskin'&&/^odre/.test(n)));if(gk)e.gear=gk})}
const MASTERY_CLS=new Set(['barbarian','fighter','paladin','ranger','rogue']);
function wpnProf(c,W){const t=norm(c.proficiencies.weapons||'');if(t.includes(norm(W.n)))return true;
  if(W.c==='s')return /sencill|marcial/.test(t);if(/marcial/.test(t)){if(/sutil|ligera/.test(t)&&!/sencillas y marciales$/.test(t))return(/sutil/.test(t)&&W.p.includes('sutil'))||(/ligera/.test(t)&&W.p.includes('ligera'));return true}return false}
function wpnCalc(c,a){const W=WEAPONS[a.wpn],str=M(c,'str'),dex=M(c,'dex'),mg=+a.magic||0;
  const mod=W.p.includes('sutil')?Math.max(str,dex):W.r?dex:str,prof=wpnProf(c,W);
  const dm=x=>{const b=mod+mg;return W.d==='1'?`${Math.max(1,1+b)}`:`${x}${b?` ${b>0?'+':'−'} ${Math.abs(b)}`:''}`};
  const props=W.p.map(x=>x).concat(W.th?[`arrojadiza (${W.th})`]:[]).concat(W.am?[`munición (${W.am[1]})`]:[]).concat(W.v?[`versátil (${W.v})`]:[]);
  const notes=[props.join(', ').replace(/^./,m=>m.toUpperCase()),a.mastery?`Maestría: ${MASTERY[W.ms][0].toLowerCase()}`:'',prof?'':'sin competencia'].filter(Boolean).join(' · ');
  return{atk:mod+(prof?pb(c):0)+mg,dmg:dm(W.d)+(W.v?` (${dm(W.v)} a dos manos)`:''),type:W.t,notes,prof}}
function syncWeapons(c){c.attacks.forEach(a=>{if(a.wpn&&WEAPONS[a.wpn])Object.assign(a,(({atk,dmg,type,notes})=>({atk,dmg,type,notes}))(wpnCalc(c,a)))})}
function linkWeapons(c){if(c._wpnLinked)return;c._wpnLinked=true;
  c.attacks.forEach(a=>{if(a.wpn)return;const k=Object.keys(WEAPONS).find(k=>norm(WEAPONS[k].n)===norm(a.name));if(!k)return;
    const r=wpnCalc(c,{wpn:k});if(r.atk===+a.atk&&r.dmg.replace(/[\s−]/g,m=>m==='−'?'-':'')===String(a.dmg).replace(/\s/g,'')){a.wpn=k;a.notes=r.notes;a.type=a.type||r.type}})}
const maxSlotL=c=>Math.max(c.pact.total>0?c.pact.level:0,...c.slots.map((x,i)=>x.total>0?i+1:0));
let SCR=null;
function scrollModal(i,eco){const c=C(),e=c.equipment[i],d=SPBY[e.scroll];if(!d)return;const L=+d.l||0,[dc,at]=SCROLL_STATS[L],onList=(d.c||[]).includes(c.classKey),hard=L>0&&L>maxSlotL(c);SCR={i,eco};
  openModal(`<h2>${esc(e.name)}</h2><p><b>${esc(d.n)}</b> · ${L?`nivel ${L}`:'truco'} · ${esc(TIME[d.t]||d.t)}${d.k?' · concentración':''}</p>
    <p class="hint">Con el pergamino: CD de salvación <b>${dc}</b> y ataque de conjuro <b>${sgn(at)}</b>. No necesitas componentes materiales. Al lanzarlo, el pergamino se gasta.</p>
    ${!onList?`<p class="hint warn">${esc(d.n)} no está en la lista de conjuros de tu clase, así que no puedes lanzarlo desde el pergamino (salvo que el máster diga otra cosa).</p>`
      :hard?`<p class="hint warn">Es de un nivel mayor que los que puedes lanzar: haz una prueba de INT (Conocimiento Arcano) CD <b>${10+L}</b>. Si la fallas, el pergamino se desmorona sin efecto.</p>`:''}
    <details><summary>Qué hace</summary><p>${esc(d.de)}</p></details>
    <div class="btns">${hard&&onList?`<button class="b pri" data-act="scr-cast">La supero: lanzar</button><button class="b bad" data-act="scr-fail">La fallo</button>`:`<button class="b pri" data-act="scr-cast">${onList?'Lanzar':'Lanzarlo igualmente'}</button>`}<button class="b" data-act="close-modal">Cancelar</button></div>`)}
const armorAuto=c=>c.equipment.some(e=>e.armor&&ARMORS[e.armor]);
function acCalc(c){const dex=M(c,'dex'),eq=c.equipment.filter(e=>e.armor&&ARMORS[e.armor]&&e.equipped);
  const body=eq.find(e=>ARMORS[e.armor].t!=='s'),shield=eq.find(e=>ARMORS[e.armor].t==='s');let base,src;
  if(body){const A=ARMORS[body.armor],mg=+body.magic||0;base=A.ac+(A.t==='l'?dex:A.t==='m'?Math.min(dex,2):0)+mg;src=`${body.name} ${A.ac}${A.t==='l'?` + DES (${sgn(dex)})`:A.t==='m'?` + DES (${sgn(Math.min(dex,2))}, máx. +2)`:''}${mg?` + ${mg} mágica`:''}`}
  else{const o=[[10+dex,`Sin armadura: 10 + DES (${sgn(dex)})`]];
    if(c.classKey==='barbarian')o.push([10+dex+M(c,'con'),'Defensa sin armadura: 10 + DES + CON']);
    if(c.classKey==='monk'&&!shield)o.push([10+dex+M(c,'wis'),'Defensa sin armadura: 10 + DES + SAB']);
    if(c.subclassKey==='draconic')o.push([10+dex+M(c,'cha'),'Resistencia dracónica: 10 + DES + CAR']);
    if(c.effects.some(e=>norm(e.name).includes('armadura de mago')))o.push([13+dex,'Armadura de mago: 13 + DES']);
    o.sort((a,b)=>b[0]-a[0]);[base,src]=o[0]}
  let ac=base;if(shield){const mg=+shield.magic||0;ac+=2+mg;src+=` + escudo ${2+mg}`}
  if(+c.acBonus){ac+=+c.acBonus;src+=` + otros ${+c.acBonus}`}
  const mac=miAC(c);if(mac){ac+=mac;src+=` + objetos mágicos ${mac}`}
  const warn=[];const prof=norm(c.proficiencies.armor||''),has=k=>/todas/.test(prof)||prof.includes(k);
  if(body){const A=ARMORS[body.armor];if(!has({l:'liger',m:'intermed',h:'pesad'}[A.t]))warn.push(`No eres competente con armadura ${ARMOR_T[A.t].toLowerCase()}: desventaja en pruebas, salvaciones y ataques de FUE y DES, y no puedes lanzar conjuros.`);
    if(A.str&&c.abilities.str<A.str)warn.push(`Necesitas FUE ${A.str}: tu velocidad baja 10 pies.`);if(A.st)warn.push('Desventaja en pruebas de DES (Sigilo).')}
  if(shield&&!has('escud'))warn.push('No eres competente con escudos: desventaja en pruebas, salvaciones y ataques de FUE y DES, y no puedes lanzar conjuros.');
  return{ac,src,warn,slow:!!(body&&ARMORS[body.armor].str&&c.abilities.str<ARMORS[body.armor].str)}}
const acOf=c=>armorAuto(c)?acCalc(c).ac:(+c.ac||0)+miAC(c);
function linkArmor(c){if(c._armorLinked)return;c._armorLinked=true;if(armorAuto(c))return;
  const cands=Object.entries(ARMORS).sort((a,b)=>b[1].n.length-a[1].n.length),touched=[];let body=false;
  c.equipment.forEach(e=>{if(e.cat!=='armadura')return;const hit=cands.find(([k,A])=>norm(e.name).includes(norm(A.n))||(k==='padded'&&/acolchad/.test(norm(e.name))));
    if(!hit)return;const isBody=hit[1].t!=='s';if(isBody&&body)return;if(isBody)body=true;e.armor=hit[0];e.equipped=true;touched.push(e)});
  if(touched.length&&acCalc(c).ac!==+c.ac)touched.forEach(e=>{delete e.armor;delete e.equipped})}
function healBy(c,n){const was=c.hp.current;c.hp.current=Math.min(c.hp.max,was+n);if(was<=0&&c.hp.current>0){c.deathSaves={success:0,fail:0};c.conditions=c.conditions.filter(x=>x!=='Inconsciente')}return c.hp.current-was}
const diceRange=t=>{const m=String(t).match(/(\d+)d(\d+)\s*\+\s*(\d+)/);return m?[+m[1]+ +m[3],+m[1]*+m[2]+ +m[3]]:[0,999]};
let POT=null,NI=null;
function potModal(i,eco){const c=C(),e=c.equipment[i],P=POTIONS[e.potion];POT={i,eco};
  openModal(`<h2>${esc(e.name)}</h2><p>${esc(P.d)}</p><p class="hint">Beberla o dársela a otra criatura es una acción adicional. Te quedan ${e.qty}.</p>
    ${P.heal?`<label class="f"><span>Tira ${P.heal} y escribe el total</span><input id="pot-roll" type="number" inputmode="numeric" min="1"></label>
      <div class="btns"><button class="b good" data-act="pot-heal">Beber y curarme</button><button class="b" data-act="pot-give">Dársela a otro</button><button class="b" data-act="close-modal">Cancelar</button></div>`
    :`${P.ask?`<label class="f"><span>${esc(P.ask)}</span><input id="pot-ask" autocomplete="off"></label>`:''}
      <div class="btns"><button class="b pri" data-act="pot-fx">Beber</button><button class="b" data-act="pot-give">Dársela a otro</button><button class="b" data-act="close-modal">Cancelar</button></div>`}`);
  const f=$('#pot-roll')||$('#pot-ask');if(f)f.focus()}
function itemModal(){const x=NI,f=(l,h,w)=>`<label class="f ${w||''}"><span>${l}</span>${h}</label>`;
  const c=C(),W=x.wpn&&WEAPONS[x.wpn],hasAmmo=W&&W.am&&c.equipment.find(e=>e.ammoKind===W.am[0]);
  const wGroups=[['s',0,'Sencillas cuerpo a cuerpo'],['s',1,'Sencillas a distancia'],['m',0,'Marciales cuerpo a cuerpo'],['m',1,'Marciales a distancia']];
  const gearOpts=cat=>Object.entries(GEAR).filter(([,g])=>g.cat===cat).map(([k,g])=>`<option value="g:${k}" ${x.gr==='g:'+k?'selected':''}>${esc(g.n)}</option>`).join('');
  const TT=x.gr&&x.gr.startsWith('t:')&&TOOLS[x.gr.slice(2)],GG=x.gr&&x.gr.startsWith('g:')&&GEAR[x.gr.slice(2)];
  const gearDesc=TT?`<p class="hint wide">${AB[TT.ab][2]} · ${TT.use.map(u=>`${esc(u[0])} (CD ${u[1]})`).join(' · ')}${TT.craft?`. Fabrica: ${esc(TT.craft)}`:''}</p>`:GG?`<p class="hint wide">${esc(GG.d)}</p>`:'';
  const extra=x.cat==='herramienta'?f('Herramienta',`<select id="ni-gr" data-ni="1"><option value="">Otra</option><optgroup label="Herramientas de artesano">${Object.entries(TOOLS).filter(([,t])=>t.g==='a').map(([k,t])=>`<option value="t:${k}" ${x.gr==='t:'+k?'selected':''}>${esc(t.n)}</option>`).join('')}</optgroup><optgroup label="Otras herramientas">${Object.entries(TOOLS).filter(([,t])=>t.g==='o').map(([k,t])=>`<option value="t:${k}" ${x.gr==='t:'+k?'selected':''}>${esc(t.n)}</option>`).join('')}</optgroup><optgroup label="Equipo">${gearOpts('herramienta')}</optgroup></select>`,'wide')
      +(TT&&TT.vars?f('Cuál',`<select id="ni-var" data-ni="1">${TT.vars.map(v=>`<option ${x.var===v?'selected':''}>${esc(v)}</option>`).join('')}</select>`,'wide'):'')+gearDesc
    :x.cat==='consumible'||x.cat==='comida'?f(x.cat==='comida'?'Comida y bebida':'Objeto',`<select id="ni-gr" data-ni="1"><option value="">Otro</option>${gearOpts(x.cat)}</select>`,'wide')+gearDesc
    :x.cat==='paquete'?f('Paquete',`<select id="ni-pack" data-ni="1">${Object.entries(PACKS).map(([k,o])=>`<option value="${k}" ${x.pack===k?'selected':''}>${esc(o.n)}</option>`).join('')}</select>`,'wide')
      +`<p class="hint wide">Se añadirá todo su contenido: ${PACKS[x.pack||'explorer'].items.map(([k,q])=>`${GEAR[k]?GEAR[k].n.replace(/ \(días\)/,''):k}${q>1?' ×'+q:''}`).join(', ')}.</p>`
    :x.cat==='arma'?f('Arma',`<select id="ni-wpn" data-ni="1"><option value="">Otra (la añades a mano)</option>${wGroups.map(([cc,r,lbl])=>`<optgroup label="${lbl}">${Object.entries(WEAPONS).filter(([,w])=>w.c===cc&&!!w.r===!!r).map(([k,w])=>`<option value="${k}" ${x.wpn===k?'selected':''}>${esc(w.n)} (${w.d}${w.d==='1'?'':''} ${w.t})</option>`).join('')}</optgroup>`).join('')}</select>`,'wide')
      +(W?f('Bonificador mágico',`<select id="ni-mag" data-ni="1">${[0,1,2,3].map(n=>`<option value="${n}" ${+x.mag===n?'selected':''}>${n?'+'+n:'Ninguno'}</option>`).join('')}</select>`)
        +`<p class="hint wide">${esc(wpnCalc(c,{wpn:x.wpn,magic:x.mag,mastery:x.ms}).notes)}. Maestría: <b>${MASTERY[W.ms][0]}</b> — ${esc(MASTERY[W.ms][1])}</p>`
        +`<label class="chk wide"><input type="checkbox" id="ni-atk" ${x.atk?'checked':''}> Añadirla a mis ataques (bonificador y daño calculados)</label>`
        +(MASTERY_CLS.has(c.classKey)?`<label class="chk wide"><input type="checkbox" id="ni-ms" ${x.ms?'checked':''}> Uso su maestría (${MASTERY[W.ms][0]})</label>`:'')
        +(W.am?(hasAmmo?`<p class="hint wide">Se enlazará con tus ${esc(hasAmmo.name)} (quedan ${hasAmmo.qty}).</p>`:`<label class="chk wide"><input type="checkbox" id="ni-am" ${x.am?'checked':''}> Añadir también ${AMMO[W.am[0]][1]} ${AMMO[W.am[0]][0].toLowerCase()}</label>`):''):'')
    :x.cat==='municion'?f('Munición',`<select id="ni-ak" data-ni="1"><option value="">Otra</option>${Object.entries(AMMO).map(([k,a])=>`<option value="${k}" ${x.ak===k?'selected':''}>${a[0]}</option>`).join('')}</select>`,'wide')
    :x.cat==='pergamino'?f('Conjuro del pergamino',`<input id="ni-spl" list="ni-spl-list" value="${esc(x.spl||'')}" placeholder="Escribe para buscar…" autocomplete="off" data-ni-in="1"><datalist id="ni-spl-list">${SP.map(d=>`<option value="${esc(d.n)}">${d.l?`Nivel ${d.l}`:'Truco'}</option>`).join('')}</datalist>`,'wide')
    :x.cat==='pocion'?f('Tipo de poción',`<select id="ni-pot" data-ni="1">${Object.entries(POTIONS).map(([k,o])=>`<option value="${k}" ${x.pot===k?'selected':''}>${esc(o.n)}${o.heal?` (${o.heal})`:''}</option>`).join('')}</select>`,'wide')+(POTIONS[x.pot]&&POTIONS[x.pot].d?`<p class="hint wide">${esc(POTIONS[x.pot].d)}</p>`:'')
    :x.cat==='armadura'?f('Armadura o escudo',`<select id="ni-arm" data-ni="1"><option value="">Otra (no cambia la CA)</option>${['l','m','h','s'].map(t=>`<optgroup label="${ARMOR_T[t]}">${Object.entries(ARMORS).filter(([,a])=>a.t===t).map(([k,a])=>`<option value="${k}" ${x.arm===k?'selected':''}>${esc(a.n)} (${a.t==='s'?'+2':a.ac+(a.t==='l'?' + DES':a.t==='m'?' + DES máx. 2':'')})</option>`).join('')}</optgroup>`).join('')}</select>`,'wide')
      +(x.arm?f('Bonificador mágico',`<select id="ni-mag" data-ni="1">${[0,1,2,3].map(n=>`<option value="${n}" ${+x.mag===n?'selected':''}>${n?'+'+n:'Ninguno'}</option>`).join('')}</select>`)+`<label class="chk"><input type="checkbox" id="ni-eq" ${x.eq?'checked':''}> La llevo puesta</label>`:''):'';
  openModal(`<h2>Añadir objeto</h2><div class="grid">
      ${f('Tipo',`<select id="ni-cat" data-ni="1">${[...CATS,['paquete','Paquete de equipo (añade su contenido)']].map(([k,n])=>`<option value="${k}" ${x.cat===k?'selected':''}>${n}</option>`).join('')}</select>`)}
      ${f('Cantidad',`<input id="ni-qty" type="number" inputmode="numeric" min="0" value="${esc(x.qty)}">`)}
      ${extra}
      ${f('Nombre',`<input id="ni-name" value="${esc(x.name)}" placeholder="Flechas, ración de viaje, cuerda…" autocomplete="off">`,'wide')}
      ${x.cat==='paquete'?'':`<label class="chk wide"><input type="checkbox" id="ni-mi" data-ni="1" ${x.mi?'checked':''}> Es un objeto mágico</label>`}
      ${x.mi?`<div class="mibox wide">${f('Objeto',`<select id="ni-mip" data-ni="1">${Object.entries(MAGIC).map(([k,o])=>`<option value="${k}" ${x.mip===k?'selected':''}>${esc(o.n)}</option>`).join('')}</select>`)}
        <label class="chk"><input type="checkbox" id="ni-matt" ${x.mi.att?'checked':''}> Requiere sintonización</label>
        <div class="effdur3">${f('+ CA',`<input id="ni-mac" type="number" inputmode="numeric" value="${esc(x.mi.ac||0)}">`)}${f('+ Salvaciones',`<input id="ni-msv" type="number" inputmode="numeric" value="${esc(x.mi.sv||0)}">`)}${f('Cargas',`<input id="ni-mch" type="number" inputmode="numeric" min="0" value="${esc(x.mi.ch||0)}">`)}</div>
        ${f('Recupera al amanecer',`<input id="ni-mrec" value="${esc(x.mi.rec||'')}" placeholder="1d6 + 1, «todas» o vacío">`)}
        ${f('Qué hace',`<textarea id="ni-md" rows="2">${esc(x.mi.d||'')}</textarea>`)}</div>`:''}
      ${f('Notas',`<input id="ni-notes" value="${esc(x.notes)}" placeholder="Opcional">`,'wide')}</div>
    <div class="btns"><button class="b pri" data-act="item-add">Añadir</button><button class="b" data-act="item-cancel">Cancelar</button></div>`)}
function niCollect(){const g=id=>{const e=$('#'+id);return e?(e.type==='checkbox'?e.checked:e.value):undefined};
  const mi=g('ni-mi');if(mi!==undefined){if(mi&&!NI.mi){NI.mi={att:0,ac:0,sv:0,ch:0,rec:'',d:''};NI.mip='other'}if(!mi)NI.mi=null}
  if(NI.mi){const mp=g('ni-mip');if(mp!==undefined)NI.mip=mp;const a=g('ni-matt');if(a!==undefined)NI.mi.att=a?1:0;
    [['mac','ac'],['msv','sv'],['mch','ch']].forEach(([id,k])=>{const v=g('ni-'+id);if(v!==undefined)NI.mi[k]=+v||0});const r=g('ni-mrec');if(r!==undefined)NI.mi.rec=r.trim();const d=g('ni-md');if(d!==undefined)NI.mi.d=d}
  ['name','qty','cat','notes','pot','arm','mag','wpn','ak','spl','gr','var','pack'].forEach(k=>{const v=g('ni-'+k);if(v!==undefined)NI[k]=v});['eq','atk','ms','am'].forEach(k=>{const v=g('ni-'+k);if(v!==undefined)NI[k]=v})}
const splFind=v=>{const k=norm(String(v||'').trim());return k?SP.find(d=>norm(d.n)===k||norm(d.en||'')===k):null};
function niAutoName(){const sd=splFind(NI.spl),TT=NI.gr&&NI.gr.startsWith('t:')&&TOOLS[NI.gr.slice(2)],GG=NI.gr&&NI.gr.startsWith('g:')&&GEAR[NI.gr.slice(2)];const base=TT?(TT.vars?(NI.var||TT.vars[0]):TT.n):GG?GG.n:NI.cat==='arma'&&NI.wpn?WEAPONS[NI.wpn].n+(+NI.mag?` +${NI.mag}`:''):NI.cat==='municion'&&NI.ak?AMMO[NI.ak][0]:NI.cat==='pergamino'&&sd?`Pergamino de ${sd.n.toLowerCase()}`:NI.cat==='pocion'&&NI.pot&&NI.pot!=='other'?POTIONS[NI.pot].n:NI.cat==='armadura'&&NI.arm?ARMORS[NI.arm].n+(+NI.mag?` +${NI.mag}`:''):'';
  if(!NI.name||NI.name===NI.auto)NI.name=base;NI.auto=base}
function invHTML(c){
  const groups=CATS.map(([k,n])=>[k,n,c.equipment.map((e,i)=>[e,i]).filter(([e])=>(e.cat||'otro')===k)]).filter(g=>g[2].length);
  const items=groups.length?groups.map(([k,n,list])=>`<div class="cat-h"><h3>${n}</h3></div><div class="list">${list.map(([e,i])=>`<div class="it"><div class="it-head"><span class="it-name">${esc(e.name)}</span>
      <span class="counter"><button class="b sq" data-act="qty" data-i="${i}" data-d="-1" aria-label="Quitar uno">−</button><b style="min-width:2rem;text-align:center">${e.qty}</b><button class="b sq" data-act="qty" data-i="${i}" data-d="1" aria-label="Añadir uno">+</button></span></div>
      ${e.tool&&TOOLS[e.tool]?(()=>{const T=TOOLS[e.tool],{b,pr}=toolBonus(C(),T,e.tvar);return`<div class="meta">${AB[T.ab][2]} · tu bonificador <b>${sgn(b)}</b>${pr?' (competente)':''} · ${T.use.map(u=>`${esc(u[0])} CD ${u[1]}`).join(' · ')}</div>`})():''}
      ${e.gear&&GEAR[e.gear]?`<div class="meta">${esc(GEAR[e.gear].d)}${GEAR[e.gear].unit?` Quedan ${e.qty} ${GEAR[e.gear].unit}.`:''}</div>${GEAR[e.gear].act?`<div class="btns"><button class="b sm" data-act="gear" data-i="${i}" ${GEAR[e.gear].keep||e.qty>0?'':'disabled'}>${GEAR[e.gear].act==='lit'?'Encender':'Usar'}</button></div>`:''}`:''}
      ${e.mi?`<div class="meta">✦ ${[e.mi.d,!e.mi.d&&+e.mi.ac?`+${e.mi.ac} CA${e.mi.noarm?' (sin armadura ni escudo)':''}`:'',!e.mi.d&&+e.mi.sv?`+${e.mi.sv} salvaciones`:''].filter(Boolean).map(esc).join(' · ')}${e.mi.att&&!e.mi.on?' <b>(sin sintonizar: no funciona)</b>':''}</div>
        <div class="btns">${e.mi.att?`<button class="chip ${e.mi.on?'on':''}" data-act="mi-att" data-i="${i}" aria-pressed="${!!e.mi.on}">${e.mi.on?'Sintonizado':'Sintonizar'}</button>`:''}
        ${+e.mi.ch?`<span class="counter"><button class="b sq" data-act="mi-ch" data-i="${i}" data-d="1" aria-label="Gastar una carga">−</button><b style="min-width:3.2rem;text-align:center">${e.mi.ch-(+e.mi.used||0)}/${e.mi.ch}</b><button class="b sq" data-act="mi-ch" data-i="${i}" data-d="-1" aria-label="Recuperar una carga">+</button></span><small class="muted">cargas${e.mi.rec?` · recupera ${esc(e.mi.rec)} al amanecer`:''}</small>`:''}</div>`:''}
      ${e.weapon&&WEAPONS[e.weapon]?`<div class="meta">${WEAPONS[e.weapon].d} ${WEAPONS[e.weapon].t}${+e.magic?` · +${e.magic} mágica`:''} · ${WEAPONS[e.weapon].c==='s'?'sencilla':'marcial'} · maestría: ${MASTERY[WEAPONS[e.weapon].ms][0].toLowerCase()}</div>`:''}
      ${e.scroll&&SPBY[e.scroll]?`<div class="meta">${SPBY[e.scroll].l?`Conjuro de nivel ${SPBY[e.scroll].l}`:'Truco'} · lánzalo desde Magia (Partida) o desde Combate</div>`:''}
      ${e.armor&&ARMORS[e.armor]?`<div class="meta">${ARMOR_T[ARMORS[e.armor].t]} · ${ARMORS[e.armor].t==='s'?'+2 a la CA':`CA ${ARMORS[e.armor].ac}${ARMORS[e.armor].t==='l'?' + DES':ARMORS[e.armor].t==='m'?' + DES (máx. 2)':''}`}${+e.magic?` · +${e.magic} mágica`:''}${ARMORS[e.armor].str?` · FUE ${ARMORS[e.armor].str}`:''}${ARMORS[e.armor].st?' · desventaja en Sigilo':''}</div>
        <div class="btns"><button class="chip ${e.equipped?'on':''}" data-act="eq" data-i="${i}" aria-pressed="${!!e.equipped}">${e.equipped?(ARMORS[e.armor].t==='s'?'Embrazado':'Puesta'):'Ponérmela'}</button></div>`:''}
      ${e.potion&&POTIONS[e.potion]&&e.potion!=='other'?`<div class="meta">${esc(POTIONS[e.potion].d)}</div><div class="btns"><button class="b sm good" data-act="pot" data-i="${i}" ${e.qty>0?'':'disabled'}>Beber</button></div>`:''}
      ${e.notes?`<div class="meta">${esc(e.notes)}</div>`:''}</div>`).join('')}</div>`).join(''):'<p class="empty">Sin objetos todavía.</p>';
  const A=armorAuto(c)?acCalc(c):null,att=attuned(c),anyAtt=c.equipment.some(e=>e.mi&&e.mi.att);
  const acBox=A?`<div class="acbox"><div><b>CA ${A.ac}</b><small>${esc(A.src)}</small></div>${A.warn.map(w=>`<p class="hint warn">${esc(w)}</p>`).join('')}</div>`:'';
  return`<div class="btns" style="margin-bottom:.4rem"><button class="b sm pri" data-act="item-new">Añadir objeto</button>${anyAtt?`<span class="badge" style="${att>3?'color:var(--bad)':''}">Sintonización ${att}/3</span>`:''}</div>${acBox}${items}
    <p class="hint" style="margin-top:.6rem">La munición, las pociones, la comida y otros consumibles aparecen también en «Recursos», en Partida. Para renombrar o borrar objetos: ⚙ Ajustes → Editar ficha.</p>`}
function refreshInv(){const b=$('#inv-body');if(b)b.innerHTML=invHTML(C())}
function openInv(){openModal(`<div class="wz-head"><h2>Objetos</h2><button class="b sm" data-act="close-modal">Hecho</button></div><div id="inv-body">${invHTML(C())}</div>`,true)}
function viewPj(c){return`<div class="pj">${viewStory(c)}</div>`}
function pay(c,amt,coin){
  let need=amt*COINV[coin];if(need>totalCp(c))return false;
  const cs=c.coins;
  // 1) la misma moneda; 2) monedas menores (de mayor a menor); 3) romper monedas mayores
  const take=k=>{const v=COINV[k];const n=Math.min(cs[k],Math.floor(need/v));cs[k]-=n;need-=n*v};
  take(coin);
  for(const [k,,v] of COINS)if(v<COINV[coin]&&need>0)take(k);
  for(const [k,,v] of [...COINS].reverse())if(v>COINV[coin]&&need>0&&cs[k]>0){
    const n=Math.min(cs[k],Math.ceil(need/v));cs[k]-=n;let change=n*v-need;need=0;
    for(const [k2,,v2] of COINS)if(v2<=COINV[coin]&&change>0){const m=Math.floor(change/v2);cs[k2]+=m;change-=m*v2}}
  if(need>0){for(const [k,,v] of COINS)if(need>0&&cs[k]>0){const n=Math.min(cs[k],Math.ceil(need/v));cs[k]-=n;let ch=n*v-need;need=0;for(const [k2,,v2] of COINS)if(v2<v&&ch>0){const m=Math.floor(ch/v2);cs[k2]+=m;ch-=m*v2}}}
  return true}

/* ================= Render: editor ================= */
const pid=p=>'f-'+p.replace(/\./g,'-');
const inp=(l,p,v,o={})=>`<label class="f ${o.w||''}"><span>${l}</span><input id="${pid(p)}" data-path="${p}" ${o.num?'data-num="1" type="number" inputmode="numeric"':'type="text"'} ${o.rr?'data-rr="1"':''} value="${esc(v)}" ${o.ph?`placeholder="${esc(o.ph)}"`:''}></label>`;
const sel=(l,p,v,opts,o={})=>`<label class="f ${o.w||''}"><span>${l}</span><select id="${pid(p)}" data-path="${p}" ${o.num?'data-num="1"':''} ${o.rr?'data-rr="1"':''}>${opts.map(([k,t])=>`<option value="${esc(k)}" ${String(v)===String(k)?'selected':''}>${esc(t)}</option>`).join('')}</select></label>`;
const ta=(l,p,v,o={})=>`<label class="f ${o.w||'wide'}"><span>${l}</span><textarea id="${pid(p)}" data-path="${p}">${esc(v)}</textarea></label>`;
const chk=(l,p,v)=>`<label class="chk"><input type="checkbox" id="${pid(p)}" data-path="${p}" data-bool="1" ${v?'checked':''}> ${l}</label>`;
const del=(list,i)=>`<button class="b sm bad" data-act="del" data-list="${list}" data-i="${i}">Quitar</button>`;
function viewEdit(c){
  const ab=[['','Ninguna'],...ABIL.map(a=>[a[0],a[2]])];
  const def=defOf(c);
  const subOpts=def?[['','— Sin elegir —'],...Object.entries(def.subs).map(([k,s])=>[k,s.n])]:[['','—']];
  const ammoOpts=[['','Sin munición'],...c.equipment.filter(e=>e.cat==='municion').map(e=>[e.id,e.name])];
  return`<div class="ed">
  <div class="ed-head"><h2>Editar ficha</h2><button class="b pri" data-act="tab" data-t="pj">Hecho</button></div>
  <section class="card"><h2>Identidad</h2><div class="grid">
    ${inp('Nombre','name',c.name)}
    ${sel('Especie','speciesKey',c.speciesKey,[['','Otra (escribe abajo)'],...Object.entries(SPEC).map(([k,d])=>[k,d.n])],{rr:1})}
    ${c.speciesKey&&SPEC[c.speciesKey].lin?sel(SPEC[c.speciesKey].linLabel||'Linaje','lineageKey',c.lineageKey,[['','— Sin elegir —'],...Object.entries(SPEC[c.speciesKey].lin).map(([k,d])=>[k,d.n])],{rr:1}):''}
    ${c.speciesKey?'':inp('Especie (texto)','species',c.species)}
    ${sel('Trasfondo','backgroundKey',c.backgroundKey,[['','Otro (escribe abajo)'],...Object.entries(BG).map(([k,d])=>[k,d.n])],{rr:1})}
    ${c.backgroundKey?'':inp('Trasfondo (texto)','background',c.background)}
    ${sel('Clase','classKey',c.classKey,[['','Otra (escribe abajo)'],...Object.entries(CL).map(([k,d])=>[k,d.n])],{rr:1})}
    ${c.classKey?sel('Subclase','subclassKey',c.subclassKey,subOpts,{rr:1}):inp('Clase (texto)','class',c.class)}
    ${inp('Nivel','level',c.level,{num:1,rr:1})}${inp('Experiencia','xp',c.xp,{num:1})}
  </div><p class="hint">Para subir de nivel usa el botón «Subir de nivel»: actualiza PG, rasgos, recursos y conjuros. Cambiar el nivel, la especie o el trasfondo aquí solo cambia los datos; para que la app añada sola sus rasgos y conjuros, pulsa «Aplicar rasgos de especie».</p><div class="btns"><button class="b sm" data-act="apply-origin" ${c.speciesKey?'':'disabled'}>Aplicar rasgos de especie</button></div></section>
  <section class="card"><h2>Características y salvaciones</h2><div class="grid">
    ${ABIL.map(([k,,n])=>`<div class="f">${inp(`${n} (${sgn(M(c,k))})`,`abilities.${k}`,c.abilities[k],{num:1,rr:1})}<button class="chip ${c.saveProf.includes(k)?'on':''}" data-act="tog-save" data-k="${k}" style="margin-top:.3rem">Salvación ${c.saveProf.includes(k)?'competente':'normal'}</button></div>`).join('')}
  </div></section>
  <section class="card"><h2>Habilidades</h2><div class="skillgrid">${SKILLS.map(s=>sel(`${s[1]} (${AB[s[2]][1]})`,`skills.${s[0]}`,+c.skills[s[0]]||0,[[0,'—'],[1,'Competente'],[2,'Pericia']],{num:1})).join('')}</div></section>
  <section class="card"><h2>Combate</h2><div class="grid">
    ${armorAuto(c)?`<label class="f"><span>CA (calculada)</span><input value="${acOf(c)}" readonly title="Se calcula con la armadura y el escudo que llevas puestos"></label>${inp('Otros bonificadores a la CA','acBonus',c.acBonus||0,{num:1})}`:inp('CA','ac',c.ac,{num:1})}${inp('Velocidad (pies)','speedFt',c.speedFt,{num:1})}${inp('Tamaño','size',c.size)}${inp('Extra a iniciativa','initiativeBonus',c.initiativeBonus,{num:1})}
    ${inp('PG máximos','hp.max',c.hp.max,{num:1})}${inp('PG actuales','hp.current',c.hp.current,{num:1})}${inp('Dado de golpe','hitDice.die',c.hitDice.die,{ph:'d8'})}${inp('Nº dados de golpe','hitDice.total',c.hitDice.total,{num:1})}
  </div></section>
  <section class="card"><h2>Armas y ataques</h2><p class="hint">Si el arma usa munición (arco, ballesta…), enlázala a un objeto de munición del inventario y en la partida podrás descontarla con un toque.</p><div class="stack">${c.attacks.map((a,i)=>`<div class="row-ed">
    ${inp('Nombre',`attacks.${i}.name`,a.name)}${inp('Bonif. ataque',`attacks.${i}.atk`,a.atk,{num:1})}${inp('Daño',`attacks.${i}.dmg`,a.dmg,{ph:'1d6+2'})}${inp('Tipo de daño',`attacks.${i}.type`,a.type)}${inp('Propiedades',`attacks.${i}.notes`,a.notes)}
    ${sel('Munición',`attacks.${i}.ammo`,a.ammo,ammoOpts)}${del('attacks',i)}</div>`).join('')}
    <div><button class="b" data-act="add" data-list="attacks">Añadir arma</button></div></div></section>
  <section class="card"><div class="card-head"><h2>Magia</h2><button class="b sm pri" data-act="sp-open">Buscar conjuros</button></div><div class="grid">
    ${sel('Aptitud mágica','spellcasting.ability',c.spellcasting.ability,ab,{rr:1})}
    ${inp('Nivel de pacto (brujo)','pact.level',c.pact.level,{num:1})}${inp('Espacios de pacto','pact.total',c.pact.total,{num:1})}
    ${c.slots.map((s,i)=>inp(`Espacios nivel ${i+1}`,`slots.${i}.total`,s.total,{num:1})).join('')}
  </div>
  <h3>Conjuros</h3><p class="hint">Los conjuros añadidos desde el buscador traen sus datos. También puedes crear uno a mano.</p><div class="stack">${c.spells.map((sp,i)=>`<div class="row-ed">
    ${inp('Nivel (0 = truco)',`spells.${i}.level`,sp.level,{num:1})}${inp('Nombre',`spells.${i}.name`,sp.name)}
    ${sel('Tiempo',`spells.${i}.time`,sp.time,[['A','Acción'],['AA','Acción adicional'],['R','Reacción'],['1 minuto','1 minuto'],['10 minutos','10 minutos'],['1 hora','1 hora'],['8 horas','8 horas']])}
    ${inp('Alcance',`spells.${i}.range`,sp.range)}${inp('Duración',`spells.${i}.dur`,sp.dur)}${inp('Material',`spells.${i}.material`,sp.material)}
    <div class="f">${chk('Concentración',`spells.${i}.conc`,sp.conc)}${chk('Ritual',`spells.${i}.ritual`,sp.ritual)}</div>
    ${ta(sp.ref?'Notas propias (si lo dejas vacío se muestra la descripción del conjuro)':'Qué hace',`spells.${i}.desc`,sp.desc)}${del('spells',i)}</div>`).join('')}
    <div class="btns"><button class="b" data-act="add" data-list="spells">Añadir conjuro a mano</button></div></div></section>
  <section class="card"><h2>Rasgos, dotes y recursos limitados</h2><p class="hint">Si un rasgo tiene usos (p. ej. «2 veces por descanso largo»), pon los usos y cuándo se recuperan; aparecerá en «Recursos».</p>
    <div class="stack">${c.features.map((f,i)=>`<div class="row-ed">
    ${inp('Nombre',`features.${i}.name`,f.name)}${inp('Origen',`features.${i}.source`,f.source,{ph:'Clase, especie, dote…'})}${inp('Usos (0 = ilimitado)',`features.${i}.uses.max`,f.uses.max,{num:1})}
    ${sel('Se recupera con',`features.${i}.uses.recover`,f.uses.recover,[['','—'],['corto','Descanso corto o largo'],['corto1','1 en corto, todos en largo'],['largo','Descanso largo']])}
    ${sel('Cuándo se usa',`features.${i}.when`,f.when||'',[['','Automático'],['A','Acción'],['AA','Acción adicional'],['R','Reacción'],['free','Sin gastar acción'],['atk','Sustituye un ataque'],['none','Fuera de combate']])}
    ${ta('Descripción',`features.${i}.text`,f.text)}${del('features',i)}</div>`).join('')}
    <div><button class="b" data-act="add" data-list="features">Añadir rasgo</button></div></div></section>
  <section class="card"><h2>Objetos</h2><div class="stack">${c.equipment.map((e,i)=>`<div class="row-ed">
    ${inp('Objeto',`equipment.${i}.name`,e.name)}${inp('Cantidad',`equipment.${i}.qty`,e.qty,{num:1})}${sel('Tipo',`equipment.${i}.cat`,e.cat,CATS)}${inp('Notas',`equipment.${i}.notes`,e.notes)}${del('equipment',i)}</div>`).join('')}
    <div><button class="b" data-act="add" data-list="equipment">Añadir objeto</button></div></div>
    <h3>Competencias e idiomas</h3>
    <div class="grid">${inp('Armaduras','proficiencies.armor',c.proficiencies.armor)}${inp('Armas','proficiencies.weapons',c.proficiencies.weapons)}${inp('Herramientas','proficiencies.tools',c.proficiencies.tools)}${inp('Idiomas','languages',c.languages)}</div></section>
  </div>`}

/* ================= Render: personajes ================= */
function example(){const e=blank();delete e.id;e.attacks=[NEW.attacks()];e.spells=[NEW.spells()];e.features=[NEW.features()];e.equipment=[NEW.equipment()];delete e.equipment[0].id;return e}
function prompt4Claude(){return`Convierte la ficha de personaje de quinta edición (reglas de 2024) que te adjunto a JSON para mi app de fichas. Usa exactamente esta estructura y estas claves:
- classKey: una de ${Object.keys(CL).join(', ')}; subclassKey: la subclase si la tiene (déjala vacía si no).
- abilities: puntuaciones (no modificadores). saveProf: salvaciones con competencia (str, dex, con, int, wis, cha).
- skills: 1 = competencia, 2 = pericia. Claves: ${SKILLS.map(s=>s[0]).join(', ')}.
- slots: 9 entradas, una por nivel de conjuro (total = espacios). Los espacios de brujo van en "pact" (level y total), no en "slots".
- spells: time "A" acción, "AA" acción adicional, "R" reacción u otro texto. Pon en "ref" el nombre en inglés del conjuro en minúsculas y con guiones (p. ej. "hellish-rebuke") para enlazarlo con la base de datos.
- attacks.atk: bonificador de ataque como número; dmg: fórmula como "1d6+2".
- equipment.cat: arma, armadura, municion, pocion, comida, consumible, herramienta, tesoro u otro.
- features: rasgos de especie y clase y dotes; uses.max y uses.recover ("corto", "corto1" o "largo") solo si tienen usos limitados.
- Lo que no aparezca en la ficha, déjalo con el valor por defecto. Devuelve solo el JSON.

${JSON.stringify(example(),null,2)}`}
let charMenu='';
function charsHTML(){
  return`<div class="wz-head"><h2>Personajes</h2><button class="b sm" data-act="close-modal">Cerrar</button></div>
  <div class="charlist">${S.chars.map(x=>`<div class="charrow ${x.id===S.active?'on':''}">
      <button class="charpick" data-act="use" data-id="${x.id}">${x.story&&x.story.img?`<img class="avatar sm" src="${x.story.img}" alt="">`:'<span class="avatar sm ph" aria-hidden="true"></span>'}<span><b>${esc(x.name||'Sin nombre')}</b><small>${esc([x.species,x.class&&`${x.class} ${x.level}`].filter(Boolean).join(' · ')||'Sin datos')}${x.id===S.active?' · en uso':''}</small></span></button>
      <button class="b sm sq" data-act="char-menu" data-id="${x.id}" aria-label="Más opciones de ${esc(x.name)}" aria-expanded="${charMenu===x.id}">⋯</button>
      ${charMenu===x.id?`<div class="charmenu"><button class="b sm" data-act="dup" data-id="${x.id}">Duplicar</button><button class="b sm bad" data-act="delchar" data-id="${x.id}">Borrar</button></div>`:''}
    </div>`).join('')}</div>
  <div class="btns"><button class="b pri" data-act="create">Crear personaje paso a paso</button><button class="b" data-act="newchar">Crear ficha vacía</button></div>`}
function openChars(){openModal(charsHTML())}
function viewData(c){
  return`<div class="ed">
  <div class="ed-head"><h2>${c?'Copia de seguridad':'Importar ficha'}</h2><button class="b pri" data-act="tab" data-t="${c?'pj':'play'}">${c?'Hecho':'Volver'}</button></div>
  <p class="hint">Las fichas se guardan solo en este dispositivo. Exporta de vez en cuando para no perderlas o para pasarlas a otro dispositivo.</p>
  <section class="card"><h2>Importar</h2>
    <p class="hint">Pega el JSON de una ficha (o de varias) o elige un archivo .json. Para pasar una ficha en papel: escanéala, copia las instrucciones de abajo y pásaselas a Claude junto al escaneo; pega aquí lo que te devuelva.</p>
    <div class="btns" style="margin-bottom:.6rem"><button class="b" data-act="copy-prompt">Copiar instrucciones para Claude</button><label class="b" for="imp-file">Elegir archivo .json</label><input id="imp-file" type="file" accept=".json,application/json,text/plain" hidden></div>
    <textarea class="code" id="imp-text" placeholder='{"name": "…", "classKey": "…", …}'></textarea>
    <div class="btns" style="margin-top:.6rem"><button class="b pri" data-act="import">Importar</button></div><p class="hint" id="imp-msg" role="status"></p></section>
  ${c?`<section class="card"><h2>Exportar</h2>
    <p class="hint">Abajo tienes la ficha de ${esc(c.name)}. «Copiar todas las fichas» guarda todos tus personajes de una vez.</p>
    <textarea class="code" id="exp-text" readonly>${esc(JSON.stringify(c,null,2))}</textarea>
    <div class="btns" style="margin-top:.6rem"><button class="b" data-act="copy-exp">Copiar JSON</button><button class="b" data-act="copy-all">Copiar todas las fichas</button></div></section>`:''}
  </div>`}
const CREDITS=`<p>Fichas 5e es contenido de fans no oficial permitido bajo la Fan Content Policy. No aprobado ni respaldado por Wizards. Partes de los materiales usados son propiedad de Wizards of the Coast. ©Wizards of the Coast LLC.</p><p>Esta app incluye material del System Reference Document 5.2 («SRD 5.2») de Wizards of the Coast LLC, disponible en https://www.dndbeyond.com/srd, bajo licencia Creative Commons Attribution 4.0 International (https://creativecommons.org/licenses/by/4.0/legalcode). Los textos de los conjuros están traducidos y adaptados al castellano. Los resúmenes de rasgos de clase y subclase están escritos para esta app; consulta el Manual del Jugador para el texto completo.</p>`;
const ALIGN=['','Legal bueno','Neutral bueno','Caótico bueno','Legal neutral','Neutral','Caótico neutral','Legal malvado','Neutral malvado','Caótico malvado'];
function viewStory(c){const st=c.story;
  return`<div class="story">
  <section class="card portrait-card"><h2>Retrato</h2>
    <div class="portrait">${st.img?`<img src="${st.img}" alt="Retrato de ${esc(c.name)}">`:`<div class="portrait-empty">Sin imagen</div>`}</div>
    <div class="btns"><label class="b pri" for="story-img">${st.img?'Cambiar imagen':'Elegir imagen'}</label><input id="story-img" type="file" accept="image/*" hidden>${st.img?'<button class="b bad" data-act="img-del">Quitar</button>':''}</div>
    <p class="hint">Desde la galería o la cámara. Se guarda reducida en este dispositivo.</p>
    <div class="grid">${sel('Alineamiento','story.alignment',st.alignment,ALIGN.map(a=>[a,a||'Sin especificar']))}${inp('Edad','story.age',st.age,{ph:'Ej. 23 años'})}</div></section>
  <section class="card"><h2>Personalidad</h2>
    <label class="f wide"><span>Apariencia</span><textarea id="f-story-appearance" class="notes" data-path="story.appearance" placeholder="Altura, rasgos, cicatrices, ropa, cómo se mueve…">${esc(st.appearance)}</textarea></label>
    <label class="f wide" style="margin-top:.7rem"><span>Personalidad</span><textarea id="f-story-personality" class="notes" data-path="story.personality" placeholder="Cómo es, qué valora, a quién o qué está unido, sus miedos y defectos…">${esc(st.personality)}</textarea></label></section>
  <section class="card story-history"><h2>Historia</h2>
    <textarea id="f-story-history" class="notes tall" data-path="story.history" placeholder="De dónde viene, qué le ha pasado y por qué se ha hecho aventurero…">${esc(st.history)}</textarea></section>
  </div>`}
function loadPortrait(file){
  if(!file||!/^image\//.test(file.type)){toast('<div class="t-parts">Ese archivo no es una imagen.</div>');return}
  const url=URL.createObjectURL(file),img=new Image();
  img.onload=()=>{const max=900,k=Math.min(1,max/Math.max(img.width,img.height));const cv=document.createElement('canvas');cv.width=Math.round(img.width*k);cv.height=Math.round(img.height*k);
    cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);URL.revokeObjectURL(url);
    const c=C(),prev=c.story.img;c.story.img=cv.toDataURL('image/jpeg',0.82);
    try{localStorage.setItem(KEY,JSON.stringify({chars:S.chars,active:S.active,tab:S.tab}))}catch(e){c.story.img=prev;toast('<div class="t-label">No cabe la imagen</div><div class="t-parts">El almacenamiento del dispositivo está lleno. Prueba con otra imagen o quita retratos de otros personajes.</div>');return}
    render()};
  img.onerror=()=>{URL.revokeObjectURL(url);toast('<div class="t-parts">No se ha podido abrir la imagen.</div>')};
  img.src=url}
function renderView(){const c=C();$('#view').innerHTML=S.tab==='edit'?viewEdit(c):S.tab==='data'?viewData(c):S.tab==='pj'?viewPj(c):S.tab==='crea'?viewCrea(c):S.tab==='combat'?viewCombat(c):viewPlay(c)}
function applyTheme(){const k=(C()||{}).classKey||'',r=document.documentElement;
  if(k)r.dataset.class=k;else delete r.dataset.class;
  const bg=getComputedStyle(r).getPropertyValue('--surface').trim();document.querySelectorAll('meta[name="theme-color"]').forEach(m=>m.setAttribute('content',bg||'#ffffff'))}
function render(){applyTheme();if(!C()){renderWelcome();return}renderTop();renderView();refreshVida()}
function renderWelcome(){
  $('#top').innerHTML='';
  if(S.tab==='data'){$('#view').innerHTML=viewData(null);return}
  $('#view').innerHTML=`<section class="card welcome"><h1>Fichas 5e</h1>
    <p>Tu ficha de personaje interactiva para partidas de 5.ª edición (reglas de 2024). Lleva la cuenta de vida, conjuros, recursos, dinero y objetos mientras juegas con tus dados de siempre.</p>
    <p class="hint">Las fichas se guardan solo en este dispositivo.</p>
    <div class="btns"><button class="b pri" data-act="create">Crear personaje</button><button class="b" data-act="tab" data-t="data">Importar ficha</button></div>
    <p class="hint">¿Tienes una copia de seguridad o una ficha exportada desde otro dispositivo? Usa «Importar ficha».</p></section>`}

/* ================= Buscador de conjuros ================= */
let P=null; // {target:'edit'|'wizard', q, lvl, cls, open, list(ref a array de conjuros), max}
const CLASS_OPTS=()=>[['','Todas las clases'],...Object.entries(CL).filter(([k,d])=>d.cast).map(([k,d])=>[k,d.n])];
function spellObj(d){return{level:d.l,name:d.n,time:d.t,range:d.r,dur:d.d,conc:d.k,ritual:d.ri,material:d.m,desc:'',ref:d.id}}
function spFiltered(){
  const q=norm(P.q);
  return SP.filter(s=>(P.cls===''||s.c.includes(P.cls))&&(P.lvl===''||s.l===+P.lvl)&&(P.max==null||s.l<=P.max)&&(P.min==null||s.l>=P.min)&&(!q||norm(s.n).includes(q)||norm(s.en).includes(q)))}
function spResultsHTML(){
  const all=spFiltered(),list=all.slice(0,80),mine=new Set(P.list.map(s=>s.ref).filter(Boolean));
  return`<p class="sp-count">${all.length} conjuro${all.length===1?'':'s'}${all.length>80?' · mostrando 80, afina la búsqueda':''}</p>`+list.map(s=>{
    const have=mine.has(s.id),open=P.open===s.id;
    return`<div class="sp-row"><div class="it-head"><button class="b sm" data-act="sp-det" data-id="${s.id}" aria-expanded="${open}" style="border:0;padding:0;background:none;text-align:left;flex:1 1 auto;min-width:0;display:block">
        <span class="it-name">${esc(s.n)}</span>${s.k?'<span class="tag">C</span>':''}${s.ri?'<span class="tag">R</span>':''} <span class="en">${esc(s.en)}</span>
        <span class="meta" style="display:block">${s.l===0?'Truco':'Nivel '+s.l} · ${esc(s.s)} · ${esc(TIME[s.t]||s.t)} · ${esc(s.r)} · ${esc(s.d)}</span></button>
      <button class="b sm ${have?'bad':'pri'}" data-act="sp-tog" data-id="${s.id}">${have?'Quitar':'Añadir'}</button></div>
      ${open?`<div class="sp-det"><div class="lang">Texto del SRD 5.2</div>${esc(s.de)}${s.hl?'\n\nA niveles superiores: '+esc(s.hl):''}${s.m?`\n\nMaterial: ${esc(s.m)}`:''}\n\nClases: ${s.c.map(k=>CL[k]?CL[k].n:k).join(', ')}</div>`:''}</div>`}).join('')}
function spPickerHTML(){
  const lv=[['','Todos los niveles'],['0','Trucos'],...[1,2,3,4,5,6,7,8,9].filter(l=>P.max==null||l<=P.max).map(l=>[String(l),'Nivel '+l])];
  return`<div class="sp-tools"><input type="search" id="sp-q" placeholder="Buscar por nombre (castellano o inglés)" value="${esc(P.q)}" autocomplete="off">
    <select id="sp-cls" aria-label="Clase">${CLASS_OPTS().map(([k,n])=>`<option value="${k}" ${P.cls===k?'selected':''}>${n}</option>`).join('')}</select>
    <select id="sp-lvl" aria-label="Nivel">${lv.map(([k,n])=>`<option value="${k}" ${P.lvl===k?'selected':''}>${n}</option>`).join('')}</select></div>
    <div id="sp-results">${spResultsHTML()}</div>`}
function refreshPicker(){const r=$('#sp-results');if(r)r.innerHTML=spResultsHTML();if(W)renderWizCounts();const pc=$('#prep-counts');if(pc&&P&&P.target==='prep')pc.innerHTML=prepCounts()}
function prepCounts(){const c=C(),ca=casterOf(defOf(c),subOf(c));if(!ca)return'';const can=ca.cantrips?ca.cantrips[c.level-1]:0,prep=ca.prepared?ca.prepared[c.level-1]:0;
  return countsHTML({can,prep,cur:{c:c.spells.filter(s=>!s.src&&+s.level===0).length,p:c.spells.filter(s=>!s.src&&+s.level>0).length},max:maxSpellLevel(ca.type,c.level)})}
function openPrepModal(){const c=C(),ca=casterOf(defOf(c),subOf(c));if(!ca)return;const rule=PREP_RULE[c.classKey];
  P={target:'prep',q:'',lvl:'',cls:ca.list,open:'',list:c.spells,max:maxSpellLevel(ca.type,c.level),min:1};
  openModal(`<div class="wz-head"><h2>Cambiar conjuros preparados</h2><button class="b sm" data-act="sp-close">Hecho</button></div>
    <p class="hint">${rule==='one'?'Tras un descanso largo puedes cambiar <b>uno</b> de tus conjuros preparados por otro de tu lista.':c.classKey==='wizard'?'Tras un descanso largo puedes cambiar los que quieras, eligiendo entre los de tu libro de conjuros.':'Tras un descanso largo puedes cambiar los que quieras de tu lista de clase.'} Los marcados como «Siempre preparado» no cuentan en el límite.</p>
    <div id="prep-counts" style="margin:.3rem 0 .6rem">${prepCounts()}</div><div class="wz-body">${spPickerHTML()}</div>`,true)}
function openSpellModal(){
  const c=C(),def=defOf(c),ca=casterOf(def,subOf(c));
  P={target:'edit',q:'',lvl:'',cls:ca?ca.list:'',open:'',list:c.spells,max:null};
  openModal(`<div class="wz-head"><h2>Buscar conjuros</h2><button class="b sm" data-act="sp-close">Hecho</button></div>
    <p class="hint">Añade o quita conjuros de la ficha de ${esc(c.name)}. Filtrado por defecto con la lista de tu clase.</p>
    <div class="wz-body">${spPickerHTML()}</div>`,true)}

/* ================= Asistente: subir de nivel / crear ================= */
let W=null;
function wizSteps(){
  const st=[];
  if(W.mode==='create'){st.push(['basics','Datos'],['species','Especie'],['background','Trasfondo'],['abil','Características'],['skills','Habilidades'])}
  else{ if(W.needClass) st.push(['pickclass','Clase']); st.push(['summary','Novedades'],['hp','Puntos de golpe']) }
  const def=CL[W.classKey];
  if(def){
    if(W.mode==='level'&&def.subLv[0]<=W.L&&!W.origSub) st.push(['sub','Subclase']);
    if(W.mode==='level'){const sp=specOf(C().speciesKey);if(sp&&sp.lin&&!C().lineageKey&&(W.L===3||W.L===5))st.push(['lineage',sp.linLabel||'Linaje'])}
    if(W.mode==='level'&&def.asi.includes(W.L)) st.push(['asi',W.L===19?'Don épico':'Mejora']);
    const ca=casterOf(def,W.subKey?def.subs[W.subKey]:null);
    if(ca&&((ca.cantrips&&ca.cantrips[W.L-1])||(ca.prepared&&ca.prepared[W.L-1]))) st.push(['spells','Conjuros']);
  }
  st.push(['confirm','Confirmar']);
  return st}
function startWizard(mode){
  const c=C();
  if(mode==='create'){
    W={mode,L:1,classKey:'',subKey:'',origSub:'',name:'',species:'',background:'',speciesKey:'',lineageKey:'',bgKey:'',bgMode:'21',bg2:'',bg1:'',humanFeat:'',base:{str:15,dex:14,con:13,int:12,wis:10,cha:8},ab:{},skills:[],spells:[],step:0,hpMode:'avg',hpRoll:''};recomputeAb();
  }else{
    W={mode,L:c.level+1,needClass:!c.classKey,lineageKey:c.lineageKey,classKey:c.classKey,subKey:c.subclassKey,origSub:c.subclassKey,ab:Object.assign({},c.abilities),spells:c.spells.map(s=>Object.assign({},s)),step:0,hpMode:'avg',hpRoll:'',asi:{mode:'2',a:'',b:'',feat:'',featText:''}};
  }
  renderWizard()}
function bgBonus(){const o={};const bg=BG[W.bgKey];if(!bg)return o;
  if(W.bgMode==='111')bg.ab.forEach(k=>o[k]=1);else{if(W.bg2)o[W.bg2]=2;if(W.bg1&&W.bg1!==W.bg2)o[W.bg1]=(o[W.bg1]||0)+1}return o}
function recomputeAb(){const b=bgBonus();W.ab={};for(const [k] of ABIL)W.ab[k]=Math.min(20,(+W.base[k]||0)+(b[k]||0))}
const wizFeats=()=>W.mode==='create'?[BG[W.bgKey]&&BG[W.bgKey].feat,W.speciesKey==='human'&&W.humanFeat].filter(Boolean):(C().featKeys||[]);
function extraSkills(){const sp=specOf(W.speciesKey);return((sp&&sp.extraSkill&&sp.extraSkill.n)||0)+wizFeats().reduce((t,k)=>t+((FEATS[k]&&FEATS[k].skills)||0),0)}
const bgSkills=()=>BG[W.bgKey]?BG[W.bgKey].skills:[];
const wizDef=()=>CL[W.classKey];
const wizSub=()=>W.subKey&&wizDef()?wizDef().subs[W.subKey]:null;
function newFeatures(){
  const def=wizDef(),sub=wizSub(),L=W.L,out=[];if(!def)return out;
  (def.f[L]||[]).forEach(f=>out.push([...f,`${def.n} ${L}`]));
  if(W.mode==='level'){const sp=specOf(C().speciesKey);if(sp&&sp.lv&&sp.lv[L])sp.lv[L].forEach(f=>out.push([...f,sp.n]))}
  if(sub){const levels=W.mode==='level'&&!W.origSub?def.subLv.filter(l=>l<=L):[L];
    levels.forEach(l=>(sub.f[l]||[]).forEach(f=>out.push([...f,`${sub.n} ${l}`])))}
  return out}
function hpGain(){
  const def=wizDef(),c=C();if(!def)return 0;
  const con=mod(W.mode==='level'?W.ab.con:W.ab.con);
  let base=W.mode==='create'?def.hd:(W.hpMode==='avg'?def.hd/2+1:(+W.hpRoll||0));
  let g=Math.max(1,base+con);
  if(W.subKey==='draconic') g+= (W.mode==='level'&&!W.origSub)?W.L:1;
  g+=hpPerLevel(W.mode==='create'?W.speciesKey:c.speciesKey,wizFeats());
  return g}
function wizSpellLimits(){
  const def=wizDef(),ca=casterOf(def,wizSub());if(!ca)return null;
  const L=W.L,can=ca.cantrips?ca.cantrips[L-1]:0,prep=ca.prepared?ca.prepared[L-1]:0;
  const cur={c:W.spells.filter(s=>!s.src&&+s.level===0).length,p:W.spells.filter(s=>!s.src&&+s.level>0).length};
  return{ca,can,prep,cur,max:maxSpellLevel(ca.type,L)}}
function renderWizCounts(){const el=$('#wz-counts');if(!el)return;const l=wizSpellLimits();if(!l)return;
  el.innerHTML=countsHTML(l)}
function countsHTML(l){return`<span class="badge" style="${l.cur.c>l.can?'color:var(--bad)':''}">Trucos ${l.cur.c}/${l.can}</span> <span class="badge" style="${l.cur.p>l.prep?'color:var(--bad)':''}">Conjuros preparados ${l.cur.p}/${l.prep}</span> <small>hasta nivel ${l.max}</small>`}
function diffRow(k,a,b){return a===b?'':`<span>${esc(k)}</span><b>${esc(a)} → <span class="up">${esc(b)}</span></b>`}
function wizBody(step){
  const c=C(),def=wizDef(),sub=wizSub(),L=W.L;
  switch(step){
  case'pickclass':return`<p>Esta ficha no tiene una clase reconocida. Elige la clase para que el asistente sepa qué ganas al subir.</p>
    <div class="f"><span>Clase</span><select id="wz-class">${[['','—'],...Object.entries(CL).map(([k,d])=>[k,d.n])].map(([k,n])=>`<option value="${k}" ${W.classKey===k?'selected':''}>${n}</option>`).join('')}</select></div>`;
  case'basics':return`<div class="grid">
    <label class="f"><span>Nombre</span><input id="wz-name" value="${esc(W.name)}" autocomplete="off"></label>
    <label class="f"><span>Especie</span><input id="wz-species" value="${esc(W.species)}" placeholder="Humano, Elfo, Tiefling…"></label>
    <label class="f"><span>Trasfondo</span><input id="wz-background" value="${esc(W.background)}" placeholder="Acólito, Soldado…"></label></div>
    <h3>Clase</h3><div class="choice">${Object.entries(CL).map(([k,d])=>`<label><input type="radio" name="wz-cls" value="${k}" ${W.classKey===k?'checked':''}><span><b>${d.n}</b><br><small>Dado de golpe d${d.hd} · Salvaciones ${d.saves.map(s=>AB[s][1]).join(' y ')}${d.cast?` · Lanza conjuros con ${AB[d.ab][2]}`:''}</small></span></label>`).join('')}</div>`;
  case'species':{const sp=specOf(W.speciesKey);return`<div class="choice">${Object.entries(SPEC).map(([k,d])=>`<label><input type="radio" name="wz-spec" value="${k}" ${W.speciesKey===k?'checked':''}><span><b>${d.n}</b><br><small>Tamaño ${d.size} · ${d.speed} pies${d.dv?` · visión en la oscuridad ${d.dv} pies`:''}</small>
      ${W.speciesKey===k?`<div style="margin-top:.4rem">${d.traits.map(t=>`<div class="feat"><b>${esc(t[0])}</b><p>${esc(t[1])}</p></div>`).join('')}</div>`:''}</span></label>`).join('')}
      <label><input type="radio" name="wz-spec" value="" ${W.speciesKey===''&&W.species?'checked':''}><span><b>Otra</b><br><small>La completas tú a mano.</small>${W.speciesKey===''?`<br><input id="wz-species" class="inline-num" style="width:100%;margin-top:.4rem" value="${esc(W.species)}" placeholder="Nombre de la especie">`:''}</span></label></div>
    ${sp&&sp.lin?`<h3>${esc(sp.linLabel||'Linaje')}</h3><div class="choice">${Object.entries(sp.lin).map(([k,l])=>`<label><input type="radio" name="wz-lin" value="${k}" ${W.lineageKey===k?'checked':''}><span><b>${esc(l.n)}</b><br><small>${esc(l.traits.map(t=>t[1]).join(' '))}</small></span></label>`).join('')}</div>`:''}`}
  case'background':{const bg=BG[W.bgKey];const abSel=(id,v,opts)=>`<select id="${id}">${[['','—'],...opts.map(k=>[k,AB[k][2]])].map(([k,n])=>`<option value="${k}" ${v===k?'selected':''}>${n}</option>`).join('')}</select>`;
    return`<div class="f"><span>Trasfondo</span><select id="wz-bg">${[['','Otro (lo completo a mano)'],...Object.entries(BG).map(([k,b])=>[k,b.n])].map(([k,n])=>`<option value="${k}" ${W.bgKey===k?'selected':''}>${n}</option>`).join('')}</select></div>
    ${bg?`<div class="diff"><span>Habilidades</span><b>${bg.skills.map(k=>SK[k][1]).join(', ')}</b><span>Herramienta</span><b>${esc(bg.tool)}</b><span>Dote de origen</span><b>${esc(FEATS[bg.feat].n)}</b></div>
      <p class="hint">${esc(FEATS[bg.feat].text)}</p>
      <h3>Aumento de características</h3><p class="hint">Este trasfondo puede aumentar ${bg.ab.map(k=>AB[k][2]).join(', ')}.</p>
      <div class="choice"><label><input type="radio" name="wz-bgmode" value="21" ${W.bgMode==='21'?'checked':''}><span><b>+2 a una y +1 a otra</b>${W.bgMode==='21'?`<div class="grid" style="margin-top:.4rem"><label class="f"><span>+2</span>${abSel('wz-bg2',W.bg2,bg.ab)}</label><label class="f"><span>+1</span>${abSel('wz-bg1',W.bg1,bg.ab.filter(k=>k!==W.bg2))}</label></div>`:''}</span></label>
        <label><input type="radio" name="wz-bgmode" value="111" ${W.bgMode==='111'?'checked':''}><span><b>+1 a las tres</b></span></label></div>`
      :`<label class="f"><span>Nombre del trasfondo</span><input id="wz-background" value="${esc(W.background)}"></label><p class="hint">Con un trasfondo propio, aplica tú los aumentos en el paso siguiente.</p>`}
    ${W.speciesKey==='human'?`<h3>Versátil (humano)</h3><div class="f"><span>Dote de origen extra</span><select id="wz-hfeat">${[['','—'],...Object.entries(FEATS).map(([k,f])=>[k,f.n])].map(([k,n])=>`<option value="${k}" ${W.humanFeat===k?'selected':''}>${n}</option>`).join('')}</select></div>`:''}`}
  case'abil':{const b=bgBonus();return`<p class="hint">Escribe las puntuaciones base (la matriz estándar es 15, 14, 13, 12, 10, 8). ${BG[W.bgKey]?'Los aumentos del trasfondo se suman solos.':'Incluye ya los aumentos de tu trasfondo.'}</p>
    <div class="grid">${ABIL.map(([k,,n])=>`<label class="f"><span>${n}${b[k]?` +${b[k]}`:''} → ${W.ab[k]} (${sgn(mod(W.ab[k]))})</span><input id="wz-ab-${k}" type="number" inputmode="numeric" min="1" max="20" value="${W.base[k]}" data-wab="${k}"></label>`).join('')}</div>`}
  case'lineage':{const sp=specOf(C().speciesKey);return`<p>A nivel ${L} tu ${esc(sp.n.toLowerCase())} gana conjuros según su ${esc((sp.linLabel||'linaje').toLowerCase())}, y tu ficha aún no tiene uno elegido.</p>
    <div class="choice">${Object.entries(sp.lin).map(([k,l])=>`<label><input type="radio" name="wz-lin" value="${k}" ${W.lineageKey===k?'checked':''}><span><b>${esc(l.n)}</b><br><small>${esc(l.traits.map(t=>t[1]).join(' '))}</small></span></label>`).join('')}</div>`}
  case'skills':{const sk=def.skills,bgs=bgSkills(),ex=extraSkills(),sp=specOf(W.speciesKey);return`<p>Elige <b>${sk.n}</b> habilidades de ${def.n}${ex?` y <b>${ex}</b> más a tu elección (${[sp&&sp.extraSkill&&sp.extraSkill.label,...wizFeats().filter(k=>FEATS[k].skills).map(k=>FEATS[k].n)].filter(Boolean).join(', ')})`:''}.${bgs.length?' Las del trasfondo ya vienen marcadas.':''}</p>
    <div class="chips">${SKILLS.map(s=>{const locked=bgs.includes(s[0]),on=locked||W.skills.includes(s[0]),cls=sk.from.includes(s[0]);return`<button class="chip ${on?'on':''}" data-act="wz-skill" data-k="${s[0]}" ${locked?'disabled title="Del trasfondo"':''} ${cls||locked?'':'style="opacity:.75"'}>${s[1]}${locked?' ✓':cls?'':' *'}</button>`}).join('')}</div>
    <p class="hint">* No está en la lista de ${def.n.toLowerCase()}${ex?'; puedes usarla para tus elecciones extra':''}. Llevas ${W.skills.length} de ${sk.n+ex}.${sp&&sp.extraSkill&&sp.extraSkill.from?` ${esc(sp.extraSkill.label)}: elige entre ${sp.extraSkill.from.map(k=>SK[k][1]).join(', ')}.`:''}</p>`}
  case'summary':{
    const nf=newFeatures();const old=resourcesFor(def,CL[c.classKey]&&c.subclassKey?def.subs[c.subclassKey]:null,c.level,c.abilities),nw=resourcesFor(def,sub,L,W.ab);
    const ca=casterOf(def,sub),o=ca?slotsFor(ca.type,c.level):null,n=ca?slotsFor(ca.type,L):null;
    let rows='';
    rows+=diffRow('Bonificador de competencia',sgn(pbAt(c.level)),sgn(pbAt(L)));
    nw.forEach(r=>{const p=old.find(x=>x.n===r.n);rows+=diffRow(r.n,p?String(p.max):'0',String(r.max))});
    const oi=infoFor(def,CL[c.classKey]&&c.subclassKey?def.subs[c.subclassKey]:null,c.level),ni=infoFor(def,sub,L);
    for(const k in ni)rows+=diffRow(k,String(oi[k]??'—'),String(ni[k]));
    if(ca){if(ca.type==='pact')rows+=diffRow('Espacios de pacto',`${o.pact.total} de nivel ${o.pact.level}`,`${n.pact.total} de nivel ${n.pact.level}`);
      else n.slots.forEach((v,i)=>rows+=diffRow(`Espacios de nivel ${i+1}`,String(o.slots[i]),String(v)));
      if(ca.cantrips)rows+=diffRow('Trucos',String(ca.cantrips[c.level-1]||0),String(ca.cantrips[L-1]));
      if(ca.prepared)rows+=diffRow('Conjuros preparados',String(ca.prepared[c.level-1]||0),String(ca.prepared[L-1]))}
    return`<p><b>${esc(c.name)}</b> pasa de ${def.n} ${c.level} a ${def.n} ${L}.</p>
      ${nf.length?`<h3>Rasgos nuevos</h3>${nf.map(f=>`<div class="feat"><b>${esc(f[0])}</b><p>${esc(f[1])}</p></div>`).join('')}`:(def.subLv.includes(L)&&!sub?'':'<p class="hint">A este nivel no ganas rasgos nuevos de clase.</p>')}
      ${def.subLv.includes(L)&&!sub&&W.origSub===''?'<p class="hint">Elegirás tu subclase en el siguiente paso.</p>':''}
      ${def.asi.includes(L)?`<p class="hint">A este nivel ganas ${L===19?'un Don épico (una dote)':'una Mejora de característica o una dote'}; lo eliges más adelante.</p>`:''}
      ${rows?`<h3>Cambios</h3><div class="diff">${rows}</div>`:''}
      ${(()=>{const ids=[...alwaysIds(W.classKey,'',L,L),...(sub?alwaysIds('',W.subKey,W.origSub?L:1,L):[]),...originSpellIds(c.speciesKey,c.lineageKey||W.lineageKey,L,L)].filter(id=>!c.spells.some(s=>s.ref===id));return ids.length?`<h3>Conjuros que se añaden solos</h3><p>${ids.map(id=>esc(SPBY[id].n)).join(', ')}</p><p class="hint">Siempre preparados o de tu especie: no cuentan en tu límite.</p>`:''})()}`}
  case'hp':{const con=mod(W.ab.con),avg=def.hd/2+1;return`<p>Al subir ganas PG: tu dado de golpe (d${def.hd}) + tu modificador de CON (${sgn(con)}).</p>
    <div class="choice">
      <label><input type="radio" name="wz-hp" value="avg" ${W.hpMode==='avg'?'checked':''}><span><b>Valor fijo: ${avg} ${sgn(con)} = ${Math.max(1,avg+con)} PG</b><br><small>La opción segura, sin tirar.</small></span></label>
      <label><input type="radio" name="wz-hp" value="roll" ${W.hpMode==='roll'?'checked':''}><span><b>Tirar el dado</b><br><small>Tira un d${def.hd} físico y escribe el resultado.</small>
        <br><input id="wz-hproll" type="number" inputmode="numeric" min="1" max="${def.hd}" value="${esc(W.hpRoll)}" class="inline-num" style="margin-top:.4rem" aria-label="Resultado del dado"></span></label></div>
    ${W.subKey==='draconic'?'<p class="hint">Resistencia dracónica: +1 PG extra por nivel de hechicero (incluido).</p>':''}
    <p>Ganas <b>${hpGain()} PG</b>: tus PG máximos pasan de ${c.hp.max} a <b>${c.hp.max+hpGain()}</b>.</p>`}
  case'sub':return`<p>A nivel ${def.subLv[0]} eliges tu ${def.sub.toLowerCase()} de ${def.n.toLowerCase()}.</p>
    <div class="choice">${Object.entries(def.subs).map(([k,s])=>`<label><input type="radio" name="wz-sub" value="${k}" ${W.subKey===k?'checked':''}><span><b>${s.n}</b><br><small>${(s.f[def.subLv[0]]||[]).map(f=>f[0]).join(' · ')}</small>
      ${W.subKey===k?`<div style="margin-top:.4rem">${def.subLv.map(l=>(s.f[l]||[]).map(f=>`<div class="feat"><b>Nivel ${l}: ${esc(f[0])}</b><p>${esc(f[1])}</p></div>`).join('')).join('')}</div>`:''}</span></label>`).join('')}</div>`;
  case'asi':{const a=W.asi;return`<p>${L===19?'Don épico: en 2024 ganas una dote de Don épico (o cualquier otra dote para la que cumplas requisitos). También puedes elegir Mejora de característica.':'Elige una Mejora de característica o una dote.'}</p>
    <div class="choice">
      <label><input type="radio" name="wz-asi" value="2" ${a.mode==='2'?'checked':''}><span><b>+2 a una característica</b></span></label>
      <label><input type="radio" name="wz-asi" value="11" ${a.mode==='11'?'checked':''}><span><b>+1 a dos características</b></span></label>
      <label><input type="radio" name="wz-asi" value="feat" ${a.mode==='feat'?'checked':''}><span><b>Una dote</b><br><small>Escribe su nombre y, si quieres, un resumen.</small></span></label></div>
    ${a.mode==='feat'?`<div class="grid"><label class="f"><span>Dote</span><input id="wz-feat" value="${esc(a.feat)}" placeholder="Alerta, Afortunado…"></label><label class="f wide"><span>Qué hace</span><textarea id="wz-feattext">${esc(a.featText)}</textarea></label></div><p class="hint">Si la dote sube una característica, cámbiala luego en ⚙ Ajustes → Editar ficha.</p>`
      :`<div class="grid"><label class="f"><span>${a.mode==='2'?'Característica (+2)':'Primera (+1)'}</span><select id="wz-asi-a">${[['','—'],...ABIL.map(x=>[x[0],`${x[2]} (${W.ab[x[0]]})`])].map(([k,n])=>`<option value="${k}" ${a.a===k?'selected':''}>${n}</option>`).join('')}</select></label>
        ${a.mode==='11'?`<label class="f"><span>Segunda (+1)</span><select id="wz-asi-b">${[['','—'],...ABIL.map(x=>[x[0],`${x[2]} (${W.ab[x[0]]})`])].map(([k,n])=>`<option value="${k}" ${a.b===k?'selected':''}>${n}</option>`).join('')}</select></label>`:''}</div>
        <p class="hint">Máximo 20 en cada característica.</p>`}`}
  case'spells':{const l=wizSpellLimits();if(!P||P.target!=='wizard')P={target:'wizard',q:'',lvl:'',cls:l.ca.list,open:'',list:W.spells,max:l.max};else{P.list=W.spells;P.max=l.max}
    const mine=W.spells.length?`<div class="mine">${W.spells.map((s,i)=>`<span class="chip">${esc(s.name)} <small>${+s.level?'N'+s.level:'truco'}</small> <button class="b sm" style="padding:0 .3rem;border:0;background:none" data-act="wz-sp-del" data-i="${i}" aria-label="Quitar ${esc(s.name)}">×</button></span>`).join('')}</div>`:'<p class="empty">Ningún conjuro todavía.</p>';
    return`<p id="wz-counts">${countsHTML(l)}</p>
      <p class="hint">${l.ca.type==='pact'?'Los brujos pueden cambiar un conjuro preparado al subir de nivel.':'Puedes cambiar conjuros preparados según las reglas de tu clase.'} Los conjuros que siempre tienes preparados (de clase, subclase o especie) se añaden solos al confirmar y no cuentan en el límite.</p>
      <h3>Tus conjuros</h3><div id="wz-mine">${mine}</div><h3>Añadir</h3>${spPickerHTML()}`}
  case'confirm':{
    if(W.mode==='create'){const d=def,sp=specOf(W.speciesKey),ln=linOf(W.speciesKey,W.lineageKey);return`<p>Vas a crear a <b>${esc(W.name||'Sin nombre')}</b>, ${esc(sp?sp.n+(ln?` (${ln.n})`:''):W.species)} ${d?d.n+' 1':''}${BG[W.bgKey]?`, ${esc(BG[W.bgKey].n.toLowerCase())}`:''}.</p>
      <div class="diff"><span>PG máximos</span><b>${d?hpGain():'—'}</b>${sp?`<span>Velocidad</span><b>${(ln&&ln.speed)||sp.speed} pies</b>${((ln&&ln.dv)||sp.dv)?`<span>Visión en la oscuridad</span><b>${(ln&&ln.dv)||sp.dv} pies</b>`:''}<span>Conjuros de especie</span><b>${originSpellIds(W.speciesKey,W.lineageKey,1,1).map(id=>SPBY[id].n).join(', ')||'—'}</b>`:''}${wizFeats().length?`<span>Dotes</span><b>${wizFeats().map(k=>FEATS[k].n).join(', ')}</b>`:''}<span>Salvaciones</span><b>${d?d.saves.map(s=>AB[s][1]).join(', '):'—'}</b><span>Habilidades</span><b>${W.skills.length}</b><span>Conjuros</span><b>${W.spells.length}</b></div>
      ${newFeatures().map(f=>`<div class="feat"><b>${esc(f[0])}</b><p>${esc(f[1])}</p></div>`).join('')}
      <p class="hint">Después podrás completar CA y armas en ⚙ Ajustes → Editar ficha, y los objetos y el dinero con los botones de la mochila y de las monedas.</p>`}
    const warn=[];const l=wizSpellLimits();if(l){if(l.cur.c>l.can)warn.push(`Tienes ${l.cur.c} trucos y tu límite es ${l.can}.`);if(l.cur.p>l.prep)warn.push(`Tienes ${l.cur.p} conjuros y tu límite de preparados es ${l.prep} (puede ser correcto si alguno es de subclase).`)}
    return`<p>Todo listo para subir a <b>${esc(c.name)}</b> a ${def.n} ${L}${sub?` (${sub.n})`:''}.</p>
      <div class="diff"><span>PG máximos</span><b>${c.hp.max} → <span class="up">${c.hp.max+hpGain()}</span></b><span>Rasgos nuevos</span><b>${newFeatures().length}</b>${W.asi&&def.asi.includes(L)?`<span>${L===19?'Don épico':'Mejora'}</span><b>${esc(W.asi.mode==='feat'?W.asi.feat||'(sin nombre)':W.asi.mode==='2'?(W.asi.a?AB[W.asi.a][2]+' +2':'—'):[W.asi.a,W.asi.b].filter(Boolean).map(k=>AB[k][2]+' +1').join(', ')||'—')}</b>`:''}</div>
      ${warn.map(w=>`<p class="hint warn">${esc(w)}</p>`).join('')}
      <p class="hint">Se recalculan los espacios de conjuro y los rasgos con usos, y recuperas los PG ganados.</p>`}}
  return''}
function wizValid(step){
  const def=wizDef();
  if(step==='pickclass')return!!W.classKey;
  if(step==='basics')return!!(W.name.trim()&&W.classKey);
  if(step==='skills')return W.skills.length>=def.skills.n+extraSkills()&&W.skills.filter(k=>def.skills.from.includes(k)).length>=def.skills.n;
  if(step==='species'){const sp=specOf(W.speciesKey);return sp?(!sp.lin||!!W.lineageKey):!!W.species.trim()}
  if(step==='background'){if(W.speciesKey==='human'&&!W.humanFeat)return false;if(!W.bgKey)return!!W.background.trim();return W.bgMode==='111'||(!!W.bg2&&!!W.bg1&&W.bg1!==W.bg2)}
  if(step==='lineage')return!!W.lineageKey;
  if(step==='hp')return W.hpMode==='avg'||(+W.hpRoll>=1&&+W.hpRoll<=def.hd);
  if(step==='sub')return!!W.subKey;
  if(step==='asi'){const a=W.asi;if(a.mode==='feat')return!!a.feat.trim();if(a.mode==='2')return!!a.a&&W.ab[a.a]+2<=20;return!!a.a&&!!a.b&&a.a!==a.b&&W.ab[a.a]<20&&W.ab[a.b]<20}
  return true}
const STEP_HELP={species:'Elige especie (y su linaje si lo tiene).',background:'Completa el trasfondo y sus aumentos.',lineage:'Elige una opción.',pickclass:'Elige una clase.',basics:'Escribe un nombre y elige una clase.',skills:'Elige las habilidades que faltan.',hp:'Escribe un resultado válido del dado.',sub:'Elige una subclase.',asi:'Completa la mejora (máximo 20 por característica) o el nombre de la dote.'};
function renderWizard(){
  const st=wizSteps();W.step=clamp(W.step,0,st.length-1);const [key,label]=st[W.step];
  const title=W.mode==='create'?'Crear personaje':`Subir a nivel ${W.L}`;
  const ok=wizValid(key);
  const html=`<div class="wz-head"><div><h2>${title}</h2><div class="steps">${st.map((s,i)=>`<span class="${i===W.step?'on':i<W.step?'done':''}">${s[1]}</span>`).join('')}</div></div><button class="b sm" data-act="wz-cancel">Cancelar</button></div>
    <div class="wz-body" id="wz-body">${wizBody(key)}</div>
    <div class="wz-foot"><button class="b" data-act="wz-back" ${W.step?'':'disabled'}>Atrás</button>
      <span class="hint" style="margin:0;align-self:center">${ok?'':esc(STEP_HELP[key]||'')}</span>
      ${key==='confirm'?`<button class="b pri" data-act="wz-apply">${W.mode==='create'?'Crear personaje':'Subir de nivel'}</button>`:`<button class="b pri" data-act="wz-next" ${ok?'':'disabled'}>Siguiente</button>`}</div>`;
  const m=$('#modal');
  if(m.hidden||!m.querySelector('.sheet.big')){openModal(html,true)}else{const sh=m.querySelector('.sheet');const sc=$('#wz-body')?$('#wz-body').scrollTop:0;sh.innerHTML=html;if(W._keepScroll)$('#wz-body').scrollTop=sc}
  W._keepScroll=false}
function refreshWizFoot(){if(!W)return;const st=wizSteps(),key=st[W.step][0],ok=wizValid(key);const nb=document.querySelector('[data-act="wz-next"]');if(nb)nb.disabled=!ok;const h=document.querySelector('.wz-foot .hint');if(h)h.textContent=ok?'':(STEP_HELP[key]||'')}
function applyWizard(){
  const def=wizDef(),sub=wizSub(),L=W.L;
  let c;
  if(W.mode==='create'){
    c=normalize(blank());c.name=W.name.trim();c.abilities=Object.assign({},W.ab);
    c.speciesKey=W.speciesKey;c.lineageKey=W.lineageKey;const sp=specOf(W.speciesKey),ln=linOf(W.speciesKey,W.lineageKey);
    c.species=sp?sp.n+(ln?` (${ln.n})`:''):W.species;
    const bg=BG[W.bgKey];c.backgroundKey=W.bgKey;c.background=bg?bg.n:W.background;
    c.saveProf=[...def.saves];[...bgSkills(),...W.skills].forEach(k=>c.skills[k]=1);
    c.proficiencies.armor=def.armor;c.proficiencies.weapons=def.weapons;if(bg)c.proficiencies.tools=bg.tool;
    c.languages='Común y dos idiomas a elegir';
    c.featKeys=wizFeats();
    for(const k of c.featKeys)addFeature(c,FEATS[k].n,FEATS[k].text,k===W.humanFeat&&W.speciesKey==='human'?'Dote de origen (Versátil)':`Dote de origen (${bg?bg.n:'trasfondo'})`);
    c.hp.max=c.hp.current=hpGain();
    c.ac=10+mod(W.ab.dex)+(W.classKey==='barbarian'?mod(W.ab.con):W.classKey==='monk'?mod(W.ab.wis):0);
    if(W.speciesKey==='human')c.inspiration=true;
    S.chars.push(c);S.active=c.id;
  }else{
    c=C();const g=hpGain();c.hp.max+=g;c.hp.current+=g;
    if(W.asi&&def.asi.includes(L)){const a=W.asi;
      if(a.mode==='feat')c.features.push({name:a.feat.trim(),source:L===19?'Don épico (nivel 19)':`Dote (nivel ${L})`,text:a.featText,uses:{max:0,used:0,recover:''}});
      else if(a.mode==='2')c.abilities[a.a]=Math.min(20,c.abilities[a.a]+2);
      else{c.abilities[a.a]=Math.min(20,c.abilities[a.a]+1);c.abilities[a.b]=Math.min(20,c.abilities[a.b]+1)}}
  }
  c.classKey=W.classKey;c.class=def.n;c.level=L;
  c.subclassKey=W.subKey||'';c.subclass=sub?sub.n:'';
  c.hitDice.die='d'+def.hd;c.hitDice.total=L;c.hitDice.spent=Math.min(c.hitDice.spent,L);
  // rasgos nuevos
  for(const [n,t,src] of newFeatures()){
    const ex=c.features.find(f=>f.name===n);
    if(ex){if(!ex.text.includes(t))ex.text=(ex.text?ex.text+'\n\n':'')+`${src}: ${t}`}
    else c.features.push({name:n,source:src,text:t,uses:{max:0,used:0,recover:''}})}
  // recursos con usos
  for(const r of resourcesFor(def,sub,L,c.abilities)){
    let f=c.features.find(x=>x.name===r.n);
    if(!f){f={name:r.n,source:`${def.n}`,text:'',uses:{max:0,used:0,recover:''}};c.features.push(f)}
    f.uses.max=r.max;f.uses.recover=r.rec;f.uses.pool=r.pool;f.uses.used=clamp(f.uses.used||0,0,r.max)}
  // magia
  const ca=casterOf(def,sub);
  if(ca){c.spellcasting.ability=ca.ab;const z=slotsFor(ca.type,L);
    c.slots.forEach((s,i)=>{s.total=z.slots[i];s.used=Math.min(s.used,s.total)});
    c.pact.level=z.pact.level;c.pact.total=z.pact.total;c.pact.used=Math.min(c.pact.used,c.pact.total);
    c.spells=W.spells.map(s=>Object.assign(NEW.spells(),s))}
  // conjuros siempre preparados de clase y subclase
  addAlways(c,[...alwaysIds(c.classKey,'',W.mode==='create'?1:L,L),...alwaysIds('',c.subclassKey,W.mode==='level'&&!W.origSub?1:L,L)]);
  // especie, linaje y dotes de origen
  if(W.mode==='create')applyOrigin(c);
  else{
    if(W.lineageKey&&!c.lineageKey){c.lineageKey=W.lineageKey;const sp=specOf(c.speciesKey),ln=linOf(c.speciesKey,c.lineageKey);
      c.species=sp.n+` (${ln.n})`;ln.traits.forEach(t=>addFeature(c,t[0],t[1],ln.n));addOriginSpells(c,originSpellIds(c.speciesKey,c.lineageKey,1,L))}
    else addOriginSpells(c,originSpellIds(c.speciesKey,c.lineageKey,L,L));
    upsertRes(c,originRes(c.speciesKey,c.lineageKey,c.featKeys,L),(specOf(c.speciesKey)||{n:'Origen'}).n)}
  if(!c.spellcasting.ability&&c.spells.length)c.spellcasting.ability=['int','wis','cha'].sort((a,b)=>c.abilities[b]-c.abilities[a])[0];
  const name=c.name,mode=W.mode;
  closeModal();S.tab='play';save();render();scrollTo(0,0);
  toast(mode==='create'?`<div class="t-label">Personaje creado</div><div class="t-big">${esc(name)}</div><div class="t-parts">Completa CA y armas en ⚙ Ajustes → Editar ficha, y los objetos con el botón de la mochila.</div>`
    :`<div class="t-label">¡Subida de nivel!</div><div class="t-big">${esc(def.n)} ${L}</div><div class="t-parts">Rasgos, recursos y espacios actualizados.</div>`)}

/* Aplica a la ficha todo lo automatizable de su especie y linaje (y los recursos de sus dotes) */
function applyOrigin(c){
  const sp=specOf(c.speciesKey),ln=linOf(c.speciesKey,c.lineageKey);if(!sp)return;
  c.speedFt=(ln&&ln.speed)||sp.speed;c.size=sp.size;
  const dv=(ln&&ln.dv)||sp.dv;if(dv)addFeature(c,'Visión en la oscuridad',`Ves en la oscuridad hasta ${dv} pies como si fuera luz tenue (sin colores).`,sp.n);
  sp.traits.forEach(t=>addFeature(c,t[0],t[1],sp.n));
  if(ln)ln.traits.forEach(t=>addFeature(c,t[0],t[1],ln.n));
  if(sp.lv)for(const l in sp.lv)if(+l<=c.level)sp.lv[l].forEach(t=>addFeature(c,t[0],t[1],sp.n));
  addOriginSpells(c,originSpellIds(c.speciesKey,c.lineageKey,1,c.level));
  upsertRes(c,originRes(c.speciesKey,c.lineageKey,c.featKeys||[],c.level),sp.n)}

/* ================= Diario ================= */
let D=null;
const dItems=()=>C().diary.items;
const dGet=id=>dItems().find(x=>x.id===id);
const dKids=pid=>dItems().filter(x=>(x.parent||null)===(pid||null)).sort((a,b)=>a.type===b.type?a.name.localeCompare(b.name,'es',{numeric:true}):a.type==='folder'?-1:1);
function dPath(id){const out=[];let x=id&&dGet(id);while(x){out.unshift(x);x=x.parent&&dGet(x.parent)}return out}
function dDesc(id){const out=[];for(const k of dKids(id)){out.push(k);if(k.type==='folder')out.push(...dDesc(k.id))}return out}
const ICON_FOLDER='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="currentColor" opacity=".85"/></svg>';
const ICON_NOTE='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 3h8l4 4v14H6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 11h6M9 14.5h6M9 18h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
function dRow(x){const n=x.type==='folder'?dDesc(x.id).filter(y=>y.type==='note').length:0;
  const where=D.q?dPath(x.parent).map(p=>p.name).join(' / '):'';
  return`<div class="drow">
    <button class="dopen" data-act="d-open" data-id="${x.id}"><span class="dic ${x.type}">${x.type==='folder'?ICON_FOLDER:ICON_NOTE}</span><span class="dtxt"><b>${esc(x.name||'Sin título')}</b><small>${x.type==='folder'?`${n} entrada${n===1?'':'s'}`:esc((x.text||'').replace(/\s+/g,' ').slice(0,70)||'Vacía')}${where?` · en ${esc(where)}`:''}</small></span></button>
    <button class="b sm sq" data-act="d-menu" data-id="${x.id}" aria-label="Opciones de ${esc(x.name)}" aria-expanded="${D.menu===x.id}">⋯</button>
    ${D.menu===x.id?`<div class="charmenu">${D.confirm===x.id?`<span class="hint" style="margin:0">¿Borrar${x.type==='folder'?' la categoría y todo lo que contiene':''}?</span><button class="b sm bad" data-act="d-del-ok" data-id="${x.id}">Borrar</button><button class="b sm" data-act="d-menu" data-id="${x.id}">Cancelar</button>`
      :`<button class="b sm" data-act="d-rename" data-id="${x.id}">Renombrar</button><button class="b sm" data-act="d-move" data-id="${x.id}">Mover a…</button><button class="b sm bad" data-act="d-del" data-id="${x.id}">Borrar</button>`}</div>`:''}
  </div>`}
function renderDiary(){
  const c=C();let body;
  if(D.note){const n=dGet(D.note);if(!n){D.note=null;return renderDiary()}
    if(D.pick){const pq=norm(D.pq),opts=dItems().filter(x=>x.id!==n.id&&(!pq||norm(x.name).includes(pq))).sort((a,b)=>a.name.localeCompare(b.name,'es',{numeric:true}));
      body=`<p>Enlazar a otra entrada desde <b>${esc(n.name)}</b>:</p><div class="dtools"><input type="search" id="d-pq" placeholder="Buscar o escribir un nombre nuevo" value="${esc(D.pq)}" autocomplete="off"></div>
        <div class="charlist">${D.pq.trim()&&!dFind(D.pq.trim())?`<button class="b opt" data-act="d-pick" data-name="${esc(D.pq.trim())}"><span>+ Enlazar a «<b>${esc(D.pq.trim())}</b>» (entrada nueva)</span></button>`:''}
        ${opts.map(x=>`<button class="b opt" data-act="d-pick" data-name="${esc(x.name)}"><span>${x.type==='folder'?ICON_FOLDER:ICON_NOTE} <b>${esc(x.name)}</b> <small>${esc(dPath(x.parent).map(p=>p.name).join(' / '))}</small></span></button>`).join('')}</div>
        <div class="btns"><button class="b" data-act="d-pick-cancel">Cancelar</button></div>`}
    else if(D.edit){body=`<div class="crumbs">${crumbs(n.parent)}</div>
      <input class="dtitle" id="d-title" value="${esc(n.name)}" placeholder="Título" aria-label="Título">
      <textarea class="notes diary" id="d-text" placeholder="Escribe aquí…">${esc(n.text||'')}</textarea>
      <p class="hint">Para enlazar otra entrada usa «Enlazar» o escribe su nombre entre corchetes dobles: [[Puerto Brumoso]].</p>
      <div class="btns"><button class="b pri" data-act="d-done">Listo</button><button class="b" data-act="d-linkpick">Enlazar…</button></div>`}
    else{const back=dBacklinks(n);
      body=`<div class="crumbs">${crumbs(n.parent)}</div><h3 class="dread-title">${esc(n.name||'Sin título')}</h3>
      <div class="dread">${n.text?dRender(n.text):'<p class="empty">Entrada vacía.</p>'}</div>
      ${back.length?`<div class="dback"><small>Mencionada en:</small> ${back.map(x=>`<button class="dlink" data-act="d-goto" data-id="${x.id}">${esc(x.name)}</button>`).join(' ')}</div>`:''}
      <div class="btns"><button class="b" data-act="d-back">← Volver</button><button class="b pri" data-act="d-edit">Editar</button></div>`}}
  else if(D.move){const x=dGet(D.move),bad=new Set([x.id,...(x.type==='folder'?dDesc(x.id).map(y=>y.id):[])]);
    const folders=dItems().filter(y=>y.type==='folder'&&!bad.has(y.id));
    body=`<p>Mover <b>${esc(x.name)}</b> a:</p><div class="charlist">
      <button class="b opt" data-act="d-move-to" data-id=""><span>${ICON_FOLDER} <b>Diario</b> (principal)</span></button>
      ${folders.map(f=>`<button class="b opt" data-act="d-move-to" data-id="${f.id}"><span>${ICON_FOLDER} <b>${esc(dPath(f.id).map(p=>p.name).join(' / '))}</b></span></button>`).join('')}</div>
      <div class="btns"><button class="b" data-act="d-move-cancel">Cancelar</button></div>`}
  else{const list=D.q?dItems().filter(x=>norm(x.name+' '+(x.text||'')).includes(norm(D.q))):dKids(D.folder);
    body=`<div class="dtools"><input type="search" id="d-q" placeholder="Buscar en todo el diario" value="${esc(D.q)}" autocomplete="off"></div>
      ${D.q?'':`<div class="crumbs">${crumbs(D.folder)}</div>`}
      <div class="btns"><button class="b sm pri" data-act="d-new" data-type="note">+ Entrada</button><button class="b sm" data-act="d-new" data-type="folder">+ Categoría</button><button class="b sm" data-act="d-session">+ Sesión</button></div>
      <div class="dlist">${list.length?list.map(dRow).join(''):`<p class="empty">${D.q?'No hay resultados.':D.folder?'Esta categoría está vacía.':'Tu diario está vacío. Crea una entrada o una categoría (por ejemplo «Lugares», «Personajes» o «Facciones»); dentro de una categoría puedes crear otras.'}</p>`}</div>`}
  const html=`<div class="wz-head"><h2>Diario</h2><button class="b sm" data-act="d-close">Hecho</button></div><div class="wz-body" id="d-body">${body}</div>`;
  const m=$('#modal');if(m.hidden||!m.querySelector('.sheet.big'))openModal(html,true);else m.querySelector('.sheet').innerHTML=html}
function dLinks(t){const out=[];const re=/\[\[([^\[\]\n]{1,80})\]\]/g;let m;while((m=re.exec(t||'')))out.push(m[1].trim());return out}
function dFind(nm){const k=norm(nm.trim());const its=dItems();return its.find(x=>x.type==='note'&&norm(x.name)===k)||its.find(x=>x.type==='folder'&&norm(x.name)===k)}
function dRender(t){let out='',last=0;const re=/\[\[([^\[\]\n]{1,80})\]\]/g;let m;
  while((m=re.exec(t))){out+=esc(t.slice(last,m.index));const nm=m[1].trim(),tg=dFind(nm);
    out+=`<button class="dlink${tg?'':' missing'}" data-act="d-link" data-name="${esc(nm)}"${tg?'':' title="Aún no existe: tócalo para crearla"'}>${esc(nm)}</button>`;last=re.lastIndex}
  return(out+esc(t.slice(last))).replace(/\n/g,'<br>')}
function dBacklinks(n){const k=norm(n.name);return dItems().filter(x=>x.type==='note'&&x.id!==n.id&&dLinks(x.text).some(l=>norm(l)===k))}
function dRelink(oldN,newN){if(!oldN||!newN||norm(oldN)===norm(newN))return;const k=norm(oldN);
  dItems().forEach(x=>{if(x.type==='note'&&x.text)x.text=x.text.replace(/\[\[([^\[\]\n]{1,80})\]\]/g,(all,nm)=>norm(nm.trim())===k?`[[${newN}]]`:all)})}
function dLeave(){if(!D||!D.note)return;const n=dGet(D.note);if(n&&D.edit&&D.orig)dRelink(D.orig,n.name);D.edit=false;D.orig='';D.pick=false;save()}
function dOpenNote(id,edit){const n=dGet(id);D.note=id;D.edit=!!edit;D.orig=edit&&n?n.name:'';D.pick=false;D.menu=null}
function crumbs(id){const path=dPath(id);return[`<button class="crumb" data-act="d-go" data-id="">Diario</button>`,...path.map(p=>`<button class="crumb" data-act="d-go" data-id="${p.id}">${esc(p.name)}</button>`)].join('<span aria-hidden="true">›</span>')}
function dPrompt(title,val,act,id,extra){openModal(`<h2>${title}</h2><input class="dtitle" id="d-name" value="${esc(val)}" autocomplete="off"><div class="btns"><button class="b pri" data-act="${act}" data-id="${id||''}" ${extra||''}>Guardar</button><button class="b" data-act="d-cancel">Cancelar</button></div>`);setTimeout(()=>{const i=$('#d-name');if(i){i.focus();i.select()}},30)}

/* ================= Descansos ================= */
function shortRestModal(){const c=C(),left=c.hitDice.total-c.hitDice.spent,cm=M(c,'con');
  const rec=c.features.filter(f=>f.uses.max>0&&(f.uses.recover==='corto'||f.uses.recover==='corto1'));
  openModal(`<h2>Descanso corto (1 hora)</h2><p>PG: <b>${c.hp.current} / ${c.hp.max}</b> · Dados de golpe: <b>${left} / ${c.hitDice.total}</b></p>
    <p class="hint">Para curarte, tira un ${esc(c.hitDice.die)} físico y escribe el resultado; se suma tu CON (${sgn(cm)}).</p>
    <div class="hpctl"><input id="hd-roll" type="number" inputmode="numeric" min="1" placeholder="Dado" aria-label="Resultado del dado de golpe"><button class="b" data-act="hd" ${left>0&&c.hp.current<c.hp.max?'':'disabled'}>Gastar dado de golpe</button></div>
    <p class="hint">Al terminar se recupera:</p><ul>${c.pact.total?'<li>Espacios de magia de pacto</li>':''}${rec.map(f=>`<li>${esc(f.name)}${f.uses.recover==='corto1'?' (1 uso)':''}</li>`).join('')}${!c.pact.total&&!rec.length?'<li>Nada más que los PG de los dados que gastes</li>':''}</ul>
    <div class="btns"><button class="b pri" data-act="short-done">Terminar descanso</button><button class="b" data-act="close-modal">Cancelar</button></div>`)}

/* ================= Acciones ================= */
const A={
  tab:el=>{S.tab=el.dataset.t;save();render();scrollTo(0,0)},
  'close-toast':el=>el.closest('.toast').remove(),
  'close-modal':closeModal,
  pip:el=>{const c=C(),k=+el.dataset.i,kind=el.dataset.kind,a=+el.dataset.a;
    const nf=filled=>k<filled?k:k+1;
    if(kind==='ds'||kind==='df'){const key=kind==='ds'?'success':'fail';c.deathSaves[key]=clamp(nf(c.deathSaves[key]),0,3)}
    else{const o=kind==='slot'?c.slots[a]:kind==='pact'?c.pact:c.features[a].uses;const T=kind==='feat'?o.max:o.total;o.used=clamp(T-nf(T-o.used),0,T)}
    save();render()},
  'res-d':el=>{const u=C().features[+el.dataset.i].uses;u.used=clamp(u.used-(+el.dataset.d),0,u.max);save();render()},
  cast:el=>{const c=C(),sp=c.spells[+el.dataset.i],L=+sp.level||0;
    if(L===0)return afterCast(sp,'Truco: no gasta espacio');
    const opts=slotOptions(c,L),usable=opts.filter(o=>o.avail>0);
    const fr=freeUse(c,sp);
    lastCastL=L;if(!sp.ritual&&!fr&&usable.length===1){lastCastL=usable[0].level;consume(c,usable[0].kind,usable[0].level);return afterCast(sp,`${slotLabel(usable[0])} · te quedan ${usable[0].avail-1}`)}
    openModal(`<h2>Lanzar ${esc(sp.name)}</h2><p class="hint">Elige con qué espacio. Con uno de nivel superior algunos conjuros son más potentes.</p>
      ${opts.map(o=>`<button class="b opt" data-act="cast-with" data-i="${el.dataset.i}" data-kind="${o.kind}" data-level="${o.level}" ${o.avail>0?'':'disabled'}><span>${slotLabel(o)}</span><small>quedan ${o.avail}</small></button>`).join('')}
      ${fr?`<button class="b opt" data-act="cast-with" data-i="${el.dataset.i}" data-kind="free"><span>Gratis (${esc(sp.src||'rasgo')})</span><small>quedan ${fr.uses.max-fr.uses.used}</small></button>`:''}
      ${sp.ritual?`<button class="b opt" data-act="cast-with" data-i="${el.dataset.i}" data-kind="ritual"><span>Como ritual</span><small>+10 min, sin espacio</small></button>`:''}
      <button class="b" data-act="close-modal">Cancelar</button>`)},
  'cast-with':el=>{const c=C(),sp=c.spells[+el.dataset.i],pe=pendingEco;closeModal();pendingEco=pe;lastCastL=+sp.level||0;
    if(el.dataset.kind==='ritual')return afterCast(sp,'Como ritual: sin espacio');
    if(el.dataset.kind==='free'){const f=freeUse(c,sp);if(f)f.uses.used=Math.min(f.uses.max,f.uses.used+1);return afterCast(sp,`Uso gratuito de ${sp.src||'rasgo'}`)}
    lastCastL=+el.dataset.level||+sp.level;consume(c,el.dataset.kind,+el.dataset.level);
    const o=slotOptions(c,+sp.level).find(x=>x.kind===el.dataset.kind&&x.level===+el.dataset.level);
    afterCast(sp,`${slotLabel({kind:el.dataset.kind,level:+el.dataset.level})} · te quedan ${o?o.avail:0}`)},
  'end-conc':()=>{C().concentration='';save();render()},
  'conc-keep':el=>el.closest('.toast').remove(),
  'conc-lose':el=>{el.closest('.toast').remove();C().concentration='';save();render()},
  insp:()=>{const c=C();c.inspiration=!c.inspiration;save();render();toast(c.inspiration?'<div class="t-label">Inspiración heroica</div><div class="t-parts">La tienes. Gástala para repetir una tirada d20 que no te guste (te quedas con el nuevo resultado).</div>':'<div class="t-label">Inspiración gastada</div>')},
  cond:el=>{const c=C(),n=el.dataset.n,i=c.conditions.indexOf(n);i>=0?c.conditions.splice(i,1):c.conditions.push(n);
    if(i<0&&INCAP.includes(n)&&c.form){const fx=formOf(c);endEffects(c,e=>e.form);c.form=null;toast(`<div class="t-label">Vuelves a tu forma</div><div class="t-parts">${esc(fx?fx.name:'La transformación')} termina al quedar incapacitado.</div>`)}
    if(i<0&&INCAP.includes(n)&&c.concentration){const lost=c.concentration;c.concentration='';toast(`<div class="t-label">Pierdes la concentración</div><div class="t-parts">${esc(lost)} termina: ${n==='Incapacitado'?'estás incapacitado':`el estado ${esc(n)} te incapacita`}.</div>`)}
    save();render();if(el.closest('.condpick'))A.conds()},
  conds:()=>{const c=C();openModal(`<div class="wz-head"><h2>Estados</h2><button class="b sm" data-act="close-modal">Hecho</button></div>
    <p class="hint">Toca para activar o quitar. Debajo de cada uno, qué hace.</p>
    <div class="condpick">${CONDS.map(([n,ds])=>`<button class="b opt ${c.conditions.includes(n)?'pri':''}" data-act="cond" data-n="${n}" aria-pressed="${c.conditions.includes(n)}"><span><b>${n}</b><br><small>${esc(ds)}</small></span><span aria-hidden="true">${c.conditions.includes(n)?'✓':''}</span></button>`).join('')}</div>`)},
  exh:el=>{const c=C();c.exhaustion=clamp((+c.exhaustion||0)+(+el.dataset.d),0,6);save();render()},
  qty:el=>{const e=C().equipment[+el.dataset.i];e.qty=Math.max(0,(+e.qty||0)+(+el.dataset.d));save();render();refreshInv()},
  ammo:el=>{const c=C(),a=c.attacks[+el.dataset.i],e=c.equipment.find(x=>x.id===a.ammo);if(!e||e.qty<=0)return;e.qty--;save();render();
    toast(`<div class="t-label">${esc(a.name)}</div><div class="t-parts">Gastas 1 ${esc(e.name)}. Te quedan <b>${e.qty}</b>.${e.qty===0?' ¡Sin munición!':''}</div><div class="t-actions"><button class="b sm" data-act="ammo-back" data-id="${e.id}">Recuperar 1</button></div>`)},
  'ammo-back':el=>{const e=C().equipment.find(x=>x.id===el.dataset.id);if(e){e.qty++;save();render()}el.closest('.toast').remove()},
  hp:el=>{const c=C(),n=Math.max(0,parseInt($('#hpAmt').value)||0);if(!n){$('#hpAmt').focus();return}
    const m=el.dataset.m;
    if(m==='heal'){const was=c.hp.current;c.hp.current=Math.min(c.hp.max,c.hp.current+n);if(was<=0&&c.hp.current>0){c.deathSaves={success:0,fail:0};c.conditions=c.conditions.filter(x=>x!=='Inconsciente')}toast(`<div class="t-label">Curación</div><div class="t-big good">+${c.hp.current-was}</div><div class="t-parts">PG: ${c.hp.current} / ${c.hp.max}</div>`)}
    else if(m==='temp'){c.hp.temp=Math.max(c.hp.temp,n);toast(`<div class="t-label">PG temporales</div><div class="t-big">${c.hp.temp}</div><div class="t-parts">No se suman: te quedas con el valor más alto.</div>`)}
    else{let rest=n;const fromTemp=Math.min(c.hp.temp,rest);c.hp.temp-=fromTemp;rest-=fromTemp;
      const was=c.hp.current;let extra='';
      if(was<=0&&rest>0){c.deathSaves.fail=Math.min(3,c.deathSaves.fail+1);extra='<div class="t-parts">Recibir daño a 0 PG cuenta como un fallo de salvación contra muerte (dos si es crítico).</div>'}
      c.hp.current=Math.max(0,was-rest);
      if(was>0&&c.hp.current===0){extra=rest-was>=c.hp.max?'<div class="t-parts"><b>Muerte instantánea:</b> el daño sobrante iguala o supera tus PG máximos.</div>':'<div class="t-parts"><b>Caes inconsciente.</b> En tus turnos tira salvaciones contra muerte.</div>';if(!c.conditions.includes('Inconsciente'))c.conditions.push('Inconsciente')}
      if(c.form){const fx=formOf(c);if(c.hp.current===0||(fx&&fx.via==='poly'&&c.hp.temp===0&&fromTemp>0)){endEffects(c,e=>e.form);c.form=null;extra+=`<div class="t-parts">${esc(fx?fx.name:'La transformación')} termina: vuelves a tu forma.</div>`}}
      let acts='';if(c.concentration&&n>0&&c.hp.current>0){const dc=Math.min(30,Math.max(10,Math.floor(n/2)));acts=`<div class="t-parts">Concentración en ${esc(c.concentration)}: tira salvación de CON, CD <b>${dc}</b> (tu bonificador ${sgn(saveB(c,'con'))}).</div><div class="t-actions"><button class="b sm" data-act="conc-keep">La supero</button><button class="b sm bad" data-act="conc-lose">La fallo</button></div>`}
      else if(c.concentration&&c.hp.current===0)c.concentration='';
      toast(`<div class="t-label">Daño recibido</div><div class="t-big bad">−${n}</div><div class="t-parts">${fromTemp?`${fromTemp} absorbidos por PG temporales · `:''}PG: ${c.hp.current} / ${c.hp.max}</div>${extra}${acts}`,!!acts)}
    $('#hpAmt').value='';save();render()},
  nat20:()=>{const c=C();c.hp.current=1;c.deathSaves={success:0,fail:0};c.conditions=c.conditions.filter(x=>x!=='Inconsciente');save();render();toast('<div class="t-label">¡20 natural!</div><div class="t-parts">Recuperas 1 PG y te despiertas.</div>')},
  nat1:()=>{const c=C();c.deathSaves.fail=Math.min(3,c.deathSaves.fail+2);save();render()},
  'd-close':()=>{dLeave();D=null;closeModal()},
  'd-open':el=>{const x=dGet(el.dataset.id);D.menu=null;D.hist=[];if(x.type==='folder'){D.folder=x.id;D.q=''}else dOpenNote(x.id,!x.text);renderDiary()},
  'd-go':el=>{dLeave();D.hist=[];D.folder=el.dataset.id||null;D.note=null;D.menu=null;renderDiary()},
  'd-back':()=>{dLeave();const n=dGet(D.note);let prev=null;while(D.hist.length&&!prev)prev=dGet(D.hist.pop());
    if(prev)dOpenNote(prev.id,false);else{D.note=null;D.folder=n?n.parent:D.folder}renderDiary()},
  'd-edit':()=>{dOpenNote(D.note,true);renderDiary();const t=$('#d-text');if(t)t.focus()},
  'd-done':()=>{dLeave();renderDiary()},
  'd-link':el=>{const nm=el.dataset.name;const cur=dGet(D.note);dLeave();let tg=dFind(nm);
    if(tg&&tg.type==='folder'){D.hist=[];D.note=null;D.folder=tg.id;D.q='';return renderDiary()}
    let isNew=false;if(!tg){tg={id:uid(),type:'note',name:nm,parent:cur?cur.parent:D.folder,text:'',updated:Date.now()};dItems().push(tg);save();isNew=true}
    if(cur)D.hist.push(cur.id);dOpenNote(tg.id,isNew);renderDiary();if(isNew){const t=$('#d-text');if(t)t.focus()}},
  'd-goto':el=>{const cur=D.note;dLeave();if(cur)D.hist.push(cur);dOpenNote(el.dataset.id,false);renderDiary()},
  'd-linkpick':()=>{const t=$('#d-text');D.caret=t?t.selectionStart:null;D.pick=true;D.pq='';renderDiary();const q=$('#d-pq');if(q)q.focus()},
  'd-pick-cancel':()=>{D.pick=false;renderDiary()},
  'd-pick':el=>{const n=dGet(D.note),ins=`[[${el.dataset.name}]]`,t=n.text||'',at=D.caret==null?t.length:Math.min(D.caret,t.length);
    n.text=t.slice(0,at)+ins+t.slice(at);n.updated=Date.now();D.pick=false;save();renderDiary();const ta=$('#d-text');if(ta){ta.focus();ta.setSelectionRange(at+ins.length,at+ins.length)}},
  'd-menu':el=>{D.menu=D.menu===el.dataset.id&&!D.confirm?null:el.dataset.id;D.confirm=null;renderDiary()},
  'd-session':()=>{let f=dItems().find(x=>x.type==='folder'&&!x.parent&&norm(x.name)===norm('Sesiones'));
    if(!f){f={id:uid(),type:'folder',name:'Sesiones',parent:null,text:'',updated:Date.now()};dItems().push(f)}
    const n=dKids(f.id).filter(x=>x.type==='note').length+1,day=new Date().toLocaleDateString('es-ES',{day:'numeric',month:'short'}).replace('.','');
    const x={id:uid(),type:'note',name:`Sesión ${n} – ${day}`,parent:f.id,text:'',updated:Date.now()};dItems().push(x);save();
    D.q='';D.hist=[];D.folder=f.id;dOpenNote(x.id,true);renderDiary();const t=$('#d-text');if(t)t.focus()},
  'd-new':el=>{const t=el.dataset.type;dPrompt(t==='folder'?'Nueva categoría':'Nueva entrada','', 'd-create','',`data-type="${t}"`)},
  'd-create':el=>{const name=$('#d-name').value.trim()||(el.dataset.type==='folder'?'Nueva categoría':'Nueva entrada');const x={id:uid(),type:el.dataset.type,name,parent:D.folder,text:'',updated:Date.now()};
    dItems().push(x);save();$('#modal').innerHTML='';$('#modal').hidden=true;if(x.type==='note'){D.hist=[];dOpenNote(x.id,true)}renderDiary()},
  'd-rename':el=>{const x=dGet(el.dataset.id);dPrompt('Renombrar',x.name,'d-rename-ok',x.id)},
  'd-rename-ok':el=>{const x=dGet(el.dataset.id);const v=$('#d-name').value.trim();if(v){dRelink(x.name,v);x.name=v}D.menu=null;save();$('#modal').hidden=true;renderDiary()},
  'd-cancel':()=>{$('#modal').hidden=true;renderDiary()},
  'd-del':el=>{D.confirm=el.dataset.id;renderDiary()},
  'd-del-ok':el=>{const x=dGet(el.dataset.id),gone=new Set([x.id,...(x.type==='folder'?dDesc(x.id).map(y=>y.id):[])]);C().diary.items=dItems().filter(y=>!gone.has(y.id));D.menu=D.confirm=null;save();renderDiary()},
  'd-move':el=>{D.move=el.dataset.id;D.menu=null;renderDiary()},
  'd-move-to':el=>{const x=dGet(D.move);x.parent=el.dataset.id||null;D.move=null;save();renderDiary()},
  'd-move-cancel':()=>{D.move=null;renderDiary()},
  'rest-menu':()=>{restOpen=!restOpen;renderTop()},
  undo:()=>{const u=UNDO.pop();if(!u)return;S.chars=JSON.parse(u.chars);S.active=S.chars.some(x=>x.id===u.active)?u.active:(S.chars[0]&&S.chars[0].id);
    restOpen=false;D=null;closeModal();save();render();toast(`<div class="t-label">Deshecho</div><div class="t-parts">Has vuelto al estado anterior al último cambio.${UNDO.length?'':' No quedan más cambios por deshacer.'}</div>`)},
  diary:()=>{D={folder:null,note:null,menu:null,confirm:null,move:null,q:'',hist:[],edit:false,orig:'',pick:false,pq:''};renderDiary()},
  short:()=>{restOpen=false;renderTop();shortRestModal()},
  hd:()=>{const c=C(),r=parseInt($('#hd-roll').value),f=+String(c.hitDice.die).replace(/\D/g,'')||8;
    if(!(r>=1&&r<=f)){$('#hd-roll').focus();toast(`<div class="t-parts">Escribe lo que has sacado en el ${esc(c.hitDice.die)} (de 1 a ${f}).</div>`);return}
    const cm=M(c,'con'),heal=Math.max(0,r+cm),was=c.hp.current;
    c.hitDice.spent=Math.min(c.hitDice.total,c.hitDice.spent+1);c.hp.current=Math.min(c.hp.max,c.hp.current+heal);
    toast(`<div class="t-label">Dado de golpe</div><div class="t-big good">+${c.hp.current-was}</div><div class="t-parts">${r} ${sgn(cm)} CON</div>`);save();renderTop();if(S.tab==='play')renderView();shortRestModal()},
  'short-done':()=>{const c=C();c.pact.used=0;endEffects(c,e=>e.r!=null||(e.m!=null&&e.m<=60));c.features.forEach(f=>{if(f.uses.recover==='corto')f.uses.used=0;if(f.uses.recover==='corto1')f.uses.used=Math.max(0,f.uses.used-1)});closeModal();save();render();toast('<div class="t-label">Descanso corto terminado</div><div class="t-parts">Recursos de descanso corto recuperados.</div>')},
  long:()=>{restOpen=false;renderTop();A.longModal()},
  longModal:()=>openModal(`<h2>Descanso largo (8 horas)</h2><ul><li>Recuperas todos los PG y todos los dados de golpe</li><li>Recuperas todos los espacios de conjuro</li><li>Se recuperan los rasgos con usos limitados</li><li>Agotamiento −1 y pierdes los PG temporales</li>${C().companions.length?'<li>Tus compañeros recuperan todos sus PG</li>':''}</ul>${(()=>{const c=C(),ch=c.equipment.filter(e=>e.mi&&+e.mi.ch&&+e.mi.used&&e.mi.rec);return ch.length?`<h3>Cargas al amanecer</h3>${ch.map(e=>/todas/i.test(e.mi.rec)?`<p class="hint">${esc(e.name)} recupera todas sus cargas.</p>`:`<label class="f"><span>${esc(e.name)} (${e.mi.ch-e.mi.used}/${e.mi.ch}): tira ${esc(e.mi.rec)} y escribe el resultado</span><input id="lr-ch-${e.id}" type="number" inputmode="numeric" min="0"></label>`).join('')}`:''})()}${(()=>{const c=C(),r=c.equipment.find(e=>e.gear==='rations'&&e.qty>0);return`<label class="chk"><input type="checkbox" id="lr-eat" ${r?'checked':''}> ${r?`Comer: gastar 1 ración (te quedan ${r.qty})`:'He comido hoy (sin gastar raciones de la mochila)'}</label>${c.noFood?`<p class="hint warn">Llevas ${c.noFood} día${c.noFood>1?'s':''} sin comer.</p>`:''}`})()}
    <div class="btns"><button class="b pri" data-act="long-done">Hacer descanso largo</button><button class="b" data-act="close-modal">Cancelar</button></div>`),
  'long-done':()=>{const c=C(),ate=$('#lr-eat')?$('#lr-eat').checked:true;
    c.equipment.forEach(e=>{if(!e.mi||!+e.mi.ch||!+e.mi.used||!e.mi.rec)return;if(/todas/i.test(e.mi.rec)){e.mi.used=0;return}const v=$('#lr-ch-'+e.id),n=v?parseInt(v.value):NaN;if(n>0)e.mi.used=Math.max(0,e.mi.used-n)});c.companions.forEach(x=>{const st=creaStats(c,x);if(st.track)x.hp.current=st.hpMax});endEffects(c,e=>e.r!=null||(e.m!=null&&e.m<=480));c.hp.current=c.hp.max;c.hp.temp=0;c.hitDice.spent=0;c.slots.forEach(s=>s.used=0);c.pact.used=0;
    c.features.forEach(f=>{if(f.uses.recover)f.uses.used=0});c.exhaustion=Math.max(0,(+c.exhaustion||0)-1);c.deathSaves={success:0,fail:0};c.concentration='';
    c.conditions=c.conditions.filter(x=>x!=='Inconsciente');if(c.speciesKey==='human')c.inspiration=true;
    let food='';if(ate){const r=c.equipment.find(e=>e.gear==='rations'&&e.qty>0);if(r){r.qty--;food=` Gastas 1 ración (te quedan ${r.qty}).`}c.noFood=0}
    else{c.noFood=(+c.noFood||0)+1;const lim=Math.max(1,3+M(c,'con'));if(c.noFood>lim){c.exhaustion=Math.min(6,(+c.exhaustion||0)+1);food=` Llevas ${c.noFood} días sin comer (aguantas ${lim}): ganas 1 nivel de agotamiento.`}else food=` Llevas ${c.noFood} día${c.noFood>1?'s':''} sin comer; aguantas ${lim} sin consecuencias.`}
    closeModal();save();render();const pr=PREP_RULE[c.classKey];toast(`<div class="t-label">Descanso largo terminado</div><div class="t-parts">Como nuevo.${food}</div>${pr?`<div class="t-parts">${pr==='all'?'Puedes cambiar tus conjuros preparados.':'Puedes cambiar uno de tus conjuros preparados.'}</div><div class="t-actions"><button class="b sm pri" data-act="prep-open">Cambiar conjuros</button></div>`:''}`,!!pr)},
  pay:()=>{const c=C(),n=parseInt($('#pay-amt').value),k=$('#pay-coin').value;if(!(n>0)){$('#pay-amt').focus();return}
    if(!pay(c,n,k)){toast(`<div class="t-label">No te llega</div><div class="t-parts">Necesitas ${n} ${COINN[k]} y tienes el equivalente a ${(totalCp(c)/COINV[k]).toLocaleString('es-ES',{maximumFractionDigits:2})} ${COINN[k]}.</div>`);return}
    save();renderTop();refreshMoney();toast(`<div class="t-label">Pagado</div><div class="t-big bad">−${n} ${COINN[k]}</div>`)},
  earn:()=>{const c=C(),n=parseInt($('#pay-amt').value),k=$('#pay-coin').value;if(!(n>0)){$('#pay-amt').focus();return}c.coins[k]=(+c.coins[k]||0)+n;save();renderTop();refreshMoney();toast(`<div class="t-label">Cobrado</div><div class="t-big good">+${n} ${COINN[k]}</div>`)},
  'item-new':()=>{NI={name:'',qty:1,cat:'otro',notes:'',pot:'healing',arm:'',mag:0,eq:true,auto:'',wpn:'',atk:true,ms:true,am:true,ak:'',spl:'',gr:'',var:'',pack:'explorer'};itemModal();$('#ni-name').focus()},
  'item-cancel':()=>{closeModal();openInv()},
  inv:()=>openInv(),
  'item-add':()=>{niCollect();const c=C();
    if(NI.cat==='paquete'){const P=PACKS[NI.pack||'explorer'],k=Math.max(1,parseInt(NI.qty)||1);
      P.items.forEach(([key,q])=>{const G=GEAR[key],nm=G?G.n:key,ex=c.equipment.find(e=>G?e.gear===key:norm(e.name)===norm(nm));
        if(ex)ex.qty=(+ex.qty||0)+q*k;else c.equipment.push(Object.assign({id:uid(),name:nm,qty:q*k,cat:G?G.cat:(/aceite|vela/i.test(nm)?'consumible':'otro'),notes:''},G?{gear:key}:{}))});
      NI=null;closeModal();save();render();openInv();toast(`<div class="t-label">${esc(P.n)}</div><div class="t-parts">Añadido todo su contenido a la mochila.</div>`);return}
    const n=NI.name.trim();if(!n){$('#ni-name').focus();return}
    const it={id:uid(),name:n,qty:Math.max(0,parseInt(NI.qty)||0),cat:NI.cat,notes:NI.notes.trim()};
    if(NI.cat==='pocion'&&NI.pot&&NI.pot!=='other')it.potion=NI.pot;
    if(NI.gr&&NI.gr.startsWith('t:')){it.tool=NI.gr.slice(2);if(TOOLS[it.tool].vars)it.tvar=NI.var||TOOLS[it.tool].vars[0]}
    if(NI.gr&&NI.gr.startsWith('g:')){it.gear=NI.gr.slice(2);it.cat=GEAR[it.gear].cat}
    if(NI.cat==='pergamino'){const d=splFind(NI.spl);if(!d){toast('<div class="t-parts">Elige un conjuro de la lista para el pergamino.</div>');$('#ni-spl').focus();return}it.scroll=d.id}
    if(NI.cat==='municion'&&NI.ak){it.ammoKind=NI.ak;c.attacks.forEach(a=>{const W=a.wpn&&WEAPONS[a.wpn];if(W&&W.am&&W.am[0]===NI.ak&&!a.ammo)a.ammo=it.id})}
    if(NI.cat==='arma'&&NI.wpn){const W=WEAPONS[NI.wpn];it.weapon=NI.wpn;it.magic=+NI.mag||0;
      if(NI.atk){const a=Object.assign(NEW.attacks(),{name:n,wpn:NI.wpn,magic:+NI.mag||0,mastery:MASTERY_CLS.has(c.classKey)&&!!NI.ms,item:it.id});
        if(W.am){let am=c.equipment.find(e=>e.ammoKind===W.am[0]);if(!am&&NI.am){am={id:uid(),name:AMMO[W.am[0]][0],qty:AMMO[W.am[0]][1],cat:'municion',notes:'',ammoKind:W.am[0]};c.equipment.push(am)}if(am)a.ammo=am.id}
        c.attacks.push(a)}}
    if(NI.cat==='armadura'&&NI.arm){it.armor=NI.arm;it.magic=+NI.mag||0;it.equipped=!!NI.eq;if(it.equipped)c.equipment.forEach(o=>{if(o.armor&&o.equipped&&(ARMORS[o.armor].t==='s')===(ARMORS[it.armor].t==='s'))o.equipped=false})}
    if(NI.mi){it.mi=Object.assign({},NI.mi,{on:0,used:0});if(NI.mip&&MAGIC[NI.mip]&&MAGIC[NI.mip].noarm)it.mi.noarm=1}
    c.equipment.push(it);NI=null;closeModal();save();render();openInv()},
  eq:el=>{const c=C(),e=c.equipment[+el.dataset.i],sh=ARMORS[e.armor].t==='s';e.equipped=!e.equipped;
    if(e.equipped)c.equipment.forEach(o=>{if(o!==e&&o.armor&&o.equipped&&(ARMORS[o.armor].t==='s')===sh)o.equipped=false});save();render();refreshInv()},
  gear:el=>gearUse(+el.dataset.i),
  'mi-att':el=>{const c=C(),e=c.equipment[+el.dataset.i];if(!e.mi.on&&attuned(c)>=3){toast('<div class="t-label">Máximo 3 objetos sintonizados</div><div class="t-parts">Deja de sintonizar otro primero (se hace durante un descanso corto).</div>');return}
    e.mi.on=e.mi.on?0:1;save();render();refreshInv();if(e.mi.on)toast(`<div class="t-label">Sintonizado</div><div class="t-parts">${esc(e.name)} ya funciona. Sintonizarse requiere un descanso corto con el objeto.</div>`)},
  'mi-ch':el=>{const c=C(),e=c.equipment[+el.dataset.i];e.mi.used=clamp((+e.mi.used||0)+(+el.dataset.d),0,e.mi.ch);save();render();refreshInv()},
  't-mi':el=>{const c=C(),e=c.equipment[+el.dataset.i];if(!e.mi||e.mi.ch-(+e.mi.used||0)<=0)return;e.mi.used=(+e.mi.used||0)+1;spendEco(c,'A');save();render();
    toast(`<div class="t-label">Usas ${esc(e.name)}</div><div class="t-parts">${esc(e.mi.d||'Gastas 1 carga.')} Te quedan ${e.mi.ch-e.mi.used} cargas.</div>`)},
  't-gear':el=>gearUse(+el.dataset.i),
  pot:el=>{potModal(+el.dataset.i,'AA');POT.back=true},
  scroll:el=>scrollModal(+el.dataset.i,null),
  't-scroll':el=>scrollModal(+el.dataset.i,el.dataset.eco),
  'scr-cast':()=>{const c=C(),e=c.equipment[SCR.i],d=SPBY[e.scroll],L=+d.l||0,[dc,at]=SCROLL_STATS[L],eco=SCR.eco;closeModal();e.qty=Math.max(0,e.qty-1);
    if(eco)pendingEco=eco==='BA'?'AA':eco;lastCastL=L;const sp=fillFromRef({ref:d.id,name:d.n,level:L});afterCast(sp,`Desde pergamino · CD ${dc} · ataque ${sgn(at)} · te quedan ${e.qty}`)},
  'scr-fail':()=>{const c=C(),e=c.equipment[SCR.i];e.qty=Math.max(0,e.qty-1);if(SCR.eco)spendEco(c,SCR.eco==='BA'?'AA':SCR.eco);closeModal();save();render();toast(`<div class="t-label">El pergamino se desmorona</div><div class="t-parts">${esc(e.name)} se pierde sin efecto. Te quedan ${e.qty}.</div>`)},
  'pot-heal':()=>{const c=C(),e=c.equipment[POT.i],P=POTIONS[e.potion],inp=$('#pot-roll'),n=parseInt(inp.value),[lo,hi]=diceRange(P.heal);
    if(!(n>=lo&&n<=hi)){inp.focus();toast(`<div class="t-parts">Con ${P.heal} el total va de ${lo} a ${hi}.</div>`);return}
    e.qty=Math.max(0,e.qty-1);spendEco(c,POT.eco);const got=healBy(c,n);const back=POT.back;closeModal();save();render();if(back)openInv();
    toast(`<div class="t-label">${esc(e.name)}</div><div class="t-big good">+${got}</div><div class="t-parts">PG: ${c.hp.current} / ${c.hp.max} · te quedan ${e.qty}</div>`)},
  'pot-fx':()=>{const c=C(),e=c.equipment[POT.i],P=POTIONS[e.potion],ask=$('#pot-ask')?$('#pot-ask').value.trim():'';
    e.qty=Math.max(0,e.qty-1);spendEco(c,POT.eco);if(P.temp)c.hp.temp=Math.max(c.hp.temp,P.temp);
    if(P.eff)c.effects.push(Object.assign({id:uid(),name:P.eff[0]+(ask?` (${ask})`:''),conc:false},P.eff[1]));const back=POT.back;closeModal();save();render();if(back)openInv();
    toast(`<div class="t-label">Bebes</div><div class="t-big">${esc(e.name)}</div><div class="t-parts">${esc(P.d)} Te quedan ${e.qty}.</div>`)},
  'pot-give':()=>{const c=C(),e=c.equipment[POT.i],P=POTIONS[e.potion];e.qty=Math.max(0,e.qty-1);spendEco(c,POT.eco);const back=POT.back;closeModal();save();render();if(back)openInv();
    toast(`<div class="t-label">Das ${esc(e.name)}</div><div class="t-parts">${P.heal?`La criatura recupera ${P.heal} PG (que tire ella).`:esc(P.d)} Te quedan ${e.qty}.</div>`)},
  'tog-save':el=>{const c=C(),k=el.dataset.k,i=c.saveProf.indexOf(k);i>=0?c.saveProf.splice(i,1):c.saveProf.push(k);save();render()},
  add:el=>{C()[el.dataset.list].push(NEW[el.dataset.list]());save();renderView();const nm=[...document.querySelectorAll(`[data-path^="${el.dataset.list}."]`)].pop();nm&&nm.closest('.row-ed').querySelector('input').focus()},
  del:el=>{C()[el.dataset.list].splice(+el.dataset.i,1);save();renderView()},
  levelup:()=>{closeModal();startWizard('level')},
  money:()=>openMoney(),
  'money-close':()=>{closeModal();render()},
  settings:()=>{const t=getTheme();openModal(`<div class="wz-head"><h2>Ajustes</h2><button class="b sm" data-act="close-modal">Cerrar</button></div>
    <button class="b opt" data-act="levelup" ${C().level>=20?'disabled':''}><span><b>Subir de nivel</b><br><small>${C().level>=20?'Ya estás en el nivel máximo':`Asistente para pasar a nivel ${C().level+1}`}</small></span><span aria-hidden="true">›</span></button>
    <button class="b opt" data-act="open-edit"><span><b>Editar ficha</b><br><small>Características, habilidades, armas, conjuros, rasgos y objetos</small></span><span aria-hidden="true">›</span></button>
    <div class="setting"><b>Tema</b><div class="seg" role="group" aria-label="Tema">${[['','Sistema'],['light','Claro'],['dark','Oscuro']].map(([k,n])=>`<button class="${t===k?'on':''}" data-act="theme" data-v="${k}" aria-pressed="${t===k}">${n}</button>`).join('')}</div></div>
    <button class="b opt" data-act="open-data"><span><b>Copia de seguridad</b><br><small>Importar y exportar fichas</small></span><span aria-hidden="true">›</span></button>
    <button class="b opt" data-act="open-credits"><span><b>Créditos y aviso legal</b><br><small>Aviso de contenido de fans y licencia del SRD</small></span><span aria-hidden="true">›</span></button>`)},
  theme:el=>{setTheme(el.dataset.v);render();A.settings()},
  'open-data':()=>{closeModal();S.tab='data';save();render();scrollTo(0,0)},
  'open-credits':()=>openModal(`<div class="wz-head"><h2>Créditos y aviso legal</h2><button class="b sm" data-act="close-modal">Cerrar</button></div><div class="credits">${CREDITS}</div>`),
  'open-edit':()=>{closeModal();S.tab='edit';save();render();scrollTo(0,0)},
  gloss:el=>showGloss(el),
  't-end':()=>{const c=C();c.turn={a:false,aa:false,r:false,atk:0};c.effects.forEach(e=>{if(e.r!=null)e.r--});
    const gone=endEffects(c,e=>e.r!=null&&e.r<=0);save();render();
    if(gone.length)toast(`<div class="t-label">Efecto terminado</div><div class="t-parts">${gone.map(esc).join(', ')} ${gone.length>1?'han':'ha'} terminado.</div>`)},
  'crea-new':()=>creaPick(),
  'crea-kind':el=>{CX=creaBlank(C(),el.dataset.k);creaModal()},
  'crea-from-cast':el=>{const c=C(),tt=el.closest('.toast');if(tt)tt.remove();CX=creaBlank(c,el.dataset.k,{s:el.dataset.s,L:+el.dataset.l||0,cast:el.dataset.spell});if(el.dataset.k==='summon'||el.dataset.k==='steed'){CX.conc=el.dataset.k==='summon';CX.spell=el.dataset.spell}creaModal()},
  'crea-edit':el=>{const x=C().companions.find(y=>y.id===el.dataset.id);CX=JSON.parse(JSON.stringify(x));CX.attacks=CX.attacks||[];creaModal()},
  'crea-cancel':()=>{CX=null;closeModal()},
  'cx-atk-add':()=>{creaCollect();CX.attacks.push({n:'',hit:'',dmg:''});creaModal()},
  'cx-atk-del':el=>{creaCollect();CX.attacks.splice(+el.dataset.i,1);creaModal()},
  'crea-save':()=>{const c=C();creaCollect();const x=CX,msg=$('#cx-msg');
    if(!String(x.name||'').trim()){$('#cx-name').focus();return}
    x.name=x.name.trim();x.attacks=(x.attacks||[]).filter(a=>a.n||a.dmg);
    const isNew=!x.id,st=creaStats(c,x);
    if(isNew&&x.spend&&(x.kind==='summon'||x.kind==='steed')){const o=slotOptions(c,+x.L).find(o=>o.level===+x.L&&o.avail>0);
      if(!o){msg.textContent=`No te quedan espacios de nivel ${x.L}. Desmarca «Gastar un espacio» si lo lanzas de otra forma.`;return}consume(c,o.kind,o.level)}
    if(isNew&&x.kind==='summon'){const S=SUMMONS[x.s];if(x.fromCast){x.conc=true;x.spell=x.fromCast}else if(x.concNew){c.concentration=S.n;addEffect(c,S.n,x.s==='insect'?{m:10}:{m:60},true);x.conc=true;x.spell=S.n}}
    if(x.kind==='steed'&&isNew)c.companions=c.companions.filter(y=>y.kind!=='steed');
    if(st.track){if(isNew)x.hp.current=st.hpMax;x.hp.max=st.hpMax}else x.hp.max=x.hp.max===''?0:+x.hp.max;
    ['spend','concNew','fromCast','confirm'].forEach(k=>delete x[k]);
    if(isNew){x.id=uid();c.companions.push(x)}else{const i=c.companions.findIndex(y=>y.id===x.id);c.companions[i]=x}
    CX=null;closeModal();S.tab='crea';save();render()},
  'crea-del':()=>{creaCollect();CX.confirm=true;creaModal()},
  'crea-del-ok':()=>{const c=C();if(c.form===CX.id)endEffects(c,e=>e.form);c.companions=c.companions.filter(y=>y.id!==CX.id);CX=null;closeModal();save();render()},
  'crea-dup':()=>{const c=C(),o=c.companions.find(y=>y.id===CX.id),n=JSON.parse(JSON.stringify(o));n.id=uid();n.name=n.name.replace(/( \d+)?$/,m=>' '+((parseInt(m)||1)+1));c.companions.push(n);CX=null;closeModal();save();render()},
  'crea-hp':el=>{const c=C(),x=c.companions.find(y=>y.id===el.dataset.id),inp=$('#cp-'+x.id),n=Math.max(0,parseInt(inp.value)||0);if(!n){inp.focus();return}
    const mx=creaStats(c,x).hpMax,was=x.hp.current;x.hp.current=el.dataset.m==='heal'?Math.min(mx,was+n):Math.max(0,was-n);save();render();
    toast(`<div class="t-label">${esc(x.name)}</div><div class="t-big ${el.dataset.m==='heal'?'good':'bad'}">${el.dataset.m==='heal'?'+'+(x.hp.current-was):'−'+n}</div><div class="t-parts">PG: ${x.hp.current} / ${mx}${x.hp.current===0&&was>0?' · ha caído a 0 PG':''}</div>`)},
  'crea-transform':el=>{const c=C(),x=c.companions.find(y=>y.id===el.dataset.id);
    if(x.via==='wild'){const f=wsFeat(c);if(!f||featLeft(f)<=0)return;f.uses.used++;spendEco(c,'AA')}
    const msg=transformInto(c,x);save();render();toast(`<div class="t-label">Te transformas</div><div class="t-big">${esc(x.name)}</div><div class="t-parts">${esc(msg)}</div>`)},
  'crea-revert':()=>{const c=C(),x=formOf(c);if(x&&x.via==='wild')spendEco(c,'AA');endEffects(c,e=>e.form);c.form=null;save();render();toast('<div class="t-label">Vuelves a tu forma</div>')},
  'form-go':el=>{const c=C(),via=el.dataset.via,pe=pendingEco;closeModal();
    if(via==='wild'){const f=wsFeat(c);if(!f||featLeft(f)<=0)return;f.uses.used++;spendEco(c,pe||'AA');
      if(!el.dataset.id){const ws=wsInfo(c);if(ws)c.hp.temp=Math.max(c.hp.temp,ws.temp);save();render();return}}
    const x=c.companions.find(y=>y.id===el.dataset.id);const msg=transformInto(c,x,{conc:el.dataset.conc||null});save();render();
    toast(`<div class="t-label">Te transformas</div><div class="t-big">${esc(x.name)}</div><div class="t-parts">${esc(msg)}</div>`)},
  'form-familiar':()=>{const c=C(),f=wsFeat(c),pe=pendingEco;closeModal();if(!f||featLeft(f)<=0)return;f.uses.used++;save();render();
    const fam=c.companions.find(x=>x.kind==='familiar');if(fam){fam.hp.current=+fam.hp.max||fam.hp.current;save();render();toast(`<div class="t-label">Compañero salvaje</div><div class="t-parts">${esc(fam.name)} vuelve con todos sus PG.</div>`)}
    else{CX=creaBlank(c,'familiar');creaModal()}},
  't-fatk':el=>{const c=C(),x=formOf(c),a=x&&x.attacks[+el.dataset.i];if(!a)return;spendEco(c,'A');save();render();toast(`<div class="t-label">${esc(x.name)}: ${esc(a.n)}</div><div class="t-big">1d20 ${esc(a.hit||'')}</div><div class="t-parts">Daño: ${esc(a.dmg||'—')}</div>`)},
  't-pcmd':el=>{const c=C(),x=c.companions.find(y=>y.id===el.dataset.id);if(!x)return;const st=creaStats(c,x);spendEco(c,'AA');save();render();
    toast(`<div class="t-label">${esc(x.name)}: Golpe de bestia${st.n>1?' (dos veces)':''}</div><div class="t-big">1d20 ${esc(st.atks[0][1])}</div><div class="t-parts">Daño: ${esc(st.atks[0][2])}</div>`)},
  'form-cast':el=>{const t=el.closest('.toast');if(t)t.remove();formPicker('poly',el.dataset.spell)},
  vida:()=>openVida(),
  'eff-cancel':()=>{const back=effBack;closeModal();if(back)openVida()},
  'eff-del':el=>{const c=C();endEffects(c,e=>e.id===el.dataset.id);save();render()},
  'eff-add':el=>{effBack=el.dataset.from==='vida';openModal(`<h2>Añadir efecto</h2><p class="hint">Algo que dura un tiempo: un conjuro que te han lanzado, un veneno, una bendición… Las rondas bajan al pulsar «Terminar turno» (1 ronda = 6 segundos).</p>
    <label class="f"><span>Nombre</span><input id="eff-name" autocomplete="off" placeholder="Envenenado"></label>
    <div class="effdur"><label class="f"><span>Duración</span><input id="eff-n" type="number" inputmode="numeric" min="1" value="1"></label>
    <label class="f"><span>&nbsp;</span><select id="eff-u"><option value="r">rondas</option><option value="min" selected>minutos</option><option value="h">horas</option><option value="d">días</option><option value="inf">hasta que se disipe</option></select></label></div>
    <div class="btns"><button class="b pri" data-act="eff-add-ok">Añadir</button><button class="b" data-act="eff-cancel">Cancelar</button></div>`)},
  'eff-add-ok':()=>{const c=C(),name=$('#eff-name').value.trim(),n=Math.max(1,parseInt($('#eff-n').value)||1),u=$('#eff-u').value;if(!name){$('#eff-name').focus();return}
    const d=u==='inf'?{inf:true}:u==='r'?{r:n}:u==='min'?(n<=1?{r:10}:{m:n}):u==='h'?{m:60*n}:{m:1440*n};
    c.effects.push(Object.assign({id:uid(),name,conc:false},d));const back=effBack;closeModal();save();render();if(back)openVida()},
  't-atk':el=>{const c=C(),a=c.attacks[+el.dataset.i],T=c.turn;
    const am=a.ammo&&c.equipment.find(e=>e.id===a.ammo);if(am){if(am.qty<=0)return;am.qty--}
    if(!T.a){T.a=true;T.atk=attacksPerAction(c)-1}else T.atk=Math.max(0,T.atk-1);
    save();render();toast(`<div class="t-label">Ataque con ${esc(a.name)}</div><div class="t-big">1d20 ${sgn(+a.atk||0)}</div><div class="t-parts">Si impactas, daño: ${esc(a.dmg||'—')} ${esc(a.type||'')}${am?` · quedan ${am.qty} ${esc(am.name)}`:''}${T.atk>0?` · te quedan ${T.atk} ataques`:''}</div>${a.wpn&&a.mastery&&WEAPONS[a.wpn]?`<div class="t-parts"><b>${MASTERY[WEAPONS[a.wpn].ms][0]}:</b> ${esc(MASTERY[WEAPONS[a.wpn].ms][1])}</div>`:''}`)},
  't-light':el=>{const c=C(),a=c.attacks[+el.dataset.i];c.turn.aa=true;save();render();
    toast(`<div class="t-label">Ataque con ${esc(a.name)} (acción adicional)</div><div class="t-big">1d20 ${sgn(+a.atk||0)}</div><div class="t-parts">Daño: ${esc(a.dmg||'—')} sin sumar tu modificador.</div>`)},
  't-cast':el=>{pendingEco=el.dataset.eco;A.cast(el)},
  't-feat':el=>{const c=C(),f=c.features[+el.dataset.i],w=whenOf(f);if(featLeft(f)<=0)return;
    if(f.name==='Forma salvaje'){formPicker('wild');pendingEco='AA';return}
    if(f.uses.pool||f.uses.max>12){openModal(`<h2>${esc(f.name)}</h2><p>Quedan <b>${featLeft(f)}</b>. ¿Cuántos gastas?</p><div class="hpctl"><input id="pool-n" type="number" inputmode="numeric" min="1" max="${featLeft(f)}" value="1"><button class="b pri" data-act="t-pool" data-i="${el.dataset.i}">Gastar</button><button class="b" data-act="close-modal">Cancelar</button></div>`);return}
    f.uses.used++;
    if(w==='atk'){const T=c.turn;if(!T.a){T.a=true;T.atk=attacksPerAction(c)-1}else T.atk=Math.max(0,T.atk-1)}else spendEco(c,w);
    if(f.name==='Oleada de acción'){c.turn.a=false;c.turn.atk=0}
    if(f.name==='Furia')toast('<div class="t-label">¡Furia!</div><div class="t-parts">Ventaja en FUE, daño extra y resistencia a contundente, cortante y perforante.</div>');
    save();render()},
  't-pool':el=>{const c=C(),f=c.features[+el.dataset.i],n=clamp(parseInt($('#pool-n').value)||0,0,featLeft(f));if(!n)return;f.uses.used+=n;spendEco(c,whenOf(f));closeModal();save();render()},
  't-der':el=>{const c=C(),o=DERIVED[+el.dataset.j];if(o.cost){const f=c.features.find(x=>x.name===o.cost);if(!f||featLeft(f)<=0)return;f.uses.used++}
    spendEco(c,o.t);save();render();toast(`<div class="t-label">${esc(o.n)}</div><div class="t-parts">${esc(o.d)}</div>`)},
  't-item':el=>{const c=C(),e=c.equipment[+el.dataset.i];if(e.qty<=0)return;if(e.potion&&POTIONS[e.potion]&&e.potion!=='other')return potModal(+el.dataset.i,el.dataset.eco);e.qty--;spendEco(c,el.dataset.eco);save();render();
    toast(`<div class="t-label">${e.cat==='pocion'?'Bebes':'Usas'}</div><div class="t-big">${esc(e.name)}</div><div class="t-parts">Te quedan ${e.qty}.${/curaci/i.test(e.name)?' Si cura, apunta los PG en «Curar».':''}</div>`)},
  't-gen':el=>{const c=C(),g=G[el.dataset.k];spendEco(c,'A');save();render();toast(`<div class="t-label">${esc(g.t)}</div><div class="t-parts">${esc(g.d)}</div>`)},
  't-opp':()=>{const c=C();c.turn.r=true;save();render();toast(`<div class="t-label">Ataque de oportunidad</div><div class="t-parts">Haz un ataque cuerpo a cuerpo con tu reacción.</div>`)},
  'img-del':()=>{C().story.img='';save();render()},
  'apply-origin':()=>{const c=C();const sp=specOf(c.speciesKey);if(!sp)return;
    if(sp.lin&&!c.lineageKey){toast(`<div class="t-parts">Elige antes el ${esc((sp.linLabel||'linaje').toLowerCase())} en el desplegable.</div>`);return}
    applyOrigin(c);if(!c.spellcasting.ability&&c.spells.length)c.spellcasting.ability=['int','wis','cha'].sort((a,b)=>c.abilities[b]-c.abilities[a])[0];
    save();render();toast(`<div class="t-label">Rasgos de especie aplicados</div><div class="t-parts">Velocidad, visión, rasgos, conjuros y usos de ${esc(c.species)} al nivel ${c.level}.</div>`)},
  create:()=>{closeModal();startWizard('create')},
  'wz-cancel':closeModal,
  'wz-back':()=>{W.step--;renderWizard()},
  'wz-next':()=>{const st=wizSteps();if(!wizValid(st[W.step][0]))return;W.step++;renderWizard();$('#wz-body').scrollTop=0},
  'wz-apply':applyWizard,
  'wz-skill':el=>{const k=el.dataset.k,i=W.skills.indexOf(k);i>=0?W.skills.splice(i,1):W.skills.push(k);W._keepScroll=true;renderWizard()},
  'wz-sp-del':el=>{W.spells.splice(+el.dataset.i,1);W._keepScroll=true;renderWizard()},
  'sp-open':openSpellModal,
  info:()=>openInfo(),
  'prep-open':el=>{const t=el.closest('.toast');if(t)t.remove();openPrepModal()},
  'sp-close':()=>{closeModal();save();render()},
  'sp-det':el=>{P.open=P.open===el.dataset.id?'':el.dataset.id;refreshPicker()},
  'sp-tog':el=>{const d=SPBY[el.dataset.id],i=P.list.findIndex(s=>s.ref===d.id);
    if(i>=0)P.list.splice(i,1);else{P.list.push(spellObj(d));P.list.sort((a,b)=>a.level-b.level||a.name.localeCompare(b.name,'es'))}
    if(P.target==='wizard'){const mine=$('#wz-mine');if(mine){W._keepScroll=true;renderWizard();return}}
    else save();
    refreshPicker()},
  chars:()=>{charMenu='';openChars()},
  'char-menu':el=>{charMenu=charMenu===el.dataset.id?'':el.dataset.id;openChars()},
  use:el=>{closeModal();S.active=el.dataset.id;if(S.tab==='edit'||S.tab==='data')S.tab='pj';save();render();scrollTo(0,0)},
  dup:el=>{const o=S.chars.find(x=>x.id===el.dataset.id),n=normalize(JSON.parse(JSON.stringify(o)));n.id=uid();n.name+=' (copia)';S.chars.push(n);charMenu='';save();openChars()},
  delchar:el=>{const o=S.chars.find(x=>x.id===el.dataset.id);openModal(`<h2>¿Borrar a ${esc(o.name)}?</h2><p>No se puede deshacer. Si quieres conservarla, copia antes su JSON.</p><div class="btns"><button class="b" data-act="chars">Cancelar</button><button class="b bad" data-act="delchar-ok" data-id="${o.id}">Borrar</button></div>`)},
  'delchar-ok':el=>{S.chars=S.chars.filter(x=>x.id!==el.dataset.id);if(!C())S.active=S.chars.length?S.chars[0].id:null;charMenu='';save();if(S.chars.length){render();openChars()}else{closeModal();S.tab='play';render()}},
  newchar:()=>{closeModal();const n=normalize(blank());S.chars.push(n);S.active=n.id;S.tab='edit';save();render()},
  import:()=>{const t=$('#imp-text').value.trim(),msg=$('#imp-msg');if(!t){msg.textContent='Pega primero el JSON de la ficha.';return}
    let data;try{data=JSON.parse(t.replace(/^```(json)?|```$/g,'').trim())}catch(e){msg.textContent='Ese texto no es JSON válido. Revisa que esté completo, de la primera { a la última }.';return}
    const arr=Array.isArray(data)?data:Array.isArray(data.chars)?data.chars:[data];let last;
    for(const x of arr){const n=normalize(x);n.spells.forEach(fillFromRef);if(S.chars.some(c=>c.id===n.id))n.id=uid();S.chars.push(n);last=n}
    S.active=last.id;S.tab='play';save();render();toast(`<div class="t-label">Importado</div><div class="t-parts">${arr.length} ficha${arr.length>1?'s':''}: ${esc(arr.map(x=>x.name||'Sin nombre').join(', '))}</div>`)},
  'copy-prompt':el=>copy(prompt4Claude(),el),
  'copy-exp':el=>copy(JSON.stringify(C(),null,2),el),
  'copy-all':el=>copy(JSON.stringify({chars:S.chars},null,2),el)};
function copy(text,btn){const old=btn.textContent;
  const ok=()=>{btn.textContent='Copiado';setTimeout(()=>btn.textContent=old,1600)};
  const fail=()=>{const t=$('#exp-text')||$('#imp-text');if(t){t.value=text;t.focus();t.select()}btn.textContent='Selecciónalo y cópialo';setTimeout(()=>btn.textContent=old,2500)};
  try{navigator.clipboard.writeText(text).then(ok,fail)}catch(e){fail()}}

/* ================= Eventos ================= */
document.addEventListener('click',e=>{
  if(e.target.id==='modal'){if(W)return;if(D){dLeave();D=null;closeModal();return}const wasPicker=!!P;closeModal();if(wasPicker){save();render()}return}
  const el=e.target.closest('[data-act]');
  if(restOpen&&!e.target.closest('.menuwrap')){restOpen=false;renderTop()}
  if(!el||el.disabled)return;const f=A[el.dataset.act];if(!f)return;e.preventDefault();
  if(el.dataset.act==='undo'){f(el);return}
  const before=JSON.stringify(S.chars),act=S.active;f(el);
  if(JSON.stringify(S.chars)!==before){UNDO.push({chars:before,active:act});if(UNDO.length>40)UNDO.shift();if(C())renderTop()}});
document.addEventListener('input',e=>{const el=e.target;
  if(D&&(el.id==='d-text'||el.id==='d-title')){const n=dGet(D.note);if(n){if(el.id==='d-text')n.text=el.value;else n.name=el.value;n.updated=Date.now();if(UNDO.length){UNDO.length=0;renderTop()}save()}return}
  if(D&&el.id==='d-pq'){D.pq=el.value;const pos=el.selectionStart;renderDiary();const q=$('#d-pq');if(q){q.focus();q.setSelectionRange(pos,pos)}return}
  if(D&&el.id==='d-q'){D.q=el.value;const pos=el.selectionStart;renderDiary();const q=$('#d-q');if(q){q.focus();q.setSelectionRange(pos,pos)}return}
  if(NI&&el.id==='ni-spl'){NI.spl=el.value;const nm=$('#ni-name');if(nm&&(!nm.value||nm.value===NI.auto)){niAutoName();nm.value=NI.name}return}
  if(el.id==='sp-q'){P.q=el.value;refreshPicker();return}
  if(W){
    if(el.id==='wz-name')W.name=el.value;else if(el.id==='wz-species')W.species=el.value;else if(el.id==='wz-background')W.background=el.value;
    else if(el.dataset.wab){const k=el.dataset.wab;W.base[k]=clamp(parseInt(el.value)||0,1,20);recomputeAb();const b=bgBonus(),lab=el.previousElementSibling;if(lab)lab.textContent=`${AB[k][2]}${b[k]?` +${b[k]}`:''} → ${W.ab[k]} (${sgn(mod(W.ab[k]))})`}
    else if(el.id==='wz-hproll'){W.hpRoll=el.value;W.hpMode='roll';const r=document.querySelector('input[name="wz-hp"][value="roll"]');if(r)r.checked=true}
    else if(el.id==='wz-feat')W.asi.feat=el.value;else if(el.id==='wz-feattext')W.asi.featText=el.value;
    refreshWizFoot();if(el.id==='wz-hproll'){const ps=[...document.querySelectorAll('#wz-body > p')];const last=ps[ps.length-1];if(last)last.innerHTML=`Ganas <b>${hpGain()} PG</b>: tus PG máximos pasan de ${C().hp.max} a <b>${C().hp.max+hpGain()}</b>.`}
    return}
  if(el.dataset&&el.dataset.actInput==='res-set'){const u=C().features[+el.dataset.i].uses;const v=parseInt(el.value);if(!isNaN(v)){u.used=clamp(u.max-v,0,u.max);save()}return}
  if(!el.dataset||!el.dataset.path)return;const c=C();
  UNDO.length=0;
  let v=el.dataset.bool?el.checked:el.dataset.num?(el.value===''?0:Number(el.value)):el.value;
  const ks=el.dataset.path.split('.');let t=c;for(let i=0;i<ks.length-1;i++)t=t[ks[i]];t[ks[ks.length-1]]=v;
  if(el.dataset.path==='level')c.level=clamp(+v||1,1,20);
  if(el.dataset.path==='classKey'){c.class=v?CL[v].n:c.class;c.subclassKey='';c.subclass=''}
  if(el.dataset.path==='subclassKey'){const s=subOf(c);c.subclass=s?s.n:''}
  if(el.dataset.path==='speciesKey'){c.lineageKey='';c.species=v?SPEC[v].n:c.species}
  if(el.dataset.path==='lineageKey'){const l=linOf(c.speciesKey,v);c.species=SPEC[c.speciesKey].n+(l?` (${l.n})`:'')}
  if(el.dataset.path==='backgroundKey'){c.background=v?BG[v].n:c.background}
  if(el.dataset.path.startsWith('coins.')){const tt=document.querySelector('.total');if(tt)tt.textContent=`Total: ${(totalCp(c)/100).toLocaleString('es-ES',{maximumFractionDigits:2})} PO en monedas`}
  save();renderTop()});
document.addEventListener('change',e=>{const el=e.target;
  if(el.id==='imp-file'&&el.files&&el.files[0]){const r=new FileReader();r.onload=()=>{$('#imp-text').value=r.result;$('#imp-msg').textContent='Archivo cargado. Pulsa «Importar».'};r.readAsText(el.files[0]);return}
  if(el.id==='story-img'&&el.files&&el.files[0]){loadPortrait(el.files[0]);el.value='';return}
  if(NI&&el.dataset&&el.dataset.ni){niCollect();if(el.id==='ni-cat'&&NI.cat==='pocion'&&!NI.pot)NI.pot='healing';if(el.id==='ni-ak'&&NI.ak)NI.qty=AMMO[NI.ak][1];if(el.id==='ni-gr'){NI.var='';const G=NI.gr&&NI.gr.startsWith('g:')&&GEAR[NI.gr.slice(2)];NI.qty=G&&G.qty?G.qty:1}if(el.id==='ni-mip'&&NI.mi){const P=MAGIC[NI.mip];NI.mi={att:P.att||0,ac:P.ac||0,sv:P.sv||0,ch:P.ch||0,rec:P.rec||'',d:P.d||'',noarm:P.noarm||0};if(NI.mip!=='other'&&(!NI.name||NI.name===NI.auto)){NI.name=P.n;NI.auto=P.n}itemModal();return}
    if(el.id==='ni-cat'){NI.gr='';if(NI.cat==='paquete'&&!NI.pack)NI.pack='explorer'}niAutoName();itemModal();return}
  if(CX&&el.dataset&&el.dataset.rr){const dn=k=>SUMMONS[k]?SUMMONS[k].n.replace(/^Invocar /,'').replace(/^./,m=>m.toUpperCase()):'';const oldS=CX.s,oldN=$('#cx-name')?$('#cx-name').value:'';
    creaCollect();if(CX.kind==='summon'&&CX.s!==oldS&&(!oldN||oldN===dn(oldS))){CX.name=dn(CX.s);CX.v=Object.keys(SUMMONS[CX.s].vars)[0];CX.L=SUMMONS[CX.s].L}creaModal();return}
  if(el.id==='sp-cls'){P.cls=el.value;refreshPicker();return}
  if(el.id==='sp-lvl'){P.lvl=el.value;refreshPicker();return}
  if(el.dataset&&el.dataset.actInput==='res-set'){render();return}
  if(W){
    if(el.id==='wz-class'){W.classKey=el.value;W.subKey='';W.origSub='';renderWizard();return}
    if(el.name==='wz-cls'){W.classKey=el.value;W.skills=[];W.spells=[];P=null;W._keepScroll=true;renderWizard();return}
    if(el.name==='wz-spec'){W.speciesKey=el.value;W.lineageKey='';W.skills=[];W._keepScroll=true;renderWizard();return}
    if(el.name==='wz-lin'){W.lineageKey=el.value;W._keepScroll=true;renderWizard();return}
    if(el.id==='wz-bg'){W.bgKey=el.value;W.bg2='';W.bg1='';W.skills=W.skills.filter(k=>!bgSkills().includes(k));recomputeAb();W._keepScroll=true;renderWizard();return}
    if(el.name==='wz-bgmode'){W.bgMode=el.value;recomputeAb();W._keepScroll=true;renderWizard();return}
    if(el.id==='wz-bg2'){W.bg2=el.value;if(W.bg1===W.bg2)W.bg1='';recomputeAb();W._keepScroll=true;renderWizard();return}
    if(el.id==='wz-bg1'){W.bg1=el.value;recomputeAb();refreshWizFoot();return}
    if(el.id==='wz-hfeat'){W.humanFeat=el.value;refreshWizFoot();return}
    if(el.name==='wz-hp'){W.hpMode=el.value;W._keepScroll=true;renderWizard();return}
    if(el.name==='wz-sub'){W.subKey=el.value;P=null;W._keepScroll=true;renderWizard();return}
    if(el.name==='wz-asi'){W.asi.mode=el.value;W.asi.a='';W.asi.b='';W._keepScroll=true;renderWizard();return}
    if(el.id==='wz-asi-a'){W.asi.a=el.value;refreshWizFoot();return}
    if(el.id==='wz-asi-b'){W.asi.b=el.value;refreshWizFoot();return}
    if(el.dataset.wab){refreshWizFoot();return}
    return}
  if(el.dataset&&el.dataset.rr)renderView()});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&restOpen){restOpen=false;renderTop()}
  if(e.key==='Escape'&&!$('#modal').hidden){if(P&&P.target==='edit'){A['sp-close']()}else closeModal()}
  if(e.key==='Enter'&&e.target.id==='hpAmt')A.hp({dataset:{m:'dmg'}});
  if(e.key==='Enter'&&e.target.id==='ni-name')A['item-add']()
  if(e.key==='Enter'&&e.target.id==='d-name'){const b=document.querySelector('.sheet [data-act=d-create],.sheet [data-act=d-rename-ok]');if(b)b.click()}});

load();render();
