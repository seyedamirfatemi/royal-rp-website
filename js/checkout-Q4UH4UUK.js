import{a as s}from"./chunk-OFD54N75.js";import{a as g}from"./chunk-GICZ4Y7Y.js";import{d as O,e as w}from"./chunk-J7TKWPPN.js";import"./chunk-MWRI3OKJ.js";import"./chunk-KIK4IJKS.js";import{a as b,b as h,d as v}from"./chunk-OCIUYIWP.js";import{L,M as I,b as x,c as d,e,g as _,i as c,j as k,l as t,p as o,q as l,x as y,y as T}from"./chunk-W2AEBEJL.js";var D={zarinpal:{id:"zarinpal",label:"زرین‌پال",note:"پرداخت با کارت‌های عضو شتاب",hosted:!0,icon:"wallet"},card:{id:"card",label:"درگاه پرداخت",note:"پرداخت از طریق درگاه بانکی",hosted:!0,icon:"wallet"},wallet:{id:"wallet",label:"اعتبار فروشگاه",note:"از موجودی حساب شما کسر می‌شود",hosted:!1,icon:"gift"}},m=null;async function S(){if(m)return m;if(!v())return m=[],m;try{m=((await h.get("/payments/providers")).providers||[]).filter(r=>D[r])}catch{m=[]}return m}var z={zarinpal:{iconName:"wallet",titleKey:"checkout.zarinpal",noteKey:"checkout.zarinpalNote"},card:{iconName:"wallet",titleKey:"checkout.card",noteKey:"checkout.cardNote"},wallet:{iconName:"gift",titleKey:"checkout.wallet",noteKey:"checkout.walletNote"}},$=["zarinpal","wallet"],p="zarinpal";function C(a=2){let r=c("#checkout-steps");if(!r)return;let n=[e("checkout.step1","Cart"),e("checkout.step2","Details"),e("checkout.step3","Payment"),e("checkout.step4","Done")];r.innerHTML=n.map((i,P)=>{let u=P+1;return`<div class="step ${u<a?"is-done":u===a?"is-active":""}">
        <span class="step__num">${u<a?"&check;":u}</span>
        <span class="step__label">${t(i)}</span>
      </div>${u<n.length?'<span class="step__bar"></span>':""}`}).join("")}function N(){let a=c("#checkout-summary");a&&(a.innerHTML=`
    <div class="card summary">
      <div class="card__head"><h4>${t(e("checkout.orderSummary","Order summary"))}</h4></div>

      <div style="display:grid;gap:.75rem;margin-bottom:1rem">
        ${s.items.map(r=>`
          <div class="flex gap-3 items-center">
            <img src="${x(r.image)}" alt="" width="54" height="40"
                 style="width:54px;height:40px;object-fit:cover;border-radius:4px;border:1px solid var(--c-grey-800)" loading="lazy">
            <div style="flex:1;min-width:0">
              <div style="font-size:.86rem;color:var(--c-white);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t(O(r,"name"))}</div>
              <div class="text-muted" style="font-size:.75rem">&times;${r.qty}</div>
            </div>
            <span class="mono" style="font-size:.86rem">${l(r.price*r.qty)}</span>
          </div>`).join("")}
      </div>

      <hr>
      <div class="summary__row">
        <span>${t(e("cart.subtotal","جمع جزء"))}</span><span class="mono">${l(s.subtotal())}</span>
      </div>
      ${s.discount()>0?`
      <div class="summary__row summary__row--discount">
        <span>${t(e("cart.discount","تخفیف"))} <span class="badge badge--green">${t(s.coupon.code)}</span></span>
        <span class="mono">-${l(s.discount())}</span>
      </div>`:""}
      ${s.tax()>0?`
      <div class="summary__row"><span>${t(e("cart.tax","Tax"))}</span><span class="mono">${l(s.tax())}</span></div>`:""}
      <div class="summary__row summary__row--total">
        <span>${t(e("cart.total","Total"))}</span><span class="mono">${l(s.total())}</span>
      </div>

      <p class="text-muted mt-4" style="font-size:.74rem;line-height:1.7">
        ${t(e("shop.priceNote","مبلغ نهایی همیشه پیش از پرداخت توسط سرور تایید می‌شود."))}
      </p>
    </div>`)}function R(){let a=c("#checkout-form");if(!a)return;if(s.isEmpty()){a.innerHTML=L({icon:"cart",title:e("cart.empty","سبد خرید شما خالی است"),text:e("cart.emptyText","فروشگاه را ببینید و چیزی که دوست دارید اضافه کنید."),action:`<a class="btn btn--gold" href="${d("shop.html")}">${t(e("cart.continue","ادامه خرید"))}</a>`}),c("#checkout-summary")?.classList.add("hidden");return}if(c("#checkout-summary")?.classList.remove("hidden"),!g.isLoggedIn){let n=encodeURIComponent(location.pathname);a.innerHTML=`
      <div class="card">
        <div class="state">
          <div class="state__icon">${o("lock")}</div>
          <h4>${t(e("checkout.signInFirst","برای ادامه وارد شوید"))}</h4>
          <p>${t(e("checkout.signInText","برای تحویل خرید و ثبت سابقه پشتیبانی به یک حساب کاربری نیاز دارید."))}</p>
          <div class="flex gap-3" style="justify-content:center;flex-wrap:wrap">
            <a class="btn btn--gold" href="${d("login.html")}?next=${n}">${t(e("nav.login","Sign in"))}</a>
            <a class="btn btn--ghost" href="${d("register.html")}?next=${n}">${t(e("nav.register","Register"))}</a>
          </div>
        </div>
      </div>`;return}let r=g.user;a.innerHTML=`
    ${w()?`<div class="demo-banner">${o("warning")}
      <span><strong>${t(e("demo.badge","DEMO DATA"))}</strong> &mdash;
      ${t(e("checkout.demoBlocked","تسویه حساب نیازمند اجرای بک‌اند است. در حالت نمایشی هیچ پرداختی انجام نمی‌شود."))}</span>
    </div>`:""}

    <!-- account -->
    <div class="card mb-4">
      <div class="card__head"><h4>${t(e("checkout.account","Account"))}</h4></div>
      <div class="flex gap-3 items-center">
        <span class="avatar-fallback" style="width:42px;height:42px;font-size:1rem">${t((r.username||"U").slice(0,2).toUpperCase())}</span>
        <div>
          <strong style="display:block">${t(r.username)}</strong>
          <span class="text-muted" style="font-size:.82rem">${t(r.email)}</span>
        </div>
      </div>
      <p class="text-muted mt-4" style="font-size:.82rem">${t(e("checkout.accountNote","خرید شما به این حساب متصل و به شخصیت متصل‌شده شما تحویل می‌شود."))}</p>
    </div>

    <!-- delivery target -->
    <div class="card mb-4">
      <div class="card__head"><h4>${t(e("checkout.delivery","مقصد تحویل"))}</h4></div>
      <div class="field">
        <label for="co-character">${t(e("checkout.character","تحویل به شخصیت"))}</label>
        <select class="select" id="co-character">
          <option value="account">${t(e("dash.account","Account"))} (${t(r.username)})</option>
          <option value="char_8812" selected>Daniel Rahimi &mdash; ROY88124</option>
        </select>
        <span class="field__hint">${t(e("dash.linkGameText","با دیسکورد وارد شوید و یک بار به سرور متصل شوید — اتصال خودکار انجام می‌شود."))}</span>
      </div>
    </div>

    <!-- payment -->
    <div class="card mb-4">
      <div class="card__head"><h4>${t(e("checkout.payment","Payment method"))}</h4></div>
      <div class="radio-cards" id="co-methods">
        ${$.map(n=>{let i=z[n]||z.card;return`
          <label class="radio-card ${n===p?"is-selected":""}" data-method="${n}">
            <input type="radio" name="method" value="${n}" ${n===p?"checked":""}>
            <span class="radio-card__icon">${o(i.iconName)}</span>
            <span>
              <span class="radio-card__title">${t(e(i.titleKey))}</span>
              <span class="radio-card__desc">${t(e(i.noteKey))}</span>
            </span>
          </label>`}).join("")}
      </div>
      <p class="text-muted mt-4" style="font-size:.78rem">
        ${o("lock")} ${t(e("checkout.securityNote","Card details are entered on the payment provider's own page. This site never sees or stores them."))}
      </p>
    </div>

    <!-- consent -->
    <div class="card mb-4">
      <label class="check mb-4">
        <input type="checkbox" id="co-terms">
        <span class="check__box">${o("check")}</span>
        <span>${t(e("checkout.agree","I have read and accept the Terms of Service and the Refund Policy."))}
          <a class="link-sweep" href="${d("terms.html")}" target="_blank">${t(e("legal.terms","Terms"))}</a>
          &middot;
          <a class="link-sweep" href="${d("refund.html")}" target="_blank">${t(e("legal.refund","Refunds"))}</a>
        </span>
      </label>
      <label class="check">
        <input type="checkbox" id="co-digital">
        <span class="check__box">${o("check")}</span>
        <span>${t(e("checkout.agreeDigital","I understand this is digital content delivered immediately, and I consent to delivery before the 14-day withdrawal period ends."))}</span>
      </label>
    </div>

    <button class="btn btn--gold btn--lg btn--block" id="co-place">
      ${o("lock")}<span>${t(e("checkout.place","Place order"))} &mdash; ${l(s.total())}</span>
    </button>`,U()}function U(){k("#co-methods .radio-card").forEach(a=>{a.addEventListener("click",()=>{p=a.dataset.method,k("#co-methods .radio-card").forEach(r=>r.classList.toggle("is-selected",r===a)),a.querySelector("input").checked=!0})}),c("#co-place")?.addEventListener("click",E)}async function E(){let a=c("#co-place");if(!c("#co-terms")?.checked){y.error(e("checkout.agree","پیش از پرداخت باید شرایط را بپذیرید.")),c("#co-terms")?.focus();return}if(!c("#co-digital")?.checked){y.error(e("checkout.agreeDigital","لطفاً رضایت خود را با تحویل فوری تایید کنید.")),c("#co-digital")?.focus();return}if(w()){T({title:e("checkout.demoBlockedTitle","حالت نمایشی"),body:`
        <div class="demo-banner">${o("warning")}
          <span><strong>${t(e("demo.badge","DEMO DATA"))}</strong></span>
        </div>
        <p>${t(e("checkout.demoBlocked","تسویه حساب نیازمند اجرای بک‌اند است. در حالت نمایشی هیچ پرداختی انجام نمی‌شود."))}</p>
        <p class="text-muted" style="font-size:.85rem;margin-top:1rem">
          Start it with <code>npm run server</code>, then set a payment provider key in
          <code>backend/.env</code>. Until a signed webhook from the provider arrives,
          the backend will not deliver anything.
        </p>`,footer:`<button class="btn btn--gold" data-close>${t(e("common.close","Close"))}</button>`}).el.querySelector("[data-close]").addEventListener("click",n=>n.target.closest(".modal-backdrop").querySelector(".modal__close")?.click());return}let r=I(a,e("common.loading","Loading..."));try{let n=await h.createOrder({...s.toOrderPayload(),characterId:c("#co-character")?.value||null}),i=await h.startPayment(n.id,p);if(s.clear(),i.redirectUrl){window.location.href=i.redirectUrl;return}A(n)}catch(n){r(),y.error(n instanceof b?n.message:e("toast.error","مشکلی پیش آمد"))}}function A(a){C(4),c("#checkout-summary")?.classList.add("hidden");let r=c("#checkout-form");r&&(r.innerHTML=`
    <div class="card text-center" style="padding:var(--sp-8) var(--sp-5)">
      <div class="state__icon" style="color:var(--c-success);border-color:rgba(61,220,132,.35);margin-inline:auto">
        ${o("check")}
      </div>
      <h3 class="mt-4">${t(e("checkout.successTitle","Order received"))}</h3>
      <p style="max-width:48ch;margin:1rem auto">${t(e("checkout.successText","We are waiting for the payment provider to confirm. Your items are released the moment it does."))}</p>
      <div class="ip-box" style="margin:0 auto 1.5rem">
        <span class="text-muted" style="font-size:.8rem">${t(e("checkout.orderRef","Order reference"))}</span>
        <code>${t(a.id)}</code>
      </div>
      <div class="flex gap-3" style="justify-content:center;flex-wrap:wrap">
        <a class="btn btn--gold" href="${d("dashboard.html")}#orders">${t(e("checkout.viewOrders","مشاهده سفارش‌های من"))}</a>
        <a class="btn btn--ghost" href="${d("shop.html")}">${t(e("cart.continue","ادامه خرید"))}</a>
      </div>
    </div>`)}function f(){C(2),N(),R()}async function M(){if(v())try{let a=await S();if(!a.length)return;$=a,$.includes(p)||(p=$[0])}catch{}}async function q(){f(),await M(),f(),s.onChange(f),g.onChange(f),_(f)}var re={init:q};export{re as default,q as init};
