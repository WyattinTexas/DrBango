/* ═══════════════════════════════════════════════════════════════════════════════════════════
   INKWASH CANYON — BACKLOT style pack (doc §10 row 5). Moebius / Sable.
   Pale paper, sparse washes, every hero mass owning a FAT ink line. Terraced canyon
   fins and plates in bone/sand/pale-blush washes; a bone-white natural ARCH landmark;
   one oxide-red banner doing the wrong-colour job. treatment:'toon' — MeshToonMaterial
   props with HEAVY baked inverted-hull ink (≈1.65× the studio default displacement —
   this pack's signature); terrain stays vertex-colour flat (the engine heightfield).
   Restraint IS the register: the emptiest and boldest of the six.
   Data + paint only — the engine (env-law.js) owns the pipeline.
   ═══════════════════════════════════════════════════════════════════════════════════════════ */
(function (global) {
'use strict';
const EL=global.EL,PAL=EL.PAL,shade=EL.shade,mix=EL.mix,rng=EL.rng,rint=EL.rint,
      clamp=EL.clamp,mulberry32=EL.mulberry32;

/* band thresholds as fraction of relief — terrain plates AND prop washes stay kin */
const BAND_FR=[0.07,0.28,0.54,0.80];

/* ── toon-render colour compensation (engine readiness note: the renderer has no
   sRGB outputEncoding, so toonKit's convertSRGBToLinear makes lit toon colours
   render DARKER than the authored hex). comp(target) pre-lifts a TARGET hex so the
   key-lit face lands on it (F ≈ measured lit-face gain); compU(target) is the same
   for UNLIT converted materials (the ink hull — MeshBasicMaterial, F=1). Pack-space
   workaround, engine untouched. */
function comp(hex){const c=EL.h2r(hex),F=1.08,
  f=function(v){return 255*Math.pow(clamp(v/255/F,0,1),1/2.2)};
  return EL.r2h(f(c[0]),f(c[1]),f(c[2]))}
function compU(hex){const c=EL.h2r(hex),
  f=function(v){return 255*Math.pow(clamp(v/255,0,1),1/2.2)};
  return EL.r2h(f(c[0]),f(c[1]),f(c[2]))}

/* paper-cream sky ladders per timeOfDay, top→horizon. The sky is nearly empty —
   value steps stay whisper-subtle; timeOfDay reinterprets the paper in-register:
   day = warm cream · dusk = amber-washed page · dawn = blush wash · night = the
   ink flooding the page (sepia, never blue-black). */
function paperCols(tod){
  const C=PAL.cream;
  if(tod==='dusk'){const A=PAL.dirtF;
    return[mix(C,A,0.52),mix(C,A,0.34),mix(C,A,0.18),shade(mix(C,A,0.06),0.03,0,0)]}
  if(tod==='dawn'){const B=PAL.rockC;
    return[mix(C,B,0.36),mix(C,B,0.24),mix(C,B,0.12),shade(mix(C,B,0.04),0.03,0,0)]}
  if(tod==='night'){const I=EL.ink(PAL.stone);
    return[mix(C,I,0.84),mix(C,I,0.76),mix(C,I,0.66),mix(C,I,0.54)]}
  return[shade(C,-0.075,-4,0.06),shade(C,-0.035,-2,0.03),C,shade(C,0.045,3,-0.06)];
}

/* one long thin CONTOUR-LINE cloud — a painted ink stroke, not a shape: a tapered
   lens (sin^0.6 thickness envelope) along a barely-waving line, at wash alpha. */
function inkStroke(ctx,x0,y0,len,th,wav,color,alpha,seed){
  const jr=mulberry32(seed>>>0),n=18,ph=jr()*6.28318;
  ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.beginPath();
  for(let i=0;i<=n;i++){const t=i/n,x=x0+len*t,
    y=y0+Math.sin(ph+t*4.4)*wav-th*Math.pow(Math.sin(Math.PI*t),0.6)/2;
    if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y)}
  for(let i=n;i>=0;i--){const t=i/n,x=x0+len*t,
    y=y0+Math.sin(ph+t*4.4)*wav+th*Math.pow(Math.sin(Math.PI*t),0.6)/2;
    ctx.lineTo(x,y)}
  ctx.closePath();ctx.fill();ctx.globalAlpha=1;
}

/* far-canyon silhouette row, pack-drawn (EL.sky.silhouetteRow reads as grey slabs at
   this palette's contrast): longer, lower plates in a barely-there paper wash, the
   NEAR row tracing its skyline with a thin ink contour line — the Moebius horizon. */
function canyonRow(ctx,w,h,o){
  const jr=mulberry32((o.seed)>>>0),y0=o.y,rise=o.rise,pts=[[0,y0]];
  let x=rng(jr,30,140);pts.push([x,y0]);
  while(x<w-340){
    const up=rise*rng(jr,0.5,1.0),ramp=rng(jr,26,70),topW=rng(jr,150,430),
          gap=rng(jr,90,260);
    pts.push([x+ramp,y0-up]);x+=ramp+topW;pts.push([x,y0-up]);
    pts.push([x+ramp,y0]);x+=ramp+gap;pts.push([x,y0]);
  }
  pts.push([w,y0]);
  ctx.fillStyle=o.color;ctx.beginPath();ctx.moveTo(0,y0+rise*2+40);
  for(let i=0;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);
  ctx.lineTo(w,y0+rise*2+40);ctx.closePath();ctx.fill();
  if(o.line){
    ctx.strokeStyle=o.line;ctx.lineWidth=o.lineW||2.2;
    ctx.globalAlpha=o.lineA==null?0.5:o.lineA;
    ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
    for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);
    ctx.stroke();ctx.globalAlpha=1;
  }
}

/* which band colour sits at a given canvas y — knocks the night moon crescent out
   with its TRUE background (uses the seeded stops EL.sky.bands returned). */
function bandAtY(cols,y,top,hor,stops){
  const t=clamp((y-top)/(hor-top),0,1);
  let i=0;
  for(let k=1;k<cols.length;k++)
    if(stops&&stops[k]!=null?t>=stops[k]:t>=k/cols.length)i=k;
  return cols[i];
}

const PACK={
  name:'inkwash-canyon',
  label:'INKWASH CANYON',
  blurb:'Moebius manners: pale paper sky, bone-and-blush canyon plates, and every mass wearing a fat umber ink line. A bone-white arch to steer by; one oxide-red banner breaks the page.',
  treatment:'toon',

  /* ── palette(params, rnd) — ≤7 base hues + derived washes (doc §7) ───────────────
     Base: cream/paper, bone, stone sand, pale blush (rockC-tinted bone), stoneS
     (the one-wash-darker cliff), ink (EL.ink of the sand family — warm dark umber,
     never black), oxide red (THE wrong colour). hueShift rotates the ground family;
     the paper stays put. */
  palette:function(params,rnd){
    const hs=params.hueShift||0,tod=params.timeOfDay||'day';
    const g=function(hex){return hs?shade(hex,0,hs,0):hex};
    const P=paperCols(tod);
    const cols=params.bands===3?[P[0],P[1],P[3]]:params.bands===1?[P[2]]:P;
    const tone=function(hex){
      if(tod==='night')return mix(hex,P[0],0.42);
      if(tod==='dusk')return mix(hex,P[0],0.14);
      if(tod==='dawn')return mix(hex,P[0],0.12);
      return hex;
    };
    /* HB register: every GROUND band passes the §7 gouache clamp */
    const G=function(hex){return EL.gouache(tone(g(hex)))};
    const blush=mix(PAL.bone,PAL.rockC,0.24);
    const ground={
      floor:  G(shade(PAL.bone,0.06,-2,-0.14)),   /* wide calm pale basin — the canvas */
      b0:     G(PAL.stone),                       /* sand foot */
      b1:     G(PAL.stoneL),                      /* pale gold sand */
      b2:     G(blush),                           /* pale blush plates */
      b3:     G(PAL.bone),                        /* bone */
      b4:     G(shade(PAL.bone,0.05,2,-0.03)),    /* palest bone caps (keep the warmth) */
      cliffLo:G(shade(PAL.stoneS,0.05,0,-0.02)),  /* ONE wash darker — cliff faces */
      cliffHi:G(mix(shade(PAL.stoneS,0.05,0,0),PAL.rockC,0.30)) /* blush cap cliffs */
    };
    const inkTrue=EL.ink(g(PAL.stone));           /* warm dark umber — never black */
    const accents=['#B0472B','#2F8F86','#4A6FC4'];/* oxide red canon · teal · indigo */
    const accent=accents[params.accent||0];
    const hor=cols[cols.length-1];
    return{
      sky:{cols:cols,horizon:hor,
        below:shade(hor,-0.05,2,0),
        sun:tod==='night'?shade(PAL.bone,0.08,0,-0.10):shade(hor,0.06,2,-0.08),
        stroke:tod==='night'?shade(P[3],0.16,0,-0.06):shade(inkTrue,0.05,0,-0.05),
        sil1:shade(mix(G(PAL.stone),hor,0.52),0,2,0.04),
        sil2:shade(mix(G(PAL.stone),hor,0.78),0,2,0.02)},
      ground:ground,
      /* prop hexes are comp()-lifted TARGETS — they render back into the wash family */
      props:{
        arch: comp(tone(g('#EBE1C8'))),           /* bone-white — the palest mass */
        fin:  comp(tone(g(PAL.stoneL))),
        cap:  comp(tone(g(blush))),
        spire:comp(tone(g(PAL.bone))),
        stoneA:comp(tone(g(PAL.bone))),
        stoneB:comp(tone(g(PAL.stone))),
        tuft: comp(tone(g(shade(PAL.stoneS,-0.13,0,0.06)))),
        wash: comp(tone(g(shade(PAL.stoneS,-0.10,0,0)))),
        pole: comp(shade(inkTrue,0.10,0,0)),
        cloth:comp(accent)
      },
      accent:accent,
      water:EL.gouache(mix(PAL.teal,hor,0.34)),   /* celadon wash — must read vs sand */
      fogHex:hor,                                 /* mist = the paper itself */
      ink:inkTrue,
      hull:compU(shade(inkTrue,0.05,0,-0.03)),    /* hull hex pre-lifted (unlit basic) */
      swatches:[ground.b0,ground.b1,ground.b2,ground.b4,ground.cliffLo,
                cols[0],hor,accent]
    };
  },

  /* ── terrain(params, rnd, pal) — terraced canyon fins and plates (doc §4) ────────
     ridged op folds crests into the plates (fins); terrace posterizes them into
     plates; heavy aerial mix fades everything toward the paper. */
  terrain:function(params,rnd,pal){
    const R=params.relief,g=pal.ground;
    const prof={
      size:600,segs:params.detail,relief:R,
      octaves:4,persistence:params.rough,lacunarity:2.1,scale:1/150,
      contrast:2.0,power:1.18,
      ridged:{strength:0.42,sharp:1.9},
      terrace:{steps:params.terraceSteps,strength:params.terrace,sharp:3.2},
      rim:{r0:params.basinR+5,r1:255,lo:0.42},
      /* BASIN LAW vs WATER: the playable floor rides above the water line — water
         fills the valleys BEYOND the rim, never the basin */
      basin:{r:params.basinR,blend:50,roll:0.55,rollScale:1/49,
        floor:params.water?Math.max(0.35,params.waterLevel+1.2):0.35},
      basinC:g.floor,
      bands:[
        {upTo:BAND_FR[0]*R,c:g.b0,cliff:g.cliffLo},
        {upTo:BAND_FR[1]*R,c:g.b1,cliff:g.cliffLo},
        {upTo:BAND_FR[2]*R,c:g.b2,cliff:g.cliffLo},
        {upTo:BAND_FR[3]*R,c:g.b3,cliff:g.cliffHi},
        {upTo:1e9,        c:g.b4,cliff:g.cliffHi}
      ],
      cliffDy:5.2,
      aerial:{sky:shade(pal.sky.horizon,0,3,0.08),start:150,end:520,max:0.46} /* fade
        to paper — target re-warmed: the raw horizon hex greys the far plates out */
    };
    if(params.water){
      /* WATER, in-register: the ridged op floors FBM lows, so valleys never dip
         under the plane on their own — instead the outer wash FLOODS IN around
         the canyon plate (island falloff, §4). drop clears the rim-gained relief
         so everything beyond r1 sits under water; the shore band traces the
         coast. Dry pack stays byte-identical — the op only exists when water=on. */
      prof.island={r0:262,r1:292,drop:R*0.9+params.waterLevel};
      prof.shore={level:params.waterLevel,c:shade(g.b0,0.05,0,-0.08)};
    }
    return prof;
  },

  /* ── paintSky — warm paper, NEARLY EMPTY: subtle wash bands, one huge very-pale
     sun disc, 1–3 contour-line ink-stroke clouds (punctuation — punct 0 paints
     NOTHING), two pale far-canyon silhouette rows. Restraint IS the register. ──── */
  paintSky:function(ctx,w,h,pal,params,rnd){
    const tod=params.timeOfDay||'day';
    /* stage compressed to the kart-visible strip: horizon 0.5h, top 0.30h (§8) */
    const hor=h*0.5,top=h*0.30;
    const seed=Math.floor(rnd()*1e9)^((params.skyVar|0)*7919);
    const stops=EL.sky.bands(ctx,w,h,pal.sky.cols,{seed:seed,top:top,hor:hor});
    EL.sky.haze(ctx,w,h,pal.sky.below,hor);
    /* far canyon silhouettes — barely-there paper washes; the near row carries a
       thin ink contour line along its skyline (the Moebius horizon) */
    canyonRow(ctx,w,h,{y:hor,rise:h*0.042,seed:seed^0x51,color:pal.sky.sil2});
    canyonRow(ctx,w,h,{y:hor,rise:h*0.068,seed:seed^0xB3,color:pal.sky.sil1,
      line:pal.sky.stroke,lineW:3.2,lineA:tod==='night'?0.65:0.60});
    /* THE SUN — one huge very-pale disc (core sky element, not punctuation).
       Centre 21–27° elevation (≥17° law); size is angular: r ≈ 8–11°. */
    const sx=rng(rnd,0.12,0.88)*w,sy=hor-h*rng(rnd,0.118,0.152),
          sr=h*rng(rnd,0.046,0.060);
    if(tod==='night'){
      EL.sky.sunDisc(ctx,{x:sx,y:sy,r:sr*0.62,color:pal.sky.sun,crescent:true,
        bg:bandAtY(pal.sky.cols,sy,top,hor,stops)});
    }else{
      EL.sky.sunDisc(ctx,{x:sx,y:sy,r:sr,color:pal.sky.sun});
    }
    /* punctuation — long thin horizontal contour-line clouds, odd count 1–3;
       each owns a shorter echo stroke below (contour pair). punct 0 ⇒ NONE. */
    const pv=params.punct==null?1:params.punct;
    const nc=pv<=0?0:clamp(Math.round(2*pv)|1,1,3);
    for(let i=0;i<nc;i++){
      const L=w*rng(rnd,0.09,0.20),x0=rng(rnd,0.04,0.90-L/w)*w,
            y0=hor-h*rng(rnd,0.105,0.185),
            th=h*rng(rnd,0.0048,0.0072),wav=h*rng(rnd,0.002,0.0045);
      inkStroke(ctx,x0,y0,L,th,wav,pal.sky.stroke,tod==='night'?0.60:0.48,
        seed^(0xC1+i*77));
      inkStroke(ctx,x0+L*rng(rnd,0.12,0.32),y0+h*rng(rnd,0.010,0.016),
        L*rng(rnd,0.4,0.6),th*0.8,wav*0.8,pal.sky.stroke,
        tod==='night'?0.45:0.34,seed^(0x3D+i*131));
    }
    if(tod==='night'&&pv>0){
      EL.sky.stars(ctx,{w:w,y0:top-h*0.03,y1:hor-h*0.10,n:Math.round(12*pv),
        color:pal.sky.sun,seed:seed^0xA7});
    }
  },

  /* ── props(EL, rnd, params, pal) -> scatter tables (doc §6) ──────────────────────
     Toon + HEAVY baked ink hulls (the signature). Aspect ratios are BAKED into the
     shared unit geometries so instance scales stay uniform and the hull line stays
     uniformly fat; each family shares ONE displaced hull geometry (EL.hullOf clones
     per instance — pack builds the clone once per family instead). */
  props:function(EL,rnd,params,pal){
    const T=global.THREE,kit=EL.toonKit(T,pal.hull);
    const R=params.relief,basinR=params.basinR,ps=params.propScale||1;
    const D=0.034;   /* local ink displacement per unit scale — HEAVY (≈1.7× default) */

    function bake(geo,sx,sy,sz,ty){
      geo.scale(sx,sy,sz);if(ty)geo.translate(0,ty,0);
      geo.computeVertexNormals();return geo;
    }
    function inkGeo(geo,d){
      const g2=geo.clone(),p=g2.attributes.position,n=g2.attributes.normal;
      for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)+n.getX(i)*d,
        p.getY(i)+n.getY(i)*d,p.getZ(i)+n.getZ(i)*d);
      p.needsUpdate=true;return g2;
    }
    /* shared unit geometries (aspect baked; base at y=0) + shared hull clones */
    const finGeo   =bake(new T.CylinderGeometry(0.72,1.06,1,9,1),0.95,1.5,0.17,0.75);
    const capGeo   =bake(new T.CylinderGeometry(0.55,0.80,1,9,1),0.62,0.34,0.13,1.67);
    const spireGeo =bake(new T.CylinderGeometry(0.09,0.34,1,9,1),1,1.8,1,0.9);
    const sBaseGeo =bake(new T.CylinderGeometry(0.34,0.52,1,9,1),1,0.42,1,0.21);
    const stoneGeo =bake(new T.SphereGeometry(1,10,7),1,0.80,0.92,0);
    const bladeGeo =bake(new T.CylinderGeometry(0.012,0.05,1,4,1),1,1,1,0.5);
    const washGeo  =bake(new T.IcosahedronGeometry(1,0),1,0.62,0.9,0);
    const poleGeo  =bake(new T.CylinderGeometry(0.09,0.11,1,6,1),1,1,1,0.5);
    const clothGeo =(function(){const g2=new T.ConeGeometry(1,1,4,1);
      g2.rotateZ(-Math.PI/2);g2.translate(0.5,0,0);g2.computeVertexNormals();return g2})();
    const finInk=inkGeo(finGeo,D),capInk=inkGeo(capGeo,D*0.9),
          spireInk=inkGeo(spireGeo,D),sBaseInk=inkGeo(sBaseGeo,D),
          stoneInk=inkGeo(stoneGeo,0.10);    /* small masses: floor the world ink */
    function inkPair(geo,ig,hex){
      const g2=new T.Group();
      g2.add(new T.Mesh(geo,kit.mat(hex)));
      const k=new T.Mesh(ig,kit.hullMat);k.renderOrder=-1;g2.add(k);
      return g2;
    }

    const tables=[];

    /* THE LANDMARK — a bone-white natural ARCH: two piers + a torus-segment lintel
       sweep. The silhouette you steer by; the fattest ink line in the world.
       Variants: 0 GRAND ARCH · 1 THE WINDOW (wider, flattened sweep) · 2 THE
       SENTINEL (arch + needle spire riding one pier). Footprint declared (§3). */
    const lv=params.landmark||0;
    const Rl=Math.max(R,26+8*ps);
    const Ht=clamp(Rl*1.25,34,66);
    const fpCap=Math.max(26,(276-basinR)/2);
    const tube=Ht*0.085;
    let halfR,pierH,ysq=1;
    if(lv===1){halfR=Math.min(Ht*0.56,fpCap-tube*2.2);ysq=0.60;pierH=Ht*0.52}
    else{halfR=Math.min(Ht*0.40,fpCap-tube*2.2);pierH=Ht-halfR}
    const lmFp=halfR+tube*2.2;
    const Dl=Math.max(0.6,Ht*0.014);          /* landmark ink, world meters — FAT */
    /* THE ARCH FACES THE BASIN (audit fix): the arch is PLANAR — under the engine's
       random yaw an edge-on bearing collapses "the silhouette you steer by" into a
       generic tower from every basin heading (seed 202 proved it). The table's yAt
       hook runs AFTER the engine's yaw assignment and receives x,z, so it aims the
       arch plane at the origin (±15° deterministic jitter, drawn at build time) and
       replicates the engine's extent-aware vertex grounding (yAt bypasses it). */
    let lmObj=null;
    const lmJit=rng(rnd,-0.26,0.26);
    tables.push({
      landmark:true,count:1,rad:56,footprint:lmFp,
      ring:[Math.max(basinR+20,115),Math.max(basinR+55,200)],
      yAt:function(heightAt,x,z){
        lmObj.rotation.y=Math.atan2(-x,-z)+lmJit;
        lmObj.position.set(0,0,0);lmObj.updateMatrixWorld(true);
        let g=heightAt(x,z);
        const v=new T.Vector3();
        lmObj.traverse(function(m){
          if(!m.isMesh||!m.geometry||!m.geometry.attributes.position)return;
          const p=m.geometry.attributes.position;
          for(let vi=0;vi<p.count;vi++){
            v.set(p.getX(vi),p.getY(vi),p.getZ(vi)).applyMatrix4(m.matrixWorld);
            if(v.y<0.75)g=Math.min(g,heightAt(x+v.x,z+v.z));
          }
        });
        return g-1.2;                         /* the old sink, kept */
      },
      make:function(){
        const g2=new T.Group(),boneM=kit.mat(pal.props.arch);
        lmObj=g2;
        const tor=new T.Mesh(new T.TorusGeometry(halfR,tube,9,26,Math.PI),boneM);
        tor.scale.set(1,ysq,1);
        tor.position.y=pierH-tube*0.5;        /* open tube ends hide inside piers */
        g2.add(tor);g2.add(EL.hullOf(T,tor,Dl,kit.hullMat));
        const pg=new T.CylinderGeometry(tube*1.5,tube*2.2,pierH,9,1);
        for(let sx=-1;sx<=1;sx+=2){
          const p=new T.Mesh(pg,boneM);
          p.position.set(sx*halfR,pierH/2,0);
          g2.add(p);g2.add(EL.hullOf(T,p,Dl,kit.hullMat));
        }
        if(lv===2){
          const sp=new T.Mesh(new T.CylinderGeometry(tube*0.22,tube*1.05,Ht*0.62,9,1),boneM);
          sp.position.set(halfR,pierH+Ht*0.31-tube*0.3,0);
          g2.add(sp);g2.add(EL.hullOf(T,sp,Dl,kit.hullMat));
        }
        return g2;
      },
      sink:1.2
    });

    /* canyon fins — tall thin blades, some wearing a blush cap plate. The mid-ground
       silhouette layer; capped under the landmark so the skyline rank survives. */
    const finMax=clamp(Ht*0.42/ps,10,24),spireMax=clamp(Ht*0.27/ps,8,16);
    tables.push({
      count:9,odd:true,rad:26,
      ring:[basinR+42,286],scaleRng:[12,finMax],
      footprint:function(s){return s*1.1},
      make:function(T2,r2,s){
        const g2=new T.Group();
        g2.add(inkPair(finGeo,finInk,pal.props.fin));
        if(rnd()<0.6)g2.add(inkPair(capGeo,capInk,pal.props.cap));
        g2.scale.set(s,s*rng(rnd,0.85,1.15),s);
        return g2;
      },
      sink:1.2
    });

    /* needle spires */
    tables.push({
      count:7,odd:true,rad:12,
      ring:[basinR+36,272],scaleRng:[9,spireMax],
      footprint:function(s){return s*0.6},
      make:function(T2,r2,s){
        const g2=new T.Group();
        g2.add(inkPair(spireGeo,spireInk,pal.props.spire));
        g2.add(inkPair(sBaseGeo,sBaseInk,pal.props.stoneB));
        g2.scale.set(s,s*rng(rnd,0.9,1.25),s);
        return g2;
      },
      sink:0.8
    });

    /* balanced tumble-stones — punctuation: odd, left-heavy, may lean just inside
       the rim (edge-punctuation exception, doc §3). punct 0 ⇒ none. */
    tables.push({
      count:3,odd:true,punct:true,rad:8,insideBasinOK:true,arc:3.4,
      ring:[basinR-4,basinR+32],scaleRng:[2.6,5.2],
      footprint:function(s){return s*1.3},
      make:function(T2,r2,s){
        const g2=new T.Group(),rr=[1,0.66,0.42],
              hex=[pal.props.stoneA,pal.props.stoneB,pal.props.stoneA];
        let y=0.68;
        for(let i=0;i<3;i++){
          const p=inkPair(stoneGeo,stoneInk,hex[i]);
          p.scale.setScalar(rr[i]);
          p.position.set(rng(rnd,-0.14,0.14)*rr[i],y,rng(rnd,-0.14,0.14)*rr[i]);
          p.rotation.y=rng(rnd,0,6.28318);
          g2.add(p);
          if(i<2)y+=0.80*rr[i]+0.80*rr[i+1]-0.14*rr[i+1];
        }
        g2.scale.setScalar(s);
        return g2;
      },
      sink:0.3
    });

    /* sparse dry tufts — starburst blade fans */
    tables.push({
      count:12,rad:2.5,
      ring:[basinR+8,262],scaleRng:[1.1,2.0],
      make:function(T2,r2,s){
        const g2=new T.Group(),mat=kit.mat(pal.props.tuft),n=rint(rnd,5,7);
        for(let i=0;i<n;i++){
          const b=new T.Mesh(bladeGeo,mat);
          b.rotation.y=i/n*6.28318+rng(rnd,-0.2,0.2);
          b.rotation.z=rng(rnd,0.55,1.0);
          b.scale.set(1,rng(rnd,0.8,1.3),1);
          g2.add(b);
        }
        g2.scale.setScalar(s);
        return g2;
      },
      sink:0.05
    });

    /* the dry wash — a winding line of darker stones on the basin skirt */
    tables.push({
      count:2,rad:15,
      ring:[basinR+10,basinR+85],scaleRng:[9,15],
      footprint:function(s){return s},
      make:function(T2,r2,s){
        const g2=new T.Group(),mat=kit.mat(pal.props.wash),
              n=rint(rnd,9,13),ph=rng(rnd,0,6.28318);
        for(let i=0;i<n;i++){
          const t=i/(n-1)*2-1,
                ss=rng(rnd,0.05,0.11)*(1-0.35*Math.abs(t));
          const m=new T.Mesh(washGeo,mat);
          m.scale.set(ss*rng(rnd,0.8,1.4),ss,ss*rng(rnd,0.8,1.4));
          m.position.set(t,ss*0.25,Math.sin(t*2.2+ph)*0.18);
          m.rotation.y=rng(rnd,0,6.28318);
          g2.add(m);
        }
        g2.scale.setScalar(s);
        return g2;
      },
      sink:0.5
    });

    /* THE WRONG COLOUR — one lone oxide-red banner pole near the rim, cloth wedge
       included. fixed: exactly ONE at every density/punct (doc §7). */
    tables.push({
      count:1,rad:4,insideBasinOK:true,fixed:true,
      ring:[basinR-2,basinR+14],
      make:function(){
        const g2=new T.Group(),H=rng(rnd,7.5,10);
        const pole=new T.Mesh(poleGeo,kit.mat(pal.props.pole));
        pole.scale.set(1.3,H,1.3);g2.add(pole);
        const cloth=new T.Mesh(clothGeo,kit.mat(pal.props.cloth));
        cloth.scale.set(H*0.38,H*0.13,H*0.03);
        cloth.position.set(0,H*0.90,0);
        g2.add(cloth);
        g2.rotation.z=rng(rnd,2,6)*(rnd()<0.5?-1:1)*Math.PI/180;
        return g2;
      },
      sink:0.15
    });

    return tables;
  },

  /* ── ≥3 hand-tuned presets (doc §2). Preset 0 = pack defaults. ─────────────────── */
  presets:[
    {name:'PAPER NOON',params:{timeOfDay:'day',relief:50,terrace:0.8,terraceSteps:5,
      rough:0.5,basinR:130,density:1.0,punct:1.0,landmark:0,hueShift:0,accent:0,
      bands:3,fog:false,water:false}},
    {name:'BLUSH DAWN',params:{timeOfDay:'dawn',relief:56,terrace:0.9,terraceSteps:6,
      rough:0.48,basinR:120,density:0.8,punct:1.4,landmark:1,hueShift:4,accent:0,
      bands:4,fog:true,fogAmt:0.35}},
    {name:'EMPTY QUARTER',params:{timeOfDay:'dusk',relief:38,terrace:0.7,terraceSteps:4,
      rough:0.44,basinR:150,density:0.4,punct:0.6,landmark:0,hueShift:-4,accent:0,
      bands:3}},
    {name:'SEPIA NIGHT',params:{timeOfDay:'night',relief:44,terrace:0.8,terraceSteps:5,
      rough:0.5,basinR:130,density:0.7,punct:1.2,landmark:2,hueShift:0,accent:0,
      bands:4}}
  ]
};

global.BACKLOT_PACKS=global.BACKLOT_PACKS||{};
global.BACKLOT_PACKS['inkwash-canyon']=PACK;

})(window);
