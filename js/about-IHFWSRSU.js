import{d,f as t}from"./chunk-MWRI3OKJ.js";import{A as h,B as m,a as o,b as r,d as v,e,g as p,i as g,l as a,p as n}from"./chunk-W2AEBEJL.js";function u(){let c=g("#about-root");if(!c)return;let i=v();c.innerHTML=`
    <section class="section">
      <div class="wrap" style="max-width:860px">
        <p style="font-size:1.3rem;line-height:1.8;color:var(--c-grey-200)" data-reveal>
          ${a(t(d.lead,i))}
        </p>
      </div>
    </section>

    <section class="section section--tight">
      <div class="wrap">
        <div class="grid g-3">
          ${d.story.map((s,l)=>`
            <article class="card card--hover card--gold-edge" data-reveal style="--d:${l*70}ms">
              <h4 class="mb-4">${a(t(s.h,i))}</h4>
              <p>${a(t(s.p,i))}</p>
            </article>`).join("")}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <header class="sec-head" data-reveal>
          <span class="sec-eyebrow">${a(e("about.values","به چه چیزی پایبندیم"))}</span>
          <div class="divider-gold"></div>
        </header>
        <div class="grid g-4">
          ${d.values.map((s,l)=>`
            <article class="card card--hover feature" data-reveal style="--d:${l*60}ms">
              <div class="feature__icon">${n(s.icon)}</div>
              <h4>${a(t(s.h,i))}</h4>
              <p>${a(t(s.p,i))}</p>
            </article>`).join("")}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="wrap" style="max-width:760px">
        <header class="sec-head" data-reveal>
          <span class="sec-eyebrow">${a(e("about.timeline","How we got here"))}</span>
          <div class="divider-gold"></div>
        </header>
        <div class="timeline" data-reveal>
          ${d.timeline.map(s=>`
            <div class="tl-item">
              <span class="tl-item__date">${a(s.date)}</span>
              <h5>${a(t(s.h,i))}</h5>
              <p>${a(t(s.p,i))}</p>
            </div>`).join("")}
        </div>
      </div>
    </section>

    <section class="section section--tight">
      <div class="wrap">
        <div class="grid g-4">
          <div class="stat"><div class="stat__value"><span data-count="19000" data-suffix="+">0</span></div>
            <div class="stat__label">اعضای دیسکورد</div></div>
          <div class="stat"><div class="stat__value"><span data-count="256">0</span></div>
            <div class="stat__label">ظرفیت سرور</div></div>
          <div class="stat"><div class="stat__value"><span data-count="640" data-suffix="+">0</span></div>
            <div class="stat__label">خودروها</div></div>
          <div class="stat"><div class="stat__value"><span data-count="3" data-suffix=" yrs">0</span></div>
            <div class="stat__label">فعال از سال ۲۰۲۳</div></div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="cta-banner" data-reveal>
          <img src="${r("assets/logos/logo-mark.svg")}" alt="" width="84" height="84"
               style="margin:0 auto 1.25rem;filter:drop-shadow(0 0 22px rgba(212,175,55,.5))" loading="lazy">
          <h2>${a(e("about.joinUs","خودتان بیایید و ببینید"))}</h2>
          <div class="flex gap-3" style="justify-content:center;flex-wrap:wrap">
            <button class="btn btn--gold btn--lg" data-connect>${a(e("common.connect","Connect"))}</button>
            <a class="btn btn--ghost btn--lg" href="${a(o.social.discord)}" target="_blank" rel="noopener noreferrer">
              ${n("discord")}<span>${a(e("common.discord","Join Discord"))}</span>
            </a>
          </div>
        </div>
      </div>
    </section>`,h(c),m(c)}async function f(){u(),p(u)}var x={init:f};export{x as default,f as init};
