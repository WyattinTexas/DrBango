/* ═══════════════════════════════════════════════════════════════════════════════════════════
   MEADOW NOCTURNE — BACKLOT style pack (DEPTH-DESIGN.md §7). The Ascent, poured into 3D.
   A twilight meadow under the rising night: the STARSPELL master gradient (SKY-DESIGN §2,
   exact hexes), a fat tilted crescent low over the hills, stars thickening toward the
   zenith, hill-silhouette shells on the depth ladder, firefly verges — and one great oak
   holding a single lantern. Dreamy not techy; wishes not lasers; warmth over void.
   treatment:'grad' — soft sky, HARD land (terrain aerial is ladder-quantized, steps 3).
   This pack exists to prove the depth wave: FAR real (shells), NEAR meaningful (verge +
   near-detail + vignettes), SHAPES hard (authored ridgelines, silhouette props).
   Data + paint only — the engine (env-law.js) owns the pipeline.
   ═══════════════════════════════════════════════════════════════════════════════════════════ */
(function (global) {
'use strict';
const EL=global.EL,shade=EL.shade,mix=EL.mix,rng=EL.rng,rint=EL.rint,
      clamp=EL.clamp,mulberry32=EL.mulberry32;

/* ── the master gradient per timeOfDay — t = fraction of [zenith..horizon], stops
   compressed toward t≥0.6 so the whole dusk run lands in the kart-visible strip.
   DUSK = THE ASCENT (SKY-DESIGN §2 hexes, verbatim ladder). NIGHT = DEEP NIGHT (the
   warm run collapses). DAWN = CROWN OF DAWN (Act III payoff). DAY = BLUE HOUR. */
const SKY_STOPS={
  dusk:[[0,'#0a0d1c'],[0.36,'#0d1126'],[0.52,'#10142e'],[0.64,'#1c2350'],
        [0.74,'#3a3068'],[0.82,'#6b4585'],[0.875,'#a05a8c'],[0.915,'#c96a8e'],
        [0.945,'#f0997a'],[0.972,'#ffc98a'],[0.99,'#ffe4b0'],[1,'#ffe4b0']],
  night:[[0,'#0a0d1c'],[0.42,'#0c1022'],[0.62,'#0d1126'],[0.78,'#10142e'],
        [0.88,'#161b3c'],[0.95,'#232457'],[1,'#31305e']],
  dawn:[[0,'#10142e'],[0.44,'#161c40'],[0.60,'#1c2350'],[0.71,'#3a3068'],
        [0.80,'#7c5488'],[0.87,'#b06a8e'],[0.92,'#e08d7e'],[0.955,'#ffb87e'],
        [0.982,'#ffdda0'],[1,'#fff2cc']],
  day: [[0,'#141a3a'],[0.46,'#181f48'],[0.62,'#1c2350'],[0.75,'#2a3468'],
        [0.85,'#465088'],[0.93,'#7a7aa8'],[0.975,'#b8a8c0'],[1,'#e8d8c0']]
};
/* SKY BANDS dial, in-register: ladder richness. 4 = the full run, 3 = coarse, 1 = wash. */
function stopsFor(tod,bandsDial){
  const full=SKY_STOPS[tod]||SKY_STOPS.dusk;
  if(bandsDial===1)return[full[0],full[full.length-1]];
  if(bandsDial===3){
    const out=[];
    for(let i=0;i<full.length;i+=2)out.push(full[i]);
    if(out[out.length-1]!==full[full.length-1])out.push(full[full.length-1]);
    return out;
  }
  return full;
}
function gradAt(stops,t){
  t=clamp(t,0,1);
  let a=stops[0],b=stops[stops.length-1];
  for(let i=0;i<stops.length-1;i++)
    if(t>=stops[i][0]&&t<=stops[i+1][0]){a=stops[i];b=stops[i+1];break}
  return mix(a[1],b[1],(t-a[0])/((b[0]-a[0])||1e-9));
}

const PACK={
  name:'meadow-nocturne',
  label:'MEADOW NOCTURNE',
  blurb:'The Ascent in 3D: a twilight meadow under the rising night — dusk-rose horizon, tilted crescent, stars thickening toward the zenith, firefly verges, and one great oak holding a single lantern.',
  treatment:'grad',

  /* ── palette(params, rnd) — ≤7 base families + derived shades (doc §7).
     NIGHT REGISTER — deliberately NOT gouache-clamped (doc §7 allows with comment):
     the meadow needs true darks (the Ascent ground sits near-black on purpose); the
     sprite/kart layer keeps the cel range, which is exactly why it will glow here. */
  palette:function(params,rnd){
    const hs=params.hueShift||0,tod=params.timeOfDay||'dusk';
    const g=function(hex){return hs?shade(hex,0,hs,0):hex};
    const stops=stopsFor(tod,params.bands);
    const zenith=stops[0][1],horizon=stops[stops.length-1][1];
    /* timeOfDay reinterprets the ground family in-register */
    const tone=function(hex){
      if(tod==='night')return mix(hex,'#0a0d1c',0.30);
      if(tod==='dawn') return mix(hex,'#3a3050',0.18);
      if(tod==='day')  return mix(hex,'#202a50',0.22);
      return hex;
    };
    const G=function(hex){return tone(g(hex))};
    const ground={
      floor:  G('#141d33'),                     /* dark meadow — the kart canvas */
      mottle: G('#0c111d'),                     /* mown patches, quiet but READABLE */
      verge:  G('#243356'),                     /* the drawn rim band */
      b0:     G('#0e1322'),
      b1:     G('#131a30'),
      b2:     G('#1a2140'),
      b3:     G('#282552'),                     /* moonlit crests */
      cliff:  G('#0c101c')
    };
    /* far-shell ladder — the Ascent far-hill family, ending under the violet band */
    const LADDER=tod==='night'?['#121634','#191d42','#232550']:
                 tod==='dawn' ?['#241c3c','#3f315a','#5c4573']:
                 tod==='day'  ?['#182244','#2a3464','#475082']:
                               ['#161230','#282050','#443a6e'];
    /* THE WRONG COLOUR — the lantern/rune/lamp; fireflies share its temperature */
    const accent=['#ffd98a','#63e0cf','#ff9fb4'][params.accent||0];
    const pal={
      sky:{stops:stops,zenith:zenith,horizon:horizon,
           moon:tod==='night'?'#e8dcc0':'#f7e8c8',
           starBase:'#cfd8ff',
           haze:tod==='dawn'?'#151024':tod==='day'?'#131830':'#0b0a14',
           wisp:'#141028',wispLit:'#ffe4b0'},
      ground:ground,
      ladder:LADDER,
      props:{
        blade:G('#22304e'),bladeHi:G('#2c3c60'),
        stem:G('#182238'),petal:'#8f7fae',petalRare:'#c9a9c4',
        pebble:G('#202946'),stone:G('#202946'),stoneLit:G('#2c3758'),
        shrub:G('#161f38'),
        oak:G('#131c36'),oakTrunk:G('#101426'),
        firefly:'#ffdf8f'
      },
      accent:accent,
      water:G('#16223e'),
      shore:G('#243352'),
      ink:EL.ink('#161c36'),
      fogHex:'#3a3068',
      swatches:[ground.floor,ground.b1,ground.b3,LADDER[0],LADDER[2],
                zenith,horizon,accent]
    };
    return pal;
  },

  /* ── terrain(params, rnd, pal) — low rolling meadow, smooth arcs, no mesa ops.
     NEAR LAW: basinMottle + verge (drawn rim). LADDER LAW: aerial QUANTIZED (steps 3)
     toward the violet band — soft sky, hard land (doc2 §10 fork, deliberate). */
  terrain:function(params,rnd,pal){
    const R=params.relief,g=pal.ground;
    return {
      size:600,segs:params.detail,relief:R,
      octaves:4,persistence:params.rough,lacunarity:2.0,scale:1/150,
      contrast:1.35,power:1.15,
      /* TERRACE dial, in-register: whisper benches at most — never steps */
      terrace:{steps:params.terraceSteps,strength:(params.terrace||0)*0.15,sharp:1.1},
      rim:{r0:params.basinR+10,r1:260,lo:0.55},
      basin:{r:params.basinR,blend:48,roll:0.7,rollScale:1/48,
        floor:params.water?Math.max(0.35,params.waterLevel+1.4):0.35},
      basinC:g.floor,
      basinMottle:{scale:1/32,hexB:g.mottle,thresh:0.54},
      verge:{w:12,c:g.verge},
      bands:[
        {upTo:0.14*R,c:g.b0,cliff:g.cliff},
        {upTo:0.40*R,c:g.b1,cliff:g.cliff},
        {upTo:0.66*R,c:g.b2,cliff:g.cliff},
        {upTo:1e9,   c:g.b3,cliff:g.cliff}
      ],
      cliffDy:6.0,
      aerial:{sky:pal.fogHex,start:params.basinR+20,end:480,max:0.55,steps:3},
      shore:params.water?{level:params.waterLevel,c:pal.shore}:undefined
    };
  },

  /* ── farfield(params, rnd, pal) — FAR LAW (doc2 §2): three rolling silhouette rings
     on the depth ladder. Clean arcs, no teeth — SKY-DESIGN: keep the horizon clean. */
  farfield:function(params,rnd,pal){
    const L=pal.ladder;
    return {floor:-30,rings:[
      {r:430, crest:44, hex:L[0],style:'rolling',
       opts:{features:3,wMin:0.10,wMax:0.19,base:0.12,swell:0.08}},
      {r:720, crest:92, hex:L[1],style:'rolling',
       opts:{features:4,wMin:0.08,wMax:0.15,base:0.11,swell:0.07}},
      {r:1180,crest:170,hex:L[2],style:'rolling',
       opts:{features:5,wMin:0.06,wMax:0.12,base:0.10,swell:0.07}}
    ]};
  },

  /* ── paintSky — the master gradient (dither + grain MANDATORY: SKY-DESIGN banding
     law), tiered starfield with hero wish-stars, the tilted crescent with earthshine,
     2–3 dark wisps with a moonlit top edge. NO painted terrain rows — the shells do
     that work now (dome demotion, doc2 §2). */
  paintSky:function(ctx,w,h,pal,params,rnd){
    const tod=params.timeOfDay||'dusk';
    const hor=h*0.5;
    const seed=(Math.floor(rnd()*1e9)^((params.skyVar|0)*7919))>>>0;
    const stops=pal.sky.stops;
    EL.sky.gradient(ctx,w,h,{stops:stops,top:0,hor:hor,dither:2.2,poleFade:h*0.14,
      seed:seed});
    const pv=params.punct==null?1:params.punct;
    /* stars — density ramps toward the zenith (the thickening sky sells the height) */
    const starN=tod==='night'?190:tod==='dusk'?90:tod==='dawn'?24:0;
    const y1=tod==='night'?hor-h*0.04:tod==='dusk'?h*0.385:h*0.30;
    if(starN>0&&pv>0){
      EL.sky.starfield(ctx,{w:w,y0:h*0.03,y1:y1,n:Math.round(starN*pv),
        ramp:1.7,heroN:clamp(Math.round((tod==='night'?5:tod==='dusk'?4:2)*pv),0,7),
        seed:seed^0x57A2});
      /* the FIRST STARS — a sprinkle pinned into the kart-visible strip, plus 2
         hero wish-stars low: the judge frame gets its jewellery (doc2 §5) */
      if(tod!=='night'){
        EL.sky.starfield(ctx,{w:w,y0:h*0.295,y1:h*0.415,n:Math.round(22*pv),
          ramp:1.0,heroN:Math.min(2,Math.round(2*pv)),seed:seed^0x1F1D});
      }
    }
    /* wisps — thin dark clouds low over the dusk band (dusk/night). LOW ONLY:
       painted higher they land near the dome pole, where the equirect stretch
       turns them into giant grey blades (r-matrix lesson). Dark, subtle, no
       lit edge — the pale edge is what read as an artifact. */
    if(tod==='dusk'||tod==='night'){
      const jw=mulberry32(seed^0x0B15);
      const nw=rint(jw,2,3);
      for(let i=0;i<nw;i++){
        const cx=rng(jw,0.08,0.92)*w,cy=h*rng(jw,0.335,0.395);
        const rx=w*rng(jw,0.028,0.050),ry=h*rng(jw,0.0040,0.0060);
        ctx.globalAlpha=0.5;ctx.fillStyle=pal.sky.wisp;
        ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,0,6.28318);ctx.fill();
        ctx.globalAlpha=1;
      }
    }
    /* the crescent — fat, tilted, LOW over the hills (dusk/night only; the dawn sky
       belongs to the coming sun). Never centred. */
    if(tod==='dusk'||tod==='night'){
      const jm=mulberry32(seed^0x30D5);
      let mx=rng(jm,0.14,0.86);
      if(mx>0.42&&mx<0.58)mx=mx<0.5?0.40:0.60;
      const my=hor-h*rng(jm,0.105,0.125),mr=h*rng(jm,0.015,0.019);
      EL.sky.moon(ctx,{x:mx*w,y:my,r:mr,tilt:rng(jm,18,30),
        color:pal.sky.moon,bg:gradAt(stops,my/hor),
        earthshine:0.07,halo:true,haloA:0.20});
    }
    EL.sky.haze(ctx,w,h,pal.sky.haze,hor);
    /* grain over EVERYTHING (haze included) — what makes it look expensive */
    EL.sky.grain(ctx,w,h,{alpha:0.05,seed:seed^0x96A1});
  },

  /* ── props(EL, rnd, params, pal) -> scatter tables (doc §6 + doc2 §4).
     Near field: grass tufts, wildflowers, pebble triads, stone vignettes, fireflies —
     all near:true (NEAR DETAIL dial), outer basin annulus only, ≤~0.5 m, drivable.
     Mid: shrub masses + standing stones. Far: the shells (no far props — clean).
     Landmarks: GREAT OAK · WISHING STONE · STONE CIRCLE — each carries exactly ONE
     accent element (the lit-window-on-dark GRAFT law). */
  props:function(EL,rnd,params,pal){
    const T=global.THREE,kit=EL.flatKit();
    const R=params.relief,basinR=params.basinR;
    /* shared unit geometries (GLTF dedupe law) */
    const bladeGeo=new T.ConeGeometry(1,1,3,1,true);
    const headGeo=new T.OctahedronGeometry(1,0);
    const pebbleGeo=new T.IcosahedronGeometry(1,0);
    const menhirGeo=new T.CylinderGeometry(0.55,0.9,1,5);
    const blobGeo=new T.SphereGeometry(1,7,5);
    const crownGeo=new T.SphereGeometry(1,10,8);
    const trunkGeo=new T.CylinderGeometry(0.6,1,1,6);
    const limbGeo=new T.CylinderGeometry(0.5,0.8,1,5);
    const lanternGeo=new T.CylinderGeometry(0.6,0.75,1,6);
    const coreGeo=new T.SphereGeometry(1,6,5);
    const haloGeo=new T.SphereGeometry(1,6,4);
    const slabGeo=new T.CylinderGeometry(1,1.1,1,7);
    /* glow halo material — transparent, shared, never in the flat cache */
    const haloMat=new T.MeshBasicMaterial({color:new T.Color(pal.props.firefly),
      transparent:true,opacity:0.30,depthWrite:false,fog:false});
    const accHaloMat=new T.MeshBasicMaterial({color:new T.Color(pal.accent),
      transparent:true,opacity:0.20,depthWrite:false,fog:false});

    /* grass tuft — 5–7 blades leaning out from a base; two-tone (doc2 §3: profiles,
       not noise blobs) */
    function tuft(s){
      const grp=new T.Group();
      const n=rint(rnd,5,7);
      for(let i=0;i<n;i++){
        const bh=rng(rnd,0.24,0.46)*s;
        const bg=new T.Group();
        bg.rotation.y=(i/n)*6.28318+rng(rnd,-0.4,0.4);
        const b=new T.Mesh(bladeGeo,kit.mat(rnd()<0.3?pal.props.bladeHi:pal.props.blade));
        b.scale.set(bh*0.10,bh,bh*0.10);
        b.position.set(rng(rnd,0,0.10)*s,bh/2,0);
        bg.rotation.z=rng(rnd,0.10,0.38);
        bg.add(b);grp.add(bg);
      }
      return grp;
    }
    /* wildflower — thin stem + tiny octa head; heads catch the last light */
    function flower(s){
      const grp=new T.Group();
      const fh=rng(rnd,0.30,0.55)*s;
      const st=new T.Mesh(bladeGeo,kit.mat(pal.props.stem));
      st.scale.set(fh*0.045,fh,fh*0.045);st.position.y=fh/2;grp.add(st);
      const hd=new T.Mesh(headGeo,kit.mat(rnd()<0.2?pal.props.petalRare:pal.props.petal));
      const hr=fh*0.14;
      hd.scale.set(hr,hr*0.8,hr);hd.position.y=fh;
      hd.rotation.z=rng(rnd,-0.2,0.2);grp.add(hd);
      return grp;
    }
    function flowerCluster(s){
      const grp=new T.Group();
      const n=rint(rnd,3,4);
      for(let i=0;i<n;i++){
        const f=flower(s*rng(rnd,0.8,1.15));
        f.position.set(rng(rnd,-0.5,0.5)*s,0,rng(rnd,-0.5,0.5)*s);
        grp.add(f);
      }
      const t=tuft(s*0.9);t.position.set(rng(rnd,-0.3,0.3)*s,0,rng(rnd,-0.3,0.3)*s);
      grp.add(t);
      return grp;
    }
    function pebbleTriad(s){
      const grp=new T.Group();
      for(let i=0;i<3;i++){
        const pr=s*rng(rnd,0.12,0.30);
        const p=new T.Mesh(pebbleGeo,kit.mat(pal.props.pebble));
        p.scale.set(pr*1.2,pr*0.7,pr);
        p.position.set(rng(rnd,-0.4,0.4)*s,pr*0.35,rng(rnd,-0.4,0.4)*s);
        p.rotation.y=rng(rnd,0,6.28);
        grp.add(p);
      }
      return grp;
    }
    /* verge vignette — anchor stone + tufts + flowers, left-heavy (house law) */
    function vignette(s){
      const grp=new T.Group();
      const sh=s*rng(rnd,0.5,0.9);
      const st=new T.Mesh(menhirGeo,kit.mat(pal.props.stone));
      st.scale.set(sh*0.42,sh,sh*0.3);st.position.y=sh*0.48;
      st.rotation.z=rng(rnd,-0.14,0.14);grp.add(st);
      const t1=tuft(s);t1.position.set(-s*0.55,0,s*0.12);grp.add(t1);
      const t2=tuft(s*0.8);t2.position.set(-s*0.2,0,-s*0.42);grp.add(t2);
      const fl=flower(s*0.9);fl.position.set(s*0.38,0,s*0.25);grp.add(fl);
      return grp;
    }
    function shrub(s){
      const grp=new T.Group();
      const n=rint(rnd,2,3);
      for(let i=0;i<n;i++){
        const br=s*rng(rnd,0.5,0.9);
        const b=new T.Mesh(blobGeo,kit.mat(pal.props.shrub));
        b.scale.set(br,br*0.62,br);
        b.position.set(rng(rnd,-0.5,0.5)*s,br*0.45,rng(rnd,-0.5,0.5)*s);
        grp.add(b);
      }
      return grp;
    }
    function firefly(){
      const grp=new T.Group();
      const c=new T.Mesh(coreGeo,kit.mat(pal.props.firefly));
      c.scale.set(0.065,0.065,0.065);grp.add(c);
      const hl=new T.Mesh(haloGeo,haloMat);
      hl.scale.set(0.20,0.20,0.20);grp.add(hl);
      return grp;
    }
    function standingStone(s){
      const grp=new T.Group();
      const m=new T.Mesh(menhirGeo,kit.mat(pal.props.stone));
      m.scale.set(s*0.24,s,s*0.17);m.position.y=s*0.46;
      m.rotation.z=rng(rnd,-0.10,0.10);grp.add(m);
      return grp;
    }

    /* THE LANDMARKS — silhouette-first, one accent element each */
    const Rl=Math.max(R,26),lv=params.landmark||0;
    function greatOak(){
      const grp=new T.Group();
      const H=clamp(Rl*1.35,26,40);
      const tr=new T.Mesh(trunkGeo,kit.mat(pal.props.oakTrunk));
      tr.scale.set(H*0.055,H*0.46,H*0.055);tr.position.y=H*0.23;grp.add(tr);
      for(let i=0;i<2;i++){
        const lb=new T.Group();
        lb.position.y=H*rng(rnd,0.30,0.40);
        lb.rotation.y=rng(rnd,0,6.28);lb.rotation.z=rng(rnd,0.55,0.85);
        const l=new T.Mesh(limbGeo,kit.mat(pal.props.oakTrunk));
        const ll=H*rng(rnd,0.20,0.28);
        l.scale.set(H*0.028,ll,H*0.028);l.position.y=ll/2;
        lb.add(l);grp.add(lb);
      }
      /* the crown — 5 overlapping masses, asymmetric, one silhouette hex */
      const cr=H*0.40;
      const offs=[[0,0.72,0,1.00],[-0.52,0.60,0.10,0.72],[0.50,0.62,-0.08,0.78],
                  [-0.20,0.88,0.16,0.62],[0.24,0.86,0.12,0.58]];
      for(let i=0;i<offs.length;i++){
        const o=offs[i];
        const b=new T.Mesh(crownGeo,kit.mat(pal.props.oak));
        const br=cr*o[3];
        b.scale.set(br,br*0.78,br);
        b.position.set(o[0]*cr*1.25,H*o[1],o[2]*cr*1.25);
        grp.add(b);
      }
      /* THE LANTERN — hung from the low limb in the OPEN GAP under the crown,
         beside the trunk, where it reads against the bright horizon band
         (r-matrix lesson: lit-on-dark needs a sky gap to carry — the crown
         silhouette spans ±1.4·cr, so "past the edge" was still inside it). */
      const lx=cr*0.85,ly=H*0.32,lz=cr*0.08;
      const rope=new T.Mesh(bladeGeo,kit.mat(pal.props.oakTrunk));
      rope.scale.set(0.05,H*0.10,0.05);rope.position.set(lx,ly+H*0.05,lz);grp.add(rope);
      const ln=new T.Mesh(lanternGeo,kit.mat(pal.accent));
      ln.scale.set(1.0,1.5,1.0);ln.position.set(lx,ly,lz);grp.add(ln);
      const lh=new T.Mesh(haloGeo,accHaloMat);
      lh.scale.set(2.6,2.6,2.6);lh.position.set(lx,ly,lz);grp.add(lh);
      return grp;
    }
    function wishingStone(){
      const grp=new T.Group();
      const H=clamp(Rl*0.95,19,30);
      const lean=new T.Group();lean.rotation.z=0.12;
      const m=new T.Mesh(menhirGeo,kit.mat(pal.props.stone));
      m.scale.set(H*0.16,H,H*0.115);m.position.y=H*0.46;lean.add(m);
      /* THE RUNE BAND — one glowing ring, riding the lean */
      const rb=new T.Mesh(lanternGeo,kit.mat(pal.accent));
      rb.scale.set(H*0.17,H*0.05,H*0.125);rb.position.y=H*0.62;lean.add(rb);
      const rh=new T.Mesh(haloGeo,accHaloMat);
      rh.scale.set(H*0.24,H*0.10,H*0.19);rh.position.y=H*0.62;lean.add(rh);
      grp.add(lean);
      for(let i=0;i<3;i++){
        const pr=rng(rnd,0.7,1.3);
        const p=new T.Mesh(pebbleGeo,kit.mat(pal.props.stoneLit));
        p.scale.set(pr*1.3,pr*0.7,pr);
        p.position.set(rng(rnd,1.5,3.4)*(rnd()<0.5?-1:1),pr*0.35,rng(rnd,-2.5,2.5));
        grp.add(p);
      }
      return grp;
    }
    function stoneCircle(){
      const grp=new T.Group();
      const n=7,cr=9.5;
      for(let i=0;i<n;i++){
        const a=(i/n)*6.28318+rng(rnd,-0.1,0.1);
        const sh=rng(rnd,3.8,5.6);
        const m=new T.Mesh(menhirGeo,kit.mat(pal.props.stone));
        m.scale.set(sh*0.28,sh,sh*0.20);
        m.position.set(Math.sin(a)*cr,sh*0.46,Math.cos(a)*cr);
        m.rotation.y=a;m.rotation.z=rng(rnd,-0.06,0.06);
        grp.add(m);
      }
      const alt=new T.Mesh(slabGeo,kit.mat(pal.props.stoneLit));
      alt.scale.set(2.3,1.0,2.3);alt.position.y=0.5;grp.add(alt);
      /* THE ALTAR LAMP — one lit octa on the slab */
      const lamp=new T.Mesh(headGeo,kit.mat(pal.accent));
      lamp.scale.set(0.5,0.62,0.5);lamp.position.y=1.55;grp.add(lamp);
      const lh=new T.Mesh(haloGeo,accHaloMat);
      lh.scale.set(1.5,1.5,1.5);lh.position.y=1.55;grp.add(lh);
      return grp;
    }

    const tables=[];
    /* THE ONE LANDMARK */
    const lmFp=lv===0?clamp(Rl*1.35,26,40)*0.50:lv===2?13:Rl*0.22;
    tables.push({
      landmark:true,count:1,rad:lv===2?18:26,footprint:lmFp,
      ring:[Math.max(basinR+26,118),Math.max(basinR+56,196)],
      make:function(){return lv===1?wishingStone():lv===2?stoneCircle():greatOak()},
      yAt:lv===2?function(heightAt,x,z){       /* the circle crowns its local knoll */
        let m=heightAt(x,z);
        for(let i=0;i<12;i++){const a=i/12*6.28318;
          m=Math.max(m,heightAt(x+Math.cos(a)*9.5,z+Math.sin(a)*9.5))}
        return m+0.15;
      }:undefined,
      sink:lv===2?0:0.6
    });
    /* NEAR LAW tables — all near:true (NEAR DETAIL dial), outer annulus, drivable */
    tables.push({near:true,count:7,odd:true,insideBasinOK:true,rad:2.5,
      ring:[basinR-12,basinR+14],scaleRng:[0.9,1.5],
      make:function(T2,r2,s){return vignette(s)},sink:0.12});
    /* blades START AT THE EYE (doc2 §4): the Ascent's bottom-edge grass, in 3D —
       foreground strokes 15–30 m out are what make the close field mean something */
    tables.push({near:true,count:150,insideBasinOK:true,rad:0.9,
      ring:[basinR*0.14,basinR-6],scaleRng:[0.8,1.4],
      make:function(T2,r2,s){return tuft(s)},sink:0.05});
    tables.push({near:true,count:40,rad:1.0,
      ring:[basinR+4,basinR+110],scaleRng:[0.9,1.6],
      make:function(T2,r2,s){return tuft(s)},sink:0.05});
    tables.push({near:true,count:26,insideBasinOK:true,rad:1.1,
      ring:[basinR*0.30,basinR-4],scaleRng:[0.8,1.3],
      make:function(T2,r2,s){return flowerCluster(s)},sink:0.06});
    tables.push({near:true,count:14,rad:1.1,
      ring:[basinR+4,basinR+80],scaleRng:[0.9,1.4],
      make:function(T2,r2,s){return flowerCluster(s)},sink:0.06});
    tables.push({near:true,count:16,insideBasinOK:true,rad:1.2,
      ring:[basinR*0.22,basinR-8],scaleRng:[0.8,1.4],
      make:function(T2,r2,s){return pebbleTriad(s)},sink:0.10});
    /* fireflies — warm dots floating over the verge (the one temperature the meadow
       shares with the lantern). Static v1 — drift is a later one-moving-thing dial. */
    tables.push({near:true,count:40,insideBasinOK:true,rad:0.5,align:'none',
      ring:[basinR*0.30,basinR+36],scaleRng:[1,1],
      make:function(){return firefly()},
      yAt:function(heightAt,x,z){return heightAt(x,z)+rng(rnd,0.4,1.15)}});
    /* mid field — shrub masses + sparse standing stones (punctuation) */
    tables.push({count:22,rad:2.6,footprint:function(s){return s*0.9},
      ring:[basinR+12,235],scaleRng:[1.6,3.2],
      make:function(T2,r2,s){return shrub(s)},sink:0.3});
    tables.push({count:3,odd:true,punct:true,rad:3,
      ring:[basinR+16,240],scaleRng:[2.2,4.0],
      make:function(T2,r2,s){return standingStone(s)},sink:0.4});
    return tables;
  },

  /* ── hand-tuned presets (doc §2). Preset 0 = pack defaults = THE ASCENT frame. */
  presets:[
    {name:'FIRST STAR',params:{timeOfDay:'dusk',relief:20,terrace:0,terraceSteps:5,
      rough:0.5,basinR:130,density:1.0,punct:1.0,landmark:0,hueShift:0,accent:0,bands:4,
      farRings:3,nearDetail:1.2,fog:false,fogAmt:0.5,water:false}},
    {name:'DEEP NIGHT',params:{timeOfDay:'night',relief:22,terrace:0,terraceSteps:5,
      rough:0.52,basinR:130,density:0.9,punct:1.7,landmark:1,hueShift:0,accent:1,bands:4,
      farRings:3,nearDetail:1.0,fog:false,fogAmt:0.5,water:false}},
    {name:'CROWN OF DAWN',params:{timeOfDay:'dawn',relief:18,terrace:0,terraceSteps:5,
      rough:0.48,basinR:135,density:0.9,punct:0.5,landmark:2,hueShift:0,accent:0,bands:4,
      farRings:3,nearDetail:1.1,fog:false,fogAmt:0.5,water:false}}
  ]
};

global.BACKLOT_PACKS=global.BACKLOT_PACKS||{};
global.BACKLOT_PACKS['meadow-nocturne']=PACK;

})(window);
