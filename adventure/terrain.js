// ═══════════════════════════════════════════════════════════════════════
// terrain.js — Complete pixel-art terrain renderer for Overworld Adventure
// Canvas: 840×560 pixels, 4 regions in diamond layout
// Replaces inline renderArt + all draw functions in index.html
// Uses globals from index.html: a, MW, MH, px, pr, sr, rn, ri, pk, lr
// ═══════════════════════════════════════════════════════════════════════

function renderArt(){
  a.fillStyle='#1a4a10';a.fillRect(0,0,MW,MH);
  drawGrassBase();
  drawRollingHillsTD();
  drawFrostValleyTD();
  drawVolcanicIslesTD();
  drawDarkCastleTD();
  drawWaterFeatures();
  drawMainRoads();
}

// ─────────────────────────────────────────────────────────────
// GRASS BASE — per-pixel blended terrain with region tints
// ─────────────────────────────────────────────────────────────
function drawGrassBase(){
  sr(100);
  for(let y=0;y<MH;y++){
    for(let x=0;x<MW;x++){
      const cx=x/MW, cy=y/MH;
      const v=rn();
      const v2=rn();

      // Rich grass base with multiple octaves of variation
      let r=40+v*18+Math.sin(x*0.04+y*0.03)*6+Math.sin(x*0.11)*3;
      let g=88+v*28+Math.sin(x*0.035-y*0.028)*12+Math.cos(y*0.07)*5;
      let b=22+v*10;

      // Subtle darker patches for depth (shadow under trees etc)
      const patch=Math.sin(x*0.02+y*0.015)*Math.cos(x*0.018-y*0.025);
      if(patch>0.6){r-=8;g-=10;b-=4;}

      // Dappled sunlight in rolling hills area
      if(cy>0.5){
        const sun=Math.sin(x*0.08)*Math.sin(y*0.06);
        if(sun>0.7){r+=6;g+=10;b+=2;}
      }

      // ── Region tints ──
      // Frost Valley: left side, upper half
      const fvDist=Math.sqrt(Math.pow(cx-0.15,2)*1.2+Math.pow(cy-0.32,2));
      const fvT=Math.max(0,1-fvDist*2.0);

      // Volcanic Isles: right side, upper half
      const viDist=Math.sqrt(Math.pow(cx-0.85,2)*1.2+Math.pow(cy-0.32,2));
      const viT=Math.max(0,1-viDist*2.0);

      // Dark Castle: top center
      const dcDist=Math.sqrt(Math.pow(cx-0.50,2)+Math.pow(cy-0.08,2)*1.5);
      const dcT=Math.max(0,1-dcDist*2.5);

      // Apply tints with smooth blending
      if(fvT>0){
        const snowNoise=v2*12;
        r=lr(r,168+snowNoise,fvT);
        g=lr(g,178+snowNoise*0.8,fvT);
        b=lr(b,200+snowNoise*0.6,fvT);
      }
      if(viT>0){
        const heatNoise=v2*14;
        r=lr(r,72+heatNoise,viT);
        g=lr(g,50+heatNoise*0.5,viT);
        b=lr(b,38+heatNoise*0.3,viT);
      }
      if(dcT>0){
        const darkNoise=v2*8;
        r=lr(r,28+darkNoise,dcT);
        g=lr(g,20+darkNoise*0.5,dcT);
        b=lr(b,42+darkNoise,dcT);
      }

      // Transition zones: slight darkening at region borders
      const totalTint=fvT+viT+dcT;
      if(totalTint>0.1&&totalTint<0.4){
        r=Math.floor(r*0.92);g=Math.floor(g*0.92);b=Math.floor(b*0.92);
      }

      px(x,y,`rgb(${Math.floor(Math.max(0,Math.min(255,r)))},${Math.floor(Math.max(0,Math.min(255,g)))},${Math.floor(Math.max(0,Math.min(255,b)))})`);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// ROLLING HILLS — cottages, groves, fields, flowers, fences
// ─────────────────────────────────────────────────────────────
function drawRollingHillsTD(){
  sr(200);

  // ── Gentle rolling hills (smooth green mounds seen from above) ──
  const hills=[
    [160,440,36,'#4aa838','#3a9028'],[320,500,28,'#48a030','#389828'],
    [600,460,32,'#50b040','#40a030'],[760,430,24,'#4aa838','#3a9028'],
    [260,390,20,'#48a830','#389820'],[500,520,40,'#50b040','#40a030'],
    [100,490,22,'#4aa838','#3a9028'],[700,500,26,'#48a830','#389820'],
    [420,420,16,'#50b040','#40a030'],[550,380,14,'#4aa838','#3a9028'],
    [200,530,30,'#44a030','#38942a'],[680,540,18,'#4ca838','#3c9428'],
    [380,480,22,'#50b848','#40a838'],[480,460,20,'#48a430','#389c28'],
  ];
  for(const[hcx,hcy,hr,c1,c2]of hills){
    for(let dy=-hr;dy<=hr;dy++){
      for(let dx=-hr;dx<=hr;dx++){
        const d=Math.sqrt(dx*dx+dy*dy);
        if(d<=hr){
          const shade=1-d/hr;
          const ppx=Math.floor(hcx+dx),ppy=Math.floor(hcy+dy);
          if(ppx>=0&&ppx<MW&&ppy>=0&&ppy<MH){
            // Gradient: brighter center, darker edges
            if(shade>0.6)px(ppx,ppy,c1);
            else if(shade>0.3)px(ppx,ppy,c2);
            else{
              // Even darker edge
              const cr=parseInt(c2.slice(1,3),16)-10;
              const cg=parseInt(c2.slice(3,5),16)-10;
              const cb=parseInt(c2.slice(5,7),16)-5;
              px(ppx,ppy,`rgb(${cr},${cg},${cb})`);
            }
          }
        }
      }
    }
  }

  // ── Wheat/crop fields ──
  const fields=[
    [120,460,45,25],[560,490,40,20],[350,540,35,18],[680,460,30,22],
  ];
  for(const[fx,fy,fw,fh]of fields){
    // Field base (golden)
    for(let dy=0;dy<fh;dy++){
      for(let dx=0;dx<fw;dx++){
        const ppx=fx+dx,ppy=fy+dy;
        if(ppx>=0&&ppx<MW&&ppy>=0&&ppy<MH){
          const rowLine=(dy%3===0)?1:0;
          if(rowLine)px(ppx,ppy,'#c8a040');
          else px(ppx,ppy,rn()>0.5?'#d4b848':'#c8a838');
        }
      }
    }
    // Fence around field
    for(let dx=0;dx<fw;dx+=4){
      px(fx+dx,fy-1,'#8a7050');px(fx+dx,fy+fh,'#8a7050');
    }
    for(let dy=0;dy<fh;dy+=4){
      px(fx-1,fy+dy,'#8a7050');px(fx+fw,fy+dy,'#8a7050');
    }
  }

  // ── Tree groves (clustered, not random scatter) ──
  const groves=[
    {cx:80,cy:400,count:12,spread:30},
    {cx:250,cy:440,count:8,spread:20},
    {cx:450,cy:380,count:10,spread:25},
    {cx:620,cy:420,count:9,spread:22},
    {cx:340,cy:510,count:6,spread:18},
    {cx:750,cy:480,count:7,spread:20},
    {cx:180,cy:500,count:5,spread:15},
    {cx:520,cy:540,count:4,spread:12},
  ];
  for(const g of groves){
    for(let i=0;i<g.count;i++){
      const tx=g.cx+ri(-g.spread,g.spread);
      const ty=g.cy+ri(-g.spread,g.spread);
      if(ty<MH*0.52||ty>MH-8)continue;
      if(tx<20||tx>MW-20)continue;

      // Trunk (1px brown)
      px(tx,ty+1,'#5a3a20');
      px(tx,ty+2,'#5a3a20');

      // Canopy (round, 3-4px radius)
      const sz=ri(3,4);
      const canopyColor=pk(['#1a5a10','#2a6a1a','#2a7a1a','#1e6218','#307a28']);
      const highlightColor=pk(['#3a8a2a','#4a9a3a','#48903a']);
      for(let dy=-sz;dy<=sz;dy++){
        for(let dx=-sz;dx<=sz;dx++){
          const d=dx*dx+dy*dy;
          if(d<=sz*sz){
            const ppx=tx+dx,ppy=ty+dy-1;
            if(ppx>=0&&ppx<MW&&ppy>=0&&ppy<MH){
              // Highlight on upper-left for 3D effect
              if(dx<0&&dy<0&&d<sz)px(ppx,ppy,highlightColor);
              else px(ppx,ppy,canopyColor);
            }
          }
        }
      }
    }
  }

  // ── Cottages with roofs, windows, chimneys ──
  const houses=[
    [200,410,'#b05040',false],[350,400,'#607898',true],[520,430,'#709048',false],
    [660,410,'#b06050',true],[420,480,'#a04838',false],[280,520,'#906840',false],
    [140,450,'#885840',true],[580,510,'#708858',false],[740,440,'#a85840',true],
  ];
  for(const[hx,hy,roofColor,hasChimney]of houses){
    // Stone/wood walls
    pr(hx-3,hy-1,7,5,'#d0c0a0');
    pr(hx-2,hy,5,3,'#c8b898');
    // Peaked roof
    pr(hx-4,hy-2,9,2,roofColor);
    pr(hx-3,hy-3,7,1,roofColor);
    pr(hx-2,hy-4,5,1,roofColor);
    pr(hx-1,hy-5,3,1,roofColor);
    // Windows (lit yellow)
    px(hx-1,hy,'#f0d860');px(hx+2,hy,'#f0d860');
    // Door
    px(hx,hy+2,'#5a3820');px(hx,hy+3,'#5a3820');
    // Chimney
    if(hasChimney){
      pr(hx+2,hy-6,2,3,'#706060');
      px(hx+2,hy-7,'#888');px(hx+3,hy-7,'#999');
    }
    // Shadow on right side
    for(let dy=-1;dy<4;dy++)px(hx+4,hy+dy,'rgba(0,0,0,0.15)');
  }

  // ── Stone walls separating areas ──
  const walls=[
    {x1:100,y1:430,x2:180,y2:430},
    {x1:500,y1:450,x2:580,y2:450},
    {x1:300,y1:380,x2:300,y2:420},
  ];
  for(const w of walls){
    const steps=Math.max(Math.abs(w.x2-w.x1),Math.abs(w.y2-w.y1));
    for(let i=0;i<=steps;i++){
      const t=steps>0?i/steps:0;
      const wx=Math.floor(lr(w.x1,w.x2,t));
      const wy=Math.floor(lr(w.y1,w.y2,t));
      px(wx,wy,'#908878');
      if(i%3===0)px(wx,wy-1,'#988e80');
    }
  }

  // ── Flower meadows ──
  const flowerColors=['#e04878','#e8b030','#9848c0','#48c068','#f07090','#f0f070','#c070e0','#f0a0c0'];
  for(let i=0;i<120;i++){
    const fx=ri(50,MW-50),fy=ri(Math.floor(MH*0.56),MH-10);
    const fcx=fx/MW;
    if(fcx<0.15||fcx>0.85)continue;
    const c=pk(flowerColors);
    px(fx,fy,c);
    // Some flowers are 2px clusters
    if(rn()>0.6){
      px(fx+1,fy,c);
      if(rn()>0.7)px(fx,fy+1,c);
    }
  }

  // ── Small garden patches near houses ──
  for(const[hx,hy]of[[200,410],[520,430],[420,480]]){
    for(let i=0;i<8;i++){
      const gx=hx+ri(-8,8),gy=hy+ri(5,10);
      px(gx,gy,pk(['#d04060','#e0c030','#40b060']));
    }
  }

  // ── Hay bales ──
  for(const[bx,by]of[[150,478],[575,505],[370,535]]){
    pr(bx,by,3,2,'#c8a040');
    pr(bx,by-1,3,1,'#d8b850');
    px(bx+1,by-2,'#d8c058');
  }

  // ── Windmill (one landmark) ──
  const wmx=480,wmy=400;
  pr(wmx-2,wmy-8,5,10,'#d0c0a0');
  pr(wmx-1,wmy-10,3,2,'#b04838');
  // Blades
  px(wmx,wmy-11,'#c8b890');px(wmx,wmy-14,'#c8b890');px(wmx,wmy-12,'#c8b890');px(wmx,wmy-13,'#c8b890');
  px(wmx+3,wmy-8,'#c8b890');px(wmx+4,wmy-8,'#c8b890');px(wmx+5,wmy-8,'#c8b890');
  px(wmx-3,wmy-8,'#c8b890');px(wmx-4,wmy-8,'#c8b890');px(wmx-5,wmy-8,'#c8b890');
  px(wmx,wmy-5,'#c8b890');px(wmx,wmy-4,'#c8b890');px(wmx,wmy-3,'#c8b890');
}

// ─────────────────────────────────────────────────────────────
// FROST VALLEY — mountains, pine forests, frozen lake, aurora
// ─────────────────────────────────────────────────────────────
function drawFrostValleyTD(){
  sr(300);

  // ── Massive mountain range ──
  const mountains=[
    [50, 60, 32],[110,36,40],[170,44,28],[230,56,24],
    [80,110,20],[140,90,22],[30,100,18],[200,80,16],
  ];
  for(const[mx,my,ms]of mountains){
    // Mountain body: layered triangular shape
    for(let r=ms;r>0;r-=1){
      const yt=r/ms;
      // Color gradient: dark at base, lighter stone mid, white snow at peak
      let baseR,baseG,baseB;
      if(yt>0.7){
        // Lower slopes — dark blue-grey
        baseR=90+yt*15;baseG=95+yt*15;baseB=110+yt*15;
      }else if(yt>0.35){
        // Mid section — lighter stone
        baseR=120+yt*40;baseG=128+yt*38;baseB=140+yt*35;
      }else{
        // Upper — light grey approaching white
        baseR=170+yt*30;baseG=178+yt*25;baseB=195+yt*20;
      }
      for(let dx=-r;dx<=r;dx++){
        const dy=r-Math.abs(dx);
        const ppx=mx+dx,ppy=my-Math.floor(dy*0.55);
        if(ppx>=0&&ppx<MW*0.40&&ppy>=0&&ppy<MH){
          px(ppx,ppy,`rgb(${Math.floor(baseR)},${Math.floor(baseG)},${Math.floor(baseB)})`);
        }
      }
    }

    // Ridgeline detail (darker line along peak edge)
    for(let dx=-Math.floor(ms*0.5);dx<=Math.floor(ms*0.5);dx++){
      const ppx=mx+dx,ppy=my-Math.floor((ms-Math.abs(dx))*0.5);
      if(ppx>=0&&ppx<MW*0.40&&ppy>=0&&ppy<MH){
        px(ppx,ppy,'#8090a8');
      }
    }

    // Snow cap (top portion)
    const capSize=Math.floor(ms*0.4);
    for(let r=capSize;r>0;r-=1){
      for(let dx=-r;dx<=r;dx++){
        const dy=r-Math.abs(dx);
        const ppx=mx+dx,ppy=my-Math.floor(ms*0.35)-Math.floor(dy*0.5);
        if(ppx>=0&&ppx<MW*0.40&&ppy>=0&&ppy<MH){
          const snowShade=rn()>0.3?'#eaf0f8':'#dce8f2';
          px(ppx,ppy,snowShade);
        }
      }
    }
    // Bright snow tip
    px(mx,my-Math.floor(ms*0.55),'#f8fcff');
    if(ms>20){px(mx-1,my-Math.floor(ms*0.54),'#f0f6fc');px(mx+1,my-Math.floor(ms*0.54),'#f0f6fc');}
  }

  // ── Frozen waterfall on large mountain ──
  const fwx=112,fwy=60;
  for(let i=0;i<16;i++){
    const wx=fwx+Math.floor(Math.sin(i*0.3)*1);
    const wy=fwy+i;
    px(wx,wy,'#a0d0e8');px(wx+1,wy,'#90c0d8');
    if(i%4===0){px(wx-1,wy,'#c0e0f0');px(wx+2,wy,'#c0e0f0');} // spray
  }
  // Pool at base
  for(let dx=-3;dx<=3;dx++)for(let dy=0;dy<2;dy++){
    if(Math.abs(dx)<4-dy)px(fwx+dx,fwy+16+dy,'#80b8d0');
  }

  // ── Dense pine forest ──
  for(let i=0;i<80;i++){
    const tx=ri(8,Math.floor(MW*0.37));
    const ty=ri(40,Math.floor(MH*0.52));
    // Skip if on top of mountain peaks
    let onMountain=false;
    for(const[mx,my,ms]of mountains){
      if(Math.abs(tx-mx)<ms*0.6&&ty<my)onMountain=true;
    }
    if(onMountain&&rn()>0.3)continue;

    const treeH=ri(4,6);
    const treeW=Math.floor(treeH*0.7);
    const treeColor=pk(['#1a3830','#1a4038','#1e4438','#163830']);

    // Triangular pine shape
    for(let row=0;row<treeH;row++){
      const rowW=Math.floor((row/treeH)*treeW);
      for(let dx=-rowW;dx<=rowW;dx++){
        const ppx=tx+dx,ppy=ty-treeH+row;
        if(ppx>=0&&ppx<MW*0.40&&ppy>=0&&ppy<MH){
          px(ppx,ppy,treeColor);
        }
      }
    }
    // Trunk
    px(tx,ty,'#3a2a1a');px(tx,ty+1,'#3a2a1a');
    // Snow on top
    px(tx,ty-treeH,'#dce8f2');
    if(rn()>0.4){px(tx-1,ty-treeH+1,'#d0e0ee');px(tx+1,ty-treeH+1,'#d0e0ee');}
  }

  // ── Frozen lake ──
  const lx=140,ly=200,lw=32,lh=18;
  for(let dy=-lh;dy<=lh;dy++){
    for(let dx=-lw;dx<=lw;dx++){
      if(dx*dx/(lw*lw)+dy*dy/(lh*lh)<=1){
        const ppx=lx+dx,ppy=ly+dy;
        if(ppx>=0&&ppx<MW&&ppy>=0&&ppy<MH){
          // Base ice color
          const iceShade=rn()>0.5?'#88b8d8':'#78a8c8';
          px(ppx,ppy,iceShade);
        }
      }
    }
  }
  // Frost patterns on lake (white streaks)
  for(let i=0;i<12;i++){
    let cx_=lx+ri(-lw+4,lw-4),cy_=ly+ri(-lh+2,lh-2);
    const len=ri(4,10);
    const angle=rn()*Math.PI*2;
    for(let j=0;j<len;j++){
      const fx=Math.floor(cx_+Math.cos(angle)*j);
      const fy=Math.floor(cy_+Math.sin(angle)*j);
      if(fx>lx-lw&&fx<lx+lw&&fy>ly-lh&&fy<ly+lh){
        px(fx,fy,'#c0dae8');
      }
    }
  }
  // Cracks in ice (darker thin lines)
  for(let i=0;i<5;i++){
    let cx_=lx+ri(-lw+6,lw-6),cy_=ly+ri(-lh+3,lh-3);
    const len=ri(6,14);
    for(let j=0;j<len;j++){
      cx_+=ri(-1,1);cy_+=ri(0,1);
      if(cx_>lx-lw&&cx_<lx+lw&&cy_>ly-lh&&cy_<ly+lh){
        px(cx_,cy_,'#5888a8');
      }
    }
  }

  // ── Ice crystal formations ──
  for(let i=0;i<16;i++){
    const ix=ri(15,Math.floor(MW*0.36)),iy=ri(50,Math.floor(MH*0.50));
    // Tall crystal: base 2px, height 4-5px
    const ch=ri(4,6);
    for(let dy=0;dy<ch;dy++){
      const w=(dy>ch-2)?1:2;
      for(let dx=0;dx<w;dx++){
        px(ix+dx,iy-dy,'#a0d0e8');
      }
    }
    // Bright tip
    px(ix,iy-ch,'#d0f0ff');
    // Glow pixel
    if(rn()>0.5)px(ix+1,iy-ch+1,'#c0e8f8');
  }

  // ── Snow drifts (large white mounds) ──
  for(let i=0;i<30;i++){
    const sx=ri(5,Math.floor(MW*0.38)),sy=ri(20,Math.floor(MH*0.53));
    const sw=ri(4,8),sh=ri(2,3);
    for(let dy=0;dy<sh;dy++){
      for(let dx=0;dx<sw;dx++){
        if(rn()>0.2){
          const ppx=sx+dx,ppy=sy+dy;
          if(ppx<MW*0.40)
            px(ppx,ppy,rn()>0.5?'#d8e4f0':'#ccdce8');
        }
      }
    }
    // Highlight on top edge
    for(let dx=1;dx<sw-1;dx++){
      if(rn()>0.4)px(sx+dx,sy-1,'#e8f0f8');
    }
  }

  // ── Aurora borealis at top of Frost Valley ──
  for(let band=0;band<3;band++){
    const bandY=15+band*5;
    const bandColors=['rgba(100,220,140,0.4)','rgba(80,160,220,0.3)','rgba(160,100,220,0.25)'];
    for(let x=10;x<Math.floor(MW*0.35);x++){
      const wave=Math.sin(x*0.03+band*1.5)*3+Math.sin(x*0.07+band*0.8)*1.5;
      const py_=Math.floor(bandY+wave);
      if(py_>=0&&py_<MH&&rn()>0.3){
        px(x,py_,bandColors[band]);
        if(rn()>0.6)px(x,py_+1,bandColors[band]);
      }
    }
  }

  // ── Snowflake particles (tiny white dots) ──
  for(let i=0;i<60;i++){
    const sx=ri(5,Math.floor(MW*0.38)),sy=ri(10,Math.floor(MH*0.52));
    if(rn()>0.5)px(sx,sy,'rgba(255,255,255,0.5)');
    else px(sx,sy,'rgba(220,235,248,0.4)');
  }

  // ── Igloos / frost shelters ──
  for(const[ix,iy]of[[60,170],[200,140],[100,250]]){
    // Dome shape
    for(let dy=-3;dy<=1;dy++){
      for(let dx=-4;dx<=4;dx++){
        const d=dx*dx+dy*dy*2;
        if(d<=18&&dy<=0){
          px(ix+dx,iy+dy,'#d8e8f4');
        }
      }
    }
    // Door opening
    px(ix,iy+1,'#607080');px(ix+1,iy+1,'#607080');
    // Snow on top highlight
    px(ix,iy-3,'#f0f8ff');px(ix-1,iy-3,'#e8f0f8');px(ix+1,iy-3,'#e8f0f8');
  }
}

// ─────────────────────────────────────────────────────────────
// VOLCANIC ISLES — volcano, lava rivers, dead trees, obsidian
// ─────────────────────────────────────────────────────────────
function drawVolcanicIslesTD(){
  sr(400);

  // ── Dark ocean along right edge ──
  for(let y=0;y<Math.floor(MH*0.55);y++){
    for(let x=Math.floor(MW*0.90);x<MW;x++){
      const edge=(x-MW*0.90)/(MW*0.10);
      const depth=0.3+edge*0.7;
      if(rn()<depth){
        const wv=Math.sin(x*0.1+y*0.05)*10;
        const r_=Math.floor(20+wv);
        const g_=Math.floor(50+wv*1.5);
        const b_=Math.floor(100+wv*2);
        px(x,y,`rgb(${r_},${g_},${b_})`);
      }
    }
  }
  // Wave foam along coast
  for(let y=Math.floor(MH*0.12);y<Math.floor(MH*0.52);y++){
    const coastX=Math.floor(MW*0.89+Math.sin(y*0.06)*5);
    if(rn()>0.5)px(coastX,y,'#90a8a0');
    if(rn()>0.7)px(coastX+1,y,'#a0b8b0');
  }

  // ── Rocky coastline ──
  for(let y=Math.floor(MH*0.12);y<Math.floor(MH*0.52);y++){
    const coastX=Math.floor(MW*0.88+Math.sin(y*0.06)*5);
    for(let dx=0;dx<3;dx++){
      const ppx=coastX+dx;
      if(ppx>=0&&ppx<MW)px(ppx,y,pk(['#706050','#806858','#907060']));
    }
  }

  // ── THE VOLCANO — massive central feature ──
  const vx=710,vy=80,vr=45;
  // Volcano body
  for(let dy=-vr;dy<=vr;dy++){
    for(let dx=-vr;dx<=vr;dx++){
      const d=Math.sqrt(dx*dx+dy*dy);
      if(d<=vr){
        const ppx=vx+dx,ppy=vy+dy;
        if(ppx<0||ppx>=MW||ppy<0||ppy>=MH)continue;
        const distRatio=d/vr;
        if(d<10){
          // Caldera — glowing lava
          const heat=rn();
          if(heat>0.6)px(ppx,ppy,'#f8a030');
          else if(heat>0.3)px(ppx,ppy,'#e06020');
          else px(ppx,ppy,'#d04818');
        }else if(d<15){
          // Inner rim — hot dark rock with orange cracks
          if(rn()>0.7)px(ppx,ppy,'#c85020');
          else px(ppx,ppy,pk(['#4a3a30','#3a2a20']));
        }else if(d<30){
          // Mid slopes — dark grey stone
          const shade=0.6+distRatio*0.4;
          const sr_=Math.floor(55*shade),sg=Math.floor(48*shade),sb=Math.floor(42*shade);
          px(ppx,ppy,`rgb(${sr_},${sg},${sb})`);
        }else{
          // Outer slopes — slightly lighter
          px(ppx,ppy,pk(['#504840','#584e44','#4a4238']));
        }
      }
    }
  }

  // Lava veins on volcano surface
  for(let vein=0;vein<6;vein++){
    const angle=(vein/6)*Math.PI*2+rn()*0.5;
    let lx_=vx,ly_=vy;
    for(let step=10;step<vr-5;step++){
      lx_=Math.floor(vx+Math.cos(angle+Math.sin(step*0.15)*0.3)*step);
      ly_=Math.floor(vy+Math.sin(angle+Math.cos(step*0.12)*0.3)*step);
      if(lx_>=0&&lx_<MW&&ly_>=0&&ly_<MH){
        px(lx_,ly_,pk(['#d04818','#c84010','#e06028']));
        if(rn()>0.5)px(lx_+1,ly_,'#b03810');
      }
    }
  }

  // Smoke wisps above volcano
  for(let i=0;i<20;i++){
    const sx=vx+ri(-8,8),sy=vy-vr-ri(2,18);
    if(sx>=0&&sx<MW&&sy>=0&&sy<MH){
      px(sx,sy,pk(['rgba(120,110,100,0.4)','rgba(100,95,88,0.3)','rgba(140,130,120,0.25)']));
    }
  }

  // ── Lava rivers flowing from volcano ──
  const lavaRivers=[
    {sx:710,sy:125,ex:790,ey:240,width:3},
    {sx:700,sy:120,ex:620,ey:260,width:3},
    {sx:720,sy:130,ex:MW-5,ey:180,width:2},
    {sx:695,sy:115,ex:650,ey:200,width:2},
  ];
  for(const river of lavaRivers){
    const steps=120;
    for(let s=0;s<steps;s++){
      const t=s/steps;
      const lx_=Math.floor(lr(river.sx,river.ex,t)+Math.sin(s*0.1)*4);
      const ly_=Math.floor(lr(river.sy,river.ey,t)+Math.cos(s*0.08)*3);
      const w=Math.max(1,Math.floor(river.width*(1-t*0.5)));
      for(let dx=-w;dx<=w;dx++){
        const ppx=lx_+dx;
        if(ppx>=0&&ppx<MW&&ly_>=0&&ly_<MH){
          // Hotter center
          if(Math.abs(dx)<w*0.5)px(ppx,ly_,pk(['#f0a030','#e88828','#f0c040']));
          else px(ppx,ly_,pk(['#d04818','#c84010','#b83808']));
        }
      }
    }
  }

  // ── Lava pools ──
  const lavaPools=[
    [620,160,12],[750,180,8],[660,100,10],[580,220,9],[770,260,7],
  ];
  for(const[cx_,cy_,r]of lavaPools){
    for(let dy=-r;dy<=r;dy++){
      for(let dx=-r;dx<=r;dx++){
        const d=Math.sqrt(dx*dx+dy*dy);
        if(d<=r){
          const ppx=cx_+dx,ppy=cy_+dy;
          if(ppx>=0&&ppx<MW&&ppy>=0&&ppy<MH){
            if(d<r*0.4)px(ppx,ppy,pk(['#f0c040','#f8d050']));       // yellow-hot center
            else if(d<r*0.7)px(ppx,ppy,pk(['#e88828','#f0a030']));  // orange mid
            else px(ppx,ppy,pk(['#d04818','#c83810']));              // dark red edge
          }
        }
      }
    }
    // Glow around pool
    for(let dy=-r-2;dy<=r+2;dy++){
      for(let dx=-r-2;dx<=r+2;dx++){
        const d=Math.sqrt(dx*dx+dy*dy);
        if(d>r&&d<=r+2){
          const ppx=cx_+dx,ppy=cy_+dy;
          if(ppx>=0&&ppx<MW&&ppy>=0&&ppy<MH&&rn()>0.5){
            px(ppx,ppy,'rgba(208,72,24,0.3)');
          }
        }
      }
    }
  }

  // ── Obsidian formations ──
  for(let i=0;i<20;i++){
    const ox=ri(Math.floor(MW*0.64),MW-30),oy=ri(40,Math.floor(MH*0.50));
    const oh=ri(4,7);
    for(let dy=0;dy<oh;dy++){
      const w=(dy<oh-1)?2:1;
      for(let dx=0;dx<w;dx++){
        px(ox+dx,oy-dy,'#1a1028');
      }
    }
    // Sheen highlight
    px(ox,oy-oh+1,'#3a2848');
    px(ox,oy-oh,'#4a3060');
  }

  // ── Dead trees ──
  for(let i=0;i<18;i++){
    const tx=ri(Math.floor(MW*0.63),MW-25),ty=ri(30,Math.floor(MH*0.50));
    const treeH=ri(5,8);
    // Bare trunk
    for(let dy=0;dy<treeH;dy++){
      px(tx,ty-dy,'#2a1810');
    }
    // Branches (2-3 bare sticks)
    px(tx-1,ty-Math.floor(treeH*0.6),'#2a1810');
    px(tx-2,ty-Math.floor(treeH*0.6)-1,'#2a1810');
    px(tx+1,ty-Math.floor(treeH*0.4),'#2a1810');
    px(tx+2,ty-Math.floor(treeH*0.4)-1,'#2a1810');
    if(treeH>6){
      px(tx-1,ty-Math.floor(treeH*0.8),'#2a1810');
      px(tx-2,ty-Math.floor(treeH*0.8),'#2a1810');
    }
  }

  // ── Rocky islands in lava ──
  const islands=[
    [640,140,8],[690,200,6],[760,220,7],[610,180,5],
  ];
  for(const[ix,iy,ir]of islands){
    for(let dy=-ir;dy<=ir;dy++){
      for(let dx=-ir;dx<=ir;dx++){
        const d=dx*dx+dy*dy;
        if(d<=ir*ir){
          px(ix+dx,iy+dy,pk(['#504840','#585048','#605850']));
        }
      }
    }
  }

  // ── Ash/ember particles floating ──
  for(let i=0;i<40;i++){
    const ax=ri(Math.floor(MW*0.62),MW-5),ay=ri(15,Math.floor(MH*0.52));
    px(ax,ay,pk(['rgba(240,160,60,0.5)','rgba(200,80,30,0.4)','rgba(255,200,80,0.3)']));
  }

  // ── Scorched earth transition (east edge of Rolling Hills into Volcanic) ──
  for(let y=Math.floor(MH*0.40);y<Math.floor(MH*0.55);y++){
    for(let x=Math.floor(MW*0.58);x<Math.floor(MW*0.65);x++){
      const t=(x-MW*0.58)/(MW*0.07);
      if(rn()<t*0.4){
        px(x,y,pk(['#504840','#484038','#585048']));
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────
// DARK CASTLE — fortress, dead forest, crystals, lightning
// ─────────────────────────────────────────────────────────────
function drawDarkCastleTD(){
  sr(500);

  // ── Starfield (perpetual night sky) ──
  for(let i=0;i<80;i++){
    const sx=ri(Math.floor(MW*0.26),Math.floor(MW*0.74));
    const sy=ri(2,Math.floor(MH*0.12));
    const brightness=rn();
    if(brightness>0.7)px(sx,sy,'#d0d0f0');
    else if(brightness>0.4)px(sx,sy,'#a0a0c8');
    else px(sx,sy,'#7878a0');
    // Occasional twinkling (brighter neighbor pixel)
    if(rn()>0.85){px(sx+1,sy,'#b0b0d8');}
  }

  // ── Dark fog layers ──
  for(let layer=0;layer<8;layer++){
    const fy=Math.floor(MH*0.18)+layer*ri(5,10);
    const fStart=ri(Math.floor(MW*0.28),Math.floor(MW*0.40));
    const fEnd=ri(Math.floor(MW*0.60),Math.floor(MW*0.72));
    for(let x=fStart;x<fEnd;x++){
      if(rn()>0.4){
        const fogAlpha=0.15+rn()*0.15;
        px(x,fy,`rgba(18,12,30,${fogAlpha})`);
        if(rn()>0.6)px(x,fy+1,`rgba(18,12,30,${fogAlpha*0.7})`);
      }
    }
  }

  // ── Ruined outpost towers (scattered around region) ──
  const outposts=[
    [280,80],[360,76],[440,82],[520,78],[300,50],[500,48],
  ];
  for(const[rtx,rty]of outposts){
    // Stone tower base
    pr(rtx-2,rty-6,5,10,'#28203e');
    pr(rtx-1,rty-7,3,1,'#302848');
    // Crumbling top (random missing blocks)
    for(let dx=-2;dx<=2;dx++){
      if(rn()>0.4)px(rtx+dx,rty-7,'#302848');
      else px(rtx+dx,rty-7,'#181028'); // missing block = darker
    }
    // Window glow
    px(rtx,rty-4,'#6848a0');
    // Base rubble
    for(let dx=-3;dx<=3;dx++){
      if(rn()>0.6)px(rtx+dx,rty+4,'#252038');
    }
  }

  // ── THE CASTLE — massive central fortress ──
  const ccx=420,ccy=50;

  // Outer walls (40×30 footprint)
  pr(ccx-20,ccy-12,41,28,'#2a2042');

  // Inner courtyard (slightly lighter ground)
  pr(ccx-16,ccy-8,33,20,'#221a38');

  // Wall detail: battlements along top and bottom walls
  for(let i=0;i<11;i++){
    // Top battlements
    pr(ccx-20+i*4,ccy-15,2,3,'#342a50');
    // Bottom battlements
    pr(ccx-20+i*4,ccy+16,2,3,'#342a50');
  }
  // Side battlements
  for(let i=0;i<7;i++){
    pr(ccx-23,ccy-12+i*4,3,2,'#342a50');
    pr(ccx+21,ccy-12+i*4,3,2,'#342a50');
  }

  // 4 corner towers (circular, 5px radius, taller feel)
  const towerPositions=[[ccx-20,ccy-12],[ccx+20,ccy-12],[ccx-20,ccy+14],[ccx+20,ccy+14]];
  for(const[tx,ty]of towerPositions){
    for(let dy=-5;dy<=5;dy++){
      for(let dx=-5;dx<=5;dx++){
        if(dx*dx+dy*dy<=25){
          px(tx+dx,ty+dy,'#3a3058');
        }
      }
    }
    // Tower top ring
    for(let dy=-5;dy<=5;dy++){
      for(let dx=-5;dx<=5;dx++){
        const d=dx*dx+dy*dy;
        if(d<=25&&d>16){
          px(tx+dx,ty+dy,'#443868');
        }
      }
    }
    // Purple flame on each tower
    px(tx,ty-1,'#9060d0');px(tx,ty-2,'#b070f0');px(tx,ty-3,'#d0a0ff');
    px(tx-1,ty-1,'#7050b0');px(tx+1,ty-1,'#7050b0');
  }

  // Central keep (largest tower)
  for(let dy=-8;dy<=8;dy++){
    for(let dx=-7;dx<=7;dx++){
      if(dx*dx+dy*dy<=56){
        px(ccx+dx,ccy+dy,'#302650');
      }
    }
  }
  // Keep outer ring
  for(let dy=-8;dy<=8;dy++){
    for(let dx=-7;dx<=7;dx++){
      const d=dx*dx+dy*dy;
      if(d<=56&&d>36){
        px(ccx+dx,ccy+dy,'#3a3060');
      }
    }
  }
  // Glowing purple window in center keep
  px(ccx,ccy,'#a070e0');px(ccx+1,ccy,'#b080f0');
  px(ccx-1,ccy,'#8060c0');
  px(ccx,ccy-1,'#9068d0');px(ccx,ccy+1,'#9068d0');
  // Secondary windows
  for(const[wx,wy]of[[ccx-4,ccy-3],[ccx+4,ccy-3],[ccx-4,ccy+3],[ccx+4,ccy+3],[ccx,ccy-6]]){
    px(wx,wy,'#8858c0');
  }

  // Gate (imposing dark opening)
  pr(ccx-3,ccy+14,7,6,'#0c0614');
  // Gate arch
  pr(ccx-4,ccy+13,9,1,'#342a50');
  pr(ccx-3,ccy+12,7,1,'#342a50');
  // Purple glow flanking gate
  px(ccx-4,ccy+15,'#6040a0');px(ccx+4,ccy+15,'#6040a0');
  px(ccx-4,ccy+16,'#503888');px(ccx+4,ccy+16,'#503888');

  // ── Dark crystal formations (floating, glowing) ──
  for(let i=0;i<20;i++){
    const dx_=ri(Math.floor(MW*0.28),Math.floor(MW*0.72));
    const dy_=ri(12,Math.floor(MH*0.26));
    // Skip if inside castle
    if(dx_>ccx-22&&dx_<ccx+22&&dy_>ccy-16&&dy_<ccy+18)continue;
    const ch=ri(3,5);
    for(let ddy=0;ddy<ch;ddy++){
      const w=(ddy<ch-1)?2:1;
      for(let ddx=0;ddx<w;ddx++){
        px(dx_+ddx,dy_-ddy,'#503088');
      }
    }
    // Bright tip
    px(dx_,dy_-ch,'#8858c0');
    // Ground glow
    if(rn()>0.5)px(dx_,dy_+1,'rgba(80,48,136,0.3)');
  }

  // ── Dead forest ring around castle ──
  for(let i=0;i<35;i++){
    const angle=rn()*Math.PI*2;
    const dist=ri(35,65);
    const tx=Math.floor(ccx+Math.cos(angle)*dist);
    const ty=Math.floor(ccy+Math.sin(angle)*dist*0.6);
    if(tx<MW*0.26||tx>MW*0.74||ty<5||ty>MH*0.28)continue;

    const treeH=ri(5,8);
    // White-grey twisted trunk
    for(let dy=0;dy<treeH;dy++){
      const twist=Math.floor(Math.sin(dy*0.8)*1);
      px(tx+twist,ty-dy,'#382840');
    }
    // Reaching branches
    px(tx-1,ty-Math.floor(treeH*0.5),'#302438');
    px(tx-2,ty-Math.floor(treeH*0.5)-1,'#302438');
    px(tx-3,ty-Math.floor(treeH*0.5)-1,'#2a2030');
    px(tx+1,ty-Math.floor(treeH*0.7),'#302438');
    px(tx+2,ty-Math.floor(treeH*0.7)-1,'#302438');
    // Ghostly glow on some trees
    if(rn()>0.7)px(tx,ty-treeH,'#6050a0');
  }

  // ── Lightning bolts (1-2 frozen bolts) ──
  const bolts=[
    {x:320,topY:5,botY:30},
    {x:530,topY:8,botY:35},
  ];
  for(const bolt of bolts){
    let bx=bolt.x;
    for(let by=bolt.topY;by<bolt.botY;by++){
      // Zigzag
      if(rn()>0.5)bx+=ri(-1,1);
      px(bx,by,'#d0c0ff');
      // Glow around bolt
      px(bx-1,by,'rgba(180,160,255,0.3)');
      px(bx+1,by,'rgba(180,160,255,0.3)');
      // Bright core
      if(rn()>0.6)px(bx,by,'#f0e8ff');
    }
    // Branch off main bolt
    let branchX=bx;
    const branchStart=bolt.topY+Math.floor((bolt.botY-bolt.topY)*0.4);
    for(let by=branchStart;by<branchStart+8;by++){
      branchX+=1;
      px(branchX,by,'rgba(200,180,255,0.6)');
    }
  }

  // ── Path of bones (white pixel clusters along roads) ──
  for(let i=0;i<25;i++){
    const bx=ri(Math.floor(MW*0.32),Math.floor(MW*0.68));
    const by=ri(Math.floor(MH*0.10),Math.floor(MH*0.26));
    // Small bone pile: 2-4 white pixels clustered
    px(bx,by,'#c8c0b8');
    if(rn()>0.4)px(bx+1,by,'#b8b0a8');
    if(rn()>0.5)px(bx,by+1,'#c0b8b0');
    if(rn()>0.7)px(bx+1,by+1,'#a8a098');
  }

  // ── Eerie ground details ──
  // Purple-tinged moss/lichen on darker patches
  for(let i=0;i<40;i++){
    const mx_=ri(Math.floor(MW*0.28),Math.floor(MW*0.72));
    const my_=ri(Math.floor(MH*0.06),Math.floor(MH*0.28));
    if(mx_>ccx-22&&mx_<ccx+22&&my_>ccy-16&&my_<ccy+18)continue;
    px(mx_,my_,pk(['#2a1838','#201430','#1e1230']));
  }
}

// ─────────────────────────────────────────────────────────────
// WATER FEATURES — rivers, ponds, lily pads, rapids
// ─────────────────────────────────────────────────────────────
function drawWaterFeatures(){
  sr(600);

  // ── Main river through Rolling Hills ──
  // Starts at center, flows south with gentle curves
  let rx=420,ry=MH*0.50;
  const riverLength=160;
  for(let i=0;i<riverLength;i++){
    const t=i/riverLength;
    // River widens slightly as it flows south
    const w=Math.floor(4+Math.sin(i*0.06)*1.5+t*2);

    for(let dx=-w;dx<=w;dx++){
      const ppx=Math.floor(rx+dx),ppy=Math.floor(ry);
      if(ppx>=0&&ppx<MW&&ppy>=0&&ppy<MH){
        const distFromCenter=Math.abs(dx)/w;
        if(distFromCenter<0.3){
          // Deep blue center
          px(ppx,ppy,pk(['#1860a0','#1868a8']));
        }else if(distFromCenter<0.7){
          // Mid blue
          px(ppx,ppy,pk(['#2070a8','#2878b0']));
        }else{
          // Light blue edge
          px(ppx,ppy,pk(['#3888b8','#4098c0']));
        }
      }
    }

    // White foam/rapids at curves
    if(Math.abs(Math.sin(i*0.06))>0.8&&rn()>0.5){
      const foamX=Math.floor(rx+ri(-w+1,w-1));
      if(foamX>=0&&foamX<MW&&Math.floor(ry)>=0&&Math.floor(ry)<MH){
        px(foamX,Math.floor(ry),'#a0d0e8');
      }
    }

    // Fish (occasional tiny orange dot)
    if(rn()>0.97){
      const fishX=Math.floor(rx+ri(-w+2,w-2));
      if(fishX>=0&&fishX<MW&&Math.floor(ry)>=0&&Math.floor(ry)<MH){
        px(fishX,Math.floor(ry),'#e08840');
      }
    }

    // Meander
    rx+=Math.sin(i*0.04)*2.0;
    ry+=1;
  }

  // ── Tributary stream joining from the west ──
  let tx_=250,ty_=MH*0.60;
  for(let i=0;i<60;i++){
    const tw=2;
    for(let dx=-tw;dx<=tw;dx++){
      const ppx=Math.floor(tx_+dx),ppy=Math.floor(ty_);
      if(ppx>=0&&ppx<MW&&ppy>=0&&ppy<MH){
        if(Math.abs(dx)<1)px(ppx,ppy,'#2070a8');
        else px(ppx,ppy,'#3888b8');
      }
    }
    tx_+=2.5+Math.sin(i*0.1)*0.5;
    ty_+=0.3+Math.sin(i*0.08)*0.5;
  }

  // ── Ponds with lily pads ──
  const ponds=[
    [280,370,10],[560,400,8],[180,480,7],[650,520,6],
  ];
  for(const[pcx,pcy,pr_]of ponds){
    // Water body
    for(let dy=-pr_;dy<=pr_;dy++){
      for(let dx=-pr_;dx<=pr_;dx++){
        if(dx*dx+dy*dy<=pr_*pr_){
          const ppx=pcx+dx,ppy=pcy+dy;
          if(ppx>=0&&ppx<MW&&ppy>=0&&ppy<MH){
            px(ppx,ppy,pk(['#2070a8','#2878b0','#1868a0']));
          }
        }
      }
    }
    // Light reflection
    for(let dx=-2;dx<=2;dx++){
      const ppx=pcx+dx-1,ppy=pcy-Math.floor(pr_*0.4);
      if(ppx>=0&&ppx<MW&&ppy>=0&&ppy<MH){
        px(ppx,ppy,'rgba(160,210,240,0.5)');
      }
    }
    // Lily pads (tiny green dots on water surface)
    for(let lp=0;lp<ri(2,4);lp++){
      const lpx=pcx+ri(-pr_+2,pr_-2),lpy=pcy+ri(-pr_+2,pr_-2);
      if(lpx*lpx+lpy*lpy<pr_*pr_){// rough check
        px(lpx,lpy,'#408030');
        if(rn()>0.5)px(lpx+1,lpy,'#408030');
        // Tiny flower on some
        if(rn()>0.6)px(lpx,lpy-1,'#f0a0c0');
      }
    }
  }

  // ── Small waterfall where tributary drops into a lower area ──
  const wfx=320,wfy=380;
  for(let dy=0;dy<6;dy++){
    px(wfx,wfy+dy,'#80b8d8');px(wfx+1,wfy+dy,'#70a8c8');
    if(dy%2===0)px(wfx-1,wfy+dy,'#a0d0e8'); // spray
    if(dy%2===1)px(wfx+2,wfy+dy,'#a0d0e8');
  }
  // Splash at base
  px(wfx-1,wfy+6,'#a0d0e8');px(wfx,wfy+6,'#80b8d8');px(wfx+1,wfy+6,'#a0d0e8');px(wfx+2,wfy+6,'#90c0d8');
}

// ─────────────────────────────────────────────────────────────
// MAIN ROADS — connecting all regions with themed paths
// ─────────────────────────────────────────────────────────────
function drawMainRoads(){
  sr(700);

  // Road drawing helper
  function road(x1,y1,x2,y2,w,baseColor,accentColor,debrisColor){
    const dist=Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
    const st=Math.max(Math.floor(dist*2),20);
    for(let i=0;i<=st;i++){
      const t=i/st;
      const cx_=Math.floor(lr(x1,x2,t)+Math.sin(i*0.05+x1*0.01)*2.5);
      const cy_=Math.floor(lr(y1,y2,t)+Math.cos(i*0.06+y1*0.01)*1.5);
      for(let dy=-w;dy<=w;dy++){
        for(let dx=-w;dx<=w;dx++){
          if(Math.abs(dx)+Math.abs(dy)<=w){
            const ppx=cx_+dx,ppy=cy_+dy;
            if(ppx>=0&&ppx<MW&&ppy>=0&&ppy<MH){
              // Edge vs center color
              if(Math.abs(dx)+Math.abs(dy)===w){
                px(ppx,ppy,accentColor);
              }else{
                px(ppx,ppy,baseColor);
              }
            }
          }
        }
      }
      // Occasional debris/detail along road
      if(debrisColor&&rn()>0.9){
        const dpx=cx_+ri(-w-1,w+1),dpy=cy_+ri(-w-1,w+1);
        if(dpx>=0&&dpx<MW&&dpy>=0&&dpy<MH)px(dpx,dpy,debrisColor);
      }
    }
  }

  // ── Rolling Hills roads (tan/sandy dirt) ──
  // Main north-south through center
  road(420,480,420,310,2,'#b09868','#a08858',null);
  // East-west connector
  road(200,440,640,440,2,'#a89060','#988050',null);
  // Side paths
  road(300,480,300,420,1,'#a89060','#988050',null);
  road(540,490,540,430,1,'#a89060','#988050',null);

  // ── Stone bridge over river ──
  const bx=420,by_=Math.floor(MH*0.62);
  pr(bx-5,by_-2,11,5,'#909090');
  pr(bx-4,by_-1,9,3,'#a0a0a0');
  // Bridge rails
  px(bx-5,by_-3,'#808080');px(bx+5,by_-3,'#808080');
  px(bx-5,by_+3,'#808080');px(bx+5,by_+3,'#808080');
  // Stone texture on bridge
  for(let dx=-3;dx<=3;dx+=2){
    px(bx+dx,by_,'#888888');
  }

  // ── Path from Rolling Hills to Frost Valley ──
  road(420,310,200,200,2,'#a09068','#908858',null);
  // Frost Valley roads (snow-covered, slightly different white)
  road(200,200,150,120,2,'#c8d4e0','#b8c8d8',null);
  road(150,120,80,80,2,'#c8d4e0','#b8c8d8',null);
  road(150,120,60,180,2,'#c8d4e0','#b8c8d8',null);
  road(80,80,50,40,2,'#c8d4e0','#b8c8d8',null);
  road(200,200,100,250,1,'#c0ccd8','#b0c0d0',null);

  // ── Path from Rolling Hills to Volcanic Isles ──
  road(420,310,640,200,2,'#807068','#706058',null);
  // Volcanic roads (dark stone paths)
  road(640,200,700,120,2,'#605850','#504840','#c84010');
  road(640,200,580,240,2,'#605850','#504840','#c84010');
  road(700,120,750,160,2,'#585048','#484038','#d04818');
  road(700,120,680,80,2,'#585048','#484038',null);

  // ── Path from center to Dark Castle ──
  road(420,310,420,160,2,'#807068','#706058',null);
  road(420,160,420,90,2,'#504858','#403848','#c8c0b8'); // bone debris
  // Dark Castle interior roads (purple-grey stone)
  road(420,90,320,70,2,'#3a3050','#302848','#c8c0b8');
  road(420,90,520,72,2,'#3a3050','#302848','#c8c0b8');
  road(320,70,280,50,2,'#3a3050','#302848',null);
  road(520,72,540,50,2,'#3a3050','#302848',null);

  // ── Cross-regional connector: Frost Valley to Dark Castle ──
  road(200,200,350,70,2,'#706878','#605868','#c8c0b8');

  // ── Cross-regional connector: Volcanic to Dark Castle ──
  road(640,200,500,70,2,'#605058','#504048','#c8c0b8');

  // ── Small path markers (milestone stones along major roads) ──
  const milestones=[
    [420,400],[420,350],[420,250],[420,200],[380,150],
    [300,240],[500,250],[350,100],[490,100],
  ];
  for(const[mx,my]of milestones){
    pr(mx-1,my-1,3,3,'#787068');
    px(mx,my,'#908880');
  }
}
window._terrainReady=true;
