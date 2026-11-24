"use strict";
const textures={},treeArt=new Map();
function block(c,k,x,y,w,h){c.fillStyle=k;c.fillRect(Math.floor(x),Math.floor(y),Math.ceil(w),Math.ceil(h))}
function polygon(c,k,pts){c.fillStyle=k;c.beginPath();c.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)c.lineTo(pts[i],pts[i+1]);c.closePath();c.fill()}
function bitmap(w,h,fn){const c=document.createElement("canvas");c.width=w;c.height=h;const g=c.getContext("2d");fn(g);return c}
function glow(c,x,y,r,col,strength=.6){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,"rgba("+col+","+strength+")");g.addColorStop(1,"rgba("+col+",0)");c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2)}
function makeTextures(){
 for(const kind of ["dirt","stone","deep","wall","wood","plank"]){
 textures[kind]=bitmap(128,128,c=>{
  const n=(x,y,s)=>noise(x,y,s);
  const wood=kind==="wood"||kind==="plank";
  const soil=kind==="dirt",wall=kind==="wall";
  const pal=wood?["#6b4933","#735139","#523b2d","#92633e","#a97c50"]:soil?["#755137","#7e583b","#624531","#926741","#aa794b"]:wall?["#26323a","#29353b","#202b33","#303c42","#39444a"]:kind==="deep"?["#353a40","#3d4247","#2a3036","#454a4e","#505558"]:["#464a4b","#4d5151","#393e40","#595d59","#6a6c64"];
  block(c,pal[0],0,0,128,128);
  if(wood){
   for(let j=0;j<128;j+=16){for(let i=0;i<128;i+=16){
    if(kind==="wood"){block(c,pal[2],i,j,2,16);block(c,pal[3],i+3,j,2,16);for(let k=0;k<4;k++)block(c,pal[k%3+1],i+5+n(i,k,j)*9,j+n(j,k,i)*8,1,3+n(i,j,k)*6)}
    else{for(let y=0;y<16;y+=5){block(c,pal[2],i,j+y,16,1);block(c,pal[3],i,j+y+1,16,1);block(c,pal[1],i+2,j+y+3,8,1)}}
   }}return
  }
  // Overlapping, offset strata form a continuous wall across editable tile edges.
  let r=0;for(let y=-9;y<135;y+=8){r++;for(let x=-20;x<140;x+=15){
   let a=x+((r%2)*7)+Math.floor(n((x+140)%128,(y+137)%128)*5),b=y+Math.floor(n(x,y,2)*3);
   let w=8+Math.floor(n(x,y,3)*10),h=4+Math.floor(n(x,y,4)*6);
   const base=n(x,y,8)>.34?pal[1]:pal[0];
   polygon(c,base,[a,b+2,a+3,b,a+w,b,a+w+2,b+2,a+w-1,b+h,a+w-5,b+h+1,a,b+h]);
   if(!soil&&n(x,y,6)>.10){block(c,pal[3],a+3,b,w*.66,1);block(c,pal[2],a+w-4,b+h,5,1);block(c,pal[2],a+w-1,b+h-2,3,2)}
   if(n(x,y,9)>.61){block(c,pal[soil?3:4],a+2,b+2,2+n(x,y)*3,1);block(c,pal[2],a-3,b+3,2,2)}
  }}
  for(let i=0;i<260;i++){let x=n(i,0)*128,y=n(i,1)*128;block(c,pal[i%7===0?3:i%3],x,y,1+n(i,2)*(soil?3:2),1+n(i,4)*1.6)}
 });
 }
}
const oreColors={coal:["#30383b","#232a2d","#171f24","#505656"],iron:["#744e3b","#bd8458","#dca571","#f1b982"],crystal:["#32666b","#458e91","#6ac7bd","#b1e6d3"]};
function ore(c,id,x,y,v){
 const col=oreColors[id],px=x*T,py=y*T;
 for(let i=0;i<4;i++){let xx=px+2+Math.floor(noise(x,y,14+i)*10),yy=py+2+Math.floor(noise(x,y,23+i)*10);
 const sz=i%2+2;block(c,col[0],xx-1,yy,sz+2,sz);block(c,col[1],xx,yy-1,sz,sz+1);block(c,col[2],xx+1,yy-1,sz-1,sz-1);block(c,col[3],xx+1,yy-1,1,1)}
}
function spruce(h,seed){
 if(treeArt.has(seed+"-"+h))return treeArt.get(seed+"-"+h);
 const w=Math.ceil(h*.88),cx=Math.floor(w/2);
 const a=bitmap(w,h+2,c=>{
  const dark=["#263c33","#294236","#2e453a"],shadow=["#314c3a","#314c38","#344e3a"],green=["#496444","#4b6547","#4d6749"],lit=["#627c51","#678056","#708451"];
  const j=Math.floor(noise(seed,4)*3);
  const branch=(k,pts)=>polygon(c,k,pts.map((v,i)=>Math.round(v)+(i%2===0?cx:0)));
  const trunk=Math.max(4,Math.round(h*.074));
  block(c,"#48382b",cx-trunk/2,h*.19,trunk+1,h*.81);block(c,"#89603e",cx+1,h*.19,trunk*.38,h*.81);
  for(let t=0;t<12;t++){let yy=Math.floor(h*.28+t*h*.058);block(c,"#624c35",cx-1,yy,3,2);if(t%3===0)block(c,"#b0874a",cx+1,yy,1,2)}
  const tier=(tip,len,half,ix)=>{
   const base=tip+len;
   for(let side of [-1,1]){
    const mult=side===1?.94:1;
    const point=(xx,yy)=>[xx*half*side*mult,tip+len*yy];
    const pts=[[0,0],[.14,.15],[.16,.28],[.31,.37],[.29,.43],[.46,.48],[.51,.56],[.67,.63],[.66,.70],[.84,.77],[.88,.84],[1,.86],[.97,.93],[.81,.92],[.85,1],[.62,.93],[.61,.98],[.45,.9],[.36,.96],[.16,.87],[0,.93]];
    branch(dark[j],pts.flatMap(q=>point(q[0],q[1])));
    const lightSide=side===1;
    branch(lightSide?green[j]:shadow[j],[[0,.06],[.13,.21],[.23,.37],[.42,.49],[.57,.62],[.79,.75],[.88,.84],[.7,.81],[.74,.87],[.47,.78],[.51,.84],[.29,.71],[.29,.78],[.10,.65],[0,.68]].flatMap(q=>point(q[0],q[1])));
    for(let k=0;k<7;k++){
     const fy=.26+k*.082,fx=(fy-.2)*1.2,yy=Math.floor(tip+len*fy),xx=Math.floor(cx+side*half*fx);let bw=Math.max(2,Math.floor(half*(.1+noise(seed,k,ix)*.19)));
     block(c,lightSide?lit[j]:green[j],xx+(side<0?-bw:0),yy,bw,1);if(k%2===0)block(c,lightSide?"#79905b":green[j],xx,yy-1,2,1)
    }
   }
  }
  tier(h*.30,h*.57,h*.40,0);tier(h*.22,h*.49,h*.34,1);tier(h*.15,h*.40,h*.275,2);tier(h*.07,h*.35,h*.211,3);tier(0,h*.30,h*.15,4);
  block(c,"#79925e",cx,0,1,3);
 });treeArt.set(seed+"-"+h,a);return a
}
function bush(c,x,y,seed,berries=false){
 for(let i=0;i<6;i++){let bx=x-8+i*3,hi=3+Math.floor(noise(seed,i)*5);block(c,"#405438",bx,y-hi,4,hi);block(c,"#637447",bx+1,y-hi-1,3,3);block(c,"#899050",bx+2,y-hi-2,2,1);if(berries&&i%2===0){block(c,"#943e43",bx,y-hi+2,3,3);block(c,"#e17a61",bx,y-hi+2,1,1)}}
}
function groundDetail(c,x,g){
 let yy=g*T,xx=x*T,n=noise(x,g);
 if(n>.68&&n<.79){block(c,"#53574c",xx+3,yy-3,9,3);block(c,"#7c7e68",xx+4,yy-4,6,2);block(c,"#a29d7b",xx+6,yy-4,3,1)}
 for(let i=0;i<4;i++){let dx=xx+Math.floor(noise(x,i,11)*15),h=2+Math.floor(noise(x,i,12)*4);block(c,i%2?"#718043":"#566b3c",dx,yy-h,1,h);block(c,"#9b9d53",dx+1,yy-h-1,1,2)}
 if(n>.47&&n<.61){block(c,"#758348",xx+7,yy-5,1,5);block(c,"#edbd73",xx+6,yy-6,3,2);block(c,"#d79d59",xx+1,yy-4,2,1)}
}
function tent(c,x,y){
 const p=(k,arr)=>polygon(c,k,arr.map((n,i)=>n+(i%2?y:x)));
 p("#3e3f31",[-23,0,-5,-22,10,-24,22,-1,16,1]);
 p("#bd8251",[-23,-1,-7,-22,6,-24,-6,-1]);p("#da9e60",[-22,-2,-7,-22,-3,-22,-13,-3]);
 p("#80563b",[-6,-1,6,-24,22,-1]);p("#e1a567",[-6,-1,6,-24,8,-23,-1,0]);
 p("#413b30",[-1,-1,6,-18,15,-1]);p("#574436",[5,-15,9,-13,14,-2,5,-2]);
 block(c,"#7d6046",x+5,y-23,2,23);block(c,"#e3bb80",x+5,y-25,2,3);
 block(c,"#684d37",x-23,y-1,43,2);block(c,"#a97c4b",x-22,y-2,18,1);
 for(let i=0;i<8;i++){block(c,"#bc9a68",x-16-i,y-15+i*2,2,1);block(c,"#b3986c",x+15+i,y-16+i*2,2,1)}
 block(c,"#4b3c2d",x-26,y-3,2,4);block(c,"#67513d",x+24,y-3,2,4);
 block(c,"#574432",x-31,y-7,10,7);block(c,"#af8050",x-30,y-8,9,1);block(c,"#80603f",x-30,y-6,8,2);block(c,"#b08b56",x-29,y-7,1,6);block(c,"#aa8352",x-23,y-7,1,6)
}
function objectArt(c,o,t){
 const x=o.x*T+8,y=(o.y+1)*T,p=(k,dx,dy,w,h)=>block(c,k,x+dx,y+dy,w,h);
 if(o.id==="ladder"){for(let i=0;i<2;i++){let dx=i?5:-6;p("#4e362a",dx,-16,3,16);p("#99734d",dx,-16,1,16)}for(let k=-14;k<0;k+=7){p("#6f5139",-4,k,10,3);p("#bd9564",-4,k,10,1)}}
 else if(o.id==="campfire"){
  glow(c,x,y-6,27,"252,148,63",.22);
  for(let i=0;i<5;i++){let dx=-8+i*3.6;p("#646252",dx,-3+(i%2),4,3);p("#a0997a",dx,-3+(i%2),3,1)}
  p("#513c2a",-7,-4,13,2);p("#916140",-7,-5,6,1);
  for(let i=0;i<5;i++){let h=4+Math.floor((Math.sin(t*6+i*1.7)*.5+.5)*6)+(i===2?4:0);p("#d96535",-5+i*2,-4-h,3,h);p("#f0a744",-5+i*2,-3-h*.66,2,h*.7);p("#ffe394",-4+i*2,-3-h*.35,1,h*.36)}
  for(let i=0;i<4;i++){const f=(t*(.30+i*.045)+i*.27)%1;c.globalAlpha=(1-f)*.55;p(i%2?"#f5c27b":"#b6a391",Math.sin(f*6+i)*3+f*3,-13-f*15,1+i%2,2);c.globalAlpha=1}
 }else if(o.id==="torch"||o.id==="mineLamp"){
   const lamp=o.id==="mineLamp",dy=lamp?-6:-9;
   glow(c,x,y+dy,32,"251,161,63",.23+.025*Math.sin(t*5));
   if(lamp){p("#6b5d4a",-1,-15,2,7);p("#352e26",-3,-9,6,2);p("#cb8e43",-3,-7,6,5);p("#f9d48a",-2,-7,3,4);p("#504234",-3,-2,6,1)}
   else {p("#79533a",-1,-9,3,9);p("#c77535",-2,-14,5,6);p("#ffd77a",-1,-14+Math.sin(t*7),3,5)}
 }else if(o.id==="beam"){
   let bot=o.y+1;while(bot<o.y+9&&!tile(o.x,bot))bot++;let len=(bot-o.y)*T;
   p("#392d27",-3,-16,6,len);p("#795b40",-3,-16,3,len);p("#977552",-2,-16,1,len);p("#6e533e",-8,-16,16,4);p("#ab8560",-8,-16,16,1);
   for(let i=0;i<6;i++){p("#765a43",-8+i,-13+i,2,2);p("#71563f",7-i,-13+i,2,2)}
 }else if(o.id==="cart"){
   p("#483e33",-17,-1,33,1);p("#87755b",-15,-2,29,1);
   for(let i=-13;i<16;i+=6)p("#6f5640",i,-1,3,1);
   for(const k of [-6,5]){p("#181f23",k-2,-5,5,4);p("#70746d",k,-4,2,2)}
   polygon(c,"#3b484a",[x-11,y-11,x+11,y-11,x+8,y-4,x-8,y-4]);
   p("#627271",-9,-10,17,3);p("#87948a",-11,-12,22,2);p("#475457",-7,-7,15,2);
   for(let j=0;j<4;j++){p(j%2?"#303b40":"#415257",-8+j*4,-13-j%3,5,3);p("#687370",-8+j*4,-13-j%3,3,1)}
 }else if(o.id==="outcrop"){
   const lilac=(o.x%3===0),cc=lilac?["#584857","#956d92","#c39cbb","#efd0d7"]:["#34575b","#497d7d","#6bb1ad","#b2e3cf"];
   glow(c,x,y-5,23,lilac?"181,119,184":"84,190,177",.24);
   for(const [dx,hh,lean] of [[-7,8,-3],[-3,13,-2],[0,17,3],[5,9,3],[8,5,2]]){
    const xx=x+dx;
    polygon(c,cc[0],[xx-3,y-1,xx-2+lean,y-hh+1,xx+lean,y-hh-2,xx+3+lean,y-hh+1,xx+3,y-1]);
    polygon(c,cc[1],[xx-2,y-1,xx-1+lean,y-hh,xx+lean,y-hh-2,xx+1+lean,y-hh,xx+1,y-1]);
    polygon(c,cc[2],[xx+1,y-1,xx+1+lean,y-hh,xx+lean,y-hh-2,xx+2+lean,y-hh,xx+3,y-2]);p(cc[3],dx+lean,-hh-1,1,2)
   }
 }else if(o.id==="mushroom"||o.id==="blossom"){
   let cool=o.id==="blossom";glow(c,x,y-4,19,cool?"75,189,176":"170,112,202",.17);
   for(let i=0;i<3;i++){let h=3+(i*3+o.x)%6,dx=i*4-6;p(cool?"#70a599":"#b8a0ae",dx,-h,1,h);p(cool?"#67b7a7":"#a07caa",dx-2,-h-1,5,2);p(cool?"#a5e2bd":"#dcc1d2",dx-1,-h-2,3,1)}
 }else if(o.id==="beacon"){glow(c,x,y-8,44,"103,213,191",.48);Art.item(c,o.id,x-10,y-20,20)}
 else Art.item(c,o.id,x-9,y-18,18)
}
const R={camX:0,camY:0,w:600,h:320,scale:2,clock:0,daylight:1,particles:[]};
function resizeGame(){
 const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
 R.scale=rect.width<620?Math.max(1.38,Math.min(rect.width/270,rect.height/265)):Math.max(1.45,Math.min(rect.width/630,rect.height/315));
 R.w=canvas.width=Math.round(rect.width/R.scale);R.h=canvas.height=Math.round(rect.height/R.scale);g.imageSmoothingEnabled=false
}
function camera(dt,snap=false){
 const p=S.p;let tx=limit(p.x-R.w*.48,0,Math.max(0,COLS*T-R.w));
 let localSurface=surface(Math.floor(p.x/T))*T;
 let focusY=Math.abs(p.y-localSurface)<3*T?Math.min(p.y,localSurface+T):p.y;
 let ty=limit(focusY-R.h*.485,-120,ROWS*T-R.h);
 let f=snap?1:1-Math.exp(-dt*5);R.camX+=(tx-R.camX)*f;R.camY+=(ty-R.camY)*f
}
function tileArt(c,id,tx,ty){let x=tx*T,y=ty*T,d=ty-surface(tx);
 const mat=id==="dirt"||id==="grass"?"dirt":id==="wood"||id==="plank"?id:d>15||id==="rockbase"?"deep":"stone";
 c.drawImage(textures[mat],(tx%8)*T,(ty%8)*T,T,T,x,y,T,T);
 if(oreColors[id])ore(c,id,tx,ty);
 if(id==="grass"){
  const v=noise(tx,ty);
  block(c,"#5f673b",x,y,T,5);block(c,"#849044",x,y,T,3);block(c,"#a5a65b",x,y,T,1);
  for(let i=0;i<5;i++){let a=Math.floor(noise(tx,i)*14),f=2+Math.floor(noise(tx,i,5)*4);block(c,i%2?"#6c783c":"#718243",x+a,y+2,2,f);if(i%2)block(c,"#927346",x+a+1,y+f,1,2)}
  if(ty===surface(tx))groundDetail(c,tx,ty)
 }else if(!tile(tx,ty-1)&&mat!=="wood"&&mat!=="plank"){block(c,mat==="dirt"?"#9e7954":"#71746a",x,y,T,1);block(c,mat==="dirt"?"#89704e":"#595e5a",x+1,y+1,T-2,1)}
 if(!tile(tx-1,ty))block(c,mat==="dirt"?"#523c2c":"#323a3b",x,y+(id==="grass"?4:1),2,14);
 if(!tile(tx+1,ty))block(c,mat==="dirt"?"#8d6849":"#626660",x+T-2,y+3,2,12);
 if(!tile(tx,ty+1)){block(c,"#171d2080",x,y+T-2,T,2);if(noise(tx,ty)>.64&&mat==="stone"){let len=2+noise(tx,ty,2)*4;block(c,"#3b4143",x+4,y+T,3,len);block(c,"#666c66",x+6,y+T,1,len*.65)}}
}
const chunks=new Map();
function invalidateTerrain(x,y){for(let cy=Math.floor((y-1)/8);cy<=Math.floor((y+1)/8);cy++)for(let cx=Math.floor((x-1)/8);cx<=Math.floor((x+1)/8);cx++)chunks.delete(cx+","+cy)}
function backgroundCave(c,x,y){
 const xx=x*T,yy=y*T;
 c.drawImage(textures.wall,x%8*T,y%8*T,T,T,xx,yy,T,T);
 const depth=y-BASE,step=x%37;
 const valley=Math.sin(x*.25)*1.6+Math.cos(x*.51)*.55;
 const field=Math.sin(x*.27+depth*.38)*.5+.5;
 block(c,"rgba(11,17,25,"+(.24+.34*field)+")",xx,yy,T,T);
 // Distant stalagmites form a second silhouette behind the traversable gallery.
 const floor=(BASE+9.7+valley)*T, tip=floor-(step%9===0?22:0);
 if(yy+T>=tip&&yy<floor+24){
  c.save();c.beginPath();c.rect(xx,yy,T,T);c.clip();
  polygon(c,"#243338",[xx, floor+18,xx, floor+1,xx+5,floor-1,xx+8,tip-4,xx+11,tip,xx+13,floor,xx+T,floor-1,xx+T,floor+18]);c.restore()
 }
 if(tile(x,y-1)){block(c,"#111a2569",xx,yy,T,4);
  if(noise(x,y,17)>.42){
   let ww=4+Math.floor(noise(x,y,19)*6),hh=4+Math.floor(noise(x,y,21)*9);
   polygon(c,"#384348",[xx+1,yy,xx+ww,yy,xx+ww-2,yy+3,xx+3,yy+hh,xx+2,yy+hh]);
   block(c,"#475354",xx+2,yy+1,2,3)
  }
 }
}
function topFace(c,x,y,id){
 const xx=x*T,yy=y*T,bump=7,rise=4;
 const pal=id==="grass"?["#88934e","#a8aa62","#758547"]:id==="dirt"?["#89694a","#9a7953","#7d6145"]:id==="wood"||id==="plank"?["#a07951","#ba9466","#795c3c"]:["#646a65","#7a8074","#4f5857"];
 polygon(c,pal[0],[xx,yy,xx+bump,yy-rise,xx+T+bump,yy-rise,xx+T,yy]);
 block(c,pal[1],xx+6,yy-rise,T,1);
 for(let n=0;n<3;n++)block(c,pal[2],xx+5+noise(x,y,n)*11,yy-2-Math.floor(noise(y,x,n)*2),2,1);
}
function terrainChunk(cx,cy){
 let key=cx+","+cy;if(chunks.has(key))return chunks.get(key);
 const buffer=bitmap(128,128,c=>{
  const A=Math.max(0,cx*8-1),B=Math.min(COLS-1,cx*8+8),Y=Math.max(0,cy*8-1),Z=Math.min(ROWS-1,cy*8+8);
  c.translate(-cx*128,-cy*128);
  for(let x=A;x<=B;x++){let sy=surface(x);for(let y=Math.max(Y,sy);y<=Z;y++)if(!tile(x,y))backgroundCave(c,x,y)}
  for(let x=A;x<=B;x++)for(let y=Y;y<=Z;y++){
   let id=tile(x,y);if(!id)continue;
   if(!tile(x,y-1))topFace(c,x,y,id);
   if(!tile(x+1,y)){let xx=(x+1)*T,yy=y*T;
    polygon(c,id==="grass"||id==="dirt"?"#57442f":id==="wood"||id==="plank"?"#5a4432":"#353e40",[xx,yy,xx+7,yy-4,xx+7,yy+12,xx,yy+16]);
    if(id==="grass")polygon(c,"#6e7b43",[xx,yy,xx+7,yy-4,xx+7,yy,xx,yy+4]);
    block(c,"#ffffff0e",xx+4,yy+4,2,4)
   }
  }
  for(let x=A;x<=B;x++)for(let y=Y;y<=Z;y++){let id=tile(x,y);if(id)tileArt(c,id,x,y)}
 });chunks.set(key,buffer);return buffer
}
let cachedSky=null,shadeLayer=null,lastSky="";
function draw(){
 const w=R.w,h=R.h,x0=Math.round(R.camX),y0=Math.round(R.camY),t=R.clock;
 const sun=R.daylight, sy=SURF-y0;
 const skyH=Math.max(55,sy), skyKey=[w,h,skyH,Math.round(x0/2),Math.round(sun*90),Math.floor(t*(typeof Session!=='undefined'&&Session.settings.quality==='low'?.2:.6))].join(".");
 if(lastSky!==skyKey){if(!cachedSky||cachedSky.width!==w||cachedSky.height!==h){cachedSky=document.createElement("canvas");cachedSky.width=w;cachedSky.height=h}
 paintSky(cachedSky.getContext("2d"),w,h,skyH,x0,sun,t);lastSky=skyKey}
 g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=false;g.drawImage(cachedSky,0,0);
 g.save();g.translate(-x0,-y0);
 const A=limit(Math.floor(x0/T)-1,0,COLS-1),B=limit(Math.ceil((x0+w)/T)+1,0,COLS-1),Y=limit(Math.floor(y0/T)-1,0,ROWS-1),Z=limit(Math.ceil((y0+h)/T)+1,0,ROWS-1);
 const cxA=Math.max(0,Math.floor(A/8)),cxB=Math.floor(B/8),cyA=Math.max(0,Math.floor((Y-1)/8)),cyB=Math.floor(Z/8);
 for(let cy=cyA;cy<=cyB;cy++)for(let cx=cxA;cx<=cxB;cx++)g.drawImage(terrainChunk(cx,cy),cx*128,cy*128);
 if(typeof drawBackgroundWalls==='function')drawBackgroundWalls(g,A,B,Y,Z);
 // Exposed shaft wall and two heavy timber bents supporting the old gallery.
 const beamY=(BASE+4)*T;
 const flapX=(START-6)*T-20;
 if(tile(START-6,BASE)){block(g,"#654d36",flapX,SURF-33,2,33);block(g,"#b29462",flapX+1,SURF-33,1,32);
  polygon(g,"#aa5a3c",[flapX+2,SURF-32,flapX+12,SURF-31,flapX+10,SURF-28,flapX+12,SURF-26,flapX+2,SURF-27]);
  block(g,"#d69a68",flapX+2,SURF-32,8,1)}

 block(g,"#3e342c",(START-5)*T,beamY,5*T,4);block(g,"#926f4d",(START-5)*T,beamY,5*T,1);block(g,"#6b513a",(START-5)*T,beamY+1,5*T,2);
 for(const o of W.objects){if(o.x<A-2||o.x>B+2||o.y<Y-9||o.y>Z+1||removed(o))continue;objectArt(g,o,t)}
 if(tile(START-6,BASE))tent(g,(START-6)*T+4,SURF);
 for(const tree of W.trees){if(tree.x<x0-55||tree.x>x0+w+55||S.chopped.includes(tree.seed))continue;const img=spruce(tree.h,tree.seed);g.drawImage(img,tree.x-Math.floor(img.width/2),tree.y-tree.h)}
 for(const b of W.bushes)if(b.x>x0-10&&b.x<x0+w+10)bush(g,b.x,b.y,Math.floor(b.x),!S.harvest[b.x]||S.harvest[b.x]<=S.day);
 for(const o of S.built)if(o.x>=A&&o.x<=B&&o.y>=Y&&o.y<=Z)objectArt(g,o,t);
 for(const m of W.mobs)if(m.x>x0-16&&m.x<x0+w+16&&m.y>=y0&&m.y<y0+h+15)Art.mob(g,m.type,m.x,m.y,m.dir,t);
 const p=S.p;
 if(!swing.hit||Math.floor(t*14)%2===0){Art.hero(g,p.x,p.y,p.dir,grounded&&Math.abs(p.vx)>3?t*10:0,swing.anim>0?1-swing.anim/.3:0,S.belt[S.slot]);}
 if(typeof drawCoopPlayers==='function')drawCoopPlayers(g);
 // Local illumination and pixel dust stay in world space while the camera scrolls.
 if(sun<.97){g.fillStyle="rgba(25,36,62,"+((1-sun)*.47)+")";g.fillRect(x0,y0,w,h)}
 for(const o of W.objects.concat(S.built))if(!removed(o)&&["campfire","torch","mineLamp","beacon"].includes(o.id)&&o.x>=A-2&&o.x<=B+2&&o.y>=Y-2&&o.y<=Z+2){const xx=(o.x+.5)*T,yy=(o.y+.5)*T;glow(g,xx,yy, o.id==="beacon"?47:28,o.id==="beacon"?"112,226,208":"255,169,67",.12)}
 const depth=p.y-surface(Math.floor(p.x/T))*T;
 const torchOn=S.belt[S.slot]==="torch"&&S.inventory.torch>0;
 if(depth>20){
  const darkness=limit((depth-20)/125,0,.58);
  if(!shadeLayer||shadeLayer.width!==Math.ceil(w/2)||shadeLayer.height!==Math.ceil(h/2)){
   shadeLayer=document.createElement("canvas");shadeLayer.width=Math.ceil(w/2);shadeLayer.height=Math.ceil(h/2)
  }
  const l=shadeLayer.getContext("2d");l.clearRect(0,0,shadeLayer.width,shadeLayer.height);
  block(l,"rgba(7,13,22,"+darkness+")",0,0,shadeLayer.width,shadeLayer.height);
  l.globalCompositeOperation="destination-out";glow(l,(p.x-x0)/2,(p.y-y0-14)/2,torchOn?41:19,"0,0,0",1);
  for(const o of W.objects.concat(S.built))if(o.x>=A-2&&o.x<=B+2&&o.y>=Y-3&&o.y<=Z+2&&!removed(o)&&["campfire","mineLamp","torch","beacon","outcrop"].includes(o.id))glow(l,((o.x+.5)*T-x0)/2,((o.y+.5)*T-y0)/2,o.id==="beacon"?40:24,"0,0,0",.94);
  l.globalCompositeOperation="source-over";g.drawImage(shadeLayer,x0,y0,w,h)
 }
 if(depth>22||torchOn)glow(g,p.x+2,p.y-15,torchOn?49:26,"251,204,123",torchOn?.25:.13);
 for(const o of W.objects)if(o.id==="outcrop"&&!removed(o)&&o.x>=A&&o.x<=B&&o.y>=Y&&o.y<=Z){
  const f=(t*.22+noise(o.x,o.y))%1;
  g.globalAlpha=Math.sin(f*Math.PI)*.7;block(g,"#c7e1d8",(o.x+.5)*T+Math.sin(f*5+o.x)*6,(o.y+1)*T-13-f*11,1,1);g.globalAlpha=1
 }

 for(const a of R.particles){g.globalAlpha=Math.min(1,a.life*3);block(g,a.color,a.x,a.y,a.sz,a.sz)}g.globalAlpha=1;
 const target=targetAt(pointer.wx,pointer.wy);
 if(pointer.active&&!mode&&target&&inReach(pointer.wx,pointer.wy)){
  let xx=target.gx*T,yy=target.gy*T,ss=T;g.strokeStyle="#f7dfa7b8";g.lineWidth=1;g.strokeRect(xx+.5,yy+.5,ss-1,ss-1);
  if(swing.value>0){block(g,"#1a211f",xx,yy-4,ss,2);block(g,"#f0b35c",xx,yy-4,ss*Math.min(1,swing.value),1)}
 }
 g.restore()
}

