import{g as u,j as v}from"./chunk-J7TKWPPN.js";import"./chunk-MWRI3OKJ.js";import{b as g}from"./chunk-KIK4IJKS.js";import{b as m}from"./chunk-OCIUYIWP.js";import{A as n,L as h,a as c,c as d,e as t,g as f,i as p,l as a,p as s}from"./chunk-W2AEBEJL.js";var i=[],$=[{key:"staff.management",fallback:"Management",roles:["owner","developer"]},{key:"staff.administration",fallback:"ادمین‌ها",roles:["head_admin","admin"]},{key:"staff.moderation",fallback:"Moderation & support",roles:["moderator","support","shop_manager"]}];function y(){let e=p("#staff-root");if(e){if(!i.length){e.innerHTML=`
      <section class="section section--tight">
        ${h({icon:"shield",title:t("staff.emptyTitle","تیم مدیریت هنوز معرفی نشده است"),text:t("staff.empty","اعضای تیم به‌زودی در این صفحه معرفی می‌شوند.")})}
      </section>`,n(e);return}e.innerHTML=$.map(o=>{let l=i.filter(r=>o.roles.includes(r.role));return l.length?`
      <section class="section section--tight">
        <header class="sec-head" data-reveal>
          <span class="sec-eyebrow">${a(t(o.key,o.fallback))}</span>
          <div class="divider-gold"></div>
        </header>
        <div class="grid g-4">
          ${l.map((r,b)=>v(r,{delay:b*60})).join("")}
        </div>
      </section>`:""}).join("")+`
    <div class="cta-banner" data-reveal>
      ${s("shield")}
      <h3 style="margin-top:1rem">${a(t("staff.contact","تمام اعضای تیم از طریق مرکز پشتیبانی در دسترس‌اند."))}</h3>
      <div class="flex gap-3 mt-6" style="justify-content:center;flex-wrap:wrap">
        <a class="btn btn--gold" href="${d("support.html")}">${a(t("nav.support","Support"))}</a>
        <a class="btn btn--ghost" href="${a(c.social.discord)}" target="_blank" rel="noopener noreferrer">
          ${s("discord")}<span>${a(t("common.discord","Join Discord"))}</span>
        </a>
      </div>
    </div>`,n(e)}}async function k(){let{data:e}=await u(()=>m.staff(),()=>({items:g.STAFF}));i=e.items||e,y(),f(y)}var C={init:k};export{C as default,k as init};
