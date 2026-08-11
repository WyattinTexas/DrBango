/* ═══════════════════════════════════════════════════════════════════════════════════════════
   ENV-LAW.JS — window.EL (shared 3D world grammar) + window.EnvGen (the generator).
   BACKLOT engine per BACKLOT-DESIGN.md §2–§8. file:// clean, classic script, no modules.

   HARD LAWS: deterministic (mulberry32 only — no Math.random, no Date.now in build paths);
   no custom shaders; no InstancedMesh in the export graph (plain Meshes SHARING geo/mat);
   units meters, +y up, origin = basin centre; colour algebra ported VERBATIM from
   ../../lib/world-law.js (shade/mix/ink + the PAL/CEL hex tables copied as data — backlot
   stays standalone, no runtime dep on celstudio/lib).
   ═══════════════════════════════════════════════════════════════════════════════════════════ */
(function (global) {
'use strict';

/* ───────────────────────────── 0 · RNG + numeric kit (world-law §0, verbatim) ──────────── */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const pick=(r,a)=>a[Math.floor(r()*a.length)];
const rng=(r,a,b)=>a+r()*(b-a);
const rint=(r,a,b)=>Math.floor(rng(r,a,b+0.999));
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
function hashInt(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}
  return h>>>0}
function smoothstep(a,b,x){const t=clamp((x-a)/(b-a||1e-9),0,1);return t*t*(3-2*t)}

/* ───────────────────────────── 1 · COLOUR ALGEBRA (world-law §1, verbatim) ─────────────── */
function h2r(h){h=h.replace('#','');if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]}
function r2h(r,g,b){const c=v=>('0'+clamp(Math.round(v),0,255).toString(16)).slice(-2);
  return'#'+c(r)+c(g)+c(b)}
function rgb2hsl(r,g,b){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);
  let h=0,s=0;const l=(mx+mn)/2;const d=mx-mn;
  if(d){s=l>0.5?d/(2-mx-mn):d/(mx+mn);
    h=mx===r?((g-b)/d+(g<b?6:0)):mx===g?((b-r)/d+2):((r-g)/d+4);h*=60}
  return[h,s,l]}
function hsl2rgb(h,s,l){h=((h%360)+360)%360/360;s=clamp(s,0,1);l=clamp(l,0,1);
  if(!s)return[l*255,l*255,l*255];
  const q=l<0.5?l*(1+s):l+s-l*s,p=2*l-q;
  const t=(x)=>{x=(x+1)%1;return x<1/6?p+(q-p)*6*x:x<0.5?q:x<2/3?p+(q-p)*(2/3-x)*6:p};
  return[t(h+1/3)*255,t(h)*255,t(h-1/3)*255]}
/* shade(hex, ΔL, ΔH°, ΔS) — ΔL in absolute lightness units (−0.09 = one HB "value step") */
function shade(hex,dl,dh,ds){const c=h2r(hex),k=rgb2hsl(c[0],c[1],c[2]);
  const o=hsl2rgb(k[0]+(dh||0),clamp(k[1]+(ds||0),0,1),clamp(k[2]+(dl||0),0,1));
  return r2h(o[0],o[1],o[2])}
/* mix(a,b,t) — aerial perspective: mix a plane toward the SKY hue by t. */
function mix(a,b,t){const A=h2r(a),B=h2r(b);
  return r2h(A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t,A[2]+(B[2]-A[2])*t)}
/* ink(hex) — the BG's brown-maroon line: NEVER black. */
function ink(hex){return shade(hex,-0.38,8,0.12)}
/* gouache(hex) — clamp a BG band into the HB gouache box (doc §7): S∈[.20,.62],
   L∈[.22,.72]. BACKLOT helper (not a WL port): pack tone mixes (night/dawn) must
   not carry a band colour out of the box. */
function gouache(hex){const c=h2r(hex),k=rgb2hsl(c[0],c[1],c[2]);
  const o=hsl2rgb(k[0],clamp(k[1],0.20,0.62),clamp(k[2],0.22,0.72));
  return r2h(o[0],o[1],o[2])}

/* ───────────────────────────── 2 · THE PALETTE (world-law §3, copied as data) ───────────
   BG box S∈[.20,.62] L∈[.22,.72]. Derivatives via shade/mix only — never hand-pick. */
const PAL={
  skyJet:['#4A88B8','#7EB6D2','#B6DBE2','#EFE2BC'],
  skyStone:['#3E8F92','#6FB6B0','#A6D3C6','#E2E0BC'],
  skyNight:['#101A33','#1B2848','#2A3A63','#41527F'],
  skyPark:['#3B7FBE','#6FAAD6','#A3CDE6','#D8E7E2'],
  skyDusk:['#3A2C4E','#6B4463','#B0655C','#E09A55'],
  grassN:'#3E6B36', grassM:'#4F8241', grassF:'#68A052',
  dirtN:'#8C4F2E',  dirtM:'#A9663A',  dirtF:'#C3854C',
  roadN:'#2B2740',  roadM:'#37324F',  roadF:'#453F5F', walk:'#5C5670',
  padN:'#6E6288',   padM:'#8375A0',   padF:'#9A8CB4',
  rockA:'#B85560', rockB:'#8E3F52', rockC:'#D9807E', rockD:'#6B3348',
  stone:'#C0A17C', stoneS:'#9B7C5C', stoneL:'#DCC49B',
  wood:'#8A5A38', woodS:'#65402A', thatch:'#C0913F', thatchS:'#946C2A',
  brick:'#8E4A44', brickS:'#6B3532', plaster:'#C7A98A', plasterS:'#A2846A',
  chromeL:'#D6DEE6', chrome:'#AFBCC8', chromeS:'#7F8E9E',
  teal:'#3E9E96', amber:'#D6A044', rose:'#C08298', mint:'#79B187',
  plum:'#3B3050', cream:'#E8DCC0', bone:'#D9CFB4', neonPink:'#D6608F', neonAqua:'#5FC6C6',
  ink:'#2A1E28'
};
const CEL={butterscotch:'#F2C879',cream:'#FBF0DC',chrome:'#C9CFD6',plum:'#2B2233',
  teal:'#3FE0C8',red:'#E6482E',amber:'#F2A93B',rust:'#9A4A2E',mint:'#7ED9A0',
  concord:'#4A7BD0',redhaven:'#C33B2F',white:'#EDEDED',rose:'#E8B4C8'};

/* ───────────────────────────── 3 · NOISE (seeded value noise + FBM) ─────────────────────── */
function valueNoise2D(seed){const s=(seed>>>0)|1;
  function h(ix,iz){let n=(Math.imul(ix,374761393)+Math.imul(iz,668265263)+Math.imul(s,1442695041))|0;
    n=Math.imul(n^(n>>>13),1274126177);n^=n>>>16;return(n>>>0)/4294967296}
  return function(x,z){const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz;
    const sx=fx*fx*(3-2*fx),sz=fz*fz*(3-2*fz);
    const a=h(ix,iz),b=h(ix+1,iz),c=h(ix,iz+1),d=h(ix+1,iz+1);
    return a+(b-a)*sx+(c-a)*sz+(a-b-c+d)*sx*sz}}
function fbm(n2,x,z,oct,pers,lac){let amp=1,f=1,sum=0,norm=0;
  for(let o=0;o<oct;o++){sum+=amp*n2(x*f,z*f);norm+=amp;amp*=pers;f*=lac}
  return sum/norm}
/* ridged FBM — each octave folded |2n−1| BEFORE the sum (classic ridged multifractal).
   Folding the summed fbm instead saturates near 1 (value-noise sums pile at the
   midline) → plateau-with-veins, not crests. Per-octave folds give crest LINES at
   every scale. sharp = power on each folded octave (pinches crest tips). */
function fbmRidged(n2,x,z,oct,pers,lac,sharp){let amp=1,f=1,sum=0,norm=0;
  for(let o=0;o<oct;o++){
    let v=1-Math.abs(2*n2(x*f,z*f)-1);
    v=Math.pow(v,sharp||1.7);
    sum+=amp*v;norm+=amp;amp*=pers;f*=lac}
  return sum/norm}

/* ───────────────────────────── 4 · MATERIAL KITS (figure3d's law, kept) ─────────────────── */
/* toonKit — 3-step DataTexture ramp + ink hull material. Same helper figure3d exposes. */
function toonKit(T, inkHex){
  var ramp = new Uint8Array([120,120,120,255, 210,210,210,255, 255,255,255,255]);
  var grad = new T.DataTexture(ramp, 3, 1, T.RGBAFormat);
  grad.minFilter = grad.magFilter = T.NearestFilter; grad.needsUpdate = true;
  var cache = {};
  function mat(hex){
    if(cache[hex]) return cache[hex];
    var c = new T.Color(hex); if(c.convertSRGBToLinear) c.convertSRGBToLinear();
    cache[hex] = new T.MeshToonMaterial({color:c, gradientMap:grad});
    return cache[hex];
  }
  var ic = new T.Color(inkHex); if(ic.convertSRGBToLinear) ic.convertSRGBToLinear();
  var hullMat = new T.MeshBasicMaterial({color:ic, side:T.BackSide});
  return {mat:mat, hullMat:hullMat, grad:grad};
}
/* THE INK: clone the geometry, push every vertex along its normal by d — a real mesh,
   so the outline survives GLTF export. Smooth masses only. */
function hullOf(T, mesh, d, hullMat){
  var g = mesh.geometry.clone();
  g.computeVertexNormals();
  var p = g.attributes.position, n = g.attributes.normal, i;
  for(i=0;i<p.count;i++){
    p.setXYZ(i, p.getX(i)+n.getX(i)*d, p.getY(i)+n.getY(i)*d, p.getZ(i)+n.getZ(i)*d);
  }
  p.needsUpdate = true;
  var m = new T.Mesh(g, hullMat);
  m.position.copy(mesh.position); m.rotation.copy(mesh.rotation); m.scale.copy(mesh.scale);
  m.renderOrder = (mesh.renderOrder||0) - 1;
  return m;
}
/* add mesh + its ink to a group. hull:false = interior-line register (flat add-ons) */
function put(T, grp, mesh, kit, d, hull){
  grp.add(mesh);
  if(hull !== false) grp.add(hullOf(T, mesh, d, kit.hullMat));
  return mesh;
}
/* flatKit — the HB register: MeshBasicMaterial everywhere, one material per hex, cached
   so every prop instance SHARES it (GLTF dedupe law). */
function flatKit(){
  const T=global.THREE, cache={};
  return {mat:function(hex){
    if(!cache[hex]) cache[hex]=new T.MeshBasicMaterial({color:new T.Color(hex)});
    return cache[hex];
  }, cache:cache};
}

/* ───────────────────────────── 5 · HEIGHTFIELD (doc §4) ─────────────────────────────
   Non-indexed grid so every FACE carries ONE flat colour — true posterized bands, hard
   edges, no smooth vertex-lerp gradients. Returns {mesh, heightAt, tris}.
   profile = {
     size, segs, relief, octaves, persistence, lacunarity, scale, contrast, power,
     terrace:{steps,strength,sharp},           // quantize op — mesas
     ridged:{strength,sharp},                  // |noise| fold op — crests/dunes (doc §4).
                                               //   blends toward a ridged FBM whose octaves
                                               //   are EACH folded 1−|2n−1| before summing
                                               //   → crest/dune lines at every scale;
                                               //   sharp (default 1.7) pinches crest tips;
                                               //   strength 0..1 blends ridged vs plain FBM.
                                               //   contrast/power/terrace act on the blend —
                                               //   dune+terrace combos compose.
     island:{r0,r1,drop},                      // radial falloff op — sea packs (doc §4).
                                               //   height drops 0→`drop` meters over radius
                                               //   d∈[r0,r1] (smoothstep) and stays down —
                                               //   pick drop > relief + waterLevel so all
                                               //   terrain beyond r1 sits under the water
                                               //   plane; shore band paints the coastline.
                                               //   Applies AFTER rim gain, in meters.
     rim:{r0,r1,lo},                           // radial gain: drama beyond the rim
     basin:{r,blend,roll,rollScale,floor},     // THE BASIN LAW (§3)
     basinC,                                   // calm floor hex inside the basin
     bands:[{upTo(m), c, cliff}...], cliffNy,  // posterized height bands + cliff hex
     shore:{level,c}?,                         // depth band when water is on
     aerial:{sky,start,end,max},               // WL mix() toward sky hue by distance
   } */
function heightfield(prof, seed){
  const T=global.THREE;
  const size=prof.size||600, segs=Math.max(16,prof.segs|0||128), half=size/2;
  const n2=valueNoise2D((seed^0x7E22B1)>>>0);
  const rollN=valueNoise2D((seed^0x30117D)>>>0);
  const relief=prof.relief, sc=prof.scale||1/112;
  const oct=prof.octaves||5, pers=prof.persistence==null?0.5:prof.persistence,
        lac=prof.lacunarity||2, con=prof.contrast||1.8, pow=prof.power||1;
  const ter=prof.terrace, rim=prof.rim, basin=prof.basin,
        rid=prof.ridged, isl=prof.island;
  function rawH(x,z){
    let f=fbm(n2,x*sc+31.7,z*sc+11.3,oct,pers,lac);
    /* 'ridged' op: blend toward the per-octave-folded field (fbmRidged) —
       crest/dune lines at every scale; contrast/power/terrace act on the blend */
    if(rid&&rid.strength>0){
      const fold=fbmRidged(n2,x*sc+31.7,z*sc+11.3,oct,pers,lac,rid.sharp);
      f=f+(fold-f)*rid.strength;
    }
    f=clamp((f-0.5)*con+0.5,0,1);
    if(pow!==1)f=Math.pow(f,pow);
    if(ter&&ter.strength>0){
      const st=ter.steps||6,k=f*st,q=Math.floor(k),fr=k-q;
      let sh=clamp((fr-0.5)*(ter.sharp||3)+0.5,0,1);sh=sh*sh*(3-2*sh);
      f=f+((q+sh)/st-f)*ter.strength;
    }
    let hh=f*relief;
    if(rim){const g=smoothstep(rim.r0,rim.r1,Math.hypot(x,z));hh*=rim.lo+(1-rim.lo)*g}
    /* 'island' op: absolute radial drop (meters) beyond r0 — terrain beyond r1
       falls the full `drop` below its FBM height, sinking under the water plane */
    if(isl)hh-=isl.drop*smoothstep(isl.r0,isl.r1,Math.hypot(x,z));
    return hh;
  }
  function heightAt(x,z){
    const d=Math.hypot(x,z);
    const rs=basin.rollScale||1/47;
    const hb=(fbm(rollN,x*rs+7.3,z*rs+3.1,3,0.5,2)-0.5)*2*(basin.roll==null?0.9:basin.roll)+(basin.floor||0);
    if(d<=basin.r)return hb;
    const m=smoothstep(basin.r,basin.r+(basin.blend||40),d);
    return hb+(rawH(x,z)-hb)*m;
  }
  /* build non-indexed grid */
  const nTri=segs*segs*2, pos=new Float32Array(nTri*9), col=new Float32Array(nTri*9),
        nor=new Float32Array(nTri*9);
  const bands=prof.bands, cliffNy=prof.cliffNy==null?0.58:prof.cliffNy;
  /* cliff by face VERTICAL EXTENT when the profile asks — normal-based classification
     speckles single triangles at grazing slopes; dy-based keeps terrace fronts coherent */
  const cliffDy=prof.cliffDy;
  const aer=prof.aerial, aerRGB=aer?h2r(aer.sky):null;
  const basinRGB=prof.basinC?h2r(prof.basinC):null;
  const shoreRGB=prof.shore?h2r(prof.shore.c):null;
  const cell=size/segs;
  /* cache the grid heights once (segs+1)² */
  const H=new Float32Array((segs+1)*(segs+1));
  for(let j=0;j<=segs;j++)for(let i=0;i<=segs;i++)
    H[j*(segs+1)+i]=heightAt(-half+i*cell,-half+j*cell);
  let p=0;
  function face(ax,ay,az,bx,by,bz,cx,cy,cz){
    /* face normal */
    const ux=bx-ax,uy=by-ay,uz=bz-az,vx=cx-ax,vy=cy-ay,vz=cz-az;
    let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
    const L=Math.hypot(nx,ny,nz)||1;nx/=L;ny/=L;nz/=L;
    const mx=(ax+bx+cx)/3,my=(ay+by+cy)/3,mz=(az+bz+cz)/3;
    const d=Math.hypot(mx,mz);
    let rgb;
    if(basinRGB&&d<basin.r-4)rgb=basinRGB;
    else{
      let band=bands[bands.length-1];
      for(let k=0;k<bands.length;k++)if(my<=bands[k].upTo){band=bands[k];break}
      const steep=cliffDy!=null?
        (Math.max(ay,by,cy)-Math.min(ay,by,cy)>cliffDy):(ny<cliffNy);
      let hex=(steep&&band.cliff)?band.cliff:band.c;
      rgb=h2r(hex);
    }
    /* §4 shore band applies EVERYWHERE below the water line — basin faces included */
    if(shoreRGB&&my<prof.shore.level+0.5)rgb=shoreRGB;
    if(aerRGB){const t=aer.max*smoothstep(aer.start,aer.end,d);
      rgb=[rgb[0]+(aerRGB[0]-rgb[0])*t,rgb[1]+(aerRGB[1]-rgb[1])*t,rgb[2]+(aerRGB[2]-rgb[2])*t]}
    const r=rgb[0]/255,g=rgb[1]/255,b=rgb[2]/255;
    pos[p]=ax;pos[p+1]=ay;pos[p+2]=az;pos[p+3]=bx;pos[p+4]=by;pos[p+5]=bz;
    pos[p+6]=cx;pos[p+7]=cy;pos[p+8]=cz;
    for(let k=0;k<3;k++){col[p+k*3]=r;col[p+k*3+1]=g;col[p+k*3+2]=b;
      nor[p+k*3]=nx;nor[p+k*3+1]=ny;nor[p+k*3+2]=nz}
    p+=9;
  }
  for(let j=0;j<segs;j++)for(let i=0;i<segs;i++){
    const x0=-half+i*cell,x1=x0+cell,z0=-half+j*cell,z1=z0+cell;
    const h00=H[j*(segs+1)+i],h10=H[j*(segs+1)+i+1],
          h01=H[(j+1)*(segs+1)+i],h11=H[(j+1)*(segs+1)+i+1];
    /* CCW seen from +y */
    face(x0,h00,z0, x0,h01,z1, x1,h10,z0);
    face(x1,h10,z0, x0,h01,z1, x1,h11,z1);
  }
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.BufferAttribute(pos,3));
  geo.setAttribute('color',new T.BufferAttribute(col,3));
  geo.setAttribute('normal',new T.BufferAttribute(nor,3));
  const mat=new T.MeshBasicMaterial({vertexColors:true});
  const mesh=new T.Mesh(geo,mat);mesh.name='terrain';
  return {mesh:mesh,heightAt:heightAt,tris:nTri};
}

/* ───────────────────────────── 6 · SCATTER LAW (doc §6) ─────────────────────────────
   tables: [{make(T,rnd,s,i)->Object3D, count, ring:[r0,r1], scaleRng:[s0,s1], rad,
             landmark?, insideBasinOK?, rimRing?, odd?, arc?(radians — left-heavy cluster),
             punct? (scaled by punctuation dial instead of density), yAt?(heightAt,x,z,s),
             sink?, margin?}]
   Exactly ONE landmark per world; density dial multiplies counts; never inside the basin
   unless flagged; odd counts where the table asks (house punctuation law). */
function scatterAll(group, tables, ctx){
  const T=global.THREE, placed=[];
  let landmarkDone=false;
  for(let ti=0;ti<tables.length;ti++){
    const t=tables[ti];
    let count=t.count;
    if(t.landmark){
      if(landmarkDone)continue;
      landmarkDone=true;count=1;
    }else if(t.fixed){
      /* fixed tables ignore the density/punct multipliers — the one-wrong-colour
         accent (doc §7) must survive density 0 and stay singular at density 2 */
    }else{
      count=Math.round(count*(t.punct?ctx.punct:ctx.density));
      if(t.odd&&count>0&&count%2===0)count+=1;
    }
    let a0=null;
    for(let i=0;i<count;i++){
      const s=(t.scaleRng?t.scaleRng[0]+ctx.rnd()*(t.scaleRng[1]-t.scaleRng[0]):1)*
              (t.landmark?1:(ctx.propScale||1));
      /* §3 BASIN LAW, extent-aware: a mass keeps its whole FOOTPRINT out of the
         basin, not just its anchor — wide masses push their ring outward to fit */
      const fp=t.footprint==null?0:
        (typeof t.footprint==='function'?t.footprint(s):t.footprint);
      const margin=t.margin==null?6:t.margin;
      const keepOut=t.insideBasinOK?0:ctx.basinR+margin+fp;
      const rLo=Math.max(t.ring[0],keepOut),rHi=Math.max(t.ring[1],rLo+10);
      let x=0,z=0,ok=false;
      for(let tries=0;tries<24&&!ok;tries++){
        let a;
        if(t.arc!=null){if(a0==null)a0=ctx.rnd()*Math.PI*2;
          a=a0+Math.pow(ctx.rnd(),1.5)*t.arc}
        else a=ctx.rnd()*Math.PI*2;
        const r=rLo+ctx.rnd()*(rHi-rLo);
        x=Math.sin(a)*r;z=Math.cos(a)*r;
        ok=true;
        if(!t.insideBasinOK&&Math.hypot(x,z)<keepOut)ok=false;
        if(ok)for(let k=0;k<placed.length;k++){
          const q=placed[k];
          if(Math.hypot(x-q.x,z-q.z)<q.rad+(t.rad||4)){ok=false;break}
        }
      }
      if(!ok)continue;
      const obj=t.make(T,ctx.rnd,s,i);
      const rotY=(t.align!=='none')?ctx.rnd()*Math.PI*2:0;
      obj.rotation.y=rotY;
      let y;
      if(t.yAt)y=t.yAt(ctx.heightAt,x,z,s);
      else if(fp>2){
        /* wide masses ground by their ACTUAL bottom-rim vertices: min terrain
           height under every low vertex, so no rim hangs in the air downhill (§6) */
        obj.position.set(0,0,0);obj.updateMatrixWorld(true);
        let g=ctx.heightAt(x,z);
        const v=new T.Vector3();
        obj.traverse(function(m){
          if(!m.isMesh||!m.geometry||!m.geometry.attributes.position)return;
          const p=m.geometry.attributes.position;
          for(let vi=0;vi<p.count;vi++){
            v.set(p.getX(vi),p.getY(vi),p.getZ(vi)).applyMatrix4(m.matrixWorld);
            if(v.y<0.75)g=Math.min(g,ctx.heightAt(x+v.x,z+v.z));
          }
        });
        y=g-(t.sink||0);
      }else y=ctx.heightAt(x,z)-(t.sink||0);
      obj.position.set(x,y,z);
      group.add(obj);
      placed.push({x:x,z:z,rad:t.rad||4});
    }
  }
}

/* ───────────────────────────── 7 · SKY (doc §8) — canvas dome ─────────────────────────────
   One 2048×1024 equirect canvas on an inverted sphere. Horizon = v 0.5 (canvas y = h/2).
   At kart height the visible sky strip is canvas y ≈ 0.30h…0.50h — packs paint their
   bands COMPRESSED into the stage [top ≈ 0.07h … 0.50h] so all bands show at eye 1.1 m. */
function skyDome(paint,opts){
  const T=global.THREE,w=2048,h=1024;
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;
  paint(cv.getContext('2d'),w,h);
  const tex=new T.CanvasTexture(cv);
  tex.minFilter=T.LinearFilter;tex.magFilter=T.LinearFilter;tex.generateMipmaps=false;
  const geo=new T.SphereGeometry((opts&&opts.radius)||2600,48,30);
  const mat=new T.MeshBasicMaterial({map:tex,side:T.BackSide,fog:false,depthWrite:false});
  const m=new T.Mesh(geo,mat);m.name='backlot-sky';m.renderOrder=-10;
  return m;
}
/* canvas paint helpers — the WL sky laws, poured into 2d context calls. All seeded. */
const sky={
  /* hard bands, top→bottom hexes, scalloped edges (WL §5 numbers). stage = [top…hor]. */
  bands:function(ctx,w,h,cols,o){
    const jr=mulberry32(((o&&o.seed)||5)^0x51C0);
    const top=o.top,hor=o.hor,stage=hor-top;
    const stops=cols.length===4?[0,rng(jr,0.28,0.34),rng(jr,0.52,0.58),rng(jr,0.74,0.82)]
      :cols.length===3?[0,rng(jr,0.34,0.42),rng(jr,0.66,0.74)]:[0];
    ctx.fillStyle=cols[0];ctx.fillRect(0,0,w,h);
    for(let i=1;i<cols.length;i++){
      const y=top+stops[i]*stage,crests=rint(jr,4,7),ph=jr()*6.28318,
            amp=rng(jr,0.010,0.020)*stage;
      ctx.fillStyle=cols[i];ctx.beginPath();
      ctx.moveTo(0,y+Math.sin(ph)*amp);
      for(let x=8;x<=w;x+=8)ctx.lineTo(x,y+Math.sin(ph+x/w*crests*6.28318)*amp);
      ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();ctx.fill();
    }
    return stops;
  },
  /* flat sub-horizon haze plate (fills below the horizon line) */
  haze:function(ctx,w,h,hex,hor){ctx.fillStyle=hex;ctx.fillRect(0,hor,w,h-hor)},
  /* sun/moon disc: flat, never centred, optional 1–2 flat rings (WL sunDisc law) */
  sunDisc:function(ctx,o){
    if(o.rings)for(let i=0;i<o.rings;i++){
      ctx.strokeStyle=o.ringColor||o.color;ctx.globalAlpha=0.5-i*0.16;
      ctx.lineWidth=o.r*0.09;ctx.beginPath();
      ctx.arc(o.x,o.y,o.r*(1.35+i*0.42),0,6.28318);ctx.stroke();ctx.globalAlpha=1;
    }
    ctx.fillStyle=o.color;ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,6.28318);ctx.fill();
    if(o.crescent){ctx.fillStyle=o.bg;ctx.beginPath();
      ctx.arc(o.x-o.r*0.40,o.y-o.r*0.26,o.r*0.92,0,6.28318);ctx.fill()}
  },
  /* four-ray twinkle (WL starfield punctuation) */
  twinkle:function(ctx,o){
    const r=o.r,wd=r*0.14;ctx.fillStyle=o.color;
    ctx.beginPath();
    ctx.moveTo(o.x-r,o.y);ctx.lineTo(o.x,o.y-wd);ctx.lineTo(o.x+r,o.y);
    ctx.lineTo(o.x,o.y+wd);ctx.closePath();ctx.fill();
    ctx.beginPath();
    ctx.moveTo(o.x,o.y-r);ctx.lineTo(o.x+wd,o.y);ctx.lineTo(o.x,o.y+r);
    ctx.lineTo(o.x-wd,o.y);ctx.closePath();ctx.fill();
  },
  stars:function(ctx,o){const jr=mulberry32(((o.seed)||33)^0xA71);
    for(let i=0;i<(o.n||22);i++){
      ctx.globalAlpha=rng(jr,0.45,1);ctx.fillStyle=o.color;
      ctx.beginPath();ctx.arc(rng(jr,0,o.w),rng(jr,o.y0,o.y1),rng(jr,1,2.6),0,6.28318);ctx.fill();
    }ctx.globalAlpha=1;
  },
  /* HB cloud sliver: flat bottom, 3–5 bumps of descending radius (WL cloud law) */
  cloud:function(ctx,o){
    const jr=mulberry32(((o.seed)||21)^0x0C10),L=o.w,n=rint(jr,3,5),x0=o.x-L/2,y=o.y;
    ctx.fillStyle=o.color;ctx.beginPath();ctx.moveTo(x0,y);
    for(let i=0;i<n;i++){const t=i/(n-1||1),cx=x0+L*(0.10+0.80*t),
      r=L*(0.20-0.085*t)*(0.85+jr()*0.35);
      ctx.arc(cx,y-r*0.30,r,Math.PI,0)}
    ctx.lineTo(x0+L,y);ctx.closePath();ctx.fill();
  },
  /* far mesa silhouette row painted ON the sky just above the horizon — the layered-
     horizon guarantee at every heading. Flat-top slabs, cliff ramps, seam-safe wrap. */
  silhouetteRow:function(ctx,w,h,o){
    const jr=mulberry32(((o.seed)||7)^0x5177);
    const y0=o.y,rise=o.rise;
    ctx.fillStyle=o.color;ctx.beginPath();ctx.moveTo(0,y0);
    let x=rng(jr,20,120);ctx.lineTo(x,y0);
    while(x<w-260){
      const up=rise*rng(jr,0.45,1.0),ramp=rng(jr,8,26),topW=rng(jr,70,240),
            gap=rng(jr,50,190);
      ctx.lineTo(x+ramp,y0-up);x+=ramp+topW;ctx.lineTo(x,y0-up);
      ctx.lineTo(x+ramp,y0);x+=ramp+gap;ctx.lineTo(x,y0);
    }
    ctx.lineTo(w,y0);ctx.lineTo(w,y0+rise*2+40);ctx.lineTo(0,y0+rise*2+40);
    ctx.closePath();ctx.fill();
  }
};

/* ───────────────────────────── 8 · SHAPE HELPERS ───────────────────────────── */
/* kidney loop (world-law §7 kidney, rnd-driven) — pond/pad decals. Returns [{x,y}]. */
function kidneyLoop(rnd,R,asp){
  const p=[],ph=rnd()*6.28,ph2=rnd()*6.28,th=rnd()*6.28,A=asp==null?0.62:asp;
  for(let i=0;i<48;i++){const t=i/48*6.28318;
    let r=R*(1+0.22*Math.sin(t+ph)+0.12*Math.sin(2*t+ph2));
    const dd=Math.abs(((t-th+9.42477)%6.28318)-3.14159);
    r*=1-0.32*Math.exp(-dd*dd/0.09);
    p.push({x:Math.cos(t)*r,y:Math.sin(t)*r*A})}
  return p;
}
function shapeFromLoop(loop){
  const T=global.THREE,s=new T.Shape();
  s.moveTo(loop[0].x,loop[0].y);
  for(let i=1;i<loop.length;i++)s.lineTo(loop[i].x,loop[i].y);
  s.closePath();return s;
}
function countTris(root){
  let n=0;
  root.traverse(function(o){
    if(o.isMesh&&o.geometry){
      const g=o.geometry;
      n+=g.index?g.index.count/3:(g.attributes.position?g.attributes.position.count/3:0);
    }
  });
  return Math.round(n);
}

/* ───────────────────────────── window.EL ───────────────────────────── */
const EL={
  mulberry32:mulberry32,pick:pick,rng:rng,rint:rint,clamp:clamp,hashInt:hashInt,
  smoothstep:smoothstep,
  h2r:h2r,r2h:r2h,shade:shade,mix:mix,ink:ink,gouache:gouache,
  PAL:PAL,CEL:CEL,
  valueNoise2D:valueNoise2D,fbm:fbm,
  toonKit:toonKit,hullOf:hullOf,put:put,flatKit:flatKit,
  heightfield:heightfield,scatterAll:scatterAll,
  skyDome:skyDome,sky:sky,
  kidneyLoop:kidneyLoop,shapeFromLoop:shapeFromLoop,countTris:countTris
};
global.EL=EL;

/* ═════════════════════════════ window.EnvGen (doc §2) ═════════════════════════════ */
/* seed is NOT a control — the app owns it. ~19 dials shared by every pack. */
const CONTROLS=[
  {k:'basinR',      l:'BASIN RADIUS',    g:'WORLD',  t:'rng',min:80, max:200,step:5,   d:130},
  {k:'detail',      l:'TERRAIN DETAIL',  g:'WORLD',  t:'rng',min:64, max:128,step:32,  d:128},
  {k:'water',       l:'WATER',           g:'WORLD',  t:'tog',                          d:false},
  {k:'waterLevel',  l:'WATER LEVEL',     g:'WORLD',  t:'rng',min:0.5,max:6,  step:0.5, d:1.5},
  {k:'relief',      l:'RELIEF',          g:'TERRAIN',t:'rng',min:12, max:80, step:2,   d:55},
  {k:'terrace',     l:'TERRACE STRENGTH',g:'TERRAIN',t:'rng',min:0,  max:1,  step:0.05,d:0.85},
  {k:'terraceSteps',l:'TERRACE STEPS',   g:'TERRAIN',t:'rng',min:3,  max:9,  step:1,   d:6},
  {k:'rough',       l:'ROUGHNESS',       g:'TERRAIN',t:'rng',min:0.35,max:0.65,step:0.01,d:0.5},
  {k:'bands',       l:'SKY BANDS',       g:'SKY',    t:'cyc',o:[1,3,4],                d:4},
  {k:'skyVar',      l:'SKY VARIANT',     g:'SKY',    t:'rng',min:0,  max:7,  step:1,   d:0},
  {k:'timeOfDay',   l:'TIME OF DAY',     g:'SKY',    t:'cyc',o:['dusk','day','dawn','night'],d:'dusk'},
  {k:'density',     l:'PROP DENSITY',    g:'PROPS',  t:'rng',min:0,  max:2,  step:0.1, d:1},
  {k:'punct',       l:'PUNCTUATION',     g:'PROPS',  t:'rng',min:0,  max:2,  step:0.1, d:1},
  {k:'landmark',    l:'LANDMARK',        g:'PROPS',  t:'cyc',o:[0,1,2],                d:0},
  {k:'propScale',   l:'PROP SCALE',      g:'PROPS',  t:'rng',min:0.7,max:1.4,step:0.05,d:1},
  {k:'hueShift',    l:'PALETTE SHIFT',   g:'COLOR',  t:'rng',min:-40,max:40, step:2,   d:0},
  {k:'accent',      l:'WRONG COLOUR',    g:'COLOR',  t:'cyc',o:[0,1,2],                d:0},
  {k:'fog',         l:'FOG',             g:'MOOD',   t:'tog',                          d:false},
  {k:'fogAmt',      l:'FOG AMOUNT',      g:'MOOD',   t:'rng',min:0.2,max:1,  step:0.05,d:0.5}
];
const GROUPS=['WORLD','TERRAIN','SKY','PROPS','COLOR','MOOD'];

function baseDefaults(){
  const p={};
  for(let i=0;i<CONTROLS.length;i++)p[CONTROLS[i].k]=CONTROLS[i].d;
  return p;
}
function snap(v,c){
  const steps=Math.round((c.max-c.min)/c.step);
  const k=clamp(Math.round((v-c.min)/c.step),0,steps);
  return parseFloat((c.min+k*c.step).toFixed(4));
}

const EnvGen={
  CONTROLS:CONTROLS,
  GROUPS:GROUPS,
  defaults:function(packName){
    packName=packName||'mesa-golden';
    const p=baseDefaults();p.pack=packName;
    const pk=global.BACKLOT_PACKS&&global.BACKLOT_PACKS[packName];
    if(pk&&pk.presets&&pk.presets[0]){
      const pr=pk.presets[0].params||{};
      for(const k in pr)if(Object.prototype.hasOwnProperty.call(pr,k))p[k]=pr[k];
    }
    return p;
  },
  /* re-roll only unlocked keys. Pure: per-key independent streams so a lock never
     shifts a neighbour's draw. */
  roll:function(params,locks,seed){
    const out={};for(const k in params)out[k]=params[k];
    const S=(seed>>>0);
    for(let i=0;i<CONTROLS.length;i++){
      const c=CONTROLS[i];
      if(locks&&locks[c.k])continue;
      const r=mulberry32((S^hashInt(c.k))>>>0);
      if(c.t==='rng')out[c.k]=snap(c.min+r()*(c.max-c.min),c);
      else if(c.t==='cyc')out[c.k]=c.o[Math.floor(r()*c.o.length)];
      else out[c.k]=r()<0.5;
    }
    return out;
  },
  /* -> Built {group, sky, fog, bounds, meta} (+heightAt for kart ground-follow). Pure. */
  build:function(params,seed){
    const T=global.THREE;
    const pack=global.BACKLOT_PACKS&&global.BACKLOT_PACKS[params.pack];
    if(!pack)throw new Error('BACKLOT: unknown pack "'+params.pack+'"');
    const S=(seed>>>0);
    const rPal=mulberry32((S^0x0A11CE)>>>0),
          rTer=mulberry32((S^0x7E44A1)>>>0),
          rSky=mulberry32((S^0x051C07)>>>0),
          rProp=mulberry32((S^0x94077E)>>>0),
          rScat=mulberry32((S^0x5CA77E)>>>0);
    const pal=pack.palette(params,rPal);
    const prof=pack.terrain(params,rTer,pal);
    const hf=heightfield(prof,S);
    const group=new T.Group();group.name='backlot-'+pack.name;
    group.add(hf.mesh);
    /* LIGHTING LAW: the lane owns ZERO scene lights — 'toon' is the only LIT
       treatment (MeshToonMaterial), so a toon pack's world carries its own rig
       INSIDE Built.group: the figure3d viewer's exact key+fill (soft hemisphere
       fill + white directional key at the fixed house angle). Deterministic —
       fixed constants, no RNG drawn, no pack hook. 'flat' and 'grad' are
       MeshBasicMaterial (unlit) and stay lightless: their build path is
       byte-identical to the pre-light engine. GLB note: the directional key
       exports via KHR_lights_punctual; the hemisphere fill is skipped by the
       r147 exporter with a console warn (harmless — engines re-light). */
    if(pack.treatment==='toon'){
      const fill=new T.HemisphereLight(0xfff6e8,0x67554a,0.75);
      fill.name='backlot-fill';group.add(fill);
      const key=new T.DirectionalLight(0xffffff,0.85);
      key.position.set(90,190,160);key.name='backlot-key';group.add(key);
    }
    if(params.water){
      const sz=(prof.size||600)*1.001;
      const wg=new T.PlaneGeometry(sz,sz,1,1);wg.rotateX(-Math.PI/2);
      /* DoubleSide: the sheet must never vanish if the eye ever dips below it */
      const wm=new T.Mesh(wg,new T.MeshBasicMaterial({color:new T.Color(pal.water||PAL.teal),
        side:T.DoubleSide}));
      wm.position.y=params.waterLevel;wm.name='water';group.add(wm);
    }
    const tables=pack.props(EL,rProp,params,pal);
    scatterAll(group,tables,{rnd:rScat,basinR:params.basinR,heightAt:hf.heightAt,
      density:params.density,punct:params.punct,propScale:params.propScale});
    const skyObj=skyDome(function(ctx,w,h){pack.paintSky(ctx,w,h,pal,params,rSky)});
    const fog=(pack.treatment!=='flat'&&params.fog&&pal.fogHex)?
      {color:pal.fogHex,near:120+280*(1-params.fogAmt),far:900-380*params.fogAmt}:null;
    return {
      group:group,sky:skyObj,fog:fog,
      bounds:{radius:params.basinR},
      heightAt:hf.heightAt,   /* engine extension: kart-cam kinematic ground follow */
      meta:{pack:pack.name,label:pack.label,palette:pal.swatches||[],
            tris:countTris(group),moving:[]}
    };
  }
};
/* PRESETS — collected live from the loaded packs (packs load after this file). */
Object.defineProperty(EnvGen,'PRESETS',{get:function(){
  const out=[],packs=global.BACKLOT_PACKS||{};
  Object.keys(packs).sort().forEach(function(pn){
    (packs[pn].presets||[]).forEach(function(pr){
      const params=baseDefaults();params.pack=pn;
      const pp=pr.params||{};
      for(const k in pp)if(Object.prototype.hasOwnProperty.call(pp,k))params[k]=pp[k];
      out.push({name:pr.name,pack:pn,params:params});
    });
  });
  return out;
}});
global.EnvGen=EnvGen;
global.BACKLOT_PACKS=global.BACKLOT_PACKS||{};

})(window);
