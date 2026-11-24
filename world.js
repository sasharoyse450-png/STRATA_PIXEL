"use strict";
const T=16, COLS=420, ROWS=120, START=88, BASE=26, SURF=BASE*T;
const limit=(n,a,b)=>Math.max(a,Math.min(b,n));
function noise(x,y=0,s=0){s+=(typeof Session!=="undefined"?Session.seed:0);let v=Math.imul(x+7919,374761393)^Math.imul(y+191,668265263)^Math.imul(s+37,2246822519);v=Math.imul(v^(v>>>13),1274126177);return ((v^(v>>>16))>>>0)/4294967296}
const items={
 pick:["Каменная кирка","Инструмент для камня, угля и железной руды."],axe:["Каменный топор","Рубит хвойные деревья."],shovel:["Каменная лопата","Быстро копает землю и дёрн."],torch:["Факел","Освещает пещеры и отпугивает жуков."],wood:["Бревно","Для построек, досок и факелов."],stone:["Камень","Материал для инструментов и печи."],berries:["Лесные ягоды","Восстанавливают 18 единиц сытости."],ladder:["Лестница","Поднимайтесь и спускайтесь по ней."],dirt:["Земля","Обычный строительный блок."],coal:["Уголь","Топливо для факелов и печи."],iron:["Железная руда","Переплавляется в железный слиток."],crystal:["Кристалл","Светящийся минерал для маяка."],plank:["Доски","Строительный материал из древесины."],bench:["Верстак","Установите, чтобы открыть сложные рецепты."],furnace:["Печь","Установите рядом для плавки и готовки."],ingot:["Железный слиток","Нужен для железной кирки и маяка."],ironpick:["Железная кирка","Быстрее каменной. Добывает кристаллы."],stew:["Ягодная похлёбка","Восстанавливает 42 сытости и 12 здоровья."],campfire:["Костёр","Помогает восстановить здоровье и встречать рассвет."],beacon:["Кристальный маяк","Зажгите его, чтобы завершить экспедицию."]};
const recipes=[
 {id:"plank",q:4,c:{wood:1}}, {id:"torch",q:4,c:{wood:1,coal:1}}, {id:"ladder",q:4,c:{plank:2}}, {id:"bench",q:1,c:{plank:6}}, {id:"campfire",q:1,c:{wood:3,stone:2}}, {id:"furnace",q:1,c:{stone:6,coal:1},at:"bench"}, {id:"ingot",q:1,c:{iron:1,coal:1},at:"furnace"}, {id:"ironpick",q:1,c:{ingot:2,wood:2},at:"bench"}, {id:"stew",q:1,c:{berries:3},at:"furnace"}, {id:"beacon",q:1,c:{crystal:3,ingot:1,torch:2},at:"bench"}];
const quests=[
 ["Первые запасы","Добудьте древесину","Срубите дерево топором. Одна взрослая ель даёт четыре бревна.","wood",4],
 ["Своя мастерская","Установите верстак","Превратите брёвна в доски, соберите верстак и поставьте его на землю.","placedBench",1],
 ["Под землёй","Добудьте уголь","Ищите в стенах пещеры тёмные прожилки. Для добычи нужна кирка.","coal",3],
 ["Железный век","Скуйте железную кирку","Руду с рыжими вкраплениями можно переплавить в печи рядом с верстаком. Для кирки нужны два слитка.","madePick",1],
 ["Свет из глубин","Добудьте кристаллы","Ищите голубые кристаллы в пещерах. Для их добычи нужна железная кирка.","crystal",3],
 ["Северный огонь","Установите маяк","Соберите маяк у верстака и установите его. После этого можно продолжить исследование.","placedBeacon",1]];
const times={grass:.40,dirt:.36,stone:.64,coal:.82,iron:.95,crystal:1.1,wood:.52,plank:.38};
const drops={grass:"dirt"};
const label={...Object.fromEntries(Object.entries(items).map(([id,v])=>[id,v[0]])),grass:"Дёрн",rockbase:"Коренная порода",tree:"Ель",bush:"Ягодный куст",outcrop:"Кристальная жила",mushroom:"Пещерный гриб",blossom:"Светоцвет",beam:"Шахтная крепь",mineLamp:"Шахтный фонарь"};
function surface(x){
 const d=x-START;
 if(d>=-10&&d<=5)return BASE;
 if(d>=6&&d<=11)return BASE+[1,2,3,4,5,5][d-6];
 if(d>=12&&d<=22)return BASE+[-1,-2,-2,-3,-3,-3,-2,-2,-1,-1,-1][d-12];
 if(d>=-20&&d< -10)return BASE+[-3,-3,-3,-2,-2,-2,-1,-1,-1,-1][d+20];
 const phase=(typeof Session!=="undefined"?Session.seed%997:0)*.01;return BASE+Math.round(1.8*Math.sin(x*.18+phase)+1.2*Math.sin(x*.061+phase));
}
function insideOval(x,y,cx,cy,rx,ry){return ((x-cx)/rx)**2+((y-cy)/ry)**2<1}
function generateWorld(){
 const tiles=Array.from({length:ROWS},()=>Array(COLS).fill(null)),objects=[],trees=[],bushes=[],mobs=[];
 for(let x=0;x<COLS;x++){
  let h=surface(x);
  for(let y=h;y<ROWS;y++){
   let d=y-h, v=noise(x,y);
   let cave=insideOval(x,y,START-3,BASE+7.5,9.2,3.7)||insideOval(x,y,START+9,BASE+6.3,7,2.7)||insideOval(x,y,START-15,BASE+11,8,4.0);
   cave=cave||insideOval(x,y,START+14,BASE+3,3.8,2.0);
   if(x>=START+9&&x<=START+11&&y>=BASE+3&&y<BASE+10)cave=true;
   if(d>5){
    let line=BASE+16+Math.sin(x*.126)*3+Math.sin(x*.043)*5;
    if(Math.abs(y-line)<1.6+1.4*(1+Math.cos(x*.21)))cave=true;
    if(Math.abs(y-(BASE+27+Math.sin(x*.104)*4))<2.6+Math.sin(x*.28))cave=true;
    if(x%41>=17&&x%41<=19&&y>line&&y<BASE+30)cave=true;
    if(x>START+14&&x<START+18&&y>BASE+2&&y<BASE+17)cave=true;
   }
   if(y>=ROWS-2){tiles[y][x]="rockbase";continue}
   if(cave)continue;
   let id=d===0?"grass":d<2+(Math.sin(x*.4)+1)*.7?"dirt":"stone";
   if(id==="stone"){
    const field=Math.sin(x*.84+Math.cos(y*.66)*1.6)+Math.sin(y*1.47+x*.36);
    if(field>1.39&&v>.09)id="coal";
    if(field< -1.39&&d>4&&v>.14)id="iron";
    if(d>7&&Math.sin(.91*x+y*.79)+Math.sin(y*1.27-x*.57)>1.69&&v>.15)id="crystal";
   }
   tiles[y][x]=id;
  }
 }
 // Rock shelves form the floor of the upper gallery.
 for(const [lo,hi,depth] of [[-13,-9,9],[-8,-6,10],[1,3,9],[4,6,8],[12,14,8]]){
  for(let dx=lo;dx<=hi;dx++)for(let y=BASE+depth;y<BASE+depth+3;y++)if(!tiles[y][START+dx])tiles[y][START+dx]="stone"
 }
 for(const [dx,dy,id] of [[-7,4,"coal"],[-8,4,"coal"],[2,4,"iron"],[3,5,"iron"],[-7,11,"crystal"],[-6,11,"crystal"],[1,10,"crystal"],[2,10,"crystal"],[11,9,"coal"],[12,9,"coal"]]){
 if(tiles[BASE+dy][START+dx])tiles[BASE+dy][START+dx]=id}
 const tree=(x,size,seed)=>trees.push({x:x*T+8,y:surface(x)*T,h:size,seed});
 for(const [dx,size] of [[-24,71],[-19,63],[-16,91],[-12,66],[-8,55],[3,49],[14,69],[16,93],[20,58],[24,82]])tree(START+dx,size,(dx+50)*137);
 for(let x=3;x<COLS-2;x+=2){if(Math.abs(x-START)>24&&noise(x,3)>.58)tree(x,43+Math.floor(noise(x,8)*48),x*13)}
 for(let x=3;x<COLS-3;x+=3){if(noise(x,96)>.64&&Math.abs(x-START)>6)bushes.push({x:x*T+8,y:surface(x)*T,berries:true})}
 bushes.push({x:(START-2.7)*T,y:SURF,berries:true});
 const object=(id,x,y)=>objects.push({id,x:Math.floor(x),y});
 object("campfire",START-4,BASE-1);object("cart",START-11,BASE+8);
 for(let y=BASE+4;y<=BASE+9;y++)object("ladder",START+10,y);
 object("beam",START-5,BASE+4);object("beam",START-1,BASE+4);
 object("mineLamp",START-3,BASE+4);
 for(const [dx,dy,id] of [[-7,10,"mushroom"],[1,10,"blossom"],[6,8,"mushroom"],[-10,10,"blossom"],[14,4,"mushroom"],[9,22,"blossom"],[-15,13,"blossom"]]){
  let x=START+dx, y=BASE+dy;while(y<ROWS-2&&!tiles[y+1][x])y++;while(y>BASE&&tiles[y][x])y--;if(y>BASE)object(id,x,y);
 }
 for (const dx of [-13,-7,2,13,21]){
  const x=START+dx;let y=BASE+7;
  while(y<ROWS-3&&(tiles[y][x]||!tiles[y+1][x]))y++;
  if(y<ROWS-3)object("outcrop",x,y);
 }
 for(let x=8;x<COLS-6;x+=7){
  const gy=surface(x);
  if(Math.abs(x-START)>21)mobs.push({type:"rabbit",x:x*T+8,y:gy*T,vx:0,vy:0,dir:1,home:x*T,t:0});
  let by=gy+8;while(by<ROWS-3&&(tiles[by][x]||!tiles[by+1][x]))by++;if(by<ROWS-3)mobs.push({type:"beetle",x:x*T+8,y:(by+1)*T,dir:-1,home:x*T,t:0});
 }
 mobs.push({type:"rabbit",x:(START+4.4)*T,y:SURF,vx:0,vy:0,dir:-1,home:(START+4)*T,t:0});
 return {tiles,objects,trees,bushes,mobs}
}
function freshState(){return{version:3,edits:{},inventory:{pick:1,shovel:1,axe:1,torch:6,wood:2,stone:4,berries:3,ladder:8},belt:Array(10).fill(null),slot:0,p:{x:(START+.5)*T,y:SURF,vx:0,vy:0,dir:1,hp:100,food:86,energy:100},minute:17*60+20,day:1,stats:{},chopped:[],built:[],removed:[],harvest:{},explored:[START-18,START+20],sound:false}}

