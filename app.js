const $ = selector => document.querySelector(selector);
const REGIONS = ['中国数据','美国数据','全球数据','欧洲数据','拉美数据','亚洲数据','其它数据'];
const TOPICS = ['普查数据','微观调查数据','微观企业数据','区域经济数据','地理数据','环境数据','健康数据','交通数据','政治数据','房地产数据','金融数据','商业数据','农业数据','贸易数据'];
let data = [], region = '全部', category = '全部', page = 1;
const size = 12;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe = url => {try{return ['https:','http:'].includes(new URL(url).protocol)}catch{return false}};
function themeLabel() { $('#theme span').textContent = document.documentElement.dataset.theme === 'dark' ? '浅色' : '深色'; }
themeLabel();
$('#theme').onclick = () => { document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; try{localStorage.setItem('econ-theme',document.documentElement.dataset.theme)}catch{} themeLabel(); };
function tabs() {
  $('#tabs').innerHTML = ['全部',...REGIONS].map(g => `<button class="${g===region?'active':''}" aria-pressed="${g===region}" data-region="${esc(g)}">${g==='全部'?'全部数据':esc(g)}</button>`).join('');
  $('#tabs').querySelectorAll('button').forEach(b => b.onclick = () => { region=b.dataset.region; page=1; tabs(); categories(); render(); });
}
function categories() {
  const subset = data.filter(d => region==='全部'||d.regions.includes(region));
  $('#categories').innerHTML = ['全部',...TOPICS].map(c => `<button class="${c===category?'active':''}" aria-pressed="${c===category}" data-category="${esc(c)}"><span>${c==='全部'?'所有话题':esc(c)}</span><small>${subset.filter(d=>c==='全部'||d.topics.includes(c)).length}</small></button>`).join('');
  $('#categories').querySelectorAll('button').forEach(b => b.onclick = () => { category=b.dataset.category; page=1; categories(); render(); });
}
function filtered() {
  const terms = $('#search').value.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const rows = data.filter(d => (region==='全部'||d.regions.includes(region)) && (category==='全部'||d.topics.includes(category)) && (!$('#withlinks').checked||d.links.length) && terms.every(t => [d.title,d.introduction,d.source,...d.regions,...d.topics,...d.references.map(r=>[r.title,...(r.authors||[])].join(' '))].join(' ').toLowerCase().includes(t)));
  if($('#sort').value==='name') rows.sort((a,b)=>a.title.localeCompare(b.title,'zh-CN'));
  return rows;
}
function render() {
  const rows=filtered(), pages=Math.max(1,Math.ceil(rows.length/size)); page=Math.min(page,pages);
  $('#heading').textContent = [region==='全部'?'全部数据':region,category==='全部'?'':category].filter(Boolean).join(' · ');
  $('#count').textContent = `${rows.length} 条结果 · 共 ${data.length} 条`;
  $('#results').innerHTML = rows.length ? rows.slice((page-1)*size,page*size).map(d=>`<article class="entry"><div><button class="entry-title" data-id="${esc(d.id)}"><span class="num">${esc(d.id)}</span>${esc(d.title)}</button><p>${esc(d.summary)}</p><div class="entry-bottom"><button data-id="${esc(d.id)}">查看条目 ↗</button><span>${d.references.length?d.references.length+' 篇应用文献':'应用文献待补充'}</span></div></div><div class="entry-meta">${d.topics.map(t=>`<span class="tag">${esc(t)}</span>`).join(' ')}<div>${d.regions.map(esc).join(' · ')}</div></div></article>`).join('') : '<div class="empty"><h3>暂无数据条目</h3><p>此分类暂待补充；也可以调整关键词或筛选条件。</p></div>';
  $('#results').querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{location.hash='dataset/'+b.dataset.id});
  $('#pagination').innerHTML = rows.length ? `<button id="prev" ${page===1?'disabled':''}>← 上一页</button><span>${page} / ${pages}</span><button id="next" ${page===pages?'disabled':''}>下一页 →</button>` : '';
  ['prev','next'].forEach(id=>{const b=$('#'+id);if(b)b.onclick=()=>{page+=id==='prev'?-1:1;render();$('.controls').scrollIntoView({behavior:'smooth',block:'start'})}});
}
function referenceHtml(r) {
  if(!r.verified) return `<li>${esc(r.raw||r.title)}<small class="reference-note">${esc(r.note||'待核对')}</small></li>`;
  const authors=(r.authors||[]).join(', '), year=r.year||'n.d.';
  const title=r.url&&safe(r.url)?`<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.title)} ↗</a>`:esc(r.title||r.raw);
  const volume=[r.volume,r.issue?'('+r.issue+')':''].join('');
  const publication=[r.journal,volume,r.pages].filter(Boolean).map(esc).join(', ');
  return `<li>${authors?esc(authors)+' ':''}(${esc(year)}). ${title}.${publication?' <em>'+publication+'</em>.':''}${r.note?'<small class="reference-note">'+esc(r.note)+'</small>':''}</li>`;
}
function detailSection(title,content) { return `<section class="detail-section"><h3>${title}</h3>${content}</section>`; }
function prose(text) { return text?`<div class="fulltext">${text.split(/\n\s*\n/).filter(Boolean).map(p=>`<p>${esc(p)}</p>`).join('')}</div>`:'<p class="placeholder">待补充</p>'; }
function openDetail() {
  if(!location.hash.startsWith('#dataset/')){if($('#detail').open)$('#detail').close();return}
  const d=data.find(x=>x.id===decodeURIComponent(location.hash.slice(9))); if(!d)return;
  $('#detail-path').textContent=d.regions.join(' · ')+' / '+d.topics.join(' · ');
  const applications=d.references.length?`<ol class="references">${d.references.map(referenceHtml).join('')}</ol>`:'<p class="placeholder">待补充</p>';
  const links=d.links.filter(l=>safe(l.url));
  $('#detail-body').innerHTML=`<h2>${esc(d.title)}</h2>`+detailSection('数据介绍',prose(d.introduction))+detailSection('数据来源',prose(d.source))+detailSection('数据应用',applications)+detailSection('数据链接',links.length?`<ul class="data-links">${links.map(l=>`<li><a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label||l.url)} ↗</a></li>`).join('')}</ul>`:'<p class="placeholder">待补充</p>');
  if(!$('#detail').open)$('#detail').showModal();
}
$('#close').onclick=()=>{$('#detail').close();history.replaceState(null,'',location.pathname+location.search+'#catalog')};
$('#detail').addEventListener('cancel',()=>history.replaceState(null,'',location.pathname+location.search+'#catalog'));
window.addEventListener('hashchange',openDetail);
['search','sort','withlinks'].forEach(id=>$('#'+id).addEventListener(id==='search'?'input':'change',()=>{page=1;render()}));
$('#reset').onclick=()=>{region=category='全部';page=1;$('#search').value='';$('#sort').value='original';$('#withlinks').checked=false;tabs();categories();render()};
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)&&!$('#detail').open){e.preventDefault();$('#search').focus()}});
fetch('data.json?v=3').then(r=>{if(!r.ok)throw Error('data');return r.json()}).then(rows=>{data=rows;$('#total').textContent=data.length;$('#groups').textContent=REGIONS.length;$('#links').textContent=TOPICS.length;tabs();categories();render();openDetail()}).catch(()=>{$('#results').innerHTML='<div class="empty">目录加载失败，请刷新页面重试。</div>'});
