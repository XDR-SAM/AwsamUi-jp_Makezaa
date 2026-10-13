from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
import json, re

ROOT=Path(__file__).resolve().parent
report=json.loads((ROOT/'capture-report.json').read_text(encoding='utf-8'))
missing=[]; embedded=[]; executable=[]
class Check(HTMLParser):
    activeScript=False
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        for key in ('src','poster','href','srcset'):
            value=a.get(key,'')
            if value.startswith('data:image/') or value.startswith('data:video/'): embedded.append(value[:60])
            for resource in re.findall(r'/assets/[^\s,"\x27]+',value):
                if not (ROOT/urlsplit(resource).path.lstrip('/')).is_file(): missing.append((self.page,resource))
        if tag=='script': self.activeScript=not a.get('src') and a.get('type','') in {'','module','text/javascript','application/javascript'}
    def handle_data(self,data):
        if self.activeScript and data.strip(): executable.append(self.page)
    def handle_endtag(self,tag):
        if tag=='script': self.activeScript=False

for url in report['pages']:
    route=urlsplit(url).path
    p=ROOT/('index.html' if route=='/' else route.strip('/')+'/index.html')
    check=Check(); check.page=route; check.feed(p.read_text(encoding='utf-8'))
for p in (ROOT/'assets').rglob('*.mjs'):
    for dependency in re.findall(r'(?:from|import\()\s*["\x27`]((?:\./|\.\./)[^"\x27`]+\.mjs)["\x27`]',p.read_text(encoding='utf-8')):
        if not (p.parent/dependency).is_file(): missing.append((str(p.relative_to(ROOT)),dependency))
result={'pagesChecked':len(report['pages']),'missingLocalReferences':missing,'embeddedMedia':len(embedded),'inlineExecutableScriptTags':len(executable),'downloadedAssets':len(json.loads((ROOT/'asset-manifest.json').read_text()))}
(ROOT/'validation-report.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result,indent=2))
if missing or embedded or executable: raise SystemExit(1)
