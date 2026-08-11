/* ═══════════════════════════════════════════════════════════════════════════════════════════
   MESA GOLDEN — BACKLOT style pack (doc §10 row 1). The house look off-Mars.
   Terraced butter-gold mesas under a 4-band dusk sky, googie punctuation on the rim,
   one teal pond doing the wrong-colour job. treatment:'flat' — MeshBasicMaterial
   everywhere; "lighting" is painted bands + the sky (the HB register).
   Data + paint only — the engine (env-law.js) owns the pipeline.
   ═══════════════════════════════════════════════════════════════════════════════════════════ */
(function (global) {
'use strict';
const EL=global.EL,PAL=EL.PAL,shade=EL.shade,mix=EL.mix,rng=EL.rng,rint=EL.rint,
      clamp=EL.clamp,mulberry32=EL.mulberry32;

/* band thresholds as fraction of relief — shared by terrain faces AND stacked-tier props
   so buttes read as kin to the ground they stand on. */
const BAND_FR=[0.06,0.26,0.52,0.80];

function skyTable(tod){
  return tod==='day'?PAL.skyJet:tod==='dawn'?PAL.skyStone:tod==='night'?PAL.skyNight:PAL.skyDusk;
}

const PACK={
  name:'mesa-golden',
  label:'MESA GOLDEN',
  blurb:'Terraced butter-gold mesas under a four-band dusk sky. Googie masts lean on the rim; one teal pond wears the wrong colour on purpose.',
  treatment:'flat',

  /* ── palette(params, rnd) — ≤7 base hues + derived shades (doc §7) ───────────────────
     Base hues: dirt, stone/gold, pink rock (Lozzi canon), plum, cream, teal (THE wrong
     colour), sky table. hueShift rotates the ground family; sky stays put. */
  palette:function(params,rnd){
    const hs=params.hueShift||0,tod=params.timeOfDay||'dusk';
    const g=function(hex){return hs?shade(hex,0,hs,0):hex};
    const SKY=skyTable(tod);
    const nb=params.bands===3?[SKY[0],SKY[1],SKY[3]]:params.bands===1?[SKY[2]]:SKY;
    /* night dims the ground toward the sky's own blue; dawn cools it a touch */
    const tone=function(hex){
      if(tod==='night')return mix(hex,SKY[0],0.42);
      if(tod==='dawn')return mix(hex,SKY[1],0.10);
      return hex;
    };
    /* every ground band passes the §7 gouache clamp — night/dawn tone mixes were
       desaturating bands out of the HB box (S≥0.20) and stoneL sat at L 0.74 */
    const G=function(hex){return EL.gouache(tone(g(hex)))};
    /* rising value ramp, foot→cap: dark brown → golden brown → butter → stone gold →
       pale caps. Every hex from the WL tables or one shade() step off them. */
    const ground={
      floor:  G(shade(PAL.stone,-0.02,2,-0.12)),       /* calm greyed gold — kart canvas */
      b0:     G(PAL.dirtM),
      b1:     G(PAL.dirtF),
      b2:     G(shade(PAL.thatch,0.05,0,0.02)),        /* the butter */
      b3:     G(PAL.stone),
      b4:     G(PAL.stoneL),                           /* pale gold caps */
      cliffLo:G(PAL.dirtN),
      cliffHi:G(PAL.rockC)                             /* Lozzi pink cliff faces — canon */
    };
    const accent=[PAL.teal,PAL.neonAqua,PAL.neonPink][params.accent||0];
    const pal={
      sky:{cols:nb,horizon:nb[nb.length-1],
           sun:tod==='night'?PAL.bone:PAL.cream,
           punct:tod==='night'?PAL.bone:shade(SKY[0],0.30,0,0.06)},
      ground:ground,
      props:{mast:tone(g(PAL.plum)),saucer:tone(PAL.cream),beacon:PAL.amber,
             rock:G(PAL.stoneS),scrub:G(shade(PAL.dirtN,-0.08,0,0)),
             pink:G(PAL.rockC)},
      accent:accent,
      water:shade(accent,-0.06,0,-0.04),
      ink:EL.ink(PAL.dirtM),
      /* band lookup for stacked-tier props: frac 0..1 of a mass's own height */
      bandAt:function(fr){
        return fr<=BAND_FR[0]?ground.b0:fr<=BAND_FR[1]?ground.b1:
               fr<=BAND_FR[2]?ground.b2:fr<=BAND_FR[3]?ground.b3:ground.b4;
      },
      swatches:[ground.b1,ground.b2,ground.b3,ground.b4,ground.cliffHi,
                nb[0],nb[nb.length-1],accent]
    };
    return pal;
  },

  /* ── terrain(params, rnd, pal) -> heightfield profile (doc §4) ─────────────────────── */
  terrain:function(params,rnd,pal){
    const R=params.relief,g=pal.ground;
    const prof={
      size:600,segs:params.detail,relief:R,
      octaves:4,persistence:params.rough,lacunarity:2.05,scale:1/158,
      contrast:1.9,power:1.3,
      terrace:{steps:params.terraceSteps,strength:params.terrace,sharp:3.0},
      rim:{r0:params.basinR+5,r1:262,lo:0.5},
      /* BASIN LAW vs WATER: the playable floor always rides ≥0.3 m above the water
         line (floor − roll amplitude > waterLevel) — water fills the valleys BEYOND
         the rim, never the basin */
      basin:{r:params.basinR,blend:52,roll:0.9,rollScale:1/47,
        floor:params.water?Math.max(0.35,params.waterLevel+1.2):0.35},
      basinC:g.floor,
      bands:[
        {upTo:BAND_FR[0]*R,c:g.b0,cliff:g.cliffLo},
        {upTo:BAND_FR[1]*R,c:g.b1,cliff:g.cliffLo},
        {upTo:BAND_FR[2]*R,c:g.b2,cliff:g.cliffLo},
        {upTo:BAND_FR[3]*R,c:g.b3,cliff:g.cliffLo},
        {upTo:1e9,        c:g.b4,cliff:g.cliffHi}   /* Lozzi pink lives on the caps only */
      ],
      cliffDy:5.2,        /* cliff = face taller than 5.2 m — true terrace fronts only */
      aerial:{sky:pal.sky.horizon,start:170,end:520,max:0.34}
    };
    if(params.water)prof.shore={level:params.waterLevel,c:shade(g.b4,0.04,0,-0.06)};
    return prof;
  },

  /* ── paintSky(ctx,w,h,pal,params,rnd) — 4 hard dusk bands + scallops + sun disc +
        sparse punctuation + far mesa silhouette rows (doc §8). Sky owns ~55% of the
        kart frame; horizon = canvas y = h/2. ─────────────────────────────────────────── */
  paintSky:function(ctx,w,h,pal,params,rnd){
    const tod=params.timeOfDay||'dusk';
    /* stage compressed to the KART-VISIBLE strip: horizon = 0.5h (v .5 on the dome),
       stage top = 0.30h ≈ elevation 36° — all 4 bands land inside the judge frame.
       Sizes below are ANGULAR (fractions of h ⇒ degrees/180), not stage fractions. */
    const hor=h*0.5,top=h*0.30;
    const seed=Math.floor(rnd()*1e9)^((params.skyVar|0)*7919);
    const stops=EL.sky.bands(ctx,w,h,pal.sky.cols,{seed:seed,top:top,hor:hor});
    const horC=pal.sky.horizon;
    EL.sky.haze(ctx,w,h,shade(horC,-0.06,3,-0.03),hor);
    /* sun / moon — never centred, and HIGH enough to read at kart eye: centre at
       17–23° elevation clears the silhouette rows (rise ≤ 0.082h ≈ 14.8°) and the
       3D rim terrain (~6–15°) at the judge camera */
    const sx=rng(rnd,0.10,0.90)*w,sy=hor-h*rng(rnd,0.095,0.130),sr=h*rng(rnd,0.024,0.032);
    const pv=params.punct==null?1:params.punct;
    if(tod==='night'){
      const ns=Math.round(20*pv);           /* PUNCTUATION 0 ⇒ zero stars */
      if(ns>0)EL.sky.stars(ctx,{w:w,y0:top-h*0.04,y1:hor-h*0.08,n:ns,
        color:pal.sky.punct,seed:seed^0xA71});
      EL.sky.sunDisc(ctx,{x:sx,y:sy-h*0.03,r:sr*0.9,color:pal.sky.sun,
        crescent:true,bg:bandAtY(pal.sky.cols,sy-h*0.03,top,hor,stops)});
    }else{
      EL.sky.sunDisc(ctx,{x:sx,y:sy,r:sr,color:pal.sky.sun,rings:tod==='dusk'?2:0,
        ringColor:shade(pal.sky.sun,-0.06,6,0)});
    }
    /* far mesa silhouette rows — the layered horizon at every heading */
    EL.sky.silhouetteRow(ctx,w,h,{y:hor,rise:h*0.050,seed:seed^0x1234,
      color:mix(pal.ground.b3,horC,0.66)});
    EL.sky.silhouetteRow(ctx,w,h,{y:hor,rise:h*0.082,seed:seed^0x8765,
      color:mix(pal.ground.b2,horC,0.42)});
    /* sparse punctuation — odd counts, scaled by the dial; dial 0 ⇒ NONE (matches
       the mast semantics in env-law scatter) */
    const np=pv<=0?0:clamp(Math.round(2*pv)|1,1,5);
    if(tod!=='night')for(let i=0;i<np;i++){
      EL.sky.twinkle(ctx,{x:rng(rnd,0.05,0.95)*w,y:h*rng(rnd,0.31,0.385),
        r:h*rng(rnd,0.009,0.015),color:pal.sky.punct});
    }
    if(tod!=='night'&&np>0){
      const c1=pal.sky.cols[Math.max(0,pal.sky.cols.length-3)];
      EL.sky.cloud(ctx,{x:rng(rnd,0.1,0.9)*w,y:hor-h*rng(rnd,0.10,0.15),
        w:h*rng(rnd,0.11,0.17),color:shade(c1,0.07,-4,-0.03),seed:seed^0xC1});
    }
  },

  /* ── props(EL, rnd, params, pal) -> scatter tables (doc §6) ────────────────────────────
     Exactly ONE landmark (first table). All meshes share unit geometries + the flatKit
     material cache — no InstancedMesh anywhere (r147 GLTFExporter law). */
  props:function(EL,rnd,params,pal){
    const T=global.THREE,kit=EL.flatKit();
    const R=params.relief,basinR=params.basinR,ps=params.propScale||1;
    /* LANDMARK DOMINANCE FLOOR (§3/§6): the landmark is "the thing you steer by" at
       EVERY relief — its driving height never drops below what out-ranks the buttes */
    const Rl=Math.max(R,26+8*ps);
    /* shared unit geometries */
    const tierGeo=new T.CylinderGeometry(1,1.16,1,9,1);
    const mastGeo=new T.CylinderGeometry(1,1,1,6,1);
    const saucerGeo=new T.SphereGeometry(1,10,7);
    const rockGeo=new T.IcosahedronGeometry(1,0);

    /* stacked terraced mass: tiers of shared cylinders, colours off the band ramp */
    function stack(H,baseR,tiers,pinkTier,squashX,squashZ){
      const grp=new T.Group();
      let y=0,r=baseR;
      const hf=[];let rem=1;
      for(let i=0;i<tiers;i++){const f=rem*(i===tiers-1?1:rng(rnd,0.34,0.46));hf.push(f);rem-=f}
      for(let i=0;i<tiers;i++){
        const th=Math.max(0.06,hf[i])*H;
        const fr=clamp((y+th)/H*0.92+0.08,0,1);
        const hex=(i===pinkTier)?pal.props.pink:pal.bandAt(fr);
        const m=new T.Mesh(tierGeo,kit.mat(hex));
        m.scale.set(r*(squashX||1),th,r*(squashZ||1));
        m.position.y=y+th/2;
        grp.add(m);
        y+=th;r*=rng(rnd,0.68,0.80);
      }
      return grp;
    }
    /* googie mast: thin leaning pole + saucer top + beacon — NEVER dead-vertical */
    function mast(){
      const grp=new T.Group();
      const H=rng(rnd,20,30),mr=0.55,sr=rng(rnd,4.2,5.6);
      const pole=new T.Mesh(mastGeo,kit.mat(pal.props.mast));
      pole.scale.set(mr,H,mr);pole.position.y=H/2;grp.add(pole);
      const sc=new T.Mesh(saucerGeo,kit.mat(pal.props.saucer));
      sc.scale.set(sr,sr*0.24,sr);sc.position.y=H;grp.add(sc);
      const bk=new T.Mesh(saucerGeo,kit.mat(pal.props.beacon));
      bk.scale.set(0.9,0.9,0.9);bk.position.y=H+sr*0.24+1.0;grp.add(bk);
      grp.rotation.z=rng(rnd,8,15)*(rnd()<0.5?-1:1)*Math.PI/180;   /* the googie lean */
      return grp;
    }

    const tables=[];

    /* THE ONE LANDMARK — oversized, silhouette-first, ring 115–200 m (doc §6).
       Each variant declares its true bottom-tier half-extent (footprint, incl. the
       1.16 bottom taper) so scatter keeps the WHOLE mass out of the basin (§3) and
       grounds every rim vertex. fpCap keeps anchor+extent on the 600 m tile even
       at BASIN RADIUS 200 (ring max stretches past the doc's 200 m only when the
       Basin Law forces it — the Basin Law outranks the ring). */
    const lv=params.landmark||0;
    const fpCap=Math.max(26,(276-basinR)/2);
    let lmH,lmFp;
    if(lv===1){        /* THE TWINS — paired spires: reach = B offset + B base */
      lmH=Math.min(Rl,fpCap/0.776)*1.5;lmFp=lmH*0.517;
    }else if(lv===2){  /* THE TABLE — long low slab: width capped, height kept */
      lmH=Rl*0.9;lmFp=Math.min(lmH*1.079,fpCap);
    }else{             /* THE MONUMENT — grand tower */
      lmH=Math.min(Rl,fpCap/0.613)*1.55;lmFp=lmH*0.395;
    }
    tables.push({
      landmark:true,count:1,rad:60,footprint:lmFp,
      ring:[Math.max(basinR+20,115),Math.max(basinR+50,200)],
      make:function(){
        const grp=new T.Group();
        if(lv===1){                                    /* THE TWINS — paired spires */
          const H=lmH;
          const a=stack(H,H*0.17,4,2);grp.add(a);
          const b=stack(H*0.62,H*0.14,3,-1);
          b.position.set(H*0.34,0,H*0.10);grp.add(b);
        }else if(lv===2){                              /* THE TABLE — long low slab */
          const H=lmH,sqX=lmFp/(H*0.62*1.16),sqZ=sqX*0.533;
          grp.add(stack(H,H*0.62,3,1,sqX,sqZ));
        }else{                                         /* THE MONUMENT — grand tower */
          grp.add(stack(lmH,lmH*0.34,5,2));
        }
        return grp;
      },
      sink:1.5
    });

    /* googie punctuation on the rim — 3 masts, odd, left-heavy cluster, may lean just
       inside the rim (edge-punctuation exception, doc §3) */
    tables.push({
      count:3,odd:true,punct:true,rad:7,insideBasinOK:true,arc:3.6,
      ring:[basinR-6,basinR+28],
      make:function(){return mast()},
      sink:0.5
    });

    /* minor buttes — the mid-ground silhouette layer. Capped UNDER the landmark
       (≤0.62× its height) so the skyline rank survives low relief; footprint keeps
       fat bases out of the basin and vertex-grounds them on terrace cliffs. */
    const butteMax=clamp(lmH*0.62/ps,15,34);
    tables.push({
      count:7,odd:true,rad:24,
      ring:[basinR+45,288],scaleRng:[Math.min(14,butteMax*0.75),butteMax],
      footprint:function(s){return s*0.99},
      make:function(T,r2,s){return stack(s,s*rng(rnd,0.55,0.85),2+(rnd()<0.55?1:0),-1)},
      sink:1.0
    });

    /* rocks */
    tables.push({
      count:22,rad:4,
      ring:[basinR+18,282],scaleRng:[1.2,3.4],
      make:function(T,r2,s){
        const m=new T.Mesh(rockGeo,kit.mat(pal.props.rock));
        m.scale.set(s*rng(rnd,0.9,1.3),s*rng(rnd,0.55,0.8),s*rng(rnd,0.9,1.3));
        return m;
      },
      sink:0.4
    });

    /* scrub — dark umber blobs, texture without noise */
    tables.push({
      count:30,rad:2,
      ring:[basinR+10,276],scaleRng:[0.8,1.7],
      make:function(T,r2,s){
        const m=new T.Mesh(rockGeo,kit.mat(pal.props.scrub));
        m.scale.set(s*1.4,s*0.6,s*1.4);
        return m;
      },
      sink:0.25
    });

    /* THE TEAL POND — the one wrong colour, in/near the basin. Kidney decal, banded.
       fixed: exactly ONE at every density (doc §7 one-wrong-colour law).
       Beauty is graded at kart height (§3): the pond sits CLOSE (0.24–0.48 basinR)
       with a 0.5 m raised teal bank, so the wrong colour reads at eye 1.1 m instead
       of vanishing edge-on. */
    tables.push({
      count:1,rad:20,insideBasinOK:true,fixed:true,
      ring:[basinR*0.24,basinR*0.48],
      make:function(){
        const grp=new T.Group();
        const r0=rng(rnd,11,16);
        const outer=EL.shapeFromLoop(EL.kidneyLoop(rnd,r0,0.62));
        const og=new T.ExtrudeGeometry(outer,{depth:2.4,bevelEnabled:false});
        og.rotateX(Math.PI/2);                          /* top face at y=0, sides down */
        grp.add(new T.Mesh(og,kit.mat(pal.water)));
        const ig=new T.ShapeGeometry(EL.shapeFromLoop(EL.kidneyLoop(rnd,r0*0.66,0.60)));
        ig.rotateX(-Math.PI/2);
        const inner=new T.Mesh(ig,kit.mat(shade(pal.accent,0.09,0,0)));
        inner.position.y=0.14;grp.add(inner);
        return grp;
      },
      yAt:function(heightAt,x,z){                       /* bank on the local max — no float */
        let m=heightAt(x,z);
        for(let i=0;i<16;i++){const a=(i>>1)/8*6.28318,rr=(i&1)?13:21;
          m=Math.max(m,heightAt(x+Math.cos(a)*rr,z+Math.sin(a)*rr))}
        return m+0.5;
      },
      align:'none'
    });

    return tables;
  },

  /* ── ≥2 hand-tuned presets (doc §2). Preset 0 = pack defaults. ─────────────────────── */
  presets:[
    {name:'GOLDEN HOUR',params:{timeOfDay:'dusk',relief:55,terrace:0.85,terraceSteps:6,
      basinR:130,density:1.0,punct:1.0,landmark:0,hueShift:0,accent:0,bands:4}},
    {name:'HIGH NOON',params:{timeOfDay:'day',relief:64,terrace:0.9,terraceSteps:5,
      basinR:120,density:1.2,punct:0.8,landmark:2,hueShift:-4,accent:0,bands:4}},
    {name:'VIOLET NIGHT',params:{timeOfDay:'night',relief:48,terrace:0.8,terraceSteps:6,
      basinR:135,density:0.9,punct:1.6,landmark:1,hueShift:4,accent:1,bands:4}}
  ]
};

/* which band colour sits at a given canvas y — used to knock the moon crescent out.
   Uses the SEEDED stops the bands were actually drawn with (EL.sky.bands returns
   them), not uniform quartiles — the bite always matches its true background. */
function bandAtY(cols,y,top,hor,stops){
  const t=clamp((y-top)/(hor-top),0,1);
  let i=0;
  for(let k=1;k<cols.length;k++)
    if(stops&&stops[k]!=null?t>=stops[k]:t>=k/cols.length)i=k;
  return cols[i];
}

global.BACKLOT_PACKS=global.BACKLOT_PACKS||{};
global.BACKLOT_PACKS['mesa-golden']=PACK;

})(window);
