# Genera data/monsters.js a partir del SRD 5.2 (5e-bits/5e-database, src/2024/en/5e-SRD-Monsters.json) y de las traducciones tr*.txt.
# Uso: python3 tools/bestiario/gen.py ruta/a/5e-SRD-Monsters.json [--strict]
# Formato de tr*.txt: «@id|Nombre», y luego T (rasgo), A (ataque: nombre|bono|daño), X (otra acción), B (acción adicional),
# R (reacción) y L (acción legendaria), en el mismo orden que en el SRD. «*CLAVE» usa un texto de MAC; «*SP» crea la lista de conjuros.
import json,re,sys,glob,os
HERE=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.dirname(os.path.dirname(HERE))
src=sys.argv[1]
beasts=os.path.join(ROOT,'data','beasts.js')
outp=os.path.join(ROOT,'data','monsters.js')
strict='--strict' in sys.argv
d=json.load(open(src))
have=set(re.findall(r'"id":"([^"]+)"',open(beasts).read()))
TYPE={'beast':'Bestia','monstrosity':'Monstruosidad','dragon':'Dragón','fiend':'Infernal','humanoid':'Humanoide','undead':'Muerto viviente','elemental':'Elemental','fey':'Feérico','celestial':'Celestial','construct':'Constructo','giant':'Gigante','aberration':'Aberración','plant':'Planta','swarm of tiny beasts':'Enjambre de bestias diminutas','ooze':'Cieno','swarm of tiny undead':'Enjambre de muertos vivientes diminutos'}
SIZE={'Gargantuan':'Gargantuesco','Medium':'Mediano','Tiny':'Diminuto','Medium or small':'Mediano o pequeño','Small':'Pequeño','Huge':'Enorme','Large':'Grande'}
DMG={'piercing':'perforante','poison':'veneno','radiant':'radiante','fire':'fuego','lightning':'relámpago','bludgeoning':'contundente','acid':'ácido','psychic':'psíquico','cold':'frío','slashing':'cortante','necrotic':'necrótico','thunder':'trueno','force':'fuerza',
 'damage type chosen for the draconic origin trait below':'el tipo de su origen dracónico',
 'piercing damage from weapons wielded by creatures under the effect of a bless spell':'perforante de armas empuñadas por criaturas bajo el efecto de Bendición'}
COND={'paralyzed':'Paralizado','blinded':'Cegado','deafened':'Ensordecido','exhaustion':'Agotamiento','grappled':'Agarrado','unconscious':'Inconsciente','frightened':'Asustado','stunned':'Aturdido','prone':'Derribado','poisoned':'Envenenado','restrained':'Apresado','charmed':'Hechizado','incapacitated':'Incapacitado','petrified':'Petrificado'}
LNAME={'Common':'común','Primordial':'primordial','Aquan':'acuano','Auran':'aurano','Ignan':'ignano','Terran':'terrano','Goblin':'goblin','Abyssal':'abisal','Celestial':'celestial','Infernal':'infernal','Giant':'gigante','Elvish':'élfico','Sylvan':'silvano','Deep Speech':'habla profunda','Draconic':'dracónico','Undercommon':'infracomún','Druidic':'druídico','Gnoll':'gnoll','Sahuagin':'sahuagin','Otyugh':'otyugh','Worg':'huargo','Thieves’ Cant':'jerga de ladrones','Blink Dog':'perro intermitente'}
def lang(s):
    if s=='None': return ''
    if s=='All': return 'todos'
    s=s.replace('All;','todos;')
    s=re.sub(r'Understands commands given in any language but can’t speak','entiende órdenes en cualquier idioma pero no habla',s)
    s=re.sub(r'(?i)understands (.+?) but can’t speak(?: them)?',lambda m:'entiende '+m.group(1)+' pero no habla',s)
    s=re.sub(r'telepathy (\d+) ft\.',r'telepatía \1 pies',s)
    s=s.replace(' (doesn’t allow the receiving creature to respond telepathically)',' (no le pueden responder por telepatía)')
    s=s.replace(' (works only with creatures that understand Abyssal)',' (solo con quien entienda abisal)')
    s=re.sub(r'\(can’t speak in (\w+) form\)',lambda m:'(no habla en forma de '+{'wolf':'lobo','rat':'rata','tiger':'tigre','bear':'oso','boar':'jabalí'}[m.group(1)]+')',s)
    s=re.sub(r'plus (one|two|three|five) other languages?',lambda m:'y '+{'one':'otro idioma','two':'otros dos idiomas','three':'otros tres idiomas','five':'otros cinco idiomas'}[m.group(1)],s)
    for k in sorted(LNAME,key=len,reverse=True): s=s.replace(k,LNAME[k])
    s=s.replace(', and ',' y ').replace(' and ',' y ')
    return s
def ft(v): return v.replace(' ft.',' pies')
SP={'fly':'volar','swim':'nadar','climb':'trepar','burrow':'excavar'}
def speed(sp):
    o=[ft(sp['walk'])]
    for k in ['fly','swim','climb','burrow']:
        if k in sp: o.append(SP[k]+' '+ft(sp[k])+(' (levitar)' if k=='fly' and sp.get('hover') else ''))
    return ', '.join(o)
SEN={'darkvision':'visión en la oscuridad','blindsight':'vista ciega','truesight':'visión verdadera','tremorsense':'sentido del temblor'}
def senses(s):
    o=[SEN[k]+' '+ft(v) for k,v in s.items() if k in SEN]
    o.append('Percepción pasiva %d'%s['passive_perception'])
    return ', '.join(o)
def dl(L): return ', '.join(DMG.get(x,x) for x in L)
def res(m):
    o=[]
    if m['damage_vulnerabilities']: o.append('Vulnerable a: '+dl(m['damage_vulnerabilities']))
    if m['damage_resistances']: o.append('Resistencias: '+dl(m['damage_resistances']))
    if m['damage_immunities']: o.append('Inmunidades: '+dl(m['damage_immunities']))
    if m['condition_immunities']: o.append('Inmune a: '+', '.join(COND[c['index']] for c in m['condition_immunities']))
    return '. '.join(o)
def crs(c):
    return {0.125:'1/8',0.25:'1/4',0.5:'1/2'}.get(c,str(int(c)) if c==int(c) else str(c))
# Traducciones
SPN={}
for x in json.loads(re.search(r'window\.SPELLS=(\[.*\]);?\s*$',open(os.path.join(ROOT,'data','spells.js'),encoding='utf8').read(),re.S).group(1)):
    SPN[x['id']]=(x['n'],x['l'])
ABN={'str':'Fuerza','dex':'Destreza','con':'Constitución','int':'Inteligencia','wis':'Sabiduría','cha':'Carisma'}
def spells(sc):
    g={}
    for sp in sc['spells']:
        u=sp.get('usage') or {'type':'at will'}
        k='A voluntad' if u['type']=='at will' else ('%d/día cada uno'%u['times'] if u['type']=='per day' else u['type'])
        n,l=SPN.get(sp['index'],{'geas':('Geas',5)}.get(sp['index'],(sp['name'],sp['level'])))
        if sp['index'] not in SPN and n==sp['name'] and sp['index']!='geas': print('Conjuro sin traducir:',sp['index'],file=sys.stderr)
        g.setdefault(k,[]).append(n+(' (nivel %d)'%sp['level'] if sp['level']>l and l>0 else ''))
    mat='' if 'M' in sc.get('components_required',['M']) else ' Sin componentes materiales.'
    bits=[]
    if sc.get('dc') is not None: bits.append('CD %d'%sc['dc'])
    if sc.get('modifier') is not None: bits.append('%+d para impactar con conjuros'%sc['modifier'])
    o='Aptitud: %s%s.%s '%(ABN[sc['ability']['index']],' (%s)'%', '.join(bits) if bits else '',mat)
    return o+' '.join('%s: %s.'%(k,', '.join(v)) for k,v in g.items())
MAC={'SW':'Puede ocupar el espacio de otra criatura (y al revés) y pasar por huecos para criaturas Diminutas. No recupera PG ni gana PG temporales.',
     'IW':'Se mueve y trepa por superficies heladas sin hacer pruebas, y el terreno difícil de hielo o nieve no le cuesta movimiento extra.',
     'INC':'Atraviesa criaturas y objetos como si fueran terreno difícil. Si acaba su turno dentro de un objeto, recibe 1d10 de fuerza.',
     'VW':'Tiene estas debilidades:',
     'VFORB':'No puede entrar en una vivienda sin la invitación de alguien que viva allí.',
     'VWATER':'Recibe 20 de ácido si acaba su turno en agua corriente.',
     'VSUN':'Recibe 20 radiante si empieza su turno a la luz del sol. Con luz solar, desventaja en ataques y pruebas de característica.',
     'VSTAKE':'Si le clavan en el corazón un arma perforante mientras está Incapacitado en su lugar de descanso, queda Paralizado hasta que se la quiten.',
     'VMIST':'Si cae a 0 PG fuera de su lugar de descanso, se convierte en niebla sin gastar acción (si no puede, queda destruido). Con 0 PG en forma de niebla no puede volver a su forma y debe llegar a su lugar de descanso en 2 horas o queda destruido. Allí vuelve a su forma, Paralizado hasta recuperar PG, y recupera 1 PG tras 1 hora.',
     'VCHARM':'Lanza Hechizar persona sin componentes (Carisma, CD 17) con duración de 24 horas. El objetivo se deja morder de buen grado y el daño del mordisco no rompe el hechizo. Al acabar, no sabe que lo hechizaron.',
     'VSHAPE':'Si no está al sol ni en agua corriente, se convierte en un murciélago Diminuto (velocidad 5 pies, volar 30), en una nube de niebla Mediana (velocidad 5 pies, volar 20, levitar) o vuelve a su forma. Lo que lleva se transforma con él. Como murciélago no habla. Como niebla no puede actuar, hablar ni coger objetos; no pesa, puede entrar en el espacio de un enemigo, pasa por donde pase el aire (no por líquidos) y tiene resistencia a todo el daño salvo el del sol.',
     'VBITE':'Salvación de Constitución CD 17, una criatura a 5 pies voluntaria, Agarrada, Incapacitada o Apresada. Falla: 1d4 + 4 perforante + 3d8 necrótico; sus PG máximos bajan tanto como el daño necrótico y el vampiro recupera esos PG. Un humanoide que muera así y sea enterrado se levanta al siguiente atardecer como engendro vampírico a su servicio.',
     'VBEG':'Lanza Orden imperiosa sin componentes (Carisma, CD 17). No puede repetirla hasta el inicio de su turno.',
     'VSTRIKE':'Se mueve hasta la mitad de su velocidad y hace un ataque de Golpe sepulcral.',
     'WSHAPE':'Se transforma en híbrido o en animal, o vuelve a su forma humanoide. Solo cambia su tamaño; el equipo no se transforma.',
     'PT':'Ventaja al atacar a una criatura si un aliado suyo (no Incapacitado) está a 5 pies de ella.',
     'SS':'Desventaja en pruebas de característica y ataques a la luz del sol.',
     'FLY':'No provoca ataques de oportunidad al salir volando del alcance de un enemigo.',
     'IF':'No puede cambiar de forma.',
     'PARRY':'Cuando le impacta un ataque cuerpo a cuerpo y empuña un arma, suma {} a la CA contra ese ataque, que puede fallar.',
     'LR':'Si falla una tirada de salvación, puede decidir superarla.',
     'MR':'Ventaja en las salvaciones contra conjuros y otros efectos mágicos.',
     'AMF':'Respira aire y agua.',
     'SC':'Trepa por superficies difíciles, incluso por el techo, sin hacer pruebas.',
     'AMO':'Pasa por huecos de 1 pulgada de ancho sin gastar movimiento extra.',
     'DR':'Si muere fuera de los Nueve Infiernos, su cuerpo se deshace en humo de azufre y revive al instante con todos sus PG en algún lugar de los Nueve Infiernos.',
     'AR':'Si muere fuera del Abismo, su cuerpo se deshace en icor y revive al instante con todos sus PG en algún lugar del Abismo.'}
def usage(u):
    if not u: return ''
    if u['type']=='recharge on roll': return ' (recarga %s)'%('6' if u['min_value']==6 else '%d-6'%u['min_value'])
    if u['type']=='per day': return ' (%d/día%s)'%(u['times'],', %d en su guarida'%u['times_in_lair'] if u.get('times_in_lair') else '')
    if u['type']=='recharge after rest': return ' (se recupera con un descanso corto o largo)'
    return ''
TR={}
cur=None
for f in sorted(glob.glob(os.path.join(HERE,'tr*.txt'))):
    for ln in open(f,encoding='utf8'):
        ln=ln.rstrip('\n')
        if not ln.strip() or ln.startswith('#'): continue
        if ln.startswith('@'):
            i,n=ln[1:].split('|',1)
            if i in TR: print('Repetida:',i,file=sys.stderr)
            cur=TR[i]={'n':n.strip(),'tr':[],'act':[],'bo':[],'re':[],'lg':[]}; continue
        k,rest=ln.split('|',1); p=[x.strip() for x in rest.split('|')]
        key={'T':'tr','A':'act','X':'act','B':'bo','R':'re','L':'lg'}[k]
        if k=='A' and len(p)!=3 or k!='A' and len(p)!=2: print('Formato raro:',i,ln,file=sys.stderr)
        cur[key].append((k,p))
SRCK={'tr':'special_abilities','act':'actions','bo':'bonus_actions','re':'reactions','lg':'legendary_actions'}
def build(m,t):
    o={'tr':[],'at':[],'ex':[],'bo':[],'re':[],'lg':[]}
    for k,sk in SRCK.items():
        src=m.get(sk) or []
        if len(src)!=len(t[k]): print('Cuenta distinta:',m['index'],k,len(src),len(t[k]),file=sys.stderr)
        for a,(typ,p) in zip(src,t[k]):
            p=list(p)
            if p[0]=='-': continue
            p[0]+=usage(a.get('usage'))
            if p[-1].startswith('*'):
                mk=p[-1][1:]
                if mk=='SP':
                    sc=a.get('spellcasting')
                    if not sc: print('Sin conjuros:',m['index'],file=sys.stderr); p[-1]=''
                    else: p[-1]=spells(sc)
                else: p[-1]=MAC[mk]
            if typ=='A':
                if a.get('attack_bonus') is not None and '%+d'%a['attack_bonus']!=p[1]: print('Bono distinto:',m['index'],p,a['attack_bonus'],file=sys.stderr)
                o['at'].append(p)
            elif k=='act': o['ex'].append(p)
            else: o[k].append(p)
    return o
out=[];miss=[]
for m in d:
    if m['index'] in have: continue
    t=TR.get(m['index'])
    if t: t=dict(t,**build(m,t),n=t['n'])
    else:
        miss.append(m['index'])
        if strict: continue
        f=lambda k:[[a['name']+usage(a.get('usage')),a['desc']] for a in m.get(k) or []]
        t={'n':m['name'],'tr':f('special_abilities'),'at':[],'ex':f('actions'),'bo':f('bonus_actions'),'re':f('reactions'),'lg':f('legendary_actions')}
    ab=[m[k] for k in ['strength','dexterity','constitution','intelligence','wisdom','charisma']]
    e={'id':m['index'],'n':t['n'],'en':m['name'],'t':TYPE[m['type']],'sz':SIZE[m['size']],'cr':m['challenge_rating'],'crs':crs(m['challenge_rating']),
       'ac':m['armor_class'][0]['value'],'hp':m['hit_points'],'hd':m['hit_points_roll'],'sp':speed(m['speed']),'fly':'fly' in m['speed'],'ab':ab,
       'sen':senses(m['senses']),'res':res(m),'lang':lang(m['languages']),'tr':t['tr'],'at':t['at'],'ex':t['ex']}
    # Salvaciones con competencia (las demás son el modificador): lista de 6, null si no tiene
    SVK=['str','dex','con','int','wis','cha']
    sv=[None]*6
    for pf in m.get('proficiencies') or []:
        ix=pf['proficiency']['index']
        if ix.startswith('saving-throw-'): sv[SVK.index(ix[13:])]=pf['value']
    if any(x is not None for x in sv): e['sv']=sv
    for k in ['bo','re','lg']:
        if t[k]: e[k]=t[k]
    out.append(e)
if miss: print('Sin traducir:',len(miss),' '.join(miss[:8]),file=sys.stderr)
extra=set(TR)-{m['index'] for m in d}
if extra: print('Traducciones sin criatura:',extra,file=sys.stderr)
open(outp,'w',encoding='utf8').write('/* Resto de criaturas del SRD 5.2 (reglas de 2024) para el bestiario del máster, traducidas y resumidas. Datos: 5e-bits/5e-database (MIT); contenido: SRD 5.2, CC-BY 4.0 */\nconst MONSTERS='+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';\n')
print(len(out),'criaturas')
