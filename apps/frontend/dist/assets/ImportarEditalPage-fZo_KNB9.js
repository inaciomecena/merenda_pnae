import{p as F,q as w,r as x,s as A,t as N,j as t,b as O,v as s,w as T,x as C,y as j,z as I,E as q,F as b,G as U,H as E,c as R,u as H,S as f,T as m,L as K,f as V}from"./index-DdgVLLzi.js";import{A as X,C as D,a as M}from"./CardContent-ClY_wZd5.js";import{B as P}from"./Button-CbW9aW7X.js";function _(a){return F("MuiLinearProgress",a)}w("MuiLinearProgress",["root","colorPrimary","colorSecondary","determinate","indeterminate","buffer","query","dashed","dashedColorPrimary","dashedColorSecondary","bar","bar1","bar2","barColorPrimary","barColorSecondary","bar1Indeterminate","bar1Determinate","bar1Buffer","bar2Indeterminate","bar2Buffer"]);const $=4,k=q`
  0% {
    left: -35%;
    right: 100%;
  }

  60% {
    left: 100%;
    right: -90%;
  }

  100% {
    left: 100%;
    right: -90%;
  }
`,G=typeof k!="string"?I`
        animation: ${k} 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
      `:null,L=q`
  0% {
    left: -200%;
    right: 100%;
  }

  60% {
    left: 107%;
    right: -8%;
  }

  100% {
    left: 107%;
    right: -8%;
  }
`,W=typeof L!="string"?I`
        animation: ${L} 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite;
      `:null,B=q`
  0% {
    opacity: 1;
    background-position: 0 -23px;
  }

  60% {
    opacity: 0;
    background-position: 0 -23px;
  }

  100% {
    opacity: 1;
    background-position: -200px -23px;
  }
`,J=typeof B!="string"?I`
        animation: ${B} 3s infinite linear;
      `:null,Q=a=>{const{classes:r,variant:e,color:o}=a,l={root:["root",`color${s(o)}`,e],dashed:["dashed",`dashedColor${s(o)}`],bar1:["bar","bar1",`barColor${s(o)}`,(e==="indeterminate"||e==="query")&&"bar1Indeterminate",e==="determinate"&&"bar1Determinate",e==="buffer"&&"bar1Buffer"],bar2:["bar","bar2",e!=="buffer"&&`barColor${s(o)}`,e==="buffer"&&`color${s(o)}`,(e==="indeterminate"||e==="query")&&"bar2Indeterminate",e==="buffer"&&"bar2Buffer"]};return T(l,_,r)},S=(a,r)=>a.vars?a.vars.palette.LinearProgress[`${r}Bg`]:a.palette.mode==="light"?U(a.palette[r].main,.62):E(a.palette[r].main,.5),Y=C("span",{name:"MuiLinearProgress",slot:"Root",overridesResolver:(a,r)=>{const{ownerState:e}=a;return[r.root,r[`color${s(e.color)}`],r[e.variant]]}})(j(({theme:a})=>({position:"relative",overflow:"hidden",display:"block",height:4,zIndex:0,"@media print":{colorAdjust:"exact"},variants:[...Object.entries(a.palette).filter(b()).map(([r])=>({props:{color:r},style:{backgroundColor:S(a,r)}})),{props:({ownerState:r})=>r.color==="inherit"&&r.variant!=="buffer",style:{"&::before":{content:'""',position:"absolute",left:0,top:0,right:0,bottom:0,backgroundColor:"currentColor",opacity:.3}}},{props:{variant:"buffer"},style:{backgroundColor:"transparent"}},{props:{variant:"query"},style:{transform:"rotate(180deg)"}}]}))),Z=C("span",{name:"MuiLinearProgress",slot:"Dashed",overridesResolver:(a,r)=>{const{ownerState:e}=a;return[r.dashed,r[`dashedColor${s(e.color)}`]]}})(j(({theme:a})=>({position:"absolute",marginTop:0,height:"100%",width:"100%",backgroundSize:"10px 10px",backgroundPosition:"0 -23px",variants:[{props:{color:"inherit"},style:{opacity:.3,backgroundImage:"radial-gradient(currentColor 0%, currentColor 16%, transparent 42%)"}},...Object.entries(a.palette).filter(b()).map(([r])=>{const e=S(a,r);return{props:{color:r},style:{backgroundImage:`radial-gradient(${e} 0%, ${e} 16%, transparent 42%)`}}})]})),J||{animation:`${B} 3s infinite linear`}),rr=C("span",{name:"MuiLinearProgress",slot:"Bar1",overridesResolver:(a,r)=>{const{ownerState:e}=a;return[r.bar,r.bar1,r[`barColor${s(e.color)}`],(e.variant==="indeterminate"||e.variant==="query")&&r.bar1Indeterminate,e.variant==="determinate"&&r.bar1Determinate,e.variant==="buffer"&&r.bar1Buffer]}})(j(({theme:a})=>({width:"100%",position:"absolute",left:0,bottom:0,top:0,transition:"transform 0.2s linear",transformOrigin:"left",variants:[{props:{color:"inherit"},style:{backgroundColor:"currentColor"}},...Object.entries(a.palette).filter(b()).map(([r])=>({props:{color:r},style:{backgroundColor:(a.vars||a).palette[r].main}})),{props:{variant:"determinate"},style:{transition:`transform .${$}s linear`}},{props:{variant:"buffer"},style:{zIndex:1,transition:`transform .${$}s linear`}},{props:({ownerState:r})=>r.variant==="indeterminate"||r.variant==="query",style:{width:"auto"}},{props:({ownerState:r})=>r.variant==="indeterminate"||r.variant==="query",style:G||{animation:`${k} 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite`}}]}))),ar=C("span",{name:"MuiLinearProgress",slot:"Bar2",overridesResolver:(a,r)=>{const{ownerState:e}=a;return[r.bar,r.bar2,r[`barColor${s(e.color)}`],(e.variant==="indeterminate"||e.variant==="query")&&r.bar2Indeterminate,e.variant==="buffer"&&r.bar2Buffer]}})(j(({theme:a})=>({width:"100%",position:"absolute",left:0,bottom:0,top:0,transition:"transform 0.2s linear",transformOrigin:"left",variants:[...Object.entries(a.palette).filter(b()).map(([r])=>({props:{color:r},style:{"--LinearProgressBar2-barColor":(a.vars||a).palette[r].main}})),{props:({ownerState:r})=>r.variant!=="buffer"&&r.color!=="inherit",style:{backgroundColor:"var(--LinearProgressBar2-barColor, currentColor)"}},{props:({ownerState:r})=>r.variant!=="buffer"&&r.color==="inherit",style:{backgroundColor:"currentColor"}},{props:{color:"inherit"},style:{opacity:.3}},...Object.entries(a.palette).filter(b()).map(([r])=>({props:{color:r,variant:"buffer"},style:{backgroundColor:S(a,r),transition:`transform .${$}s linear`}})),{props:({ownerState:r})=>r.variant==="indeterminate"||r.variant==="query",style:{width:"auto"}},{props:({ownerState:r})=>r.variant==="indeterminate"||r.variant==="query",style:W||{animation:`${L} 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite`}}]}))),er=x.forwardRef(function(r,e){const o=A({props:r,name:"MuiLinearProgress"}),{className:l,color:g="primary",value:p,valueBuffer:v,variant:i="indeterminate",...c}=o,n={...o,color:g,variant:i},u=Q(n),z=N(),h={},y={bar1:{},bar2:{}};if((i==="determinate"||i==="buffer")&&p!==void 0){h["aria-valuenow"]=Math.round(p),h["aria-valuemin"]=0,h["aria-valuemax"]=100;let d=p-100;z&&(d=-d),y.bar1.transform=`translateX(${d}%)`}if(i==="buffer"&&v!==void 0){let d=(v||0)-100;z&&(d=-d),y.bar2.transform=`translateX(${d}%)`}return t.jsxs(Y,{className:O(u.root,l),ownerState:n,role:"progressbar",...h,ref:e,...c,children:[i==="buffer"?t.jsx(Z,{className:u.dashed,ownerState:n}):null,t.jsx(rr,{className:u.bar1,ownerState:n,style:y.bar1}),i==="determinate"?null:t.jsx(ar,{className:u.bar2,ownerState:n,style:y.bar2})]})}),tr=R(t.jsx("path",{d:"M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96M14 13v4h-4v-4H7l5-5 5 5z"}),"CloudUpload"),nr=R(t.jsx("path",{d:"M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5m0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5m0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5M7 19h14v-2H7zm0-6h14v-2H7zm0-8v2h14V5z"}),"FormatListBulleted");function lr(){const a=H(),[r,e]=x.useState(null),[o,l]=x.useState(""),[g,p]=x.useState(!1),v=async()=>{var i,c;if(!r){l("Selecione um arquivo PDF.");return}p(!0),l("");try{const n=new FormData;n.append("arquivo",r),n.append("processarAutomaticamente","true");const u=await V.post("/importacoes/pdf",n,{headers:{"Content-Type":"multipart/form-data"}});a(`/importacoes/${u.data.data.id}`)}catch(n){l(((c=(i=n==null?void 0:n.response)==null?void 0:i.data)==null?void 0:c.message)||"Não foi possível enviar o PDF.")}finally{p(!1)}};return t.jsxs(f,{spacing:3,children:[t.jsxs(f,{spacing:.5,children:[t.jsx(m,{variant:"h4",fontWeight:700,children:"Importar Edital"}),t.jsx(m,{variant:"body1",color:"text.secondary",children:"O motor lê PDFs pesquisáveis, extrai os itens e abre a conferência antes da confirmação final."})]}),g?t.jsx(er,{}):null,o?t.jsx(X,{severity:"error",children:o}):null,t.jsx(D,{children:t.jsx(M,{children:t.jsxs(f,{spacing:2,children:[t.jsx(m,{variant:"h6",children:"Upload manual"}),t.jsxs(P,{component:"label",variant:"outlined",startIcon:t.jsx(tr,{}),children:[r?r.name:"Selecionar PDF",t.jsx("input",{hidden:!0,type:"file",accept:"application/pdf,.pdf",onChange:i=>{var c;return e(((c=i.target.files)==null?void 0:c[0])||null)}})]}),t.jsxs(f,{direction:"row",spacing:1,children:[t.jsx(P,{variant:"contained",onClick:()=>void v(),disabled:g,children:"Enviar e processar"}),t.jsx(P,{component:K,to:"/importacoes",variant:"text",startIcon:t.jsx(nr,{}),children:"Voltar para a fila"})]})]})})}),t.jsx(D,{children:t.jsx(M,{children:t.jsxs(f,{spacing:1,children:[t.jsx(m,{variant:"h6",children:"Pasta automática"}),t.jsx(m,{variant:"body2",color:"text.secondary",children:"Arquivos PDF colocados em `C:\\Projetos\\sagae_pnae\\docs` são sincronizados automaticamente no backend."})]})})})]})}export{lr as default};
