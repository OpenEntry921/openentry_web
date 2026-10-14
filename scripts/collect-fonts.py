from pathlib import Path
import re,json,hashlib,subprocess,time
base=Path(__file__).resolve().parents[1];root=base/'archive/fonts';root.mkdir(parents=True,exist_ok=True)
url='https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;450;500;550;600;650;700&family=IBM+Plex+Mono:wght@400;500&family=Noto+Sans+KR:wght@400;500;600;700&display=swap'
ua='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
subprocess.run(['curl','-fsS','-A',ua,'--max-time','30',url,'-o',str(root/'fonts.css')],check=True)
css=(root/'fonts.css').read_text();rows=[{'url':url,'path':'fonts.css','success':True,'usage':'Google Fonts response for Chrome user agent; all main pages'}]
for fonturl in sorted(set(re.findall(r'https://fonts.gstatic.com/[^)]+',css))):
 path=fonturl.removeprefix('https://fonts.gstatic.com/');dest=root/path;dest.parent.mkdir(parents=True,exist_ok=True)
 r=subprocess.run(['curl','-sS','--max-time','30','-w','%{http_code}',fonturl,'-o',str(dest)],capture_output=True,text=True)
 row={'url':fonturl,'path':path,'success':r.returncode==0 and r.stdout=='200','http_status':r.stdout,'usage':'fonts.css @font-face'}
 if row['success']:row.update(bytes=dest.stat().st_size,sha256=hashlib.sha256(dest.read_bytes()).hexdigest())
 else:dest.unlink(missing_ok=True)
 rows.append(row);time.sleep(.15)
rows[0].update(bytes=(root/'fonts.css').stat().st_size,sha256=hashlib.sha256((root/'fonts.css').read_bytes()).hexdigest())
(base/'archive/font-manifest.json').write_text(json.dumps(rows,indent=2)+'\n');print('font CSS + files',len(rows),'success',sum(x['success'] for x in rows))
if not all(x['success'] for x in rows):raise SystemExit(1)
