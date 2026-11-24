(() => {
  "use strict";
  // Mountain vertices and trees live in panorama space. Only their drift speed
  // differs, so the silhouettes remain stable when the camera moves.
  const fract = value => value - Math.floor(value);
  function hash(n) {
    let v = (n | 0) + 149;
    v = Math.imul(v ^ (v >>> 16), 0x45d9f3b);
    v = Math.imul(v ^ (v >>> 16), 0x45d9f3b);
    return ((v ^ (v >>> 16)) >>> 0) / 4294967296;
  }
  function blend(a, b, t) {
    const ca = Number.parseInt(a, 16), cb = Number.parseInt(b, 16);
    const channel = shift => Math.round(((ca >> shift) & 255) * (1-t) + ((cb >> shift) & 255) * t);
    return 'rgb(' + channel(16) + ',' + channel(8) + ',' + channel(0) + ')';
  }
  function box(c, color, x, y, w, h) {
    c.fillStyle = color;
    c.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h));
  }
  function pixelPolygon(c, color, points, step=2) {
    // Vertical spans give every facet a shared, square-pixel edge.
    let minX = Infinity, maxX = -Infinity;
    for (const p of points) { minX = Math.min(minX,p[0]); maxX = Math.max(maxX,p[0]); }
    c.fillStyle = color;
    for (let x=Math.floor(minX/step)*step; x<maxX; x+=step) {
      const at=x+step*.5;
      let top=Infinity, bottom=-Infinity;
      for(let j=0;j<points.length;j++){
        const a=points[j], b=points[(j+1)%points.length];
        if ((a[0]<=at && b[0]>at)||(b[0]<=at && a[0]>at)) {
          const y=a[1]+(at-a[0])*(b[1]-a[1])/(b[0]-a[0]);
          top=Math.min(top,y); bottom=Math.max(bottom,y);
        }
      }
      if(bottom>=top) c.fillRect(x,Math.floor(top),step,Math.ceil(bottom)-Math.floor(top)+1);
    }
  }
  function sun(c,W,s,day){
    const r=Math.max(10,Math.min(29,Math.round(s*.138)));
    const x=Math.round(W*.675), y=Math.round(s*.325);
    const color=blend('e0ead6','fff1b0',day);
    // A broad diffuse halo dissolves into the same values as the sky bands.
    const glow=c.createRadialGradient(x,y,r*.5,x,y,r*3.8);
    glow.addColorStop(0,day>.45?'rgba(255,227,153,.37)':'rgba(169,197,219,.12)');
    glow.addColorStop(1,'rgba(248,207,140,0)');
    c.fillStyle=glow; c.fillRect(x-r*4,y-r*4,r*8,r*8);
    c.fillStyle=color;
    for(let iy=-r;iy<r;iy+=2){
      const half=Math.round(Math.sqrt(Math.max(0,r*r-(iy+1)*(iy+1)))/2)*2;
      c.fillRect(x-half,y+iy,half*2,2);
    }
  }
  function clouds(c,w,s,cam,day) {
    const ref=Math.min(1.6,Math.max(.7,s/170));
    const width=174*ref, scroll=cam*.06;
    const bright=blend('47516a','ffe1a5',day), shade=blend('343e59','efb58a',day);
    const flat=blend('323b55','f1bc8e',day);
    for(let i=Math.floor((scroll-100)/width);i<=Math.ceil((scroll+w)/width);i++){
      const x=i*width-scroll+hash(i*5)*width*.36, y=(.13+hash(i*13+91)*.28)*s;
      const k=ref*(.65+hash(i+54)*.61);
      const slab=(color,ox,oy,ww,hh)=>box(c,color,x+ox*k,y+oy*k,ww*k,Math.max(1,hh*k));
      slab(flat,-15,6,62,2); slab(shade,-3,3,43,3); slab(bright,0,2,16,2);
      slab(shade,9,0,22,4); slab(bright,12,-1,13,2);
      slab(shade,26,2,16,3); slab(bright,31,1,8,2);
      slab(flat,56,7,12,1);
      if (i%2===0) {slab(shade,65,-10,24,1);slab(bright,73,-11,9,1);}
    }
  }
  function distantRange(c,w,s,cam,day) {
    const base=s*.89, z=Math.min(1.6,Math.max(.58,s/177)), scroll=cam*.1;
    const color=blend('29304c','d4a394',day), light=blend('303852','e1b09b',day);
    const spacing=62*z;
    const v=i=>[i*spacing+spacing*.3*hash(i+271)-scroll,base-z*(25+hash(i+230)*39)];
    const start=Math.floor((scroll-130*z)/spacing), end=Math.ceil((scroll+w+130*z)/spacing);
    for(let i=start; i<end; i++){
      const a=v(i),b=v(i+1);
      const p=[a[0]+(b[0]-a[0])*.45,Math.max(a[1],b[1])+10*z];
      pixelPolygon(c,color,[a,p,b,[b[0],s+4],[a[0],s+4]]);
      pixelPolygon(c,light,[a,p,[p[0]-16*z,p[1]+6*z]]);
    }
  }
  const ridge = [[-.61,.99],[-.49,.83],[-.42,.62],[-.36,.57],[-.29,.34],[-.245,.38],[-.18,.23],[-.135,.26],[-.055,.095],[-.025,.1],[0,0],[.045,.05],[.08,.12],[.115,.13],[.19,.29],[.23,.32],[.27,.29],[.34,.42],[.37,.45],[.44,.65],[.51,.69],[.66,1]];
  function mountain(c,peakX,baseY,span,height,id,day,far) {
    const z=height/75, int=id*71;
    const col=far ? [
      blend('242b48','b58c8b',day),blend('2c3451','d2a394',day),blend('333852','e1b09a',day),blend('282d4b','c6988e',day),blend('21263e','a98486',day)
    ] : [
      blend('222b40','8b7e81',day),blend('30384d','b39487',day),blend('343b50','c5aa98',day),blend('293044','a88c82',day),blend('1c283d','7f7780',day)
    ];
    const pts=ridge.map(([rx,ry],i)=> [peakX+span*rx,baseY-height+height*ry+(i!==10?(hash(int+i*2)-.5)*4*z:0)]);
    pixelPolygon(c,col[0],pts);
    const p=pts[10], l=pts[4], rr=pts[16];
    const bottom=[peakX-span*.05,baseY], foot=[peakX-span*.54,baseY];
    const ridgeMid=[peakX+span*.038,baseY-height*.75], seam=[peakX-span*.052,baseY-height*.53];
    pixelPolygon(c,col[1],[...pts.slice(0,11),ridgeMid,seam,bottom,foot]);
    pixelPolygon(c,col[2],[...pts.slice(6,11),[peakX-span*.08,baseY-height*.77],[peakX-span*.06,baseY-height*.8],[peakX-span*.16,baseY-height*.65]]);
    pixelPolygon(c,col[3],[l,[peakX-span*.25,baseY-height*.46],[peakX-span*.32,baseY-height*.5],[peakX-span*.39,baseY-height*.25]]);
    pixelPolygon(c,col[3],[p,ridgeMid,seam,[peakX-span*.12,baseY-height*.39],[peakX-span*.04,baseY-height*.71]]);
    pixelPolygon(c,col[4],[pts[13],pts[14],[peakX+span*.28,baseY-height*.24],[peakX+span*.13,baseY-height*.57]]);
    pixelPolygon(c,col[1],[pts[15],rr,[peakX+span*.32,baseY-height*.62],[peakX+span*.31,baseY-height*.62],[peakX+span*.36,baseY-height*.48]]);
    pixelPolygon(c,col[4],[pts[18],pts[19],[peakX+span*.51,baseY-height*.14],[peakX+span*.46,baseY-height*.29]]);
    // Narrow exposed stone shelves on the sunlit slope.
    for(let k=0;k<12;k++){
      let ry=.30+hash(int+k+625)*.52, rx=(hash(int+k+918)*.26-.40)*ry;
      const y=baseY-height+height*ry, x=peakX+span*rx;
      const length=Math.max(2,(3+hash(int+k+337)*10)*z);
      box(c,k%3?col[3]:col[2],x,y,length,1);
      if(k%4===0)box(c,col[3],x-2*z,y+z,length*.65,1);
    }
  }
  function mountainRow(c,w,s,cam,day,far){
    const zoom=Math.min(1.4,Math.max(.64,s/172));
    const spacing=(far?131:173)*zoom, scroll=cam*(far?.145:.225);
    const base=s*(far?.91:1.02);
    for(let i=Math.floor((scroll-spacing)/spacing);i<=Math.ceil((w+scroll+spacing)/spacing);i++){
      const seed=i+(far?563:13), x=i*spacing-scroll+spacing*(.22+.29*hash(seed));
      const ht=(far?(.32+.19*hash(seed+4)):(.31+.22*hash(seed+98)))*s;
      mountain(c,x,base,spacing*(1.52+.16*hash(seed+3)),ht,seed,day,far);
    }
  }
  function forest(c,w,s,cam,day,level){
    const zoom=Math.max(.62,Math.min(1.5,s/170));
    const spacing=(level?8:5)*zoom, scroll=cam*(level?.44:.315);
    const needle=level?blend('162b34','4d6260',day):blend('23313e','7d807b',day);
    const shadow=level?blend('142932','485d59',day):blend('22303c','747975',day);
    for(let i=Math.floor((scroll-spacing*3)/spacing);i<Math.ceil((scroll+w+spacing*3)/spacing);i++){
      const n=i+(level?716:237);
      const x=i*spacing-scroll+hash(n)*spacing*.8;
      const swell=(Math.sin(i*spacing/zoom*.024+.34)*.032+Math.cos(i*spacing/zoom*.045)*.012)*s;
      const floor=s*(level?1.025:.945)+swell;
      const ht=(level?12+hash(n+467)*16:7+hash(n+467)*9)*zoom;
      const top=floor-ht, width=ht*(.32+hash(n+439)*.09);
      c.fillStyle=i%4?needle:shadow;
      for(let y=0;y<ht;y+=2){
        const t=y/ht, band=t<.35?t/.35:t<.61?(t-.35)/.26:t<.83?(t-.61)/.22:(t-.83)/.17;
        const half=Math.max(.6,(t*.67+band*.33)*width*.5);
        c.fillRect(Math.floor(x-half),Math.floor(top+y),Math.max(1,Math.ceil(half)*2-1),2);
      }
      box(c,shadow,x-1,floor-2,2,5);
      box(c,needle,x-spacing*.95,floor+1,spacing*2.05,Math.max(2,s*.30));
    }
  }
  let cache, key='';
  window.paintSky=function paintSky(ctx,W,H,surfaceY,cameraX,daylight,time){
    const iso=Math.max(0,Math.min(1,Number.isFinite(daylight)?daylight:1));
    const day=Math.round(iso*40)/40;
    const s=Math.round(surfaceY), cam=Math.round(cameraX/5)*5;
    const tag=[W,H,s,cam,day].join(',');
    if (key!==tag) {
      if(!cache)cache=document.createElement('canvas');
      if(cache.width!==W || cache.height!==H){cache.width=W;cache.height=H;}
      const c=cache.getContext('2d');
      c.imageSmoothingEnabled=false;
      const scale=Math.max(30,s);
      const skyTop=blend('192338','e6a17d',day), amber=blend('323c54','f6c18f',day), gold=blend('536073','ffe1a5',day);
      const grad=c.createLinearGradient(0,0,0,scale*.92);
      grad.addColorStop(0,skyTop);grad.addColorStop(.51,amber);grad.addColorStop(1,gold);
      c.fillStyle=grad;c.fillRect(0,0,W,H);
      if (day<.45){
        c.globalAlpha=Math.min(1,(.45-day)*2.7);
        for(let i=0;i<Math.ceil(W/6);i++){
          const x=fract(hash(i+183)-cam*.000001)*W, y=hash(i+7168)*scale*.8;
          box(c,i%5?'#b2b4b0':'#e2dcca',x,y,i%19?1:2,1);
        }
        c.globalAlpha=1;
      }
      if(s>0){
        sun(c,W,s,day);
        clouds(c,W,s,cam,day);
        distantRange(c,W,s,cam,day);
        mountainRow(c,W,s,cam,day,true);
        mountainRow(c,W,s,cam,day,false);
        forest(c,W,s,cam,day,0);
        forest(c,W,s,cam,day,1);
      }
      const floor=Math.max(0,Math.floor(s*1.18));
      box(c,blend('162932','485e5a',day),0,floor,W,Math.max(0,H-floor));
      key=tag;
    }
    ctx.drawImage(cache,0,0);
    if(iso>.42 && s>65){
      const t=Number.isFinite(time)?time:0;
      const shift=fract(t*.0035-cameraX*.00006+.32)*1.18-.09;
      const phase=Math.sin(t*2.8);
      ctx.fillStyle=blend('384457','8f746a',day);
      for(let i=0;i<4;i++){
        const x=Math.round(W*shift+i*9), y=Math.round(s*.29+Math.abs(i-2)*3+Math.sin(t*.65+i)*1.3);
        ctx.fillRect(x,y,1,1);
        const dy=(phase+i*.2)>.2?-1:0;
        ctx.fillRect(x-2,y+dy,2,1);ctx.fillRect(x+1,y+dy,2,1);
      }
    }
  };
})();
