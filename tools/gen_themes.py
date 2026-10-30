import urllib.parse,sys
def uri(svg,vb):
    s=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">{svg}</svg>'
    return 'url("data:image/svg+xml,'+urllib.parse.quote(s,safe=' =:/,.-()')+'")'
F='fill="#000"';S=lambda w:f'fill="none" stroke="#000" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"'
import math
def star4(cx,cy,r,i):return f'M{cx} {cy-r}L{cx+i} {cy-i}L{cx+r} {cy}L{cx+i} {cy+i}L{cx} {cy+r}L{cx-i} {cy+i}L{cx-r} {cy}L{cx-i} {cy-i}Z'
def rays(cx,cy,n,r1,r2,w):
    out=[]
    for k in range(n):
        a=2*math.pi*k/n;b=a+w;c=a-w
        out.append(f'M{cx+r1*math.cos(c):.1f} {cy+r1*math.sin(c):.1f}L{cx+r2*math.cos(a):.1f} {cy+r2*math.sin(a):.1f}L{cx+r1*math.cos(b):.1f} {cy+r1*math.sin(b):.1f}Z')
    return ''.join(out)
leaf=lambda x,y,s,rot:f'<g transform="translate({x} {y}) rotate({rot}) scale({s})"><path {F} d="M0 0C6-10 18-14 30-14C26-2 14 6 0 0Z"/></g>'
T={}
# ---------- motivos (tile, tamaño tile, esquina, emblema) ----------
T['druid']=dict(
 tile=uri(leaf(14,58,1,-20)+leaf(48,26,.8,30)+f'<path {S(1.5)} d="M10 62C20 50 34 40 52 30"/>','0 0 80 80'),ts='110px',
 corner=uri(f'<path {S(5)} d="M-10 300C60 250 110 200 150 120C175 70 200 40 250 10"/><path {S(3)} d="M95 215C120 225 150 222 175 205M140 140C165 145 190 140 210 120M60 255C70 275 80 290 100 300"/>'
   +''.join(leaf(x,y,s,r) for x,y,s,r in [(40,262,1.6,-60),(80,236,1.8,-10),(110,196,1.7,-70),(150,128,1.8,-20),(165,100,1.4,-80),(205,45,1.6,-30),(175,205,1.3,10),(210,120,1.3,-40),(98,298,1.2,-80)]),'0 0 300 300'),
 emblem=uri(leaf(4,22,0.7,-40)+leaf(12,16,0.7,10)+f'<path {S(2)} d="M2 30C10 22 18 12 28 4"/>','0 0 32 32'))
T['warlock']=dict(
 tile=uri(f'<path {F} d="{star4(20,18,6,1.5)}{star4(70,62,4,1)}"/><circle {F} cx="60" cy="20" r="1.5"/><circle {F} cx="18" cy="70" r="1.2"/><path {F} fill-rule="evenodd" d="M30 45Q45 31 60 45Q45 59 30 45ZM45 41a4 4 0 1 0 0.01 0Z"/>','0 0 90 90'),ts='120px',
 corner=uri(f'<circle {S(3)} cx="160" cy="160" r="140"/><circle {S(1.5)} cx="160" cy="160" r="120"/><circle {S(1.5)} cx="160" cy="160" r="70"/>'
   +''.join(f'<path {S(3)} d="M{160+128*math.cos(a):.0f} {160+128*math.sin(a):.0f}l{8*math.cos(a+1):.0f} {8*math.sin(a+1):.0f}m-4 -9l2 14"/>' for a in [k*math.pi/8 for k in range(16)])
   +f'<path {F} fill-rule="evenodd" d="M100 160Q160 100 220 160Q160 220 100 160ZM160 140a20 20 0 1 0 .01 0Z"/><circle {F} cx="160" cy="160" r="8"/>'
   +f'<path {S(2)} d="M160 20L281 230L39 230Z"/>','0 0 320 320'),
 emblem=uri(f'<path {F} fill-rule="evenodd" d="M2 16Q16 3 30 16Q16 29 2 16ZM16 11a5 5 0 1 0 .01 0Z"/><circle {F} cx="16" cy="16" r="2"/>','0 0 32 32'))
T['wizard']=dict(
 tile=uri(f'<path {F} d="{star4(35,30,12,2)}{star4(62,62,6,1.2)}"/><circle {F} cx="12" cy="60" r="1.6"/><circle {F} cx="60" cy="12" r="1.2"/>','0 0 80 80'),ts='100px',
 corner=uri(f'<circle {S(2.5)} cx="160" cy="160" r="150"/><circle {S(1.5)} cx="160" cy="160" r="132"/><path {S(2)} d="M160 28L274 226L46 226ZM160 292L46 94L274 94Z"/><circle {S(2)} cx="160" cy="160" r="60"/>'
   +''.join(f'<circle {F} cx="{160+132*math.cos(a):.0f}" cy="{160+132*math.sin(a):.0f}" r="6"/>' for a in [math.pi/6+k*math.pi/3 for k in range(6)])
   +f'<path {F} d="{star4(160,160,26,5)}"/>','0 0 320 320'),
 emblem=uri(f'<path {F} d="{star4(14,16,12,2.5)}{star4(26,6,5,1)}"/>','0 0 32 32'))
T['barbarian']=dict(
 tile=uri(f'<path {S(3)} d="M20 15C30 35 34 55 30 75M34 12C44 32 48 52 44 72M48 10C58 30 62 50 58 70"/>','0 0 90 90'),ts='130px',
 corner=uri(f'<path {F} d="M60 20C110 90 130 190 100 300L118 300C150 190 132 90 74 18ZM120 10C170 80 190 180 160 290L178 290C210 180 192 80 134 8ZM180 0C230 70 250 170 220 280L238 280C270 170 252 70 194 -2Z"/>','0 0 300 300'),
 emblem=uri(f'<path {S(3)} d="M8 4C12 12 13 20 10 28M16 3C20 11 21 19 18 27M24 2C28 10 29 18 26 26"/>','0 0 32 32'))
T['bard']=dict(
 tile=uri(f'<ellipse {F} cx="24" cy="54" rx="8" ry="6" transform="rotate(-20 24 54)"/><path {S(2.5)} d="M31 52V18C38 22 44 26 46 34"/><ellipse {F} cx="62" cy="30" rx="5" ry="4" transform="rotate(-20 62 30)"/><path {S(2)} d="M67 29V10"/>','0 0 80 80'),ts='110px',
 corner=uri(''.join(f'<path {S(2)} d="M0 {120+i*16}C80 {80+i*16} 160 {160+i*16} 320 {100+i*16}"/>' for i in range(5))
   +''.join(f'<ellipse {F} cx="{x}" cy="{y}" rx="11" ry="8" transform="rotate(-20 {x} {y})"/><path {S(3)} d="M{x+10} {y-2}V{y-50}"/>' for x,y in [(60,130),(140,170),(220,150),(290,120)]),'0 0 320 260'),
 emblem=uri(f'<ellipse {F} cx="10" cy="24" rx="6" ry="4.5" transform="rotate(-20 10 24)"/><path {S(2.5)} d="M15 23V5C21 8 25 12 26 18"/>','0 0 32 32'))
T['cleric']=dict(
 tile=uri(f'<circle {F} cx="35" cy="35" r="6"/><path {F} d="{rays(35,35,8,9,18,0.18)}"/>','0 0 70 70'),ts='90px',
 corner=uri(f'<path {F} d="{rays(300,0,28,40,330,0.035)}"/><circle {F} cx="300" cy="0" r="30"/>','0 0 300 300'),
 emblem=uri(f'<circle {F} cx="16" cy="16" r="6"/><path {F} d="{rays(16,16,12,8,15,0.16)}"/>','0 0 32 32'))
T['fighter']=dict(
 tile=uri(f'<path {S(2)} d="M14 46L46 14M46 46L14 14M10 38l12 12M38 10l12 12M38 50l12-12M10 22l12-12"/>','0 0 60 60'),ts='70px',
 corner=uri(f'<path {S(5)} d="M160 30C210 50 250 50 280 40C285 150 250 230 160 290C70 230 35 150 40 40C70 50 110 50 160 30Z"/><path {S(4)} d="M90 90L230 230M230 90L90 230M75 115l40 -40M205 75l40 40"/>','0 0 320 320'),
 emblem=uri(f'<path {S(2.5)} d="M6 26L26 6M26 26L6 6M4 20l8 8M20 4l8 8"/>','0 0 32 32'))
T['monk']=dict(
 tile=uri(''.join(f'<path {S(1.6)} d="M{cx-r} {cy}A{r} {r} 0 0 1 {cx+r} {cy}"/>' for cx,cy in [(0,40),(40,40),(80,40),(20,20),(60,20),(20,60),(60,60)] for r in (18,12,6)),'0 0 80 80'),ts='70px',
 corner=uri(f'<path {S(22)} d="M200 60C120 40 50 100 55 180C60 255 140 300 210 275C270 252 290 190 270 135"/>','0 0 320 320'),
 emblem=uri(f'<path {S(4)} d="M20 5C11 3 4 10 5 18C6 26 14 30 21 27C27 24 29 18 27 12"/>','0 0 32 32'))
T['paladin']=dict(
 tile=uri(f'<path {S(1.2)} d="M30 0L60 30L30 60L0 30Z"/><path {F} d="M28 22h4v6h6v4h-6v10h-4V32h-6v-4h6z"/>','0 0 60 60'),ts='60px',
 corner=uri(f'<path {S(6)} d="M160 20H290V130C290 210 230 265 160 300C90 265 30 210 30 130V20Z"/><path {F} d="M148 60h24v60h60v24h-60v110h-24V144H88v-24h60z"/>','0 0 320 320'),
 emblem=uri(f'<path {S(2.5)} d="M16 3H28V14C28 21 22 26 16 29C10 26 4 21 4 14V3Z"/><path {F} d="M15 8h2v6h5v2h-5v8h-2v-8h-5v-2h5z"/>','0 0 32 32'))
T['ranger']=dict(
 tile=uri(''.join(f'<path {S(1.3)} d="M{60-r} 60C{60-r} {60-r*0.8} {60+r*0.6} {60-r} {60+r} {60-r*0.3}C{60+r*1.1} {60+r*0.6} {60-r*0.2} {60+r} {60-r} 60Z"/>' for r in (12,24,36,48)),'0 0 120 120'),ts='150px',
 corner=uri(f'<path {F} d="M160 10L180 140L310 160L180 180L160 310L140 180L10 160L140 140Z"/><path {S(2)} d="M160 60L230 160L160 260L90 160Z"/><circle {S(3)} cx="160" cy="160" r="110"/>','0 0 320 320'),
 emblem=uri(f'<path {F} d="M16 1L18 14L31 16L18 18L16 31L14 18L1 16L14 14Z"/>','0 0 32 32'))
T['rogue']=dict(
 tile=uri(f'<path {F} d="M40 8L44 40H36Z"/><path {S(2.5)} d="M30 42H50M40 42V54"/><circle {F} cx="40" cy="57" r="3"/>','0 0 80 80'),ts='110px',
 corner=uri(f'<g transform="rotate(35 160 160)"><path {F} d="M160 10L176 200H144Z"/><path {S(8)} d="M120 205H200M160 205V255"/><circle {F} cx="160" cy="268" r="12"/></g><g transform="rotate(-35 160 160)"><path {F} d="M160 10L176 200H144Z"/><path {S(8)} d="M120 205H200M160 205V255"/><circle {F} cx="160" cy="268" r="12"/></g>','0 0 320 320'),
 emblem=uri(f'<path {F} d="M16 2L18.5 20H13.5Z"/><path {S(2.5)} d="M10 21H22M16 21V27"/><circle {F} cx="16" cy="29" r="2"/>','0 0 32 32'))
T['sorcerer']=dict(
 tile=uri(f'<path {S(1.6)} d="M0 30A20 20 0 0 1 40 30M-20 10A20 20 0 0 1 20 10M20 10A20 20 0 0 1 60 10"/>','0 0 40 20'),ts='44px 22px',
 corner=uri(f'<path {F} d="M160 310C90 300 50 250 60 190C70 140 110 120 105 60C150 90 170 130 165 170C185 150 190 120 185 95C240 140 270 200 255 245C240 290 200 310 160 310ZM160 290C200 285 220 255 210 220C200 240 185 250 170 245C180 215 165 190 150 180C150 210 120 225 120 255C120 275 135 288 160 290Z" fill-rule="evenodd"/>','0 0 320 320'),
 emblem=uri(f'<path {F} d="M16 31C9 30 5 25 6 19C7 14 11 12 10 5C15 8 17 12 16.5 16C18.5 14 19 11 18.5 8.5C24 13 27 20 25.5 24.5C24 29 20 31 16 31Z"/>','0 0 32 32'))

# ---------- paletas: (fondo, superficie, hundido, tinta, apagado, línea, acento, tinta-acento, acento-suave, arte) ----------
P={
'barbarian':(('#f3ece6','#fffaf6','#f7efe8','#2a1d17','#6e5a4f','#e2d3c7','#a3361f','#ffffff','#f6dfd6','rgba(163,54,31,.13)'),('#1a1210','#241a17','#1e1613','#f1e6df','#b49c90','#3d2c26','#e8714f','#1a0d08','#3d211a','rgba(232,113,79,.12)'),"'Pirata One'",'3px','none'),
'bard':(('#f6eef4','#fffbfe','#f8f0f6','#2a1a28','#6d5a6a','#e7d6e3','#9c2f78','#ffffff','#f6dcef','rgba(156,47,120,.12)'),('#1a1119','#251a24','#1f151e','#f3e6f0','#b79fb2','#3e2c3b','#e58bc6','#1f0b19','#40213a','rgba(229,139,198,.12)'),"'Playfair Display SC'",'14px','0 6px 24px rgba(156,47,120,.10)'),
'cleric':(('#f7f3e8','#fffdf7','#f9f5ea','#2b2617','#6f6650','#e8dfc6','#946508','#ffffff','#f5e9c8','rgba(196,146,30,.16)'),('#17150f','#221f16','#1c1a12','#f3eedf','#b8ad8f','#3a3424','#e9c060','#1c1606','#3c321a','rgba(233,192,96,.12)'),"'Cinzel'",'10px','0 6px 26px rgba(196,146,30,.12)'),
'druid':(('#eef5ea','#fbfdf8','#f1f7ec','#1b2a1c','#586a57','#d3e3cd','#3e7d34','#ffffff','#dcefd5','rgba(62,125,52,.15)'),('#0f1710','#172119','#121b13','#e5f0e2','#9db59a','#2a3a2b','#8fd17f','#0c1a0a','#1f3a1f','rgba(143,209,127,.11)'),"'Uncial Antiqua'",'18px','0 6px 22px rgba(62,125,52,.10)'),
'fighter':(('#eceef1','#ffffff','#f2f4f6','#1a1f27','#59616d','#c9cfd7','#8b2a2a','#ffffff','#f1dddd','rgba(60,72,88,.12)'),('#111418','#1b1f25','#15181d','#e7eaee','#9aa3ae','#353c46','#e07a6e','#1c0a08','#3a2222','rgba(154,163,174,.10)'),"'Saira Stencil One'",'3px','inset 0 0 0 1px var(--line)'),
'monk':(('#f6f1e7','#fffcf5','#f8f3e9','#24201a','#6b6253','#e6dccb','#b4520f','#ffffff','#f8e2cf','rgba(36,32,26,.10)'),('#16130f','#211d17','#1b1813','#f1ebe1','#b3a894','#39322a','#f0954f','#1e0f04','#3d2817','rgba(241,235,225,.08)'),"'Philosopher'",'12px','none'),
'paladin':(('#eef1f8','#fcfdff','#f1f4fa','#172036','#56607a','#d4dbea','#2b4c9b','#ffffff','#dde5f6','rgba(176,138,42,.16)'),('#0f1320','#181e2e','#131828','#e6ebf7','#9da8c2','#2a3350','#8fb0ff','#0b1430','#1e2a4a','rgba(226,190,96,.11)'),"'Cinzel Decorative'",'6px','0 0 0 3px var(--surface), 0 0 0 4px var(--line)'),
'ranger':(('#f0f1e8','#fcfcf7','#f3f4ec','#1f2419','#5f6654','#dcdecd','#4f6b2a','#ffffff','#e3ead2','rgba(110,84,50,.14)'),('#121510','#1c2018','#161a13','#e9ecdf','#a6ad95','#303627','#b2cc72','#141a06','#2b3520','rgba(178,204,114,.09)'),"'IM Fell English SC'",'8px','none'),
'rogue':(('#e9e8ec','#fbfbfc','#f0eff2','#1b1a20','#5c5a66','#d4d2da','#4a3f6b','#ffffff','#e3dff0','rgba(27,26,32,.10)'),('#0d0d10','#17171c','#121216','#e6e5ea','#96949f','#2a2a31','#a99be0','#120e24','#2a2540','rgba(169,155,224,.08)'),"'Special Elite'",'6px','0 10px 30px rgba(0,0,0,.18)'),
'sorcerer':(('#f8eeea','#fffaf8','#faf1ed','#2b1715','#715652','#ecd6cf','#b8331d','#ffffff','#f9ddd5','rgba(184,51,29,.12)'),('#190f0d','#251715','#1f1311','#f6e7e3','#bf9f97','#432a25','#ff8a5c','#260b03','#44221a','rgba(255,138,92,.11)'),"'Metamorphous'",'12px','0 6px 26px rgba(184,51,29,.12)'),
'warlock':(('#efebf6','#fcfbff','#f3f0fa','#1f1830','#625a78','#dcd5ec','#6a3fb5','#ffffff','#e6dcf8','rgba(106,63,181,.14)'),('#0e0a17','#18122a','#130e22','#ece6fb','#a79dc6','#2e2548','#b98cff','#160a2c','#2d1f4d','rgba(185,140,255,.13)'),"'Grenze Gotisch'",'12px','0 0 0 1px rgba(106,63,181,.12), 0 10px 34px rgba(106,63,181,.16)'),
'wizard':(('#ebf3fb','#fbfdff','#eef5fc','#142235','#536379','#cfdff0','#1f6fc2','#ffffff','#d8e9fa','rgba(64,150,230,.18)'),('#0b1220','#121c30','#0e1728','#e3eefc','#94a9c6','#233453','#7cc4ff','#06182c','#16304f','rgba(124,196,255,.15)'),"'Marcellus SC'",'12px','0 0 0 1px rgba(64,150,230,.10), 0 8px 30px rgba(64,150,230,.16)'),
}
names=['--bg','--surface','--sunk','--ink','--muted','--line','--accent','--accent-ink','--accent-soft','--art']
out=['/* Temas por clase: se activan con data-class en <html>. Generado; edita gen_themes.py en vez de este archivo. */']
for k,(lt,dk,font,rad,shadow) in P.items():
    t=T[k]
    tok=lambda pal:';'.join(f'{n}:{v}' for n,v in zip(names,pal))
    out.append(f':root[data-class="{k}"]{{{tok(lt)};--f-display:{font},var(--f-fallback);--radius:{rad};--card-shadow:{shadow};--tile:{t["tile"]};--tile-size:{t["ts"]};--corner:{t["corner"]};--emblem:{t["emblem"]}}}')
    out.append(f'@media (prefers-color-scheme: dark){{:root[data-class="{k}"]:not([data-theme="light"]){{{tok(dk)};color-scheme:dark}}}}')
    out.append(f':root[data-class="{k}"][data-theme="dark"]{{{tok(dk)};color-scheme:dark}}')
open(sys.argv[1],'w').write('\n'.join(out)+'\n')
print('ok',sum(len(x) for x in out))
