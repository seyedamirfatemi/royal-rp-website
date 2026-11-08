import{b as g,c as d,d as r,g as b,m as w}from"./chunk-J7TKWPPN.js";import"./chunk-MWRI3OKJ.js";import{b as v}from"./chunk-KIK4IJKS.js";import{b as h}from"./chunk-OCIUYIWP.js";import{A as u,E as y,L,b as n,e as c,g as $,i as m,l as e}from"./chunk-W2AEBEJL.js";var o=[],l=w("tag","all");function x(){return["all",...new Set(o.map(a=>a.tag))]}function p(){let a=m("#gallery-root");if(!a)return;let f=l==="all"?o:o.filter(t=>t.tag===l);a.innerHTML=`
    <div class="chip-row mb-6" id="gal-chips">
      ${x().map(t=>`
        <button class="chip ${l===t?"is-active":""}" data-tag="${e(t)}">
          ${e(t==="all"?c("gallery.all","همه"):d(g,t))}
        </button>`).join("")}
    </div>

    ${f.length?`
      <div class="gallery-grid">
        ${f.map((t,i)=>`
          <figure class="gallery-item ${t.size==="wide"?"gallery-item--wide":t.size==="tall"?"gallery-item--tall":""}"
                  data-reveal style="--d:${i*45}ms"
                  data-lightbox="${n(t.src)}" data-caption="${e(r(t,"title"))}">
            <img src="${n(t.src)}" alt="${e(r(t,"title"))}" loading="lazy">
            <figcaption class="gallery-item__overlay">
              <span>${e(d(g,t.tag))}</span>
              <h5>${e(r(t,"title"))}</h5>
            </figcaption>
          </figure>`).join("")}
      </div>`:L({icon:"gallery",title:c("common.noResults","No results found")})}`,m("#gal-chips")?.addEventListener("click",t=>{let i=t.target.closest("[data-tag]");if(!i)return;l=i.dataset.tag;let s=new URL(location.href);l==="all"?s.searchParams.delete("tag"):s.searchParams.set("tag",l),history.replaceState({},"",s),p()}),u(a),y("[data-lightbox]",a)}async function R(){let{data:a}=await b(()=>h.gallery(),()=>({items:v.GALLERY}));o=a.items||a,p(),$(p)}var M={init:R};export{M as default,R as init};
