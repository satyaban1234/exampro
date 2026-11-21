/* ===== CONFIG ===== */
const API='https://script.google.com/macros/s/AKfycbw_DprhkPSMSb1T6Xqbgib6owOJ1cgTYMFyu4xtjTF9YdngiMF6ZCTT7uNhGgLHA3Au4w/exec', APP='EXAMPRO', TAG='Take exams and check results';

/* ===== CORE ===== */
const $=s=>document.querySelector(s),app=$('#app');
let off=+localStorage.off||0,tm=0,S={},R={},fl=0;
const now=()=>Date.now()+off;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const LS={g(k,d){try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}},s:(k,v)=>localStorage.setItem(k,JSON.stringify(v)),d:k=>localStorage.removeItem(k)};
const fmt=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return[s/3600|0,s%3600/60|0,s%60].map(x=>String(x).padStart(2,'0')).join(':')};
const img=id=>'https://lh3.googleusercontent.com/d/'+id;
const dev=()=>{let t=localStorage.dev;if(!t){t=Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.dev=t}return t};

async function api(a,d={}){
  let j;
  try{const r=await fetch(API,{method:'POST',body:JSON.stringify({a,...d})});j=await r.json()}
  catch(e){const x=new Error('No internet connection');x.net=1;throw x}
  if(j.t){off=j.t-Date.now();localStorage.off=off}
  if(j.err)throw new Error(j.err);
  return j;
}
function clean(h){
  const t=document.createElement('template');t.innerHTML=h||'';
  t.content.querySelectorAll('*').forEach(n=>{
    if(!/^(B|I|U|STRONG|EM|SPAN|FONT|BR|DIV|P|SUB|SUP)$/.test(n.tagName)){n.replaceWith(document.createTextNode(n.textContent));return}
    [...n.attributes].forEach(a=>{
      const ok=(a.name==='color'&&/^[#\w]+$/.test(a.value))||(a.name==='style'&&/^\s*color:\s*[#\w(),. ]+;?\s*$/.test(a.value));
      if(!ok)n.removeAttribute(a.name)});
  });
  return t.innerHTML;
}
const DL=[{left:'$$',right:'$$',display:true},{left:'\\[',right:'\\]',display:true},{left:'\\(',right:'\\)',display:false},{left:'$',right:'$',display:false}];
function M(el){try{window.renderMathInElement&&renderMathInElement(el,{delimiters:DL,throwOnError:false,strict:false})}catch(e){}}
function show(h){clearInterval(tm);app.innerHTML=h;scrollTo(0,0);M(app)}
function toast(m){const t=$('#toast');t.textContent=m;t.className='on';clearTimeout(toast.i);toast.i=setTimeout(()=>t.className='',2600)}
async function go(f,b){if(b)b.disabled=true;try{await f()}catch(e){toast(e.message)}if(b)b.disabled=false}
function ask(msg,yes='Yes',no='Cancel'){
  return new Promise(r=>{
    const o=$('#ov');
    o.innerHTML=`<div class="md"><p>${msg}</p><div class="row"><button class="b g" id="n">${no}</button><button class="b" id="y">${yes}</button></div></div>`;
    o.className='on';
    $('#y').onclick=()=>{o.className='';r(true)};
    $('#n').onclick=()=>{o.className='';r(false)};
  });
}
function tickTo(t,el,fn){
  clearInterval(tm);
  const f=()=>{const d=t-now();if(d<=0){clearInterval(tm);fn();return}el.textContent=fmt(d)};
  f();tm=setInterval(f,250);
}

/* ===== SHARED RENDERERS (also used by admin) ===== */
const L6='ABCDEF';
function reviewHTML(d){
  return d.qs.map((q,i)=>{
    const a=d.ans[i]??-1;
    return `<div class="rq"><div class="qh">Question ${i+1} <span class="tag ${a<0?'':a===q.c?'ok':'no'}">${a<0?'Not attempted':a===q.c?'Correct':'Incorrect'}</span></div>
    <div class="q">${clean(q.q)}</div>${q.img?`<img class="qi" src="${img(q.img)}">`:''}
    ${q.o.map((o,j)=>`<div class="op ${j===q.c?'cor':j===a?'wrg':''}"><span class="l">${L6[j]}</span><span>${clean(o)}</span></div>`).join('')}</div>`;
  }).join('');
}
function summaryHTML(d){
  const att=d.ans.filter(x=>x>=0).length,n=d.qs.length,pc=d.full?d.score/d.full*100:0;
  const sp=att?(d.tt/att).toFixed(1)+' sec / question':'-',ac=att?(d.correct/att*100).toFixed(1)+'%':'-';
  const ex=pc>=85?'Excellent':pc>=65?'Good':pc>=40?'Average':'Needs improvement';
  const r=(a,b)=>`<tr><td>${a}</td><td><b>${b}</b></td></tr>`;
  return `<table class="t">${r('Time taken',fmt(d.tt*1000))}${r('Total time',d.duration+' min')}${r('Total questions',n)}${r('Attended',att)}${r('Unattended',n-att)}${r('Correct',d.correct)}${r('Incorrect',d.wrong)}${r('Speed',sp)}${r('Accuracy',ac)}${r('Overall experience',ex)}</table>`;
}

/* ===== HOME ===== */
const A={};
const USER='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>';
const back=(a='home')=>`<button class="b g sm" data-a="${a}">&larr; Back</button>`;
function home(){
  S={};
  show(`<div class="top"><span></span><button class="ic" data-a="admin" aria-label="Admin">${USER}</button></div>
  <div class="hero"><img class="logo" src="icon.svg" alt=""><h1>${esc(APP)}</h1><p class="mu">${esc(TAG)}</p></div>
  <button class="b" data-a="join">Join Exam</button><button class="b o" data-a="res">Check Result</button>`);
}
A.home=home;
A.admin=()=>{
  if(window.Admin)return Admin.open();
  const s=document.createElement('script');s.src='admin.js';
  s.onload=()=>Admin.open();s.onerror=()=>toast('Admin module not available');
  document.head.appendChild(s);
};

/* ===== CODE + NAME ===== */
function codeScr(k){
  show(`<div class="pg">${back()}<h2>${k==='join'?'Join Exam':'Check Result'}</h2><label>Exam code</label>
  <input id="c" maxlength="6" placeholder="6-character code" autocomplete="off" autocapitalize="characters">
  <button class="b" data-a="c1">Continue</button></div>`);
  S.k=k;const c=$('#c');c.oninput=()=>c.value=c.value.toUpperCase().replace(/[^A-Z0-9]/g,'');
}
A.join=()=>codeScr('join');A.res=()=>codeScr('res');
A.c1=(v,b)=>go(async()=>{
  const code=$('#c').value;if(code.length!==6)throw Error('Enter the 6-character exam code');
  const r=await api('info',{code}),e=r.ex,k=S.k;
  if(k==='join'){const n=now();if(n<e.joinStart)throw Error('Exam has not started yet');if(n>e.end)throw Error('Exam has ended')}
  S={k,code,ex:e};nameScr();
},b);
function nameScr(){
  show(`<div class="pg">${back()}<h2>${esc(S.ex.name)}</h2><label>Your name</label>
  <input id="nm" placeholder="Enter your full name" autocomplete="off" autocapitalize="characters">
  <button class="b" data-a="n1">Continue</button></div>`);
  const n=$('#nm');n.oninput=()=>n.value=n.value.toUpperCase();
}
A.n1=(v,b)=>go(async()=>{
  const name=$('#nm').value.trim().replace(/\s+/g,' ').toUpperCase();
  if(!name)throw Error('Enter your name');
  if(S.k==='res'){R=await api('result',{code:S.code,name});resScr();return}
  const r=await api('join',{code:S.code,name,token:dev()});
  S={code:S.code,name,ex:r.ex,t0:0};sv();instrScr();
},b);
const sv=()=>LS.s('ses',{code:S.code,name:S.name,ex:S.ex,t0:S.t0});

/* ===== INSTRUCTIONS ===== */
function instrScr(){
  const e=S.ex,sg=x=>(x>0?'+':'')+x;
  show(`<div class="pg"><h2>${esc(e.name)}</h2><p class="mu">${esc(S.name)}</p>${e.desc?`<p>${esc(e.desc)}</p>`:''}
  <div class="card2"><h4>Instructions</h4><ul>
  <li>Total questions: <b>${e.n}</b>. Full marks: <b>${e.full}</b>.</li>
  <li>Duration: <b>${e.duration} minutes</b>. The exam ends at the same fixed time for everyone.</li>
  <li>Correct: <b>${sg(e.cM)}</b>, incorrect: <b>${sg(e.wM)}</b>, unanswered: <b>${sg(e.uM)}</b>.</li>
  <li>One question at a time. Tap an option to select it, tap again to unselect.</li>
  <li>Use Previous and Next, or the grid icon to jump to any question.</li>
  <li>The exam is submitted automatically when the timer ends.</li>
  <li>If you close the app, your answers stay saved on this device.</li></ul>
  ${e.instr?`<div>${clean(e.instr)}</div>`:''}</div><div id="w"></div></div>`);
  if(now()<e.startTime){
    $('#w').innerHTML='<p class="mu c">Exam has not started yet. Please wait and do not refresh.</p><div class="cd" id="cd"></div>';
    tickTo(e.startTime,$('#cd'),()=>startExam().catch(x=>toast(x.message)));
  }else $('#w').innerHTML='<button class="b" data-a="start">Start Exam</button>';
}
A.start=(v,b)=>go(startExam,b);

/* ===== EXAM ===== */
async function startExam(){
  const c='qs_'+S.code;let q=LS.g(c);
  if(!q){q=(await api('qs',{code:S.code,name:S.name,token:dev()})).qs;LS.s(c,q)}
  const saved=LS.g('ans_'+S.code,[]);
  S.qs=q;S.ans=q.map((_,i)=>saved[i]??-1);S.cur=0;
  if(!S.t0){S.t0=now();sv()}
  q.forEach(x=>{if(x.img)new Image().src=img(x.img)});
  examScr();
}
function examScr(){
  const e=S.ex;
  show(`<div class="eh"><div class="en"><b>${esc(e.name)}</b><small>${esc(S.name)}</small></div><div class="tmr" id="tmr">--:--:--</div>
  <button class="ic" data-a="pal" aria-label="Questions"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/></svg></button></div>
  <div id="qa"></div><div class="nav"><button class="b g" data-a="prev">Previous</button><button class="b" data-a="next">Next</button></div>`);
  qn();tickTo(e.end,$('#tmr'),finish);
}
function qn(){
  const q=S.qs[S.cur],a=S.ans[S.cur],last=S.cur===S.qs.length-1;
  $('#qa').innerHTML=`<div class="qh">Question ${S.cur+1} / ${S.qs.length}</div><div class="q">${clean(q.q)}</div>
  ${q.img?`<img class="qi" src="${img(q.img)}">`:''}
  ${q.o.map((o,i)=>`<button class="op${a===i?' sel':''}" data-a="pick" data-v="${i}"><span class="l">${L6[i]}</span><span>${clean(o)}</span></button>`).join('')}`;
  M($('#qa'));
  $('[data-a=next]').textContent=last?'Submit':'Next';
  $('[data-a=prev]').disabled=!S.cur;
  scrollTo(0,0);
}
A.pick=v=>{
  v=+v;S.ans[S.cur]=S.ans[S.cur]===v?-1:v;LS.s('ans_'+S.code,S.ans);
  document.querySelectorAll('#qa .op').forEach((b,j)=>b.classList.toggle('sel',j===S.ans[S.cur]));
};
A.prev=()=>{if(S.cur>0){S.cur--;qn()}};
A.next=()=>{if(S.cur<S.qs.length-1){S.cur++;qn()}else A.sub()};
A.pal=()=>{
  const a=S.ans.filter(x=>x>=0).length;
  $('#pal .sd').innerHTML=`<h3>Questions</h3><p class="mu"><span class="dot g"></span>Answered ${a}<span class="dot"></span>Unanswered ${S.qs.length-a}</p>
  <div class="grid">${S.qs.map((_,i)=>`<button class="pn${S.ans[i]>=0?' a':''}${i===S.cur?' c':''}" data-a="jump" data-v="${i}">${i+1}</button>`).join('')}</div>
  <button class="b" data-a="sub">Submit Exam</button>`;
  $('#pal').className='on';
};
A.pc=()=>{$('#pal').className=''};
A.jump=v=>{S.cur=+v;A.pc();qn()};
A.sub=async()=>{
  A.pc();const a=S.ans.filter(x=>x>=0).length;
  if(await ask(`Submit your exam?<br><br>Answered: <b>${a}</b> / ${S.qs.length}`,'Submit','Back'))finish();
};

/* ===== SUBMIT (offline safe) ===== */
function finish(){
  clearInterval(tm);$('#pal').className='';$('#ov').className='';
  const e=S.ex,tt=Math.max(0,Math.round((Math.min(now(),e.end)-Math.max(e.startTime,S.t0||e.startTime))/1000));
  const q=LS.g('pend',[]);q.push({code:S.code,name:S.name,token:dev(),ans:S.ans,tt});LS.s('pend',q);
  LS.d('ses');LS.d('ans_'+S.code);LS.d('qs_'+S.code);S={};
  done(0);flush().then(ok=>done(ok?1:2));
}
async function flush(){
  if(fl)return;fl=1;const left=[];
  for(const b of LS.g('pend',[])){try{await api('submit',b)}catch(e){if(e.net)left.push(b)}}
  LS.s('pend',left);fl=0;return !left.length;
}
function done(k){
  if(k&&!$('#dn'))return;
  show(`<div class="pg c" id="dn"><div class="ok2">${k===2?'&#9203;':k?'&#10003;':'&hellip;'}</div>
  <h2>${k===2?'Saved on this device':k?'Exam submitted successfully':'Submitting...'}</h2>
  <p class="mu">${k===2?'No internet. Your answers will be sent automatically when you are online.':k?'Your answers are recorded. Results appear after the admin publishes them.':'Please wait'}</p>
  ${k?'<button class="b" data-a="home">Go Home</button>':''}</div>`);
}

/* ===== RESULT ===== */
function resScr(){
  const d=R,p=d.full?Math.round(d.score/d.full*10000)/100:0;
  show(`<div class="pg">${back()}<div class="card"><small class="mu">${esc(d.exam)}</small><h3>${esc(d.name)}</h3>
  <div class="big">${d.score}<span> / ${d.full}</span></div><div class="pct">${p}%</div>
  ${d.pass>0?`<span class="tag ${d.score>=d.pass?'ok':'no'}">${d.score>=d.pass?'PASSED':'FAILED'}</span>`:''}</div>
  <button class="b" data-a="rev">Review</button><button class="b o" data-a="sum">Summary</button></div>`);
}
A.rev=()=>show(`<div class="pg">${back('rb')}<h2>Review</h2>${reviewHTML(R)}</div>`);
A.sum=()=>show(`<div class="pg">${back('rb')}<h2>Summary</h2>${summaryHTML(R)}</div>`);
A.rb=resScr;

/* ===== BOOT ===== */
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b&&A[b.dataset.a])A[b.dataset.a](b.dataset.v,b)});
document.addEventListener('gesturestart',e=>e.preventDefault());
addEventListener('online',flush);setInterval(flush,15000);
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js'));
window.X={A,api,show,toast,ask,go,esc,clean,M,fmt,img,LS,home,now,back,reviewHTML,summaryHTML,L6};

(async function boot(){
  home();flush();
  const w=document.createElement('div');w.style.cssText='position:absolute;opacity:0;pointer-events:none';w.textContent='$x^2$';document.body.appendChild(w);M(w);
  const s=LS.g('ses');if(!s)return;
  api('time').catch(()=>{});
  S=s;
  if(LS.g('qs_'+s.code)){
    if(now()>=s.ex.end){S.qs=LS.g('qs_'+s.code);S.ans=LS.g('ans_'+s.code,[]);return finish()}
    return startExam().catch(x=>toast(x.message));
  }
  if(now()<s.ex.end)instrScr();else{LS.d('ses');S={}}
})();
