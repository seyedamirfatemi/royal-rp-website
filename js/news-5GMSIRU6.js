import{a as w,c as b,d as r,g as M,i as y,l as N,m as x}from"./chunk-J7TKWPPN.js";import"./chunk-MWRI3OKJ.js";import{b as T}from"./chunk-KIK4IJKS.js";import{b as k}from"./chunk-OCIUYIWP.js";import{A as u,F as R,L as v,b as f,c as p,e as n,g as L,i as o,l as t,p as l,u as $}from"./chunk-W2AEBEJL.js";var m=[],d=x("cat","all"),j=["all","update","announcement","event","security","maintenance"];function C(){let e=o("#news-root");if(!e)return;let i=d==="all"?m:m.filter(a=>a.category===d),s=d==="all"?i.find(a=>a.featured):null,h=s?i.filter(a=>a!==s):i;e.innerHTML=`
    <div class="chip-row mb-6" id="news-chips">
      ${j.map(a=>`<button class="chip ${d===a?"is-active":""}" data-cat="${a}">${t(n("news."+a,a))}</button>`).join("")}
    </div>

    ${s?`
    <article class="card card--gold-edge mb-6" data-reveal style="overflow:hidden;padding:0">
      <div class="grid g-2" style="gap:0">
        <a href="?slug=${encodeURIComponent(s.slug)}" style="display:block;min-height:280px">
          <img src="${f(s.image)}" alt="${t(r(s,"title"))}"
               style="width:100%;height:100%;object-fit:cover;min-height:280px" loading="lazy">
        </a>
        <div style="padding:var(--sp-6);display:flex;flex-direction:column;justify-content:center;gap:1rem">
          <div class="flex gap-2 items-center flex-wrap">
            <span class="badge badge--solid-gold">ویژه</span>
            <span class="badge badge--gold">${t(b(w,s.category))}</span>
            <span class="text-muted" style="font-size:.78rem">${t($(s.date))}</span>
          </div>
          <h2 style="font-size:clamp(1.5rem,3vw,2.1rem)">
            <a href="?slug=${encodeURIComponent(s.slug)}" style="color:inherit">${t(r(s,"title"))}</a>
          </h2>
          <p>${t(r(s,"excerpt"))}</p>
          <div class="flex gap-3 items-center text-muted" style="font-size:.8rem">
            <span>${l("user")} ${t(s.author)}</span>
            <span>${l("clock")} ${s.readMinutes} ${t(n("news.min","min read"))}</span>
          </div>
          <a class="btn btn--gold" style="width:max-content" href="?slug=${encodeURIComponent(s.slug)}">
            ${t(n("common.readMore","Read more"))} ${l("arrowRight","icon-flip")}
          </a>
        </div>
      </div>
    </article>`:""}

    ${h.length?`<div class="grid g-3">${h.map((a,c)=>y(a,{delay:c*70})).join("")}</div>`:v({icon:"news",title:n("news.noNews","Nothing published yet")})}`,o("#news-chips")?.addEventListener("click",a=>{let c=a.target.closest("[data-cat]");if(!c)return;d=c.dataset.cat;let g=new URL(location.href);d==="all"?g.searchParams.delete("cat"):g.searchParams.set("cat",d),history.replaceState({},"",g),C()}),u(e)}function A(e){let i=o("#news-root"),s=o("#news-head");if(!i)return;document.title=`${r(e,"title")} — ROYAL RP`,s&&(s.innerHTML=`
      <div class="page-head__pattern" aria-hidden="true"></div>
      <div class="wrap">
        <span class="badge badge--gold mb-4">${t(b(w,e.category))}</span>
        <h1>${t(r(e,"title"))}</h1>
        <nav class="breadcrumb">
          ${N([{label:n("nav.home","Home"),href:p("index.html")},{label:n("news.title","News"),href:p("news.html")},{label:r(e,"title")}])}
        </nav>
      </div>`);let h=m.filter(a=>a.id!==e.id).slice(0,3);i.innerHTML=`
    <article class="wrap" style="max-width:820px">
      <div class="flex gap-4 items-center flex-wrap text-muted mb-6" style="font-size:.84rem">
        <span>${l("user")} ${t(n("news.by","by"))} ${t(e.author)}</span>
        <span>${l("calendar")} ${t($(e.date))}</span>
        <span>${l("clock")} ${e.readMinutes} ${t(n("news.min","min read"))}</span>
      </div>

      <div class="gold-frame mb-6" style="border-radius:var(--r-lg);overflow:hidden">
        <img src="${f(e.image)}" alt="" style="width:100%" loading="lazy">
      </div>

      <div class="article-body">${e.body||`<p>${t(r(e,"excerpt"))}</p>`}</div>

      ${(e.tags||[]).length?`
      <div class="chip-row mt-6">
        ${e.tags.map(a=>`<span class="chip">#${t(a)}</span>`).join("")}
      </div>`:""}

      <div class="flex gap-3 items-center flex-wrap mt-6" style="padding-top:1.5rem;border-top:1px solid var(--c-grey-800)">
        <span class="text-muted" style="font-size:.84rem">${t(n("news.share","Share"))}</span>
        <button class="btn btn--ghost btn--sm" id="share-link">${l("link")}<span>${t(n("common.copied","کپی لینک"))}</span></button>
        <a class="btn btn--ghost btn--sm" href="${p("news.html")}">
          ${l("chevronLeft","icon-flip")}<span>${t(n("news.backToNews","بازگشت به اخبار"))}</span>
        </a>
      </div>
    </article>

    <div class="wrap" style="margin-top:var(--sp-8)">
      <header class="sec-head sec-head--start"><h3>${t(n("news.related","More from the newsroom"))}</h3></header>
      <div class="grid g-3">${h.map((a,c)=>y(a,{delay:c*70})).join("")}</div>
    </div>`,o("#share-link")?.addEventListener("click",()=>R(location.href,"لینک کپی شد")),u(i)}function E(){let e=o("#news-root");e&&(e.innerHTML=`<div class="wrap">${v({icon:"news",title:n("news.notFound","مقاله پیدا نشد"),text:n("news.notFoundText",""),action:`<a class="btn btn--gold" href="${p("news.html")}">${t(n("news.backToNews","بازگشت به اخبار"))}</a>`})}</div>`)}function z(){let e=x("slug");if(!e)return C();let i=m.find(s=>s.slug===e);i?A(i):E()}async function S(){let{data:e}=await M(()=>k.news({limit:50}),()=>({items:T.NEWS}));m=e.items||e,z(),L(z)}var Y={init:S};export{Y as default,S as init};
