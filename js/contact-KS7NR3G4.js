import{e as p}from"./chunk-J7TKWPPN.js";import"./chunk-MWRI3OKJ.js";import"./chunk-KIK4IJKS.js";import{b as f}from"./chunk-OCIUYIWP.js";import{A as g,M as u,N as t,P as b,a as n,c as r,e,g as v,i as o,l as a,p as s,x as l}from"./chunk-W2AEBEJL.js";function h(){let i=o("#contact-root");i&&(i.innerHTML=`
    <div class="grid g-3 mb-6">
      <a class="card card--hover card--gold-edge contact-card" href="${a(n.social.discord)}" target="_blank" rel="noopener noreferrer" data-reveal>
        <span class="contact-card__icon">${s("discord")}</span>
        <div>
          <h5>${a(e("contact.discordTitle","Discord"))}</h5>
          <p>${a(e("contact.discordText",""))}</p>
          <span class="link-sweep">discord.gg/royalrp ${s("external")}</span>
        </div>
      </a>

      <a class="card card--hover card--gold-edge contact-card" href="${r("support.html")}" data-reveal style="--d:80ms">
        <span class="contact-card__icon">${s("ticket")}</span>
        <div>
          <h5>${a(e("contact.ticketTitle","تیکت پشتیبانی"))}</h5>
          <p>${a(e("contact.ticketText",""))}</p>
          <span class="link-sweep">${a(e("faq.openTicket","Open a ticket"))} ${s("arrowRight","icon-flip")}</span>
        </div>
      </a>

      <a class="card card--hover card--gold-edge contact-card" href="mailto:hello@royalrp.example" data-reveal style="--d:160ms">
        <span class="contact-card__icon">${s("mail")}</span>
        <div>
          <h5>${a(e("contact.emailTitle","Email"))}</h5>
          <p>${a(e("contact.emailText",""))}</p>
          <span class="link-sweep">hello@royalrp.example</span>
        </div>
      </a>
    </div>

    <div class="grid g-2">
      <div class="card" data-reveal>
        <div class="card__head">
          <div>
            <h4>${a(e("contact.formTitle","برای ما پیام بفرستید"))}</h4>
            <p style="font-size:.84rem;margin:0">${a(e("contact.formSub",""))}</p>
          </div>
        </div>

        ${p()?`<div class="demo-banner">${s("warning")}
          <span><strong>${a(e("demo.badge","DEMO DATA"))}</strong> &mdash; ${a(e("contact.demoNote",""))}</span>
        </div>`:""}

        <form id="contact-form" novalidate>
          <div class="form-grid">
            <div class="field">
              <label for="ct-name">${a(e("contact.name","نام شما"))} <span class="req">*</span></label>
              <input class="input" id="ct-name" name="name" autocomplete="name">
            </div>
            <div class="field">
              <label for="ct-email">${a(e("contact.email","ایمیل شما"))} <span class="req">*</span></label>
              <input class="input" id="ct-email" name="email" type="email" autocomplete="email">
            </div>
            <div class="field field--full">
              <label for="ct-subject">${a(e("contact.subject","Subject"))} <span class="req">*</span></label>
              <input class="input" id="ct-subject" name="subject">
            </div>
            <div class="field field--full">
              <label for="ct-message">${a(e("contact.message","Message"))} <span class="req">*</span></label>
              <textarea class="textarea" id="ct-message" name="message" style="min-height:170px"></textarea>
            </div>
          </div>
          <label class="check mb-4">
            <input type="checkbox" name="privacy">
            <span class="check__box">${s("check")}</span>
            <span>I agree that my message and email address will be processed so you can reply.
              <a class="link-sweep" href="${r("privacy.html")}">${a(e("legal.privacy","Privacy Policy"))}</a></span>
          </label>
          <button class="btn btn--gold btn--lg" type="submit">
            ${s("mail")}<span>${a(e("contact.send","ارسال پیام"))}</span>
          </button>
        </form>
      </div>

      <div data-reveal style="--d:80ms">
        <div class="card mb-4">
          <div class="card__head"><h4>زمان پاسخگویی</h4></div>
          <div style="display:grid;gap:.75rem;font-size:.88rem">
            <div class="flex flex-between"><span class="text-muted">تیکت‌های پشتیبانی</span><span class="text-gold">under 24h</span></div>
            <div class="flex flex-between"><span class="text-muted">پرداخت و سفارش</span><span class="text-gold">under 48h</span></div>
            <div class="flex flex-between"><span class="text-muted">درخواست تجدیدنظر</span><span class="text-gold">under 72h</span></div>
            <div class="flex flex-between"><span class="text-muted">همکاری تجاری</span><span class="text-gold">3-5 days</span></div>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card__head"><h4>مشخصات سرور</h4></div>
          <div style="display:grid;gap:.6rem;font-size:.86rem">
            <div class="flex flex-between"><span class="text-muted">آدرس</span><span class="mono">${a(n.server.ip)}</span></div>
            <div class="flex flex-between"><span class="text-muted">منطقه</span><span>${a(n.server.region)}</span></div>
            <div class="flex flex-between"><span class="text-muted">ظرفیت</span><span class="mono">${n.server.maxPlayers}</span></div>
            <div class="flex flex-between"><span class="text-muted">زبان‌ها</span><span>English / فارسی</span></div>
          </div>
        </div>

        <div class="card">
          <div class="card__head"><h4>ما را دنبال کنید</h4></div>
          <div class="socials" style="margin-top:0;flex-wrap:wrap">
            ${Object.entries(n.social).map(([c,d])=>`<a class="social-btn" href="${a(d)}" target="_blank" rel="noopener noreferrer" aria-label="${a(c)}">${s(c)}</a>`).join("")}
          </div>
        </div>
      </div>
    </div>`,o("#contact-form")?.addEventListener("submit",async c=>{c.preventDefault();let{valid:d,values:x}=b(c.target,{name:[t.required,t.min(2)],email:[t.required,t.email],subject:[t.required,t.min(4)],message:[t.required,t.min(20)],privacy:[t.accepted]});if(!d)return;let $=c.target.querySelector("button[type=submit]"),m=u($);if(p()){setTimeout(()=>{m(),l.warn(e("contact.demoNote","No backend is running, so this form is not actually sending anything yet."))},500);return}try{await f.post("/contact",x),c.target.reset(),l.success(e("contact.sent","متشکریم — به‌زودی پاسخ می‌دهیم."))}catch(y){l.error(y.message)}m()}),g(i))}async function w(){h(),v(h)}var O={init:w};export{O as default,w as init};
