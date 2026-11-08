import{a as u}from"./chunk-GICZ4Y7Y.js";import{e as b,m as g}from"./chunk-J7TKWPPN.js";import"./chunk-MWRI3OKJ.js";import"./chunk-KIK4IJKS.js";import{a as f,b as x}from"./chunk-OCIUYIWP.js";import{M as v,N as n,P as w,Q as $,R as S,c as l,e,g as _,i,l as t,p as s,x as d,y as q}from"./chunk-W2AEBEJL.js";function y(){let o=g("next");if(!o)return l("dashboard.html");try{let a=new URL(o,location.origin);return a.origin===location.origin?a.pathname+a.search+a.hash:l("dashboard.html")}catch{return l("dashboard.html")}}function L(){let o=i("#auth-form-root");o&&(o.innerHTML=`
    <div class="auth-box__head">
      <h1 style="font-size:2rem">${t(e("auth.loginTitle","خوش آمدید"))}</h1>
      <p>${t(e("auth.loginSub",""))}</p>
    </div>

    ${b()?`<div class="demo-banner">${s("warning")}
      <span><strong>${t(e("demo.badge","DEMO DATA"))}</strong> &mdash; ${t(e("auth.demoNote",""))}</span>
    </div>`:""}

    <button class="btn btn--discord btn--block btn--lg" id="discord-btn">
      ${s("discord")}<span>${t(e("auth.withDiscord","ادامه با دیسکورد"))}</span>
    </button>

    <div class="auth-divider">${t(e("auth.orContinue","or continue with"))}</div>

    <form id="login-form" novalidate>
      <div class="field">
        <label for="lg-email">${t(e("auth.email","Email address"))}</label>
        <div class="input-group">
          ${s("mail","input-group__icon")}
          <input class="input" id="lg-email" name="email" type="email" autocomplete="email"
                 placeholder="you@example.com" required>
        </div>
      </div>

      <div class="field">
        <label for="lg-pass">${t(e("auth.password","Password"))}</label>
        <div class="input-group">
          ${s("lock","input-group__icon")}
          <input class="input" id="lg-pass" name="password" type="password" autocomplete="current-password" required>
          <button class="toggle-pass" type="button" aria-label="Show password"></button>
        </div>
      </div>

      <div class="flex flex-between flex-wrap gap-3 mb-4">
        <label class="check">
          <input type="checkbox" name="remember" checked>
          <span class="check__box">${s("check")}</span>
          <span>${t(e("auth.remember","Keep me signed in"))}</span>
        </label>
        <button class="link-sweep" type="button" id="forgot-btn"
                style="color:var(--c-gold);font-size:.84rem">${t(e("auth.forgot","Forgot your password?"))}</button>
      </div>

      <button class="btn btn--gold btn--block btn--lg" type="submit">
        ${s("login")}<span>${t(e("auth.signIn","Sign in"))}</span>
      </button>
    </form>

    <p class="text-center mt-6" style="font-size:.9rem">
      ${t(e("auth.noAccount","حساب کاربری ندارید؟"))}
      <a class="link-sweep" href="${l("register.html")}${g("next")?"?next="+encodeURIComponent(g("next")):""}">
        ${t(e("auth.signUp","ساخت حساب"))}
      </a>
    </p>`,$(o),i("#discord-btn").addEventListener("click",()=>u.loginWithDiscord()),i("#forgot-btn").addEventListener("click",()=>{let a=q({title:e("auth.forgot","Forgot your password?"),body:`
        <p class="mb-4">ایمیل حساب خود را وارد کنید تا لینک بازیابی ارسال شود.</p>
        <div class="field">
          <label for="fp-email">${t(e("auth.email","Email address"))}</label>
          <input class="input" id="fp-email" type="email" autocomplete="email">
        </div>
        <p class="text-muted" style="font-size:.8rem">
          If you signed up with Discord you do not have a password — use the Discord button instead.
        </p>`,footer:`<button class="btn btn--dark" data-cancel>${t(e("common.cancel","Cancel"))}</button>
               <button class="btn btn--gold" data-send>${t(e("common.send","Send"))}</button>`});a.el.querySelector("[data-cancel]").addEventListener("click",a.close),a.el.querySelector("[data-send]").addEventListener("click",async()=>{let r=a.el.querySelector("#fp-email").value.trim();if(r){if(!b())try{await x.forgotPass({email:r})}catch{}d.info(e("auth.resetSent","If that address exists, a reset link is on its way.")),a.close()}})}),i("#login-form").addEventListener("submit",async a=>{a.preventDefault();let{valid:r,values:c}=w(a.target,{email:[n.required,n.email],password:[n.required]});if(!r)return;let p=a.target.querySelector("button[type=submit]"),h=v(p);try{await u.login(c),d.success(e("auth.welcomeBack","وارد شدید. خوش آمدید.")),setTimeout(()=>{window.location.href=y()},450)}catch(m){h(),d.error(m instanceof f?m.message:"ورود ناموفق بود")}}))}function E(){let o=i("#auth-form-root");if(!o)return;o.innerHTML=`
    <div class="auth-box__head">
      <h1 style="font-size:2rem">${t(e("auth.registerTitle","ساخت حساب کاربری"))}</h1>
      <p>${t(e("auth.registerSub",""))}</p>
    </div>

    ${b()?`<div class="demo-banner">${s("warning")}
      <span><strong>${t(e("demo.badge","DEMO DATA"))}</strong> &mdash; ${t(e("auth.demoNote",""))}</span>
    </div>`:""}

    <button class="btn btn--discord btn--block btn--lg" id="discord-btn">
      ${s("discord")}<span>${t(e("auth.withDiscord","ادامه با دیسکورد"))}</span>
    </button>

    <div class="auth-divider">${t(e("auth.orContinue","or continue with"))}</div>

    <form id="register-form" novalidate>
      <div class="field">
        <label for="rg-user">${t(e("auth.username","نام کاربری"))}</label>
        <div class="input-group">
          ${s("user","input-group__icon")}
          <input class="input" id="rg-user" name="username" autocomplete="username" placeholder="3-20 characters" required>
        </div>
      </div>

      <div class="field">
        <label for="rg-email">${t(e("auth.email","Email address"))}</label>
        <div class="input-group">
          ${s("mail","input-group__icon")}
          <input class="input" id="rg-email" name="email" type="email" autocomplete="email" required>
        </div>
      </div>

      <div class="field">
        <label for="rg-pass">${t(e("auth.password","Password"))}</label>
        <div class="input-group">
          ${s("lock","input-group__icon")}
          <input class="input" id="rg-pass" name="password" type="password" autocomplete="new-password" required>
          <button class="toggle-pass" type="button" aria-label="Show password"></button>
        </div>
        <div class="pw-meter"><span id="rg-meter"></span></div>
        <span class="field__hint" id="rg-hint">حداقل ۸ کاراکتر، شامل حرف و عدد</span>
      </div>

      <div class="field">
        <label for="rg-pass2">${t(e("auth.passwordConfirm","تکرار رمز عبور"))}</label>
        <div class="input-group">
          ${s("lock","input-group__icon")}
          <input class="input" id="rg-pass2" name="password2" type="password" autocomplete="new-password" required>
          <button class="toggle-pass" type="button" aria-label="Show password"></button>
        </div>
      </div>

      <label class="check mb-4">
        <input type="checkbox" name="terms">
        <span class="check__box">${s("check")}</span>
        <span>${t(e("auth.acceptTerms","I accept the Terms of Service and Privacy Policy."))}
          <a class="link-sweep" href="${l("terms.html")}" target="_blank">${t(e("legal.terms","Terms"))}</a> ·
          <a class="link-sweep" href="${l("privacy.html")}" target="_blank">${t(e("legal.privacy","Privacy"))}</a>
        </span>
      </label>

      <label class="check mb-4">
        <input type="checkbox" name="age">
        <span class="check__box">${s("check")}</span>
        <span>${t(e("auth.age","I confirm I am at least 16 years old."))}</span>
      </label>

      <button class="btn btn--gold btn--block btn--lg" type="submit">
        ${s("user")}<span>${t(e("auth.signUp","ساخت حساب"))}</span>
      </button>
    </form>

    <p class="text-center mt-6" style="font-size:.9rem">
      ${t(e("auth.haveAccount","قبلاً حساب دارید؟"))}
      <a class="link-sweep" href="${l("login.html")}">${t(e("auth.signIn","Sign in"))}</a>
    </p>`,$(o),i("#discord-btn").addEventListener("click",()=>u.loginWithDiscord());let a=i("#rg-pass");a.addEventListener("input",()=>{let r=S(a.value),c=i("#rg-meter");c.style.width=a.value?r.pct+"%":"0",c.style.background=r.color,i("#rg-hint").textContent=a.value?r.label:"حداقل ۸ کاراکتر، شامل حرف و عدد"}),i("#register-form").addEventListener("submit",async r=>{r.preventDefault();let{valid:c,values:p}=w(r.target,{username:[n.required,n.username],email:[n.required,n.email],password:[n.required,n.password],password2:[n.required,n.match("password","رمزهای عبور یکسان نیستند")],terms:[n.accepted],age:[n.accepted]});if(!c)return;let h=r.target.querySelector("button[type=submit]"),m=v(h);try{await u.register({username:p.username,email:p.email,password:p.password,acceptedTerms:!0,confirmedAge:!0}),d.success(e("auth.created","حساب ساخته شد. به رویال آر‌پی خوش آمدید.")),setTimeout(()=>{window.location.href=y()},500)}catch(k){m(),d.error(k instanceof f?k.message:"ثبت‌نام ناموفق بود")}})}async function D(){if(u.isLoggedIn){window.location.href=y();return}let a=document.body.dataset.page==="register"?E:L;a(),_(a)}var O={init:D};export{O as default,D as init};
