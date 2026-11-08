import{a as Q,b as ze,c as Me,d as De,e as re,g as U}from"./chunk-HRWNYBPI.js";import{a as ne,b as Fe}from"./chunk-GICZ4Y7Y.js";import{d as Ie,e as q,f as de,g as L,k as I}from"./chunk-J7TKWPPN.js";import{a as je,b as le,f as O}from"./chunk-MWRI3OKJ.js";import{b as w}from"./chunk-KIK4IJKS.js";import{b,d as B,e as Oe}from"./chunk-OCIUYIWP.js";import{A as Ae,C as he,L as J,M as ae,O as se,S as ie,T as Ne,U as K,V as Re,a as y,b as D,c as be,e as n,g as Te,i as p,j as R,l as a,m as P,p as m,q as S,r as x,u as V,v as Y,w as ge,x as u,y as N,z as F}from"./chunk-W2AEBEJL.js";var c={pick:"انتخاب تصویر",upload:"آپلود تصویر جدید",search:"جستجوی تصویر...",choose:"انتخاب",cancel:"انصراف",save:"ذخیره",add:"افزودن",edit:"ویرایش",del:"حذف",name:"نام",role:"نقش",tag:"شناسه دیسکورد",bio:"معرفی",avatar:"تصویر پروفایل",since:"عضو از",order:"ترتیب",visible:"نمایش در سایت",title:"عنوان",tagLabel:"برچسب",size:"اندازه",normal:"عادی",wide:"عریض",tall:"بلند",question:"پرسش",answer:"پاسخ",category:"دسته",saved:"ذخیره شد",deleted:"حذف شد",demoWrite:"حالت نمایشی: این تغییر هیچ‌جا ذخیره نمی‌شود.",noItems:"موردی ثبت نشده است",confirmDel:"این مورد حذف شود؟"},A=()=>!B();function Pe(){let e=s=>[...new Set(s)],t=s=>s.replace(/^.*assets\//,"assets/");return[{label:"محصولات",dir:"assets/images/products",items:e(w.PRODUCTS.map(s=>t(s.image))).map(s=>({name:s.split("/").pop(),url:s}))},{label:"GTA",dir:"assets/images/gta",items:e(w.GALLERY.map(s=>t(s.src))).map(s=>({name:s.split("/").pop(),url:s}))},{label:"تیم",dir:"assets/images/staff",items:e(w.STAFF.map(s=>t(s.avatar))).map(s=>({name:s.split("/").pop(),url:s}))}].filter(s=>s.items.length)}function ct(e=null){return new Promise(async t=>{let s=[];try{s=A()?Pe():(await b.get("/admin/media")).groups||[]}catch{s=Pe()}let i=e,d="",l=()=>{let k=d.trim().toLowerCase(),h=s.map($=>({...$,items:$.items.filter(_=>!k||_.name.toLowerCase().includes(k))})).filter($=>$.items.length);return h.length?h.map($=>`
        <section style="margin-bottom:1.5rem">
          <h5 style="font-size:.78rem;letter-spacing:.1em;color:var(--c-gold);margin-bottom:.6rem">
            ${a($.label)} <span class="text-muted">(${x($.items.length)})</span>
          </h5>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:.6rem">
            ${$.items.map(_=>`
              <button type="button" class="media-tile${_.url===i?" is-selected":""}"
                      data-url="${a(_.url)}" title="${a(_.name)}">
                <img src="${_.url.startsWith("/")?_.url:D(_.url)}" alt="" loading="lazy">
              </button>`).join("")}
          </div>
        </section>`).join(""):`<p class="text-muted text-center" style="padding:2rem">${a(n("common.noResults","نتیجه‌ای یافت نشد"))}</p>`},r=N({title:c.pick,size:"lg",body:`
        <div class="flex gap-3 flex-wrap mb-4">
          <div class="searchbox" style="flex:1;min-width:200px">
            ${m("search")}
            <input class="input" id="mp-search" placeholder="${a(c.search)}" autocomplete="off">
          </div>
          <button class="btn btn--ghost btn--sm" id="mp-upload-btn">
            ${m("upload")}<span>${a(c.upload)}</span>
          </button>
          <input type="file" id="mp-file" accept="image/*" hidden multiple>
        </div>

        <div id="mp-selected" class="mb-4" style="font-size:.78rem;color:var(--c-grey-400)">
          ${i?`انتخاب فعلی: <code>${a(i)}</code>`:""}
        </div>

        <div id="mp-grid" style="max-height:52vh;overflow-y:auto">${l()}</div>`,footer:`
        <button class="btn btn--dark" data-cancel>${a(c.cancel)}</button>
        <button class="btn btn--gold" data-ok>${a(c.choose)}</button>`,onClose:()=>t(null)}),f=()=>{r.el.querySelector("#mp-grid").innerHTML=l(),r.el.querySelector("#mp-selected").innerHTML=i?`انتخاب فعلی: <code>${a(i)}</code>`:""};r.el.querySelector("#mp-grid").addEventListener("click",k=>{let h=k.target.closest("[data-url]");h&&(i=h.dataset.url,f())}),r.el.querySelector("#mp-search").addEventListener("input",P(k=>{d=k.target.value,r.el.querySelector("#mp-grid").innerHTML=l()},200));let v=r.el.querySelector("#mp-file");r.el.querySelector("#mp-upload-btn").addEventListener("click",()=>v.click()),v.addEventListener("change",async()=>{if(!v.files.length)return;if(A()){u.warn(c.demoWrite);return}let k=r.el.querySelector("#mp-upload-btn"),h=ae(k);try{let $=new FormData;for(let W of v.files)$.append("files",W);let j=(await b.admin.upload($)).files||[];if(j.length){let W=s.find(T=>T.dir==="uploads"),te=j.map(T=>({name:T.name,url:T.url}));W?W.items.unshift(...te):s.unshift({label:"آپلودشده",dir:"uploads",items:te}),i=j[0].url,f(),u.success(`${x(j.length)} تصویر آپلود شد`)}}catch($){u.error($.message)}h(),v.value=""}),r.el.querySelector("[data-cancel]").addEventListener("click",()=>{t(null),r.close()}),r.el.querySelector("[data-ok]").addEventListener("click",()=>{t(i),r.close()})})}function X(e,{inputId:t,previewId:s,buttonId:i}){let d=e.querySelector("#"+t),l=e.querySelector("#"+s),r=e.querySelector("#"+i);if(!d||!r)return;let f=()=>{if(!l)return;let v=d.value.trim();l.innerHTML=v?`<img src="${v.startsWith("/")?v:D(v)}" alt="">`:'<span class="text-muted" style="font-size:.74rem">بدون تصویر</span>'};r.addEventListener("click",async()=>{let v=await ct(d.value.trim()||null);v&&(d.value=v,f())}),d.addEventListener("input",f),f()}async function Ue(){if(A())return w.STAFF.map(e=>({...e,sortOrder:e.id,visible:!0}));try{return(await b.get("/admin/staff")).items||[]}catch{return[]}}function He(e){return`
  <div class="card">
    <div class="tbl-toolbar">
      <span class="text-muted">${x(e.length)} عضو</span>
      <div class="spacer"></div>
      <button class="btn btn--gold btn--sm" data-staff-add>${m("plus")}<span>${a(c.add)}</span></button>
    </div>

    ${e.length?`
    <div class="table-wrap">
      <table class="table">
        <thead><tr>
          <th>${a(c.name)}</th><th>${a(c.role)}</th><th>${a(c.tag)}</th>
          <th>${a(c.order)}</th><th>${a(c.visible)}</th><th>عملیات</th>
        </tr></thead>
        <tbody>
          ${e.map(t=>{let s=y.roles[t.role]||y.roles.user;return`<tr data-staff="${t.id}">
              <td>
                <div class="flex gap-2 items-center">
                  <img src="${D(t.avatar||"assets/images/staff/staff-generic.svg")}" alt=""
                       width="32" height="32" loading="lazy"
                       style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:1px solid var(--c-grey-800)">
                  <strong style="color:var(--c-white);font-size:.86rem">${a(t.name)}</strong>
                </div>
              </td>
              <td><span class="badge badge--grey ${s.css}">${a(s.label)}</span></td>
              <td class="mono" style="font-size:.76rem">${a(t.tag||"—")}</td>
              <td class="num">${x(t.sortOrder??0)}</td>
              <td>${t.visible?'<span class="badge badge--green">فعال</span>':'<span class="badge badge--grey">مخفی</span>'}</td>
              <td><div class="actions">
                <button class="icon-btn" data-staff-edit title="${a(c.edit)}">${m("edit")}</button>
                <button class="icon-btn icon-btn--danger" data-staff-del title="${a(c.del)}">${m("trash")}</button>
              </div></td>
            </tr>`}).join("")}
        </tbody>
      </table>
    </div>`:J({icon:"users",title:c.noItems})}
  </div>`}function ye(e,t){let i=N({title:!e?`${c.add} عضو`:`${c.edit}: ${e.name}`,size:"lg",body:`
      <form id="staff-form" class="form-grid">
        <div class="field">
          <label for="sf-name">${a(c.name)}</label>
          <input class="input" id="sf-name" name="name" value="${a(e?.name||"")}">
        </div>
        <div class="field">
          <label for="sf-tag">${a(c.tag)}</label>
          <input class="input mono" id="sf-tag" name="tag" value="${a(e?.tag||"")}" dir="ltr">
        </div>
        <div class="field">
          <label for="sf-role">${a(c.role)}</label>
          <select class="select" id="sf-role" name="role">
            ${Object.entries(y.roles).map(([d,l])=>`<option value="${d}" ${e?.role===d?"selected":""}>${a(l.label)}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label for="sf-since">${a(c.since)}</label>
          <input class="input mono" id="sf-since" name="since" type="date" value="${a(e?.since||"")}">
        </div>
        <div class="field field--full">
          <label for="sf-bio">${a(c.bio)}</label>
          <textarea class="textarea" id="sf-bio" name="bioFa" style="min-height:80px">${a(e?.bioFa||e?.bio||"")}</textarea>
        </div>

        <div class="field field--full">
          <label>${a(c.avatar)}</label>
          <div class="flex gap-3 items-center">
            <div class="media-preview" id="sf-preview"></div>
            <div style="flex:1">
              <input class="input mono" id="sf-avatar" name="avatar" dir="ltr"
                     value="${a(e?.avatar||"assets/images/staff/staff-generic.svg")}" style="font-size:.78rem">
              <button class="btn btn--ghost btn--sm mt-4" type="button" id="sf-pick">
                ${m("gallery")}<span>${a(c.pick)}</span>
              </button>
            </div>
          </div>
        </div>

        <div class="field">
          <label for="sf-order">${a(c.order)}</label>
          <input class="input" id="sf-order" name="sortOrder" type="number" min="0" value="${e?.sortOrder??0}">
        </div>
        <div class="field">
          <label class="switch" style="margin-top:1.6rem">
            <input type="checkbox" name="visible" ${e?.visible!==!1?"checked":""}>
            <span class="switch__track"></span><span>${a(c.visible)}</span>
          </label>
        </div>
      </form>`,footer:`<button class="btn btn--dark" data-cancel>${a(c.cancel)}</button>
             <button class="btn btn--gold" data-save>${a(c.save)}</button>`});X(i.el,{inputId:"sf-avatar",previewId:"sf-preview",buttonId:"sf-pick"}),i.el.querySelector("[data-cancel]").addEventListener("click",i.close),i.el.querySelector("[data-save]").addEventListener("click",async()=>{let d=i.el.querySelector("#staff-form"),l=Object.fromEntries(new FormData(d).entries()),r={name:l.name?.trim(),tag:l.tag?.trim()||null,role:l.role,bioFa:l.bioFa?.trim()||null,bio:l.bioFa?.trim()||null,avatar:l.avatar?.trim()||null,since:l.since||null,sortOrder:Number(l.sortOrder)||0,visible:!!l.visible};if(!r.name){u.error("نام الزامی است");return}if(A()){u.warn(c.demoWrite),i.close(),t?.();return}try{e?await b.patch(`/admin/staff/${e.id}`,r):await b.post("/admin/staff",r),u.success(c.saved),i.close(),t?.()}catch(f){u.error(f.message)}})}async function Ge(e,t){if(!await F({title:c.del,message:`${t}؟`,danger:!0,confirmText:c.del}))return!1;if(A())return u.warn(c.demoWrite),!0;try{return await b.del(`/admin/staff/${e}`),u.success(c.deleted),!0}catch(i){return u.error(i.message),!1}}async function We(){if(A())return w.GALLERY.map(e=>({...e,sortOrder:e.id,visible:!0}));try{return(await b.get("/admin/gallery")).items||[]}catch{return[]}}function Ve(e){return`
  <div class="card">
    <div class="tbl-toolbar">
      <span class="text-muted">${x(e.length)} تصویر</span>
      <div class="spacer"></div>
      <button class="btn btn--gold btn--sm" data-gal-add>${m("plus")}<span>${a(c.add)}</span></button>
    </div>

    ${e.length?`
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:.9rem">
        ${e.map(t=>`
          <figure class="gal-admin-tile${t.visible===!1?" is-hidden":""}" data-gal="${t.id}">
            <img src="${D(t.src)}" alt="" loading="lazy">
            <figcaption>
              <span>${a(t.titleFa||t.title||"—")}</span>
              <small>${a(t.tag||"")}</small>
            </figcaption>
            <div class="gal-admin-tile__actions">
              <button class="icon-btn" data-gal-edit title="${a(c.edit)}">${m("edit")}</button>
              <button class="icon-btn icon-btn--danger" data-gal-del title="${a(c.del)}">${m("trash")}</button>
            </div>
          </figure>`).join("")}
      </div>`:J({icon:"gallery",title:c.noItems})}
  </div>`}function we(e,t){let s=N({title:e?c.edit:`${c.add} تصویر`,body:`
      <form id="gal-form" class="form-grid">
        <div class="field field--full">
          <label>${a(c.pick)}</label>
          <div class="flex gap-3 items-center">
            <div class="media-preview media-preview--wide" id="gf-preview"></div>
            <div style="flex:1">
              <input class="input mono" id="gf-src" name="src" dir="ltr"
                     value="${a(e?.src||"")}" style="font-size:.78rem">
              <button class="btn btn--ghost btn--sm mt-4" type="button" id="gf-pick">
                ${m("gallery")}<span>${a(c.pick)}</span>
              </button>
            </div>
          </div>
        </div>
        <div class="field field--full">
          <label for="gf-title">${a(c.title)}</label>
          <input class="input" id="gf-title" name="titleFa" value="${a(e?.titleFa||e?.title||"")}">
        </div>
        <div class="field">
          <label for="gf-tag">${a(c.tagLabel)}</label>
          <input class="input mono" id="gf-tag" name="tag" dir="ltr" value="${a(e?.tag||"")}">
        </div>
        <div class="field">
          <label for="gf-size">${a(c.size)}</label>
          <select class="select" id="gf-size" name="size">
            <option value="" ${e?.size?"":"selected"}>${a(c.normal)}</option>
            <option value="wide" ${e?.size==="wide"?"selected":""}>${a(c.wide)}</option>
            <option value="tall" ${e?.size==="tall"?"selected":""}>${a(c.tall)}</option>
          </select>
        </div>
        <div class="field">
          <label for="gf-order">${a(c.order)}</label>
          <input class="input" id="gf-order" name="sortOrder" type="number" min="0" value="${e?.sortOrder??0}">
        </div>
        <div class="field">
          <label class="switch" style="margin-top:1.6rem">
            <input type="checkbox" name="visible" ${e?.visible!==!1?"checked":""}>
            <span class="switch__track"></span><span>${a(c.visible)}</span>
          </label>
        </div>
      </form>`,footer:`<button class="btn btn--dark" data-cancel>${a(c.cancel)}</button>
             <button class="btn btn--gold" data-save>${a(c.save)}</button>`});X(s.el,{inputId:"gf-src",previewId:"gf-preview",buttonId:"gf-pick"}),s.el.querySelector("[data-cancel]").addEventListener("click",s.close),s.el.querySelector("[data-save]").addEventListener("click",async()=>{let i=Object.fromEntries(new FormData(s.el.querySelector("#gal-form")).entries()),d={src:i.src?.trim(),titleFa:i.titleFa?.trim()||null,title:i.titleFa?.trim()||null,tag:i.tag?.trim()||null,size:i.size||null,sortOrder:Number(i.sortOrder)||0,visible:!!i.visible};if(!d.src){u.error("تصویر الزامی است");return}if(A()){u.warn(c.demoWrite),s.close(),t?.();return}try{e?await b.patch(`/admin/gallery/${e.id}`,d):await b.post("/admin/gallery",d),u.success(c.saved),s.close(),t?.()}catch(l){u.error(l.message)}})}async function Be(e){if(!await F({title:c.del,message:c.confirmDel,danger:!0,confirmText:c.del}))return!1;if(A())return u.warn(c.demoWrite),!0;try{return await b.del(`/admin/gallery/${e}`),u.success(c.deleted),!0}catch(s){return u.error(s.message),!1}}var ut=["start","shop","account","rules","tech"],pt={start:"شروع کار",shop:"فروشگاه",account:"حساب",rules:"قوانین",tech:"فنی"};async function Ye(){if(A())return le.map(e=>({cat:e.cat,q:O(e.q,"fa"),a:O(e.a,"fa")}));try{let t=(await b.get("/admin/faq")).items||[];return t.length?t:le.map(s=>({cat:s.cat,q:O(s.q,"fa"),a:O(s.a,"fa")}))}catch{return le.map(e=>({cat:e.cat,q:O(e.q,"fa"),a:O(e.a,"fa")}))}}function Je(e){return`
  <div class="card">
    <div class="tbl-toolbar">
      <span class="text-muted">${x(e.length)} پرسش</span>
      <div class="spacer"></div>
      <button class="btn btn--ghost btn--sm" data-faq-add>${m("plus")}<span>${a(c.add)}</span></button>
      <button class="btn btn--gold btn--sm" data-faq-save>${m("check")}<span>${a(c.save)}</span></button>
    </div>

    <div id="faq-rows" style="display:grid;gap:.75rem">
      ${e.map((t,s)=>xe(t,s)).join("")||J({icon:"question",title:c.noItems})}
    </div>
  </div>`}function xe(e,t){return`
  <div class="faq-edit-row" data-faq-index="${t}">
    <div class="flex gap-3 items-center mb-4">
      <select class="select" data-faq-cat style="max-width:160px">
        ${ut.map(s=>`<option value="${s}" ${e.cat===s?"selected":""}>${a(pt[s])}</option>`).join("")}
      </select>
      <input class="input" data-faq-q value="${a(e.q||"")}" placeholder="${a(c.question)}" style="flex:1">
      <button class="icon-btn icon-btn--danger" data-faq-del title="${a(c.del)}">${m("trash")}</button>
    </div>
    <textarea class="textarea" data-faq-a placeholder="${a(c.answer)}" style="min-height:76px">${a(e.a||"")}</textarea>
  </div>`}function Ke(e){return R(".faq-edit-row",e).map(t=>({cat:t.querySelector("[data-faq-cat]").value,q:t.querySelector("[data-faq-q]").value.trim(),a:t.querySelector("[data-faq-a]").value.trim()})).filter(t=>t.q&&t.a)}async function Qe(e){if(A())return u.warn(c.demoWrite),!1;try{return await b.put("/admin/faq",{items:e}),u.success(`${x(e.length)} پرسش ذخیره شد`),!0}catch(t){return u.error(t.message),!1}}var mt=["shield","users","siren","cpu","clipboard","car","money","warning"];async function Xe(){if(A())return structuredClone($e());try{let t=(await b.get("/admin/rules")).sections||[];return t.length?t:structuredClone($e())}catch{return structuredClone($e())}}function $e(){return je.map(e=>({id:e.id,icon:e.icon,title:O(e.title,"fa"),intro:O(e.intro,"fa"),items:e.items.map(t=>({n:t.n,t:O(t.t,"fa"),d:O(t.d,"fa"),p:t.p?O(t.p,"fa"):""}))}))}function ke(e){return`
  <div class="card">
    <div class="tbl-toolbar">
      <span class="text-muted">${x(e.length)} بخش &middot;
        ${x(e.reduce((t,s)=>t+s.items.length,0))} قانون</span>
      <div class="spacer"></div>
      <button class="btn btn--ghost btn--sm" data-rule-add-section>${m("plus")}<span>بخش جدید</span></button>
      <button class="btn btn--gold btn--sm" data-rules-save>${m("check")}<span>${a(c.save)}</span></button>
    </div>

    <div id="rules-sections" style="display:grid;gap:1rem">
      ${e.map((t,s)=>vt(t,s)).join("")||J({icon:"clipboard",title:c.noItems})}
    </div>
  </div>`}function vt(e,t){return`
  <section class="rule-edit-section" data-rule-section="${t}">
    <div class="flex gap-3 items-center flex-wrap mb-4">
      <select class="select" data-rule-icon style="max-width:130px">
        ${mt.map(s=>`<option value="${s}" ${e.icon===s?"selected":""}>${s}</option>`).join("")}
      </select>
      <input class="input mono" data-rule-id dir="ltr" style="max-width:120px"
             value="${a(e.id||"")}" placeholder="core">
      <input class="input" data-rule-title value="${a(e.title||"")}"
             placeholder="عنوان بخش" style="flex:1;min-width:160px">
      <button class="icon-btn" data-rule-add-item title="افزودن قانون">${m("plus")}</button>
      <button class="icon-btn icon-btn--danger" data-rule-del-section title="${a(c.del)}">${m("trash")}</button>
    </div>

    <input class="input mb-4" data-rule-intro value="${a(e.intro||"")}" placeholder="توضیح کوتاه بخش">

    <div class="rule-items" style="display:grid;gap:.6rem">
      ${e.items.map(s=>_e(s)).join("")}
    </div>
  </section>`}function _e(e={n:"",t:"",d:"",p:""}){return`
  <div class="rule-edit-item">
    <div class="flex gap-2 items-center mb-4">
      <input class="input mono" data-rule-n dir="ltr" style="max-width:74px"
             value="${a(e.n||"")}" placeholder="1.1">
      <input class="input" data-rule-t value="${a(e.t||"")}"
             placeholder="عنوان قانون" style="flex:1">
      <button class="icon-btn icon-btn--danger" data-rule-del-item title="${a(c.del)}">${m("trash")}</button>
    </div>
    <textarea class="textarea" data-rule-d placeholder="توضیح قانون"
              style="min-height:62px">${a(e.d||"")}</textarea>
    <input class="input mt-4" data-rule-p value="${a(e.p||"")}"
           placeholder="مجازات (اختیاری)">
  </div>`}function Se(e){return R(".rule-edit-section",e).map(t=>({id:(t.querySelector("[data-rule-id]").value.trim()||"section").replace(/[^a-z0-9-]/gi,"-").toLowerCase(),icon:t.querySelector("[data-rule-icon]").value,title:t.querySelector("[data-rule-title]").value.trim(),intro:t.querySelector("[data-rule-intro]").value.trim(),items:R(".rule-edit-item",t).map(s=>({n:s.querySelector("[data-rule-n]").value.trim(),t:s.querySelector("[data-rule-t]").value.trim(),d:s.querySelector("[data-rule-d]").value.trim(),p:s.querySelector("[data-rule-p]").value.trim()})).filter(s=>s.t&&s.d)})).filter(t=>t.title&&t.items.length)}async function Ze(e){if(A())return u.warn(c.demoWrite),!1;if(!e.length)return u.error("حداقل یک بخش با یک قانون لازم است"),!1;try{return await b.put("/admin/rules",{sections:e}),u.success(`${x(e.length)} بخش قوانین ذخیره شد`),!0}catch(t){return u.error(t.message),!1}}var bt=[{id:"overview",icon:"dashboard",key:"admin.overview",role:"shop_manager",group:null},{id:"users",icon:"users",key:"admin.users",role:"admin",group:"admin.users"},{id:"roles",icon:"key",key:"admin.roles",role:"head_admin",group:null},{id:"products",icon:"box",key:"admin.products",role:"shop_manager",group:"nav.shop"},{id:"orders",icon:"package",key:"admin.orders",role:"shop_manager",group:null},{id:"coupons",icon:"tag",key:"admin.coupons",role:"shop_manager",group:null},{id:"tickets",icon:"ticket",key:"admin.tickets",role:"support",group:"nav.support"},{id:"news",icon:"news",key:"admin.news",role:"moderator",group:"admin.content"},{id:"content",icon:"edit",key:"admin.content",role:"admin",group:null},{id:"server",icon:"server",key:"admin.server",role:"moderator",group:"admin.server"},{id:"logs",icon:"log",key:"admin.logs",role:"moderator",group:null},{id:"integrations",icon:"link",key:"admin.integrations",role:"developer",group:null},{id:"settings",icon:"settings",key:"admin.settings",role:"head_admin",group:null}],nt={active:"فعال",pending:"در انتظار تأیید",suspended:"معلق",banned:"مسدود"},lt={pending:"در انتظار پرداخت",paid:"پرداخت‌شده",delivered:"تحویل‌شده",failed:"ناموفق",refunded:"بازپرداخت‌شده",cancelled:"لغو‌شده"};var gt={percent:"درصدی",fixed:"مبلغ ثابت"},ve={"player.join":"ورود بازیکن","player.leave":"خروج بازیکن",purchase:"خرید",payment:"پرداخت","admin.action":"اقدام مدیریتی",ban:"بن",unban:"رفع بن",kick:"کیک","auth.login":"ورود به سایت","auth.failed":"ورود ناموفق",website:"وب‌سایت","server.event":"رویداد سرور",inventory:"انبار",money:"پول","job.change":"تغییر شغل",vehicle:"خودرو",error:"خطا",api:"API",security:"امنیت"},qe={info:"اطلاع",success:"موفق",warning:"هشدار",error:"خطا",critical:"بحرانی"},ht={zarinpal:"زرین‌پال",card:"درگاه بانکی",wallet:"اعتبار فروشگاه",manual:"دستی"},$t=e=>{let t=w.CATEGORIES.find(s=>s.id===e);return t?t.nameFa||t.name:e||"—"},E=(e,t)=>e[t]||t||"—",o={stats:null,users:[],products:[],orders:[],coupons:[],tickets:[],news:[],logs:[],resources:[],status:null,staff:[],gallery:[],faq:[],rules:[],game:{imported:!1,items:[],jobs:[],properties:[],gangs:[]},health:null},g={users:{page:1,per:12,q:"",role:"all",status:"all",sort:"createdAt",dir:"desc"},orders:{page:1,per:12,q:"",status:"all"},logs:{page:1,per:40,q:"",category:"all",severity:"all",from:"",to:"",live:!1},products:{q:"",category:"all"}},pe=null,me=null;async function Ee(){let[e,t,s,i,d,l,r,f,v,k,h,$]=await Promise.all([L(()=>b.admin.stats(),()=>w.demoAdminStats()),L(()=>b.admin.users(),()=>({items:w.demoUsers(64)})),L(()=>b.productList({limit:200}),()=>({items:w.PRODUCTS})),L(()=>b.admin.coupons(),()=>({items:w.COUPONS})),L(()=>b.admin.orders(),()=>({items:w.demoAdminOrders(48)})),L(()=>b.admin.tickets(),()=>({items:w.DEMO_TICKETS})),L(()=>b.news({limit:50}),()=>({items:w.NEWS})),L(()=>b.admin.logs({limit:240}),()=>({items:w.demoLogs(240)})),L(()=>b.resources(),()=>({items:w.demoResources()})),L(()=>b.serverStatus(),()=>w.demoServerStatus()),L(()=>b.get("/content/game-data"),()=>({imported:!1,items:[],jobs:[]})),L(()=>b.health(),()=>null)]);o.stats=e.data,o.users=t.data.items||t.data,o.products=s.data.items||s.data,o.coupons=i.data.items||i.data,o.orders=d.data.items||d.data,o.tickets=l.data.items||l.data,o.news=r.data.items||r.data,o.logs=f.data.items||f.data,o.resources=v.data.items||v.data,o.status=k.data,o.game=h.data||{imported:!1,items:[],jobs:[]},o.health=$.data||null}function Z(){return bt.filter(e=>ne.hasRole(e.role))}function et(){let e=p("#admin-aside");if(!e)return;let t=ne.user||{},s=y.roles[t.role]||y.roles.user,i=o.tickets.filter(r=>r.status!=="closed").length,d=null,l=Z().map(r=>{let f="";r.group&&r.group!==d&&(f=`<div class="dash-nav__group">${a(n(r.group))}</div>`,d=r.group);let v=r.id==="tickets"&&i?`<span class="pill">${i}</span>`:"";return`${f}<button type="button" data-section="${r.id}">${m(r.icon)}<span>${a(n(r.key))}</span>${v}</button>`}).join("");e.innerHTML=`
    <div class="dash-user">
      <span class="dash-user__avatar">${a((t.username||"A").slice(0,2).toUpperCase())}</span>
      <div>
        <div class="dash-user__name">${a(t.username||"")}</div>
        <div class="dash-user__role ${s.css}">${a(s.label)}</div>
      </div>
    </div>
    <nav class="dash-nav">${l}</nav>
    <a class="btn btn--ghost btn--sm btn--block mt-4" href="${be("dashboard.html")}">
      ${m("user")}<span>${a(n("nav.dashboard","داشبورد"))}</span>
    </a>`,e.addEventListener("click",r=>{let f=r.target.closest("[data-section]");f&&(M(f.dataset.section),e.classList.remove("is-open"),p("#admin-backdrop")?.classList.remove("is-open"))})}function C(e,t,s,i,d=""){return`<section class="dash-section" data-panel="${e}">
    <div class="dash-head">
      <div><h1>${a(t)}</h1>${s?`<p>${a(s)}</p>`:""}</div>
      ${d?`<div class="flex gap-2 flex-wrap">${d}</div>`:""}
    </div>
    ${i}
  </section>`}function yt(){let e=o.stats||{};return C("overview",n("admin.title","پنل مدیریت"),n("admin.sub",""),`
    <div id="admin-demo"></div>

    <div class="kpi-grid">
      ${I({iconName:"users",label:n("admin.totalUsers","کل کاربران"),value:x(e.totalUsers),trend:"+4.2%",trendDir:"up",sub:"نسبت به ماه گذشته"})}
      ${I({iconName:"activity",label:n("admin.onlineNow","Online now"),value:x(e.onlineNow),sub:`${x(e.activeToday)} ${n("admin.activeToday","active today")}`})}
      ${I({iconName:"money",label:n("admin.revenueMonth","Revenue this month"),value:S(e.revenueMonth),trend:"+11.8%",trendDir:"up"})}
      ${I({iconName:"package",label:n("admin.completedOrders","سفارش‌های تکمیل‌شده"),value:x(e.completedOrders),sub:`${e.refunds} ${n("admin.refunds","refunds")}`})}
      ${I({iconName:"crown",label:n("admin.vipPurchases","VIP purchases"),value:x(e.vipPurchases),trend:"+6.4%",trendDir:"up"})}
      ${I({iconName:"ticket",label:n("admin.openTickets","Open tickets"),value:x(e.openTickets),trend:"-2",trendDir:"down"})}
      ${I({iconName:"chart",label:n("admin.avgOrder","میانگین سفارش"),value:S(e.avgOrderValue)})}
      ${I({iconName:"trendUp",label:n("admin.conversion","نرخ تبدیل"),value:e.conversionRate+"%",trend:"+0.3",trendDir:"up"})}
    </div>

    <div class="grid g-2">
      <div class="chart-card">
        <div class="chart-card__head">
          <h4>${a(n("admin.revenueChart","درآمد ۳۰ روز گذشته"))}</h4>
          <div class="chart-legend"><span><i style="background:#d4af37"></i>${a(y.shop.currencyLabel)}</span></div>
        </div>
        <div class="chart-box" id="chart-revenue"></div>
      </div>

      <div class="chart-card">
        <div class="chart-card__head">
          <h4>${a(n("admin.playersChart","بازیکنان در ۲۴ ساعت"))}</h4>
          <div class="chart-legend"><span><i style="background:#ffd700"></i>بازیکنان</span></div>
        </div>
        <div class="chart-box" id="chart-players"></div>
      </div>

      <div class="chart-card">
        <div class="chart-card__head"><h4>${a(n("admin.growthChart","رشد کاربران"))}</h4></div>
        <div class="chart-box" id="chart-growth"></div>
      </div>

      <div class="chart-card">
        <div class="chart-card__head"><h4>${a(n("admin.salesByCategory","فروش بر اساس دسته"))}</h4></div>
        <div class="donut-wrap">
          <div class="donut" id="chart-donut"></div>
          <ul class="donut-legend" id="chart-donut-legend"></ul>
        </div>
      </div>
    </div>

    <div class="grid g-2">
      <div class="card">
        <div class="card__head">
          <h4>${a(n("admin.recentOrders","سفارش‌های اخیر"))}</h4>
          <button class="btn btn--ghost btn--sm" data-goto="orders">${a(n("common.viewAll","مشاهده همه"))}</button>
        </div>
        <div class="table-wrap" style="border:0;background:none">
          <table class="table" style="min-width:0">
            <tbody>
              ${o.orders.slice(0,6).map(t=>`
                <tr>
                  <td class="mono" style="font-size:.76rem">${a(t.id)}</td>
                  <td style="font-size:.82rem">${a(t.user)}</td>
                  <td class="num">${S(t.total)}</td>
                  <td><span class="order-status order-status--${a(t.status)}">${a(E(lt,t.status))}</span></td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card__head">
          <h4>${a(n("admin.recentActivity","فعالیت اخیر"))}</h4>
          <button class="btn btn--ghost btn--sm" data-goto="logs">${a(n("common.viewAll","مشاهده همه"))}</button>
        </div>
        <div class="activity">
          ${o.logs.slice(0,7).map(t=>`
            <div class="activity-item">
              <span class="activity-item__dot"></span>
              <div>
                <div class="activity-item__text">${a(t.message)}</div>
                <div class="activity-item__time">${a(E(ve,t.category))} &middot; ${a(Y(t.ts))}</div>
              </div>
            </div>`).join("")}
        </div>
      </div>
    </div>`)}async function wt(){let[e,t,s]=await Promise.all([L(()=>b.get("/admin/charts/revenue",{days:30}),()=>({items:w.demoRevenueSeries(30)})),L(()=>b.get("/admin/charts/growth"),()=>({items:w.demoUserGrowth(12)})),L(()=>b.get("/admin/charts/categories"),()=>({items:w.demoCategorySplit()}))]),i=p("#chart-revenue");if(i){let f=e.data.items||e.data;U(i,()=>Q(i,f,{format:v=>S(v),label:"Revenue"}))}let d=p("#chart-growth");if(d){let f=t.data.items||t.data;U(d,()=>ze(d,f))}let l=p("#chart-donut");if(l){let f=s.data.items||s.data;if(f.length)U(l,()=>Me(l,f,{centerLabel:"مجموع",format:v=>S(v)})),De(p("#chart-donut-legend"),f,v=>S(v));else{l.innerHTML=`<p class="text-muted text-center" style="padding:2rem 0">${a(n("common.noResults","No sales yet"))}</p>`;let v=p("#chart-donut-legend");v&&(v.innerHTML="")}}let r=p("#chart-players");r&&(q()?U(r,()=>Q(r,w.demoPlayerCurve(24),{color:"#ffd700",label:"بازیکنان"})):o.status?.connected?U(r,()=>Q(r,w.demoPlayerCurve(24),{color:"#ffd700",label:"بازیکنان"})):r.innerHTML=`<div class="state" style="border:0;padding:2rem 1rem">
        <div class="state__icon">${m("server")}</div>
        <p style="font-size:.86rem;margin:0">هنوز سابقه‌ای از بازیکنان ثبت نشده &mdash; برای ثبت، سرور VMP را متصل کنید.</p>
      </div>`)}function dt(){let e=g.users,t=e.q.trim().toLowerCase(),s=o.users.filter(i=>!(e.role!=="all"&&i.role!==e.role||e.status!=="all"&&i.status!==e.status||t&&![i.username,i.displayName,i.email,String(i.id),i.discordId].join(" ").toLowerCase().includes(t)));return Ne(s,e.sort,e.dir)}function xt(){return C("users",n("admin.users","Users"),"",`
    <div class="card">
      <div class="tbl-toolbar">
        <div class="searchbox">
          ${m("search")}
          <input class="input" id="u-search" placeholder="${a(n("admin.searchUsers","جستجو بر اساس نام، ایمیل یا شناسه"))}" value="${a(g.users.q)}">
        </div>
        <select class="select" id="u-role" style="max-width:170px">
          <option value="all">${a(n("admin.role","Role"))}: ${a(n("common.all","All"))}</option>
          ${Object.entries(y.roles).map(([e,t])=>`<option value="${e}" ${g.users.role===e?"selected":""}>${a(t.label)}</option>`).join("")}
        </select>
        <select class="select" id="u-status" style="max-width:160px">
          <option value="all">${a(n("admin.statusLabel","Status"))}: ${a(n("common.all","All"))}</option>
          <option value="active"    ${g.users.status==="active"?"selected":""}>فعال</option>
          <option value="pending"   ${g.users.status==="pending"?"selected":""}>در انتظار تأیید</option>
          <option value="suspended" ${g.users.status==="suspended"?"selected":""}>معلق</option>
        </select>
        <div class="spacer"></div>
        <button class="btn btn--ghost btn--sm" id="u-export">${m("download")}<span>CSV</span></button>
      </div>

      <div class="table-wrap">
        <table class="table">
          <thead><tr>
            <th>کاربر</th><th>${a(n("admin.role","Role"))}</th><th>${a(n("admin.statusLabel","Status"))}</th>
            <th>${a(n("dash.playtime","Playtime"))}</th><th>مجموع خرید</th><th>تاریخ عضویت</th><th>${a(n("admin.actions","عملیات"))}</th>
          </tr></thead>
          <tbody id="u-rows"></tbody>
        </table>
      </div>
      <div class="pagination" id="u-pagination"></div>
    </div>`)}function H(){let e=dt(),t=g.users,s=Math.max(1,Math.ceil(e.length/t.per));t.page>s&&(t.page=s);let i=e.slice((t.page-1)*t.per,t.page*t.per),d=p("#u-rows");d&&(d.innerHTML=i.map(l=>{let r=y.roles[l.role]||y.roles.user,f=l.status==="active"?"badge--green":l.status==="suspended"?"badge--red":"badge--orange";return`<tr data-user="${l.id}">
      <td>
        <div class="flex gap-2 items-center">
          <span class="avatar-fallback" style="width:30px;height:30px;font-size:.72rem">${a(l.username.slice(0,2).toUpperCase())}</span>
          <div style="min-width:0">
            <div style="color:var(--c-white);font-weight:600;font-size:.84rem">${a(l.displayName)}</div>
            <div class="text-muted mono" style="font-size:.72rem">${a(l.email)}</div>
          </div>
        </div>
      </td>
      <td><span class="badge badge--grey ${r.css}">${a(r.label)}</span></td>
      <td><span class="badge ${f}">${a(E(nt,l.status))}</span></td>
      <td class="num">${ge(l.playtimeMinutes)}</td>
      <td class="num">${S(l.totalSpent)}</td>
      <td class="text-muted" style="font-size:.78rem">${a(V(l.createdAt))}</td>
      <td>
        <div class="actions">
          <button class="icon-btn" data-act="view" title="${a(n("admin.viewProfile","مشاهده پروفایل"))}">${m("eye")}</button>
          <button class="icon-btn" data-act="role" title="${a(n("admin.setRole","تغییر نقش"))}">${m("key")}</button>
          <button class="icon-btn icon-btn--danger" data-act="suspend" title="${a(n("admin.suspend","Suspend"))}">${m("ban")}</button>
        </div>
      </td>
    </tr>`}).join("")||`<tr><td colspan="7" class="text-center text-muted" style="padding:2rem">${a(n("common.noResults","No results found"))}</td></tr>`,ie(p("#u-pagination"),{page:t.page,pages:s,onChange:l=>{t.page=l,H()}}))}function kt(){p("#u-search")?.addEventListener("input",P(e=>{g.users.q=e.target.value,g.users.page=1,H()},220)),p("#u-role")?.addEventListener("change",e=>{g.users.role=e.target.value,g.users.page=1,H()}),p("#u-status")?.addEventListener("change",e=>{g.users.status=e.target.value,g.users.page=1,H()}),p("#u-export")?.addEventListener("click",()=>{K("royalrp-users.csv",dt(),["id","username","displayName","email","role","status","totalSpent","playtimeMinutes","createdAt"]),u.success("خروجی CSV گرفته شد")}),p("#u-rows")?.addEventListener("click",async e=>{let t=e.target.closest("[data-act]");if(!t)return;let s=Number(t.closest("tr").dataset.user),i=o.users.find(d=>d.id===s);if(i){if(t.dataset.act==="view")return _t(i);if(t.dataset.act==="role")return St(i);if(t.dataset.act==="suspend"){let d=i.status!=="suspended";if(!await F({title:d?n("admin.suspend","Suspend"):n("admin.unsuspend","Reinstate"),message:`${d?"Suspend":"Reinstate"} ${i.displayName}?`,danger:d}))return;if(q()){u.warn(n("admin.demoWrite","حالت نمایشی: این تغییر هیچ‌جا ذخیره نمی‌شود."));return}try{await b.admin.suspend(i.id,{suspended:d}),i.status=d?"suspended":"active",H(),u.success(n("common.saved","Saved"))}catch(r){u.error(r.message)}}}})}function _t(e){let t=y.roles[e.role]||y.roles.user;N({title:e.displayName,size:"lg",body:`
      <div class="flex gap-5 flex-wrap">
        <span class="avatar-fallback" style="width:72px;height:72px;font-size:1.6rem">${a(e.username.slice(0,2).toUpperCase())}</span>
        <div style="flex:1;min-width:220px">
          <h4>${a(e.displayName)}</h4>
          <p class="mono" style="font-size:.82rem">${a(e.email)}</p>
          <div class="flex gap-2 mt-4 flex-wrap">
            <span class="badge badge--grey ${t.css}">${a(t.label)}</span>
            <span class="badge ${e.status==="active"?"badge--green":"badge--red"}">${a(E(nt,e.status))}</span>
            ${e.vip?`<span class="badge badge--solid-gold">VIP ${a(e.vip)}</span>`:""}
          </div>
        </div>
      </div>
      <div class="char-grid mt-6">
        <div class="char-stat"><div class="char-stat__label">User ID</div><div class="char-stat__value mono">${e.id}</div></div>
        <div class="char-stat"><div class="char-stat__label">Discord</div><div class="char-stat__value mono" style="font-size:.78rem">${a(e.discordId)}</div></div>
        <div class="char-stat"><div class="char-stat__label">Orders</div><div class="char-stat__value">${e.orders}</div></div>
        <div class="char-stat"><div class="char-stat__label">مجموع خرید</div><div class="char-stat__value bank">${S(e.totalSpent)}</div></div>
        <div class="char-stat"><div class="char-stat__label">${a(n("dash.playtime","Playtime"))}</div><div class="char-stat__value">${ge(e.playtimeMinutes)}</div></div>
        <div class="char-stat"><div class="char-stat__label">${a(n("dash.lastSeen","Last seen"))}</div><div class="char-stat__value" style="font-size:.86rem">${a(Y(e.lastSeen))}</div></div>
      </div>
      <div class="mt-6">
        <div class="label mb-4">شناسه VMP</div>
        <pre><code>${a(e.gameLicense)}</code></pre>
      </div>`,footer:`<button class="btn btn--dark" data-x>${a(n("common.close","Close"))}</button>`}).el.querySelector("[data-x]").addEventListener("click",function(){this.closest(".modal").querySelector(".modal__close").click()})}function St(e){let t=N({title:n("admin.setRole","تغییر نقش"),body:`
      <p class="mb-4">${a(e.displayName)}</p>
      <div class="field">
        <label for="role-pick">${a(n("admin.role","Role"))}</label>
        <select class="select" id="role-pick">
          ${Object.entries(y.roles).map(([s,i])=>`<option value="${s}" ${e.role===s?"selected":""}>${a(i.label)}</option>`).join("")}
        </select>
      </div>
      <div class="demo-banner" style="margin-top:1rem">
        ${m("shield")}
        <span>Role changes are re-validated server-side. A client cannot grant itself a role it does not have.</span>
      </div>`,footer:`
      <button class="btn btn--dark" data-cancel>${a(n("common.cancel","Cancel"))}</button>
      <button class="btn btn--gold" data-save>${a(n("common.save","Save"))}</button>`});t.el.querySelector("[data-cancel]").addEventListener("click",t.close),t.el.querySelector("[data-save]").addEventListener("click",async()=>{let s=t.el.querySelector("#role-pick").value;if(q()){u.warn(n("admin.demoWrite","حالت نمایشی: این تغییر هیچ‌جا ذخیره نمی‌شود.")),t.close();return}try{await b.admin.setRole(e.id,s),e.role=s,H(),u.success(n("common.saved","Saved"))}catch(i){u.error(i.message)}t.close()})}var Lt=[["مشاهده پنل مدیریت",["shop_manager","support","moderator","admin","head_admin","developer","owner"]],["خواندن لاگ‌ها",["moderator","admin","head_admin","developer","owner"]],["خواندن لاگ‌های امنیتی",["head_admin","developer","owner"]],["پاسخ به تیکت‌ها",["support","moderator","admin","head_admin","owner"]],["اخراج یا اخطار به بازیکنان",["moderator","admin","head_admin","owner"]],["مسدود کردن بازیکنان",["admin","head_admin","owner"]],["رفع مسدودیت",["head_admin","owner"]],["ویرایش محصولات و قیمت‌ها",["shop_manager","head_admin","owner"]],["صدور بازپرداخت",["shop_manager","head_admin","owner"]],["انتشار اخبار",["moderator","admin","head_admin","owner"]],["ویرایش محتوای سایت",["admin","head_admin","owner"]],["تغییر نقش کاربران",["head_admin","owner"]],["ویرایش اتصالات و کلیدها",["developer","owner"]],["تغییر تنظیمات سایت",["head_admin","owner"]]];function qt(){let e=["user","shop_manager","support","moderator","admin","head_admin","developer","owner"];return C("roles",n("admin.roles","نقش‌ها و دسترسی‌ها"),n("admin.permissionMatrix",""),`
    <div class="card">
      <div class="demo-banner" style="background:linear-gradient(90deg,rgba(74,168,255,.12),transparent);border-color:rgba(74,168,255,.35);border-inline-start-color:#4aa8ff;color:#a8d3ff">
        ${m("shield")}
        <span><strong>کنترل دسترسی روی سرور اعمال می‌شود.</strong> این جدول بازتاب
        <code>backend/config/roles.js</code> است. مرورگر فقط تصمیم می‌گیرد چه چیزی نمایش داده شود؛
        هر درخواست پیش از اجرا، نقش کاربر را دوباره روی سرور بررسی می‌کند.</span>
      </div>

      <div class="matrix-wrap mt-4">
        <table class="matrix">
          <thead><tr>
            <th style="text-align:start">دسترسی</th>
            ${e.map(t=>`<th>${a(y.roles[t].label)}</th>`).join("")}
          </tr></thead>
          <tbody>
            ${Lt.map(([t,s])=>`
              <tr>
                <th>${a(t)}</th>
                ${e.map(i=>`<td class="${s.includes(i)?"yes":"no"}">${s.includes(i)?"&check;":"&minus;"}</td>`).join("")}
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>`)}function Et(){return C("products",n("admin.products","Products"),"",`
    <div class="card">
      <div class="tbl-toolbar">
        <div class="searchbox">${m("search")}
          <input class="input" id="p-search" placeholder="${a(n("shop.searchPlaceholder","جستجو..."))}">
        </div>
        <select class="select" id="p-cat" style="max-width:190px">
          <option value="all">${a(n("shop.categories","دسته‌بندی‌ها"))}</option>
          ${w.CATEGORIES.map(e=>`<option value="${e.id}">${a(Ie(e,"name"))}</option>`).join("")}
        </select>
        <div class="spacer"></div>
        <button class="btn btn--gold btn--sm" id="p-add">${m("plus")}<span>${a(n("admin.addProduct","افزودن محصول"))}</span></button>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead><tr>
            <th>محصول</th><th>${a(n("shop.categories","دسته"))}</th><th>${a(n("shop.price","Price"))}</th>
            <th>موجودی</th><th>برچسب‌ها</th><th>${a(n("admin.actions","عملیات"))}</th>
          </tr></thead>
          <tbody id="p-rows"></tbody>
        </table>
      </div>
    </div>`,`<button class="btn btn--ghost btn--sm" id="p-export">${m("download")}<span>CSV</span></button>`)}function G(){let e=p("#p-rows");if(!e)return;let t=g.products.q.toLowerCase(),s=o.products.filter(i=>!(g.products.category!=="all"&&i.category!==g.products.category||t&&!`${i.name} ${i.slug} ${i.category}`.toLowerCase().includes(t)));e.innerHTML=s.map(i=>`
    <tr data-product="${a(i.id)}">
      <td>
        <div class="flex gap-2 items-center">
          <img src="${D(i.image)}" alt="" width="46" height="32" loading="lazy"
               style="width:46px;height:32px;object-fit:cover;border-radius:4px;border:1px solid var(--c-grey-800)">
          <div style="min-width:0">
            <div style="color:var(--c-white);font-weight:600;font-size:.84rem">${a(i.nameFa||i.name)}</div>
            <div class="text-muted mono" style="font-size:.7rem">${a(i.slug)}</div>
          </div>
        </div>
      </td>
      <td><span class="badge badge--grey">${a($t(i.category))}</span></td>
      <td class="num">${S(i.price)}</td>
      <td class="num">${i.stock===null||i.stock===void 0?"&infin;":i.stock}</td>
      <td>
        ${i.featured?'<span class="badge badge--gold">ویژه</span> ':""}
        ${i.popular?'<span class="badge badge--green">محبوب</span> ':""}
        ${i.badge?`<span class="badge badge--orange">${a(i.badge)}</span>`:""}
      </td>
      <td>
        <div class="actions">
          <button class="icon-btn" data-act="edit" title="${a(n("common.edit","Edit"))}">${m("edit")}</button>
          <button class="icon-btn icon-btn--danger" data-act="del" title="${a(n("common.delete","Delete"))}">${m("trash")}</button>
        </div>
      </td>
    </tr>`).join("")||`<tr><td colspan="6" class="text-center text-muted" style="padding:2rem">${a(n("common.noResults","No results"))}</td></tr>`}var rt={manual:{label:"دستی (توسط تیم)",fields:[]},vip:{label:"اشتراک VIP",fields:[{k:"tier",l:"سطح",type:"select",opts:["bronze","silver","gold","platinum","queue"]},{k:"days",l:"مدت (روز)",type:"number",def:30},{k:"stipend",l:"حقوق ماهانه (تومان بازی)",type:"number",def:0}]},money:{label:"پول درون‌بازی",fields:[{k:"amount",l:"مبلغ (تومان بازی)",type:"number",def:5e5},{k:"account",l:"حساب",type:"select",opts:["bank","cash","black_money"]}]},coin:{label:"کوین سرور",fields:[{k:"amount",l:"تعداد کوین",type:"number",def:100}]},vehicle:{label:"خودرو",fields:[{k:"model",l:"نام مدل (spawn name)",type:"text",def:""},{k:"tuning",l:"تیونینگ",type:"select",opts:["none","full"]}]},item:{label:"آیتم اینونتوری",fields:[{k:"item",l:"نام آیتم",type:"gameitem",def:""},{k:"count",l:"تعداد",type:"number",def:1}]},slot:{label:"اسلات شخصیت",fields:[{k:"count",l:"تعداد اسلات",type:"number",def:1}]},role:{label:"نقش دیسکورد",fields:[{k:"role",l:"نام نقش",type:"text",def:"supporter"}]}};function tt(e,t={}){let s=rt[e];return!s||!s.fields.length?`<p class="text-muted" style="font-size:.82rem;margin:0">
      این نوع تحویل نیاز به تنظیمات ندارد؛ پس از پرداخت، سفارش برای انجام دستی به تیم ارجاع می‌شود.
    </p>`:`<div class="form-grid">${s.fields.map(i=>{let d=t[i.k]??i.def??"";if(i.type==="select")return`<div class="field">
        <label for="dp-${i.k}">${a(i.l)}</label>
        <select class="select" id="dp-${i.k}" data-dp="${i.k}">
          ${i.opts.map(l=>`<option value="${l}" ${String(d)===l?"selected":""}>${l}</option>`).join("")}
        </select></div>`;if(i.type==="gameitem"){let l=o.game?.items||[];return`<div class="field">
        <label for="dp-${i.k}">${a(i.l)}
          ${l.length?`<span class="text-muted" style="font-weight:400">(${x(l.length)} آیتم واقعی سرور)</span>`:'<span class="text-muted" style="font-weight:400">— لیست آیتم‌ها وارد نشده، دستی بنویسید</span>'}
        </label>
        <input class="input mono" id="dp-${i.k}" data-dp="${i.k}" dir="ltr" autocomplete="off"
               list="dl-gameitems" value="${a(String(d))}" placeholder="water">
        <datalist id="dl-gameitems">
          ${l.slice(0,600).map(r=>`<option value="${a(r.name)}">${a(r.label||r.name)}</option>`).join("")}
        </datalist>
        <span class="field__hint">نام فنی آیتم را انتخاب کنید؛ تحویل با همین نام انجام می‌شود.</span>
      </div>`}return`<div class="field">
      <label for="dp-${i.k}">${a(i.l)}</label>
      <input class="input${i.type==="number"?" mono":""}" id="dp-${i.k}" data-dp="${i.k}"
             type="${i.type==="number"?"number":"text"}" value="${a(String(d))}" ${i.type==="text"?'dir="ltr"':""}>
    </div>`}).join("")}</div>`}function at(e=null){let t=!e,s=e?.deliveryPayload||{},i=e?.deliveryType||"manual",d=N({title:t?"افزودن محصول":`ویرایش: ${e.nameFa||e.name}`,size:"lg",body:`
      <div class="tabs" data-tabs data-tabs-scope="#pm-panels">
        <button class="tab is-active" data-tab="pm-basic">${m("box")}<span>مشخصات</span></button>
        <button class="tab" data-tab="pm-media">${m("gallery")}<span>تصویر</span></button>
        <button class="tab" data-tab="pm-delivery">${m("package")}<span>تحویل</span></button>
      </div>

      <form id="prod-form">
        <div id="pm-panels">

          <!-- ===== basics ===== -->
          <div class="tab-panel is-active" data-panel="pm-basic">
            <div class="form-grid">
              <div class="field field--full">
                <label for="pf-name">نام محصول <span class="req">*</span></label>
                <input class="input" id="pf-name" name="nameFa" value="${a(e?.nameFa||e?.name||"")}">
              </div>
              <div class="field">
                <label for="pf-slug">شناسه یکتا (انگلیسی) <span class="req">*</span></label>
                <input class="input mono" id="pf-slug" name="slug" dir="ltr" value="${a(e?.slug||"")}"
                       placeholder="vip-gold" ${e?"readonly":""}>
                <span class="field__hint">${e?"پس از ساخت قابل تغییر نیست":"فقط حروف کوچک انگلیسی و خط تیره"}</span>
              </div>
              <div class="field">
                <label for="pf-cat">دسته‌بندی</label>
                <select class="select" id="pf-cat" name="category">
                  ${w.CATEGORIES.map(f=>`<option value="${f.id}" ${e?.category===f.id?"selected":""}>${a(f.nameFa||f.name)}</option>`).join("")}
                </select>
              </div>

              <div class="field">
                <label for="pf-price">قیمت (تومان) <span class="req">*</span></label>
                <input class="input mono" id="pf-price" name="price" inputmode="numeric" dir="ltr"
                       value="${e?.price??""}">
                <span class="field__hint" id="pf-price-hint"></span>
              </div>
              <div class="field">
                <label for="pf-old">قیمت قبل از تخفیف (تومان)</label>
                <input class="input mono" id="pf-old" name="oldPrice" inputmode="numeric" dir="ltr"
                       value="${e?.oldPrice??""}">
                <span class="field__hint" id="pf-old-hint"></span>
              </div>

              <div class="field">
                <label for="pf-stock">موجودی <span class="text-muted">(خالی = نامحدود)</span></label>
                <input class="input mono" id="pf-stock" name="stock" type="number" min="0" dir="ltr"
                       value="${e?.stock??""}">
              </div>
              <div class="field">
                <label for="pf-max">حداکثر در هر سفارش</label>
                <input class="input mono" id="pf-max" name="maxPerOrder" type="number" min="1" dir="ltr"
                       value="${e?.maxPerOrder??5}">
              </div>
              <div class="field">
                <label for="pf-duration">مدت اعتبار</label>
                <input class="input" id="pf-duration" name="duration" value="${a(e?.duration||"")}" placeholder="۳۰ روز">
              </div>
              <div class="field">
                <label for="pf-badge">برچسب</label>
                <input class="input" id="pf-badge" name="badge" value="${a(e?.badge||"")}" placeholder="محبوب">
              </div>

              <div class="field field--full">
                <label for="pf-short">توضیح کوتاه</label>
                <textarea class="textarea" id="pf-short" name="shortFa" style="min-height:80px">${a(e?.shortFa||e?.short||"")}</textarea>
              </div>
              <div class="field field--full">
                <label for="pf-features">ویژگی‌ها <span class="text-muted">(هر خط یک مورد)</span></label>
                <textarea class="textarea" id="pf-features" name="features" style="min-height:110px">${a((e?.features||[]).join(`
`))}</textarea>
              </div>

              <div class="field">
                <label class="switch"><input type="checkbox" name="featured" ${e?.featured?"checked":""}>
                  <span class="switch__track"></span><span>ویژه (نمایش در صفحه نخست)</span></label>
              </div>
              <div class="field">
                <label class="switch"><input type="checkbox" name="popular" ${e?.popular?"checked":""}>
                  <span class="switch__track"></span><span>محبوب</span></label>
              </div>
              <div class="field">
                <label class="switch"><input type="checkbox" name="visible" ${e?.visible!==!1?"checked":""}>
                  <span class="switch__track"></span><span>نمایش در فروشگاه</span></label>
              </div>
            </div>
          </div>

          <!-- ===== media ===== -->
          <div class="tab-panel" data-panel="pm-media">
            <div class="flex gap-5 flex-wrap items-center">
              <div class="media-preview media-preview--wide" id="pf-preview" style="width:220px;height:140px"></div>
              <div style="flex:1;min-width:230px">
                <div class="field">
                  <label for="pf-image">مسیر تصویر</label>
                  <input class="input mono" id="pf-image" name="image" dir="ltr" style="font-size:.78rem"
                         value="${a(e?.image||"assets/images/products/placeholder.svg")}">
                </div>
                <button class="btn btn--gold btn--sm" type="button" id="pf-pick">
                  ${m("gallery")}<span>انتخاب از کتابخانه</span>
                </button>
              </div>
            </div>
            <p class="text-muted mt-6" style="font-size:.8rem">
              می‌توانید از تصاویر آماده پروژه انتخاب کنید یا تصویر جدیدی آپلود کنید.
              اندازه پیشنهادی ۸۰۰×۵۰۰ پیکسل.
            </p>
          </div>

          <!-- ===== delivery ===== -->
          <div class="tab-panel" data-panel="pm-delivery">
            <div class="demo-banner" style="background:linear-gradient(90deg,rgba(74,168,255,.12),transparent);border-color:rgba(74,168,255,.35);border-inline-start-color:#4aa8ff;color:#a8d3ff">
              ${m("shield")}
              <span>تحویل فقط پس از تایید امضای وب‌هوک درگاه انجام می‌شود. این تنظیمات تعیین می‌کند
                بک‌اند دقیقاً چه چیزی به بازیکن بدهد.</span>
            </div>

            <div class="field">
              <label for="pf-dtype">نوع تحویل</label>
              <select class="select" id="pf-dtype" name="deliveryType">
                ${Object.entries(rt).map(([f,v])=>`<option value="${f}" ${i===f?"selected":""}>${a(v.label)}</option>`).join("")}
              </select>
            </div>

            <div class="card card--flat card--pad-sm" id="pf-dfields">${tt(i,s)}</div>

            <div class="field mt-6">
              <label for="pf-dnote">یادداشت تحویل (برای مشتری)</label>
              <textarea class="textarea" id="pf-dnote" name="deliveryNote" style="min-height:70px">${a(e?.deliveryNote||"")}</textarea>
            </div>
          </div>

        </div>
      </form>`,footer:`<button class="btn btn--dark" data-cancel>انصراف</button>
             <button class="btn btn--gold" data-save>ذخیره</button>`});he(d.el),X(d.el,{inputId:"pf-image",previewId:"pf-preview",buttonId:"pf-pick"});let l=(f,v)=>{let k=d.el.querySelector("#"+f),h=d.el.querySelector("#"+v),$=()=>{let _=se(k.value);h.textContent=_>0?S(_):""};k.addEventListener("input",$),$()};l("pf-price","pf-price-hint"),l("pf-old","pf-old-hint");let r=d.el.querySelector("#pf-dtype");r.addEventListener("change",()=>{d.el.querySelector("#pf-dfields").innerHTML=tt(r.value,{})}),d.el.querySelector("[data-cancel]").addEventListener("click",d.close),d.el.querySelector("[data-save]").addEventListener("click",async()=>{let f=d.el.querySelector("#prod-form"),v=Object.fromEntries(new FormData(f).entries()),k={};d.el.querySelectorAll("[data-dp]").forEach(T=>{let Ce=T.value.trim();k[T.dataset.dp]=T.type==="number"?Number(Ce)||0:Ce});let h=(v.nameFa||"").trim(),$=(v.slug||"").trim().toLowerCase();if(!h){u.error("نام محصول الزامی است");return}if(!/^[a-z0-9-]{2,80}$/.test($)){u.error("شناسه یکتا باید انگلیسی و با خط تیره باشد");return}let _=se(v.price);if(_<0){u.error("قیمت نامعتبر است");return}let j={name:h,nameFa:h,slug:$,category:v.category,price:_,oldPrice:v.oldPrice?se(v.oldPrice):null,stock:v.stock===""?null:Number(v.stock),maxPerOrder:Number(v.maxPerOrder)||5,duration:(v.duration||"").trim()||null,badge:(v.badge||"").trim()||null,short:(v.shortFa||"").trim()||null,shortFa:(v.shortFa||"").trim()||null,features:String(v.features||"").split(`
`).map(T=>T.trim()).filter(Boolean),image:(v.image||"").trim()||"assets/images/products/placeholder.svg",featured:!!v.featured,popular:!!v.popular,visible:!!v.visible,deliveryType:v.deliveryType,deliveryPayload:Object.keys(k).length?k:null,deliveryNote:(v.deliveryNote||"").trim()||null};if(q()){e?Object.assign(e,j):o.products.unshift({id:$,gallery:[],...j}),G(),u.warn(n("admin.demoWrite","حالت نمایشی: این تغییر هیچ‌جا ذخیره نمی‌شود.")),d.close();return}let W=d.el.querySelector("[data-save]"),te=ae(W);try{e?await b.admin.updateProduct(e.id,j):await b.admin.createProduct(j),u.success("ذخیره شد"),await Ee(),G(),d.close()}catch(T){te(),u.error(T.message)}})}function Ct(){p("#p-search")?.addEventListener("input",P(e=>{g.products.q=e.target.value,G()},200)),p("#p-cat")?.addEventListener("change",e=>{g.products.category=e.target.value,G()}),p("#p-add")?.addEventListener("click",()=>at(null)),p("#p-export")?.addEventListener("click",()=>{K("royalrp-products.csv",o.products,["id","slug","name","category","price","stock","featured"]),u.success("خروجی CSV گرفته شد")}),p("#p-rows")?.addEventListener("click",async e=>{let t=e.target.closest("[data-act]");if(!t)return;let s=t.closest("tr").dataset.product,i=o.products.find(d=>d.id===s);if(i){if(t.dataset.act==="edit")return at(i);if(t.dataset.act==="del"){if(!await F({title:n("common.delete","Delete"),message:`Delete "${i.name}"?`,danger:!0}))return;if(q()){o.products=o.products.filter(l=>l.id!==s),G(),u.warn(n("admin.demoWrite","حالت نمایشی: این تغییر هیچ‌جا ذخیره نمی‌شود."));return}try{await b.admin.deleteProduct(s),o.products=o.products.filter(l=>l.id!==s),G(),u.success("حذف شد")}catch(l){u.error(l.message)}}}})}function Tt(){return C("orders",n("admin.orders","Orders"),"",`
    <div class="card">
      <div class="tbl-toolbar">
        <div class="searchbox">${m("search")}
          <input class="input" id="o-search" placeholder="${a(n("admin.searchOrders","جستجو در سفارش‌ها"))}">
        </div>
        <select class="select" id="o-status" style="max-width:170px">
          <option value="all">${a(n("admin.statusLabel","Status"))}</option>
          <option value="delivered">تحویل‌شده</option><option value="paid">پرداخت‌شده</option>
          <option value="pending">در انتظار پرداخت</option><option value="failed">ناموفق</option>
          <option value="refunded">بازپرداخت‌شده</option><option value="cancelled">لغو‌شده</option>
        </select>
        <div class="spacer"></div>
        <button class="btn btn--ghost btn--sm" id="o-export">${m("download")}<span>CSV</span></button>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead><tr>
            <th>سفارش</th><th>مشتری</th><th>اقلام</th><th>${a(n("cart.total","Total"))}</th>
            <th>روش</th><th>${a(n("admin.statusLabel","Status"))}</th><th>تاریخ</th><th>${a(n("admin.actions","عملیات"))}</th>
          </tr></thead>
          <tbody id="o-rows"></tbody>
        </table>
      </div>
      <div class="pagination" id="o-pagination"></div>
    </div>`)}function ot(){let e=g.orders,t=e.q.toLowerCase();return o.orders.filter(s=>!(e.status!=="all"&&s.status!==e.status||t&&!`${s.id} ${s.user} ${s.email}`.toLowerCase().includes(t)))}function ee(){let e=ot(),t=g.orders,s=Math.max(1,Math.ceil(e.length/t.per));t.page>s&&(t.page=s);let i=e.slice((t.page-1)*t.per,t.page*t.per),d=p("#o-rows");d&&(d.innerHTML=i.map(l=>`
    <tr data-order="${a(l.id)}">
      <td class="mono" style="font-size:.78rem">${a(l.id)}</td>
      <td>
        <div style="color:var(--c-white);font-size:.84rem">${a(l.user)}</div>
        <div class="text-muted mono" style="font-size:.7rem">${a(l.email)}</div>
      </td>
      <td style="font-size:.8rem">${a(l.items.map(r=>`${r.name} x${r.qty}`).join(", "))}</td>
      <td class="num">${S(l.total)}</td>
      <td style="font-size:.8rem">${a(E(ht,l.method))}</td>
      <td><span class="order-status order-status--${a(l.status)}">${a(E(lt,l.status))}</span></td>
      <td class="text-muted" style="font-size:.76rem">${a(V(l.date,!0))}</td>
      <td>
        <div class="actions">
          <button class="icon-btn" data-act="redeliver" title="${a(n("admin.redeliver","Re-deliver"))}">${m("refresh")}</button>
          <button class="icon-btn icon-btn--danger" data-act="refund" title="${a(n("admin.refund","Refund"))}">${m("money")}</button>
        </div>
      </td>
    </tr>`).join("")||`<tr><td colspan="8" class="text-center text-muted" style="padding:2rem">${a(n("common.noResults","No results"))}</td></tr>`,ie(p("#o-pagination"),{page:t.page,pages:s,onChange:l=>{t.page=l,ee()}}))}function Ot(){p("#o-search")?.addEventListener("input",P(e=>{g.orders.q=e.target.value,g.orders.page=1,ee()},220)),p("#o-status")?.addEventListener("change",e=>{g.orders.status=e.target.value,g.orders.page=1,ee()}),p("#o-export")?.addEventListener("click",()=>{K("royalrp-orders.csv",ot().map(e=>({id:e.id,date:e.date,user:e.user,email:e.email,total:e.total,method:e.method,status:e.status}))),u.success("خروجی CSV گرفته شد")}),p("#o-rows")?.addEventListener("click",async e=>{let t=e.target.closest("[data-act]");if(!t)return;let s=t.closest("tr").dataset.order,i=o.orders.find(d=>d.id===s);if(i){if(t.dataset.act==="refund"){if(!await F({title:n("admin.refund","Refund"),message:`Refund ${S(i.total)} to ${i.user}? This cannot be undone and is written to the audit log.`,danger:!0,confirmText:n("admin.refund","Refund")}))return;if(q()){u.warn(n("admin.demoWrite",""));return}try{await b.admin.refund(i.id,{reason:"admin_panel"}),i.status="refunded",ee(),u.success("بازپرداخت شد")}catch(l){u.error(l.message)}}if(t.dataset.act==="redeliver"){if(q()){u.warn(n("admin.demoWrite",""));return}try{await b.admin.redeliver(i.id),u.success("تحویل مجدد در صف قرار گرفت")}catch(d){u.error(d.message)}}}})}function At(){return C("coupons",n("admin.coupons","Coupons"),"",`
    <div class="card">
      <div class="tbl-toolbar">
        <div class="spacer"></div>
        <button class="btn btn--gold btn--sm" id="c-add">${m("plus")}<span>${a(n("admin.addCoupon","افزودن کد تخفیف"))}</span></button>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>کد</th><th>نوع</th><th>مقدار</th><th>حداقل خرید</th><th>انقضا</th><th>${a(n("admin.actions","عملیات"))}</th></tr></thead>
          <tbody id="c-rows"></tbody>
        </table>
      </div>
    </div>`)}function oe(){let e=p("#c-rows");e&&(e.innerHTML=o.coupons.map(t=>`
    <tr data-coupon="${a(t.code)}">
      <td class="mono text-gold">${a(t.code)}</td>
      <td><span class="badge badge--grey">${a(E(gt,t.type))}</span></td>
      <td class="num">${t.type==="percent"?x(t.value)+"٪":S(t.value)}</td>
      <td class="num">${t.minSpend?S(t.minSpend):"—"}</td>
      <td class="text-muted" style="font-size:.8rem">${a(V(t.expires))}</td>
      <td><div class="actions">
        <button class="icon-btn icon-btn--danger" data-act="del">${m("trash")}</button>
      </div></td>
    </tr>`).join("")||'<tr><td colspan="6" class="text-center text-muted" style="padding:2rem">کد تخفیفی ثبت نشده</td></tr>')}function Nt(){p("#c-add")?.addEventListener("click",()=>{let e=N({title:n("admin.addCoupon","افزودن کد تخفیف"),body:`
        <form id="coupon-form" class="form-grid">
          <div class="field"><label for="cf-code">کد</label>
            <input class="input mono" id="cf-code" name="code" placeholder="ROYAL10" style="text-transform:uppercase"></div>
          <div class="field"><label for="cf-type">نوع</label>
            <select class="select" id="cf-type" name="type"><option value="percent">Percent</option><option value="fixed">Fixed amount</option></select></div>
          <div class="field"><label for="cf-value">مقدار</label>
            <input class="input" id="cf-value" name="value" type="number" min="0" step="0.01"></div>
          <div class="field"><label for="cf-min">Minimum spend</label>
            <input class="input" id="cf-min" name="minSpend" type="number" min="0" step="0.01" value="0"></div>
          <div class="field field--full"><label for="cf-exp">انقضا</label>
            <input class="input" id="cf-exp" name="expires" type="date"></div>
        </form>`,footer:`<button class="btn btn--dark" data-cancel>${a(n("common.cancel","Cancel"))}</button>
               <button class="btn btn--gold" data-save>${a(n("common.save","Save"))}</button>`});e.el.querySelector("[data-cancel]").addEventListener("click",e.close),e.el.querySelector("[data-save]").addEventListener("click",async()=>{let t=Object.fromEntries(new FormData(e.el.querySelector("#coupon-form")).entries()),s={code:String(t.code||"").toUpperCase(),type:t.type,value:Number(t.value)||0,minSpend:Number(t.minSpend)||0,maxDiscount:null,expires:t.expires||"2026-12-31",label:`${t.type==="percent"?t.value+"% off":S(Number(t.value))}`};if(!s.code){u.error("وارد کردن کد الزامی است");return}if(q()){o.coupons.push(s),oe(),u.warn(n("admin.demoWrite","")),e.close();return}try{await b.admin.createCoupon(s),o.coupons.push(s),oe(),u.success("Saved")}catch(i){u.error(i.message)}e.close()})}),p("#c-rows")?.addEventListener("click",async e=>{let t=e.target.closest('[data-act="del"]');if(!t)return;let s=t.closest("tr").dataset.coupon;if(await F({title:"حذف کد تخفیف",message:`Delete ${s}?`,danger:!0}))if(o.coupons=o.coupons.filter(d=>d.code!==s),oe(),q())u.warn(n("admin.demoWrite",""));else try{await b.admin.deleteCoupon(s),u.success("حذف شد")}catch(d){u.error(d.message)}})}function Rt(){return C("tickets",n("admin.tickets","Tickets"),"",`
    <div class="card">
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>ID</th><th>${a(n("support.subject","Subject"))}</th><th>${a(n("support.category","دسته"))}</th>
            <th>${a(n("support.priority","Priority"))}</th><th>${a(n("admin.statusLabel","Status"))}</th>
            <th>${a(n("support.assignedTo","ارجاع‌شده"))}</th><th>${a(n("support.updated","Updated"))}</th></tr></thead>
          <tbody>
            ${o.tickets.map(e=>`
              <tr>
                <td class="mono">${a(e.id)}</td>
                <td><a href="${be("support.html")}?ticket=${encodeURIComponent(e.id)}">${a(e.subject)}</a></td>
                <td><span class="badge badge--grey">${a(e.category)}</span></td>
                <td><span class="badge ${e.priority==="urgent"?"badge--red":e.priority==="high"?"badge--orange":"badge--grey"}">${a(e.priority)}</span></td>
                <td><span class="badge ${e.status==="closed"?"badge--grey":e.status==="answered"?"badge--green":"badge--orange"}">${a(e.status)}</span></td>
                <td>${a(e.assignee||n("support.unassigned","ارجاع نشده"))}</td>
                <td class="text-muted" style="font-size:.78rem">${a(Y(e.updated))}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>`)}function Ft(){return C("news",n("admin.news","News"),"",`
    <div class="card">
      <div class="tbl-toolbar">
        <div class="spacer"></div>
        <button class="btn btn--gold btn--sm" id="n-add">${m("plus")}<span>${a(n("admin.writeNews","نوشتن مقاله"))}</span></button>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>عنوان</th><th>دسته</th><th>نویسنده</th><th>تاریخ</th><th>${a(n("admin.actions","عملیات"))}</th></tr></thead>
          <tbody id="n-rows">
            ${o.news.map(e=>`
              <tr data-news="${e.id}">
                <td>
                  <div style="color:var(--c-white);font-size:.86rem">${a(e.titleFa||e.title)}</div>
                  <div class="text-muted mono" style="font-size:.7rem">${a(e.slug)}</div>
                </td>
                <td><span class="badge badge--grey">${a(e.category)}</span></td>
                <td style="font-size:.82rem">${a(e.author)}</td>
                <td class="text-muted" style="font-size:.78rem">${a(V(e.date))}</td>
                <td><div class="actions">
                  <button class="icon-btn" data-act="edit">${m("edit")}</button>
                  <button class="icon-btn icon-btn--danger" data-act="del">${m("trash")}</button>
                </div></td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>`)}function st(e=null){let t=N({title:e?"ویرایش مقاله":n("admin.writeNews","نوشتن مقاله"),size:"lg",body:`
      <form id="news-form" class="form-grid">
        <div class="field field--full"><label for="nf-title">عنوان</label>
          <input class="input" id="nf-title" name="title" value="${a(e?.title||"")}"></div>
        <div class="field"><label for="nf-slug">اسلاگ</label>
          <input class="input mono" id="nf-slug" name="slug" value="${a(e?.slug||"")}"></div>
        <div class="field"><label for="nf-cat">دسته</label>
          <select class="select" id="nf-cat" name="category">
            ${["update","announcement","event","security","maintenance"].map(i=>`<option value="${i}" ${e?.category===i?"selected":""}>${i}</option>`).join("")}
          </select></div>
        <div class="field field--full"><label for="nf-excerpt">خلاصه</label>
          <textarea class="textarea" id="nf-excerpt" name="excerpt" style="min-height:80px">${a(e?.excerpt||"")}</textarea></div>

        <div class="field field--full">
          <label>متن</label>
          <div class="rte">
            <div class="rte__bar">
              <button type="button" data-cmd="bold"><b>B</b></button>
              <button type="button" data-cmd="italic"><i>I</i></button>
              <button type="button" data-cmd="underline"><u>U</u></button>
              <span class="sep"></span>
              <button type="button" data-cmd="formatBlock" data-val="h2">H2</button>
              <button type="button" data-cmd="formatBlock" data-val="h3">H3</button>
              <button type="button" data-cmd="formatBlock" data-val="p">P</button>
              <span class="sep"></span>
              <button type="button" data-cmd="insertUnorderedList">&bull;</button>
              <button type="button" data-cmd="insertOrderedList">1.</button>
              <span class="sep"></span>
              <button type="button" data-cmd="createLink">${m("link")}</button>
              <button type="button" data-cmd="removeFormat">${m("close")}</button>
            </div>
            <div class="rte__area" id="nf-body" contenteditable="true"
                 data-placeholder="Write the article...">${e?.body||""}</div>
          </div>
        </div>
      </form>`,footer:`
      <button class="btn btn--dark" data-cancel>${a(n("common.cancel","Cancel"))}</button>
      <button class="btn btn--ghost" data-draft>ذخیره پیش‌نویس</button>
      <button class="btn btn--gold" data-publish>Publish</button>`});t.el.querySelectorAll(".rte__bar button").forEach(i=>{i.addEventListener("click",d=>{d.preventDefault();let l=i.dataset.cmd;if(l==="createLink"){let r=prompt("Link URL (https://...)");r&&/^https?:\/\//i.test(r)&&document.execCommand("createLink",!1,r);return}document.execCommand(l,!1,i.dataset.val||null),t.el.querySelector("#nf-body").focus()})});let s=i=>{let l={...Object.fromEntries(new FormData(t.el.querySelector("#news-form")).entries()),body:t.el.querySelector("#nf-body").innerHTML,published:i};if(!l.title){u.error("عنوان الزامی است");return}if(q()){e?Object.assign(e,l):o.news.unshift({id:Date.now(),date:new Date().toISOString(),author:ne.user?.username||"Staff",image:"assets/images/backgrounds/gradient-dark.svg",readMinutes:3,tags:[],...l}),M("news"),u.warn(n("admin.demoWrite","")),t.close();return}(e?b.admin.updateNews(e.id,l):b.admin.createNews(l)).then(()=>(u.success(i?"منتشر شد":"پیش‌نویس ذخیره شد"),Ee())).then(()=>M("news")).catch(r=>u.error(r.message)).finally(()=>t.close())};t.el.querySelector("[data-cancel]").addEventListener("click",t.close),t.el.querySelector("[data-draft]").addEventListener("click",()=>s(!1)),t.el.querySelector("[data-publish]").addEventListener("click",()=>s(!0))}function jt(){p("#n-add")?.addEventListener("click",()=>st(null)),p("#n-rows")?.addEventListener("click",async e=>{let t=e.target.closest("[data-act]");if(!t)return;let s=Number(t.closest("tr").dataset.news),i=o.news.find(l=>l.id===s);if(!i)return;if(t.dataset.act==="edit")return st(i);await F({title:"حذف مقاله",message:`Delete "${i.title}"?`,danger:!0})&&(o.news=o.news.filter(l=>l.id!==s),M("news"),q()?u.warn(n("admin.demoWrite","")):b.admin.deleteNews(s).then(()=>u.success("حذف شد")).catch(l=>u.error(l.message)))})}function It(){return C("content",n("admin.content","مدیریت محتوا"),"",`
    <div class="tabs" data-tabs data-tabs-scope="#content-panels">
      <button class="tab is-active" data-tab="c-staff">${m("users")}<span>تیم مدیریت</span></button>
      <button class="tab" data-tab="c-gallery">${m("gallery")}<span>گالری</span></button>
      <button class="tab" data-tab="c-faq">${m("question")}<span>سؤالات متداول</span></button>
      <button class="tab" data-tab="c-rules">${m("clipboard")}<span>قوانین سرور</span></button>
      <button class="tab" data-tab="c-home">${m("home")}<span>صفحه نخست</span></button>
      <button class="tab" data-tab="c-social">${m("link")}<span>شبکه‌های اجتماعی</span></button>
    </div>

    <div id="content-panels">
      <div class="tab-panel is-active" data-panel="c-staff"   id="c-staff-host"></div>
      <div class="tab-panel"            data-panel="c-gallery" id="c-gallery-host"></div>
      <div class="tab-panel"            data-panel="c-faq"     id="c-faq-host"></div>
      <div class="tab-panel"            data-panel="c-rules"   id="c-rules-host"></div>

      <div class="tab-panel" data-panel="c-home">
        <div class="card">
          <div class="card__head"><h4>بخش اصلی صفحه نخست</h4></div>
          <div class="field">
            <label for="ct-title">عنوان اصلی</label>
            <input class="input" id="ct-title" value="داستان شما آغاز می‌شود در رویال آر‌پی">
          </div>
          <div class="field">
            <label for="ct-sub">زیرعنوان</label>
            <textarea class="textarea" id="ct-sub" style="min-height:90px">یک شهر رول‌پلی پریمیوم روی VMP با فریم‌ورک اختصاصی.</textarea>
          </div>
          <div class="field">
            <label>تصویر پس‌زمینه</label>
            <div class="flex gap-3 items-center">
              <div class="media-preview media-preview--wide" id="ct-hero-preview"></div>
              <div style="flex:1">
                <input class="input mono" id="ct-hero" dir="ltr" style="font-size:.78rem"
                       value="assets/images/backgrounds/hero-city.svg">
                <button class="btn btn--ghost btn--sm mt-4" type="button" id="ct-hero-pick">
                  ${m("gallery")}<span>انتخاب تصویر</span>
                </button>
              </div>
            </div>
          </div>
          <button class="btn btn--gold" data-save-content>${a(n("common.save","ذخیره"))}</button>
        </div>
      </div>

      <div class="tab-panel" data-panel="c-social">
        <div class="card">
          <div class="card__head"><h4>شبکه‌های اجتماعی</h4></div>
          <div class="form-grid">
            ${Object.entries(y.social).map(([e,t])=>`
              <div class="field">
                <label for="soc-${e}">${a(e)}</label>
                <input class="input mono" id="soc-${e}" dir="ltr" value="${a(t)}" style="font-size:.78rem">
              </div>`).join("")}
          </div>
          <button class="btn btn--gold" data-save-content>${a(n("common.save","ذخیره"))}</button>
        </div>
      </div>
    </div>`)}async function ce(){let e=p("#c-staff-host");e&&(o.staff=await Ue(),e.innerHTML=He(o.staff))}async function ue(){let e=p("#c-gallery-host");e&&(o.gallery=await We(),e.innerHTML=Ve(o.gallery))}async function zt(){let e=p("#c-faq-host");e&&(o.faq=await Ye(),e.innerHTML=Je(o.faq))}async function Mt(){let e=p("#c-rules-host");e&&(o.rules=await Xe(),e.innerHTML=ke(o.rules))}function Dt(){let e=p("#content-panels");e&&(X(document,{inputId:"ct-hero",previewId:"ct-hero-preview",buttonId:"ct-hero-pick"}),e.addEventListener("click",async t=>{if(t.target.closest("[data-staff-add]"))return ye(null,ce);let s=t.target.closest("[data-staff-edit]");if(s){let h=Number(s.closest("[data-staff]").dataset.staff);return ye(o.staff.find($=>String($.id)===String(h)),ce)}let i=t.target.closest("[data-staff-del]");if(i){let h=Number(i.closest("[data-staff]").dataset.staff),$=o.staff.find(_=>String(_.id)===String(h));await Ge(h,$?.name||"")&&ce();return}if(t.target.closest("[data-gal-add]"))return we(null,ue);let d=t.target.closest("[data-gal-edit]");if(d){let h=d.closest("[data-gal]").dataset.gal;return we(o.gallery.find($=>String($.id)===String(h)),ue)}let l=t.target.closest("[data-gal-del]");if(l){let h=Number(l.closest("[data-gal]").dataset.gal);await Be(h)&&ue();return}if(t.target.closest("[data-faq-add]")){let h=p("#faq-rows");if(!h)return;let $=R(".faq-edit-row",h).length;h.insertAdjacentHTML("beforeend",xe({cat:"start",q:"",a:""},$));return}let r=t.target.closest("[data-faq-del]");if(r){r.closest(".faq-edit-row").remove();return}if(t.target.closest("[data-faq-save]")){await Qe(Ke(p("#faq-rows")));return}if(t.target.closest("[data-rule-add-section]")){o.rules=Se(p("#rules-sections")),o.rules.push({id:"section-"+(o.rules.length+1),icon:"shield",title:"",intro:"",items:[{n:"",t:"",d:"",p:""}]}),p("#c-rules-host").innerHTML=ke(o.rules);return}let f=t.target.closest("[data-rule-add-item]");if(f){f.closest(".rule-edit-section").querySelector(".rule-items").insertAdjacentHTML("beforeend",_e());return}let v=t.target.closest("[data-rule-del-item]");if(v){v.closest(".rule-edit-item").remove();return}let k=t.target.closest("[data-rule-del-section]");if(k){await F({title:"حذف بخش",message:"این بخش و همه قوانین داخل آن حذف شود؟",danger:!0,confirmText:"حذف"})&&k.closest(".rule-edit-section").remove();return}if(t.target.closest("[data-rules-save]")){let h=Se(p("#rules-sections"));await Ze(h)&&(o.rules=h);return}}))}function Pt(){let e=o.status||{};return C("server",n("admin.server","سرور"),"",`
    <div id="admin-demo-server"></div>

    <div class="monitor-grid">
      <div class="card gauge" id="gauge-cpu"></div>
      <div class="card gauge" id="gauge-mem"></div>
      <div class="card gauge" id="gauge-slots"></div>
      <div class="card">
        <div class="card__head"><h4>${a(n("status.title","وضعیت سرور"))}</h4></div>
        <div style="display:grid;gap:.6rem;font-size:.86rem">
          <div class="flex flex-between"><span class="text-muted">${a(n("status.players","Players"))}</span>
            <span class="mono text-gold">${x(e.players)} / ${x(e.maxPlayers)}</span></div>
          <div class="flex flex-between"><span class="text-muted">${a(n("status.queue","Queue"))}</span>
            <span class="mono">${x(e.queue)}</span></div>
          <div class="flex flex-between"><span class="text-muted">${a(n("status.tick","Tick"))}</span>
            <span class="mono">${Number.isFinite(Number(e.tickMs))?`${x(e.tickMs)}ms`:"در دسترس نیست"}</span></div>
          <div class="flex flex-between"><span class="text-muted">فریم‌ورک</span>
            <span class="mono">${a(e.framework||"—")}</span></div>
          <div class="flex flex-between"><span class="text-muted">${a(n("status.resources","Resources"))}</span>
            <span class="mono">${x(e.resourceCount)}</span></div>
          <div class="flex flex-between"><span class="text-muted">${a(n("status.lastRestart","Last restart"))}</span>
            <span style="font-size:.8rem">${a(Y(e.lastRestart))}</span></div>
        </div>
      </div>
    </div>

    <div class="chart-card">
      <div class="chart-card__head"><h4>${a(n("status.curve","بازیکنان در ۲۴ ساعت"))}</h4></div>
      <div class="chart-box" id="chart-server-players"></div>
    </div>

    <div class="card">
      <div class="card__head">
        <h4>${a(n("status.resourceList","Resources"))}</h4>
        <span class="text-muted" style="font-size:.8rem">${x(o.resources.length)} ریسورس</span>
      </div>
      <div style="max-height:420px;overflow-y:auto">
        ${o.resources.map(t=>`
          <div class="resource-row">
            <span class="resource-row__name">${a(t.name)}</span>
            <span class="resource-row__ms">${t.ms.toFixed(2)}ms</span>
            <span class="resource-row__state">
              <span class="badge ${t.state==="started"?"badge--green":"badge--red"}">${a(t.state)}</span>
            </span>
          </div>`).join("")}
      </div>
    </div>`)}function Ut(){let e=o.status||{},t=p("#gauge-cpu");t&&re(t,e.cpuPercent??0,{label:n("status.cpu","CPU load")});let s=p("#gauge-mem");s&&re(s,e.memoryPercent??0,{label:n("status.memory","Memory")});let i=p("#gauge-slots");i&&re(i,Math.round((e.players||0)/(e.maxPlayers||1)*100),{label:n("status.players","ظرفیت اشغال‌شده")});let d=p("#chart-server-players");d&&U(d,()=>Q(d,w.demoPlayerCurve(24),{color:"#ffd700"}));let l=p("#admin-demo-server");l&&(l.innerHTML=de("demo.status","این اعداد شبیه‌سازی شده‌اند. برای داده زنده، بک‌اند را به سرور VMP متصل کنید."))}function Ht(){return C("logs",n("admin.logs","Logs"),n("admin.readOnlyNote",""),`
    <div id="admin-demo-logs"></div>

    <div class="log-toolbar">
      <div class="searchbox">${m("search")}
        <input class="input" id="l-search" placeholder="${a(n("admin.searchLogs","جستجو در پیام لاگ‌ها"))}">
      </div>
      <select class="select" id="l-cat" style="max-width:180px">
        <option value="all">${a(n("admin.category","دسته"))}</option>
        ${w.LOG_CATEGORIES.map(e=>`<option value="${e}">${a(E(ve,e))}</option>`).join("")}
      </select>
      <select class="select" id="l-sev" style="max-width:150px">
        <option value="all">${a(n("admin.severity","شدت"))}</option>
        ${w.LOG_SEVERITIES.map(e=>`<option value="${e}">${a(E(qe,e))}</option>`).join("")}
      </select>
      <input class="input" id="l-from" type="date" style="max-width:160px" aria-label="${a(n("admin.dateFrom","From"))}">
      <input class="input" id="l-to" type="date" style="max-width:160px" aria-label="${a(n("admin.dateTo","To"))}">
      <label class="switch">
        <input type="checkbox" id="l-live">
        <span class="switch__track"></span>
        <span class="log-live"><span class="live-dot"></span>${a(n("admin.liveLogs","Live"))}</span>
      </label>
      <div class="spacer" style="margin-inline-start:auto"></div>
      <button class="btn btn--ghost btn--sm" id="l-csv">${m("download")}<span>CSV</span></button>
      <button class="btn btn--ghost btn--sm" id="l-json">${m("download")}<span>JSON</span></button>
    </div>

    <div class="log-list" id="l-list"></div>
    <div class="pagination" id="l-pagination"></div>`)}function Le(){let e=g.logs,t=e.q.toLowerCase(),s=e.from?new Date(e.from).getTime():null,i=e.to?new Date(e.to).getTime()+864e5:null;return o.logs.filter(d=>{if(e.category!=="all"&&d.category!==e.category||e.severity!=="all"&&d.severity!==e.severity)return!1;let l=new Date(d.ts).getTime();return!(s&&l<s||i&&l>i||t&&!`${d.message} ${d.actor} ${d.category} ${d.ip}`.toLowerCase().includes(t))})}function z(e=!1){let t=Le(),s=g.logs,i=Math.max(1,Math.ceil(t.length/s.per));s.page>i&&(s.page=i);let d=t.slice((s.page-1)*s.per,s.page*s.per),l=p("#l-list");l&&(l.innerHTML=d.map((r,f)=>`
    <div class="log-row ${e&&f===0&&s.page===1?"is-new":""}" data-sev="${a(r.severity)}" data-log="${a(r.id)}">
      <span class="log-row__time">${a(V(r.ts,!0))}</span>
      <span class="log-row__sev">${a(E(qe,r.severity))}</span>
      <span class="log-row__cat">${a(E(ve,r.category))}</span>
      <span class="log-row__msg">${a(r.message)}</span>
      <span class="log-row__actor">${a(r.actor||"")}</span>
    </div>`).join("")||`<div class="text-center text-muted" style="padding:2rem">${a(n("common.noResults","No results"))}</div>`,ie(p("#l-pagination"),{page:s.page,pages:i,onChange:r=>{s.page=r,z()}}))}function Gt(e){N({title:n("admin.logDetail","Log entry"),body:`
      <div class="log-detail">
        <dl>
          <dt>ID</dt><dd>${a(e.id)}</dd>
          <dt>زمان</dt><dd>${a(new Date(e.ts).toISOString())}</dd>
          <dt>دسته</dt><dd>${a(E(ve,e.category))} <span class="mono text-muted">(${a(e.category)})</span></dd>
          <dt>شدت</dt><dd>${a(E(qe,e.severity))}</dd>
          <dt>Actor</dt><dd>${a(e.actor||"—")}</dd>
          <dt>Source</dt><dd>${a(e.source)}</dd>
          <dt>IP</dt><dd>${a(e.ip)}</dd>
        </dl>
        <div>
          <div class="label mb-4">Message</div>
          <pre><code>${a(e.message)}</code></pre>
        </div>
        <div>
          <div class="label mb-4">Metadata</div>
          <pre><code>${a(JSON.stringify(e.meta,null,2))}</code></pre>
        </div>
        <p class="text-muted" style="font-size:.76rem">${a(n("admin.readOnlyNote","Logs are written server-side and cannot be edited or deleted from this panel."))}</p>
      </div>`,footer:`<button class="btn btn--dark" data-x>${a(n("common.close","Close"))}</button>`}).el.querySelector("[data-x]").addEventListener("click",function(){this.closest(".modal").querySelector(".modal__close").click()})}function fe(){clearInterval(me),me=null,pe?.close(),pe=null}function Wt(){fe(),B()?(pe=new Oe().connect().subscribe("admin:logs"),pe.on("admin:log",e=>{o.logs.unshift(e),o.logs.length>1e3&&o.logs.pop(),g.logs.page===1&&z(!0)})):me=setInterval(()=>{o.logs.unshift(w.demoLiveLog()),o.logs.length>600&&o.logs.pop(),g.logs.page===1&&z(!0)},y.flags.liveLogIntervalMs)}function Vt(){let e=p("#admin-demo-logs");e&&(e.innerHTML=de("demo.logs","These log lines are generated samples. Real logs are written server-side and are read-only from here.")),p("#l-search")?.addEventListener("input",P(t=>{g.logs.q=t.target.value,g.logs.page=1,z()},220)),p("#l-cat")?.addEventListener("change",t=>{g.logs.category=t.target.value,g.logs.page=1,z()}),p("#l-sev")?.addEventListener("change",t=>{g.logs.severity=t.target.value,g.logs.page=1,z()}),p("#l-from")?.addEventListener("change",t=>{g.logs.from=t.target.value,g.logs.page=1,z()}),p("#l-to")?.addEventListener("change",t=>{g.logs.to=t.target.value,g.logs.page=1,z()}),p("#l-live")?.addEventListener("change",t=>{g.logs.live=t.target.checked,g.logs.live?(g.logs.page=1,Wt(),u.info("پخش زنده لاگ‌ها روشن شد")):(fe(),u.info("پخش زنده لاگ‌ها خاموش شد"))}),p("#l-csv")?.addEventListener("click",()=>{K("royalrp-logs.csv",Le().map(t=>({id:t.id,ts:t.ts,severity:t.severity,category:t.category,message:t.message,actor:t.actor,ip:t.ip,source:t.source}))),u.success("خروجی CSV گرفته شد")}),p("#l-json")?.addEventListener("click",()=>{Re("royalrp-logs.json",Le()),u.success("خروجی JSON گرفته شد")}),p("#l-list")?.addEventListener("click",t=>{let s=t.target.closest("[data-log]");if(!s)return;let i=o.logs.find(d=>d.id===s.dataset.log);i&&Gt(i)})}function Bt(){let e=B(),t=o.health?.integrations||null,s=l=>t?.[l]||null,i=(l,r,f,v)=>{let k=!!f?.ok,h=f?.detail||r,$=t?k?"متصل":"تنظیم نشده":"نامشخص",_=t&&k?"badge--green":"badge--grey";return`
    <div class="conn-row">
      <span style="color:${k?"var(--c-success)":"var(--c-grey-400)"}">${m(k?"check":"close")}</span>
      <div style="flex:1;min-width:0">
        <div class="conn-row__name">${a(l)}</div>
        <div class="conn-row__detail mono">${a(h)}</div>
      </div>
      <span class="conn-row__state"><span class="badge ${_}">${$}</span></span>
    </div>
    ${v?`<p class="text-muted" style="font-size:.76rem;margin:-.25rem 0 .5rem .5rem">${a(v)}</p>`:""}`},d=o.health?.framework||o.game?.framework||null;return C("integrations",n("admin.integrations","اتصالات"),"",`
    <div class="card">
      <div class="demo-banner" style="background:linear-gradient(90deg,rgba(74,168,255,.12),transparent);border-color:rgba(74,168,255,.35);border-inline-start-color:#4aa8ff;color:#a8d3ff">
        ${m("key")}
        <span><strong>کلیدهای محرمانه هرگز به این صفحه نمی‌رسند.</strong>
        کلیدها، اطلاعات دیتابیس و رمزهای OAuth فقط در <code>backend/.env</code> ذخیره می‌شوند و تنها
        پردازه Node آن‌ها را می‌خواند. این صفحه فقط وضعیت اتصال را نشان می‌دهد، نه مقادیر را.</span>
      </div>

      ${t?"":`<p class="text-muted mt-4" style="font-size:.84rem">
        وضعیت اتصال‌ها در دسترس نیست؛ بک‌اند پاسخ نداد.</p>`}

      <div style="display:grid;gap:.6rem;margin-top:1rem">
        ${i("بک‌اند Node",y.api.base,{ok:e,detail:y.api.base},e?"":"با دستور npm run server اجرا کنید")}
        ${i("دیتابیس سایت","DB_HOST / DB_NAME در backend/.env",s("database"),"اگر تنظیم نشود، برای توسعه محلی روی SQLite کار می‌کند.")}
        ${i("دیتابیس بازی","GAME_DB_NAME در backend/.env",s("gameDb"),"فقط خوانده می‌شود؛ سایت هرگز روی دیتابیس بازی نمی‌نویسد.")}
        ${i("سرور VMP",y.server.ip,s("fivem"),"FIVEM_HOST و FIVEM_BRIDGE_TOKEN را تنظیم کنید و ریسورس royal-web-bridge را نصب کنید.")}
        ${i("ورود با دیسکورد","DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET",s("discord"),"برای ورود با دیسکورد و همگام‌سازی رول‌ها لازم است.")}
        ${i("بات دیسکورد","DISCORD_BOT_TOKEN",s("discordBot"),"برای اختصاص خودکار رول وی‌آی‌پی استفاده می‌شود.")}
        ${i("درگاه پرداخت","PAYMENT_PROVIDER در backend/.env",s("payments"),"تحویل محصول فقط پس از تأیید پرداخت توسط خودِ درگاه انجام می‌شود، نه با بازگشت مرورگر.")}
        ${i("وب‌سوکت",y.api.ws,{ok:e,detail:y.api.ws},"تعداد بازیکنان آنلاین و لاگ زنده.")}
      </div>
    </div>

    <div class="card">
      <div class="card__head"><h4>آداپتور فریم‌ورک</h4></div>
      <p class="text-muted" style="font-size:.86rem">
        بک‌اند فریم‌ورک را از روی دیتابیس زنده سرور تشخیص می‌دهد و آداپتور متناظر را بارگذاری می‌کند.
        نام جدول‌ها و ستون‌ها از روی ساختار واقعی خوانده می‌شود، نه حدس زده.
      </p>
      <div class="grid g-3 mt-4">
        ${["volta","esx","qbcore","qbox"].map(l=>{let r=d===l;return`
          <div class="card card--flat text-center${r?" is-active":""}">
            <h5>${l==="volta"?"VoltaBase":l.toUpperCase()}</h5>
            <p class="text-muted mono" style="font-size:.72rem">integrations/fivem/${l}.js</p>
            <span class="badge ${r?"badge--green":"badge--grey"} mt-4">
              ${r?"فعال":"غیرفعال"}
            </span>
          </div>`}).join("")}
      </div>
      <p class="text-muted mt-4" style="font-size:.8rem">
        ${d?`فریم‌ورک تشخیص‌داده‌شده: <strong>${a(d)}</strong>`:"فریم‌ورک هنوز تشخیص داده نشده است. اتصال دیتابیس بازی را بررسی کنید."}
      </p>
    </div>`)}function Yt(){return C("settings",n("admin.settings","تنظیمات سایت"),"",`
    <div class="grid g-2">
      <div class="card">
        <div class="card__head"><h4>عمومی</h4></div>
        <div class="field"><label for="st-name">نام سایت</label><input class="input" id="st-name" value="${a(y.site.name)}"></div>
        <div class="field"><label for="st-tag">شعار سایت</label><input class="input" id="st-tag" value="${a(y.site.tagline)}"></div>
        <div class="field"><label for="st-desc">توضیحات متا</label>
          <textarea class="textarea" id="st-desc" style="min-height:80px">${a(y.site.description)}</textarea></div>
        <button class="btn btn--gold" data-save-settings>${a(n("common.save","Save"))}</button>
      </div>

      <div class="card">
        <div class="card__head"><h4>سرور</h4></div>
        <div class="field"><label for="st-ip">آدرس عمومی</label><input class="input mono" id="st-ip" value="${a(y.server.ip)}"></div>
        <div class="field"><label for="st-cfx">لینک اتصال cfx.re</label><input class="input mono" id="st-cfx" value="${a(y.server.cfxJoin)}"></div>
        <div class="field"><label for="st-slots">حداکثر بازیکن</label><input class="input" id="st-slots" type="number" value="${y.server.maxPlayers}"></div>
        <button class="btn btn--gold" data-save-settings>${a(n("common.save","Save"))}</button>
      </div>

      <div class="card">
        <div class="card__head"><h4>فروشگاه</h4></div>
        <div class="field"><label for="st-cur">واحد پول</label>
          <select class="select" id="st-cur">
            <option value="IRT" selected>تومان (IRT)</option>
          </select></div>
        <div class="field"><label for="st-tax">نرخ مالیات (٪)</label>
          <input class="input" id="st-tax" type="number" step="0.1" value="${y.shop.taxRatePercent}"></div>
        <label class="switch mb-4"><input type="checkbox" checked><span class="switch__track"></span><span>فروشگاه باز</span></label>
        <label class="switch mb-4"><input type="checkbox" checked><span class="switch__track"></span><span>تحویل خودکار</span></label>
        <button class="btn btn--gold" data-save-settings>${a(n("common.save","Save"))}</button>
      </div>

      <div class="card">
        <div class="card__head"><h4>تعمیرات</h4></div>
        <label class="switch mb-4"><input type="checkbox"><span class="switch__track"></span><span>حالت تعمیرات</span></label>
        <div class="field"><label for="st-maint">پیام تعمیرات</label>
          <textarea class="textarea" id="st-maint" style="min-height:90px">در حال انجام تعمیرات دوره‌ای هستیم. حدود ۲۰ دقیقه دیگر بازمی‌گردیم.</textarea></div>
        <p class="text-muted" style="font-size:.8rem">
            با روشن بودن حالت تعمیرات، همه به‌جز هد ادمین و بالاتر یک صفحه توقف می‌بینند.
        </p>
        <button class="btn btn--gold" data-save-settings>${a(n("common.save","Save"))}</button>
      </div>
    </div>`)}function it(){let e=p("#admin-main");if(!e)return;let t=[],s=d=>Z().some(l=>l.id===d);s("overview")&&t.push(yt()),s("users")&&t.push(xt()),s("roles")&&t.push(qt()),s("products")&&t.push(Et()),s("orders")&&t.push(Tt()),s("coupons")&&t.push(At()),s("tickets")&&t.push(Rt()),s("news")&&t.push(Ft()),s("content")&&t.push(It()),s("server")&&t.push(Pt()),s("logs")&&t.push(Ht()),s("integrations")&&t.push(Bt()),s("settings")&&t.push(Yt()),e.innerHTML=t.join("");let i=p("#admin-demo");i&&(i.innerHTML=de("demo.admin","این پنل روی داده‌های نمونه اجرا می‌شود. هیچ کاربر، سفارش یا لاگ واقعی تغییر نمی‌کند.")),H(),kt(),G(),Ct(),ee(),Ot(),oe(),Nt(),z(),Vt(),jt(),R("[data-goto]").forEach(d=>d.addEventListener("click",()=>M(d.dataset.goto))),R("[data-save-content],[data-save-settings]").forEach(d=>d.addEventListener("click",()=>{q()?u.warn(n("admin.demoWrite","حالت نمایشی: این تغییر هیچ‌جا ذخیره نمی‌شود.")):u.success(n("common.saved","Saved"))})),s("content")&&(he(e),Dt(),ce(),ue(),zt(),Mt()),wt(),Ut(),Ae(e)}function M(e){if(R(".dash-section").forEach(t=>t.classList.toggle("is-active",t.dataset.panel===e)),R("#admin-aside [data-section]").forEach(t=>t.classList.toggle("is-active",t.dataset.section===e)),location.hash.slice(1)!==e&&history.replaceState({},"","#"+e),window.scrollTo({top:0,behavior:"smooth"}),e!=="logs"&&me){fe();let t=p("#l-live");t&&(t.checked=!1),g.logs.live=!1}}async function Jt(){if(!await Fe("shop_manager"))return;await Ee(),et(),it(),p("#admin-burger")?.addEventListener("click",()=>{p("#admin-aside")?.classList.add("is-open"),p("#admin-backdrop")?.classList.add("is-open")}),p("#admin-backdrop")?.addEventListener("click",()=>{p("#admin-aside")?.classList.remove("is-open"),p("#admin-backdrop")?.classList.remove("is-open")});let t=Z()[0]?.id||"overview",s=(location.hash||"").slice(1);M(Z().some(i=>i.id===s)?s:t),window.addEventListener("hashchange",()=>{let i=location.hash.slice(1);Z().some(d=>d.id===i)&&M(i)}),window.addEventListener("beforeunload",fe),Te(()=>{let i=location.hash.slice(1)||t;et(),it(),M(i)})}var ma={init:Jt};export{ma as default,Jt as init};
