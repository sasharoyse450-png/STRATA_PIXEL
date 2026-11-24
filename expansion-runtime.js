'use strict';
S.storage||={};S.mobDead||=[];S.objectState||={};
W.mobs=W.mobs.filter(m=>!S.mobDead.includes(m.uid));
for(const [id,v] of Object.entries(extraItems))if(v[2]==='build')decor.push(id);
for(const [id,v] of Object.entries(extraItems))if(v[2]==='ore')oreColors[id]=['#333943',v[3],v[3],'#f0e9d0'];
const objKey=o=>o.id+':'+o.x+','+o.y;
const stateOf=o=>S.objectState[objKey(o)]||={};
const tier={pick:1,bronzepick:2,ironpick:3,steelpick:4,gemPick:5};
const oldDifficulty=difficulty;
difficulty=function(a,id){if(a.id==='tree')return id==='ironaxe'?.34:oldDifficulty(a,id);if(['dirt','grass'].includes(a.id)&&id==='ironshovel')return .1;if(['stone','coal','iron','crystal','outcrop',...Object.keys(oreColors)].includes(a.id)){const required={silver:2,gold:3,crystal:3,outcrop:3,ruby:4,sapphire:4,obsidian:4}[a.id]||1;return (tier[id]||0)>=required?(times[a.id]||1)/(1+(tier[id]-1)*.65):Infinity;}return oldDifficulty(a,id);};
const oldTarget=targetAt;
targetAt=function(x,y){const gx=Math.floor(x/T),gy=Math.floor(y/T),o=getObj(gx,gy);if(o&&['mushroom','blossom','cart'].includes(o.id))return{id:o.id,o,gx,gy};return oldTarget(x,y);};
const oldAdd=add;
add=function(id,n=1){oldAdd(id,n);if(id==='wood'){oldAdd('fiber',2);oldAdd('resin');}if(id==='berries')oldAdd('seed');};
const oldDamage=damage;
damage=function(n){oldDamage(Math.max(1,Math.round(n*(S.inventory.armor>0?.75:1)*(S.inventory.amulet>0?.85:1))));};
const foods={mushroom:[12,0],roast:[40,8],bread:[30,0],potion:[0,45],bandage:[0,20]};
const oldEat=eat;
eat=function(){const id=tool(),v=foods[id];if(!v)return oldEat();if(!S.inventory[id]){hint('Запас закончился');return true;}if((!v[0]||S.p.food>=100)&&(!v[1]||S.p.hp>=100)){hint('Сейчас не требуется');return true;}use(id);S.p.food=Math.min(100,S.p.food+v[0]);S.p.hp=Math.min(100,S.p.hp+v[1]);refresh();save();notify(items[id][0]+' · использовано');return true;};
const names={rabbit:'Заяц',beetle:'Пещерный жук',boar:'Кабан',wolf:'Северный волк',slime:'Слизень',bat:'Летучая мышь'};
const oldMine=mine;
mine=function(dt,x,y){if(!(S.inventory[tool()]>0)){hint('Выбранного предмета нет в рюкзаке');return;}const m=W.mobs.find(m=>Math.hypot(m.x-x,m.y-5-y)<15&&inReach(m.x,m.y));if(m){if(swing.repeat>0)return;const hit={sword:18,ironsword:32,rubySword:52,axe:9,ironaxe:16}[tool()]||5;m.hp-=hit;swing.repeat=.4;swing.anim=.3;sparks(m.x,m.y-5,'#dca879',6);if(m.hp<=0){const loot={rabbit:{meat:1,hide:1},beetle:{shell:2},boar:{meat:2,hide:2},wolf:{fang:2,hide:1},slime:{gel:2},bat:{wing:2}}[m.type];for(const [id,n]of Object.entries(loot))add(id,n);S.mobDead.push(m.uid);W.mobs.splice(W.mobs.indexOf(m),1);notify(names[m.type]+' · добыча в рюкзаке');refresh();save();}else notify(names[m.type]+' · '+m.hp+'/'+m.maxhp);return;}
const a=targetAt(x,y);if(a&&extraItems[a.id]?.[2]==='ore'&&!Number.isFinite(difficulty(a,tool()))){hint('Нужна '+({silver:'бронзовая кирка',gold:'железная кирка',ruby:'стальная кирка',sapphire:'стальная кирка',obsidian:'стальная кирка'}[a.id]||'кирка'));return;}if(a?.o&&['chest','barrel','door','bed','farm','sign','anvil','alchemy','cart'].includes(a.id)){hint('F — взаимодействовать. Постройки остаются в мире.');return;}oldMine(dt,x,y);};
tickMobs=function(dt){for(const m of W.mobs){if(Math.abs(m.x-S.p.x)>R.w)continue;m.t+=dt;const dx=S.p.x-m.x,near=Math.abs(S.p.y-m.y)<30,hostile=['wolf','slime','beetle','bat'].includes(m.type);const light=tool()==='torch'&&S.inventory.torch>0||aroundObj(['campfire','torch','beacon'],2.4,m.x,m.y);if(hostile&&near&&Math.abs(dx)<100)m.dir=(Math.sign(dx)||1)*(m.type==='beetle'&&light?-1:1);else if(m.type==='rabbit'&&near&&Math.abs(dx)<40)m.dir=-Math.sign(dx)||1;else if(Math.abs(m.x-m.home)>45)m.dir=m.x>m.home?-1:1;
const speed={wolf:26,slime:10,beetle:12,bat:22,boar:14,rabbit:20}[m.type];let nx=m.x+m.dir*speed*dt;const tx=Math.floor((nx+m.dir*6)/T),ty=Math.floor((m.y-2)/T);if(tile(tx,ty)||!tile(tx,ty+1)){m.dir*=-1;}else m.x=nx;
if(!tile(Math.floor(m.x/T),Math.floor((m.y+1)/T))){m.vy=Math.min(180,m.vy+300*dt);const ny=m.y+m.vy*dt;if(tile(Math.floor(m.x/T),Math.floor(ny/T))){m.y=Math.floor(ny/T)*T;m.vy=0;}else m.y=ny;}
if(hostile&&near&&Math.abs(dx)<12&&!(m.type==='beetle'&&light))damage({wolf:10,slime:6,beetle:5,bat:4}[m.type]);}};
const oldCollide=collide;
collide=function(x,y){return oldCollide(x,y)||W.objects.concat(S.built).some(o=>o.id==='door'&&!removed(o)&&!stateOf(o).open&&x+4>o.x*T&&x-4<(o.x+1)*T&&y>(o.y-1)*T&&y-22<(o.y+1)*T);};
let activeChest=null,bagFilter='all';
function chestPanel(o){activeChest=o;openPanel('chest');const k=objKey(o);if(!S.storage[k])S.storage[k]=S.built.includes(o)?{}:{coal:3,copper:3,bandage:2,seed:3};const box=S.storage[k];$('dialogTitle').textContent='Сундук';$('dialog').querySelectorAll('.menubtn').forEach(b=>b.remove());$('dialog').insertAdjacentHTML('beforeend','<p class="note">Нажмите на предмет: перенести 1. Shift + клик: весь запас.</p><h2>В сундуке</h2><div class="inventory">'+transferCards(box,'take')+'</div><h2>Ваш рюкзак</h2><div class="inventory">'+transferCards(S.inventory,'put')+'</div>');paintIcons($('dialog'));}
function transferCards(inv,dir){return Object.entries(inv).filter(([id,n])=>n>0&&items[id]).map(([id,n])=>'<button class="bagItem" data-transfer="'+dir+'" data-id="'+id+'">'+artCanvas(id)+'<b>'+n+'</b><span>'+items[id][0]+'</span></button>').join('')||'<p class="muted">Пусто</p>';}
const oldAct=actNear;
actNear=function(){if(mode)return;playing=true;const candidates=W.objects.concat(S.built).filter(o=>!removed(o)&&['chest','barrel','door','bed','farm','sign','anvil','alchemy','mushroom','blossom','cart'].includes(o.id)&&Math.hypot((o.x+.5)*T-S.p.x,(o.y+1)*T-S.p.y)<T*2.7).sort((a,b)=>Math.abs((a.x+.5)*T-S.p.x)-Math.abs((b.x+.5)*T-S.p.x));const o=candidates[0];if(!o){oldAct();return;}const st=stateOf(o);
if(o.id==='chest'){chestPanel(o);return;}
if(o.id==='anvil'||o.id==='alchemy'){openPanel('bag','craft');return;}
if(o.id==='door'){if(st.open&&Math.abs(S.p.x-(o.x+.5)*T)<13&&Math.abs(S.p.y-(o.y+1)*T)<24){hint('Отойдите от дверного проёма');return;}st.open=!st.open;notify(st.open?'Дверь открыта':'Дверь закрыта');}
if(o.id==='barrel'||o.id==='cart'){if(st.looted)notify('Припасы уже забраны');else {st.looted=true;add('coal',3);add('seed',2);add('fiber',3);add('berries',2);notify('Припасы: уголь, семена, волокно, ягоды');}}
if(o.id==='mushroom'||o.id==='blossom'){add(o.id,2);if(S.built.includes(o))S.built.splice(S.built.indexOf(o),1);else S.removed.push(objKey(o));notify(items[o.id][0]+' +2');}
if(o.id==='sign')notify('Глубина: серебро 12+, золото 18+, самоцветы 23+, обсидиан 30+.');
if(o.id==='bed'){if(S.minute>=360&&S.minute<1200){notify('Спать можно с 20:00 до 06:00');return;}if(S.minute>=1200)S.day++;S.minute=370;S.p.hp=100;S.p.energy=100;S.p.food=Math.max(1,S.p.food-10);notify('Доброе утро! Силы восстановлены');}
if(o.id==='farm'){const now=S.day*1440+S.minute;if(st.ready&&now>=st.ready){add('wheat',3);add('seed',2);st.ready=0;notify('Урожай: пшеница +3, семена +2');}else if(st.ready)notify('До урожая: '+Math.ceil((st.ready-now)/2.4)+' секунд игры');else if(use('seed')){st.ready=now+180;notify('Семена посажены. Рост — 75 секунд игры.');}else notify('Нужны семена: соберите ягоды');}
refresh();save();};
$('touchUse').onclick=()=>actNear();
const oldPanel=openPanel;
openPanel=function(name,section){oldPanel(name,section);if(name!=='bag')return;const d=$('dialog');if(tab==='items'){
d.querySelector('.inventory').outerHTML='<div class="bagFilters">'+[['all','Все'],['tool','Снаряжение'],['ore','Руды'],['material','Материалы'],['food','Еда'],['build','Постройки']].map(([id,n])=>'<button data-filter="'+id+'" class="'+(bagFilter===id?'active':'')+'">'+n+'</button>').join('')+'</div><p class="muted">'+Object.values(S.inventory).filter(n=>n>0).length+' видов предметов · ячейка быстрого доступа '+(S.slot+1)+'</p><div class="inventory">'+Object.keys(items).filter(id=>S.inventory[id]>0&&(bagFilter==='all'||category(id)===bagFilter)).map(id=>'<button class="bagItem '+(id===tool()?'chosen':'')+'" data-equip="'+id+'">'+artCanvas(id)+'<b class="bagQty">'+S.inventory[id]+'</b><span>'+items[id][0]+'</span><small>'+items[id][1]+'</small></button>').join('')+'</div>';paintIcons(d);
}else {d.querySelector('.tabs').insertAdjacentHTML('afterend','<p class="note">'+recipes.length+' рецептов · недостающие материалы и нужная станция указаны под предметом.</p>');}};
function category(id){return extraItems[id]?.[2]||(['pick','ironpick','axe','shovel'].includes(id)?'tool':['coal','iron','crystal'].includes(id)?'ore':['berries','stew'].includes(id)?'food':decor.includes(id)||['plank','dirt','stone','wood'].includes(id)?'build':'material');}
$('dialog').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.filter){bagFilter=b.dataset.filter;openPanel('bag','items');}if(b.dataset.transfer&&activeChest){const box=S.storage[objKey(activeChest)],id=b.dataset.id,from=b.dataset.transfer==='take'?box:S.inventory,to=b.dataset.transfer==='take'?S.inventory:box,n=e.shiftKey?from[id]:Math.min(1,from[id]||0);if(n>0){from[id]-=n;to[id]=(to[id]||0)+n;save();refresh();chestPanel(activeChest);}}});
controls.push(['Атака ближайшего моба','ЛКМ / J'],['Сундуки, двери, растения, грядки','F']);
const prompt=document.createElement('div');prompt.id='interactionPrompt';$('stage').append(prompt);
const oldUpdate=updateTarget;
updateTarget=function(){oldUpdate();const o=W.objects.concat(S.built).filter(o=>!removed(o)&&['chest','barrel','door','bed','farm','sign','anvil','alchemy','mushroom','blossom','bench','furnace','campfire','cart'].includes(o.id)).sort((a,b)=>Math.hypot((a.x+.5)*T-S.p.x,(a.y+1)*T-S.p.y)-Math.hypot((b.x+.5)*T-S.p.x,(b.y+1)*T-S.p.y))[0];prompt.hidden=!!mode||!o||Math.hypot((o.x+.5)*T-S.p.x,(o.y+1)*T-S.p.y)>T*2.7;prompt.textContent='F · '+(label[o?.id]||'Припасы');};
refresh();save();
