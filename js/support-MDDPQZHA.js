import{a as g}from"./chunk-GICZ4Y7Y.js";import{e as k,f as A,g as F,m as N}from"./chunk-J7TKWPPN.js";import"./chunk-MWRI3OKJ.js";import{b as L}from"./chunk-KIK4IJKS.js";import{b as $}from"./chunk-OCIUYIWP.js";import{A as R,C as q,L as C,M as T,N as b,P as M,a as j,c as w,d as D,e as a,g as I,i as r,l as t,p as o,u as x,v as _,x as l,z as O}from"./chunk-W2AEBEJL.js";var v=[],f=null,U={open:"badge--orange",answered:"badge--green",pending:"badge--blue",closed:"badge--grey"},H={low:"badge--grey",normal:"badge--blue",high:"badge--orange",urgent:"badge--red"};function z(){let e=r("#support-root");if(!e)return;let s=encodeURIComponent(location.pathname+location.search);e.innerHTML=`
    <div class="card">
      <div class="state">
        <div class="state__icon">${o("lock")}</div>
        <h4>${t(a("support.signInFirst","برای ثبت تیکت وارد شوید"))}</h4>
        <p>${t(a("support.signInText",""))}</p>
        <div class="flex gap-3" style="justify-content:center;flex-wrap:wrap">
          <a class="btn btn--gold" href="${w("login.html")}?next=${s}">${t(a("nav.login","Sign in"))}</a>
          <a class="btn btn--ghost" href="${w("register.html")}?next=${s}">${t(a("nav.register","Register"))}</a>
        </div>
      </div>
    </div>`}function Y(){return v.length?`<div style="display:grid;gap:.75rem">
    ${v.map(e=>`
      <div class="ticket-row" data-ticket="${t(e.id)}" role="button" tabindex="0">
        <span class="ticket-row__id">${t(e.id)}</span>
        <div>
          <div class="ticket-row__title">${t(e.subject)}</div>
          <div class="ticket-row__meta">
            <span>${o("tag")} ${t(e.category)}</span>
            <span>${o("clock")} ${t(_(e.updated))}</span>
            <span>${o("chat")} ${e.messages.length}</span>
            ${e.assignee?`<span>${o("user")} ${t(e.assignee)}</span>`:""}
          </div>
        </div>
        <div class="flex gap-2 items-center">
          <span class="badge ${H[e.priority]||"badge--grey"}">${t(a("support.prio"+e.priority.charAt(0).toUpperCase()+e.priority.slice(1),e.priority))}</span>
          <span class="badge ${U[e.status]||"badge--grey"}">${t(a("support.status"+e.status.charAt(0).toUpperCase()+e.status.slice(1),e.status))}</span>
        </div>
      </div>`).join("")}
  </div>`:C({icon:"ticket",title:a("support.noTickets","No tickets yet"),text:a("support.noTicketsText",""),action:`<button class="btn btn--gold" data-tab-jump="new">${t(a("support.newTicket","New ticket"))}</button>`})}function J(e){let s=e.status==="closed";return`
  <div class="card">
    <div class="card__head">
      <div>
        <div class="flex gap-2 items-center flex-wrap mb-4">
          <span class="ticket-row__id">${t(e.id)}</span>
          <span class="badge ${H[e.priority]}">${t(e.priority)}</span>
          <span class="badge ${U[e.status]}">${t(e.status)}</span>
        </div>
        <h3 style="font-size:1.25rem">${t(e.subject)}</h3>
        <div class="ticket-row__meta">
          <span>${t(a("support.opened","Opened"))} ${t(x(e.created,!0))}</span>
          <span>${t(a("support.assignedTo","ارجاع به"))}: ${t(e.assignee||a("support.unassigned","Not yet assigned"))}</span>
        </div>
      </div>
      <button class="btn btn--ghost btn--sm" data-back>${o("chevronLeft")}<span>${t(a("common.back","Back"))}</span></button>
    </div>

    <div class="chat-thread" id="thread">
      ${e.messages.map(n=>`
        <div class="msg ${n.staff?"msg--staff":""}">
          <span class="msg__avatar">${t(n.author.slice(0,2).toUpperCase())}</span>
          <div class="msg__bubble">
            <div class="msg__head">
              <span class="msg__author">${t(n.author)}</span>
              ${n.staff?`<span class="badge badge--gold">${t(j.roles[n.role]?.label||"Staff")}</span>`:""}
              <span class="msg__time">${t(x(n.date,!0))}</span>
            </div>
            <div class="msg__text">${t(n.text)}</div>
            ${(n.files||[]).length?`<div class="msg__files">
              ${n.files.map(p=>`<span class="file-pill">${o("file")}${t(p)}</span>`).join("")}
            </div>`:""}
          </div>
        </div>`).join("")}
    </div>

    ${s?`
      <div class="state" style="margin-top:1.5rem;padding:1.5rem">
        <p style="margin:0 0 1rem">${t(a("support.statusClosed","Closed"))} &mdash; ${t(_(e.updated))}</p>
        <button class="btn btn--ghost btn--sm" data-reopen>${o("refresh")}<span>${t(a("support.reopen","Reopen"))}</span></button>
      </div>`:`
      <form class="mt-6" id="reply-form">
        <div class="field">
          <label for="reply-text">${t(a("support.reply","Reply"))}</label>
          <textarea class="textarea" id="reply-text" name="text"
                    placeholder="${t(a("support.replyPlaceholder","پاسخ خود را بنویسید..."))}"></textarea>
        </div>
        <div class="flex gap-3 flex-wrap">
          <button class="btn btn--gold" type="submit">${o("arrowRight","icon-flip")}<span>${t(a("support.sendReply","ارسال پاسخ"))}</span></button>
          <button class="btn btn--danger" type="button" data-close-ticket>${o("close")}<span>${t(a("support.closeTicket","بستن تیکت"))}</span></button>
        </div>
      </form>`}
  </div>`}function K(){let e=D();return`
  <div class="card">
    <div class="card__head"><h4>${t(a("support.newTicket","New ticket"))}</h4></div>

    <div class="demo-banner" style="background:linear-gradient(90deg,rgba(74,168,255,.1),transparent);border-color:rgba(74,168,255,.3);border-inline-start-color:#4aa8ff;color:#a8d3ff">
      ${o("info")}
      <span><strong>${t(a("support.quickHelp","پیش از ثبت تیکت"))}</strong> &mdash;
      ${t(a("support.quickHelpText",""))}
      <a href="${w("faq.html")}" style="color:#cfe6ff;text-decoration:underline">${t(a("nav.faq","FAQ"))}</a></span>
    </div>

    <form id="new-ticket-form" novalidate>
      <div class="form-grid">
        <div class="field field--full">
          <label for="tk-subject">${t(a("support.subject","Subject"))} <span class="req">*</span></label>
          <input class="input" id="tk-subject" name="subject" maxlength="120" required>
        </div>
        <div class="field">
          <label for="tk-cat">${t(a("support.category","دسته"))}</label>
          <select class="select" id="tk-cat" name="category">
            ${L.TICKET_CATEGORIES.map(s=>`<option value="${s.id}">${t(e==="fa"?s.nameFa:s.name)}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label for="tk-prio">${t(a("support.priority","Priority"))}</label>
          <select class="select" id="tk-prio" name="priority">
            <option value="low">${t(a("support.prioLow","Low"))}</option>
            <option value="normal" selected>${t(a("support.prioNormal","Normal"))}</option>
            <option value="high">${t(a("support.prioHigh","High"))}</option>
            <option value="urgent">${t(a("support.prioUrgent","Urgent"))}</option>
          </select>
        </div>
        <div class="field field--full">
          <label for="tk-msg">${t(a("support.message","Message"))} <span class="req">*</span></label>
          <textarea class="textarea" id="tk-msg" name="message" style="min-height:180px" required></textarea>
          <span class="field__hint">در صورت امکان شماره سفارش، نام درون‌بازی یا زمان دقیق را بنویسید.</span>
        </div>
        <div class="field field--full">
          <label>${t(a("support.attachments","پیوست‌ها"))}</label>
          <div class="dropzone" id="tk-drop">
            ${o("upload")}
            <p>${t(a("support.attachHint","اسکرین‌شات یا کلیپ کمک زیادی می‌کند. حداکثر ۵ فایل، هرکدام ۱۰ مگابایت."))}</p>
            <small>PNG, JPG, MP4, WebM, PDF</small>
          </div>
          <input type="file" id="tk-files" multiple hidden accept="image/*,video/mp4,video/webm,application/pdf">
          <div class="upload-preview" id="tk-preview"></div>
        </div>
      </div>
      <button class="btn btn--gold btn--lg" type="submit">${o("ticket")}<span>${t(a("support.create","Open ticket"))}</span></button>
    </form>
  </div>`}function c(){let e=r("#support-root");if(!e)return;if(!g.isLoggedIn){z();return}let s=v.find(n=>n.id===f);if(s){e.innerHTML=J(s),Q(s);return}e.innerHTML=`
    ${A("demo.generic","این تیکت‌ها نمونه هستند. برای ثبت تیکت واقعی بک‌اند را اجرا کنید.")}
    <div class="tabs" data-tabs data-tabs-scope="#support-panels">
      <button class="tab is-active" data-tab="list">${o("inbox")}<span>${t(a("support.myTickets","My tickets"))}</span></button>
      <button class="tab" data-tab="new">${o("plus")}<span>${t(a("support.newTicket","New ticket"))}</span></button>
    </div>
    <div id="support-panels">
      <div class="tab-panel is-active" data-panel="list">${Y()}</div>
      <div class="tab-panel" data-panel="new">${K()}</div>
    </div>`,q(e),W(),V(),location.hash==="#new"&&r('[data-tab="new"]')?.click()}function W(){r("#support-root")?.addEventListener("click",e=>{let s=e.target.closest("[data-tab-jump]");if(s){r(`[data-tab="${s.dataset.tabJump}"]`)?.click();return}let n=e.target.closest("[data-ticket]");n&&(f=n.dataset.ticket,history.replaceState({},"",`?ticket=${encodeURIComponent(f)}`),c())})}function Q(e){r("[data-back]")?.addEventListener("click",()=>{f=null,history.replaceState({},"",location.pathname),c()}),r("#reply-form")?.addEventListener("submit",async n=>{n.preventDefault();let p=r("#reply-text").value.trim();if(!p){l.error(a("support.replyPlaceholder","ابتدا یک پاسخ بنویسید"));return}let h=n.target.querySelector("button[type=submit]"),y=T(h),i={id:e.messages.length+1,author:g.user?.username||"You",staff:!1,date:new Date().toISOString(),text:p,files:[]};if(k()){e.messages.push(i),e.updated=i.date,e.status="pending",l.warn(a("toast.demoAction","حالت نمایشی — این پاسخ فقط در همین نشست مرورگر ذخیره می‌شود.")),c();return}try{await $.replyTicket(e.id,{text:p}),e.messages.push(i),e.updated=i.date,e.status="pending",l.success(a("support.replied","Reply sent")),c()}catch(d){y(),l.error(d.message)}}),r("[data-close-ticket]")?.addEventListener("click",async()=>{if(await O({title:a("support.closeTicket","بستن تیکت"),message:"در صورت نیاز می‌توانید بعداً آن را بازگشایی کنید.",confirmText:a("support.closeTicket","Close")})){if(e.status="closed",e.updated=new Date().toISOString(),!k())try{await $.closeTicket(e.id)}catch(p){l.error(p.message)}l.success(a("support.closed","تیکت بسته شد")),c()}}),r("[data-reopen]")?.addEventListener("click",()=>{e.status="open",e.updated=new Date().toISOString(),l.info(a("support.reopen","بازگشایی شد")),c()});let s=r("#thread");s&&(s.scrollTop=s.scrollHeight)}function V(){let e=r("#tk-drop"),s=r("#tk-files"),n=r("#tk-preview"),p=[];e&&s&&(e.addEventListener("click",()=>s.click()),["dragenter","dragover"].forEach(i=>e.addEventListener(i,d=>{d.preventDefault(),e.classList.add("is-drag")})),["dragleave","drop"].forEach(i=>e.addEventListener(i,d=>{d.preventDefault(),e.classList.remove("is-drag")})),e.addEventListener("drop",i=>h(i.dataTransfer.files)),s.addEventListener("change",()=>h(s.files)));function h(i){for(let d of Array.from(i)){if(p.length>=5){l.warn("حداکثر ۵ فایل");break}if(d.size>10*1024*1024){l.error(`${d.name} is larger than 10MB`);continue}p.push(d)}y()}function y(){n&&(n.innerHTML=p.map((i,d)=>`
      <div class="upload-preview__item" title="${t(i.name)}">
        ${i.type.startsWith("image/")?`<img src="${URL.createObjectURL(i)}" alt="">`:`<span style="display:grid;place-items:center;height:100%;color:var(--c-gold);font-size:.68rem;padding:4px;text-align:center">${t(i.name.slice(0,18))}</span>`}
        <button type="button" data-rm="${d}">&times;</button>
      </div>`).join(""),n.querySelectorAll("[data-rm]").forEach(i=>i.addEventListener("click",()=>{p.splice(Number(i.dataset.rm),1),y()})))}r("#new-ticket-form")?.addEventListener("submit",async i=>{i.preventDefault();let{valid:d,values:m}=M(i.target,{subject:[b.required,b.min(6),b.max(120)],message:[b.required,b.min(20)]});if(!d)return;let P=i.target.querySelector("button[type=submit]"),G=T(P),S={id:"RR-"+Math.floor(1200+Math.random()*800),subject:m.subject,category:m.category,priority:m.priority,status:"open",created:new Date().toISOString(),updated:new Date().toISOString(),assignee:null,author:g.user?.username||"You",messages:[{id:1,author:g.user?.username||"You",staff:!1,date:new Date().toISOString(),text:m.message,files:p.map(u=>u.name)}]};if(k()){v.unshift(S),l.warn(a("toast.demoAction","حالت نمایشی — این تیکت فقط در همین نشست مرورگر ذخیره می‌شود.")),f=S.id,c();return}try{let u={subject:m.subject,category:m.category,priority:m.priority,message:m.message};let E=await $.createTicket(u);v.unshift(E),l.success(a("support.created","تیکت ثبت شد.")),f=E.id,c()}catch(u){G(),l.error(u.message)}})}async function X(){if(g.ready||await g.init(),g.isLoggedIn){let{data:e}=await F(()=>$.tickets(),()=>({items:L.DEMO_TICKETS}));v=e.items||e}f=N("ticket"),c(),g.onChange(c),I(c),R()}var le={init:X};export{le as default,X as init};
