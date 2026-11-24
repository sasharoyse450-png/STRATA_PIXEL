'use strict';
// Independent world and character records. The old single-save key is never overwritten.
const Session=(()=>{
 const KEY='strata.profiles.v1',LEGACY='strata.northern-frontier.v3';
 const copy=v=>JSON.parse(JSON.stringify(v));
 const defaults={quality:'high',fps:60,zoom:1,particles:true,lights:true,weather:true,volume:60,sound:false};
 let db;try{db=JSON.parse(localStorage.getItem(KEY));}catch{}
 if(!db||db.version!==1)db={version:1,worlds:[],characters:[],selectedWorld:null,selectedCharacter:null,settings:{...defaults}};
 db.settings={...defaults,...db.settings};
 const uid=prefix=>prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
 const characterFields=['equipment','order','maxHp','maxMana','welcome','foodCooldown','healCooldown','manualBelt'];
 function persist(){try{localStorage.setItem(KEY,JSON.stringify(db));return true;}catch{return false;}}
 function split(state,w,c){
 const s=copy(state),frontier=s.frontier||{};
 c.state={inventory:s.inventory,belt:s.belt,slot:s.slot,p:{hp:s.p.hp,food:s.p.food,energy:s.p.energy,mana:s.p.mana},frontier:{}};
 for(const k of characterFields){if(frontier[k]!==undefined)c.state.frontier[k]=frontier[k];delete frontier[k];}
 w.positions||={};w.positions[c.id]={x:s.p.x,y:s.p.y,dir:s.p.dir};
 delete s.inventory;delete s.belt;delete s.slot;delete s.p;delete s.sound;s.frontier=frontier;w.state=s;w.updated=Date.now();c.updated=Date.now();
 }
 if(!db.importedLegacy){let old;try{old=JSON.parse(localStorage.getItem(LEGACY));}catch{}
 if(old?.version===3&&old.p&&old.inventory){const w={id:uid('world'),name:'Северный рубеж',seed:'0',difficulty:'normal',created:Date.now(),positions:{}},c={id:uid('hero'),name:'Первопроходец',outfit:'teal',hair:'brown',created:Date.now()};old.belt=Array(10).fill(null);old.slot=0;old.frontier||={};old.frontier.manualBelt=true;split(old,w,c);db.worlds.push(w);db.characters.push(c);db.selectedWorld=w.id;db.selectedCharacter=c.id;}
 db.importedLegacy=true;persist();}
 const world=db.worlds.find(w=>w.id===db.selectedWorld),character=db.characters.find(c=>c.id===db.selectedCharacter);
 function hashSeed(v){if(v==='0')return 0;let h=2166136261;for(const c of String(v))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
 let autoStart=false;try{autoStart=sessionStorage.getItem('strata.start')==='yes';sessionStorage.removeItem('strata.start');}catch{}
 return {db,world,character,settings:db.settings,seed:hashSeed(world?.seed||'0'),autoStart,copy,persist,
 loadState(){if(!world||!character)return null;const s={...(copy(world.state||{})),...(copy(character.state||{}))};s.version=3;s.frontier={...copy(world.state?.frontier||{}),...copy(character.state?.frontier||{})};s.p={...copy(character.state?.p||{}),...copy(world.positions?.[character.id]||{})};s.belt=character.state?.belt?.length===10?copy(character.state.belt):Array(10).fill(null);s.slot=character.state?.slot||0;if(!s.frontier.manualBelt){s.belt=Array(10).fill(null);s.frontier.manualBelt=true;}return s;},
 saveState(s){if(!world||!character||!db.worlds.includes(world)||!db.characters.includes(character))return true;split(s,world,character);return persist();},
 createWorld(name,seed,difficulty){name=name.trim();if(!name||name.length>32)throw Error('Введите название от 1 до 32 символов');const w={id:uid('world'),name,seed:seed.trim().slice(0,48)||String(Math.floor(Math.random()*1e9)),difficulty:['normal','expert'].includes(difficulty)?difficulty:'normal',created:Date.now(),positions:{}};db.worlds.push(w);db.selectedWorld=w.id;if(!persist()){db.worlds.pop();throw Error('Не удалось сохранить мир: хранилище браузера заполнено');}return w;},
 createCharacter(name,outfit,hair){name=name.trim();if(!name||name.length>24)throw Error('Введите имя от 1 до 24 символов');const c={id:uid('hero'),name,outfit:['teal','red','blue','green'].includes(outfit)?outfit:'teal',hair:['brown','blond','dark'].includes(hair)?hair:'brown',created:Date.now()};db.characters.push(c);db.selectedCharacter=c.id;if(!persist()){db.characters.pop();throw Error('Не удалось сохранить персонажа');}return c;},
 importBackup(text){if(text.length>8000000)throw Error('Файл слишком большой');const incoming=JSON.parse(text,(k,v)=>['__proto__','prototype','constructor'].includes(k)?undefined:v);if(incoming?.version!==1||!Array.isArray(incoming.worlds)||!Array.isArray(incoming.characters)||incoming.worlds.length>100||incoming.characters.length>100)throw Error('Это не резервная копия STRATA');for(const r of [...incoming.worlds,...incoming.characters])if(!r||typeof r.name!=='string'||typeof r.id!=='string')throw Error('Повреждённая запись');const priorW=db.worlds.length,priorC=db.characters.length,ids={};for(const c of incoming.characters){const old=c.id;c.id=uid('hero');ids[old]=c.id;c.name=c.name.slice(0,24);db.characters.push(c);}for(const w of incoming.worlds){w.id=uid('world');w.name=w.name.slice(0,32);w.seed=String(w.seed||'0');w.positions=Object.fromEntries(Object.entries(w.positions||{}).filter(([id])=>ids[id]).map(([id,p])=>[ids[id],p]));db.worlds.push(w);}if(!persist()){db.worlds.splice(priorW);db.characters.splice(priorC);throw Error('Не удалось сохранить резервную копию');}return incoming.worlds.length;},
 deleteWorld(id){const i=db.worlds.findIndex(w=>w.id===id);if(i<0)throw Error('Мир не найден');const old=db.selectedWorld,w=db.worlds.splice(i,1)[0];if(old===id)db.selectedWorld=db.worlds[0]?.id||null;if(!persist()){db.worlds.splice(i,0,w);db.selectedWorld=old;throw Error('Не удалось сохранить удаление');}return w;},
 deleteCharacter(id){const i=db.characters.findIndex(c=>c.id===id);if(i<0)throw Error('Персонаж не найден');const old=db.selectedCharacter,c=db.characters.splice(i,1)[0];if(old===id)db.selectedCharacter=db.characters[0]?.id||null;if(!persist()){db.characters.splice(i,0,c);db.selectedCharacter=old;throw Error('Не удалось сохранить удаление');}return c;},
 start(){if(!db.worlds.some(w=>w.id===db.selectedWorld)||!db.characters.some(c=>c.id===db.selectedCharacter))throw Error('Выберите мир и персонажа');if(!persist())throw Error('Не удалось сохранить выбор');sessionStorage.setItem('strata.start','yes');location.reload();}
 };
})();
window.Session=Session;
