import{a as b}from"./chunk-OFD54N75.js";import{a as u}from"./chunk-GICZ4Y7Y.js";import{F as g,a as d,b as m,c as r,e,g as k,i as h,j as f,k as v,l as a,n as _,p}from"./chunk-W2AEBEJL.js";var x=[{key:"nav.home",href:"index.html",page:"home"},{key:"nav.shop",href:"shop.html",page:"shop"},{key:"nav.news",href:"news.html",page:"news"},{key:"nav.gallery",href:"gallery.html",page:"gallery"},{key:"nav.staff",href:"staff.html",page:"staff"},{key:"nav.rules",href:"rules.html",page:"rules"},{key:"nav.status",href:"status.html",page:"status"},{key:"nav.support",href:"support.html",page:"support"}],T=[{key:"nav.about",href:"about.html"},{key:"nav.rules",href:"rules.html"},{key:"nav.staff",href:"staff.html"},{key:"nav.status",href:"status.html"},{key:"nav.gallery",href:"gallery.html"}],S=[{key:"nav.support",href:"support.html"},{key:"nav.faq",href:"faq.html"},{key:"nav.contact",href:"contact.html"},{key:"nav.news",href:"news.html"}],A=[{key:"legal.terms",href:"terms.html",fb:"Terms of Service"},{key:"legal.privacy",href:"privacy.html",fb:"Privacy Policy"},{key:"legal.refund",href:"refund.html",fb:"Refund Policy"}],H=[["discord","discord"],["youtube","youtube"],["instagram","instagram"],["twitter","twitter"],["tiktok","tiktok"],["telegram","telegram"]];function L(n){let t=x.map(s=>`
    <a class="nav__link ${s.page===n?"is-active":""}" href="${r(s.href)}"
       data-i18n="${s.key}">${a(e(s.key))}</a>`).join("");return`
  <div class="nav__inner">
    <a class="brand" href="${r("index.html")}" aria-label="${a(d.site.name)} home">
      <img class="brand__logo" src="${m(d.site.logo)}" alt="${a(d.site.name)} logo" width="46" height="46">
      <span class="brand__text">
        <span class="brand__name">ROYAL RP</span>
        <span class="brand__tag">رول‌پلی</span>
      </span>
    </a>

    <nav class="nav__links" aria-label="Main navigation">${t}</nav>

    <div class="nav__actions">
      <a class="btn btn--ghost btn--icon cart-btn" href="${r("cart.html")}" aria-label="${a(e("nav.cart"))}">
        ${p("cart")}
        <span class="cart-btn__count" data-cart-count hidden>0</span>
      </a>

      <div data-auth-slot></div>

      <button class="nav__burger" aria-label="Menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>`}function w(n){return`
    ${[...x,{key:"nav.faq",href:"faq.html",page:"faq"},{key:"nav.about",href:"about.html",page:"about"},{key:"nav.contact",href:"contact.html",page:"contact"}].map(s=>`
    <a class="${s.page===n?"is-active":""}" href="${r(s.href)}" data-i18n="${s.key}">${a(e(s.key))}</a>`).join("")}
    <div class="mobile-nav__cta" data-auth-mobile></div>`}function $(){let n=u.user;f("[data-auth-slot]").forEach(t=>{if(!n){t.innerHTML=`
        <a class="btn btn--ghost btn--sm" href="${r("login.html")}" data-i18n="nav.login">${a(e("nav.login"))}</a>
        <a class="btn btn--gold btn--sm" href="${r("register.html")}" data-i18n="nav.register">${a(e("nav.register"))}</a>`;return}let s=d.roles[n.role]||d.roles.user,i=(n.username||"U").slice(0,2).toUpperCase();t.innerHTML=`
      <button class="user-chip" aria-haspopup="true" aria-expanded="false">
        ${n.avatar?`<img src="${a(n.avatar)}" alt="" width="30" height="30">`:`<span class="avatar-fallback">${a(i)}</span>`}
        <span class="user-chip__name">${a(n.username)}</span>
        ${p("chevronDown")}
      </button>
      <div class="user-menu">
        <div class="user-menu__head">
          <strong>${a(n.username)}</strong>
          <span class="${s.css}">${a(s.label)}</span>
        </div>
        <a href="${r("dashboard.html")}">${p("dashboard")}<span data-i18n="nav.dashboard">${a(e("nav.dashboard"))}</span></a>
        <a href="${r("dashboard.html")}#orders">${p("package")}<span data-i18n="nav.orders">${a(e("nav.orders"))}</span></a>
        <a href="${r("dashboard.html")}#settings">${p("settings")}<span data-i18n="nav.profile">${a(e("nav.profile"))}</span></a>
        <a href="${r("support.html")}">${p("ticket")}<span data-i18n="nav.support">${a(e("nav.support"))}</span></a>
        ${u.hasRole("shop_manager")?`<hr><a href="${r("admin.html")}">${p("shield")}<span data-i18n="nav.admin">${a(e("nav.admin"))}</span></a>`:""}
        <hr>
        <button type="button" data-act="logout">${p("logout")}<span data-i18n="nav.logout">${a(e("nav.logout"))}</span></button>
      </div>`;let o=t.querySelector(".user-chip"),l=t.querySelector(".user-menu");o.addEventListener("click",c=>{c.stopPropagation();let M=l.classList.toggle("is-open");o.setAttribute("aria-expanded",String(M))}),document.addEventListener("click",()=>{l.classList.remove("is-open"),o.setAttribute("aria-expanded","false")}),l.addEventListener("click",c=>c.stopPropagation()),l.querySelector('[data-act="logout"]').addEventListener("click",()=>u.logout())}),f("[data-auth-mobile]").forEach(t=>{t.innerHTML=n?`<a class="btn btn--gold btn--block" href="${r("dashboard.html")}">${a(e("nav.dashboard"))}</a>
         <button class="btn btn--dark btn--block" data-act="logout">${a(e("nav.logout"))}</button>`:`<a class="btn btn--ghost btn--block" href="${r("login.html")}">${a(e("nav.login"))}</a>
         <a class="btn btn--gold btn--block" href="${r("register.html")}">${a(e("nav.register"))}</a>`,t.querySelector('[data-act="logout"]')?.addEventListener("click",()=>u.logout())})}function E(){let n=i=>i.map(o=>`<li><a href="${r(o.href)}" data-i18n="${o.key}">${a(e(o.key,o.fb||""))}</a></li>`).join(""),t=H.map(([i,o])=>{let l=d.social[i];return l?`<a class="social-btn" href="${a(l)}" target="_blank" rel="noopener noreferrer"
               aria-label="${i}">${p(o)}</a>`:""}).join(""),s=new Date().getFullYear();return`
  <div class="footer__glow" aria-hidden="true"></div>
  <div class="wrap-wide">
    <div class="footer__grid">
      <div class="footer__brand">
        <a class="brand" href="${r("index.html")}">
          <img class="brand__logo" src="${m(d.site.logo)}" alt="" width="46" height="46" loading="lazy">
          <span class="brand__text">
            <span class="brand__name">ROYAL RP</span>
            <span class="brand__tag">رول‌پلی</span>
          </span>
        </a>
        <p data-i18n="footer.about">${a(e("footer.about",d.site.description))}</p>
        <div class="socials">${t}</div>
      </div>

      <div>
        <h5 data-i18n="footer.server">${a(e("footer.server","Server"))}</h5>
        <ul class="footer__list">${n(T)}</ul>
      </div>

      <div>
        <h5 data-i18n="footer.help">${a(e("footer.help","Help"))}</h5>
        <ul class="footer__list">${n(S)}</ul>
      </div>

      <div>
        <h5 data-i18n="footer.connect">${a(e("footer.connect","Connect"))}</h5>
        <p style="font-size:.875rem;margin-bottom:.75rem" data-i18n="footer.connectText">${a(e("footer.connectText","Jump straight into Royal RP."))}</p>
        <div class="ip-box" style="margin-bottom:.75rem">
          <code>${a(d.server.ip)}</code>
          <button class="btn btn--ghost btn--sm" data-copy="${a(d.server.ip)}"
                  data-copy-msg="${a(e("toast.ipCopied","Server address copied"))}">
            ${p("copy")}<span data-i18n="common.copyIp">${a(e("common.copyIp"))}</span>
          </button>
        </div>
        <a class="btn btn--discord btn--sm btn--block" href="${a(d.social.discord)}" target="_blank" rel="noopener noreferrer">
          ${p("discord")}<span data-i18n="common.discord">${a(e("common.discord"))}</span>
        </a>
      </div>
    </div>

    <div class="footer__bottom">
      <span>&copy; ${s} ROYAL RP. <span data-i18n="footer.rights">${a(e("footer.rights"))}</span></span>
      <div class="footer__legal">
        ${A.map(i=>`<a href="${r(i.href)}" data-i18n="${i.key}">${a(e(i.key,i.fb))}</a>`).join("")}
      </div>
    </div>
    <p class="footer__disclaimer" data-i18n="footer.disclaimer">${a(e("footer.disclaimer"))}</p>
  </div>`}function j(){let n=document.body.dataset.page||"",t=h("#site-nav");t||(t=v("header",{class:"nav",id:"site-nav"}),document.body.prepend(t)),t.className="nav",t.innerHTML=L(n);let s=h("#mobile-nav");s||(s=v("nav",{class:"mobile-nav",id:"mobile-nav","aria-label":"Mobile navigation"}),t.after(s)),s.innerHTML=w(n);let i=h(".nav__burger",t);i.addEventListener("click",()=>{let c=s.classList.toggle("is-open");i.classList.toggle("is-open",c),i.setAttribute("aria-expanded",String(c)),document.body.classList.toggle("is-locked",c)}),s.addEventListener("click",c=>{c.target.tagName==="A"&&(s.classList.remove("is-open"),i.classList.remove("is-open"),document.body.classList.remove("is-locked"))});let o=h("#site-footer");o||(o=v("footer",{class:"footer",id:"site-footer"}),document.body.append(o)),o.className="footer",o.innerHTML=E(),f("[data-copy]",o).forEach(c=>c.addEventListener("click",()=>g(c.dataset.copy,c.dataset.copyMsg)));let l=_(()=>t.classList.toggle("is-scrolled",window.scrollY>40),100);window.addEventListener("scroll",l,{passive:!0}),l(),$(),u.onChange($),b.onChange(y),y(),k(()=>{t.innerHTML=L(n),s.innerHTML=w(n),o.innerHTML=E(),O(t,s,o,n)})}function O(n,t,s,i){let o=h(".nav__burger",n);o?.addEventListener("click",()=>{let l=t.classList.toggle("is-open");o.classList.toggle("is-open",l),document.body.classList.toggle("is-locked",l)}),f("[data-copy]",s).forEach(l=>l.addEventListener("click",()=>g(l.dataset.copy,l.dataset.copyMsg))),$(),y()}function y(){let n=b.count();f("[data-cart-count]").forEach(t=>{t.textContent=n,t.hidden=n===0})}export{j as a,y as b};
