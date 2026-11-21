(function(){
const X=window.X,{esc,go,toast,ask,img}=X;
const $=s=>document.querySelector(s);
const R=(n,f)=>X.A['ad_'+n]=f;
const tok=()=>sessionStorage.atok;
const LEAVE=0;
let P={},D=null,ret=null,pk=0,hid=0,ph=null,Q={},QI=-1,RV=null;
const T={};

/* ---------- css ---------- */
const st=document.createElement('style');
st.textContent=`
.tabs{position:fixed;left:0;right:0;bottom:0;max-width:640px;margin:auto;display:flex;background:#fff;box-shadow:0 -1px 6px #0002;padding-bottom:env(safe-area-inset-bottom);z-index:6}
.tabs button{flex:1;border:0;background:none;padding:8px 0;font:600 12px inherit;font-family:inherit;color:#6b7090;display:flex;flex-direction:column;align-items:center}
.tabs .on{color:#4f46e5}
.li{display:block;width:100%;text-align:left;background:#fff;border:0;border-radius:14px;padding:12px 14px;margin:8px 0;box-shadow:0 1px 6px #0001;font:inherit;color:inherit}
.li small{color:#6b7090;display:block}
.tb{position:sticky;top:0;z-index:7;display:flex;gap:6px;flex-wrap:wrap;align-items:center;background:#fff;padding:8px 16px;margin:0 -16px;box-shadow:0 1px 6px #0002}
.tb button{min-width:38px;height:36px;border:1px solid #dfe3f1;border-radius:8px;background:#fff;font:700 15px inherit;font-family:inherit;color:#1f2340}
.tb .sw{min-width:26px;width:26px;height:26px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px #aaa}
.ed{min-height:70px;border:2px solid #dfe3f1;border-radius:12px;padding:10px;background:#fff;overflow-wrap:anywhere;outline:0}
.ed:focus{border-color:#4f46e5}
.orow{display:flex;gap:8px;align-items:flex-start;margin:8px 0}
.orow .ed{flex:1;min-height:44px}
.orow input[type=radio]{width:24px;height:24px;margin-top:10px;accent-color:#10b981;flex:none;padding:0}
.av{width:72px;height:72px;border-radius:50%;object-fit:cover;background:#e6e8f5}
.kv{display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-bottom:1px solid #eef0f8}
.kv b{text-align:right}
.dt{display:flex;gap:8px}
`;
document.head.appendChild(st);

/* ---------- helpers ---------- */
const p2=n=>String(n).padStart(2,'0');
const dstr=d=>d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate());
const tstr=d=>p2(d.getHours())+':'+p2(d.getMinutes())+':'+p2(d.getSeconds());
const loc=ts=>new Date(ts).toLocaleString([],{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'});
const kv=(k,v)=>`<div class="kv"><span>${esc(k)}</span><b>${esc(v)}</b></div>`;
const cl=h=>X.clean(h).replace(/&nbsp;/g,' ');
const tx=h=>{const d=document.createElement('div');d.innerHTML=cl(h);return d.textContent.trim().slice(0,70)};
const sd=()=>{if(D&&!D.edit)X.LS.s('draft',D)};
const gen=()=>{const c='ABCDEFGHJKLMNPQRSTUVWXYZ',n='23456789',a=c+n;let s;do{s='';for(let i=0;i<6;i++)s+=a[Math.random()*a.length|0]}while(!/[A-Z]/.test(s)||!/[0-9]/.test(s));return s};
function stat(e){const n=X.now();return n<e.joinStart?'Upcoming':n<e.startTime?'Joining open':n<e.end?'Running':'Ended'}
async function ap(a,d={}){
  try{return await X.api(a,{...d,tok:tok()})}
  catch(e){if(/Session expired/.test(e.message)){sessionStorage.removeItem('atok');login()}throw e}
}
function pic(file,max,q){
  return new Promise((res,rej)=>{
    const im=new Image,u=URL.createObjectURL(file);
    im.onload=()=>{const r=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');
      c.width=Math.round(im.width*r);c.height=Math.round(im.height*r);c.getContext('2d').drawImage(im,0,0,c.width,c.height);
      URL.revokeObjectURL(u);res(c.toDataURL('image/jpeg',q))};
    im.onerror=()=>rej(Error('Invalid image'));im.src=u;
  });
}
function logout(auto){
  const t=tok();if(t)X.api('logout',{tok:t}).catch(()=>{});
  sessionStorage.removeItem('atok');P={};ret=null;X.home();if(auto)toast('Logged out');
}

/* ---------- auto logout when leaving the app ---------- */
document.addEventListener('visibilitychange',()=>{
  if(!tok())return;
  if(document.hidden)hid=Date.now();
  else{if(!pk&&Date.now()-hid>=LEAVE)logout(true);pk=0}
});
document.addEventListener('mousedown',e=>{if(e.target.closest('.tb'))e.preventDefault()});
document.addEventListener('paste',e=>{
  if(!e.target.closest||!e.target.closest('.ed'))return;
  e.preventDefault();document.execCommand('insertText',false,(e.clipboardData||window.clipboardData).getData('text/plain'));
});

window.Admin={open:async()=>{
  if(!tok())return login();
  try{P=(await ap('profile')).p;dash('home')}catch(e){login()}
}};

/* ---------- login / register (admin code only) ---------- */
function login(){
  X.show(`<div class="pg">${X.back()}<h2>Admin Login</h2>
  <label>Admin code</label><input id="lc" type="password" autocomplete="off">
  <button class="b" data-a="ad_login">Login</button>
  <button class="b o" data-a="ad_reg">New admin? Register</button></div>`);
}
R('login0',login);
R('login',(v,b)=>go(async()=>{
  const r=await X.api('login',{code:$('#lc').value});
  sessionStorage.atok=r.tok;P=r.p;dash('home');
},b));
function bindPhoto(){
  const f=$('#fp');
  f.onchange=async e=>{
    const x=e.target.files[0];if(!x)return;
    try{ph=await pic(x,160,.7);$('#pv').src=ph}catch(err){toast(err.message)}
  };
}
R('pick',()=>{pk=1;$('#fp').click()});
function reg(){
  ph=null;
  X.show(`<div class="pg"><button class="b g sm" data-a="ad_login0">&larr; Back</button><h2>Admin Registration</h2>
  <div class="c"><img class="av" id="pv" alt=""><br><button class="b o sm" data-a="ad_pick" style="margin-top:8px">Choose photo</button></div>
  <label>Full name</label><input id="rn">
  <label>Age</label><input id="ra" type="number" inputmode="numeric">
  <label>Admin code (your secret code, minimum 6 characters)</label><input id="rc" type="password" autocomplete="off">
  <button class="b" data-a="ad_reg1">Register</button></div><input type="file" id="fp" accept="image/*" hidden>`);
  bindPhoto();
}
R('reg',reg);
R('reg1',(v,b)=>go(async()=>{
  await X.api('register',{name:$('#rn').value,age:$('#ra').value,code:$('#rc').value,photo:ph||''});
  toast('Registered. Please login.');login();
},b));

/* ---------- dashboard ---------- */
function dash(t){
  const tabs=[['home','Home','&#8962;'],['exams','Exams','&#9776;'],['students','Students','&#9786;'],['profile','Profile','&#9881;']];
  X.show(`<div id="ab"></div><div class="tabs">${tabs.map(x=>`<button class="${x[0]===t?'on':''}" data-a="ad_tab" data-v="${x[0]}"><span style="font-size:20px">${x[2]}</span>${x[1]}</button>`).join('')}</div>`);
  T[t]();
}
R('tab',v=>dash(v));

T.home=()=>{
  $('#ab').innerHTML=`<h2>Hello, ${esc(P.name)}</h2><p class="mu">Admin dashboard</p>
  <button class="b" data-a="ad_new">+ Create Exam</button><div id="hs"></div>`;
  ap('listExams').then(r=>{
    const n=r.list.reduce((a,e)=>a+e.count,0),w=r.list.filter(e=>!e.approved&&e.count>0).length;
    $('#hs').innerHTML=`<div class="card2">${kv('Total exams',r.list.length)}${kv('Total attempts',n)}${kv('Results waiting for approval',w)}</div>`;
  }).catch(()=>{});
};
T.exams=async()=>{
  $('#ab').innerHTML='<h2>Exams</h2><p class="mu" id="el">Loading...</p>';
  try{
    const r=await ap('listExams');
    $('#el').outerHTML=r.list.length?r.list.map(e=>`<button class="li" data-a="ad_ex" data-v="${e.code}"><b>${esc(e.name)}</b><small>Code ${e.code} &middot; ${e.count} attempted &middot; ${stat(e)}${e.approved?' &middot; Approved':''}</small></button>`).join(''):'<p class="mu">No exams yet.</p>';
  }catch(e){toast(e.message)}
};
T.students=async()=>{
  $('#ab').innerHTML='<h2>Students</h2><p class="mu" id="el">Loading...</p>';
  try{
    const r=await ap('students');
    $('#el').outerHTML=r.list.length?r.list.map(s=>`<button class="li" data-a="ad_st" data-n="${esc(s.name)}"><b>${esc(s.name)}</b><small>${s.count} exam(s)</small></button>`).join(''):'<p class="mu">No students yet.</p>';
  }catch(e){toast(e.message)}
};
T.profile=async()=>{
  $('#ab').innerHTML='<p class="mu">Loading...</p>';
  try{
    const r=await ap('profile');P=r.p;ph=null;
    $('#ab').innerHTML=`<div class="c"><img class="av" id="pv" src="${esc(P.photo)}" alt=""><h2>${esc(P.name)}</h2></div>
    <button class="b o sm" data-a="ad_pick">Change photo</button>
    <label>Full name</label><input id="pn" value="${esc(P.name)}">
    <label>Age</label><input id="pa" type="number" inputmode="numeric" value="${esc(P.age)}">
    <label>New admin code (leave empty to keep)</label><input id="pw" type="password" autocomplete="off">
    <button class="b" data-a="ad_psave">Save profile</button>
    <button class="b g" data-a="ad_out" style="margin-top:20px">Log out</button><input type="file" id="fp" accept="image/*" hidden>`;
    bindPhoto();
  }catch(e){toast(e.message)}
};
R('psave',(v,b)=>go(async()=>{
  const d={name:$('#pn').value,age:$('#pa').value};
  if(ph!==null)d.photo=ph;
  if($('#pw').value)d.code=$('#pw').value;
  const r=await ap('updateProfile',d);P=r.p;toast('Profile saved');T.profile();
},b));
R('out',()=>logout());

/* ---------- exam detail ---------- */
R('ex',(c,b)=>go(()=>exam(c),b));
async function exam(c){
  const r=await ap('examDetail',{code:c}),e=r.ex,done=r.list.filter(x=>x.status==='done');
  ret=()=>go(()=>exam(c));
  X.show(`<div class="pg"><button class="b g sm" data-a="ad_tab" data-v="exams">&larr; Back</button>
  <h2>${esc(e.name)}</h2><p class="mu">${esc(e.desc)}</p>
  <div class="card2">${kv('Exam code',e.code)}${kv('Status',stat(e))}${kv('Join opens',loc(e.joinStart))}${kv('Exam starts',loc(e.startTime))}${kv('Exam ends',loc(e.end))}${kv('Duration',e.duration+' min')}${kv('Questions',e.n)}${kv('Full marks',e.full)}${kv('Correct / wrong / blank',e.cM+' / '+e.wM+' / '+e.uM)}${kv('Pass mark',e.pass)}${kv('Result',e.approved?'Approved':'Not approved')}</div>
  <button class="b" data-a="ad_apv" data-c="${e.code}" data-v="${e.approved?0:1}">${e.approved?'Unapprove result':'Approve result'}</button>
  <button class="b o" data-a="ad_edit" data-c="${e.code}" data-k="${done.length}">Edit exam</button>
  <button class="b g" data-a="ad_del" data-c="${e.code}">Delete exam</button>
  <h3>Attempted (${done.length})</h3>
  ${done.map(x=>`<button class="li" data-a="ad_rv" data-c="${e.code}" data-n="${esc(x.name)}"><b>${esc(x.name)}</b><small>Score ${x.score} / ${e.full}</small></button>`).join('')||'<p class="mu">No one has attempted yet.</p>'}
  ${r.list.length>done.length?`<p class="mu">${r.list.length-done.length} in progress / not submitted</p>`:''}</div>`);
}
R('apv',(v,b)=>go(async()=>{
  const c=b.dataset.c;
  if(v==='0'&&!await ask('Unapprove this result? Students will no longer be able to see their results.','Unapprove','Cancel'))return;
  await ap('approve',{code:c,v:v==='1'});toast(v==='1'?'Result approved':'Result unapproved');await exam(c);
},b));
R('del',(v,b)=>go(async()=>{
  if(!await ask('Delete this exam with all its questions and results? This cannot be undone.','Delete','Cancel'))return;
  await ap('deleteExam',{code:b.dataset.c});toast('Exam deleted');dash('exams');
},b));
R('edit',(v,b)=>go(async()=>{
  if(+b.dataset.k>0&&!await ask('Students have already attempted this exam. Changing questions may make old results inconsistent. Continue?','Continue','Cancel'))return;
  const r=await ap('getExam',{code:b.dataset.c}),e=r.ex;
  D={edit:true,ex:{name:e.name,desc:e.desc,cM:e.cM,wM:e.wM,uM:e.uM,pass:e.pass,duration:e.duration,jm:'custom',jt:e.joinStart,sm:'custom',st:e.startTime,code:e.code},qs:r.qs};
  qList();
},b));

/* ---------- review ---------- */
R('rv',(v,b)=>go(async()=>{RV=await ap('review',{code:b.dataset.c,name:b.dataset.n});rvScr('r')},b));
function rvScr(t){
  const d=RV,p=d.full?Math.round(d.score/d.full*10000)/100:0;
  X.show(`<div class="pg"><button class="b g sm" data-a="ad_ret">&larr; Back</button>
  <div class="card"><small class="mu">${esc(d.exam)}</small><h3>${esc(d.name)}</h3><div class="big">${d.score}<span> / ${d.full}</span></div><div class="pct">${p}%</div></div>
  <div class="row"><button class="b${t==='r'?'':' o'}" data-a="ad_rvt" data-v="r">Review</button><button class="b${t==='s'?'':' o'}" data-a="ad_rvt" data-v="s">Summary</button></div>
  ${t==='r'?X.reviewHTML(d):X.summaryHTML(d)}</div>`);
}
R('rvt',v=>rvScr(v));
R('ret',()=>ret&&ret());

/* ---------- students ---------- */
R('st',(v,b)=>go(()=>student(b.dataset.n),b));
async function student(n){
  const r=await ap('studentDetail',{name:n});
  ret=()=>go(()=>student(n));
  X.show(`<div class="pg"><button class="b g sm" data-a="ad_tab" data-v="students">&larr; Back</button><h2>${esc(n)}</h2>
  ${r.list.map(x=>`<button class="li" data-a="ad_rv" data-c="${x.code}" data-n="${esc(n)}"><b>${esc(x.exam)}</b><small>Score ${x.score} / ${x.full??'-'}</small></button>`).join('')||'<p class="mu">No exams.</p>'}
  <button class="b g" data-a="ad_dst" data-n="${esc(n)}" style="margin-top:20px">Delete student</button></div>`);
}
R('dst',(v,b)=>go(async()=>{
  if(!await ask('Delete this student and all their exam records? This cannot be undone.','Delete','Cancel'))return;
  await ap('deleteStudent',{name:b.dataset.n});toast('Student deleted');dash('students');
},b));

/* ---------- create exam: step 1 ---------- */
const defEx=()=>({name:'',desc:'',cM:1,wM:0,uM:0,pass:0,duration:'',jm:'now',jt:0,sm:'auto',st:0,code:''});
R('new',async()=>{
  const o=X.LS.g('draft');
  if(o&&o.qs&&!o.edit&&await ask('Continue your unfinished exam "'+esc(o.ex.name)+'"?','Continue','Start new')){D=o;return qList()}
  D={edit:false,ex:defEx(),qs:[]};X.LS.d('draft');step1();
});
function step1(){
  X.show(`<div class="pg"><button class="b g sm" data-a="ad_tab" data-v="home">&larr; Back</button><h2>Create Exam</h2>
  <label>Exam name</label><input id="xn" value="${esc(D.ex.name)}">
  <label>Description</label><textarea id="xd" rows="3">${esc(D.ex.desc)}</textarea>
  <button class="b" data-a="ad_s1">OK</button></div>`);
}
R('s1',()=>{
  const n=$('#xn').value.trim();if(!n)return toast('Enter the exam name');
  D.ex.name=n;D.ex.desc=$('#xd').value.trim();sd();qEdit(-1);
});

/* ---------- question editor ---------- */
const COLS=['#000000','#dc2626','#2563eb','#059669','#d97706','#7c3aed'];
function drawOps(arr,c){
  $('#ops').innerHTML=arr.map((_,i)=>`<div class="orow"><input type="radio" name="co" value="${i}" ${c===i?'checked':''}><div class="ed eo" contenteditable="true"></div>${arr.length>2?`<button class="b g sm" data-a="ad_rop" data-v="${i}">&#10005;</button>`:''}</div>`).join('');
  document.querySelectorAll('.eo').forEach((el,i)=>el.innerHTML=arr[i]);
}
function readOps(){
  const c=document.querySelector('input[name=co]:checked');
  return {o:[...document.querySelectorAll('.eo')].map(e=>cl(e.innerHTML)),c:c?+c.value:-1};
}
function qimg(){
  $('#qimg').innerHTML=Q.img?`<img class="qi" src="${Q.local||img(Q.img)}" alt=""><button class="b g sm" data-a="ad_qrm">Remove image</button>`:'';
}
function qEdit(i){
  QI=i;const q=i>=0?D.qs[i]:{q:'',o:['','','',''],c:-1,img:''};Q={img:q.img,local:''};
  X.show(`<div class="tb"><button data-a="ad_cmd" data-v="bold"><b>B</b></button><button data-a="ad_cmd" data-v="italic"><i>I</i></button><button data-a="ad_cmd" data-v="underline"><u>U</u></button>
  ${COLS.map(c=>`<button class="sw" style="background:${c}" data-a="ad_col" data-v="${c}"></button>`).join('')}</div>
  <div class="pg"><h3>${i>=0?'Edit question '+(i+1):'Question '+(D.qs.length+1)}</h3>
  <div id="qimg"></div><button class="b o sm" data-a="ad_qimg">Add / change image</button>
  <label>Question (use $...$ for LaTeX)</label><div class="ed" id="eq" contenteditable="true"></div>
  <label>Options (select the correct one)</label><div id="ops"></div>
  <button class="b g sm" data-a="ad_aop">+ Add option</button>
  <button class="b o" data-a="ad_prev">Preview</button>
  <button class="b" data-a="ad_qadd">${i>=0?'Save question':'Add question'}</button>
  <button class="b g" data-a="ad_qlist">View all questions (${D.qs.length})</button>
  <button class="b" data-a="ad_qsub" style="background:#059669">Submit and set exam details</button></div>
  <input type="file" id="fp" accept="image/*" hidden>`);
  $('#eq').innerHTML=q.q;drawOps(q.o,q.c);qimg();
  $('#fp').onchange=async e=>{
    const f=e.target.files[0];if(!f)return;
    try{
      toast('Uploading image...');
      const u=await pic(f,1000,.8),r=await ap('uploadImg',{data:u.split(',')[1]});
      Q.img=r.id;Q.local=u;qimg();toast('Image added');
    }catch(err){toast(err.message)}
  };
}
R('cmd',v=>document.execCommand(v));
R('col',v=>document.execCommand('foreColor',false,v));
R('qimg',()=>{pk=1;$('#fp').click()});
R('qrm',()=>{Q.img='';Q.local='';qimg()});
R('aop',()=>{const r=readOps();if(r.o.length>=6)return toast('Maximum 6 options');r.o.push('');drawOps(r.o,r.c)});
R('rop',v=>{const r=readOps();r.o.splice(+v,1);drawOps(r.o,r.c===+v?-1:r.c>+v?r.c-1:r.c)});
function readQ(){const r=readOps();return {q:cl($('#eq').innerHTML),o:r.o,c:r.c,img:Q.img}}
const txt=h=>{const d=document.createElement('div');d.innerHTML=h;return d.textContent.trim()};
function blank(){const q=readQ();return !txt(q.q)&&!q.img&&q.o.every(o=>!txt(o))}
function valid(q){
  if(!txt(q.q)&&!q.img)return 'Enter the question';
  for(let i=0;i<q.o.length;i++)if(!txt(q.o[i]))return 'Option '+X.L6[i]+' is empty';
  if(new Set(q.o.map(txt)).size!==q.o.length)return 'Two options are exactly the same';
  if(q.c<0)return 'Select the correct option';
  return '';
}
R('prev',()=>{
  const q=readQ(),o=$('#ov');
  o.innerHTML=`<div class="md" style="max-height:85vh;overflow:auto"><div class="qh">Preview</div><div class="q">${q.q}</div>${q.img?`<img class="qi" src="${Q.local||img(q.img)}" alt="">`:''}${q.o.map((x,i)=>`<div class="op${q.c===i?' cor':''}"><span class="l">${X.L6[i]}</span><span>${x}</span></div>`).join('')}<button class="b" id="pc">Close</button></div>`;
  o.className='on';X.M(o);$('#pc').onclick=()=>o.className='';
});
function saveQ(){
  const q=readQ(),e=valid(q);if(e){toast(e);return false}
  if(QI>=0)D.qs[QI]=q;else D.qs.push(q);
  sd();return true;
}
R('qadd',()=>{const ed=QI>=0;if(!saveQ())return;toast(ed?'Question saved':'Question added');ed?qList():qEdit(-1)});
R('qsub',()=>{
  if(QI<0&&blank()){if(!D.qs.length)return toast('Add at least one question');return setScr()}
  if(saveQ())setScr();
});
R('qlist',()=>{if(QI<0&&!blank()&&!saveQ())return;qList()});

function qList(){
  X.show(`<div class="pg"><h2>Questions (${D.qs.length})</h2>
  ${D.qs.map((q,i)=>`<div class="li"><b>Q${i+1}.</b> ${esc(tx(q.q))||'(image)'}<div class="row"><button class="b g sm" data-a="ad_qe" data-v="${i}">Edit</button><button class="b g sm" data-a="ad_qd" data-v="${i}">Delete</button></div></div>`).join('')||'<p class="mu">No questions yet.</p>'}
  <button class="b o" data-a="ad_qn">+ Add question</button>
  ${D.qs.length?'<button class="b" data-a="ad_qgo" style="background:#059669">Continue to exam settings</button>':''}
  <button class="b g" data-a="ad_qx">Exit</button></div>`);
  X.M($('#app'));
}
R('qe',v=>qEdit(+v));R('qn',()=>qEdit(-1));R('qgo',()=>setScr());
R('qx',()=>{D.edit?dash('exams'):dash('home')});
R('qd',async v=>{if(!await ask('Delete question '+(+v+1)+'?','Delete','Cancel'))return;D.qs.splice(+v,1);sd();qList()});

/* ---------- settings ---------- */
function dt(id,ts){
  const d=new Date(ts||Date.now());
  return `<div class="dt"><input type="date" id="${id}d" min="${dstr(new Date())}" value="${dstr(d)}"><input type="time" step="1" id="${id}t" value="${tstr(d)}"></div>`;
}
function bindDT(id){
  const d=$('#'+id+'d'),t=$('#'+id+'t');
  const f=()=>{t.min=(!D.edit&&d.value===dstr(new Date()))?tstr(new Date()):''};d.onchange=f;f();
}
const rd=(a,b)=>new Date($(a).value+'T'+$(b).value).getTime();
function setScr(){
  const e=D.ex,n=D.qs.length;
  X.show(`<div class="pg"><button class="b g sm" data-a="ad_qback">&larr; Back</button><h2>Exam settings</h2>
  <div class="card2">${kv('Total questions',n)}<div class="kv"><span>Full marks</span><b id="fm"></b></div></div>
  <label>Marks for correct answer</label><input id="m1" type="number" step="any" value="${e.cM}">
  <label>Marks for incorrect answer (negative for deduction, e.g. -0.25)</label><input id="m2" type="number" step="any" value="${e.wM}">
  <label>Marks for unanswered</label><input id="m3" type="number" step="any" value="${e.uM}">
  <label>Pass mark</label><input id="m4" type="number" step="any" value="${e.pass}">
  <label>Exam duration (minutes)</label><input id="dur" type="number" inputmode="numeric" value="${e.duration}">
  <label>Exam join start time</label>
  <select id="jm"><option value="now">No fixed time (open immediately)</option><option value="custom">Set custom time</option></select>
  <div id="jc" hidden>${dt('j',e.jt)}</div>
  <label>Exam start time</label>
  <select id="sm"><option value="auto">Auto: 30 seconds after join start</option><option value="custom">Set custom time</option></select>
  <div id="sc" hidden>${dt('s',e.st)}</div>
  <button class="b" data-a="ad_ok1">OK</button></div>`);
  $('#jm').value=e.jm;$('#sm').value=e.sm;
  const tg=()=>{$('#jc').hidden=$('#jm').value!=='custom';$('#sc').hidden=$('#sm').value!=='custom'};
  $('#jm').onchange=$('#sm').onchange=tg;tg();bindDT('j');bindDT('s');
  const fm=()=>{$('#fm').textContent=Math.round((+$('#m1').value||0)*n*100)/100};$('#m1').oninput=fm;fm();
}
R('qback',()=>qList());
R('ok1',()=>{
  const e=D.ex,num=id=>{const v=$(id).value.trim();return v===''?NaN:+v};
  const cM=num('#m1'),wM=num('#m2'),uM=num('#m3'),pm=num('#m4'),du=num('#dur');
  if([cM,wM,uM,pm].some(isNaN))return toast('Enter valid marks');
  if(pm>cM*D.qs.length)return toast('Pass mark cannot exceed full marks');
  if(!(du>=1)||du!==Math.floor(du))return toast('Enter the duration in whole minutes');
  const jm=$('#jm').value,sm=$('#sm').value,nf=Math.floor(Date.now()/60000)*60000;let jt=0,s=0;
  if(jm==='custom'){
    jt=rd('#jd','#jt');if(isNaN(jt))return toast('Pick the join date and time');
    if(!D.edit&&jt<nf)return toast('Join time cannot be before the current time');
  }
  if(sm==='custom'){
    s=rd('#sd','#st');if(isNaN(s))return toast('Pick the exam start date and time');
    if(s<(jm==='custom'?jt:Date.now()))return toast('Exam start must be after the join start');
  }
  Object.assign(e,{cM,wM,uM,pass:pm,duration:du,jm,jt,sm,st:s});sd();codeScr();
});

/* ---------- exam code + save ---------- */
function codeScr(){
  const e=D.ex;if(!D.edit&&!e.code)e.code=gen();
  X.show(`<div class="pg"><button class="b g sm" data-a="ad_setb">&larr; Back</button><h2>Exam code</h2>
  <p class="mu">${D.edit?'The code of an existing exam cannot be changed.':'6 characters, letters and numbers only. It must be unique.'}</p>
  <input id="xc" maxlength="6" value="${e.code}" ${D.edit?'readonly':''} autocapitalize="characters" style="font:700 24px ui-monospace,monospace;text-align:center;letter-spacing:4px">
  ${D.edit?'':'<button class="b o" data-a="ad_gen">Generate random code</button>'}
  <button class="b" data-a="ad_fin">OK</button></div>`);
  const c=$('#xc');c.oninput=()=>c.value=c.value.toUpperCase().replace(/[^A-Z0-9]/g,'');
}
R('setb',()=>setScr());
R('gen',()=>{$('#xc').value=gen()});
R('fin',(v,b)=>go(async()=>{
  const e=D.ex,code=$('#xc').value.toUpperCase();
  if(!/^[A-Z0-9]{6}$/.test(code))throw Error('Code must be exactly 6 letters/numbers');
  e.code=code;
  if(!D.edit){const c=await ap('checkCode',{code});if(!c.free)throw Error('This code is already used. Choose another.')}
  const jt=e.jm==='now'?Date.now():e.jt,s=e.sm==='auto'?jt+30000:e.st;
  if(s<jt)throw Error('Exam start must be after the join start');
  const r=await ap('saveExam',{edit:D.edit,ex:{code,name:e.name,desc:e.desc,instr:'',joinStart:jt,startTime:s,duration:e.duration,cM:e.cM,wM:e.wM,uM:e.uM,pass:e.pass},qs:D.qs});
  X.LS.d('draft');D=null;done(r.ex);
},b));
function done(e){
  X.show(`<div class="pg c"><div class="ok2">&#10003;</div><h2>Exam saved successfully</h2>
  <div class="card2" style="text-align:left"><div class="cd" style="font-size:34px">${e.code}</div>
  ${kv('Exam name',e.name)}${kv('Join starts',loc(e.joinStart))}${kv('Exam starts',loc(e.startTime))}${kv('Exam ends',loc(e.end))}${kv('Duration',e.duration+' min')}${kv('Total questions',e.n)}${kv('Full marks',e.full)}</div>
  <button class="b o" data-a="ad_copy" data-v="${e.code}">Copy code</button>
  <button class="b" data-a="ad_tab" data-v="home">Go to dashboard</button></div>`);
}
R('copy',v=>{try{navigator.clipboard.writeText(v).then(()=>toast('Code copied'))}catch(e){toast('Code: '+v)}});
})();
