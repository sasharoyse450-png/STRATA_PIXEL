'use strict';
const baseItemArt=Art.item;
Art.item=function(c,id,x,y,size=24){const v=extraItems[id];if(!v){baseItemArt(c,id,x,y,size);return;}c.save();c.translate(Math.round(x),Math.round(y));c.scale(size/24,size/24);const p=(color,x,y,w,h)=>block(c,color,x,y,w,h),col=v[3],dark='#30333b',light='#f3e3b9';
if(v[2]==='ore'){polygon(c,dark,[3,15,6,7,13,3,20,8,22,16,13,21,5,20]);polygon(c,col,[5,14,8,7,14,5,19,9,19,16,12,19,6,18]);p(light,9,8,4,2);p('#ffffff55',14,11,3,5);}
else if(id.toLowerCase().includes('pick')){p('#96673e',5,16,3,5);for(let i=0;i<11;i++)p('#c69c66',6+i,17-i,2,3);polygon(c,col,[4,4,10,3,17,6,21,12,21,17,17,11,12,8,4,6]);p(light,6,3,5,1);}
else if(id.toLowerCase().includes('sword')){polygon(c,dark,[4,20,2,18,14,5,20,2,21,8,8,20]);polygon(c,col,[6,17,16,6,20,3,19,8,8,19]);p(light,16,5,2,4);for(let i=0;i<7;i++)p('#c89f58',5+i,12+i,2,2);p('#815b3f',3,18,3,3);}
else if(id==='ironaxe'||id==='ironshovel'){baseItemArt(c,id==='ironaxe'?'axe':'shovel',0,0,24);p(col,14,5,4,4);}
else if(['chest','barrel'].includes(id)){p(dark,3,6,18,15);p(col,4,7,16,12);p('#e0b77c',4,7,16,2);p('#5b4031',4,12,16,2);p('#5b4031',7,8,2,11);p('#5b4031',17,8,2,11);p('#f1d17c',11,11,3,5);}
else if(id==='door'){p(dark,5,2,14,21);p(col,6,3,12,19);p('#6a4937',9,4,1,17);p('#6a4937',14,4,1,17);p(light,15,13,2,2);}
else if(id==='bed'){p('#81583c',2,13,20,5);p('#e9d8b5',3,10,6,4);p(col,9,11,12,5);p('#81583c',2,9,2,13);p('#81583c',20,15,2,7);}
else if(id==='anvil'){polygon(c,col,[2,7,21,7,18,12,14,12,14,17,19,19,19,21,5,21,5,19,10,17,10,12,5,11]);p(light,3,7,17,1);}
else if(id==='alchemy'){baseItemArt(c,'bench',0,0,24);p('#81b997',7,2,4,8);p('#a9e9c5',8,1,2,2);p('#c67c9a',15,4,4,5);}
else if(id==='farm'){p('#644535',2,16,20,6);for(let i=0;i<4;i++){p(col,4+i*5,8,1,10);p('#ccd97e',2+i*5,10,5,2);} }
else if(id==='sign'){p('#77513c',11,11,3,12);p(col,3,4,19,10);p('#634f38',5,7,13,1);p('#634f38',5,10,8,1);}
else if(id==='potion'){p(dark,9,2,6,5);p('#dcbb82',10,2,4,2);p('#b5d7ce',8,6,8,3);p(col,5,10,14,10);p('#f8c4ce',7,11,3,5);p(dark,6,20,12,1);}
else if(id==='mushroom'||id==='blossom'){p('#c6c5a0',10,11,3,10);polygon(c,col,[3,12,5,7,10,4,15,5,20,10,20,13]);p(light,8,7,3,2);}
else if(id==='armor'){polygon(c,col,[5,4,9,3,10,6,14,6,15,3,19,4,21,10,18,12,18,21,6,21,6,12,3,10]);p('#e3bd7f',11,8,2,11);}
else if(id==='bandage'){p('#e4ddbd',4,7,16,12);p('#aeab94',6,8,2,10);p('#aeab94',15,8,2,10);p('#bc7566',10,9,3,8);p('#bc7566',8,12,7,2);}
else if(id.endsWith('bar')||id==='bronze'){polygon(c,col,[3,12,13,6,19,7,21,14,10,20,3,17]);p(light,10,9,6,2);}
else {polygon(c,dark,[4,8,11,4,19,7,21,16,14,21,5,18]);polygon(c,col,[5,9,12,6,18,8,19,15,13,19,6,16]);p(light,8,9,4,2);if(v[2]==='food')p('#9c654d',9,14,6,2);}
c.restore();};
const baseMobArt=Art.mob;
Art.mob=function(c,type,x,y,dir,t){if(['rabbit','beetle'].includes(type)){baseMobArt(c,type,x,y,dir,t);return;}c.save();c.translate(Math.round(x),Math.round(y));c.scale(dir<0?-1:1,1);const p=(col,x,y,w,h)=>block(c,col,x,y,w,h),step=Math.sin(t*9)>0?1:0;
if(type==='slime'){const h=7+Math.round(Math.sin(t*4)*2);p('#345d4e',-8,-h,16,h);p('#76c790',-6,-h-2,12,h);p('#b4ebba',-4,-h+1,4,2);p('#243a35',2,-5,2,2);p('#243a35',5,-5,2,2);}
else if(type==='bat'){const flap=Math.sin(t*10)*3;p('#75608c',-3,-12,7,6);polygon(c,'#655477',[-2,-10,-13,-17-flap,-9,-6,0,-8]);polygon(c,'#8c74a3',[2,-10,12,-17-flap,10,-6,1,-8]);p('#f5c285',2,-12,2,1);}
else {const wolf=type==='wolf',col=wolf?'#929d9e':'#8e6853';p(col,-10,-10,17,7);p(wolf?'#c2c7bd':'#b48969',3,-13,8,8);p(col,4,-16,3,4);p('#263137',8,-11,2,2);p('#d8c9aa',9,-6,4,2);p(col,-8-step,-4,3,4);p(col,4+step,-4,3,4);p(col,-15,-11,6,3);}
c.restore();};
const baseObjectArt=objectArt;
objectArt=function(c,o,t){if(o.id==='door'&&stateOf(o).open){block(c,'#9c754f',o.x*T+1,o.y*T,3,16);return;}baseObjectArt(c,o,t);if(o.id==='farm'&&stateOf(o).ready){const mature=S.day*1440+S.minute>=stateOf(o).ready;for(let i=0;i<3;i++)block(c,mature?'#e8c76d':'#76a45c',o.x*T+3+i*4,o.y*T+(mature?2:8),2,mature?12:6);}};
