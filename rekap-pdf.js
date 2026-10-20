/* rekap-pdf.js - pembuat PDF ringan tanpa library (font Helvetica, WinAnsi).
   Dipakai Pengaturan > Rekapan bulanan. Jalan offline karena tidak memuat apa pun dari internet.
   API: RekapPDF.monthlyRecap(model) -> Uint8Array (isi file PDF). */
(function(root){'use strict';
const PW=595.28,PH=841.89,MX=40,TOP=40,BOT=52,CW=PW-2*MX;
/* Lebar glyph Helvetica / Helvetica-Bold per 1000 unit untuk kode WinAnsi 32..255 */
const WH=[278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,761,556,0,222,556,333,1000,556,556,333,1000,667,333,1000,0,611,0,0,222,222,333,333,350,556,1000,333,1000,500,333,944,0,500,667,278,333,556,556,556,556,260,556,333,737,370,556,584,333,737,333,400,584,333,333,333,556,537,278,333,333,365,556,834,834,834,611,667,667,667,667,667,667,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,500,556,556,556,556,278,278,278,278,556,556,556,556,556,556,556,584,611,556,556,556,556,500,556,500];
const WB=[278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584,761,556,0,278,556,500,1000,556,556,333,1000,667,333,1000,0,611,0,0,278,278,500,500,350,556,1000,333,1000,556,333,944,0,500,667,278,333,556,556,556,556,280,556,333,737,370,556,584,333,737,333,400,584,333,333,333,611,556,278,333,333,365,556,834,834,834,611,722,722,722,722,722,722,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,556,556,556,556,556,278,278,278,278,611,611,611,611,611,611,611,584,611,611,611,611,611,556,611,556];
const SPECIAL={0x20AC:0x80,0x201A:0x82,0x0192:0x83,0x201E:0x84,0x2026:0x85,0x2020:0x86,0x2021:0x87,0x02C6:0x88,0x2030:0x89,0x0160:0x8A,0x2039:0x8B,0x0152:0x8C,0x017D:0x8E,0x2018:0x91,0x2019:0x92,0x201C:0x93,0x201D:0x94,0x2022:0x95,0x2013:0x96,0x2014:0x97,0x02DC:0x98,0x2122:0x99,0x0161:0x9A,0x203A:0x9B,0x0153:0x9C,0x017E:0x9E,0x0178:0x9F};
const MONTHS=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const n=v=>{const s=(+v).toFixed(2);return s.replace(/\.?0+$/,'')||'0'};
const rgb=h=>{h=String(h).replace('#','');return [0,2,4].map(i=>(parseInt(h.substr(i,2),16)/255).toFixed(3)).join(' ')};
const group=x=>String(Math.round(Math.abs(x))).replace(/\B(?=(\d{3})+(?!\d))/g,'.');
const rp=v=>(v<0&&Math.round(v)!==0?'-':'')+'Rp '+group(v);
const fmtDate=s=>{const m=String(s||'').match(/^(\d{4})-(\d{2})-(\d{2})/);return m?`${m[3]} ${MONTHS[+m[2]-1]||m[2]} ${m[1]}`:String(s||'-')};
function codes(str){
  const out=[];
  const s=String(str==null?'':str).replace(/\u2212/g,'-').replace(/\u2192/g,'->').replace(/[\u00A0\u2009\u202F]/g,' ');
  for(const ch of s){
    let c=ch.codePointAt(0);
    if(c<32||(c>=127&&c<=159))c=32;
    else if(c>255){if(SPECIAL[c])c=SPECIAL[c];else if(c>=0x2190)continue;else c=63}
    out.push(c)}
  return out}
const hex=s=>codes(s).map(c=>(c<16?'0':'')+c.toString(16)).join('');
function Doc(meta){this.meta=meta||{};this.pages=[];this.newPage()}
Doc.prototype={
  newPage(){this.ops=[];this.pages.push(this.ops);this.y=TOP},
  ensure(h){if(this.y+h>PH-BOT)this.newPage()},
  width(s,size,bold){const W=bold?WB:WH;let w=0;for(const c of codes(s))w+=W[c-32]||0;return w*size/1000},
  text(x,y,s,o){o=Object.assign({size:9,bold:false,color:'#1e2924',align:'l'},o);const w=this.width(s,o.size,o.bold),px=o.align==='r'?x-w:o.align==='c'?x-w/2:x;
    this.ops.push(`BT /${o.bold?'F2':'F1'} ${n(o.size)} Tf ${rgb(o.color)} rg ${n(px)} ${n(PH-y)} Td <${hex(s)}> Tj ET`)},
  rect(x,y,w,h,fill,stroke){this.ops.push(`${fill?rgb(fill)+' rg ':''}${stroke?rgb(stroke)+' RG 0.6 w ':''}${n(x)} ${n(PH-y-h)} ${n(w)} ${n(h)} re ${fill&&stroke?'B':fill?'f':'S'}`)},
  line(x1,y1,x2,y2,color,w){this.ops.push(`${rgb(color||'#dfe6e1')} RG ${n(w||.6)} w ${n(x1)} ${n(PH-y1)} m ${n(x2)} ${n(PH-y2)} l S`)},
  wrap(s,maxW,size,bold,maxLines){
    const words=String(s==null?'':s).replace(/\s+/g,' ').trim().split(' ').filter(Boolean),lines=[];let cur='';
    const fits=t=>this.width(t,size,bold)<=maxW;
    const breakLong=word=>{let part='';for(const ch of Array.from(word)){if(part&&!fits(part+ch)){lines.push(part);part=ch}else part+=ch}return part};
    for(const w of words){const t=cur?cur+' '+w:w;if(fits(t)){cur=t;continue}if(cur){lines.push(cur);cur=''}cur=fits(w)?w:breakLong(w)}
    if(cur)lines.push(cur);if(!lines.length)lines.push('');
    if(maxLines&&lines.length>maxLines){const keep=lines.slice(0,maxLines);let last=keep[maxLines-1];while(last&&!fits(last+'\u2026'))last=last.slice(0,-1);keep[maxLines-1]=last.trimEnd()+'\u2026';return keep}
    return lines},
  section(title,sub){this.ensure(56);this.y+=12;this.text(MX,this.y+11,title,{size:11.5,bold:true,color:'#176b50'});if(sub)this.text(PW-MX,this.y+11,sub,{size:8,color:'#728079',align:'r'});this.y+=17;this.line(MX,this.y,PW-MX,this.y,'#cfdcd2',.8);this.y+=8},
  note(s,o){o=Object.assign({size:8,color:'#728079',bold:false},o);this.ensure(16);this.text(MX,this.y+o.size+2,s,o);this.y+=o.size+8},
  table(cols,rows,o){
    o=Object.assign({size:8,pad:4,maxLines:2,zebra:true},o);
    const tw=cols.reduce((a,c)=>a+c.w,0),lh=o.size*1.22,base=o.pad+o.size*.86,hh=lh+o.pad*2;
    const cell=c=>c&&typeof c==='object'?c:{t:c};
    const header=()=>{this.rect(MX,this.y,tw,hh,'#e7f1eb');let x=MX;cols.forEach(c=>{this.text(c.a==='r'?x+c.w-o.pad:x+o.pad,this.y+base,c.h,{size:o.size,bold:true,color:'#4f6a5d',align:c.a==='r'?'r':'l'});x+=c.w});this.y+=hh};
    const layout=r=>{const cells=cols.map((c,i)=>{const k=cell(r[i]),bold=!!(k.bold||r.total);return {k,bold,lines:this.wrap(k.t,c.w-o.pad*2,o.size,bold,o.maxLines)}});return {cells,h:Math.max(...cells.map(c=>c.lines.length))*lh+o.pad*2}};
    const laid=rows.map(r=>Object.assign(layout(r),{total:!!r.total}));
    this.ensure(hh+(laid[0]?laid[0].h:0));header();
    laid.forEach((r,idx)=>{
      if(this.y+r.h>PH-BOT){this.newPage();header()}
      if(r.total){this.rect(MX,this.y,tw,r.h,'#eef3ef');this.line(MX,this.y,MX+tw,this.y,'#9db7a8',.8)}
      else if(o.zebra&&idx%2===1)this.rect(MX,this.y,tw,r.h,'#f8faf8');
      let x=MX;
      r.cells.forEach((c,i)=>{const col=cols[i];c.lines.forEach((ln,li)=>this.text(col.a==='r'?x+col.w-o.pad:x+o.pad,this.y+base+li*lh,ln,{size:o.size,bold:c.bold,color:c.k.color||'#1e2924',align:col.a==='r'?'r':'l'}));x+=col.w});
      this.line(MX,this.y+r.h,MX+tw,this.y+r.h,'#e6ebe7',.5);this.y+=r.h});
    this.y+=4},
  build(){
    const total=this.pages.length;
    this.pages.forEach((ops,i)=>{const keep=this.ops;this.ops=ops;
      this.line(MX,PH-40,PW-MX,PH-40,'#dfe6e1',.6);
      this.text(MX,PH-28,this.meta.footer||'',{size:7.5,color:'#8a968f'});
      this.text(PW-MX,PH-28,`Halaman ${i+1} dari ${total}`,{size:7.5,color:'#8a968f',align:'r'});
      this.ops=keep});
    const objs=[],kids=[];
    objs[1]='<< /Type /Catalog /Pages 2 0 R >>';
    objs[3]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    objs[4]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
    const title='<FEFF'+Array.from(String(this.meta.title||'Rekapan')).map(ch=>('0000'+ch.charCodeAt(0).toString(16)).slice(-4)).join('')+'>';
    objs[5]=`<< /Title ${title} /Producer (Manajemen Uangku Uangmu) >>`;
    this.pages.forEach((ops,i)=>{const pid=6+i*2,cid=pid+1,data=ops.join('\n');kids.push(pid+' 0 R');
      objs[pid]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${cid} 0 R >>`;
      objs[cid]=`<< /Length ${data.length} >>\nstream\n${data}\nendstream`});
    objs[2]=`<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${total} >>`;
    const N=objs.length-1;let out='%PDF-1.4\n';const off=[];
    for(let i=1;i<=N;i++){off[i]=out.length;out+=`${i} 0 obj\n${objs[i]}\nendobj\n`}
    const xref=out.length;out+=`xref\n0 ${N+1}\n0000000000 65535 f \n`;
    for(let i=1;i<=N;i++)out+=String(off[i]).padStart(10,'0')+' 00000 n \n';
    out+=`trailer\n<< /Size ${N+1} /Root 1 0 R /Info 5 0 R >>\nstartxref\n${xref}\n%%EOF`;
    const bytes=new Uint8Array(out.length);for(let i=0;i<out.length;i++)bytes[i]=out.charCodeAt(i)&255;return bytes}
};

const IN_FLOWS=['Pemasukan','Transfer Masuk'];
const GREEN='#176b50',RED='#b4544c',INK='#172722';
const txRows=list=>list.map(t=>{const inflow=IN_FLOWS.includes(t.flow);
  return [fmtDate(t.date),t.account||'-',t.note||'-',[t.category,t.detail].filter(Boolean).join(' / ')||'-',t.flow||'-',{t:(inflow?'+ ':'- ')+rp(Math.abs(t.amount||0)),color:t.flow==='Pengeluaran'?RED:inflow?GREEN:'#1e2924'}]});
const TX_COLS=[{h:'Tanggal',w:56},{h:'Akun',w:55},{h:'Keterangan',w:145},{h:'Kategori / Subkategori',w:105},{h:'Jenis',w:64},{h:'Jumlah',w:90,a:'r'}];
const colorOf=v=>v<0?RED:v>0?GREEN:'#1e2924';

function monthlyRecap(m){
  const d=new Doc({title:'Rekapan Keuangan '+m.monthLabel,footer:'Manajemen Uangku Uangmu \u00B7 Rekapan '+m.monthLabel});
  d.rect(0,0,PW,92,'#1b3d30');
  d.text(MX,38,'REKAPAN KEUANGAN BULANAN',{size:8,bold:true,color:'#9fc0ad'});
  d.text(MX,68,m.monthLabel,{size:24,bold:true,color:'#ffffff'});
  d.text(PW-MX,38,'Manajemen Uangku Uangmu',{size:9.5,bold:true,color:'#ffffff',align:'r'});
  d.text(PW-MX,52,'Dibuat '+m.generated,{size:8,color:'#bdd0c3',align:'r'});
  d.text(PW-MX,66,'Pribadi \u00B7 Rosario \u00B7 Kos',{size:8,color:'#bdd0c3',align:'r'});
  d.y=92+18;
  const S=m.summary,tot={in:0,out:0,bal:0};S.forEach(r=>{tot.in+=r.in;tot.out+=r.out;tot.bal+=r.balance});
  const net=tot.in-tot.out,gap=10,bw=(CW-gap*3)/4;
  [['Total pemasukan',rp(tot.in),GREEN],['Total pengeluaran',rp(tot.out),RED],['Selisih bulan ini',(net>0?'+':'')+rp(net),colorOf(net)],['Saldo akhir gabungan',rp(tot.bal),INK]].forEach((b,i)=>{
    const x=MX+i*(bw+gap);d.rect(x,d.y,bw,52,'#f7f9f7','#e2e8e3');d.text(x+10,d.y+18,b[0],{size:7.5,color:'#728079'});d.text(x+10,d.y+39,b[1],{size:11.5,bold:true,color:b[2]})});
  d.y+=52;

  d.section('Ringkasan keseluruhan','Pemasukan dan pengeluaran sepanjang bulan; saldo per akhir bulan');
  d.table([{h:'Sumber',w:130},{h:'Pemasukan',w:95,a:'r'},{h:'Pengeluaran',w:95,a:'r'},{h:'Selisih',w:95,a:'r'},{h:'Saldo akhir',w:100,a:'r'}],
    [...S.map(r=>[r.name,{t:rp(r.in),color:GREEN},{t:rp(r.out),color:RED},{t:rp(r.in-r.out),color:colorOf(r.in-r.out)},rp(r.balance)]),
     Object.assign(['Total',rp(tot.in),rp(tot.out),rp(net),rp(tot.bal)],{total:true})],{size:8.5});

  d.section('Saldo per akun','Manajemen Uangku');
  const A=m.accounts,at={o:0,i:0,u:0,c:0};A.forEach(a=>{at.o+=a.opening;at.i+=a.in;at.u+=a.out;at.c+=a.closing});
  d.table([{h:'Akun',w:135},{h:'Saldo awal',w:95,a:'r'},{h:'Masuk',w:95,a:'r'},{h:'Keluar',w:95,a:'r'},{h:'Saldo akhir',w:95,a:'r'}],
    [...A.map(a=>[a.name,rp(a.opening),{t:rp(a.in),color:a.in?GREEN:'#1e2924'},{t:rp(a.out),color:a.out?RED:'#1e2924'},{t:rp(a.closing),bold:true}]),
     Object.assign(['Total',rp(at.o),rp(at.i),rp(at.u),rp(at.c)],{total:true})],{size:8.5});
  d.note('Masuk = pemasukan + transfer masuk; keluar = pengeluaran + transfer keluar.');

  d.section('Pengeluaran per kategori','Manajemen Uangku');
  if(!m.categories.length)d.note('Tidak ada pengeluaran pada bulan ini.');
  else{const ct={b:0,s:0};m.categories.forEach(c=>{ct.b+=c.budget;ct.s+=c.spent});
    d.table([{h:'Kategori',w:165},{h:'Anggaran',w:100,a:'r'},{h:'Pengeluaran',w:100,a:'r'},{h:'Sisa anggaran',w:100,a:'r'},{h:'Terpakai',w:50,a:'r'}],
      [...m.categories.map(c=>{const has=c.budget>0,left=c.budget-c.spent;return [c.name,has?rp(c.budget):'\u2014',rp(c.spent),has?{t:rp(left),color:left<0?RED:'#1e2924'}:'\u2014',has?Math.round(c.spent/c.budget*100)+'%':'\u2014']}),
       Object.assign(['Total',ct.b?rp(ct.b):'\u2014',rp(ct.s),ct.b?rp(ct.b-ct.s):'\u2014',ct.b?Math.round(ct.s/ct.b*100)+'%':'\u2014'],{total:true})],{size:8.5})}

  const txBlock=(title,sub,list,empty)=>{d.section(title,sub);
    if(!list.length){d.note(empty);return}
    d.table(TX_COLS,txRows(list),{size:7.5});
    const i=list.filter(t=>IN_FLOWS.includes(t.flow)).reduce((a,t)=>a+(t.amount||0),0),u=list.filter(t=>!IN_FLOWS.includes(t.flow)).reduce((a,t)=>a+(t.amount||0),0);
    d.note(`${list.length} transaksi \u00B7 masuk ${rp(i)} \u00B7 keluar ${rp(u)} \u00B7 neto ${rp(i-u)}`,{bold:true,color:'#4f6a5d'})};
  txBlock('Transaksi Manajemen Uangku',m.personalTx.length+' transaksi',m.personalTx,'Tidak ada transaksi pribadi pada bulan ini.');
  txBlock('Transaksi Rosario (Kantorku)',m.rosarioTx.length+' transaksi',m.rosarioTx,'Tidak ada transaksi Rosario pada bulan ini.');

  d.section('Kos \u2014 pembayaran masuk',m.kos.payments.length+' pembayaran');
  if(!m.kos.payments.length)d.note('Tidak ada pembayaran Kos pada bulan ini.');
  else{d.table([{h:'Tanggal',w:62},{h:'Penghuni',w:170},{h:'Kamar',w:63},{h:'Metode',w:100},{h:'Jumlah',w:120,a:'r'}],
      m.kos.payments.map(p=>[fmtDate(p.date),p.tenant||'-',p.room||'-',p.method||'-',{t:'+ '+rp(p.amount),color:GREEN}]),{size:7.5});
    d.note('Total pembayaran: '+rp(m.kos.payments.reduce((a,p)=>a+p.amount,0)),{bold:true,color:'#4f6a5d'})}
  d.section('Kos \u2014 pengeluaran',m.kos.expenses.length+' pengeluaran');
  if(!m.kos.expenses.length)d.note('Tidak ada pengeluaran Kos pada bulan ini.');
  else{d.table([{h:'Tanggal',w:62},{h:'Kategori',w:110},{h:'Keterangan',w:223},{h:'Jumlah',w:120,a:'r'}],
      m.kos.expenses.map(x=>[fmtDate(x.date),x.category||'-',x.desc||'-',{t:'- '+rp(x.amount),color:RED}]),{size:7.5});
    d.note('Total pengeluaran: '+rp(m.kos.expenses.reduce((a,x)=>a+x.amount,0)),{bold:true,color:'#4f6a5d'})}
  return d.build()}

const api={monthlyRecap,Doc,rp};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.RekapPDF=api;
})(typeof window!=='undefined'?window:globalThis);
