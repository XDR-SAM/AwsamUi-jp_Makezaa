from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlsplit
import json

ROOT=Path(__file__).resolve().parent
report=json.loads((ROOT/'capture-report.json').read_text())
for url in report['pages']:
    route=urlsplit(url).path
    with urlopen('http://127.0.0.1:8765'+route,timeout=20) as r:
        assert r.status==200 and b'<html' in r.read(),route
cms=next((ROOT/'assets/framerusercontent.com/cms').rglob('*indexes*.framercms'))
route='/'+cms.relative_to(ROOT).as_posix()
with urlopen('http://127.0.0.1:8765'+route+'?range=0-31,64-95',timeout=10) as r:
    source=cms.read_bytes()
    assert r.status==200 and r.read()==source[:32]+source[64:96]
video=next((ROOT/'assets/stream.mux.com').rglob('*.mp4'))
route='/'+video.relative_to(ROOT).as_posix()
with urlopen(Request('http://127.0.0.1:8765'+route,headers={'Range':'bytes=0-127'}),timeout=10) as r:
    assert r.status==206 and r.read()==video.read_bytes()[:128]
result={'pagesResponding':len(report['pages']),'cmsMultipleRanges':'passed','videoByteRanges':'passed'}
(ROOT/'server-validation.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result,indent=2))
