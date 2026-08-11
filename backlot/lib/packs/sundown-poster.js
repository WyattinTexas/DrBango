/* ═══════════════════════════════════════════════════════════════════════════════════════════
   SUNDOWN POSTER — BACKLOT style pack (doc §10 row 2). The Firewatch register.
   Poster-flat layered wilderness at last light: one enormous smooth vertical gradient
   (deep plum zenith → burnt orange → amber → pale gold), a huge low sun with a soft halo,
   4–6 receding ridge silhouettes each flatter and closer to the sky hue, conifer fringe,
   and a fire-lookout tower on the rim whose single lit amber window is THE wrong colour.
   treatment:'grad' — vertex-coloured Basic terrain, smooth ramps legal, fog ON by default.
   Data + paint only — the engine (env-law.js) owns the pipeline.
   ═══════════════════════════════════════════════════════════════════════════════════════════ */
(function (global) {
'use strict';
const EL=global.EL,shade=EL.shade,mix=EL.mix,rng=EL.rng,rint=EL.rint,
      clamp=EL.clamp,mulberry32=EL.mulberry32;

/* band thresholds as fractions of relief — pine shadow low, warm rim-light on the crests */
const BAND_FR=[0.10,0.26,0.44,0.60,0.78];

/* ── sky gradient stop tables per timeOfDay — t = fraction of [zenith..horizon].
   Interesting stops compressed toward t≥0.5 so the whole ramp lands in the kart-visible
   strip (canvas 0.30h..0.50h). Smooth multi-stop IS legal in this register (doc §4/§8). */
const SKY_STOPS={
  dusk:[[0,'#241B3D'],[0.50,'#2E2148'],[0.68,'#5A3054'],[0.80,'#9A4A44'],
        [0.88,'#C86B35'],[0.95,'#E89A4A'],[1,'#F6D9A0']],
  day: [[0,'#27547F'],[0.50,'#33648F'],[0.70,'#5D93B2'],[0.84,'#93BDBE'],
        [0.93,'#CBD6B4'],[0.975,'#E8DFB6'],[1,'#F2E7BE']],
  dawn:[[0,'#2C2A4E'],[0.52,'#413A5F'],[0.70,'#6E5273'],[0.82,'#A87180'],
        [0.90,'#D29A84'],[0.96,'#EBBE92'],[1,'#F6DFB2']],
  night:[[0,'#0E0D20'],[0.50,'#141230'],[0.70,'#1F1B3E'],[0.83,'#2B2550'],
        [0.92,'#3A3161'],[0.97,'#4A3F6E'],[1,'#584C77']]
};
/* SKY BANDS dial, in-register: gradient richness. 4 = full seven-stop ramp,
   3 = coarse four-stop, 1 = a single plum→gold wash. */
function stopsFor(tod,bandsDial){
  const full=SKY_STOPS[tod]||SKY_STOPS.dusk;
  if(bandsDial===1)return[full[0],full[6]];
  if(bandsDial===3)return[full[0],full[2],full[4],full[6]];
  return full;
}
/* colour of the gradient at t — used for the moon-crescent bite so the knock-out
   always matches its true background. */
function gradAt(stops,t){
  t=clamp(t,0,1);
  let a=stops[0],b=stops[stops.length-1];
  for(let i=0;i<stops.length-1;i++)
    if(t>=stops[i][0]&&t<=stops[i+1][0]){a=stops[i];b=stops[i+1];break}
  return mix(a[1],b[1],(t-a[0])/((b[0]-a[0])||1e-9));
}
function rgba(hex,a){const c=EL.h2r(hex);return'rgba('+c[0]+','+c[1]+','+c[2]+','+a+')'}

/* ── seam-safe rolling ridgeline (integer cycle counts wrap the dome cleanly).
   Optional conifer-tooth fringe on the crest — the forest reads at the skyline. */
function ridgeRow(ctx,w,o){
  const jr=mulberry32((o.seed>>>0)||1);
  const k1=2+rint(jr,0,2),k2=5+rint(jr,0,3),k3=9+rint(jr,0,4);
  const p1=jr()*6.28318,p2=jr()*6.28318,p3=jr()*6.28318;
  const a2=rng(jr,0.30,0.52),a3=rng(jr,0.10,0.20);
  const f=function(x){const t=x/w*6.28318;
    const v=(Math.sin(t*k1+p1)+a2*Math.sin(t*k2+p2)+a3*Math.sin(t*k3+p3))/(1+a2+a3);
    return 0.5+0.5*v};
  const y0=o.y,rise=o.rise;
  ctx.fillStyle=o.color;ctx.beginPath();
  ctx.moveTo(0,y0-rise*f(0));
  for(let x=4;x<=w;x+=4)ctx.lineTo(x,y0-rise*f(x));
  ctx.lineTo(w,y0+rise+40);ctx.lineTo(0,y0+rise+40);ctx.closePath();ctx.fill();
  if(o.teeth){
    for(let x=10;x<w-10;x+=rint(jr,10,18)){
      const yt=y0-rise*f(x),th=o.teeth*rng(jr,0.6,1.3);
      ctx.beginPath();ctx.moveTo(x-th*0.42,yt+1);ctx.lineTo(x,yt-th);
      ctx.lineTo(x+th*0.42,yt+1);ctx.closePath();ctx.fill();
    }
  }
}
/* tiny v-mark bird — two shallow wing strokes */
function bird(ctx,x,y,s,color){
  ctx.strokeStyle=color;ctx.lineWidth=Math.max(1.4,s*0.16);ctx.lineCap='round';
  ctx.beginPath();
  ctx.moveTo(x-s,y-s*0.34);ctx.quadraticCurveTo(x-s*0.42,y+s*0.10,x,y);
  ctx.quadraticCurveTo(x+s*0.42,y+s*0.10,x+s,y-s*0.34);ctx.stroke();
}

const PACK={
  name:'sundown-poster',
  label:'SUNDOWN POSTER',
  blurb:'Poster-flat wilderness at last light: receding ridge silhouettes under an enormous plum-to-gold gradient, conifer fringe, and a fire-lookout tower wearing the one lit amber window.',
  treatment:'grad',

  /* ── palette(params, rnd) — ≤7 base hues + derived shades (doc §7).
     POSTER REGISTER — deliberately NOT gouache-clamped (doc §7 allows with comment):
     the plum zenith and pine shadows sit below the HB box's S/L floor and the ambers
     above its S ceiling ON PURPOSE — the register needs true darks and rich last-light
     warmth; clamping would grey the poster. hueShift rotates the ground family only. */
  palette:function(params,rnd){
    const hs=params.hueShift||0,tod=params.timeOfDay||'dusk';
    const g=function(hex){return hs?shade(hex,0,hs,0):hex};
    const stops=stopsFor(tod,params.bands);
    const zenith=stops[0][1],horizon=stops[stops.length-1][1];
    /* timeOfDay reinterprets the ground family in-register */
    const tone=function(hex){
      if(tod==='night')return mix(hex,'#141230',0.48);
      if(tod==='dawn') return mix(hex,'#3A3450',0.16);
      if(tod==='day')  return shade(hex,0.06,0,0.02);
      return hex;
    };
    const G=function(hex){return tone(g(hex))};
    const ground={
      floor:  G('#4E4B33'),                       /* calm dusk meadow — the kart canvas */
      mottle: shade(G('#4E4B33'),-0.04,-2,-0.01), /* NEAR LAW: dry-meadow patches */
      verge:  shade(G('#4E4B33'),-0.045,3,0.02),  /* the drawn rim band */
      b0:     G('#232E1E'),                       /* deep pine shadow */
      b1:     G('#2C3A26'),
      b2:     G('#3C4B2F'),
      b3:     G('#5D5C36'),                       /* dry-grass olive */
      b4:     G('#8A6C3C'),
      b5:     G('#C08A4A'),                       /* warm rim-light band on the crests */
      /* cliffs = the band one shade into shadow, never near-black — isolated steep
         faces on rolling ground must read as shadowed slope, not holes */
      cliffLo:shade(G('#2C3A26'),-0.05,0,0),
      cliffHi:shade(G('#8A6C3C'),-0.09,0,0)       /* shadowed steeps under lit crowns */
    };
    const accent=['#FFB640','#FFE066','#63D8C8'][params.accent||0];
    const spruce=G('#1F2E20');
    const pal={
      sky:{stops:stops,zenith:zenith,horizon:horizon,
           sun:tod==='night'?'#D9CFB4':tod==='day'?'#FFF6D8':tod==='dawn'?'#FFDCA8':'#FFE7B0',
           halo:tod==='day'?'#EFE2BC':tod==='dawn'?'#E2A984':tod==='night'?'#8C7FAE':'#F2A93B',
           /* receding ridge family: far rows = the SKY right behind the ridge tops
              (gradient sampled at t 0.88), one step darker + more saturated — burnt
              sienna at dusk, misty jade at day, dusty rose at dawn. Near rows fall
              toward plum-dark pine. Never putty-grey. */
           rowNear:mix(mix(ground.b0,'#4A2C50',0.40),zenith,0.22),
           rowFar:shade(gradAt(stops,0.88),-0.04,0,0.06),
           bird:mix('#2E2438',zenith,tod==='night'?0.30:0),
           punct:'#CFC5E2'},
      ground:ground,
      props:{spruce:spruce,spruceHi:G('#2C3F2B'),
             spruceFar:mix(spruce,horizon,0.42),
             bark:G('#2A2118'),
             snag:mix(G('#6E6553'),horizon,0.10),
             boulder:G('#494A3E'),
             tuft:shade(G('#4E4B33'),0.05,4,0.03),      /* dry-grass blades */
             tuftHi:shade(G('#4E4B33'),0.10,6,0.05),
             tower:tone('#2A2433'),towerDark:tone('#201B29')},  /* dusk-cool silhouette */
      accent:accent,
      water:tone('#3A3153'),                       /* the tarn mirrors the dusk, not the accent */
      shore:mix('#D8C089',horizon,0.15),
      ink:EL.ink('#3C4B2F'),
      fogHex:horizon,                              /* fog IS the horizon amber — aerial law */
      swatches:[ground.b1,ground.b3,ground.b5,zenith,horizon,accent,spruce,'#D9CFB4']
    };
    return pal;
  },

  /* ── terrain(params, rnd, pal) -> heightfield profile (doc §4).
     Smooth rolling ridgelines — NO mesa terracing; shape comes from contrast/power and a
     mild ridged fold for crest lines. aerial driven HARD: this pack IS aerial perspective. */
  terrain:function(params,rnd,pal){
    const R=params.relief,g=pal.ground;
    const prof={
      size:600,segs:params.detail,relief:R,
      octaves:5,persistence:params.rough,lacunarity:2.0,scale:1/165,
      contrast:1.55,power:1.25,
      ridged:{strength:0.42,sharp:1.35},
      /* TERRACE dial, in-register: strength ×0.4 with a soft edge — reads as faint
         contour benches on the hillsides (poster layering), never mesa steps */
      terrace:{steps:params.terraceSteps,strength:(params.terrace||0)*0.4,sharp:1.2},
      rim:{r0:params.basinR+8,r1:256,lo:0.42},
      /* BASIN LAW vs WATER: the meadow floor always rides above the water line —
         the tarn fills the valleys BEYOND the rim, never the basin. Margin 1.5 =
         roll amplitude 0.8 + the engine's shore band (paints faces < level+0.5)
         + slack, so neither water nor sand speckle ever enters the basin floor. */
      basin:{r:params.basinR,blend:50,roll:0.8,rollScale:1/46,
        floor:params.water?Math.max(0.35,params.waterLevel+1.5):0.35},
      basinC:g.floor,
      basinMottle:{scale:1/40,hexB:g.mottle,thresh:0.56},   /* NEAR LAW (doc2 §4) */
      verge:{w:8,c:g.verge},
      bands:[
        {upTo:BAND_FR[0]*R,c:g.b0,cliff:g.cliffLo},
        {upTo:BAND_FR[1]*R,c:g.b1,cliff:g.cliffLo},
        {upTo:BAND_FR[2]*R,c:g.b2,cliff:g.cliffLo},
        {upTo:BAND_FR[3]*R,c:g.b3,cliff:g.cliffHi},
        {upTo:BAND_FR[4]*R,c:g.b4,cliff:g.cliffHi},
        {upTo:1e9,        c:g.b5,cliff:g.cliffHi}  /* last light on the crowns only */
      ],
      cliffDy:4.8,          /* only true ridge fronts shade — rolling faces stay banded */
      aerial:{sky:pal.fogHex,start:params.basinR+30,end:470,max:0.75}
    };
    if(params.water){
      /* THE TARN MUST READ (audit fix): the basin blend lifts the moat above the
         waterline and the plain FBM rarely dips under it — at the committed
         MIRROR TARN level the water was invisible from both judge cameras (and a
         height survey shows ~0% flooded at some seeds). Sink the land beyond the
         rim with the island op (−5 m over basinR+20..+70, held beyond) so the
         ring-tarn actually fills its valleys at sane water levels. Scoped to
         water ON — dry presets keep the original profile byte-for-byte. */
      prof.island={r0:params.basinR+20,r1:params.basinR+70,drop:5};
      prof.shore={level:params.waterLevel,c:pal.shore};
    }
    return prof;
  },

  /* ── farfield(params, rnd, pal) — FAR LAW (doc2 §2/§8): three receding ridge shells
     on the rowNear→rowFar ladder, REAL parallax; the nearest wears the conifer TEETH.
     Far rows get TALLER (the sundown-poster recession — far ridge stands tallest);
     the dome keeps only its farthest painted row (see paintSky). */
  farfield:function(params,rnd,pal){
    const L=[mix(pal.sky.rowNear,pal.sky.rowFar,0.40),
             mix(pal.sky.rowNear,pal.sky.rowFar,0.62),
             mix(pal.sky.rowNear,pal.sky.rowFar,0.80)];
    return {floor:-30,rings:[
      {r:430, crest:40, hex:L[0],style:'rolling',teeth:9,toothW:12,
       opts:{features:5,wMin:0.07,wMax:0.15}},
      {r:740, crest:95, hex:L[1],style:'rolling',
       opts:{features:5,wMin:0.06,wMax:0.13}},
      {r:1180,crest:200,hex:L[2],style:'rolling',
       opts:{features:6,wMin:0.05,wMax:0.11}}
    ]};
  },

  /* ── paintSky — ONE enormous smooth vertical gradient + huge low sun with a soft halo +
     four receding ridge silhouettes (each flatter and closer to the sky hue) + v-mark
     bird flocks as punctuation. Horizon = canvas y = h/2; sizes are ANGULAR (h fractions:
     0.01h ≈ 1.8°). Sun centre held ≥ 0.105h ≈ 19° — clears rows (≤0.085h) + rim terrain. */
  paintSky:function(ctx,w,h,pal,params,rnd){
    const tod=params.timeOfDay||'dusk';
    const hor=h*0.5;
    const seed=(Math.floor(rnd()*1e9)^((params.skyVar|0)*7919))>>>0;
    const stops=pal.sky.stops;
    const gr=ctx.createLinearGradient(0,0,0,hor);
    for(let i=0;i<stops.length;i++)gr.addColorStop(stops[i][0],stops[i][1]);
    ctx.fillStyle=gr;ctx.fillRect(0,0,w,hor+2);
    EL.sky.haze(ctx,w,h,shade(pal.sky.horizon,-0.05,2,-0.02),hor);
    /* the huge low sun — never centred; soft radial halo (smooth = legal here) */
    const jr=mulberry32(seed^0x50DA);
    const sx=rng(jr,0.14,0.86)*w,
          sy=hor-h*rng(jr,0.105,0.135),
          sr=h*rng(jr,0.034,0.042)*(tod==='night'?0.62:1);
    if(tod!=='night'){
      const hg=ctx.createRadialGradient(sx,sy,sr*0.6,sx,sy,sr*2.8);
      hg.addColorStop(0,rgba(pal.sky.halo,0.36));
      hg.addColorStop(0.55,rgba(pal.sky.halo,0.13));
      hg.addColorStop(1,rgba(pal.sky.halo,0));
      ctx.fillStyle=hg;ctx.beginPath();ctx.arc(sx,sy,sr*2.8,0,6.28318);ctx.fill();
      EL.sky.sunDisc(ctx,{x:sx,y:sy,r:sr,color:pal.sky.sun});
    }else{
      EL.sky.sunDisc(ctx,{x:sx,y:sy,r:sr,color:pal.sky.sun,
        crescent:true,bg:gradAt(stops,sy/hor)});
    }
    /* receding ridge layers, far→near: farther = taller + lighter (closer to the sky
       hue), nearer = shorter + darker with a conifer-tooth fringe. Painted AFTER the
       sun so far peaks sit in front of its lower limb — the sundown-poster move.
       DOME DEMOTION (doc2 §2): with FAR LAYERS on, the 3D shells own the near/mid
       rows — the dome keeps ONLY the farthest painted row (the beyond-parallax one). */
    const rows=(params.farRings==null||params.farRings>0)?[
      {rise:0.085,t:0.85,teeth:0}
    ]:[
      {rise:0.085,t:0.85,teeth:0},
      {rise:0.065,t:0.62,teeth:0},
      {rise:0.048,t:0.38,teeth:h*0.006},
      {rise:0.034,t:0.16,teeth:h*0.010}
    ];
    for(let i=0;i<rows.length;i++){
      ridgeRow(ctx,w,{y:hor+1,rise:h*rows[i].rise,teeth:rows[i].teeth,
        color:mix(pal.sky.rowNear,pal.sky.rowFar,rows[i].t),
        seed:(seed^(0x1A2B+i*7717))>>>0});
    }
    /* re-lay the sub-horizon haze OVER the rows' downward fills: the below-horizon
       dome is what the ORBIT camera sees as backdrop — it must be the warm ground
       haze, not the nearest (darkest) row's fill. At kart eye the 3D terrain hides
       this seam entirely. */
    EL.sky.haze(ctx,w,h,shade(pal.sky.horizon,-0.09,3,0),hor+2);
    /* punctuation — dial 0 paints NOTHING. Dusk/day/dawn: odd bird flocks; night: stars */
    const pv=params.punct==null?1:params.punct;
    if(tod==='night'){
      /* stars live in the KART-VISIBLE strip (audit fix): the old band y0=0.06h
         put most stars at 40–80° elevation — the judge camera saw ~2 of 26.
         0.26h..(hor−0.07h) ≈ elevations 13–43°, where the kart eye actually looks. */
      const ns=Math.round(26*pv);
      if(ns>0)EL.sky.stars(ctx,{w:w,y0:h*0.26,y1:hor-h*0.07,n:ns,
        color:pal.sky.punct,seed:seed^0xA71});
    }else if(pv>0){
      const nf=clamp(Math.round(2*pv)|1,1,5);
      const fr2=mulberry32(seed^0xB1D5);
      for(let i=0;i<nf;i++){
        const fx=rng(fr2,0.08,0.92)*w,fy=hor-h*rng(fr2,0.075,0.16);
        const nb=rint(fr2,3,6);
        for(let b=0;b<nb;b++){
          bird(ctx,fx+rng(fr2,-1,1)*w*0.022,fy+rng(fr2,-1,1)*h*0.016,
               h*rng(fr2,0.0042,0.0075),pal.sky.bird);
        }
      }
    }
  },

  /* ── props(EL, rnd, params, pal) -> scatter tables (doc §6).
     Conifer silhouettes (near two-tone spruce, far pure silhouette), sparse snags,
     boulders — and THE landmark: a fire-lookout tower, thin trussed legs, tiny cabin,
     ONE lit amber window band. Plain meshes sharing geometries/materials (r147 law). */
  props:function(EL,rnd,params,pal){
    const T=global.THREE,kit=EL.flatKit();
    const R=params.relief,basinR=params.basinR;
    /* shared unit geometries */
    const coneGeo=new T.ConeGeometry(1,1,6,1);
    const trunkGeo=new T.CylinderGeometry(0.7,1,1,5);
    const legGeo=new T.CylinderGeometry(1,1,1,5);
    const boxGeo=new T.BoxGeometry(1,1,1);
    const roofGeo=new T.ConeGeometry(1,1,4,1);
    const rockGeo=new T.IcosahedronGeometry(1,0);
    const bladeGeo=new T.ConeGeometry(1,1,3,1,true);

    /* NEAR LAW (doc2 §4): dry-grass tuft — 5–7 blades leaning out from a base */
    function tuft(s){
      const grp=new T.Group();
      const n=2+(rnd()<0.5?3:4);
      for(let i=0;i<n;i++){
        const bh=rng(rnd,0.22,0.44)*s;
        const bg=new T.Group();
        bg.rotation.y=(i/n)*6.28318+rng(rnd,-0.4,0.4);
        const b=new T.Mesh(bladeGeo,kit.mat(rnd()<0.3?pal.props.tuftHi:pal.props.tuft));
        b.scale.set(bh*0.10,bh,bh*0.10);
        b.position.set(rng(rnd,0,0.10)*s,bh/2,0);
        bg.rotation.z=rng(rnd,0.10,0.38);
        bg.add(b);grp.add(bg);
      }
      return grp;
    }
    /* verge vignette — boulder anchor + tufts, left-heavy (house law) */
    function vignette(s){
      const grp=new T.Group();
      const br=s*rng(rnd,0.5,0.85);
      const b=new T.Mesh(rockGeo,kit.mat(pal.props.boulder));
      b.scale.set(br*1.2,br*0.7,br);b.position.y=br*0.32;
      b.rotation.y=rng(rnd,0,6.28);grp.add(b);
      const t1=tuft(s);t1.position.set(-s*0.6,0,s*0.15);grp.add(t1);
      const t2=tuft(s*0.8);t2.position.set(-s*0.15,0,-s*0.5);grp.add(t2);
      const t3=tuft(s*0.7);t3.position.set(s*0.5,0,s*0.3);grp.add(t3);
      return grp;
    }

    /* stacked-cone fir. farHue set = pure one-hue silhouette (trunk included) */
    function fir(s,farHue){
      const grp=new T.Group();
      const trunkH=s*0.15;
      const tr=new T.Mesh(trunkGeo,kit.mat(farHue||pal.props.bark));
      tr.scale.set(s*0.045,trunkH,s*0.045);tr.position.y=trunkH/2;grp.add(tr);
      const tiers=3+(rnd()<0.55?1:0);
      let y=trunkH*0.75;
      for(let i=0;i<tiers;i++){
        const f=i/(tiers-1||1);
        const br=s*(0.30-0.19*f)*rng(rnd,0.9,1.12);
        const ch=s*(0.44-0.11*f);
        const hex=farHue||((i%2)?pal.props.spruceHi:pal.props.spruce);  /* two-tone */
        const c=new T.Mesh(coneGeo,kit.mat(hex));
        c.scale.set(br,ch,br);c.position.y=y+ch/2;grp.add(c);
        y+=ch*0.56;
      }
      return grp;
    }
    /* dead snag — bare leaning bole + 2–3 stub branches */
    function snag(s){
      const grp=new T.Group();
      const m=new T.Mesh(trunkGeo,kit.mat(pal.props.snag));
      m.scale.set(s*0.05,s,s*0.05);m.position.y=s/2;
      m.rotation.z=rng(rnd,-0.06,0.06);grp.add(m);
      const nb=2+(rnd()<0.4?1:0);
      for(let i=0;i<nb;i++){
        const bl=s*rng(rnd,0.16,0.30);
        const bg=new T.Group();
        bg.position.y=s*rng(rnd,0.45,0.80);
        bg.rotation.y=rng(rnd,0,6.28318);
        bg.rotation.z=rng(rnd,0.9,1.35);
        const b=new T.Mesh(trunkGeo,kit.mat(pal.props.snag));
        b.scale.set(s*0.024,bl,s*0.024);b.position.y=bl/2;
        bg.add(b);grp.add(bg);
      }
      return grp;
    }

    /* THE LANDMARK — fire-lookout tower. Variants: 0 LOOKOUT · 1 SENTINEL (tall spindle)
       · 2 WATCH POINT (squat, wide stance on a stone footing). Dominance floor keeps it
       out-ranking the firs at every relief. */
    const Rl=Math.max(R,34),lv=params.landmark||0;
    let towH,spread,cabW;
    if(lv===1){towH=clamp(Rl*0.90,32,48);spread=towH*0.12;cabW=3.4}
    else if(lv===2){towH=clamp(Rl*0.55,20,30);spread=towH*0.24;cabW=4.6}
    else{towH=clamp(Rl*0.72,26,40);spread=towH*0.16;cabW=3.9}
    function tower(){
      const grp=new T.Group();
      const matT=kit.mat(pal.props.tower),matD=kit.mat(pal.props.towerDark);
      const legH=towH*0.80,topHalf=cabW*0.40,cabH=towH*0.13;
      const up=new T.Vector3(0,1,0),dir=new T.Vector3();
      for(let sxi=-1;sxi<=1;sxi+=2)for(let szi=-1;szi<=1;szi+=2){
        const bx=sxi*spread,bz=szi*spread,tx=sxi*topHalf,tz=szi*topHalf;
        dir.set(tx-bx,legH,tz-bz);
        const leg=new T.Mesh(legGeo,matT);
        leg.scale.set(0.20,dir.length(),0.20);
        leg.position.set((bx+tx)/2,legH/2,(bz+tz)/2);
        leg.quaternion.setFromUnitVectors(up,dir.clone().normalize());
        grp.add(leg);
      }
      const fr=(lv===1)?[0.30,0.57,0.82]:[0.34,0.66];
      for(let i=0;i<fr.length;i++){
        const y=legH*fr[i],half=spread+(topHalf-spread)*fr[i]+0.10;
        for(let k=0;k<4;k++){
          const b=new T.Mesh(boxGeo,matD);
          if(k<2){b.scale.set(half*2+0.4,0.16,0.16);b.position.set(0,y,(k?1:-1)*half)}
          else{b.scale.set(0.16,0.16,half*2+0.4);b.position.set((k===2?1:-1)*half,y,0)}
          grp.add(b);
        }
      }
      if(lv===2){
        const base=new T.Mesh(trunkGeo,matD);
        base.scale.set(spread+1.6,2.2,spread+1.6);base.position.y=0.2;grp.add(base);
      }
      const deck=new T.Mesh(boxGeo,matD);
      deck.scale.set(cabW+1.3,0.22,cabW+1.3);deck.position.y=legH;grp.add(deck);
      for(let k=0;k<4;k++){
        const r=new T.Mesh(boxGeo,matD),half=(cabW+1.3)/2;
        if(k<2){r.scale.set(cabW+1.3,0.09,0.09);r.position.set(0,legH+0.62,(k?1:-1)*half)}
        else{r.scale.set(0.09,0.09,cabW+1.3);r.position.set((k===2?1:-1)*half,legH+0.62,0)}
        grp.add(r);
      }
      const y0=legH+0.11;
      const lower=new T.Mesh(boxGeo,matT);
      lower.scale.set(cabW,cabH*0.42,cabW);lower.position.y=y0+cabH*0.21;grp.add(lower);
      /* THE ONE WRONG COLOUR — the lookout's lit lantern room: a single wrap-around
         window band (real lookouts glaze all four faces — ONE element, and it reads
         from every heading at 300 m). Nothing else in the world uses pal.accent, and
         the landmark table ignores density/punct, so it stays singular at 0 and 2. */
      const lamp=new T.Mesh(boxGeo,kit.mat(pal.accent));
      lamp.scale.set(cabW*0.94,cabH*0.40,cabW*0.94);
      lamp.position.y=y0+cabH*0.62;grp.add(lamp);
      const fascia=new T.Mesh(boxGeo,matT);
      fascia.scale.set(cabW+0.3,cabH*0.16,cabW+0.3);
      fascia.position.y=y0+cabH*0.90;grp.add(fascia);
      const roof=new T.Mesh(roofGeo,matD);
      roof.scale.set(cabW*0.80,towH*0.10,cabW*0.80);
      roof.rotation.y=Math.PI/4;
      roof.position.y=y0+cabH*0.98+towH*0.05;grp.add(roof);
      return grp;
    }

    const tables=[];
    /* THE ONE LANDMARK — rim ring, trussed legs; footprint = leg stance so the whole
       stance clears the basin and vertex-grounds on the ridge (§3/§6) */
    tables.push({
      landmark:true,count:1,rad:26,footprint:spread+1.8,
      ring:[Math.max(basinR+26,118),Math.max(basinR+58,196)],
      make:function(){return tower()},
      sink:0.7
    });
    /* near firs — two-tone dark spruce, mid-ground silhouette layer */
    tables.push({
      count:30,rad:3,ring:[basinR+12,208],scaleRng:[7,13],
      footprint:function(s){return s*0.34},
      make:function(T2,r2,s){return fir(s,null)},
      sink:0.3
    });
    /* far firs — pure silhouette, pre-mixed toward the horizon (poster recession) */
    tables.push({
      count:46,rad:2.5,ring:[210,290],scaleRng:[9,16],
      make:function(T2,r2,s){return fir(s,pal.props.spruceFar)},
      sink:0.4
    });
    /* sparse dead snags — punctuation, odd counts (house law) */
    tables.push({
      count:3,odd:true,punct:true,rad:3,ring:[basinR+10,220],scaleRng:[8,13],
      make:function(T2,r2,s){return snag(s)},
      sink:0.4
    });
    /* boulders */
    tables.push({
      count:14,rad:3,ring:[basinR+8,268],scaleRng:[1.1,3.0],
      make:function(T2,r2,s){
        const m=new T.Mesh(rockGeo,kit.mat(pal.props.boulder));
        m.scale.set(s*rng(rnd,0.9,1.3),s*rng(rnd,0.5,0.75),s*rng(rnd,0.9,1.3));
        return m;
      },
      sink:0.35
    });
    /* NEAR LAW tables (doc2 §4) — NEAR DETAIL dial, outer annulus, drivable */
    tables.push({near:true,count:5,odd:true,insideBasinOK:true,rad:2.5,
      ring:[basinR-10,basinR+16],scaleRng:[1.0,1.6],
      make:function(T2,r2,s){return vignette(s)},sink:0.15});
    /* blades START AT THE EYE (doc2 §4) — foreground strokes, drivable */
    tables.push({near:true,count:120,insideBasinOK:true,rad:0.9,
      ring:[basinR*0.14,basinR-6],scaleRng:[0.8,1.5],
      make:function(T2,r2,s){return tuft(s)},sink:0.05});
    tables.push({near:true,count:36,rad:1.0,
      ring:[basinR+4,basinR+100],scaleRng:[0.9,1.7],
      make:function(T2,r2,s){return tuft(s)},sink:0.05});
    return tables;
  },

  /* ── ≥3 hand-tuned presets (doc §2). Preset 0 = pack defaults — fog ON (register law). */
  presets:[
    {name:'LAST LIGHT',params:{timeOfDay:'dusk',relief:48,terrace:0.1,terraceSteps:5,
      rough:0.5,basinR:130,density:1.0,punct:1.0,landmark:0,hueShift:0,accent:0,bands:4,
      fog:true,fogAmt:0.5,water:false}},
    {name:'GOLDEN AFTERNOON',params:{timeOfDay:'day',relief:62,terrace:0.05,terraceSteps:5,
      rough:0.52,basinR:120,density:1.3,punct:0.8,landmark:1,hueShift:0,accent:0,bands:4,
      fog:true,fogAmt:0.35,water:false}},
    {name:'MIRROR TARN',params:{timeOfDay:'dawn',relief:44,terrace:0.15,terraceSteps:6,
      rough:0.48,basinR:135,density:0.9,punct:1.2,landmark:2,hueShift:0,accent:0,bands:4,
      fog:true,fogAmt:0.5,water:true,waterLevel:5.5}},
    {name:'EMBER NIGHT',params:{timeOfDay:'night',relief:50,terrace:0.1,terraceSteps:5,
      rough:0.5,basinR:130,density:0.8,punct:1.6,landmark:0,hueShift:0,accent:0,bands:3,
      fog:true,fogAmt:0.6,water:false}}
  ]
};

global.BACKLOT_PACKS=global.BACKLOT_PACKS||{};
global.BACKLOT_PACKS['sundown-poster']=PACK;

})(window);
