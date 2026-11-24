'use strict';
// Small, pure transaction layer shared by the host and guests.
const CoopCore=(()=>{
const clone=x=>JSON.parse(JSON.stringify(x));
const safe=k=>!['__proto__','prototype','constructor'].includes(k);
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function flatten(v,p='',out={}){if(v&&typeof v==='object'&&!Array.isArray(v)){for(const k of Object.keys(v).sort())if(safe(k))flatten(v[k],p?p+'/'+k:k,out);}else out[p]=clone(v);return out;}
function diff(a,b){const out=[];for(const k of new Set([...Object.keys(a),...Object.keys(b)]))if(!eq(a[k],b[k]))out.push({k,had:Object.hasOwn(a,k),before:a[k],has:Object.hasOwn(b,k),after:b[k]});return out;}
function apply(base,ops){if(!Array.isArray(ops)||ops.length>10000)return false;for(const o of ops){if(typeof o.k!=='string'||o.k.split('/').some(k=>!safe(k))||Object.hasOwn(base,o.k)!==o.had||!eq(base[o.k],o.before))return false;}for(const o of ops){if(o.has)base[o.k]=clone(o.after);else delete base[o.k];}return true;}
function expand(flat){const out={};for(const [path,value]of Object.entries(flat)){const keys=path.split('/');if(keys.some(k=>!safe(k)))continue;let o=out;for(const k of keys.slice(0,-1))o=o[k]||={};o[keys.at(-1)]=clone(value);}return out;}
return{clone,flatten,diff,apply,expand};})();
if(typeof module!=='undefined')module.exports=CoopCore;
