"""Extract the published inline CSS/scripts into separate local asset files."""
from pathlib import Path
import html, hashlib, json, re

ROOT=Path(__file__).resolve().parent
styles=ROOT/'assets/styles'; scripts=ROOT/'assets/scripts'
styles.mkdir(parents=True,exist_ok=True); scripts.mkdir(parents=True,exist_ok=True)
manifest=json.loads((ROOT/'asset-manifest.json').read_text(encoding='utf-8'))
asset_map={url:'/'+item['path'] for url,item in manifest.items() if Path(item['path']).suffix not in {'.js','.mjs'}}
(scripts/'url-map.js').write_text('window.__KOTA_ARCHIVE_URLS='+json.dumps(asset_map,separators=(',',':'))+';',encoding='utf-8')
(scripts/'asset-bridge.js').write_bytes((ROOT/'asset-bridge.js').read_bytes())

report=json.loads((ROOT/'capture-report.json').read_text(encoding='utf-8'))
counts={'styles':set(),'scripts':set()}
for url in report['pages']:
    from urllib.parse import urlsplit
    route=urlsplit(url).path
    dest=ROOT/('index.html' if route=='/' else route.strip('/')+'/index.html')
    source=dest.read_text(encoding='utf-8')
    source=re.sub(r'<script>window\.__KOTA_ARCHIVE_URLS=[\s\S]*?</script><script src="/asset-bridge.js"></script>',
        '<script src="/assets/scripts/url-map.js"></script><script src="/assets/scripts/asset-bridge.js"></script>',source)
    def css(m):
        attrs,content=m.groups()
        name=hashlib.sha256(content.encode()).hexdigest()[:16]+'.css'
        (styles/name).write_text(content,encoding='utf-8')
        counts['styles'].add(name)
        return '<link rel="stylesheet" data-kota-style href="/assets/styles/'+name+'"'+attrs+'>'
    source=re.sub(r'<style\b([^>]*)>([\s\S]*?)</style>',css,source,flags=re.I)
    def js(m):
        attrs,content=m.groups()
        if re.search(r'\bsrc\s*=',attrs) or not content.strip(): return m[0]
        kind=re.search(r'\btype\s*=\s*["\x27]([^"\x27]+)',attrs)
        if kind and kind[1] not in {'module','text/javascript','application/javascript'}: return m[0]
        name=hashlib.sha256(content.encode()).hexdigest()[:16]+'.js'
        (scripts/name).write_text(content,encoding='utf-8')
        counts['scripts'].add(name)
        return '<script'+attrs+' src="/assets/scripts/'+name+'"></script>'
    source=re.sub(r'<script\b([^>]*)>([\s\S]*?)</script>',js,source,flags=re.I)
    source=re.sub(r'(data-framer-bundle="main"[^>]*src=")[^"]+',r'\1/assets/scripts/runtime-entry.mjs',source)
    dest.write_text(source,encoding='utf-8')
print('Separated CSS:',len(counts['styles']),'Separated JavaScript:',len(counts['scripts']))
report['packaging']='HTML pages with separate assets; no base64 media embedding'
report['extractedStylesheets']=len(counts['styles']); report['extractedScripts']=len(counts['scripts'])
(ROOT/'capture-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
