import{b as _}from"./chunk-TYJGKO4M.js";import{a as n}from"./chunk-OFD54N75.js";import"./chunk-GICZ4Y7Y.js";import{d as m}from"./chunk-J7TKWPPN.js";import"./chunk-MWRI3OKJ.js";import{b as k}from"./chunk-KIK4IJKS.js";import{b as v,d as y}from"./chunk-OCIUYIWP.js";import{A as g,L as h,b,c as p,e,g as $,i as c,l as a,p as d,q as i,x as l,z as f}from"./chunk-W2AEBEJL.js";function C(){let r=c("#cart-items");if(r){if(n.isEmpty()){r.innerHTML=h({icon:"cart",title:e("cart.empty","سبد خرید شما خالی است"),text:e("cart.emptyText","فروشگاه را ببینید و چیزی که دوست دارید اضافه کنید."),action:`<a class="btn btn--gold" href="${p("shop.html")}">${a(e("cart.continue","ادامه خرید"))}</a>`}),c("#cart-summary-wrap")?.classList.add("hidden");return}c("#cart-summary-wrap")?.classList.remove("hidden"),r.innerHTML=n.items.map(t=>`
    <article class="cart-item" data-id="${a(t.id)}">
      <a class="cart-item__media" href="${p("product.html")}?slug=${encodeURIComponent(t.slug)}">
        <img src="${b(t.image)}" alt="${a(m(t,"name"))}" loading="lazy">
      </a>
      <div>
        <span class="cart-item__cat">${a(t.category)}</span>
        <h4 class="cart-item__title">
          <a href="${p("product.html")}?slug=${encodeURIComponent(t.slug)}" style="color:inherit">${a(m(t,"name"))}</a>
        </h4>
        <div class="price" style="flex-direction:row;gap:.5rem;align-items:baseline;margin-top:.35rem">
          <span class="price__now" style="font-size:1rem">${i(t.price)}</span>
          ${t.oldPrice?`<span class="price__old">${i(t.oldPrice)}</span>`:""}
        </div>
      </div>
      <div class="cart-item__side">
        <div class="qty">
          <button type="button" data-dec aria-label="Decrease">&minus;</button>
          <input type="number" value="${t.qty}" min="1" max="${t.maxPerOrder||10}" data-qty aria-label="Quantity">
          <button type="button" data-inc aria-label="Increase">&plus;</button>
        </div>
        <strong class="text-gold mono">${i(t.price*t.qty)}</strong>
        <button class="btn btn--sm btn--danger" data-remove>
          ${d("trash")}<span>${a(e("cart.remove","Remove"))}</span>
        </button>
      </div>
    </article>`).join(""),g(r)}}function L(){let r=c("#cart-summary");if(!r)return;let t=n.subtotal(),o=n.discount(),s=n.tax(),x=n.total();r.innerHTML=`
    <div class="card summary">
      <div class="card__head"><h4>${a(e("cart.summary","Order summary"))}</h4></div>

      <div class="summary__row">
        <span>${a(e("cart.subtotal","جمع جزء"))} (${n.count()} ${a(e("cart.items","items"))})</span>
        <span class="mono">${i(t)}</span>
      </div>

      ${o>0?`
      <div class="summary__row summary__row--discount">
        <span>${a(e("cart.discount","تخفیف"))} <span class="badge badge--green">${a(n.coupon.code)}</span></span>
        <span class="mono">-${i(o)}</span>
      </div>`:""}

      ${s>0?`
      <div class="summary__row">
        <span>${a(e("cart.tax","Tax"))}</span>
        <span class="mono">${i(s)}</span>
      </div>`:""}

      <div class="summary__row summary__row--total">
        <span>${a(e("cart.total","Total"))}</span>
        <span class="mono">${i(x)}</span>
      </div>

      <div class="coupon-row">
        <input class="input" id="coupon-input" placeholder="${a(e("cart.couponPlaceholder","Enter a code"))}"
               value="${n.coupon?a(n.coupon.code):""}" autocomplete="off">
        ${n.coupon?`<button class="btn btn--dark" id="coupon-remove">${d("close")}</button>`:`<button class="btn btn--ghost" id="coupon-apply">${a(e("cart.couponApply","Apply"))}</button>`}
      </div>

      <a class="btn btn--gold btn--block btn--lg" href="${p("checkout.html")}">
        ${d("lock")}<span>${a(e("cart.checkout","Proceed to checkout"))}</span>
      </a>

      <a class="btn btn--ghost btn--block mt-4" href="${p("shop.html")}">
        ${a(e("cart.continue","ادامه خرید"))}
      </a>

      <button class="btn btn--sm btn--danger btn--block mt-4" id="cart-clear">
        ${d("trash")}<span>${a(e("cart.clear","خالی کردن سبد"))}</span>
      </button>

      <p class="text-muted mt-4" style="font-size:.74rem;line-height:1.7">
        ${d("lock")} ${a(e("checkout.securityNote","Card details are entered on the payment provider's own page. This site never sees or stores them."))}
      </p>
    </div>`,E()}async function w(){let t=(c("#coupon-input")?.value||"").trim().toUpperCase();if(!t)return;let o=null;if(y())try{o=(await v.validCoupon(t)).coupon}catch(s){l.error(s.message||e("cart.couponInvalid","این کد معتبر نیست"));return}else o=k.COUPONS.find(s=>s.code===t)||null;if(!o){l.error(e("cart.couponInvalid","این کد معتبر نیست"));return}if(o.minSpend&&n.subtotal()<o.minSpend){l.warn(e("cart.couponMin","این کد حداقل خرید {n} نیاز دارد").replace("{n}",i(o.minSpend)));return}n.applyCoupon(o),l.success(`${e("cart.couponApplied","کد اعمال شد")} — ${o.label||o.code}`)}function E(){c("#coupon-apply")?.addEventListener("click",w),c("#coupon-input")?.addEventListener("keydown",r=>{r.key==="Enter"&&(r.preventDefault(),w())}),c("#coupon-remove")?.addEventListener("click",()=>{n.removeCoupon(),l.info(e("cart.couponRemoved","کد حذف شد"))}),c("#cart-clear")?.addEventListener("click",async()=>{await f({title:e("cart.clear","خالی کردن سبد"),message:e("cart.emptyText","این کار همه آیتم‌های سبد را حذف می‌کند."),confirmText:e("common.delete","Delete"),danger:!0})&&(n.clear(),l.info(e("cart.cleared","سبد خالی شد")))})}function T(){let r=c("#cart-items");r&&(r.addEventListener("click",t=>{let o=t.target.closest(".cart-item");if(!o)return;let s=o.dataset.id;t.target.closest("[data-remove]")?(n.remove(s),l.info(e("cart.removed","Removed from cart"))):t.target.closest("[data-inc]")?n.increment(s,1):t.target.closest("[data-dec]")&&n.increment(s,-1)}),r.addEventListener("change",t=>{let o=t.target.closest("[data-qty]");if(!o)return;let s=o.closest(".cart-item").dataset.id;n.setQty(s,o.value)}))}function u(){C(),L(),_()}async function I(){u(),T(),n.onChange(u),$(u)}var H={init:I};export{H as default,I as init};
