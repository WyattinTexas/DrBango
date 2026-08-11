/* ═══════════════════════════════════════════════════════════════════════════════════════════
   NEON CIRCUIT — BACKLOT style pack (doc §10 row 4). Synthwave night — the one dark pack.
   Glow is PAINTED, not emissive: treatment:'flat' means MeshBasicMaterial everywhere, and
   an unlit saturated hex on near-black surroundings IS the glow trick. Deep indigo-to-black
   sky bands, dense star field, a huge chrome-banded sun with stripe bites, a magenta horizon
   glow wall; near-black glass ground with the pack's ONE ground-decal canvas = the glowing
   grid; rim mountains as faceted dark masses whose cliff hexes are bright edge tones so
   crests read as lit wireframe ridges (cliffDy law). One giant magenta obelisk landmark;
   one AMBER beacon doing the wrong-colour job.
   Data + paint only — the engine (env-law.js) owns the pipeline.
   ═══════════════════════════════════════════════════════════════════════════════════════════ */
(function (global) {
'use strict';
const EL=global.EL,shade=EL.shade,mix=EL.mix,rng=EL.rng,rint=EL.rint,clamp=EL.clamp;

/* band thresholds as fraction of relief — shared by terrain faces */
const BAND_FR=[0.10,0.30,0.55,0.80];

/* timeOfDay reinterprets the palette IN-REGISTER (doc requirement): every variant is still
   synthwave night-family — there is no blue daylight in this world, only different neon. */
const SKYS={   /* 4 bands, top→horizon (deep indigo-to-black; horizon slightly lifts) */
  night:['#050510','#0B0B1E','#121230','#1A1540'],
  dusk: ['#0A0714','#170D2A','#251240','#38175A'],
  dawn: ['#0A0812','#181026','#2A1838','#41204E'],
  day:  ['#0B1020','#131A36','#1C2650','#2A3468']   /* "arcade noon" — indigo VHS blue */
};
const GLOWS={  /* the horizon glow wall: outer / mid / core strips above the horizon */
  night:{core:'#FF4FB2',mid:'#A82C74',outer:'#4A163E'},
  dusk: {core:'#FF6FA6',mid:'#B03060',outer:'#571838'},
  dawn: {core:'#F27BB4',mid:'#A04878',outer:'#46223E'},
  day:  {core:'#35DCE8',mid:'#22909E',outer:'#123648'}   /* day glows cyan, not magenta */
};
const SUNS={   /* chrome-banded sun, 4 flat bands top→bottom (never amber — the wrong
                  colour stays singular; the sun is chrome → magenta) */
  night:['#F4EDF0','#E4BFD6','#EA5FA8','#D8258E'],
  dusk: ['#FBF3E2','#F0BCC4','#EE6FA8','#DC2A8C'],
  dawn: ['#F8F2F4','#E9CCDE','#EE8CBC','#DE4C9E'],
  day:  ['#F4F7FA','#D6DEE6','#A8B8C8','#7E92AA']
};

const PACK={
  name:'neon-circuit',
  label:'NEON CIRCUIT',
  blurb:'Synthwave night: a glowing grid on black glass, wireframe mountain rims, a chrome sun bitten by stripes, one magenta obelisk — and a single amber beacon that does not belong.',
  treatment:'flat',

  /* ── palette(params, rnd) — ≤7 base hues + derived shades (doc §7) ───────────────────
     Base hues: near-black indigo (ground family), cyan, magenta, deep violet (cliff edge
     family), chrome (sun), AMBER (THE wrong colour), sky table.
     DELIBERATELY NON-GOUACHE (doc §7 exemption, comment required): the neon register
     lives OUTSIDE the HB gouache box on purpose — near-black grounds sit at L≈0.06 and
     the neon accents at S≈0.80; EL.gouache() is intentionally NOT applied to any band.
     hueShift rotates the NEON family (cyan/magenta/violet + grid); the near-black ground
     barely carries hue and the sky stays put — the night holds. */
  palette:function(params,rnd){
    const hs=params.hueShift||0,tod=params.timeOfDay||'night';
    const g=function(hex){return hs?shade(hex,0,hs,0):hex};
    const SKY=SKYS[tod]||SKYS.night,GLOW=GLOWS[tod]||GLOWS.night,SUN=SUNS[tod]||SUNS.night;
    const nb=params.bands===3?[SKY[0],SKY[1],SKY[3]]:params.bands===1?[SKY[2]]:SKY;
    /* tod tone on the near-blacks: day cools toward VHS blue, dusk/dawn warm a hair */
    const tone=function(hex){
      if(tod==='day')return mix(hex,'#0E1430',0.40);
      if(tod==='dusk')return mix(hex,'#150C20',0.30);
      if(tod==='dawn')return mix(hex,'#170E1E',0.25);
      return hex;
    };
    const G=function(hex){return tone(g(hex))};
    const cyan=g('#1FD4E4'),magenta=g('#E0359C'),violet=g('#8A3CB8');
    const ground={
      floor:  G('#0B0B18'),                       /* black glass — the kart canvas */
      b0:     G('#0A0A18'),
      b1:     G('#101028'),
      b2:     G('#16163A'),
      b3:     G('#1D1D4C'),
      b4:     G('#25255E'),
      /* cliff hexes = the "lit wireframe" edges: dim violet low, bright violet mid,
         electric cyan on the caps — crests catch the light (cliffDy law) */
      cliffLo:G('#241A48'),
      cliffMid:g('#4A2A8E'),
      cliffHi:g('#23AECE')
    };
    const accent=[ '#F2A93B','#F2762E','#C8E23A' ][params.accent||0];  /* amber canon */
    const pal={
      sky:{cols:nb,horizon:nb[nb.length-1],glow:GLOW,sunCols:SUN,
           stars:'#D6E9F2',stars2:'#E4B8DC',punct:'#CFEAF4',bite:'#070712'},
      ground:ground,
      grid:{line:cyan,halo:mix(cyan,'#0B0B18',0.35),ring:magenta,
            ringHalo:mix(magenta,'#0B0B18',0.35)},
      props:{
        mast:G('#131328'),stalk:G('#0F0F20'),shard:G('#1B1440'),
        gemA:cyan,gemB:magenta,monolith:g('#E23AA4'),chevron:cyan
      },
      accent:accent,
      water:G('#0E1A38'),
      shore:shade(cyan,-0.16,0,-0.18),            /* dim cyan shoreline traces the pools */
      aer:mix(GLOW.mid,nb[nb.length-1],0.5),      /* distance lifts terrain toward glow */
      /* ink NEVER black (hard law): EL.ink() drops L by 0.38, and the old near-black
         base '#2A1E4E' (L≈0.21) clamped to #000000. Derive from a mid-violet instead
         (L≈0.50) → a true dark-violet line tone in-register. */
      ink:EL.ink('#7E4EB2'),
      swatches:[ground.b1,ground.b3,ground.cliffHi,cyan,magenta,
                pal_safe(nb),GLOW.core,accent]
    };
    return pal;
  },

  /* ── terrain(params, rnd, pal) -> heightfield profile (doc §4) ───────────────────────
     Ridged op (engine, new) folds the FBM into serrated crests; terrace dial composes on
     top (crank it for stepped neon mesas). Basin roll is nearly zero — black GLASS. */
  terrain:function(params,rnd,pal){
    const R=params.relief,g=pal.ground;
    const prof={
      size:600,segs:params.detail,relief:R,
      octaves:4,persistence:params.rough,lacunarity:2.1,scale:1/150,
      contrast:2.0,power:1.2,
      ridged:{strength:0.6,sharp:2.4},
      terrace:{steps:params.terraceSteps,strength:params.terrace,sharp:2.6},
      rim:{r0:params.basinR+5,r1:266,lo:0.42},
      /* BASIN LAW vs WATER: the glass floor always rides above the water line —
         water pools in the valleys BEYOND the rim, never inside the basin */
      basin:{r:params.basinR,blend:46,roll:0.12,rollScale:1/47,
        floor:params.water?Math.max(0.4,params.waterLevel+1.2):0.4},
      basinC:g.floor,
      bands:[
        {upTo:BAND_FR[0]*R,c:g.b0,cliff:g.cliffLo},
        {upTo:BAND_FR[1]*R,c:g.b1,cliff:g.cliffLo},
        {upTo:BAND_FR[2]*R,c:g.b2,cliff:g.cliffMid},
        {upTo:BAND_FR[3]*R,c:g.b3,cliff:g.cliffMid},
        {upTo:1e9,         c:g.b4,cliff:g.cliffHi}   /* electric caps — crest light */
      ],
      cliffDy:5.2,
      aerial:{sky:pal.aer,start:180,end:520,max:0.42}
    };
    if(params.water)prof.shore={level:params.waterLevel,c:pal.shore};
    return prof;
  },

  /* ── paintSky(ctx,w,h,pal,params,rnd) — indigo-to-black bands, dense stars (punct),
        the huge chrome-banded sun with stripe bites, the magenta glow wall, and two
        wireframe-crested silhouette rows. Stage compressed to [0.30h..0.50h] (kart-
        visible strip); sizes are ANGULAR (fractions of h ⇒ deg/180). ────────────────── */
  paintSky:function(ctx,w,h,pal,params,rnd){
    const tod=params.timeOfDay||'night';
    const hor=h*0.5,top=h*0.30;
    const seed=Math.floor(rnd()*1e9)^((params.skyVar|0)*7919);
    /* draw the sun's placement from rnd FIRST so the punct dial never moves the sun
       (twinkles are the only later rnd consumer) */
    const sx=rng(rnd,0.08,0.92)*w;
    const lift=tod==='day'?rng(rnd,0.135,0.155):
               tod==='dawn'?rng(rnd,0.115,0.135):rng(rnd,0.105,0.125);   /* ≥17° law */
    const sr=h*(tod==='dusk'?rng(rnd,0.055,0.066):
                tod==='day'?rng(rnd,0.036,0.044):rng(rnd,0.046,0.056));
    const sy=hor-h*lift;

    EL.sky.bands(ctx,w,h,pal.sky.cols,{seed:seed,top:top,hor:hor});
    EL.sky.haze(ctx,w,h,'#060610',hor);              /* below the line: near-black */

    /* the horizon glow wall — three flat strips, brightest at the line (painted glow;
       tall enough to peek over the 3D rim at kart eye) */
    const GL=pal.sky.glow;
    ctx.fillStyle=GL.outer;ctx.fillRect(0,hor-h*0.058,w,h*0.058);
    ctx.fillStyle=GL.mid;  ctx.fillRect(0,hor-h*0.032,w,h*0.032);
    ctx.fillStyle=GL.core; ctx.fillRect(0,hor-h*0.015,w,h*0.015);

    /* dense star field — SKY PUNCTUATION: scaled by the dial, dial 0 ⇒ zero stars */
    const pv=params.punct==null?1:params.punct;
    const ns=Math.round(110*pv);
    if(ns>0){
      EL.sky.stars(ctx,{w:w,y0:h*0.05,y1:hor-h*0.075,n:ns,
        color:pal.sky.stars,seed:seed^0xA71});
      EL.sky.stars(ctx,{w:w,y0:h*0.05,y1:hor-h*0.10,n:Math.max(1,Math.round(ns*0.22)),
        color:pal.sky.stars2,seed:seed^0x3B5});
    }

    /* THE CHROME SUN — huge, low on one heading, striped with bites */
    chromeSun(ctx,sx,sy,sr,pal.sky.sunCols,pal.sky.bite);

    /* wireframe mountain rows — triangular peaks (the synth canon), dark masses with
       a stroked bright ridgeline; the far row violet, the near row magenta */
    peakRow(ctx,w,h,{y:hor,rise:h*0.052,seed:seed^0x1234,
      fill:'#14112E',edge:'#8A3AB0',lw:2.2});
    peakRow(ctx,w,h,{y:hor,rise:h*0.080,seed:seed^0x8765,
      fill:'#0C0A20',edge:'#D23A9E',lw:2.6});

    /* big four-ray twinkles — punctuation, odd counts, dial 0 ⇒ none */
    const np=pv<=0?0:clamp(Math.round(3*pv)|1,1,7);
    for(let i=0;i<np;i++){
      EL.sky.twinkle(ctx,{x:rng(rnd,0.04,0.96)*w,y:h*rng(rnd,0.31,0.40),
        r:h*rng(rnd,0.008,0.014),color:pal.sky.punct});
    }
  },

  /* ── props(EL, rnd, params, pal) -> scatter tables (doc §6) ──────────────────────────
     Exactly ONE landmark (first table). All meshes share unit geometries + the flatKit
     material cache — no InstancedMesh anywhere (r147 GLTFExporter law). The grid decal
     is this pack's ONE ground-decal canvas (budget law §5). */
  props:function(EL,rnd,params,pal){
    const T=global.THREE,kit=EL.flatKit();
    const R=params.relief,basinR=params.basinR,ps=params.propScale||1;
    /* LANDMARK DOMINANCE FLOOR (§3/§6): the obelisk out-ranks the rim at every relief */
    const Rl=Math.max(R,26+8*ps);
    /* shared unit geometries */
    const mastGeo=new T.CylinderGeometry(1,1,1,6,1);
    const ringGeo=new T.CylinderGeometry(1,1,1,10,1);        /* washer ring */
    const boxGeo=new T.BoxGeometry(1,1,1);
    const gemGeo=new T.OctahedronGeometry(1,0);
    const shardGeo=new T.IcosahedronGeometry(1,0);
    const obGeo=new T.CylinderGeometry(0.42,1,1,4,1);        /* 4-sided tapered monolith */
    const torusGeo=new T.TorusGeometry(1,0.07,8,20);
    const sphereGeo=new T.SphereGeometry(1,10,7);

    /* magenta monolith + cyan torus rings + a floating gem above the tip */
    function obelisk(H,baseR,ringN){
      const grp=new T.Group();
      const body=new T.Mesh(obGeo,kit.mat(pal.props.monolith));
      body.scale.set(baseR,H,baseR);body.position.y=H/2;grp.add(body);
      for(let i=0;i<ringN;i++){
        const f=0.28+0.52*(i/(ringN-1||1));
        const rr=baseR*(1-0.58*f)*1.5+1.2;                   /* just clear of the taper */
        const tr=new T.Mesh(torusGeo,kit.mat(pal.props.gemA));
        tr.scale.set(rr,rr,rr);tr.rotation.x=Math.PI/2;tr.position.y=H*f;grp.add(tr);
      }
      const gem=new T.Mesh(gemGeo,kit.mat(pal.props.gemA));
      gem.scale.set(H*0.045,H*0.07,H*0.045);gem.position.y=H*1.06;grp.add(gem);
      return grp;
    }

    const tables=[];

    /* THE ONE LANDMARK — variants: 0 THE OBELISK · 1 THE TWIN GATES · 2 THE NEEDLE.
       footprint declared (§3 extent-aware keep-out + vertex grounding). */
    const lv=params.landmark||0;
    let lmH,lmFp;
    if(lv===1){lmH=Rl*1.30;lmFp=lmH*0.42}
    else if(lv===2){lmH=Rl*1.75;lmFp=lmH*0.12}
    else{lmH=Rl*1.50;lmFp=lmH*0.16}
    tables.push({
      landmark:true,count:1,rad:55,footprint:lmFp,
      ring:[Math.max(basinR+20,115),Math.max(basinR+50,200)],
      make:function(){
        const grp=new T.Group();
        if(lv===1){                                   /* TWIN GATES — paired monoliths */
          grp.add(obelisk(lmH,lmH*0.10,3));
          const b=obelisk(lmH*0.68,lmH*0.075,2);
          b.position.set(lmH*0.30,0,lmH*0.08);grp.add(b);
        }else if(lv===2){                             /* THE NEEDLE — thin, 5 rings */
          grp.add(obelisk(lmH,lmH*0.065,5));
        }else{                                        /* THE OBELISK */
          grp.add(obelisk(lmH,lmH*0.105,3));
        }
        return grp;
      },
      sink:1.2
    });

    /* neon pylons — dark mast + bright banded rings (cyan/magenta alternating) */
    tables.push({
      count:9,odd:true,rad:6,
      ring:[basinR+12,285],scaleRng:[0.85,1.3],
      make:function(T2,r2,s){
        const grp=new T.Group(),H=13*s;
        const m=new T.Mesh(mastGeo,kit.mat(pal.props.mast));
        m.scale.set(0.5,H,0.5);m.position.y=H/2;grp.add(m);
        for(let k=0;k<5;k++){
          const r=new T.Mesh(ringGeo,kit.mat(k%2?pal.props.gemB:pal.props.gemA));
          r.scale.set(1.3,0.55,1.3);r.position.y=H*(0.30+0.16*k);grp.add(r);
        }
        const c=new T.Mesh(gemGeo,kit.mat(pal.props.gemA));
        c.scale.set(0.7,1.0,0.7);c.position.y=H+0.9;grp.add(c);
        return grp;
      },
      sink:0.4
    });

    /* floating-read diamonds — bright octahedra on near-black stalks: at night the
       stalk vanishes and the gem floats */
    tables.push({
      count:7,odd:true,rad:5,
      ring:[basinR+28,265],scaleRng:[0.8,1.3],
      make:function(T2,r2,s,i){
        const grp=new T.Group(),H=7.5*s;
        const st=new T.Mesh(mastGeo,kit.mat(pal.props.stalk));
        st.scale.set(0.22,H,0.22);st.position.y=H/2;grp.add(st);
        const gm=new T.Mesh(gemGeo,kit.mat(i%2?pal.props.gemB:pal.props.gemA));
        gm.scale.set(1.5*s,2.3*s,1.5*s);gm.position.y=H+2.0*s;
        gm.rotation.y=Math.PI/4;grp.add(gm);
        return grp;
      },
      sink:0.3
    });

    /* chevron gates near the rim — edge punctuation (punct dial, odd, arc cluster) */
    tables.push({
      count:3,odd:true,punct:true,rad:10,arc:4.2,footprint:5,
      ring:[basinR+2,basinR+42],
      make:function(T2,r2,s){
        const grp=new T.Group(),W=9*s,H=7*s;
        for(let sgn=-1;sgn<=1;sgn+=2){
          const p=new T.Mesh(boxGeo,kit.mat(pal.props.mast));
          p.scale.set(0.9,H,0.9);p.position.set(sgn*W/2,H/2,0);grp.add(p);
          const b=new T.Mesh(boxGeo,kit.mat(pal.props.chevron));
          b.scale.set(W*0.60,0.7,0.7);b.rotation.z=-sgn*0.42;
          b.position.set(sgn*W/4,H+W*0.056,0);grp.add(b);
        }
        return grp;
      },
      sink:0.4
    });

    /* obsidian shards — dark violet texture without noise */
    tables.push({
      count:16,rad:3,
      ring:[basinR+10,278],scaleRng:[1.0,2.6],
      make:function(T2,r2,s){
        const m=new T.Mesh(shardGeo,kit.mat(pal.props.shard));
        m.scale.set(s*rng(rnd,0.9,1.4),s*rng(rnd,0.6,1.1),s*rng(rnd,0.9,1.4));
        return m;
      },
      sink:0.4
    });

    /* THE AMBER BEACON — the one wrong colour (doc §7). fixed: exactly ONE at every
       density; near the basin floor so it reads at eye 1.1 m. */
    tables.push({
      count:1,rad:6,insideBasinOK:true,fixed:true,align:'none',
      ring:[basinR*0.45,basinR*0.78],
      make:function(){
        const grp=new T.Group(),H=7.5;
        const p=new T.Mesh(mastGeo,kit.mat(pal.props.stalk));
        p.scale.set(0.3,H,0.3);p.position.y=H/2;grp.add(p);
        const s=new T.Mesh(sphereGeo,kit.mat(pal.accent));
        s.scale.set(1.6,1.6,1.6);s.position.y=H+1.3;grp.add(s);
        const halo=new T.Mesh(ringGeo,kit.mat(pal.accent));
        halo.scale.set(2.4,0.26,2.4);halo.position.y=H+0.1;grp.add(halo);
        return grp;
      },
      sink:0.2
    });

    /* THE GRID — the pack's ONE ground decal canvas (budget law §5): a transparent
       plane riding the glass floor, painted with a cyan cartesian grid + magenta ring
       accents, alpha fading with radius (perspective-neutral). fixed: infrastructure,
       not punctuation — it survives density 0. */
    tables.push({
      count:1,rad:0.01,insideBasinOK:true,fixed:true,align:'none',
      ring:[0,0.01],
      make:function(){
        const worldR=basinR-8;
        const cv=document.createElement('canvas');cv.width=cv.height=2048;
        paintGrid(cv.getContext('2d'),2048,worldR,pal.grid);
        const tex=new T.CanvasTexture(cv);
        /* grazing-angle law: at axis-aligned headings the kart looks straight DOWN a
           grid line and trilinear minification smears it into a floodlight wedge.
           Anisotropy sharpens it where the backend has the EXT (harmless no-op
           otherwise — deterministic either way); the deeper spawn fade below does
           the rest in paint. */
        tex.anisotropy=8;
        const geo=new T.PlaneGeometry(2,2,1,1);geo.rotateX(-Math.PI/2);
        const m=new T.Mesh(geo,new T.MeshBasicMaterial({map:tex,transparent:true,
          depthWrite:false}));
        m.scale.set(worldR,1,worldR);m.name='neon-grid';
        return m;
      },
      /* glass floor rolls ±0.12 m — 0.22 m ride height clears it everywhere */
      yAt:function(heightAt,x,z){return heightAt(x,z)+0.22}
    });

    return tables;
  },

  /* ── ≥3 hand-tuned presets (doc §2). Preset 0 = pack defaults. ─────────────────────── */
  presets:[
    {name:'MIDNIGHT GRID',params:{timeOfDay:'night',relief:58,terrace:0.3,terraceSteps:5,
      rough:0.52,basinR:130,density:1.0,punct:1.2,landmark:0,hueShift:0,accent:0,bands:4,
      water:false}},
    {name:'CHROME SUNSET',params:{timeOfDay:'dusk',relief:68,terrace:0.45,terraceSteps:6,
      rough:0.5,basinR:120,density:1.1,punct:0.9,landmark:1,hueShift:0,accent:0,bands:4,
      water:false}},
    {name:'LASER DAWN',params:{timeOfDay:'dawn',relief:50,terrace:0.25,terraceSteps:5,
      rough:0.55,basinR:140,density:0.9,punct:1.6,landmark:2,hueShift:8,accent:1,bands:3,
      water:true,waterLevel:2.5}}
  ]
};

/* swatch helper — first sky band regardless of band-count variant */
function pal_safe(nb){return nb[0]}

/* THE CHROME SUN — flat horizontal bands clipped to the disc, then the classic synth
   stripe bites: near-black gaps that fatten toward the bottom. Painted as an ELLIPSE,
   wider than tall: near the horizon the dome's azimuth circles foreshorten (cos e) and
   the pitched-up kart cam stretches verticals, so a canvas circle renders as a tall
   oval — rx 1.16 / ry 0.86 counter-distorts back to a round sun at the judge camera. */
function chromeSun(ctx,x,y,r,cols,bite){
  const rx=r*1.16,ry=r*0.86;
  ctx.save();
  ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,6.28318);ctx.clip();
  const stops=[0,0.30,0.48,0.64,1.001];
  for(let i=0;i<4;i++){
    ctx.fillStyle=cols[i];
    ctx.fillRect(x-rx,y-ry+stops[i]*2*ry,2*rx,(stops[i+1]-stops[i])*2*ry+1);
  }
  ctx.fillStyle=bite;
  let yb=y-ry*0.06,t=ry*0.045,gap=ry*0.115;
  while(yb<y+ry){
    ctx.fillRect(x-rx,yb,2*rx,t);
    yb+=t+gap;t*=1.38;gap*=0.88;
  }
  ctx.restore();
}

/* triangular wireframe mountain row — the synth canon: a seeded jagged polyline,
   filled as a dark mass, then the contour stroked in the bright edge tone so every
   ridgeline glows (valleys ride a hair above the horizon = the grid-horizon line).
   SEAM-SAFE WRAP (dome law): the old row started off-canvas at a baseline point and
   ended mid-slope past w — the equirect wrap put an up-to-8° ridge CLIFF at one
   azimuth. Now the first and last anchors are the SAME valley height at exactly
   x=0 / x=w (x rescaled to land the last valley on the seam), so the bright stroked
   ridgeline meets itself around the dome — the pack-space analogue of
   EL.sky.silhouetteRow's baseline guarantee. */
function peakRow(ctx,w,h,o){
  const jr=EL.mulberry32((o.seed>>>0)^0x9E37);
  const v0=o.y-o.rise*rng(jr,0,0.14);
  const pts=[[0,v0]];
  let x=0;
  while(x<w){
    x+=rng(jr,50,130);
    pts.push([x,o.y-o.rise*rng(jr,0.35,1.0)]);           /* peak */
    x+=rng(jr,50,130);
    pts.push([x,o.y-o.rise*rng(jr,0,0.14)]);             /* valley, near the line */
  }
  const sc=w/x;                        /* land the final valley EXACTLY on the seam */
  for(let i=1;i<pts.length;i++)pts[i][0]*=sc;
  pts[pts.length-1][1]=v0;             /* …at the height the row started with */
  ctx.fillStyle=o.fill;ctx.beginPath();
  ctx.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);
  ctx.lineTo(w,o.y+o.rise*2+40);ctx.lineTo(0,o.y+o.rise*2+40);
  ctx.closePath();ctx.fill();
  ctx.strokeStyle=o.edge;ctx.lineWidth=o.lw||2.4;ctx.lineJoin='round';
  ctx.beginPath();
  ctx.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);
  ctx.stroke();
}

/* THE GRID decal paint — deterministic, no rnd: cyan cartesian lines every 9 m with a
   painted halo (wide dim pass under a thin bright pass = glow), magenta ring accents
   every 24 m, all alpha-fading to nothing by the basin rim (destination-out). */
function paintGrid(c,S,worldR,grid){
  const pxm=(S/2)/worldR;                     /* px per meter */
  const cx=S/2;
  function lines(lw,alpha,style){
    c.lineWidth=lw;c.globalAlpha=alpha;c.strokeStyle=style;
    const step=9*pxm;
    c.beginPath();
    for(let v=cx%step;v<=S;v+=step){c.moveTo(v,0);c.lineTo(v,S);c.moveTo(0,v);c.lineTo(S,v)}
    c.stroke();
  }
  lines(1.05*pxm,0.17,grid.halo);
  lines(0.34*pxm,0.88,grid.line);
  function rings(lw,alpha,style){
    c.lineWidth=lw;c.globalAlpha=alpha;c.strokeStyle=style;
    for(let rm=24;rm<worldR;rm+=24){
      c.beginPath();c.arc(cx,cx,rm*pxm,0,6.28318);c.stroke();
    }
  }
  rings(1.6*pxm,0.26,grid.ringHalo);
  rings(0.55*pxm,0.88,grid.ring);
  c.globalAlpha=1;
  /* outer fade — the grid dies before the basin rim */
  const fade=c.createRadialGradient(cx,cx,0,cx,cx,S/2);
  fade.addColorStop(0.0,'rgba(0,0,0,0)');
  fade.addColorStop(0.55,'rgba(0,0,0,0)');
  fade.addColorStop(0.97,'rgba(0,0,0,1)');
  c.globalCompositeOperation='destination-out';
  c.fillStyle=fade;c.fillRect(0,0,S,S);
  /* inner fade — the kart spawns at the centre: soften the nearest lines so the
     grazing view doesn't blow them up into floodlight beams (basin calm law).
     34 m / 0.72 was NOT enough: the scatter engine drops the decal centre up to
     ~10 m off origin, so the spawn could sit at ~46% line strength and an
     axis-aligned heading still saw a fat cyan wedge. 58 m / 0.9 keeps the spawn
     area calm at every decal offset. */
  const inner=c.createRadialGradient(cx,cx,0,cx,cx,58*pxm);
  inner.addColorStop(0.0,'rgba(0,0,0,0.90)');
  inner.addColorStop(0.45,'rgba(0,0,0,0.62)');
  inner.addColorStop(1.0,'rgba(0,0,0,0)');
  c.fillStyle=inner;c.fillRect(0,0,S,S);
  c.globalCompositeOperation='source-over';
}

global.BACKLOT_PACKS=global.BACKLOT_PACKS||{};
global.BACKLOT_PACKS['neon-circuit']=PACK;

})(window);
