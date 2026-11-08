import{b}from"./chunk-KIK4IJKS.js";import{d as f}from"./chunk-OCIUYIWP.js";import{a as $,b as u,c as d,d as _,e as o,l as e,p as c,q as m,r as h,u as v}from"./chunk-W2AEBEJL.js";var w={update:"آپدیت",announcement:"اطلاعیه",security:"امنیت",event:"رویداد",maintenance:"تعمیرات",community:"انجمن"},S={city:"شهر",vehicles:"خودروها",police:"پلیس",nightlife:"زندگی شبانه",ems:"اورژانس",racing:"مسابقه",gangs:"گنگ‌ها",jobs:"مشاغل",property:"املاک",all:"همه"},x=(a,t)=>a[t]||t||"";function l(a,t){if(!a)return"";if(_()==="fa"){let n=t+"Fa";if(a[n])return a[n]}return a[t]??""}function R(){return!f()}function M(a,t){return R()?`<div class="demo-banner" role="note">
    ${c("warning")}
    <span><strong>${e(o("demo.badge","DEMO DATA"))}</strong> &mdash; ${e(o(a,t))}</span>
  </div>`:""}async function T(a,t){if(!f())return{data:t(),demo:!0};try{return{data:await a(),demo:!1}}catch(s){return console.warn("[royal] API call failed, using sample data:",s.message),{data:t(),demo:!0,error:s}}}function N(a,{reveal:t=!0,delay:s=0}={}){let n=l(a,"name"),r=l(a,"short"),i=b.CATEGORIES.find(p=>p.id===a.category),y=i?l(i,"name"):a.category,g=a.stock!==null&&a.stock!==void 0&&a.stock<=0,k=!g&&a.stock!==null&&a.stock!==void 0&&a.stock<=5;return`
  <article class="product" ${t?`data-reveal style="--d:${s}ms"`:""} data-product-id="${e(a.id)}">
    ${a.badge?`<span class="ribbon ${a.badge==="FREE"?"ribbon--green":a.badge==="LIMITED"?"ribbon--red":""}">${e(a.badge)}</span>`:""}
    <a class="product__media" href="${d("product.html")}?slug=${encodeURIComponent(a.slug)}" aria-label="${e(n)}">
      <img src="${u(a.image)}" alt="${e(n)}" loading="lazy" width="800" height="500">
      <span class="product__cat">${e(y)}</span>
    </a>
    <div class="product__body">
      <h3 class="product__title">
        <a href="${d("product.html")}?slug=${encodeURIComponent(a.slug)}" style="color:inherit">${e(n)}</a>
      </h3>
      <p class="product__desc">${e(r)}</p>
      ${a.features&&a.features.length?`<ul class="product__features">
        ${a.features.slice(0,3).map(p=>`<li>${e(p)}</li>`).join("")}
      </ul>`:""}
      <div class="product__foot">
        <div class="price">
          ${a.oldPrice?`<span class="price__old">${m(a.oldPrice)}</span>`:""}
          <span class="price__now">${a.price===0?e(o("shop.free","Free")):m(a.price)}</span>
          ${a.duration?`<span class="price__unit">/ ${e(a.duration)}</span>`:""}
        </div>
        ${g?`<span class="stock-chip stock-chip--out">${c("close")} ${e(o("shop.soldOut","ناموجود"))}</span>`:`<button class="btn btn--gold btn--sm" data-add-to-cart="${e(a.id)}">
               ${c("cart")}<span>${e(o("shop.add","Add"))}</span>
             </button>`}
      </div>
      ${k?`<span class="stock-chip stock-chip--low">${c("fire")} ${e(o("shop.onlyLeft","Only {n} left").replace("{n}",h(a.stock)))}</span>`:""}
    </div>
  </article>`}var A={update:"badge--gold",announcement:"badge--blue",event:"badge--green",security:"badge--red",maintenance:"badge--orange"};function z(a,{delay:t=0}={}){return`
  <article class="card card--hover news-card" data-reveal style="--d:${t}ms">
    <a class="news-card__media" href="${d("news.html")}?slug=${encodeURIComponent(a.slug)}">
      <img src="${u(a.image)}" alt="${e(l(a,"title"))}" loading="lazy" width="800" height="450">
      <span class="news-card__date">${e(v(a.date))}</span>
    </a>
    <div class="news-card__body">
      <div class="news-card__meta">
        <span class="badge ${A[a.category]||"badge--grey"}">${e(x(w,a.category))}</span>
        <span>${c("clock")} ${a.readMinutes} ${e(o("news.min","min read"))}</span>
      </div>
      <h4><a href="${d("news.html")}?slug=${encodeURIComponent(a.slug)}" style="color:inherit">${e(l(a,"title"))}</a></h4>
      <p>${e(l(a,"excerpt"))}</p>
      <a class="news-card__link" href="${d("news.html")}?slug=${encodeURIComponent(a.slug)}">
        ${e(o("common.readMore","Read more"))} ${c("arrowRight")}
      </a>
    </div>
  </article>`}function B(a,{delay:t=0}={}){let s=$.roles[a.role]||$.roles.user;return`
  <article class="card card--hover card--gold-edge staff-card" data-reveal style="--d:${t}ms">
    <div class="staff-card__avatar">
      <img src="${u(a.avatar)}" alt="${e(a.name)}" loading="lazy" width="240" height="240">
    </div>
    <h4 class="staff-card__name">${e(a.name)}</h4>
    <div class="staff-card__role ${s.css}">${e(s.label)}</div>
    <p class="staff-card__bio">${e(l(a,"bio"))}</p>
    <div class="staff-card__tag">@${e(a.tag)}</div>
  </article>`}function W({iconName:a,label:t,value:s,trend:n,trendDir:r="up",sub:i=""}){return`
  <div class="kpi" data-reveal>
    <div class="kpi__top">
      <span class="kpi__label">${e(t)}</span>
      <span class="kpi__icon">${c(a)}</span>
    </div>
    <div class="kpi__value">${e(s)}</div>
    <div class="kpi__foot">
      ${n!=null?`<span class="kpi__trend kpi__trend--${r}">${c(r==="up"?"trendUp":"trendDown")}${e(n)}</span>`:""}
      ${i?`<span class="kpi__sub">${e(i)}</span>`:""}
    </div>
  </div>`}function Y(a){return a.map((t,s)=>{let n=s===a.length-1;return(n?`<span class="current">${e(t.label)}</span>`:`<a href="${t.href}">${e(t.label)}</a>`)+(n?"":'<span class="sep">/</span>')}).join("")}function j(a,t=null){return new URLSearchParams(location.search).get(a)??t}function q(a,{replace:t=!0}={}){let s=new URL(location.href);for(let[n,r]of Object.entries(a))r==null||r===""||r==="all"?s.searchParams.delete(n):s.searchParams.set(n,r);history[t?"replaceState":"pushState"]({},"",s)}export{w as a,S as b,x as c,l as d,R as e,M as f,T as g,N as h,z as i,B as j,W as k,Y as l,j as m,q as n};
