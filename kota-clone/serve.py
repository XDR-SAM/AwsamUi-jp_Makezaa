"""Serve only this archive on loopback, with MIME types and video range support."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit, unquote, parse_qs
import re, os

ROOT=Path(__file__).resolve().parent

class Handler(SimpleHTTPRequestHandler):
    extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript','.woff2':'font/woff2','.mp4':'video/mp4'}
    def __init__(self,*a,**kw): super().__init__(*a,directory=str(ROOT),**kw)
    def do_GET(self):
        path=self.translate_path(self.path)
        p=Path(path)
        if p.is_dir() and (p/'index.html').exists():
            # No trailing slash redirect: Framer's original relative paths expect
            # the exact published URL, e.g. /products rather than /products/.
            self.path=urlsplit(self.path).path.rstrip('/')+'/index.html'
            path=self.translate_path(self.path)
            p=Path(path)
        if not p.exists() and not p.suffix:
            self.path='/index.html'
            path=str(ROOT/'index.html')
            p=Path(path)
        # Framer CMS uses a query parameter with multiple byte ranges and
        # expects their concatenation as a normal 200 response.
        cms_range=parse_qs(urlsplit(self.path).query).get('range',[''])[0]
        if p.is_file() and p.suffix=='.framercms' and cms_range:
            ranges=[]
            for part in cms_range.split(','):
                match=re.fullmatch(r'(\d+)-(\d+)',part)
                if not match: self.send_error(400); return
                start,end=map(int,match.groups())
                if start>end or end>=p.stat().st_size: self.send_error(416); return
                ranges.append((start,end))
            data=bytearray()
            with p.open('rb') as f:
                for start,end in ranges:
                    f.seek(start); data.extend(f.read(end-start+1))
            self.send_response(200)
            self.send_header('Content-Type','application/octet-stream')
            self.send_header('Content-Length',str(len(data)))
            self.end_headers(); self.wfile.write(data); return
        range_header=self.headers.get('Range')
        if p.is_file() and range_header:
            m=re.fullmatch(r'bytes=(\d*)-(\d*)',range_header)
            if m:
                size=p.stat().st_size
                start=int(m[1] or 0); end=min(int(m[2] or size-1),size-1)
                if start>=size: self.send_error(416); return
                self.send_response(206)
                self.send_header('Content-Type',self.guess_type(str(p)))
                self.send_header('Content-Range',f'bytes {start}-{end}/{size}')
                self.send_header('Content-Length',str(end-start+1))
                self.send_header('Accept-Ranges','bytes')
                self.end_headers()
                with p.open('rb') as f:
                    f.seek(start); remaining=end-start+1
                    try:
                        while remaining:
                            chunk=f.read(min(1024*1024,remaining))
                            if not chunk: break
                            self.wfile.write(chunk); remaining-=len(chunk)
                    except (BrokenPipeError,ConnectionResetError,ConnectionAbortedError): pass
                return
        try: super().do_GET()
        except (BrokenPipeError,ConnectionResetError,ConnectionAbortedError): pass

if __name__=='__main__':
    print('KOTA local archive: http://127.0.0.1:8765',flush=True)
    print('Press Ctrl+C to stop.',flush=True)
    ThreadingHTTPServer(('127.0.0.1',8765),Handler).serve_forever()
