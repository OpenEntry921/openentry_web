import re,json,time,subprocess,hashlib
from pathlib import Path
from urllib.parse import urljoin,urlparse
base=Path(__file__).resolve().parents[1]; root=base/'archive/public-source'; queue=['/','/robots.txt','/sitemap.xml']; seen=set(); rows=[]
while queue:
 p=queue.pop(0)
 if p in seen: continue
 seen.add(p); url='https://openentry.io'+p
 dest=root/('index.html' if p=='/' else p.lstrip('/')+('/index.html' if not Path(p).suffix else ''))
 dest.parent.mkdir(parents=True,exist_ok=True)
 r=subprocess.run(['curl','-sS','-L','--max-time','30','-w','%{http_code}',url,'-o',str(dest)],capture_output=True,text=True)
 status=r.stdout; ok=r.returncode==0 and status=='200'
 row={'url':url,'path':str(dest.relative_to(root)),'http_status':status,'success':ok,'references':[]}; rows.append(row)
 if not ok:
  dest.unlink(missing_ok=True); continue
 data=dest.read_bytes(); row['bytes']=len(data); row['sha256']=hashlib.sha256(data).hexdigest()
 if dest.suffix in ['.html','.css','.js','.xml','.txt']:
  s=data.decode('utf-8',errors='replace')
  refs=set(re.findall(r'(?:src|href)=["\x27]([^"\x27]+)',s)+re.findall(r'url\(["\x27]?([^\)"\x27]+)',s)+re.findall(r'https://openentry\.io[^<\s"\x27`]*',s)+re.findall(r'["\x27`](/[^"\x27`\s<>]+)["\x27`]',s))
  for ref in sorted(refs):
   u=urlparse(urljoin(url,ref)); row['references'].append(ref)
   if u.hostname=='openentry.io' and not u.query and u.path and not u.path.startswith('//') and '${' not in u.path: queue.append(u.path)
 time.sleep(.25)
(base/'archive/manifest.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
print(json.dumps([{k:v for k,v in r.items() if k not in ['references','sha256']} for r in rows],indent=2))
