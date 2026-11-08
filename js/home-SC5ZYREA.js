import{a as b}from"./chunk-OFD54N75.js";import{b as T,c as C,d as c,g as m,h as _,i as x,j as M}from"./chunk-J7TKWPPN.js";import{b as w,f as $}from"./chunk-MWRI3OKJ.js";import{b as s}from"./chunk-KIK4IJKS.js";import{b as l}from"./chunk-OCIUYIWP.js";import{A as d,B as v,D as L,b as f,d as u,e as p,g as h,i as r,l as i,p as y,x as g}from"./chunk-W2AEBEJL.js";async function A(){let e=r("#home-features");e&&(e.innerHTML=s.FEATURES.map((t,a)=>`
    <article class="card card--hover card--gold-edge feature" data-reveal style="--d:${a*60}ms">
      <div class="feature__icon">${y(t.icon)}</div>
      <h4>${i(c(t,"title"))}</h4>
      <p>${i(c(t,"text"))}</p>
    </article>`).join(""))}async function E(){let e=r("#home-products");if(!e)return;let{data:t}=await m(()=>l.productList({featured:!0,limit:4}),()=>({items:s.PRODUCTS.filter(n=>n.featured).slice(0,4)})),a=t.items||t;e.innerHTML=a.map((n,o)=>_(n,{delay:o*70})).join(""),d(e)}async function F(){let e=r("#home-news");if(!e)return;let{data:t}=await m(()=>l.news({limit:3}),()=>({items:s.NEWS.slice(0,3)})),a=t.items||t;e.innerHTML=a.map((n,o)=>x(n,{delay:o*80})).join(""),d(e)}async function j(){let e=r("#home-staff");if(!e)return;let{data:t}=await m(()=>l.staff(),()=>({items:s.STAFF})),a=(t.items||t).filter(n=>["owner","developer","head_admin","admin"].includes(n.role)).slice(0,4);e.innerHTML=a.map((n,o)=>M(n,{delay:o*70})).join(""),d(e)}function H(){let e=r("#home-gallery");e&&(e.innerHTML=s.GALLERY.slice(0,8).map((t,a)=>`
    <figure class="gallery-item ${t.size==="wide"?"gallery-item--wide":""}"
            data-reveal style="--d:${a*50}ms"
            data-lightbox="${f(t.src)}" data-caption="${i(c(t,"title"))}">
      <img src="${f(t.src)}" alt="${i(c(t,"title"))}" loading="lazy">
      <figcaption class="gallery-item__overlay">
        <span>${i(C(T,t.tag))}</span>
        <h5>${i(c(t,"title"))}</h5>
      </figcaption>
    </figure>`).join(""),d(e))}function R(){let e=r("#home-faq");if(!e)return;let t=u();e.innerHTML=w.slice(0,6).map(a=>`
    <div class="acc-item">
      <button class="acc-head" type="button">
        <span>${i($(a.q,t))}</span>
        <span class="acc-icon">${y("chevronDown")}</span>
      </button>
      <div class="acc-body"><div class="acc-body__inner">${i($(a.a,t))}</div></div>
    </div>`).join(""),delete e.dataset.accReady,L(e.parentElement)}function S(){let e=r("#home-marquee");if(!e)return;let t=[["رول‌پلی جدی","رول‌پلی جدی"],["256 Slots","۲۵۶ اسلات"],["فریم‌ورک اختصاصی","فریم‌ورک اختصاصی"],["600+ Vehicles","۶۰۰+ خودرو"],["پلیس وایت‌لیست","پلیس وایت‌لیست"],["مسکن بازیکن","مسکن بازیکن"],["بدون پی‌تو‌وین","بدون پی‌تو‌وین"],["پشتیبانی فارسی","پشتیبانی دوزبانه"],["99.9% Uptime","پایداری ۹۹.۹٪"]],a=u(),n=t.map(([o,q])=>`<span class="marquee__item"><span>&#9670;</span>${i(a==="fa"?q:o)}</span>`).join("");e.innerHTML=n+n}function U(){document.addEventListener("click",e=>{let t=e.target.closest("[data-add-to-cart]");if(!t)return;let a=s.PRODUCTS.find(n=>n.id===t.dataset.addToCart);a&&b.add(a,1)&&g.success(p("toast.added","{name} added to your cart").replace("{name}",c(a,"name")),{title:p("nav.cart","Cart")})})}async function G(){S(),A(),H(),R(),U(),await Promise.all([E(),F(),j()]),d(),v(),h(()=>{S(),A(),H(),R(),E(),F(),j()})}var K={init:G};export{K as default,G as init};
