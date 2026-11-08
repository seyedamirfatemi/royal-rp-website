import{e as y,f as n}from"./chunk-MWRI3OKJ.js";import{A as b,c as r,d as h,e as l,g as f,i as c,j as u,l as t,p as d,u as v}from"./chunk-W2AEBEJL.js";function L(){let p=document.body.dataset.legal||"terms",a=y[p],o=c("#legal-root");if(!o||!a)return;let s=h();document.title=`${n(a.title,s)} — ROYAL RP`;let g=c("#legal-head");g&&(g.innerHTML=`
      <div class="page-head__pattern" aria-hidden="true"></div>
      <div class="wrap">
        <h1>${t(n(a.title,s))}</h1>
        <p>${t(n(a.intro,s))}</p>
        <nav class="breadcrumb">
          <a href="${r("index.html")}">${t(l("nav.home","Home"))}</a>
          <span class="sep">/</span>
          <span class="current">${t(n(a.title,s))}</span>
        </nav>
      </div>`),o.innerHTML=`
    <div class="legal-layout">
      <aside class="legal-toc" aria-label="${t(l("legal.contents","On this page"))}">
        ${a.sections.map(e=>`<a href="#${e.id}" data-toc="${e.id}">${t(n(e.h,s))}</a>`).join("")}
      </aside>

      <div class="legal-body">
        <span class="legal-updated">${d("calendar")} ${t(l("legal.updated","Last updated"))}: ${t(v(a.updated))}</span>

        ${a.sections.map(e=>`
          <section id="${e.id}" data-reveal>
            <h2>${t(n(e.h,s))}</h2>
            <ul>${n(e.body,s).map(i=>`<li>${t(i)}</li>`).join("")}</ul>
          </section>`).join("")}

        <section class="card mt-6" style="margin-top:var(--sp-7)">
          <div class="flex gap-3 items-center">
            <span style="color:var(--c-gold)">${d("question")}</span>
            <p style="margin:0">${t(l("legal.questions","Questions about this page? Open a ticket and we will answer."))}</p>
            <a class="btn btn--ghost btn--sm" style="margin-inline-start:auto" href="${r("support.html")}">
              ${t(l("faq.openTicket","Open a ticket"))}
            </a>
          </div>
        </section>

        <div class="flex gap-3 flex-wrap mt-6">
          ${[["terms","legal.terms"],["privacy","legal.privacy"],["refund","legal.refund"]].filter(([e])=>e!==p).map(([e,i])=>`<a class="btn btn--ghost btn--sm" href="${r(e+".html")}">${t(l(i))}</a>`).join("")}
        </div>
      </div>
    </div>`;let w=u("[data-toc]",o),x=a.sections.map(e=>document.getElementById(e.id)).filter(Boolean);if("IntersectionObserver"in window){let e=new IntersectionObserver(i=>{i.forEach(m=>{m.isIntersecting&&w.forEach($=>$.classList.toggle("is-active",$.dataset.toc===m.target.id))})},{rootMargin:"-15% 0px -75% 0px"});x.forEach(i=>e.observe(i))}b(o)}async function k(){L(),f(L)}var q={init:k};export{q as default,k as init};
