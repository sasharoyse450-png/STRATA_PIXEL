/* STRATA pixel sprites. All coordinates in the atlas are individual pixels. */
(() => {
  'use strict';
  const atlas = new Map();
  const ink = '#232023';
  const wood = ['#573a2e', '#875432', '#ac713d', '#dfa15b', '#f1c981'];
  const rock = ['#454653', '#646273', '#88878b', '#afb2a9', '#d7d7b7'];
  const green = ['#355243', '#48734f', '#6d9752', '#a3b951', '#cbd16d'];
  const iron = ['#6c5757', '#897370', '#b6907b', '#dcab83', '#f4d3a2'];
  const turquoise = ['#225a65', '#377e83', '#51ada3', '#81d7b6', '#dcf4cd'];

  function grid(size = 24) {
    const cells = Array.from({ length: size }, () => Array(size).fill(null));
    function dot(x, y, color) {
      if (x >= 0 && x < size && y >= 0 && y < size) cells[y][x] = color;
    }
    function rect(x, y, w, h, color) {
      for (let i = x; i < x + w; i++) for (let j = y; j < y + h; j++) dot(i, j, color);
    }
    function line(x, y, x1, y1, color, width = 1) {
      const dx = Math.abs(x1 - x), sx = x < x1 ? 1 : -1;
      const dy = -Math.abs(y1 - y), sy = y < y1 ? 1 : -1;
      let err = dx + dy;
      for (;;) {
        rect(x, y, width, width, color);
        if (x === x1 && y === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x += sx; }
        if (e2 <= dx) { err += dx; y += sy; }
      }
    }
    function poly(points, color) {
      const pairs = [];
      for (let i = 0; i < points.length; i += 2) pairs.push([points[i], points[i + 1]]);
      const ys = pairs.map(p => p[1]);
      for (let y = Math.min(...ys); y <= Math.max(...ys); y++) {
        const slices = [];
        for (let i = 0; i < pairs.length; i++) {
          const a = pairs[i], b = pairs[(i + 1) % pairs.length];
          if ((a[1] > y + .5) !== (b[1] > y + .5)) slices.push(a[0] + (y + .5 - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
        }
        slices.sort((a, b) => a - b);
        for (let i = 0; i + 1 < slices.length; i += 2) {
          for (let x = Math.ceil(slices[i]); x <= Math.floor(slices[i + 1]); x++) dot(x, y, color);
        }
      }
      for (let i = 0; i < pairs.length; i++) line(...pairs[i], ...pairs[(i + 1) % pairs.length], color);
    }
    function image(outline = true) {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (outline) {
        ctx.fillStyle = ink;
        cells.forEach((row, y) => row.forEach((v, x) => { if (v) { ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y - 1, 1, 3); } }));
      }
      cells.forEach((row, y) => row.forEach((v, x) => { if (v) { ctx.fillStyle = v; ctx.fillRect(x, y, 1, 1); } }));
      return canvas;
    }
    return { dot, rect, line, poly, image };
  }

  function makeItem(id) {
    const { rect, dot, line, poly, image } = grid();
    function handle(x, y, x1, y1) {
      line(x, y, x1, y1, wood[0], 3);
      line(x, y, x1, y1, wood[2], 2);
      line(x, y, x1, y1, wood[3]);
      rect(x, y + 1, 2, 2, wood[1]);
    }
    function cube(top, left, right) {
      poly([2,8, 12,3, 21,7, 12,12], top);
      poly([2,9, 11,13, 11,21, 2,17], left);
      poly([12,13, 21,8, 21,17, 12,21], right);
    }
    function gem(x, y, w, h, pal) {
      poly([x,y+2, x+2,y, x+w-1,y+1, x+w,y+h-3, x+w-2,y+h, x+1,y+h-2], pal[1]);
      poly([x,y+2,x+2,y,x+3,y+2,x+2,y+h-3,x+1,y+h-2],pal[3]);
      line(x+2,y+1,x+w-2,y+2,pal[4]);
      line(x+w-2,y+3,x+w-2,y+h-2,pal[2]);
    }
    function logFace(x,y) {
      poly([x,y+2,x+3,y,x+7,y+2,x+7,y+6,x+4,y+8,x,y+6],wood[3]);
      poly([x+1,y+3,x+3,y+2,x+6,y+3,x+6,y+5,x+4,y+6,x+1,y+5],wood[1]);
      line(x+2,y+3,x+4,y+3,wood[4]); dot(x+4,y+4,wood[3]);
    }
    function fire(x,y) {
      poly([x-5,y-1,x-4,y-5,x-2,y-3,x-1,y-9,x+2,y-11,x+2,y-7,x+4,y-5,x+5,y-2,x+3,y+1,x-3,y+1],'#cf4f30');
      poly([x-3,y-2,x-2,y-4,x,y-3,x+1,y-8,x+3,y-4,x+3,y-1,x+1,y,x-2,y],'#f18b32');
      rect(x-1,y-2,3,3,'#ffd266'); rect(x,y-4,2,3,'#fff0a1');
    }
    switch (id) {
      case 'pick': case 'ironpick': {
        const pal = id === 'pick' ? rock : turquoise;
        handle(3,18,14,7);
        poly([6,3,11,3,15,5,18,7,20,10,21,14,21,17,19,13,17,11,16,10,13,8,10,6,6,5,3,5],pal[2]);
        line(6,3,10,3,pal[4]); line(11,4,14,5,pal[3]); line(16,6,19,9,pal[3]);
        line(7,5,11,6,pal[1]); line(19,11,21,15,pal[1]);
        line(13,5,16,8,wood[0],2); line(13,5,16,8,wood[3]); dot(14,7,wood[2]); break;
      }
      case 'shovel':
        handle(5,17,14,8);
        poly([11,7,16,2,21,2,21,7,16,12,13,11],rock[3]);
        poly([14,10,19,5,21,4,21,7,16,12],rock[1]); line(13,7,17,3,rock[4]);
        line(14,9,18,5,rock[2]); line(11,9,14,12,wood[1]); line(12,8,15,11,wood[3]);
        poly([3,16,6,15,8,18,6,21,3,21,2,19],wood[2]);
        rect(4,18,2,2,ink); dot(3,17,wood[4]); break;
      case 'axe':
        handle(5,19,17,5);
        poly([10,2,13,3,15,4,17,4,19,6,17,8,15,9,14,12,11,13,7,11,6,8,9,7,11,5],rock[2]);
        poly([6,8,8,9,10,11,13,12,11,13,7,11],rock[4]); line(10,7,12,5,rock[3]);
        line(14,4,17,6,wood[3],2); dot(16,7,wood[0]); break;
      case 'torch':
        handle(6,18,14,8); line(11,10,14,12,'#57423d',2); line(12,9,15,11,'#afa385');
        poly([12,8,12,5,14,6,15,4,16,1,18,3,19,6,18,9,15,10],'#e9672e');
        poly([13,7,15,6,17,3,18,6,17,8,15,9],'#ffb643');rect(15,6,2,2,'#fff3a9'); break;
      case 'wood':
        poly([3,14,13,5,17,4,21,7,21,12,10,20,3,18],wood[1]);
        line(6,13,15,6,wood[3],2); line(11,15,20,8,wood[2]); line(10,18,20,11,wood[0]); logFace(2,13);break;
      case 'stone': case 'coal': case 'iron': {
        const pal = id === 'coal' ? ['#34323a','#44414c','#585967','#747480','#969293'] : rock;
        poly([2,13,4,8,8,5,14,4,19,7,21,13,19,17,12,20,5,18],pal[1]);
        poly([3,12,5,8,9,6,13,5,16,7,11,10,8,14],pal[3]);
        poly([10,13,16,8,19,8,20,12,17,14,12,16],pal[2]);
        line(8,7,12,6,pal[4]); line(5,16,8,17,pal[2]); line(15,17,19,15,pal[0]);
        if(id === 'iron'){rect(7,10,4,3,iron[2]);rect(8,10,3,1,iron[4]);rect(14,13,3,4,iron[1]);dot(15,13,iron[3]);rect(16,7,2,2,iron[3]);} break;
      }
      case 'berries': {
        line(10,13,14,5,wood[0],2);line(13,6,16,3,wood[3]);
        poly([5,4,10,4,13,7,10,8,6,7],green[2]);line(6,4,10,5,green[3]);
        poly([14,6,18,5,21,6,18,8,13,8],green[1]);
        [[6,9],[12,9],[9,15]].forEach(([x,y])=>{rect(x+1,y,4,6,'#94344b');rect(x,y+1,6,4,'#b54550');rect(x+1,y+1,2,2,'#f7a17c');rect(x+3,y+4,2,2,'#7c3045');}); break;
      }
      case 'ladder':
        [[4,17,15,4],[9,20,20,7]].forEach(([a,b,c,d])=>{line(a,b,c,d,wood[0],3);line(a,b,c,d,wood[3]);});
        [[7,15],[10,11],[13,7]].forEach(([x,y])=>{line(x,y,x+6,y+3,wood[1],2);line(x,y,x+6,y+3,wood[3]);});break;
      case 'dirt': case 'grass':
        cube(id==='grass'?green[2]:wood[2],wood[1],wood[0]);
        [[4,12],[8,17],[6,15],[13,16],[18,12]].forEach(([x,y])=>rect(x,y,2,1,wood[2]));
        if(id==='grass'){line(2,8,10,12,green[3],2);line(12,12,20,8,green[1],2);rect(4,11,2,3,green[2]);rect(15,10,2,3,green[1]);} break;
      case 'crystal':
        gem(3,12,6,7,turquoise);gem(13,9,6,9,['#42486e','#575c83','#7b85ae','#c4b9d2','#eeebd6']);gem(8,3,6,16,turquoise);break;
      case 'plank':
        [[1,13],[2,9],[3,6]].forEach(([x,y])=>{poly([x,y+6,x+13,y,x+18,y+2,x+18,y+4,x+5,y+10,x,y+8],wood[1]);poly([x,y+6,x+13,y,x+18,y+2,x+5,y+8],wood[3]);line(x+6,y+5,x+11,y+3,wood[2]);});break;
      case 'bench':
        rect(4,12,3,8,wood[1]);rect(17,11,3,9,wood[0]);rect(11,12,2,5,wood[1]);
        poly([2,10,13,5,21,8,21,12,11,16,2,13],wood[0]);poly([2,9,13,4,21,7,11,12],wood[3]);
        line(3,10,11,13,wood[2]);line(10,7,16,5,wood[4]);rect(5,15,1,4,wood[3]);dot(18,13,rock[3]);break;
      case 'furnace':
        cube(rock[3],rock[1],rock[0]);line(2,8,11,12,rock[2]);line(5,6,13,10,rock[1]);line(13,6,15,7,rock[4]);
        poly([4,13,6,12,9,14,9,18,4,16],ink);rect(5,14,2,2,'#ed7a39');rect(7,16,2,1,'#ffd56a');
        rect(15,13,4,1,rock[1]);rect(18,16,3,1,rock[2]);break;
      case 'ingot':
        poly([2,13,13,6,18,6,21,10,21,13,10,19,2,16],iron[1]);poly([3,12,13,6,18,6,19,9,9,15],iron[3]);
        line(4,12,13,7,iron[4]);line(10,16,20,10,iron[2]);line(3,14,8,16,iron[2]);break;
      case 'stew':
        poly([2,12,5,10,18,10,21,12,19,16,15,20,8,20,4,17],wood[1]);
        rect(5,12,14,3,'#da803d');rect(7,12,4,1,'#ffc672');rect(12,13,3,2,green[2]);
        line(3,13,7,16,wood[3]);line(8,17,15,17,wood[2]);line(16,16,19,14,wood[0]);
        line(9,8,8,6,rock[4]);line(8,5,9,3,rock[4]);line(14,8,15,5,rock[3]);break;
      case 'campfire':
        line(4,17,17,20,wood[0],3);line(5,16,18,19,wood[3],2);line(5,20,18,16,wood[1],2);rect(5,20,3,1,wood[3]);fire(12,16);dot(14,3,'#ffc776');break;
      case 'beacon':
        cube(rock[2],rock[1],rock[0]);rect(6,13,11,4,rock[0]);rect(8,12,8,2,rock[3]);gem(9,2,5,11,turquoise);rect(6,9,1,2,iron[3]);dot(17,5,iron[4]);break;
      case 'leaf':
        poly([3,17,4,12,8,7,14,5,21,3,20,9,17,14,10,18,5,18],green[2]);poly([4,17,18,6,15,12,9,17],green[1]);
        line(2,21,16,9,green[3]);line(7,12,8,9,green[3]);line(11,15,15,14,green[3]);break;
      case 'hand':
        poly([4,13,7,12,9,15,9,7,11,6,12,8,13,5,15,5,16,8,18,7,19,9,20,9,20,15,16,20,10,20], '#c58768');
        line(10,8,10,14,'#f3be8c');line(14,7,14,12,'#f3be8c');line(17,9,17,13,'#e1a479');rect(9,18,7,3,wood[1]);break;
      case 'heart':
        poly([2,6,4,4,8,4,11,7,14,4,18,4,21,7,21,11,12,20,10,20,2,12],'#b4474b');
        poly([3,7,5,5,8,5,11,8,15,5,18,5,19,8,18,11,11,17,4,11],'#e57065');rect(5,7,3,2,'#ffc0a1');break;
      case 'hunger':
        poly([3,16,5,14,7,14,10,11,13,14,10,17,9,20,7,21,5,20,5,18,3,18],'#f4cb90');
        poly([8,11,9,7,13,4,18,3,21,6,21,11,17,15,14,16,10,15], '#b86435');
        poly([9,11,11,7,15,5,18,5,19,7,18,10,14,13,11,13],'#e99b52');line(12,8,16,6,'#ffca7a');break;
      case 'energy':
        poly([13,2,19,2,14,10,20,10,8,22,10,14,5,14],'#d8a447');
        poly([13,3,17,3,12,11,16,11,10,17,12,12,8,12],'#ffdc7f');break;
      case 'sun':
        rect(9,7,6,10,'#eaa74a');rect(7,9,10,6,'#ffc961');rect(10,8,4,5,'#ffe69d');
        [[11,2,2,3],[11,19,2,3],[2,11,3,2],[19,11,3,2],[4,4,2,2],[18,4,2,2],[4,18,2,2],[18,18,2,2]].forEach(a=>rect(...a,'#ffc76a'));break;
      default: return makeItem('hand');
    }
    return image();
  }

  function item(ctx, id, x, y, size = 24) {
    if (!atlas.has(id)) atlas.set(id, makeItem(id));
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(atlas.get(id), Math.round(x), Math.round(y), size, size);
  }
  const explorerPalette = {
    K: '#28292c', H: '#413735', h: '#695044', M:'#a26840', L:'#ffdd84', l:'#fff3c0',
    F:'#e4ad7c', f:'#b77a58', a:'#f6c594', E:'#37363b', T:'#3b7476', t:'#285658',
    I:'#67938c', O:'#ee8c4d', o:'#b75236', S:'#784c35', s:'#a66a42', B:'#dba960',
    P:'#46505a', p:'#343d47', b:'#845b46', m:'#493831'
  };
  const appearance=window.Session?.character;
  const outfits={teal:['#3b7476','#285658','#67938c'],red:['#ab5149','#743e39','#cd8170'],blue:['#537fa4','#365571','#87a6be'],green:['#6f8550','#455b38','#a0b276']};
  const hairs={brown:['#413735','#695044'],blond:['#8b6d42','#c39b5b'],dark:['#24252b','#43444e']};
  if(appearance){const o=outfits[appearance.outfit]||outfits.teal,h=hairs[appearance.hair]||hairs.brown;[explorerPalette.T,explorerPalette.t,explorerPalette.I]=o;[explorerPalette.H,explorerPalette.h]=h;}
  const body = [
    '    KHHHHK    ', '   KHhhhhhK   ', '   HHHhhHhHK  ', '   KMBBMMLLK  ',
    '  KHMMSSMLlL  ', '   KHhFaaaF   ', '    HfFaEaaK  ', '    KfFaaFaF  ',
    '     KfFFfF   ', '   oOOOoOOK   ', '  oOoOTtOOK   ', 'KSSKOITsTTK   ',
    'SssKtITsTTK   ', 'SBsKtTIsTTK   ', 'SssKtTIsTTK   ', 'KSSKtTTSsTK   ',
    '  KSSTttBsK   ', '   KSSSBsSK   ', '    KpPPpK    '
  ];
  const explorer = new Map();
  function bodyFrame(stride) {
    if (explorer.has(stride)) return explorer.get(stride);
    const {rect,image} = grid(30);
    const sx = 7, sy = 2;
    const legs = stride > 0 ? [[5,19,3,3],[4,22,3,2],[3,24,4,1],[9,19,3,4],[10,23,3,2],[11,24,3,1]] : stride < 0 ? [[5,19,3,4],[5,23,3,2],[5,24,4,1],[8,19,3,3],[10,22,3,2],[11,24,4,1]] : [[5,19,3,4],[5,23,3,2],[5,24,4,1],[8,19,3,4],[8,23,3,2],[8,24,4,1]];
    legs.forEach(([x,y,w,h],i)=>rect(sx+x,sy+y,w,h,explorerPalette[['p','m','b','P','m','b'][i]]));
    body.forEach((row,y)=>[...row].forEach((c,x)=>{if(explorerPalette[c])rect(sx+x,sy+y,1,1,explorerPalette[c]);}));
    const sprite=image(false); explorer.set(stride,sprite); return sprite;
  }
  function hero(ctx, x, y, dir = 1, step = 0, act = 0, tool = 'pick') {
    const swing = Math.sin(Math.max(0, Math.min(1,act)) * Math.PI);
    const phase = Math.sin(step), stride = Math.abs(phase) < .28 ? 0 : Math.sign(phase);
    ctx.save(); ctx.translate(Math.round(x),Math.round(y)); ctx.scale(dir < 0 ? -1 : 1,1);ctx.imageSmoothingEnabled=false;
    const bounce = stride ? -1 : 0;
    ctx.drawImage(bodyFrame(stride), -14, -27 + bounce);
    const handX = 3 + Math.round(swing * 3), handY = -10 + bounce - Math.round(swing * 3);
    ctx.fillStyle=explorerPalette.t;ctx.fillRect(1,-15+bounce,3,5);ctx.fillStyle=explorerPalette.T;ctx.fillRect(2,-15+bounce,3,4);
    ctx.fillStyle=explorerPalette.I;ctx.fillRect(2,-15+bounce,2,1);ctx.fillStyle=explorerPalette.o;ctx.fillRect(3,-13+bounce,2,2);
    if (['pick','ironpick','axe','shovel','torch','hand','bronzepick','steelpick','gemPick','ironaxe','ironshovel','sword','ironsword','rubySword','deepblade','bow','staff','firestaff','hammer'].includes(tool) && tool !== 'hand') {
      ctx.save();ctx.translate(handX+1,handY);ctx.rotate(act > 0 ? -.9 + swing*1.8 : -.28);
      window.Art.item(ctx,tool,-4,-14,17);ctx.restore();
    }
    ctx.fillStyle=explorerPalette.f;ctx.fillRect(handX-1,handY-2,4,4);ctx.fillStyle=explorerPalette.a;ctx.fillRect(handX,handY-2,3,2);
    ctx.restore();
  }
  function mob(ctx, type, x, y, dir = 1, time = 0) {
    const beetle = !['rabbit','hare','bunny'].includes(type);
    const step = Math.sin(time*(beetle?9:5)) > .3 ? 1 : 0;
    ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(dir < 0 ? -1 : 1,1);
    const r=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
    if(beetle){
      r(-6,-2,2,2,ink);r(-3+step,-2,2,2,'#614456');r(1-step,-2,2,2,'#614456');r(5,-2,2,2,ink);
      r(-7,-5,2,3,ink);r(-5,-7,8,5,'#40364d');r(-6,-6,10,4,'#69475f');r(-4,-7,5,2,'#9a6482');
      r(-3,-6,2,2,'#d89496');r(1,-6,2,3,'#4f3f5a');r(3,-5,4,3,'#4a3b49');r(5,-5,2,1,'#ffb46f');
      r(6,-7,1,2,'#82656a');r(7,-8,1,1,'#cc8a68');
    }else{
      r(-7,-4,3,2,'#eed4a7');r(-5,-5,7,4,'#ac8f83');r(-4,-6,5,4,'#dcc2a8');r(-5,-4,3,2,'#e9d3af');
      r(0,-7,5,4,'#e5ccb0');r(1,-11,1,5,'#c3a493');r(2,-10,1,3,'#b77e79');r(4,-10,1,4,'#dac0a7');
      r(3,-6,1,1,ink);r(5,-4,1,1,'#aa7770');r(-4-step,-2,3,2,'#c6ac96');r(1+step,-2,2,2,'#e3c6a2');
    }
    ctx.restore();
  }
  window.Art = {item, hero, mob};
})();
