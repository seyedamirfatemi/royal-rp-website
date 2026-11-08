import{a as y,f as i}from"./chunk-MWRI3OKJ.js";import{b as v,d as u}from"./chunk-OCIUYIWP.js";import{A as h,c as p,d as f,e as r,g,i as $,j as m,l as e,p as o}from"./chunk-W2AEBEJL.js";var c=y;function l(){let n=$("#rules-root");if(!n)return;let s=f(),b=c.map(t=>`<a href="#${t.id}" data-toc="${t.id}">${e(i(t.title,s))}</a>`).join(""),k=c.map(t=>`
    <section class="card mb-6" id="${t.id}" data-reveal>
      <div class="card__head">
        <div class="flex gap-3 items-center">
          <span class="feature__icon" style="width:44px;height:44px;margin:0">${o(t.icon)}</span>
          <div>
            <h3 style="font-size:1.3rem">${e(i(t.title,s))}</h3>
            <p style="font-size:.86rem;margin:0">${e(i(t.intro,s))}</p>
          </div>
        </div>
      </div>

      ${t.items.map(a=>`
        <div class="rule-item">
          <span class="rule-num">${e(a.n)}</span>
          <div>
            <h5>${e(i(a.t,s))}</h5>
            <p>${e(i(a.d,s))}</p>
            ${a.p?`<div class="rule-punish">${o("warning")} ${e(r("rules.punishment","Punishment"))}: ${e(i(a.p,s))}</div>`:""}
          </div>
        </div>`).join("")}
    </section>`).join("");n.innerHTML=`
    <div class="legal-layout">
      <aside class="legal-toc">${b}</aside>
      <div>
        <div class="demo-banner" style="background:linear-gradient(90deg,rgba(212,175,55,.12),transparent);border-color:var(--c-gold-line);border-inline-start-color:var(--c-gold);color:#e8d9a4">
          ${o("info")}
          <span>${e(r("rules.readAll","Read every section before you connect."))}</span>
        </div>
        ${k}
        <div class="cta-banner">
          <h3>${e(r("faq.stillStuck","هنوز مطمئن نیستید؟"))}</h3>
          <p>${e(r("faq.stillStuckText","Open a ticket and a real person will answer."))}</p>
          <a class="btn btn--gold" href="${p("support.html")}">${e(r("faq.openTicket","Open a ticket"))}</a>
        </div>
      </div>
    </div>`;let x=m("[data-toc]",n),w=c.map(t=>document.getElementById(t.id)).filter(Boolean),E=new IntersectionObserver(t=>{t.forEach(a=>{a.isIntersecting&&x.forEach(d=>d.classList.toggle("is-active",d.dataset.toc===a.target.id))})},{rootMargin:"-20% 0px -70% 0px"});w.forEach(t=>E.observe(t)),h(n)}async function L(){if(u())try{let n=await v.get("/content/rules");n.source==="database"&&Array.isArray(n.sections)&&n.sections.length&&(c=n.sections)}catch{}}async function O(){l(),await L(),l(),g(l)}var B={init:O};export{B as default,O as init};
