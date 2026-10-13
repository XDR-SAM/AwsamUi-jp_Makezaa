"""Archive public KOTA pages and their asset dependencies. No remote writes."""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urljoin, urlsplit, unquote
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib, html, json, re, time, xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent
RAW = ROOT / 'original'
ASSETS = ROOT / 'assets'
RAW.mkdir(exist_ok=True)
ASSETS.mkdir(exist_ok=True)
manifest = {}
failures = {}
TEXT = {'.html','.mjs','.js','.css','.json','.svg'}
URL = re.compile(r'https?://[^\x00-\x20<>"\x27`\\),]+')
REL = re.compile(r'["\x27`]((?:\./|\.\./)[^"\x27`\s]+\.(?:mjs|js|css|json|wasm)(?:\?[^"\x27`\s]*)?)["\x27`]')
HOSTS = {'framerusercontent.com', 'fonts.gstatic.com', 'fonts.googleapis.com', 'stream.mux.com', 'image.mux.com'}

def local_path(url):
    p=urlsplit(url)
    parts=[re.sub(r'[^A-Za-z0-9_.@-]', '_', unquote(x)) for x in p.path.split('/') if x]
    if not parts: parts=['index']
    if p.query:
        stem=Path(parts[-1])
        parts[-1]=stem.stem+'__'+hashlib.sha256(p.query.encode()).hexdigest()[:12]+stem.suffix
    return Path('assets') / p.netloc / Path(*parts)

def get(url):
    dest=ROOT/local_path(url)
    pristine=RAW/local_path(url)
    if dest.exists(): return url,(pristine if pristine.exists() else dest).read_bytes(),None
    for attempt in range(3):
        try:
            with urlopen(Request(url,headers={'User-Agent':'Mozilla/5.0','Accept':'*/*'}),timeout=90) as r:
                data=r.read()
            dest.parent.mkdir(parents=True,exist_ok=True)
            dest.write_bytes(data)
            return url,data,None
        except Exception as e:
            if attempt==2: return url,b'',str(e)
            time.sleep(attempt+1)

def refs(text,base):
    result=set()
    for m in re.finditer(r'new URL\(`([^`]+\.framercms)`,`(https://[^`]+)`\)\.href\.replace\(`/modules/`,`/cms/`\)',text):
        result.add(urljoin(m[2],m[1]).replace('/modules/','/cms/'))
    for match in URL.finditer(text):
        u=html.unescape(match.group(0)).rstrip(',;"\x27')
        p=urlsplit(u)
        ext=Path(p.path).suffix.lower()
        if p.netloc in HOSTS and '${' not in u and (ext or '/images/' in p.path or '/assets/' in p.path):
            if ext not in {'.map','.html'}: result.add(u)
    for m in REL.finditer(text):
        if 'node_modules/' not in m.group(1): result.add(urljoin(base,m.group(1)))
    return result

pages={}
for el in ET.fromstring((ROOT/'sitemap.xml').read_bytes()).iter():
    if el.tag.endswith('loc'):
        u=el.text
        p=urlsplit(u).path
        dest=RAW / ('index.html' if p=='/' else p.strip('/')+'/index.html')
        dest.parent.mkdir(parents=True,exist_ok=True)
        if p=='/': data=(ROOT/'source.html').read_bytes()
        elif dest.exists(): data=dest.read_bytes()
        else:
            with urlopen(Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=60) as r: data=r.read()
            dest.write_bytes(data)
        if p=='/': dest.write_bytes(data)
        pages[u]=dest
        print('PAGE',p,len(data),flush=True)

pending=set()
for u,dest in pages.items(): pending.update(refs(dest.read_text(encoding='utf-8'),u))
pending.update(json.loads((ROOT/'observed-assets.json').read_text()) if (ROOT/'observed-assets.json').exists() else [])
seen=set()
while pending:
    batch=pending-seen
    if not batch: break
    seen.update(batch)
    pending=set()
    print('BATCH',len(batch),'TOTAL',len(seen),flush=True)
    with ThreadPoolExecutor(max_workers=10) as pool:
        for f in as_completed([pool.submit(get,u) for u in batch]):
            u,data,err=f.result()
            if err:
                failures[u]=err
                print('FAILED',u,err,flush=True)
                continue
            manifest[u]={'path':local_path(u).as_posix(),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
            if Path(urlsplit(u).path).suffix.lower() in TEXT|{'.framercms'}:
                pending.update(refs(data.decode('utf-8',errors='replace'),u))
    (ROOT/'asset-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    (ROOT/'download-failures.json').write_text(json.dumps(failures,indent=2),encoding='utf-8')

# Rewrite references using original URL context. Each downloaded module retains
# its directory, so native relative ESM imports keep working.
def rewrite(text,base):
    def cms(m):
        u=urljoin(m[2],m[1]).replace('/modules/','/cms/')
        return 'new URL(`/'+manifest[u]['path']+'`,location.href).href' if u in manifest else m[0]
    text=re.sub(r'new URL\(`([^`]+\.framercms)`,`(https://[^`]+)`\)\.href\.replace\(`/modules/`,`/cms/`\)',cms,text)
    def replace(m):
        original=m.group(0)
        ending=re.search(r'(?:&quot;|&apos;|&#34;|&#x22;)+$',original)
        suffix=ending[0] if ending else ''
        u=html.unescape(original[:-len(suffix)] if suffix else original).rstrip(',;"\x27')
        if u not in manifest: return original
        import posixpath
        from os.path import relpath
        here=local_path(base).parent if urlsplit(base).netloc!='madebykota.com' else Path(urlsplit(base).path.strip('/')).parent
        if urlsplit(base).netloc=='madebykota.com':
            here=Path(urlsplit(base).path.strip('/'))
        target='/'+manifest[u]['path']
        return target+suffix
    return URL.sub(replace,text)

for u,item in manifest.items():
    dest=ROOT/item['path']
    if Path(urlsplit(u).path).suffix.lower() in TEXT:
        data=dest.read_text(encoding='utf-8')
        # Keep a pristine source so repeat captures cannot corrupt paths.
        backup=RAW/item['path']
        backup.parent.mkdir(parents=True,exist_ok=True)
        if not backup.exists(): backup.write_text(data,encoding='utf-8')
        else: data=backup.read_text(encoding='utf-8')
        dest.write_text(rewrite(data,u),encoding='utf-8')
for u,src in pages.items():
    p=urlsplit(u).path
    dest=ROOT/('index.html' if p=='/' else p.strip('/')+'/index.html')
    dest.parent.mkdir(parents=True,exist_ok=True)
    s=src.read_text(encoding='utf-8')
    s=re.sub(r'<script\b[^>]*src="https://events\.framer\.com/[^>]*>\s*</script>','',s)
    s=rewrite(s,u)
    asset_map={url:'/'+item['path'] for url,item in manifest.items() if Path(item['path']).suffix not in {'.js','.mjs'}}
    bridge='<script>window.__KOTA_ARCHIVE_URLS='+json.dumps(asset_map,separators=(',',':'))+';</script><script src="/asset-bridge.js"></script>'
    s=s.replace('<head>','<head>'+bridge,1)
    dest.write_text(s,encoding='utf-8')
report={'source':'https://madebykota.com/','capturedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'pages':list(pages),'assets':len(manifest),'assetBytes':sum(i['bytes'] for i in manifest.values()),'failures':failures}
(ROOT/'capture-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('DONE',json.dumps(report),flush=True)
