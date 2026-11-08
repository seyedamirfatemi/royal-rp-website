import{f as H}from"./chunk-HRWNYBPI.js";import{a as y,b as V}from"./chunk-GICZ4Y7Y.js";import{e as A,f as F,g as w,k as b}from"./chunk-J7TKWPPN.js";import"./chunk-MWRI3OKJ.js";import{b as $}from"./chunk-KIK4IJKS.js";import{b as h,d as R}from"./chunk-OCIUYIWP.js";import{A as U,L as _,M as j,N as g,P as M,R as q,a as O,b as C,c as f,e as t,g as G,i as c,j as E,l as s,p,q as k,r as I,t as m,u as x,v as T,w as P,x as u}from"./chunk-W2AEBEJL.js";var z=[{id:"overview",icon:"dashboard",key:"dash.overview",group:"dash.account"},{id:"character",icon:"user",key:"dash.character",group:"dash.game"},{id:"vehicles",icon:"car",key:"dash.vehicles",group:null},{id:"properties",icon:"home2",key:"dash.properties",group:null},{id:"orders",icon:"package",key:"dash.orders",group:"nav.shop"},{id:"wallet",icon:"wallet",key:"dash.wallet",group:null},{id:"tickets",icon:"ticket",key:"dash.tickets",group:"nav.support"},{id:"notifications",icon:"bell",key:"dash.notifications",group:null},{id:"settings",icon:"settings",key:"dash.settings",group:"dash.settings"},{id:"security",icon:"shield",key:"dash.security",group:null}],r={character:null,vehicles:[],properties:[],orders:[],transactions:[],notifications:[],tickets:[]};async function Z(){let[a,i,e,n,d,o]=await Promise.all([w(()=>h.myCharacters(),()=>({items:[$.DEMO_CHARACTER]})),w(()=>h.myVehicles(),()=>({items:$.DEMO_VEHICLES})),w(()=>h.myProperties(),()=>({items:$.DEMO_PROPERTIES})),w(()=>h.myOrders(),()=>({items:$.DEMO_ORDERS})),w(()=>h.myNotifs(),()=>({items:$.DEMO_NOTIFICATIONS})),w(()=>h.tickets(),()=>({items:$.DEMO_TICKETS}))]);r.character=(a.data.items||a.data)[0]||null,r.vehicles=i.data.items||i.data,r.properties=e.data.items||e.data,r.orders=n.data.items||n.data,r.notifications=d.data.items||d.data,r.tickets=o.data.items||o.data,r.transactions=$.DEMO_TRANSACTIONS}function D(){let a=c("#dash-aside");if(!a)return;let i=y.user||{username:"Player",role:"user"},e=O.roles[i.role]||O.roles.user,n=r.notifications.filter(l=>!l.read).length,d=r.tickets.filter(l=>l.status!=="closed").length,o=null,N=z.map(l=>{let L="";l.group&&l.group!==o&&(L=`<div class="dash-nav__group">${s(t(l.group))}</div>`,o=l.group);let W=l.id==="notifications"&&n?`<span class="pill pill--red">${n}</span>`:l.id==="tickets"&&d?`<span class="pill">${d}</span>`:"";return`${L}<button type="button" data-section="${l.id}">${p(l.icon)}<span>${s(t(l.key))}</span>${W}</button>`}).join("");a.innerHTML=`
    <div class="dash-user">
      <span class="dash-user__avatar">${i.avatar?`<img src="${s(i.avatar)}" alt="">`:s((i.username||"U").slice(0,2).toUpperCase())}</span>
      <div>
        <div class="dash-user__name">${s(i.username)}</div>
        <div class="dash-user__role ${e.css}">${s(e.label)}</div>
      </div>
    </div>
    <nav class="dash-nav">${N}</nav>
    ${y.hasRole("shop_manager")?`
      <a class="btn btn--ghost btn--sm btn--block mt-4" href="${f("admin.html")}">
        ${p("shield")}<span>${s(t("nav.admin","Admin"))}</span>
      </a>`:""}`,a.addEventListener("click",l=>{let L=l.target.closest("[data-section]");L&&(S(L.dataset.section),a.classList.remove("is-open"),c("#dash-backdrop")?.classList.remove("is-open"))})}function v(a,i,e,n){return`<section class="dash-section" data-panel="${a}">
    <div class="dash-head">
      <div><h1>${s(i)}</h1>${e?`<p>${s(e)}</p>`:""}</div>
    </div>
    ${n}
  </section>`}function J(){let a=r.character,i=r.notifications.filter(d=>!d.read).length,e=r.orders.filter(d=>d.status!=="refunded").reduce((d,o)=>d+o.total,0),n=a?.vipTier?`<span class="badge badge--solid-gold">${s(a.vipTier.toUpperCase())}</span>`:`<span class="badge badge--grey">${s(t("dash.noVip","No active VIP"))}</span>`;return v("overview",t("dash.title","داشبورد"),t("dash.welcome","خوش برگشتی، {name}").replace("{name}",y.user?.username||""),`
    <div id="dash-demo"></div>

    <div class="kpi-grid">
      ${b({iconName:"money",label:t("dash.bank","Bank"),value:a?m(a.bank):"—",sub:t("dash.game","In-game")})}
      ${b({iconName:"wallet",label:t("dash.cash","Cash"),value:a?m(a.cash):"—",sub:t("dash.game","In-game")})}
      ${b({iconName:"clock",label:t("dash.playtime","Playtime"),value:a?P(a.playtimeMinutes):"—"})}
      ${b({iconName:"package",label:t("dash.orders","Orders"),value:String(r.orders.length),sub:k(e)})}
    </div>

    ${a?`
    <div class="char-card">
      <div class="char-card__avatar">
        <img src="${C(a.avatar)}" alt="${s(a.firstName)}" loading="lazy">
      </div>
      <div>
        <div class="flex flex-between flex-wrap gap-3 items-center">
          <div>
            <h3 class="char-card__name">${s(a.firstName)} ${s(a.lastName)}</h3>
            <div class="char-card__ids">
              <span>${s(t("dash.citizenId","شناسه شهروندی"))}: <b>${s(a.citizenid)}</b></span>
              <span>${s(t("dash.serverId","شناسه سرور"))}: <b>${s(String(a.serverId))}</b></span>
            </div>
          </div>
          <div class="text-center">
            ${n}
            ${a.vipExpires?`<div class="text-muted" style="font-size:.72rem;margin-top:.3rem">
              ${s(t("dash.vipExpires","انقضا"))} ${s(x(a.vipExpires))}</div>`:""}
          </div>
        </div>

        <div class="char-grid">
          <div class="char-stat"><div class="char-stat__label">${s(t("dash.job","Job"))}</div>
            <div class="char-stat__value">${s(a.job)}</div></div>
          <div class="char-stat"><div class="char-stat__label">${s(t("dash.grade","Grade"))}</div>
            <div class="char-stat__value">${s(a.jobGrade)}</div></div>
          <div class="char-stat"><div class="char-stat__label">${s(t("dash.gang","Gang"))}</div>
            <div class="char-stat__value">${s(a.gang||"—")}</div></div>
          <div class="char-stat"><div class="char-stat__label">${s(t("dash.cash","Cash"))}</div>
            <div class="char-stat__value money">${m(a.cash)}</div></div>
          <div class="char-stat"><div class="char-stat__label">${s(t("dash.bank","Bank"))}</div>
            <div class="char-stat__value bank">${m(a.bank)}</div></div>
          <div class="char-stat"><div class="char-stat__label">${s(t("dash.playtime","Playtime"))}</div>
            <div class="char-stat__value">${P(a.playtimeMinutes)}</div></div>
        </div>
      </div>
    </div>`:""}

    <div class="grid g-2">
      <div class="card">
        <div class="card__head">
          <h4>${s(t("dash.notifications","Notifications"))}</h4>
          ${i?`<span class="badge badge--gold">${i}</span>`:""}
        </div>
        <div style="display:grid;gap:.6rem">
          ${r.notifications.slice(0,4).map(d=>`
            <div class="notif-row ${d.read?"":"is-unread"}">
              <span class="notif-row__icon">${p(d.icon||"bell")}</span>
              <div style="flex:1;min-width:0">
                <div class="notif-row__title">${s(d.title)}</div>
                <div class="notif-row__text">${s(d.text)}</div>
              </div>
              <span class="notif-row__time">${s(T(d.date))}</span>
            </div>`).join("")||`<p class="text-muted">${s(t("dash.noNotifs","Nothing new"))}</p>`}
        </div>
        <button class="btn btn--ghost btn--sm btn--block mt-4" data-goto="notifications">
          ${s(t("common.viewAll","مشاهده همه"))}
        </button>
      </div>

      <div class="card">
        <div class="card__head"><h4>${s(t("dash.orders","Orders"))}</h4></div>
        <div class="table-wrap" style="border:0;background:none">
          <table class="table" style="min-width:0">
            <tbody>
              ${r.orders.slice(0,5).map(d=>`
                <tr>
                  <td class="mono" style="font-size:.78rem">${s(d.id)}</td>
                  <td style="font-size:.8rem">${s(d.items[0]?.name||"")}${d.items.length>1?` +${d.items.length-1}`:""}</td>
                  <td class="num">${k(d.total)}</td>
                  <td><span class="order-status order-status--${s(d.status)}">${s(d.status)}</span></td>
                </tr>`).join("")||`<tr><td class="text-muted">${s(t("dash.noOrders","No orders yet"))}</td></tr>`}
            </tbody>
          </table>
        </div>
        <button class="btn btn--ghost btn--sm btn--block mt-4" data-goto="orders">
          ${s(t("common.viewAll","مشاهده همه"))}
        </button>
      </div>
    </div>`)}function K(){let a=r.character;if(!a)return v("character",t("dash.character","شخصیت"),"",_({icon:"user",title:t("dash.notLinked","Not linked"),text:t("dash.linkGameText","")}));let i=(e,n,d,o="")=>`
    <div>
      <div class="flex flex-between" style="font-size:.78rem;margin-bottom:.3rem">
        <span class="text-muted">${s(e)}</span><span class="mono">${n}%</span>
      </div>
      <div class="progress ${o}"><i style="width:${n}%"></i></div>
    </div>`;return v("character",t("dash.character","شخصیت"),`${a.firstName} ${a.lastName}`,`
    <div id="dash-demo-char"></div>
    <div class="grid g-2">
      <div class="card">
        <div class="card__head"><h4>${s(t("dash.character","شخصیت"))}</h4></div>
        <div class="char-grid" style="margin-top:0">
          <div class="char-stat"><div class="char-stat__label">نام</div><div class="char-stat__value">${s(a.firstName)} ${s(a.lastName)}</div></div>
          <div class="char-stat"><div class="char-stat__label">تاریخ تولد</div><div class="char-stat__value">${s(x(a.dob))}</div></div>
          <div class="char-stat"><div class="char-stat__label">ملیت</div><div class="char-stat__value">${s(a.nationality)}</div></div>
          <div class="char-stat"><div class="char-stat__label">${s(t("dash.citizenId","شناسه شهروندی"))}</div><div class="char-stat__value mono">${s(a.citizenid)}</div></div>
          <div class="char-stat"><div class="char-stat__label">${s(t("dash.job","Job"))}</div><div class="char-stat__value">${s(a.job)}</div></div>
          <div class="char-stat"><div class="char-stat__label">${s(t("dash.grade","Grade"))}</div><div class="char-stat__value">${s(a.jobGrade)}</div></div>
        </div>
      </div>

      <div class="card">
        <div class="card__head"><h4>وضعیت بدنی</h4></div>
        <div style="display:grid;gap:1rem">
          ${i("سلامتی",a.health,100,"progress--green")}
          ${i("جلیقه",a.armor,100)}
          ${i("گرسنگی",a.hunger,100)}
          ${i("تشنگی",a.thirst,100)}
        </div>
        <div class="flex flex-between mt-6" style="font-size:.8rem">
          <span class="text-muted">${s(t("dash.lastSeen","Last seen"))}</span>
          <span>${s(T(a.lastSeen))}</span>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card__head"><h4>${s(t("dash.wallet","Wallet"))}</h4></div>
      <div class="kpi-grid">
        ${b({iconName:"wallet",label:t("dash.cash","Cash"),value:m(a.cash)})}
        ${b({iconName:"money",label:t("dash.bank","Bank"),value:m(a.bank)})}
        ${b({iconName:"chart",label:"ارز دیجیتال",value:a.crypto+" BTC"})}
      </div>
    </div>`)}function Q(){return v("vehicles",t("dash.vehicles","خودروها"),`${r.vehicles.length} ${t("dash.vehicles","vehicles").toLowerCase()}`,`
    ${r.vehicles.length?`
      <div style="display:grid;gap:.75rem">
        ${r.vehicles.map(a=>`
          <div class="asset-row">
            <div class="asset-row__icon"><img src="${C(a.image)}" alt="" loading="lazy"></div>
            <div>
              <div class="asset-row__name">${s(a.model)}</div>
              <div class="asset-row__meta">
                ${s(t("dash.plate","Plate"))}: ${s(a.plate)} &middot;
                ${s(t("dash.garage","Garage"))}: ${s(a.garage)} &middot;
                ${I(a.mileage)} km
              </div>
            </div>
            <span class="badge ${a.state==="stored"?"badge--green":a.state==="impound"?"badge--red":"badge--orange"}">
              ${s(t("dash."+a.state,a.state))}
            </span>
          </div>`).join("")}
      </div>`:_({icon:"car",title:t("dash.noVehicles","No vehicles yet"),text:t("dash.noVehiclesText",""),action:`<a class="btn btn--gold" href="${f("shop.html")}?cat=vehicles">${s(t("nav.shop","Shop"))}</a>`})}`)}function X(){return v("properties",t("dash.properties","Properties"),"",`
    ${r.properties.length?`
      <div class="grid g-2">
        ${r.properties.map(a=>`
          <div class="card card--hover">
            <div class="flex flex-between items-center mb-4">
              <h4>${s(a.name)}</h4>
              <span class="badge badge--gold">${s(a.type)}</span>
            </div>
            <div class="char-grid" style="margin-top:0">
              <div class="char-stat"><div class="char-stat__label">${s(t("dash.district","منطقه"))}</div>
                <div class="char-stat__value">${s(a.district)}</div></div>
              <div class="char-stat"><div class="char-stat__label">${s(t("dash.storage","Storage"))}</div>
                <div class="char-stat__value">${I(a.storage)}</div></div>
              <div class="char-stat"><div class="char-stat__label">${s(t("dash.garage","Garage"))}</div>
                <div class="char-stat__value">${a.garage}</div></div>
              <div class="char-stat"><div class="char-stat__label">${s(t("dash.value","مقدار"))}</div>
                <div class="char-stat__value bank">${m(a.value)}</div></div>
            </div>
          </div>`).join("")}
      </div>`:_({icon:"home2",title:t("dash.noProperties","No properties yet"),text:t("dash.noPropertiesText",""),action:`<a class="btn btn--gold" href="${f("shop.html")}?cat=property">${s(t("nav.shop","Shop"))}</a>`})}`)}function Y(){return v("orders",t("dash.orders","Orders"),"",`
    ${r.orders.length?`
      <div class="card">
        <div class="table-wrap">
          <table class="table">
            <thead><tr>
              <th>${s(t("checkout.orderRef","سفارش"))}</th>
              <th>${s(t("cart.item","Item"))}</th>
              <th>${s(t("cart.total","Total"))}</th>
              <th>${s(t("checkout.payment","روش"))}</th>
              <th>${s(t("admin.statusLabel","Status"))}</th>
              <th>تاریخ</th>
            </tr></thead>
            <tbody>
              ${r.orders.map(a=>`
                <tr>
                  <td class="mono">${s(a.id)}</td>
                  <td>${a.items.map(i=>s(i.name)).join(", ")}</td>
                  <td class="num">${k(a.total)}</td>
                  <td>${s(a.method)}</td>
                  <td><span class="order-status order-status--${s(a.status)}">${s(a.status)}</span></td>
                  <td class="text-muted" style="font-size:.8rem">${s(x(a.date,!0))}</td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>
      </div>`:_({icon:"package",title:t("dash.noOrders","No orders yet"),text:t("dash.noOrdersText",""),action:`<a class="btn btn--gold" href="${f("shop.html")}">${s(t("nav.shop","Shop"))}</a>`})}`)}function aa(){let a=r.transactions[0]?.balanceAfter??0,i=[...r.transactions].reverse().map(e=>e.balanceAfter);return v("wallet",t("dash.wallet","Wallet"),"",`
    <div class="grid g-2">
      <div class="card">
        <div class="card__head"><h4>اعتبار فروشگاه</h4></div>
        <div style="font-family:var(--f-display);font-size:2.6rem;font-weight:800;color:var(--c-gold-light)">${k(a)}</div>
        <div id="wallet-spark" class="mt-4"></div>
        <p class="text-muted mt-4" style="font-size:.8rem">
          Credit can be used at checkout. It is issued by refunds and promotions and cannot be withdrawn as cash.
        </p>
      </div>
      <div class="card">
        <div class="card__head"><h4>${s(t("dash.transactions","تراکنش‌ها"))}</h4></div>
        <div class="table-wrap" style="border:0;background:none">
          <table class="table" style="min-width:0">
            <tbody>
              ${r.transactions.map(e=>`
                <tr>
                  <td style="font-size:.82rem">${s(e.label)}<br>
                    <span class="text-muted" style="font-size:.72rem">${s(x(e.date))} &middot; ${s(e.ref)}</span></td>
                  <td class="num" style="color:${e.amount>=0?"var(--c-success)":"var(--c-danger)"}">
                    ${e.amount>=0?"+":""}${k(e.amount)}</td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>`)}function sa(){return v("tickets",t("dash.tickets","تیکت‌های پشتیبانی"),"",`
    <div class="flex flex-between flex-wrap gap-3 mb-4">
      <span class="text-muted">${r.tickets.length} ${s(t("support.myTickets","tickets"))}</span>
      <a class="btn btn--gold btn--sm" href="${f("support.html")}#new">
        ${p("plus")}<span>${s(t("support.newTicket","New ticket"))}</span>
      </a>
    </div>
    ${r.tickets.length?`
      <div style="display:grid;gap:.75rem">
        ${r.tickets.map(a=>`
          <a class="ticket-row" href="${f("support.html")}?ticket=${encodeURIComponent(a.id)}">
            <span class="ticket-row__id">${s(a.id)}</span>
            <div>
              <div class="ticket-row__title">${s(a.subject)}</div>
              <div class="ticket-row__meta">
                <span>${s(a.category)}</span>
                <span>${s(t("support.updated","Updated"))} ${s(T(a.updated))}</span>
                <span>${a.messages.length} ${s(t("support.message","messages"))}</span>
              </div>
            </div>
            <span class="badge ${a.status==="closed"?"badge--grey":a.status==="answered"?"badge--green":"badge--orange"}">
              ${s(t("support.status"+a.status.charAt(0).toUpperCase()+a.status.slice(1),a.status))}
            </span>
          </a>`).join("")}
      </div>`:_({icon:"ticket",title:t("support.noTickets","No tickets yet"),text:t("support.noTicketsText","")})}`)}function ta(){return v("notifications",t("dash.notifications","Notifications"),"",`
    <div class="flex flex-between mb-4">
      <span class="text-muted">${r.notifications.filter(a=>!a.read).length} unread</span>
      <button class="btn btn--ghost btn--sm" id="notif-read-all">${s(t("dash.markAllRead","Mark all read"))}</button>
    </div>
    <div style="display:grid;gap:.6rem" id="notif-list">
      ${r.notifications.map(a=>`
        <div class="notif-row ${a.read?"":"is-unread"}" data-notif="${s(a.id)}">
          <span class="notif-row__icon">${p(a.icon||"bell")}</span>
          <div style="flex:1;min-width:0">
            <div class="notif-row__title">${s(a.title)}</div>
            <div class="notif-row__text">${s(a.text)}</div>
          </div>
          <span class="notif-row__time">${s(T(a.date))}</span>
        </div>`).join("")||_({icon:"bell",title:t("dash.noNotifs","Nothing new"),text:t("dash.noNotifsText","")})}
    </div>`)}function ea(){let a=y.user||{};return v("settings",t("dash.settings","تنظیمات"),"",`
    <div class="grid g-2">
      <div class="card">
        <div class="card__head"><h4>پروفایل</h4></div>
        <form id="profile-form" novalidate>
          <div class="field">
            <label for="pf-username">${s(t("auth.username","نام کاربری"))}</label>
            <input class="input" id="pf-username" name="username" value="${s(a.username||"")}" autocomplete="username">
          </div>
          <div class="field">
            <label for="pf-email">${s(t("auth.email","Email address"))}</label>
            <input class="input" id="pf-email" name="email" type="email" value="${s(a.email||"")}" autocomplete="email">
          </div>
          <div class="field">
            <label for="pf-lang">زبان ترجیحی</label>
            <select class="select" id="pf-lang" name="lang">
              <option value="fa">فارسی</option>
              <option value="en">English</option>
            </select>
          </div>
          <button class="btn btn--gold" type="submit">${s(t("common.save","Save"))}</button>
        </form>
      </div>

      <div class="card">
        <div class="card__head"><h4>${s(t("dash.linkGame","Link your game account"))}</h4></div>
        <div style="display:grid;gap:.75rem">
          <div class="conn-row">
            <span style="color:#5865f2">${p("discord")}</span>
            <div>
              <div class="conn-row__name">Discord</div>
              <div class="conn-row__detail">${a.discordId?s(a.discordId):s(t("dash.notLinked","Not linked"))}</div>
            </div>
            <span class="conn-row__state">
              ${a.discordId?`<span class="badge badge--green">${s(t("dash.linked","Linked"))}</span>`:`<button class="btn btn--discord btn--sm" id="link-discord">${s(t("auth.withDiscord","Connect"))}</button>`}
            </span>
          </div>
          <div class="conn-row">
            <span style="color:var(--c-gold)">${p("server")}</span>
            <div>
              <div class="conn-row__name">شناسه VMP</div>
              <div class="conn-row__detail">${a.gameLicense?s(a.gameLicense):s(t("dash.notLinked","Not linked"))}</div>
            </div>
            <span class="conn-row__state">
              <span class="badge ${a.gameLicense?"badge--green":"badge--grey"}">
                ${s(a.gameLicense?t("dash.linked","Linked"):t("dash.notLinked","Not linked"))}
              </span>
            </span>
          </div>
        </div>
        <p class="text-muted mt-4" style="font-size:.82rem">${s(t("dash.linkGameText",""))}</p>
      </div>
    </div>`)}function ia(){let a=y.user||{};return v("security",t("dash.security","امنیت"),"",`
    <div class="grid g-2">
      <div class="card">
        <div class="card__head"><h4>${s(t("dash.changePassword","تغییر رمز عبور"))}</h4></div>
        <form id="pass-form" novalidate>
          <div class="field">
            <label for="pw-current">${s(t("dash.currentPassword","رمز عبور فعلی"))}</label>
            <div class="input-group">
              <input class="input" id="pw-current" name="current" type="password" autocomplete="current-password">
              <button class="toggle-pass" type="button" aria-label="Show password"></button>
            </div>
          </div>
          <div class="field">
            <label for="pw-new">${s(t("dash.newPassword","New password"))}</label>
            <div class="input-group">
              <input class="input" id="pw-new" name="next" type="password" autocomplete="new-password">
              <button class="toggle-pass" type="button" aria-label="Show password"></button>
            </div>
            <div class="pw-meter"><span id="pw-meter-bar"></span></div>
            <span class="field__hint" id="pw-hint">حداقل ۸ کاراکتر، شامل حرف و عدد</span>
          </div>
          <button class="btn btn--gold" type="submit">${s(t("common.save","Save"))}</button>
        </form>
      </div>

      <div class="card">
        <div class="card__head"><h4>${s(t("dash.activity","فعالیت حساب"))}</h4></div>
        <div class="activity">
          ${[["ورود از دستگاه جدید","2026-10-15T20:33:00Z"],["رمز عبور تغییر کرد","2026-09-28T14:02:00Z"],["حساب دیسکورد متصل شد","2026-08-02T09:40:00Z"],["حساب ساخته شد",a.createdAt||"2026-01-11T12:00:00Z"]].map(([i,e])=>`
            <div class="activity-item">
              <span class="activity-item__dot"></span>
              <div>
                <div class="activity-item__text">${s(i)}</div>
                <div class="activity-item__time">${s(x(e,!0))}</div>
              </div>
            </div>`).join("")}
        </div>
        <hr class="mt-4">
        <p class="text-muted mt-4" style="font-size:.8rem">
          ${p("shield")} Nobody from the team will ever ask you for your password, in-game or on Discord.
        </p>
      </div>
    </div>`)}function B(){let a=c("#dash-main");if(!a)return;a.innerHTML=[J(),K(),Q(),X(),Y(),aa(),sa(),ta(),ea(),ia()].join("");let i=F("demo.dashboard","This dashboard shows a sample character. Once the VMP server is connected it will show your real character, money, job, vehicles and properties."),e=c("#dash-demo");e&&(e.innerHTML=i);let n=c("#dash-demo-char");n&&(n.innerHTML=i),da()}function da(){E("[data-goto]").forEach(e=>e.addEventListener("click",()=>S(e.dataset.goto)));let a=c("#wallet-spark");a&&H(a,[...r.transactions].reverse().map(e=>e.balanceAfter),{width:260,height:54}),c("#notif-read-all")?.addEventListener("click",async()=>{r.notifications.forEach(e=>{e.read=!0}),R()&&await Promise.allSettled(r.notifications.map(e=>h.readNotif(e.id))),E("#notif-list .notif-row").forEach(e=>e.classList.remove("is-unread")),D(),u.success(t("common.saved","Saved"))}),c("#profile-form")?.addEventListener("submit",async e=>{e.preventDefault();let{valid:n,values:d}=M(e.target,{username:[g.required,g.username],email:[g.required,g.email]});if(!n)return;if(A()){u.warn(t("toast.demoAction","حالت نمایشی — این عملیات هیچ‌جا ذخیره نمی‌شود."));return}let o=j(e.target.querySelector("button[type=submit]"));try{await h.patch("/me/profile",d),u.success(t("dash.profileSaved","Profile saved"))}catch(N){u.error(N.message)}o()});let i=c("#pw-new");i?.addEventListener("input",()=>{let e=q(i.value),n=c("#pw-meter-bar");n&&(n.style.width=e.pct+"%",n.style.background=e.color);let d=c("#pw-hint");d&&(d.textContent=i.value?e.label:"حداقل ۸ کاراکتر، شامل حرف و عدد")}),c("#pass-form")?.addEventListener("submit",async e=>{e.preventDefault();let{valid:n,values:d}=M(e.target,{current:[g.required],next:[g.required,g.password]});if(!n)return;if(A()){u.warn(t("toast.demoAction","حالت نمایشی — این عملیات هیچ‌جا ذخیره نمی‌شود."));return}let o=j(e.target.querySelector("button[type=submit]"));try{await h.changePass({currentPassword:d.current,newPassword:d.next}),u.success(t("common.saved","Saved")),e.target.reset()}catch(N){u.error(N.message)}o()}),c("#link-discord")?.addEventListener("click",()=>y.loginWithDiscord())}function S(a){E(".dash-section").forEach(i=>i.classList.toggle("is-active",i.dataset.panel===a)),E("#dash-aside [data-section]").forEach(i=>i.classList.toggle("is-active",i.dataset.section===a)),location.hash.slice(1)!==a&&history.replaceState({},"","#"+a),window.scrollTo({top:0,behavior:"smooth"})}async function ra(){if(!await V("user"))return;await Z(),D(),B(),c("#dash-burger")?.addEventListener("click",()=>{c("#dash-aside")?.classList.add("is-open"),c("#dash-backdrop")?.classList.add("is-open")}),c("#dash-backdrop")?.addEventListener("click",()=>{c("#dash-aside")?.classList.remove("is-open"),c("#dash-backdrop")?.classList.remove("is-open")});let i=(location.hash||"#overview").slice(1);S(z.some(e=>e.id===i)?i:"overview"),window.addEventListener("hashchange",()=>{let e=location.hash.slice(1);z.some(n=>n.id===e)&&S(e)}),G(()=>{let e=location.hash.slice(1)||"overview";D(),B(),S(e)}),U()}var ga={init:ra};export{ga as default,ra as init};
