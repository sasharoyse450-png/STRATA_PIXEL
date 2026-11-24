"use strict";
const $=id=>document.getElementById(id);
const canvas=$("game"),g=canvas.getContext("2d",{alpha:false});
const W=generateWorld(),saveKey="strata.northern-frontier.v3";
let S=freshState();
try{const v=typeof Session!=='undefined'?Session.loadState():JSON.parse(localStorage.getItem(saveKey));if(v&&v.version===3&&Array.isArray(v.belt)&&[8,10].includes(v.belt.length))S={...S,...v,p:{...S.p,...v.p,vx:0,vy:0}}}catch{}

let grounded=false,mode="",playing=false,saveTimer=0,uiTimer=0,toastTimer=0,toastText="",tab="items",touchBuild=false, audioCtx=null, lastTime=0, regen=0, lastHint=0, frozen=false;
const keys=new Set(),pointer={active:false,down:false,wx:0,wy:0,cx:0,cy:0},swing={key:"",value:0,anim:0,hit:0,repeat:0};
let jumpBuffer=0,coyote=0,lastQuest=0,lastFocus=null;
function tile(x,y){if(x<0||x>=COLS||y>=ROWS)return "rockbase";if(y<0)return null;const k=x+","+y;return Object.hasOwn(S.edits,k)?S.edits[k]:W.tiles[y][x]}
function edit(x,y,id){S.edits[x+","+y]=id;invalidateTerrain(x,y)}
function removed(o){return !S.built.includes(o)&&S.removed.includes(o.id+":"+o.x+","+o.y)}
function getObj(x,y){return S.built.find(o=>o.x===x&&o.y===y)||W.objects.findLast(o=>o.x===x&&o.y===y&&!removed(o))}
function aroundObj(ids,dist=5,px=S.p.x,py=S.p.y){return W.objects.concat(S.built).find(o=>ids.includes(o.id)&&!removed(o)&&Math.hypot((o.x+.5)*T-px,(o.y+1)*T-py)<dist*T)}
function save(quiet=true){try{if(typeof Session!=='undefined'){if(!Session.saveState(S))throw Error('storage');}else localStorage.setItem(saveKey,JSON.stringify(S));$("saveStatus").innerHTML="<i></i>Мир сохранён";if(!quiet)notify("Мир сохранён")}catch{$("saveStatus").textContent="Сохранение недоступно";if(!quiet)notify("Браузер не разрешил сохранить мир")}}
function tone(freq,len=.07,type="triangle",vol=.055,slide=1){if(!S.sound)return;try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==="suspended")audioCtx.resume().catch(()=>{});const osc=audioCtx.createOscillator(),a=audioCtx.createGain(),t=audioCtx.currentTime;osc.type=type;osc.frequency.setValueAtTime(freq,t);osc.frequency.exponentialRampToValueAtTime(freq*slide,t+len);a.gain.setValueAtTime(vol,t);a.gain.exponentialRampToValueAtTime(.001,t+len);osc.connect(a);a.connect(audioCtx.destination);osc.start(t);osc.stop(t+len)}catch{}}
function soundUI(){const b=$("sound");b.innerHTML=icon(S.sound?"volume":"muted");b.title=b.ariaLabel=S.sound?"Выключить звук":"Включить звук";b.setAttribute("aria-pressed",String(S.sound))}
function notify(msg){toastTimer=2.45;toastText=msg;$("toast").textContent=msg;$("toast").classList.add("show")}
function hint(msg){if(R.clock-lastHint>.9){notify(msg);lastHint=R.clock}}
function add(id,n=1){S.inventory[id]=(S.inventory[id]||0)+n}
function use(id,n=1){if((S.inventory[id]||0)<n)return false;S.inventory[id]-=n;return true}
function stat(id,n=1){S.stats[id]=(S.stats[id]||0)+n}
function sparks(x,y,color,n=8){for(let i=0;i<n;i++)R.particles.push({x,y,vx:(Math.random()-.5)*40,vy:-9-Math.random()*31,life:.35+Math.random()*.4,color,sz:1+Math.floor(Math.random()*2)})}
function inReach(x,y){return Math.hypot(x-S.p.x,y-(S.p.y-12))<T*4.05}
const tool=()=>S.belt[S.slot];
function targetAt(x,y){
 if(!Number.isFinite(x)||!Number.isFinite(y))return null;
 const gx=Math.floor(x/T),gy=Math.floor(y/T);if(gx<0||gx>=COLS||gy<0||gy>=ROWS)return null;
 const o=getObj(gx,gy);if(o&&!["beam","mineLamp","mushroom","blossom","cart"].includes(o.id))return{id:o.id,o,gx,gy};
 const id=tile(gx,gy);if(id)return{id,gx,gy};
 const tr=W.trees.find(a=>!S.chopped.includes(a.seed)&&Math.abs(x-a.x)<Math.max(7,(a.h-(a.y-y))*.22)&&y<=a.y&&y>a.y-a.h);if(tr)return{id:"tree",tr,gx,gy};
 const b=W.bushes.find(a=>Math.abs(x-a.x)<10&&y<=a.y&&y>a.y-11);if(b)return{id:"bush",b,gx,gy};
 return null
}
function harvest(b){
 if(S.harvest[b.x]&&S.harvest[b.x]>S.day){hint("Новые ягоды созреют завтра");return false}
 S.harvest[b.x]=S.day+1;add("berries",3);notify("Лесные ягоды +3");sparks(b.x,b.y-5,"#ed9a76",5);tone(420,.12,"sine",.05,1.35);return true
}
function eat(){const id=tool();if(!["berries","stew"].includes(id))return false;if(!S.inventory[id]){hint("Запас еды закончился");return true}if(S.p.food>99&&S.p.hp>99){hint("Вы уже сыты");return true}
 use(id);S.p.food=Math.min(100,S.p.food+(id==="stew"?42:18));if(id==="stew")S.p.hp=Math.min(100,S.p.hp+12);tone(380,.12,"triangle",.05,.7);notify(id==="stew"?"Похлёбка согрела вас":"Вы съели ягоды");refresh();return true}
function difficulty(a,id){
 if(a.id==="tree")return id==="axe"?.78:Infinity;
 if(a.id==="bush")return .2;
 if(a.id==="rockbase")return Infinity;
 if(a.id==="outcrop"||a.id==="crystal")return id==="ironpick"?.75:Infinity;
 if(a.o)return .38;
 if(["coal","iron","stone"].includes(a.id))return ["pick","ironpick"].includes(id)?times[a.id]*(id==="ironpick"?.47:1):Infinity;
 if(["grass","dirt"].includes(a.id))return id==="shovel"?.24:.75;
 return id==="axe"?.34:.85
}
function mine(dt,wx,wy){
 const p=S.p;if(!inReach(wx,wy)){swing.value=0;hint("Подойдите ближе");return}
 const a=targetAt(wx,wy);if(!a){swing.value=0;return}
 const id=tool(),need=difficulty(a,id);
 if(!Number.isFinite(need)){swing.value=0;hint(a.id==="rockbase"?"Коренная порода непроницаема":a.id==="tree"?"Выберите топор · 3":a.id==="outcrop"||a.id==="crystal"?"Нужна железная кирка":"Выберите кирку");return}
 const key=a.tr?"tree"+a.tr.seed:a.gx+","+a.gy+a.id;
 if(swing.key!==key){swing.key=key;swing.value=0}
 p.dir=wx>p.x?1:-1;
 if(swing.anim<=0){swing.anim=.3;tone(a.id==="tree"?140:230,.052,"triangle",.04,.48);sparks(wx,wy,a.id==="tree"?"#c79864":"#a69f84",2)}
 swing.value+=dt/need;if(swing.value<1)return;swing.value=0;swing.key="";
 let drop=drops[a.id]||a.id,count=1;
 if(a.tr){S.chopped.push(a.tr.seed);drop="wood";count=4;sparks(a.tr.x,a.tr.y-a.tr.h*.5,"#809258",14)}
 else if(a.b){harvest(a.b);swing.repeat=.4;refresh();return}
 else if(a.o){
  if(a.id==="outcrop"){drop="crystal";count=2}
  if(S.built.includes(a.o))S.built.splice(S.built.indexOf(a.o),1);
  else S.removed.push(a.o.id+":"+a.o.x+","+a.o.y)
 }else edit(a.gx,a.gy,null);
 add(drop,count);stat(drop,count);sparks(wx,wy,a.id==="crystal"||a.id==="outcrop"?"#8dd5c4":"#b29678",8);
 notify(items[drop][0]+" +"+count);tone(155,.085,"square",.019,.55);refresh()
}
const blocks=["wood","stone","dirt","plank"],decor=["torch","ladder","bench","furnace","campfire","beacon"];
function place(wx,wy){
 if(mode)return;playing=true;
 let id=tool();if(!blocks.includes(id)&&!decor.includes(id)){hint("Выберите блок, лестницу или предмет для установки");return}
 if(!inReach(wx,wy)){hint("Подойдите ближе");return}if(!S.inventory[id]){hint("Этот предмет закончился");return}
 let x=Math.floor(wx/T),y=Math.floor(wy/T);if(x<1||x>=COLS-1||y<0||y>=ROWS-2)return;
 if(tile(x,y)||getObj(x,y)){hint("Эта клетка занята");return}
 const p=S.p,solid=blocks.includes(id);
 if(solid&&p.x+4>x*T&&p.x-4<(x+1)*T&&p.y>y*T&&p.y-23<(y+1)*T){hint("Отойдите на шаг");return}
 const support=tile(x,y+1)||tile(x-1,y)||tile(x+1,y)||tile(x,y-1);
 const adjacentLadder=[[0,-1],[0,1],[1,0],[-1,0]].some(([dx,dy])=>getObj(x+dx,y+dy)?.id==="ladder");
 if(solid&&!support||id==="ladder"&&!support&&!adjacentLadder||decor.includes(id)&&!["torch","ladder"].includes(id)&&!tile(x,y+1)){hint("Поставьте предмет на опору");return}
 if(!use(id))return;
 if(solid)edit(x,y,id);else S.built.push({id,x,y});
 if(id==="bench")stat("placedBench");if(id==="beacon")stat("placedBeacon");
 sparks(wx,wy,"#b9a77d",5);tone(245,.075,"triangle",.06,.63);notify(id==="beacon"?"Маяк зажжён! Северный рубеж освоен.":items[id][0]+" · установлено");refresh();save()
}
function recipeOK(r){return (!r.at||aroundObj([r.at],5))&&Object.entries(r.c).every(([i,n])=>(S.inventory[i]||0)>=n)}
function craft(id){
 const r=recipes.find(a=>a.id===id);if(!r||!recipeOK(r))return;
 for(const [i,n] of Object.entries(r.c))use(i,n);add(id,r.q);if(id==="ironpick")stat("madePick");
 tone(550,.15,"triangle",.06,1.5);notify("Создано · "+items[id][0]+" ×"+r.q);refresh();save();openPanel("bag","craft")
}
function actNear(){
 if(mode)return;playing=true;
 if(eat())return;
 const p=S.p,b=W.bushes.find(a=>Math.hypot(a.x-p.x,a.y-p.y)<T*1.9&&(!S.harvest[a.x]||S.harvest[a.x]<=S.day));
 if(b){harvest(b);refresh();return}
 const station=aroundObj(["bench","furnace"],2.8);if(station){openPanel("bag","craft");return}
 if(aroundObj(["campfire"],3)){openPanel("camp");return}
 hint("Подойдите к ягодам, костру или верстаку")
}
function collide(px,py){
 for(const x of [px-4.3,px+4.3])for(const y of [py-.15,py-11,py-22])if(tile(Math.floor(x/T),Math.floor(y/T)))return true;return false
}
function moveAxis(axis,amount){
 if(!amount)return false;const p=S.p;
 while(Math.abs(amount)>.00001){
 const d=Math.sign(amount)*Math.min(3,Math.abs(amount)),xx=p.x+(axis==="x"?d:0),yy=p.y+(axis==="y"?d:0);
 if(collide(xx,yy)){
  let a=0,b=1;for(let i=0;i<7;i++){const m=(a+b)/2;if(collide(p.x+(axis==="x"?d*m:0),p.y+(axis==="y"?d*m:0)))b=m;else a=m}
  p[axis]+=d*a;return true
 }p[axis]+=d;amount-=d
 }return false
}
function damage(n){if(swing.hit>0)return;S.p.hp=Math.max(0,S.p.hp-n);swing.hit=1.3;sparks(S.p.x,S.p.y-11,"#d9735e",8);tone(95,.16,"sawtooth",.035,.55);if(S.p.hp<=0)openPanel("dead");refresh()}
function physics(dt){
 const p=S.p,dx=Number(keys.has("right"))-Number(keys.has("left")),up=keys.has("up"),down=keys.has("down");
 const gx=Math.floor(p.x/T),gy=Math.floor((p.y-8)/T);
 const climb=[[gx,gy],[gx,gy-1],[gx,Math.floor((p.y+2)/T)]].some(([x,y])=>getObj(x,y)?.id==="ladder");
 if(p.energy<=2)p.winded=true;else if(p.energy>=20)p.winded=false;
 let running=!!dx&&keys.has("run")&&!p.winded;
 p.vx=dx*(running?91:57);if(dx)p.dir=dx;
 if(grounded)coyote=.11;else coyote=Math.max(0,coyote-dt);
 if(climb&&(up||down)){p.vy=up?-48:48;jumpBuffer=0;grounded=false}
 else if(jumpBuffer>0&&(coyote>0||climb)){p.vy=-147;jumpBuffer=0;coyote=0;grounded=false;p.energy=Math.max(0,p.energy-2);tone(240,.09,"sine",.035,1.45)}
 else p.vy=Math.min(290,p.vy+365*dt);
 jumpBuffer=Math.max(0,jumpBuffer-dt);
 if(moveAxis("x",p.vx*dt))p.vx=0;
 const vy=p.vy;grounded=false;
 if(moveAxis("y",vy*dt)){if(vy>0){grounded=true;if(vy>218)damage(Math.floor((vy-200)*.24))}p.vy=0}
 p.energy=limit(p.energy+(running?-10:6)*dt,0,100);p.food=limit(p.food-(running?.075:.025)*dt,0,100);
 if(p.food<=0){regen+=dt;if(regen>5){damage(2);regen=0}}
 else if(p.hp<100&&p.food>30&&aroundObj(["campfire"],2.6))p.hp=Math.min(100,p.hp+dt*.85);
 S.explored=[Math.min(S.explored[0],gx-6),Math.max(S.explored[1],gx+6)];
}
function tickMobs(dt){
 const p=S.p;
 for(const m of W.mobs){if(Math.abs(m.x-p.x)>R.w*.7)continue;
 m.t+=dt;const bug=m.type==="beetle",dist=Math.abs(m.x-p.x),same=Math.abs(m.y-p.y)<18;
 if(bug&&dist<55&&same){const light=tool()==="torch"&&S.inventory.torch>0||aroundObj(["campfire","torch","beacon"],2.4,m.x,m.y);m.dir=(p.x>m.x?1:-1)*(light?-1:1);if(dist<11&&!light)damage(5)}
 else if(!bug&&dist<31&&same)m.dir=p.x>m.x?-1:1;
 else if(Math.abs(m.x-m.home)>28)m.dir=m.x>m.home?-1:1;
 const active=bug||dist<32||Math.sin(m.t*1.1+m.home)>.32;if(!active)continue;
 let nx=m.x+m.dir*(bug?12:19)*dt,xt=Math.floor((nx+m.dir*4)/T),yt=Math.floor((m.y-.2)/T);
 if(tile(xt,yt)||!tile(xt,yt+1)){m.dir*=-1;continue}m.x=nx;
 }
}
function respawn(){const p=S.p;let x=START;while(x<COLS-1&&(tile(x,BASE-1)||tile(x,BASE-2)))x++;let y=2;while(y<ROWS-2&&!tile(x,y))y++;Object.assign(p,{x:(x+.5)*T,y:y*T,hp:100,food:75,energy:100,vy:0,vx:0});swing.hit=1.5;camera(0,true);closePanel();save();notify("Вы вернулись в лагерь")}
function sunrise(){if(!aroundObj(["campfire"],3))return;if(S.minute>=20*60||S.minute<6*60){if(S.minute>=20*60)S.day++;S.minute=6*60+10;S.p.hp=Math.min(100,S.p.hp+30);S.p.food=Math.max(1,S.p.food-7);S.p.energy=100;closePanel();notify("Рассвет · силы восстановлены");refresh();save()}}
function daylight(){const h=S.minute/60;if(h>=7&&h<=17.5)return .96;if(h>17.5&&h<21)return .96*(21-h)/3.5;if(h>=4.5&&h<7)return .96*(h-4.5)/2.5;return .035}
function tick(dt){
 R.clock+=dt;
 if(toastTimer>0&&(toastTimer-=dt)<=0)$("toast").classList.remove("show");
 if(mode)return;
 if(playing&&!frozen){
  S.minute+=dt*2.4;if(S.minute>=1440){S.minute-=1440;S.day++}
  physics(dt);if(mode)return;
  tickMobs(dt);if(mode)return;
  swing.anim=Math.max(0,swing.anim-dt);swing.hit=Math.max(0,swing.hit-dt);swing.repeat=Math.max(0,swing.repeat-dt);
  if(pointer.down&&!swing.repeat)mine(dt,pointer.wx,pointer.wy);
  else if(keys.has("mine")&&!swing.repeat)mine(dt,S.p.x+S.p.dir*T,S.p.y-9);
  else swing.value=0;
  saveTimer+=dt;if(saveTimer>6){saveTimer=0;save()}
 }
 for(const a of R.particles){a.x+=a.vx*dt;a.y+=a.vy*dt;a.vy+=60*dt;a.life-=dt}R.particles=R.particles.filter(a=>a.life>0);
 camera(dt);if(pointer.active)pointerCoords(pointer.cx,pointer.cy);
 R.daylight=daylight();uiTimer+=dt;if(uiTimer>.22){uiTimer=0;updateStats();updateTarget()}
}
function icon(id){return '<svg aria-hidden="true"><use href="#i-'+id+'"/></svg>'}
function artCanvas(id,cls=""){if(!id)return "";return '<canvas width="24" height="24" class="'+cls+'" data-art="'+id+'" aria-hidden="true"></canvas>'}
function paintIcons(root=document){root.querySelectorAll("canvas[data-art]").forEach(c=>{c.width=c.height=24;Art.item(c.getContext("2d"),c.dataset.art,0,0,24)})}
function questIndex(){const i=quests.findIndex(q=>(S.stats[q[3]]||0)<q[4]);return i<0?quests.length:i}
function updateStats(){
 const p=S.p;for(const [id,n] of [["health",p.hp],["food",p.food],["stamina",p.energy]]){const a=$(id);a.querySelector(".track span").style.width=n+"%";a.querySelector("b").textContent=Math.ceil(n)}
 const pad=n=>String(Math.floor(n)).padStart(2,"0");$("time").textContent=pad(S.minute/60)+":"+pad(S.minute%60);$("day").textContent="ДЕНЬ "+pad(S.day);
 let depth=Math.floor(p.y/T)-surface(Math.floor(p.x/T));$("biome").textContent=depth>5?"Глубинные пещеры":depth>1?"Старая шахта":"Хвойная долина"
}
function refresh(){
 updateStats();const i=questIndex(),q=quests[i];$("questTitle").textContent=q?q[0]:"Маяк зажжён";$("questText").textContent=q?q[1]:"Экспедиция завершена";$("questCount").textContent=q?Math.min(S.stats[q[3]]||0,q[4])+"/"+q[4]:"✓";
 if(i>lastQuest&&playing){tone(680,.24,"sine",.065,1.5);if(i<quests.length)notify("Новое задание · "+q[0])}lastQuest=i;
 const belt=$("belt");S.belt=S.belt.map(id=>id&&S.inventory[id]>0?id:null);
 belt.innerHTML=S.belt.map((id,n)=>'<button class="slot '+(n===S.slot?'selected ':'')+(!id?'empty':'')+'" title="'+(id?items[id][0]:'Пустая ячейка')+' · '+((n+1)%10)+'" aria-label="'+(id?items[id][0]:'Пустая ячейка '+(n+1))+'" aria-pressed="'+(n===S.slot)+'" data-slot="'+n+'" '+(id?'draggable="true" data-belt-drag="'+n+'"':'')+'><span class="slotNum">'+((n+1)%10)+'</span>'+(id?artCanvas(id)+'<span class="slotQty">'+S.inventory[id]+'</span>':'')+'</button>').join('');
 paintIcons(belt);$("equipped").textContent=items[tool()]?.[0]||'Пустая рука · E — назначить предмет';

}
function assignQuick(id,slot){if(!items[id]||!(S.inventory[id]>0))return;S.belt=S.belt.map(v=>v===id?null:v);S.belt[slot]=id;}
function select(n){S.slot=(n+S.belt.length)%S.belt.length;swing.value=0;swing.key="";refresh();tone(300+S.slot*22,.027,"triangle",.024);save()}
function updateTarget(){const a=$("targetLabel");a.classList.remove("show");if(!pointer.active||mode||!inReach(pointer.wx,pointer.wy)||matchMedia("(pointer:coarse)").matches)return;const obj=targetAt(pointer.wx,pointer.wy);if(!obj)return;a.textContent=label[obj.id]||"";if(!a.textContent)return;a.style.left=limit(pointer.cx+12,2,canvas.clientWidth-a.offsetWidth-4)+"px";a.style.top=limit(pointer.cy-24,0,canvas.clientHeight-23)+"px";a.classList.add("show")}

function markLogo(){const c=$("wordmark"),ctx=c.getContext("2d"),font={S:["11111","11000","11000","11111","00011","00011","11111"],T:["11111","11111","00100","00100","00100","00100","00100"],R:["11110","11011","11011","11110","11100","11010","11011"],A:["01110","11011","11011","11111","11011","11011","11011"]};c.width=6*6-1;c.height=7;Array.from("STRATA").forEach((ch,i)=>font[ch].forEach((row,y)=>Array.from(row).forEach((v,x)=>{if(v==="1")block(ctx,"#f4f0dc",i*6+x,y,1,1)})))}
const controls=[["Ходьба","A / D или ← / →"],["Прыжок","Пробел"],["Бег","Shift + ходьба"],["Подъём и спуск по лестнице","W / S или ↑ / ↓"],["Добыча и рубка","Удерживайте ЛКМ"],["Установка выбранного предмета","ПКМ"],["Съесть выбранную еду","ЛКМ или F"],["Собрать ягоды, отдохнуть, открыть станок","F"],["Выбор предмета","1–8 или колёсико"],["Рюкзак и крафт","E"],["Карта, журнал, пауза","M / Q / Esc"]];
function openPanel(name,section){
 if(!mode){lastFocus=document.activeElement;keys.clear();pointer.down=false;swing.value=0;jumpBuffer=0}
 mode=name;const d=$("dialog"),o=$("overlay");o.hidden=false;$("targetLabel").classList.remove("show");
 let title="",eyebrow="",body="";
 d.className="dialog"+(["pause","camp","dead"].includes(name)?" narrow":"");
 if(name==="bag"){
  tab=section||tab;title="Рюкзак";eyebrow="СНАРЯЖЕНИЕ";body='<div class="tabs"><button data-tab="items" class="'+(tab==="items"?"active":"")+'">Предметы</button><button data-tab="craft" class="'+(tab==="craft"?"active":"")+'">Крафт</button></div>';
  if(tab==="items"){body+='<div class="inventory">'+Object.keys(items).filter(id=>S.inventory[id]>0).map(id=>'<button class="bagItem '+(id===tool()?"chosen":"")+'" data-equip="'+id+'" title="'+items[id][1]+'">'+artCanvas(id,"itemArt")+'<b class="bagQty">'+S.inventory[id]+'</b><span>'+items[id][0]+'</span></button>').join("")+'</div><p class="muted note">Выберите предмет, чтобы взять его в руку. Новый предмет займёт текущую ячейку быстрого доступа.</p>'}
  else{body+=recipes.map(r=>{const allowed=recipeOK(r);return '<div class="recipe">'+artCanvas(r.id,"itemArt")+'<div class="details"><b>'+items[r.id][0]+(r.q>1?" ×"+r.q:"")+'</b><small>'+Object.entries(r.c).map(([id,n])=>items[id][0]+' '+Math.min(n,S.inventory[id]||0)+'/'+n).join(" · ")+'</small>'+(r.at?'<small>Рядом: '+items[r.at][0]+(aroundObj([r.at],5)?" ✓":"")+'</small>':"")+'</div><button data-craft="'+r.id+'" '+(allowed?"":"disabled")+'>Создать</button></div>'}).join("")}
 }else if(name==="help"){title="Управление";eyebrow="ПОЛЕВОЙ СПРАВОЧНИК";body=controls.map(a=>'<div class="controlRow"><span>'+a[0]+'</span><kbd>'+a[1]+'</kbd></div>').join("")+'<p class="textPane">На сенсорном экране удерживайте блок для добычи. Кнопка с рюкзаком рядом со стрелками переключает установку предметов касанием.</p>'}
 else if(name==="journal"){title="Журнал экспедиции";eyebrow="СЕВЕРНЫЙ РУБЕЖ";let qi=questIndex();body=quests.map((q,i)=>'<div class="objective '+(i>qi?"locked":"")+'"><div class="details"><b>'+q[0]+'</b><small>'+q[2]+'</small></div><span class="status">'+(i<qi?"✓":Math.min(q[4],S.stats[q[3]]||0)+"/"+q[4])+'</span></div>').join("")}
 else if(name==="map"){title="Карта долины";eyebrow="ИССЛЕДОВАННАЯ ТЕРРИТОРИЯ";body='<canvas class="mapCanvas" id="atlas" width="480" height="104"></canvas><div class="mapKey"><span style="--c:#f0bf70">Вы</span><span style="--c:#d88356">Лагерь</span><span style="--c:#81936b">Поверхность</span></div><p class="muted note">Карта открывается по мере исследования долины.</p>'}
 else if(name==="camp"){title="У костра";eyebrow="ЛАГЕРЬ";const night=S.minute>=1200||S.minute<360;body='<p class="textPane">Тепло костра постепенно восстанавливает здоровье. С 20:00 здесь можно переночевать и встретить рассвет.</p>'+(night?'<button class="menubtn" data-do="sleep">Спать до рассвета</button>':"")+'<button class="menubtn alt" data-do="resume">Вернуться к костру</button>'}
 else if(name==="dead"){title="Силы закончились";eyebrow="ВЫЖИВАНИЕ";body='<p class="textPane">Вы очнётесь в лагере. Собранные вещи и постройки сохранятся.</p><button class="menubtn" data-do="respawn">Вернуться в лагерь</button>'}
 else{title="Пауза";eyebrow="СЕВЕРНЫЙ РУБЕЖ";body='<button class="menubtn" data-do="resume">Продолжить игру</button><button class="menubtn alt" data-do="save">Сохранить мир</button><button class="menubtn alt" data-do="help">Управление</button>'}
 const priorScroll=mode==="bag"&&section==="craft"?d.scrollTop:0;
 d.innerHTML='<div class="dlgHead"><div><div class="eyebrow">'+eyebrow+'</div><h1 id="dialogTitle">'+title+'</h1></div>'+(name==="dead"?"":'<button class="iconBtn" data-do="resume" aria-label="Закрыть">'+icon("close")+'</button>')+'</div>'+body;paintIcons(d);if(name==="map")drawMap();d.scrollTop=priorScroll;const first=d.querySelector("button:not([disabled])");first?.focus({preventScroll:true})
}
function drawMap(){const c=$("atlas"),ctx=c.getContext("2d");block(ctx,"#1c2727",0,0,480,104);
 const px=Math.floor(S.p.x/T),left=limit(px-60,0,COLS-120);
 for(let x=left;x<left+120;x++){const xx=(x-left)*4;if(x<S.explored[0]||x>S.explored[1]){block(ctx,"#212b2a",xx,0,4,104);if(x%3===0)block(ctx,"#35403a",xx,50,1,1);continue}
  for(let y=10;y<62;y++){const id=tile(x,y);if(id)block(ctx,id==="grass"?"#81936b":id==="crystal"?"#64aba8":id==="iron"?"#9b755d":id==="dirt"?"#685641":"#4b5653",xx,(y-10)*2,4,2)}
 }block(ctx,"#d88356",(START-4-left)*4,(BASE-10)*2-5,4,5);let ax=(S.p.x/T-left)*4,ay=(S.p.y/T-10)*2;block(ctx,"#1d2925",ax-2,ay-6,5,6);block(ctx,"#f0bf70",ax-1,ay-5,3,4)}
function closePanel(){if(mode==="dead"&&S.p.hp<=0)return;mode="";$("overlay").hidden=true;pointer.down=false;keys.clear();canvas.focus({preventScroll:true});lastTime=performance.now();save()}
function toggle(name){if(mode==="dead")return;if(mode===name)closePanel();else openPanel(name)}
$("dialog").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
 if(b.dataset.tab)openPanel("bag",b.dataset.tab);
 else if(b.dataset.equip){const id=b.dataset.equip,n=S.belt.indexOf(id);if(n>=0)S.slot=n;else assignQuick(id,S.slot);refresh();closePanel();notify("В руке · "+items[id][0])}
 else if(b.dataset.craft)craft(b.dataset.craft);
 else if(b.dataset.do==="resume")closePanel();else if(b.dataset.do==="help")openPanel("help");else if(b.dataset.do==="save"){save(false);closePanel()}else if(b.dataset.do==="sleep")sunrise();else if(b.dataset.do==="respawn")respawn()
});
$("overlay").addEventListener("click",e=>{if(e.target===$("overlay"))closePanel()});
$("quest").onclick=()=>toggle("journal");$("mapBtn").onclick=()=>toggle("map");$("bagBtn").onclick=()=>toggle("bag");$("help").onclick=()=>toggle("help");$("pause").onclick=()=>toggle("pause");
$("sound").onclick=()=>{S.sound=!S.sound;soundUI();if(S.sound)tone(390,.14,"triangle",.07,1.5);save()};
$("belt").onclick=e=>{if(mode)return;const b=e.target.closest("[data-slot]");if(b)select(Number(b.dataset.slot))};
function pointerCoords(cx,cy){pointer.cx=cx;pointer.cy=cy;pointer.wx=cx*R.w/canvas.clientWidth+Math.round(R.camX);pointer.wy=cy*R.h/canvas.clientHeight+Math.round(R.camY)}
function eventPos(e){const rect=canvas.getBoundingClientRect();pointerCoords(e.clientX-rect.left,e.clientY-rect.top)}
canvas.addEventListener("contextmenu",e=>e.preventDefault());
canvas.addEventListener("pointermove",e=>{if(mode)return;pointer.active=true;eventPos(e)});
canvas.addEventListener("pointerdown",e=>{if(mode||e.button===1)return;e.preventDefault();canvas.focus({preventScroll:true});playing=true;eventPos(e);pointer.active=true;
 if(e.button===2||(e.pointerType!=="mouse"&&touchBuild)){place(pointer.wx,pointer.wy);return}
 if(eat())return;if(e.button===0){pointer.down=true;pointer.active=true;canvas.setPointerCapture(e.pointerId);swing.value=0;swing.repeat=0}
});
const releasePointer=()=>{pointer.down=false;swing.key="";swing.value=0};
canvas.addEventListener("pointerup",releasePointer);canvas.addEventListener("pointercancel",releasePointer);canvas.addEventListener("lostpointercapture",releasePointer);canvas.addEventListener("pointerleave",()=>{if(!pointer.down){pointer.active=false;updateTarget()}});
canvas.addEventListener("wheel",e=>{if(mode)return;e.preventDefault();select(S.slot+Math.sign(e.deltaY))},{passive:false});
const bindings={KeyA:"left",ArrowLeft:"left",KeyD:"right",ArrowRight:"right",Space:"jump",KeyW:"up",ArrowUp:"up",KeyS:"down",ArrowDown:"down",ShiftLeft:"run",ShiftRight:"run",KeyJ:"mine"};
window.addEventListener("keydown",e=>{
 if(e.metaKey||e.ctrlKey||e.altKey)return;
 if(e.code==="Tab"&&mode){const els=[...$("dialog").querySelectorAll("button:not([disabled]),input:not([disabled])")];if(!els.length)return;const first=els[0],last=els.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}return}
 const panel={KeyE:"bag",KeyH:"help",KeyM:"map",KeyQ:"journal",Escape:"pause"}[e.code];
 if(panel){e.preventDefault();if(e.repeat||mode==="dead")return;if(e.code==="Escape"&&mode)closePanel();else toggle(panel);return}
 if(mode)return;
 if(e.code==="Space"&&document.activeElement?.tagName==="BUTTON")canvas.focus({preventScroll:true});
 const action=bindings[e.code];if(action){e.preventDefault();playing=true;keys.add(action);if(!e.repeat&&(action==="jump"||action==="up"))jumpBuffer=.16;return}
 if(e.repeat)return;
 if(/^Digit[0-9]$/.test(e.code))select((Number(e.code.slice(-1))+9)%10);
 if(e.code==="KeyF")actNear();
 if(e.code==="KeyK")place(S.p.x+S.p.dir*T,S.p.y-8)
});
window.addEventListener("keyup",e=>{const action=bindings[e.code];if(action){keys.delete(action);if(action==="mine")swing.value=0}});
document.querySelectorAll("[data-hold]").forEach(b=>{
 const a=b.dataset.hold;b.onpointerdown=e=>{if(mode)return;e.preventDefault();b.setPointerCapture(e.pointerId);playing=true;keys.add(a);if(a==="up")jumpBuffer=.18};
 b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>keys.delete(a)
});
$("touchUse").onclick=actNear;$("buildMode").onclick=()=>{touchBuild=!touchBuild;$("buildMode").classList.toggle("on",touchBuild);notify(touchBuild?"Коснитесь клетки для постройки":"Удерживайте блок для добычи")};
window.addEventListener("blur",()=>{keys.clear();releasePointer();frozen=true;save()});window.addEventListener("focus",()=>{frozen=false;lastTime=performance.now()});
document.addEventListener("visibilitychange",()=>{frozen=document.hidden;keys.clear();releasePointer();lastTime=performance.now();if(frozen)save()});
window.addEventListener("pagehide",()=>save());
function viewport(){resizeGame();camera(0,true);lastSky=""}
new ResizeObserver(viewport).observe(canvas);window.addEventListener("resize",viewport);
makeTextures();markLogo();paintIcons();soundUI();viewport();lastQuest=questIndex();refresh();save();
if(S.p.hp<=0)openPanel("dead");
let lastRender=0;
function frame(now){let dt=lastTime?Math.min(.30,(now-lastTime)/1000):.016;lastTime=now;if(!document.hidden){const steps=Math.max(1,Math.ceil(dt/.04));for(let i=0;i<steps;i++)tick(dt/steps);const cap=typeof Session!=="undefined"?Number(Session.settings.fps):60;if(!cap||now-lastRender>=1000/cap-1){draw();lastRender=now}}requestAnimationFrame(frame)}
requestAnimationFrame(frame);

