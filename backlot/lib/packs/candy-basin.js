/* ═══════════════════════════════════════════════════════════════════════════════════════════
   CANDY BASIN — BACKLOT style pack (doc §10 row 3). Pastel geometric confection:
   mint / rose / cream / butter fondant terraces under a scalloped cream sky —
   Monument Valley manners grown from kart-classic candy worlds, nothing neon.
   treatment:'toon' — MeshToonMaterial props (engine adds the house light rig),
   baked inverted-hull ink on HERO masses only (landmark, jelly arches, the cherry).
   Ink = soft cocoa (EL.ink of the rose family), never black.
   Data + paint only — the engine (env-law.js) owns the pipeline.
   ═══════════════════════════════════════════════════════════════════════════════════════════ */
(function (global) {
'use strict';
const EL=global.EL,shade=EL.shade,mix=EL.mix,rng=EL.rng,rint=EL.rint,
      clamp=EL.clamp,mulberry32=EL.mulberry32,pick=EL.pick;

/* band thresholds as fraction of relief — sit BETWEEN terrace step levels so each
   fondant tier reads as one clean colour */
const BAND_FR=[0.07,0.28,0.52,0.78];

/* candy sky tables, top→bottom (doc §8). Day = the hero: pale mint → cream. */
const SKYS={
  day:  ['#9ED8C2','#C3E7D3','#E4F1DB','#F8F0DA'],
  dawn: ['#BCD2CE','#E0CFCE','#F2DACE','#FAEEDA'],
  dusk: ['#C0B4D6','#DFC4D2','#F1D6C3','#F9E8C9'],
  night:['#38345A','#4E4974','#67608D','#847BA6']
};

const PACK={
  name:'candy-basin',
  label:'CANDY BASIN',
  blurb:'Mint-and-rose fondant terraces under a scalloped cream sky. Gumdrop trees, jelly arches, peppermint rim poles; a tiered soft-serve butte to steer by — and one cherry-red gumdrop that broke the rules.',
  treatment:'toon',

  /* ── palette(params, rnd) — ≤7 base hues + derived shades (doc §7) ───────────────────
     Base hues: butter, rose, mint, cream (×2 values), cocoa trunk, liquorice plum,
     cherry (THE wrong colour), candy sky table. hueShift rotates the confection family;
     sky stays put. */
  palette:function(params,rnd){
    const hs=params.hueShift||0,tod=params.timeOfDay||'day';
    const g=function(hex){return hs?shade(hex,0,hs,0):hex};
    const SKY=SKYS[tod]||SKYS.day;
    const nb=params.bands===3?[SKY[0],SKY[1],SKY[3]]:params.bands===1?[SKY[2]]:SKY;
    /* timeOfDay reinterprets the palette IN-REGISTER: night dims toward the berry
       sky, dawn blushes rose, dusk warms toward peach — never out of the pastel run */
    const tone=function(hex){
      if(tod==='night')return mix(hex,SKY[0],0.42);
      if(tod==='dawn')return mix(hex,'#E9C4B4',0.12);
      if(tod==='dusk')return mix(hex,'#EFC49E',0.14);
      return hex;
    };
    /* HB-register pack: every GROUND band passes the §7 gouache clamp */
    const G=function(hex){return EL.gouache(tone(g(hex)))};
    /* props keep the cel range (doc §7 split — that's why karts/sprites pop);
       prop hexes skip the gouache clamp DELIBERATELY (non-HB register layer,
       per the env-law gouache note). Toon-lit law (measured, r2 audit): the key
       face gains ~×1.4 in linear space — PALE hexes ride the clip up to pastel
       white (fine), but SATURATED hexes clip channelwise and distort toward
       neon, so anything saturated (jelly, poleB) is authored a value DOWN. */
    const P=function(hex){return tone(g(hex))};
    /* Bands are authored INSIDE the gouache box (S≤.62, L≤.72). The previous pastel
       hexes sat ABOVE the L ceiling (0.80–0.93), so the §7 clamp crushed butter/
       cream/caps to ONE identical tan (b0==b3==b4 == #e4c88b) and swallowed the
       "one value darker" cliff step entirely (cliff==band on b2/b3/b4 — tier fronts
       never read). In-box hexes make the clamp a no-op at day, so the foot→cap
       value ladder survives; cliffs are derived from the FINAL band colour below,
       so the full −0.09 step survives every timeOfDay tone mix too. */
    const ground={
      floor:G('#DDAD92'),                     /* calm blush — the kart canvas */
      b0:G('#D5B46C'),                        /* butter foot */
      b1:G('#8CC59F'),                        /* mint terraces hug the rim */
      b2:G('#CF8FA3'),                        /* rose-dust above */
      b3:G('#D6C391'),                        /* cream */
      b4:G('#C9C1A6')                         /* white-cream caps — palest, softest */
    };
    /* cliffs: one value darker than the band AS PAINTED (post tone+gouache) */
    const CL=function(hex){return EL.gouache(shade(hex,-0.09,0,0))};
    ground.c0=CL(ground.b0);ground.c1=CL(ground.b1);ground.c2=CL(ground.b2);
    ground.c3=CL(ground.b3);ground.c4=CL(ground.b4);
    const accent=['#DF3B2C','#4A7BD0','#7B4FC0'][params.accent||0];  /* cherry/concord/grape */
    const pal={
      sky:{cols:nb,horizon:nb[nb.length-1],
           sun:tod==='night'?'#F2ECDC':tod==='dusk'?'#F5C98C':tod==='dawn'?'#F8DCA8':'#F7E9A6',
           punct:'#EFE6D0',
           floss1:tod==='night'?shade(SKY[2],0.12,0,0):'#FBF4E6',
           floss2:tod==='night'?shade(SKY[3],0.10,0,0):'#F6DFE2'},
      ground:ground,
      props:{
        trunk:P('#9A6F4E'),                   /* cocoa stub */
        mint:P('#B7E0C8'),rose:P('#F0BCCB'),butter:P('#F4DB9C'),creamP:P('#F7EDD6'),
        stone:P('#7B6878'),                   /* liquorice plum */
        jelly:P('#C9758A'),                   /* authored a value under the pastel:
                                                 the toon key face gains ~×1.4 —
                                                 saturated hexes CLIP channelwise
                                                 toward neon (the old #E4879E read
                                                 as fake-cherry red arches). This
                                                 lands the lit face on soft rose. */
        poleA:P('#F8F0DE'),poleB:P('#CE8092') /* peppermint stripes — same clip
                                                 law as jelly: lit stripe = rose */
      },
      accent:accent,
      water:P('#C4738F'),                     /* rose syrup — a value deeper than the
                                                 b2 band so pools read as liquid */
      ink:EL.ink(P('#D9A8B4')),               /* soft cocoa-rose line, never black */
      fogHex:P('#F2E7D2'),
      swatches:[ground.b0,ground.b1,ground.b2,ground.b4,
                nb[0],nb[nb.length-1],'#F0A8B8',accent]
    };
    return pal;
  },

  /* ── terrain(params, rnd, pal) -> heightfield profile (doc §4) ───────────────────────
     Clean geometric terraces: strong terrace sharp = crisp fondant steps. */
  terrain:function(params,rnd,pal){
    const R=params.relief,g=pal.ground;
    const prof={
      size:600,segs:params.detail,relief:R,
      octaves:4,persistence:params.rough,lacunarity:2.0,scale:1/148,
      /* water mode deepens the valley floors (power 1.5) so syrup pools actually
         break the surface beyond the rim — dry worlds keep the shallower 1.25 */
      contrast:1.95,power:params.water?1.5:1.25,
      terrace:{steps:params.terraceSteps,strength:params.terrace,sharp:4.5},
      rim:{r0:params.basinR+5,r1:250,lo:0.52},
      /* BASIN LAW vs WATER (mesa precedent): the playable floor rides ≥0.3 m above
         the water line — syrup fills the valleys BEYOND the rim, never the basin */
      basin:{r:params.basinR,blend:50,roll:0.75,rollScale:1/47,
        floor:params.water?Math.max(0.35,params.waterLevel+1.2):0.35},
      basinC:g.floor,
      bands:[
        {upTo:BAND_FR[0]*R,c:g.b0,cliff:g.c0},
        {upTo:BAND_FR[1]*R,c:g.b1,cliff:g.c1},
        {upTo:BAND_FR[2]*R,c:g.b2,cliff:g.c2},
        {upTo:BAND_FR[3]*R,c:g.b3,cliff:g.c3},
        {upTo:1e9,         c:g.b4,cliff:g.c4}
      ],
      cliffDy:Math.max(2.4,R/(params.terraceSteps||5)*0.42),  /* tier fronts read even
                                                                 at half rim-gain */
      aerial:{sky:pal.sky.horizon,start:170,end:520,max:0.30}
    };
    if(params.water)prof.shore={level:params.waterLevel,c:shade(g.b4,0.03,0,-0.05)};
    return prof;
  },

  /* ── paintSky — mint→cream hard bands + scallops, ONE-ring lemon sun, candy-floss
        cumulus (flat-bottomed puffs), far fondant-terrace silhouettes (doc §8).
        Stage compressed to the kart-visible strip [0.30h..0.50h]. ──────────────────── */
  paintSky:function(ctx,w,h,pal,params,rnd){
    const tod=params.timeOfDay||'day';
    const hor=h*0.5,top=h*0.30;
    const seed=Math.floor(rnd()*1e9)^((params.skyVar|0)*7919);
    const stops=EL.sky.bands(ctx,w,h,pal.sky.cols,{seed:seed,top:top,hor:hor});
    const horC=pal.sky.horizon;
    /* far fondant-terrace silhouettes — the layered horizon at every heading
       (structure, NOT punctuation — they survive punct 0, mesa precedent).
       They WHISPER: mixed hard toward the horizon cream so the pastel restraint
       holds. Painted BEFORE the haze so their sub-horizon underfill is buried
       under cream — the orbit backdrop stays cream, not rose. */
    EL.sky.silhouetteRow(ctx,w,h,{y:hor,rise:h*0.034,seed:seed^0x1234,
      color:mix(pal.ground.b1,horC,0.78)});
    EL.sky.silhouetteRow(ctx,w,h,{y:hor,rise:h*0.058,seed:seed^0x8765,
      color:mix(pal.ground.b2,horC,0.60)});
    EL.sky.haze(ctx,w,h,shade(horC,-0.05,2,-0.02),hor);
    /* lemon sun / cream moon — never centred, centre ≥17.6° elevation so it clears
       the silhouette rows AND the rim terrain at kart eye (engine law) */
    const sx=rng(rnd,0.10,0.90)*w,sy=hor-h*rng(rnd,0.098,0.128),sr=h*rng(rnd,0.024,0.031);
    const pv=params.punct==null?1:params.punct;
    if(tod==='night'){
      const ns=Math.round(18*pv);            /* PUNCTUATION 0 ⇒ zero stars */
      if(ns>0)EL.sky.stars(ctx,{w:w,y0:top-h*0.04,y1:hor-h*0.09,n:ns,
        color:pal.sky.punct,seed:seed^0xA71});
      EL.sky.sunDisc(ctx,{x:sx,y:sy-h*0.02,r:sr*0.92,color:pal.sky.sun,
        crescent:true,bg:bandAtY(pal.sky.cols,sy-h*0.02,top,hor,stops)});
    }else{
      EL.sky.sunDisc(ctx,{x:sx,y:sy,r:sr,color:pal.sky.sun,rings:1,
        ringColor:shade(pal.sky.sun,-0.07,4,0.04)});       /* ONE ring — the direction */
    }
    /* candy-floss cumulus — punctuation: dial 0 ⇒ zero clouds; odd counts (house law).
       Drawn AFTER the silhouette rows, so a low puff would paint IN FRONT of the
       far terraces: flat bottoms stay ≥0.066h above the horizon, clear of the
       tallest row (rise ≤ 0.058h). */
    const nc=pv<=0?0:clamp(Math.round(2.4*pv)|1,1,7);
    for(let i=0;i<nc;i++){
      EL.sky.cloud(ctx,{x:rng(rnd,0.05,0.95)*w,y:hor-h*rng(rnd,0.066,0.165),
        w:h*rng(rnd,0.10,0.19),color:i%2?pal.sky.floss2:pal.sky.floss1,
        seed:seed^(0xC1+i*17)});
    }
  },

  /* ── props(EL, rnd, params, pal) -> scatter tables (doc §6) ────────────────────────────
     Exactly ONE landmark (first table). All meshes share unit geometries + the toonKit
     material cache — no InstancedMesh anywhere (r147 GLTFExporter law).
     Ink hulls on smooth HERO masses only: landmark, jelly arches, the cherry. */
  props:function(EL,rnd,params,pal){
    const T=global.THREE,kit=EL.toonKit(T,pal.ink);
    const R=params.relief,basinR=params.basinR,ps=params.propScale||1;
    /* LANDMARK DOMINANCE FLOOR (§3/§6, mesa precedent): the cake out-ranks the
       terraces at every relief */
    const Rl=Math.max(R,26+8*ps);
    const PC=pal.props;
    /* shared unit geometries */
    const tierGeo=new T.CylinderGeometry(1,1.06,1,20,1);
    const sphGeo=new T.SphereGeometry(1,9,7);
    const cylGeo=new T.CylinderGeometry(1,1,1,8,1);
    const archGeo=new T.TorusGeometry(1,0.22,8,22,Math.PI);

    /* THE LANDMARK — tiered soft-serve / wedding-cake butte, gentle SPIRAL read via
       stacked offset discs (NOT mesa's pink-cap stack). Spec constants are FIXED so
       the declared footprint is exact; fpCap keeps anchor+extent on the 600 m tile
       even at BASIN RADIUS 200 (Basin Law outranks the ring, mesa precedent). */
    const lv=params.landmark||0;
    const fpCap=Math.max(26,(276-basinR)/2);
    const spec=lv===1?{T:4,baseF:0.44,ratio:0.66,offF:0.50,dth:2.4,hMul:1.05,dome:false}
             :lv===2?{T:6,baseF:0.23,ratio:0.80,offF:0.85,dth:1.8,hMul:1.55,dome:true}
             :       {T:5,baseF:0.31,ratio:0.72,offF:0.80,dth:2.1,hMul:1.35,dome:true};
    /* unit reach (H=1): bottom taper + cumulative spiral offsets */
    const tiersU=[{r:spec.baseF,ox:0,oz:0}];
    let reach=spec.baseF*1.06,r=spec.baseF,cx=0,cz=0;
    for(let i=1;i<spec.T;i++){
      const r2=r*spec.ratio,off=(r-r2)*spec.offF,th=i*spec.dth;
      cx+=Math.cos(th)*off;cz+=Math.sin(th)*off;r=r2;
      tiersU.push({r:r,ox:cx,oz:cz});
      reach=Math.max(reach,Math.hypot(cx,cz)+r*1.06);
    }
    const lmH=Math.min(spec.hMul*Rl,fpCap/reach);
    const lmFp=lmH*reach;
    const hw=[];let hsum=0;
    for(let i=0;i<spec.T;i++){const wgt=Math.pow(0.78,i);hw.push(wgt);hsum+=wgt}
    const cakeCols=[PC.creamP,PC.rose,PC.creamP,PC.mint,PC.creamP,PC.rose];

    const tables=[];
    tables.push({
      landmark:true,count:1,rad:Math.max(30,lmFp+8),footprint:lmFp,
      ring:[Math.max(basinR+20,115),Math.max(basinR+50,200)],
      make:function(){
        const grp=new T.Group();let y=0;
        for(let i=0;i<spec.T;i++){
          const th=hw[i]/hsum*lmH,tr=tiersU[i].r*lmH;
          const m=new T.Mesh(tierGeo,kit.mat(cakeCols[i]));
          m.scale.set(tr,th,tr);
          m.position.set(tiersU[i].ox*lmH,y+th/2,tiersU[i].oz*lmH);
          EL.put(T,grp,m,kit,0.5/Math.max(tr,th));
          y+=th;
        }
        if(spec.dome){                        /* the soft-serve crown */
          const t2=tiersU[spec.T-1],tr=t2.r*lmH;
          const d=new T.Mesh(sphGeo,kit.mat(PC.creamP));
          d.scale.set(tr*0.98,tr*0.72,tr*0.98);
          d.position.set(t2.ox*lmH,y,t2.oz*lmH);
          EL.put(T,grp,d,kit,0.5/tr);
          const tip=new T.Mesh(sphGeo,kit.mat(PC.rose));
          tip.scale.set(tr*0.30,tr*0.34,tr*0.30);
          tip.position.set(t2.ox*lmH,y+tr*0.70,t2.oz*lmH);
          EL.put(T,grp,tip,kit,0.4/(tr*0.34));
        }
        return grp;
      },
      sink:1.2
    });

    /* THE CHERRY — exactly ONE wrong-colour gumdrop among the pastels (doc §7).
       fixed: survives density 0, stays singular at density 2. Just outside the rim
       so it reads at eye 1.1 m without breaking the prop-free basin. */
    tables.push({
      count:1,rad:6,fixed:true,
      ring:[basinR+6,basinR+38],scaleRng:[2.6,3.6],
      footprint:function(s){return s},
      make:function(T2,r2,s){
        const grp=new T.Group();
        const m=new T.Mesh(sphGeo,kit.mat(pal.accent));
        m.scale.set(s,s*0.85,s);m.position.y=s*0.55;
        EL.put(T,grp,m,kit,0.26/s);           /* hero accent takes the ink */
        return grp;
      },
      sink:0.25
    });

    /* peppermint rim poles — stacked band cylinders (the twist read, no textures);
       punctuation: odd, left-heavy cluster, may lean just inside the rim (doc §3) */
    tables.push({
      count:3,odd:true,punct:true,rad:6,insideBasinOK:true,arc:3.4,
      ring:[basinR-6,basinR+26],
      make:function(){
        const grp=new T.Group();
        const H=rng(rnd,10,15),nb=7,bh=H/nb;
        for(let i=0;i<nb;i++){
          const m=new T.Mesh(cylGeo,kit.mat(i%2?PC.poleB:PC.poleA));
          m.scale.set(0.5,bh,0.5);m.position.y=i*bh+bh/2;grp.add(m);
        }
        const k=new T.Mesh(sphGeo,kit.mat(PC.poleB));
        k.position.y=H+0.7;grp.add(k);
        grp.rotation.z=rng(rnd,2,6)*(rnd()<0.5?-1:1)*Math.PI/180;
        return grp;
      },
      sink:0.5
    });

    /* fondant knolls — half-buried squashed domes, the mid-ground silhouette layer */
    tables.push({
      count:7,odd:true,rad:16,
      ring:[basinR+35,268],scaleRng:[10,18],
      footprint:function(s){return s*1.05},
      make:function(T2,r2,s,i){
        /* no creamP here: vertex-grounding buries a dome to the LOWEST point under
           its footprint, and a near-white crown poking through rough ground reads
           as a paint splat from orbit (r1 audit) — the deeper pastels read fondant */
        const cols=[PC.rose,PC.butter,PC.mint,PC.rose];
        const m=new T.Mesh(sphGeo,kit.mat(cols[i%4]));
        m.scale.set(s,s*rng(rnd,0.38,0.50),s*rng(rnd,0.80,1.00));
        return m;
      },
      sink:0.6
    });

    /* jelly arches — smooth hero masses near the rim: they take the ink (doc §5) */
    tables.push({
      count:3,odd:true,rad:11,
      ring:[basinR+24,230],scaleRng:[6.5,10],
      footprint:function(s){return s*1.2},
      make:function(T2,r2,s){
        const grp=new T.Group();
        const m=new T.Mesh(archGeo,kit.mat(PC.jelly));
        m.scale.set(s,s,s);
        EL.put(T,grp,m,kit,0.30/s);
        return grp;
      },
      sink:0.4
    });

    /* gumdrop trees — squashed-sphere canopies on cocoa stub trunks (no hulls:
       scattered filler, not hero masses) */
    const treeCols=[PC.mint,PC.rose,PC.mint,PC.butter,PC.rose,PC.creamP];
    tables.push({
      count:18,rad:4,
      ring:[basinR+8,252],scaleRng:[3.2,5.6],
      make:function(T2,r2,s){
        const grp=new T.Group();
        const tr=new T.Mesh(cylGeo,kit.mat(PC.trunk));
        tr.scale.set(0.13*s,0.34*s,0.13*s);tr.position.y=0.17*s;grp.add(tr);
        const c=new T.Mesh(sphGeo,kit.mat(pick(rnd,treeCols)));
        c.scale.set(0.52*s,0.44*s,0.52*s);c.position.y=0.66*s;grp.add(c);
        return grp;
      },
      sink:0.2
    });

    /* liquorice-stone boulders — round, dark, the texture beat */
    tables.push({
      count:14,rad:3,
      ring:[basinR+14,278],scaleRng:[1.3,2.6],
      make:function(T2,r2,s){
        const m=new T.Mesh(sphGeo,kit.mat(PC.stone));
        m.scale.set(s*rng(rnd,0.95,1.25),s*rng(rnd,0.60,0.75),s*rng(rnd,0.95,1.25));
        return m;
      },
      sink:0.3
    });

    return tables;
  },

  /* ── ≥3 hand-tuned presets (doc §2). Preset 0 = pack defaults. ─────────────────────── */
  presets:[
    {name:'FONDANT NOON',params:{timeOfDay:'day',relief:48,terrace:0.95,terraceSteps:5,
      basinR:130,density:1.0,punct:1.0,landmark:0,hueShift:0,accent:0,bands:4,rough:0.5}},
    {name:'ROSE DAWN',params:{timeOfDay:'dawn',relief:54,terrace:0.9,terraceSteps:6,
      basinR:120,density:1.2,punct:1.3,landmark:1,hueShift:4,accent:0,bands:4,
      fog:true,fogAmt:0.4}},
    {name:'BERRY MOONRISE',params:{timeOfDay:'night',relief:40,terrace:0.95,terraceSteps:4,
      basinR:140,density:0.8,punct:1.5,landmark:2,hueShift:-4,accent:0,bands:4}}
  ]
};

/* which band colour sits at a given canvas y — knocks the moon crescent out with the
   SEEDED stops the bands were actually drawn with (mesa precedent). */
function bandAtY(cols,y,top,hor,stops){
  const t=clamp((y-top)/(hor-top),0,1);
  let i=0;
  for(let k=1;k<cols.length;k++)
    if(stops&&stops[k]!=null?t>=stops[k]:t>=k/cols.length)i=k;
  return cols[i];
}

global.BACKLOT_PACKS=global.BACKLOT_PACKS||{};
global.BACKLOT_PACKS['candy-basin']=PACK;

})(window);
