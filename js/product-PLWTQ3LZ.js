import{a as b}from"./chunk-OFD54N75.js";import{d as p,g as I,h as S,l as z,m as F}from"./chunk-J7TKWPPN.js";import"./chunk-MWRI3OKJ.js";import{b as x}from"./chunk-KIK4IJKS.js";import{b as P}from"./chunk-OCIUYIWP.js";import{A as O,C as R,L as C,b as u,c as r,e,g as N,i as o,j as m,l as t,p as l,q as y,r as M,x as k}from"./chunk-W2AEBEJL.js";var h=null,v=[];function j(){let d=o("#product-root");d&&(d.innerHTML=`<div class="wrap section">${C({icon:"box",title:e("shop.notFound","Product not found"),text:e("shop.notFoundText","این محصول وجود ندارد یا دیگر عرضه نمی‌شود."),action:`<a class="btn btn--gold" href="${r("shop.html")}">${t(e("shop.backToShop","بازگشت به فروشگاه"))}</a>`})}</div>`)}function H(){let d=o("#product-root");if(!d||!h)return;let a=h,i=p(a,"name"),w=p(a,"short"),_=x.CATEGORIES.find(s=>s.id===a.category),L=_?p(_,"name"):a.category,g=[a.image,...a.gallery||[]],f=a.stock!==null&&a.stock!==void 0&&a.stock<=0,T=/manual fulfilment|staff review|requires staff/i.test(a.deliveryNote||"");document.title=`${i} — ROYAL RP`,d.innerHTML=`
  <header class="page-head">
    <div class="page-head__pattern" aria-hidden="true"></div>
    <div class="wrap">
      <h1>${t(i)}</h1>
      <nav class="breadcrumb" aria-label="Breadcrumb">
        ${z([{label:e("nav.home","Home"),href:r("index.html")},{label:e("shop.title","فروشگاه"),href:r("shop.html")},{label:L,href:r("shop.html")+"?cat="+encodeURIComponent(a.category)},{label:i}])}
      </nav>
    </div>
  </header>

  <section class="section">
    <div class="wrap">
      <div class="pd-layout">

        <!-- gallery -->
        <div class="pd-gallery" data-reveal="left">
          <div class="pd-gallery__main gold-frame">
            <img id="pd-main-img" src="${u(g[0])}" alt="${t(i)}" width="800" height="600">
          </div>
          ${g.length>1?`
          <div class="pd-gallery__thumbs">
            ${g.map((s,n)=>`
              <button class="pd-thumb ${n===0?"is-active":""}" data-img="${u(s)}" type="button" aria-label="Image ${n+1}">
                <img src="${u(s)}" alt="" loading="lazy">
              </button>`).join("")}
          </div>`:""}
        </div>

        <!-- info -->
        <div data-reveal="right">
          <div class="flex gap-2 flex-wrap items-center mb-4">
            <span class="badge badge--gold">${t(L)}</span>
            ${a.badge?`<span class="badge badge--solid-gold">${t(a.badge)}</span>`:""}
            ${a.duration?`<span class="badge badge--grey">${l("clock")} ${t(a.duration)}</span>`:""}
            ${f?`<span class="badge badge--red">${t(e("shop.soldOut","ناموجود"))}</span>`:a.stock!==null&&a.stock!==void 0?`<span class="badge badge--orange">${t(e("shop.onlyLeft","Only {n} left").replace("{n}",M(a.stock)))}</span>`:`<span class="badge badge--green">${t(e("shop.inStock","In stock"))}</span>`}
          </div>

          <h2 style="margin-bottom:.75rem">${t(i)}</h2>
          <p style="font-size:1.05rem">${t(w)}</p>

          <div class="pd-price-box">
            <div class="price">
              ${a.oldPrice?`<span class="price__old">${y(a.oldPrice)}</span>`:""}
              <span class="price__now">${a.price===0?t(e("shop.free","Free")):y(a.price)}</span>
              ${a.duration?`<span class="price__unit">${t(e("shop.price","Price"))} / ${t(a.duration)}</span>`:""}
            </div>
            ${!f&&a.price>0?`
            <div>
              <label class="label" style="display:block;margin-bottom:.35rem">${t(e("shop.quantity","Quantity"))}</label>
              <div class="qty">
                <button type="button" data-qty="-1" aria-label="Decrease">&minus;</button>
                <input id="pd-qty" type="number" value="1" min="1" max="${a.maxPerOrder||10}" aria-label="Quantity">
                <button type="button" data-qty="1" aria-label="Increase">&plus;</button>
              </div>
            </div>`:""}
          </div>

          <div class="flex gap-3 flex-wrap mb-4">
            ${f?`<button class="btn btn--dark btn--lg" disabled>${t(e("shop.soldOut","ناموجود"))}</button>`:`<button class="btn btn--gold btn--lg" id="pd-add">
                   ${l("cart")}<span>${t(e("shop.addToCart","افزودن به سبد"))}</span>
                 </button>
                 <button class="btn btn--ghost btn--lg" id="pd-buy">
                   ${l("arrowRight")}<span>${t(e("shop.buyNow","Buy now"))}</span>
                 </button>`}
          </div>

          <div class="card card--pad-sm card--flat mb-4">
            <div class="flex gap-3 items-center">
              <span style="color:var(--c-gold)">${l(T?"clock":"activity")}</span>
              <div>
                <strong style="display:block;font-size:.9rem">
                  ${t(T?e("shop.deliveryManual","Manual fulfilment"):e("shop.deliveryAuto","تحویل خودکار"))}
                </strong>
                <span class="text-muted" style="font-size:.82rem">${t(a.deliveryNote||"")}</span>
              </div>
            </div>
          </div>

          <!-- tabs -->
          <div class="tabs" data-tabs data-tabs-scope="#pd-panels">
            <button class="tab is-active" data-tab="features">${t(e("shop.features","چه چیزی دریافت می‌کنید"))}</button>
            <button class="tab" data-tab="desc">${t(e("shop.description","توضیحات"))}</button>
            <button class="tab" data-tab="terms">${t(e("shop.terms","Terms"))}</button>
          </div>

          <div id="pd-panels">
            <div class="tab-panel is-active" data-panel="features">
              <ul class="tier__list">
                ${(a.features||[]).map(s=>`<li>${l("check")}<span>${t(s)}</span></li>`).join("")}
              </ul>
            </div>
            <div class="tab-panel" data-panel="desc">
              <p>${t(w)}</p>
              <p class="text-muted" style="font-size:.85rem;margin-top:1rem">${t(e("shop.priceNote","Prices include any applicable tax. The final amount is always confirmed by the server before payment."))}</p>
            </div>
            <div class="tab-panel" data-panel="terms">
              <ul class="tier__list">
                <li>${l("check")}<span>آیتم‌های مجازی یک مجوز قابل‌لغو هستند و ارزش واقعی ندارند.</span></li>
                <li>${l("check")}<span>تحویل نیازمند اتصال حساب بازی است.</span></li>
                <li>${l("check")}<span>تا ۱۴ روز در صورت عدم تحویل یا مغایرت با توضیحات، قابل بازپرداخت است.</span></li>
                <li>${l("check")}<span>هیچ موردی در اینجا در درگیری با بازیکن دیگر برتری نمی‌دهد.</span></li>
              </ul>
              <p class="mt-4">
                <a class="link-sweep" href="${r("terms.html")}">${t(e("legal.terms","Terms of Service"))}</a>
                &nbsp;&middot;&nbsp;
                <a class="link-sweep" href="${r("refund.html")}">${t(e("legal.refund","Refund Policy"))}</a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- related -->
      <div class="mt-6" style="margin-top:var(--sp-8)">
        <header class="sec-head sec-head--start" data-reveal>
          <h3>${t(e("shop.related","شاید این‌ها را هم بپسندید"))}</h3>
        </header>
        <div class="grid g-4" id="pd-related"></div>
      </div>
    </div>
  </section>`,m(".pd-thumb",d).forEach(s=>{s.addEventListener("click",()=>{m(".pd-thumb",d).forEach(n=>n.classList.remove("is-active")),s.classList.add("is-active"),o("#pd-main-img").src=s.dataset.img})}),m("[data-qty]",d).forEach(s=>{s.addEventListener("click",()=>{let n=o("#pd-qty"),c=Math.max(1,Math.min(Number(n.max),Number(n.value)+Number(s.dataset.qty)));n.value=c})});let q=()=>Math.max(1,parseInt(o("#pd-qty")?.value||"1",10));o("#pd-add")?.addEventListener("click",()=>{b.add(a,q())&&k.success(e("toast.added","{name} added to your cart").replace("{name}",i))}),o("#pd-buy")?.addEventListener("click",()=>{b.add(a,q())&&(window.location.href=r("checkout.html"))});let E=v.filter(s=>s.id!==a.id&&(s.category===a.category||s.featured)).slice(0,4),$=o("#pd-related");$&&($.innerHTML=E.length?E.map((s,n)=>S(s,{delay:n*60})).join(""):`<p class="text-muted">${t(e("common.noResults","No results found"))}</p>`),R(d),O(d),$?.addEventListener("click",s=>{let n=s.target.closest("[data-add-to-cart]");if(!n)return;let c=v.find(U=>U.id===n.dataset.addToCart);c&&b.add(c,1)&&k.success(e("toast.added","{name} added to your cart").replace("{name}",p(c,"name")))})}async function A(){let d=F("slug"),{data:a}=await I(()=>P.productList({limit:200}),()=>({items:x.PRODUCTS}));if(v=a.items||a,h=v.find(i=>i.slug===d||i.id===d)||null,!h){j();return}H(),N(H)}var X={init:A};export{X as default,A as init};
