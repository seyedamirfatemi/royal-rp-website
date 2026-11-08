import{a as c,b as N}from"./chunk-FMVTN7RD.js";import"./chunk-TYJGKO4M.js";import"./chunk-OFD54N75.js";import{a as C,e as g,g as L}from"./chunk-HRWNYBPI.js";import"./chunk-GICZ4Y7Y.js";import{f as k,g as f,k as n}from"./chunk-J7TKWPPN.js";import"./chunk-MWRI3OKJ.js";import{b as m}from"./chunk-KIK4IJKS.js";import{b as u}from"./chunk-OCIUYIWP.js";import{A as _,L as P,a as r,e as t,g as x,i as d,l as s,p as v,r as l,v as w}from"./chunk-W2AEBEJL.js";var p=[],y=[];function h(e){let i=d("#status-root");if(!i||!e)return;i.innerHTML=`
    ${k("demo.status","این اعداد شبیه‌سازی شده‌اند. برای داده زنده، بک‌اند را به سرور FiveM متصل کنید.")}

    <div class="card card--gold-edge mb-6">
      <div class="flex flex-between flex-wrap gap-5 items-center">
        <div>
          <h2 style="font-size:1.5rem">${s(e.hostname||r.site.name)}</h2>
          <div class="flex gap-3 items-center flex-wrap mt-4">
            <span class="status-pill ${e.demo?"status-pill--demo":e.online?"status-pill--online":"status-pill--offline"}">
              <span class="live-dot ${e.online?"":"live-dot--off"}"></span>
              ${s(e.demo?t("status.demo","داده نمایشی"):e.online?t("common.online","Online"):t("common.offline","Offline"))}
            </span>
            <span class="text-muted" style="font-size:.86rem">${s(e.gametype||"رول‌پلی")} &middot; ${s(e.mapname||"Los Santos")} &middot; ${s(r.server.region)}</span>
          </div>
        </div>
        <div class="ip-box">
          <code>${s(r.server.ip)}</code>
          <button class="btn btn--ghost btn--sm" data-copy="${s(r.server.ip)}">${v("copy")}</button>
        </div>
        <button class="btn btn--gold" data-connect>${v("play")}<span>${s(t("common.connect","Connect"))}</span></button>
      </div>

      <div class="mt-6">
        <div class="flex flex-between" style="font-size:.85rem;margin-bottom:.5rem">
          <span class="text-muted">${s(t("status.players","Players online"))}</span>
          <span class="mono text-gold">${l(e.players)} / ${l(e.maxPlayers)}</span>
        </div>
        <div class="progress"><i style="width:${(e.players/e.maxPlayers*100).toFixed(1)}%"></i></div>
      </div>
    </div>

    <div class="kpi-grid mb-6">
      ${n({iconName:"users",label:t("status.players","Players online"),value:l(e.players)})}
      ${n({iconName:"list",label:t("status.queue","In queue"),value:l(e.queue)})}
      ${n({iconName:"clock",label:t("status.uptime","Uptime"),value:N(e.uptimeSeconds)})}
      ${n({iconName:"activity",label:t("status.tick","تیک سرور"),value:(e.tickMs??"—")+"ms"})}
    </div>

    <div class="grid g-2 mb-6">
      <div class="chart-card">
        <div class="chart-card__head"><h4>${s(t("status.curve","بازیکنان در ۲۴ ساعت"))}</h4></div>
        <div class="chart-box" id="status-curve"></div>
      </div>
      <div class="card">
        <div class="card__head"><h4>سلامتی</h4></div>
        <div class="monitor-grid">
          <div class="gauge" id="status-cpu"></div>
          <div class="gauge" id="status-mem"></div>
        </div>
        <div style="display:grid;gap:.5rem;font-size:.86rem;margin-top:1rem">
          <div class="flex flex-between"><span class="text-muted">Framework</span><span class="mono">${s(e.framework||"—")}</span></div>
          <div class="flex flex-between"><span class="text-muted">${s(t("status.resources","منابع در حال اجرا"))}</span><span class="mono">${l(e.resourceCount)}</span></div>
          <div class="flex flex-between"><span class="text-muted">${s(t("status.lastRestart","Last restart"))}</span><span>${s(w(e.lastRestart))}</span></div>
        </div>
      </div>
    </div>

    <div class="grid g-2">
      <div class="card">
        <div class="card__head">
          <h4>${s(t("status.playerList","چه کسانی آنلاین‌اند"))}</h4>
          <span class="text-muted" style="font-size:.8rem">${p.length}</span>
        </div>
        ${p.length?`
          <div class="table-wrap" style="max-height:420px">
            <table class="table" style="min-width:0">
              <thead><tr><th>#</th><th>نام</th><th>Job</th><th>Ping</th></tr></thead>
              <tbody>
                ${p.map(a=>`
                  <tr>
                    <td class="num">${a.serverId}</td>
                    <td>${s(a.name)}</td>
                    <td><span class="badge badge--grey">${s(a.job)}</span></td>
                    <td class="num" style="color:${a.ping>120?"var(--c-warn)":"var(--c-success)"}">${a.ping}ms</td>
                  </tr>`).join("")}
              </tbody>
            </table>
          </div>`:P({icon:"users",title:t("status.noPlayers","Nobody is in the city right now.")})}
      </div>

      <div class="card">
        <div class="card__head">
          <h4>${s(t("status.resourceList","Resources"))}</h4>
          <span class="text-muted" style="font-size:.8rem">${y.length}</span>
        </div>
        <div style="max-height:420px;overflow-y:auto">
          ${y.map(a=>`
            <div class="resource-row">
              <span class="resource-row__name">${s(a.name)}</span>
              <span class="resource-row__ms">${a.ms.toFixed(2)}ms</span>
              <span class="resource-row__state">
                <span class="badge ${a.state==="started"?"badge--green":"badge--red"}">${s(a.state)}</span>
              </span>
            </div>`).join("")}
        </div>
      </div>
    </div>`;let o=d("#status-curve");o&&L(o,()=>C(o,m.demoPlayerCurve(24),{color:"#ffd700"}));let $=d("#status-cpu");$&&g($,e.cpuPercent??0,{label:t("status.cpu","CPU load")});let b=d("#status-mem");b&&g(b,e.memoryPercent??0,{label:t("status.memory","Memory")}),i.querySelectorAll("[data-copy]").forEach(a=>a.addEventListener("click",()=>navigator.clipboard?.writeText(a.dataset.copy))),_(i)}async function z(){let[e,i]=await Promise.all([f(()=>u.players(),()=>({items:m.demoPlayers(24)})),f(()=>u.resources(),()=>({items:m.demoResources()}))]);p=e.data.items||e.data,y=i.data.items||i.data;let o=await c.fetch();h(o),c.onUpdate(h),c.start(),x(()=>h(c.data))}var A={init:z};export{A as default,z as init};
