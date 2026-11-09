const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe = u => {try{return ['https:','http:'].includes(new URL(u).protocol)}catch{return false}};
const V = 'v=1';
const SUMMARY_FIELDS = [['question','研究问题'],['method','研究方法'],['data','研究数据'],['conclusion','研究结论']];
let index = null, summaries = {}, cache = {}, field = null, topic = null, page = 1, allLoaded = false;
const size = 40;

function themeLabel(){ $('#theme span').textContent = document.documentElement.dataset.theme==='dark'?'浅色':'深色'; }
themeLabel();
$('#theme').onclick = () => { const d=document.documentElement; d.dataset.theme = d.dataset.theme==='dark'?'light':'dark'; try{localStorage.setItem('econ-theme',d.dataset.theme)}catch{} themeLabel(); };

const loadField = code => cache[code] ? Promise.resolve(cache[code]) : fetch(`papers/f${code}.json?${V}`).then(r=>{if(!r.ok)throw Error(code);return r.json()}).then(rows=>(cache[code]=rows));
const loadAll = () => Promise.all(index.fields.map(f=>loadField(f.code))).then(()=>{allLoaded=true});
const fieldOf = code => index.fields.find(f=>f.code===code);
const topicOf = code => { const f=fieldOf(code.split('.')[0]); return f && f.topics.find(t=>t.code===code); };
const hasSummary = p => { const s=summaries[p.key]; return !!(s && SUMMARY_FIELDS.some(([k])=>s[k])); };

function tabs(){
  $('#tabs').innerHTML = index.fields.map(f=>`<button class="${field&&f.code===field.code?'active':''}" data-f="${f.code}"><b class="code">${f.code}</b> ${esc(f.name)}</button>`).join('');
  $('#tabs').querySelectorAll('button').forEach(b=>b.onclick=()=>go('t/'+fieldOf(b.dataset.f).topics[0].code));
}
function sidebar(){
  $('#field-name').textContent = field ? field.code+' '+field.name : '主题索引';
  $('#categories').innerHTML = field ? field.topics.map(t=>`<button class="${topic&&t.code===topic.code?'active':''}" data-t="${t.code}"><span><b class="code">${t.code}</b> ${esc(t.name)}</span><small>${t.n}</small></button>`).join('') : '';
  $('#categories').querySelectorAll('button').forEach(b=>b.onclick=()=>go('t/'+b.dataset.t));
}
function authorsHtml(list){
  return (list||[]).map(a=>{
    const tip = a.aff ? ` title="${esc(a.aff)}"` : '';
    return a.url && safe(a.url) ? `<a class="author" href="${esc(a.url)}" target="_blank" rel="noopener noreferrer"${tip}>${esc(a.name)}</a>` : `<span class="author"${tip}>${esc(a.name)}</span>`;
  }).join('<span class="sep">; </span>');
}
function summaryHtml(p){
  const s = summaries[p.key] || {};
  return `<dl class="summary">${SUMMARY_FIELDS.map(([k,l])=>`<div><dt>${l}</dt><dd>${s[k]?esc(s[k]):'<span class="placeholder">待补充</span>'}</dd></div>`).join('')}</dl>`;
}
function paperHtml(p, path){
  const title = p.url && safe(p.url) ? `<a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${esc(p.title)}</a>` : esc(p.title);
  const done = hasSummary(p);
  return `<article class="paper" id="p-${esc(p.id)}">
    <div class="paper-head"><span class="num">${esc(p.id)}</span><span class="venue">${esc(p.venue)} ${esc(p.year)}</span>${path?`<span class="path">${path}</span>`:''}</div>
    <h4 class="paper-title">${title}</h4>
    <div class="paper-authors">${authorsHtml(p.authors)}</div>
    ${p.abstract?`<p class="abstract${$('#expand').checked?' open':''}"><span class="label">中文摘要</span>${esc(p.abstract)}</p>`:''}
    <div class="paper-bottom">${p.abstract?'<button class="toggle-ab">展开摘要</button>':''}<button class="toggle-sum">${done?'论文总结 ✓':'论文总结（待补充）'}</button></div>
    <div class="sumbox" hidden>${summaryHtml(p)}</div>
  </article>`;
}
function bind(){
  $('#results').querySelectorAll('.paper').forEach(el=>{
    const ab=el.querySelector('.abstract'), tb=el.querySelector('.toggle-ab');
    if(tb){ tb.textContent = ab.classList.contains('open')?'收起摘要':'展开摘要'; tb.onclick=()=>{ab.classList.toggle('open');tb.textContent=ab.classList.contains('open')?'收起摘要':'展开摘要'}; }
    el.querySelector('.toggle-sum').onclick=()=>{const b=el.querySelector('.sumbox');b.hidden=!b.hidden};
  });
}
function terms(){ return $('#search').value.toLowerCase().trim().split(/\s+/).filter(Boolean); }
function match(p, ts){
  if($('#summarized').checked && !hasSummary(p)) return false;
  if(!ts.length) return true;
  const hay = [p.id,p.venue,p.year,p.title,p.abstract,...(p.authors||[]).map(a=>a.name+' '+(a.aff||''))].join(' ').toLowerCase();
  return ts.every(t=>hay.includes(t));
}
function qName(q){ const t=topicOf(q.split('.').slice(0,2).join('.')); if(!t) return ''; const qq=t.questions.find(x=>x.code===q); return qq?qq.name:''; }

function renderTopic(){
  const rows = (cache[field.code]||[]).filter(p=>p.q.startsWith(topic.code+'.') && match(p, []));
  $('#heading').innerHTML = `<b class="code">${topic.code}</b> ${esc(topic.name)}`;
  $('#count').textContent = `${rows.length} 篇文献 · ${topic.questions.length} 个问题`;
  const groups = [];
  if(rows.some(p=>p.q===topic.code+'.0')) groups.push({code:topic.code+'.0', name:'综合文献'});
  topic.questions.forEach(q=>groups.push(q));
  $('#qnav').innerHTML = topic.questions.length ? groups.map(g=>{const n=rows.filter(p=>p.q===g.code).length;return n?`<a href="#q/${g.code}" data-q="${g.code}"><b class="code">${g.code.endsWith('.0')?'':g.code}</b>${esc(g.name)}<small>${n}</small></a>`:''}).join('') : '';
  $('#qnav').querySelectorAll('a').forEach(a=>a.onclick=e=>{e.preventDefault();const el=document.getElementById('q-'+a.dataset.q);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});history.replaceState(null,'','#q/'+a.dataset.q)});
  $('#results').innerHTML = rows.length ? groups.map(g=>{
    const ps=rows.filter(p=>p.q===g.code); if(!ps.length) return '';
    return `<section class="question" id="q-${g.code}"><h3>${g.code.endsWith('.0')?'':`<b class="code">${g.code}</b> `}${esc(g.name)}<small>${ps.length} 篇</small></h3>${ps.map(p=>paperHtml(p)).join('')}</section>`;
  }).join('') : '<div class="empty"><h3>暂无文献</h3><p>可以调整筛选条件。</p></div>';
  $('#pagination').innerHTML='';
  bind();
}
function renderSearch(){
  const ts=terms();
  const rows=[]; index.fields.forEach(f=>(cache[f.code]||[]).forEach(p=>{if(match(p,ts))rows.push(p)}));
  const pages=Math.max(1,Math.ceil(rows.length/size)); page=Math.min(page,pages);
  $('#heading').textContent = ts.length?`搜索：${$('#search').value.trim()}`:'已有总结的文献';
  $('#count').textContent = `${rows.length} 条结果 · 共 ${index.total} 条`;
  $('#qnav').innerHTML='';
  $('#results').innerHTML = rows.length ? rows.slice((page-1)*size,page*size).map(p=>{
    const t=topicOf(p.q.split('.').slice(0,2).join('.')), f=fieldOf(p.q.split('.')[0]);
    const path=`<a href="#q/${p.q}">${esc(f.name)} / ${esc(t.name)}${p.q.endsWith('.0')?'':' / '+esc(qName(p.q))}</a>`;
    return paperHtml(p,path);
  }).join('') : '<div class="empty"><h3>没有找到匹配的文献</h3><p>换一个关键词试试。</p></div>';
  $('#pagination').innerHTML = rows.length>size ? `<button id="prev" ${page===1?'disabled':''}>← 上一页</button><span>${page} / ${pages}</span><button id="next" ${page===pages?'disabled':''}>下一页 →</button>` : '';
  ['prev','next'].forEach(id=>{const b=$('#'+id);if(b)b.onclick=()=>{page+=id==='prev'?-1:1;renderSearch();$('.controls').scrollIntoView({behavior:'smooth',block:'start'})}});
  $('#results').querySelectorAll('.path a').forEach(a=>a.onclick=()=>{$('#search').value='';$('#summarized').checked=false});
  bind();
}
function searching(){ return terms().length || $('#summarized').checked; }
function render(){
  if(searching()){
    if(!allLoaded){ $('#results').innerHTML='<p>正在载入全部文献…</p>'; loadAll().then(render); return; }
    tabs(); sidebar(); renderSearch(); return;
  }
  tabs(); sidebar();
  loadField(field.code).then(renderTopic).catch(()=>{$('#results').innerHTML='<div class="empty">文献加载失败，请刷新页面重试。</div>'});
}
function go(h){ if(location.hash==='#'+h) route(); else location.hash=h; }
function route(){
  const h=decodeURIComponent(location.hash.slice(1));
  let qscroll=null;
  if(h.startsWith('q/')){ qscroll=h.slice(2); }
  const tcode = h.startsWith('t/') ? h.slice(2) : qscroll ? qscroll.split('.').slice(0,2).join('.') : null;
  const t = tcode && topicOf(tcode);
  if(t){ field=fieldOf(tcode.split('.')[0]); topic=t; }
  else if(!field){ field=index.fields[0]; topic=field.topics[0]; }
  else if(h==='about') return;
  if(t && searching()){ $('#search').value=''; $('#summarized').checked=false; }
  page=1; render();
  if(t) loadField(field.code).then(()=>setTimeout(()=>{const el=qscroll?document.getElementById('q-'+qscroll):$('.controls'); if(el) el.scrollIntoView({block:'start'});},30));
}
let timer;
$('#search').addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{page=1;render()},200)});
$('#summarized').addEventListener('change',()=>{page=1;render()});
$('#expand').addEventListener('change',()=>{ try{localStorage.setItem('econ-expand',$('#expand').checked?'1':'')}catch{} render(); });
try{ $('#expand').checked = localStorage.getItem('econ-expand')==='1'; }catch{}
$('#reset').onclick=()=>{$('#search').value='';$('#summarized').checked=false;page=1;render()};
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();$('#search').focus()}});
window.addEventListener('hashchange',route);
Promise.all([
  fetch(`papers/index.json?${V}`).then(r=>{if(!r.ok)throw Error('index');return r.json()}),
  fetch(`papers/summaries.json?${V}`).then(r=>r.ok?r.json():{}).catch(()=>({}))
]).then(([idx,sm])=>{
  index=idx; summaries=sm;
  $('#s-total').textContent=idx.total; $('#s-fields').textContent=idx.fields.length;
  $('#s-topics').textContent=idx.fields.reduce((a,f)=>a+f.topics.length,0);
  $('#s-questions').textContent=idx.fields.reduce((a,f)=>a+f.topics.reduce((b,t)=>b+t.questions.length,0),0);
  route();
}).catch(()=>{$('#results').innerHTML='<div class="empty">文献目录加载失败，请刷新页面重试。</div>'});
