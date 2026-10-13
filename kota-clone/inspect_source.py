from pathlib import Path
from html.parser import HTMLParser
import re

class Inspect(HTMLParser):
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'script': print('SCRIPT',a,)
        if tag == 'link': print('LINK',a)

s=Path(__file__).with_name('source.html').read_text(encoding='utf-8')
Inspect().feed(s)
print('ALL HOSTS', sorted(set(re.findall(r'https?://([^/\s"<>]+)',s))))
print('END',s[-12000:])
