import{b as k,c as x,f as n}from"./chunk-MWRI3OKJ.js";import{b as $,d as q}from"./chunk-OCIUYIWP.js";import{A as y,D as g,L as w,c as f,d as m,e as i,g as v,i as r,l as s,m as b,p as d}from"./chunk-W2AEBEJL.js";var A=k,p="all",h="";function L(t,e){return p!=="all"&&t.cat!==p?!1:h?`${n(t.q,e)} ${n(t.a,e)} ${n(t.q,"en")} ${n(t.a,"en")}`.toLowerCase().includes(h.toLowerCase()):!0}function o(){let t=r("#faq-root");if(!t)return;let e=m(),u=A.filter(a=>L(a,e));t.innerHTML=`
    <div class="flex gap-3 flex-wrap mb-6">
      <div class="searchbox" style="max-width:420px">
        ${d("search")}
        <input class="input" id="faq-search" value="${s(h)}"
               placeholder="${s(i("faq.searchPlaceholder","Search the FAQ..."))}">
      </div>
    </div>

    <div class="chip-row mb-6" id="faq-chips">
      ${x.map(a=>`<button class="chip ${p===a.id?"is-active":""}" data-cat="${a.id}">${s(n(a.name,e))}</button>`).join("")}
    </div>

    ${u.length?`
      <div class="accordion" data-single="false">
        ${u.map((a,c)=>`
          <div class="acc-item" data-reveal style="--d:${c*35}ms">
            <button class="acc-head" type="button">
              <span>${s(n(a.q,e))}</span>
              <span class="acc-icon">${d("chevronDown")}</span>
            </button>
            <div class="acc-body"><div class="acc-body__inner">${s(n(a.a,e))}</div></div>
          </div>`).join("")}
      </div>`:w({icon:"search",title:i("faq.noResults","No question matches that search")})}

    <div class="cta-banner mt-6" style="margin-top:var(--sp-8)">
      <h3>${s(i("faq.stillStuck","هنوز مشکل دارید؟"))}</h3>
      <p>${s(i("faq.stillStuckText","Open a ticket and a real person will answer."))}</p>
      <a class="btn btn--gold" href="${f("support.html")}">
        ${d("ticket")}<span>${s(i("faq.openTicket","Open a ticket"))}</span>
      </a>
    </div>`,g(t),y(t);let l=r("#faq-search");l&&l.addEventListener("input",b(()=>{h=l.value;let a=l.selectionStart;o();let c=r("#faq-search");c.focus(),c.setSelectionRange(a,a)},260)),r("#faq-chips")?.addEventListener("click",a=>{let c=a.target.closest("[data-cat]");c&&(p=c.dataset.cat,o())})}async function S(){if(q())try{let t=await $.get("/content/faq");t.source==="database"&&Array.isArray(t.items)&&t.items.length&&(A=t.items.map(e=>({cat:e.cat||"start",q:e.q,a:e.a})))}catch{}}async function E(){o(),await S(),o(),v(o)}var _={init:E};export{_ as default,E as init};
