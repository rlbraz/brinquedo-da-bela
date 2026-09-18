const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
let now=0,id=0; const timers=new Map(), nodes=new Map(), audios=[];
const node=()=>({style:{setProperty(){}},classList:{add(){},remove(){}},textContent:'',addEventListener(){},appendChild(){},remove(){}});
const get=k=>{if(!nodes.has(k))nodes.set(k,node());return nodes.get(k)};
class Audio {constructor(src){this.src=src;this.paused=true;audios.push(this)} play(){this.paused=false;return Promise.resolve()} pause(){this.paused=true}}
const ctx={Audio,console,performance:{now:()=>now},navigator:{maxTouchPoints:0,userAgent:'test',platform:'test'},matchMedia:()=>({matches:false}),history:{pushState(){}},location:{href:'https://test/'},setTimeout:(f,ms)=>{timers.set(++id,{f,at:now+ms});return id},clearTimeout:i=>timers.delete(i),document:{getElementById:get,querySelector:get,querySelectorAll:()=>[],addEventListener(){},documentElement:{},body:node(),createElement:node()}};
ctx.document.createElement=node;ctx.window=ctx;ctx.addEventListener=()=>{};
let script=readFileSync('dist/index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
script=script.replace('      })();','        window.testApi = {play, closeGame};\n      })();');
vm.runInNewContext(script,ctx);
function advance(ms){now+=ms;for(const [i,t] of [...timers])if(t.at<=now){timers.delete(i);t.f()}}
const voices=()=>audios.filter(a=>a.src.includes('voice-girl')&&!a.paused);
for (let i=0;i<20;i++) {
  ctx.testApi.play({key:'a',code:'KeyA'});
  assert.equal(voices().length,1);assert(voices()[0].src.endsWith('lion_1.mp3'));
  ctx.testApi.play({key:'h',code:'KeyH'});
  assert.equal(voices().length,1);assert(voices()[0].src.endsWith('estela_1.mp3'));
  assert.match(get('message').textContent,/Estela/);
}
ctx.close=()=>{};ctx.testApi.closeGame({preventDefault(){},stopPropagation(){}});advance(3000);assert.equal(voices().length,0);
console.log('PASS: 40 immediate scene/voice switches without advancing time, one voice at a time, close cancels playback');
