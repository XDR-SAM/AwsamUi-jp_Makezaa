"""Read-only checks of the actual HTTP output (local production or live site)."""
import json
import sys
from pathlib import Path
from urllib.parse import urlsplit
from xml.etree import ElementTree
import requests
from bs4 import BeautifulSoup

base = sys.argv[1].rstrip('/') if len(sys.argv) > 1 else 'http://localhost:3000'
session = requests.Session()
session.headers['User-Agent'] = 'Makezaa-SEO-Verification/1.0'
sitemap = session.get(base + '/sitemap.xml', timeout=30)
sitemap.raise_for_status()
root = ElementTree.fromstring(sitemap.text)
urls = [node.text for node in root.findall('{*}url/{*}loc')]
assert len(urls) == len(set(urls))
assert all(url.startswith('https://www.makezaa.com/') for url in urls)
assert not any('/admin' in url or '/todos' in url or '/about' in url or '/services' in url for url in urls)
results = []
for url in urls:
    path = urlsplit(url).path
    page = session.get(base + path, timeout=30)
    assert page.status_code == 200, (path, page.status_code)
    soup = BeautifulSoup(page.text, 'html.parser')
    assert soup.find('link', rel='canonical')['href'].rstrip('/') == url.rstrip('/'), path
    assert soup.find('meta', attrs={'name': 'description'})['content'].strip(), path
    robots = soup.find('meta', attrs={'name': 'robots'})
    assert robots and 'noindex' not in robots['content'], path
    assert soup.find('meta', property='og:url')['content'].rstrip('/') == url.rstrip('/'), path
    assert soup.find('meta', property='og:image:width')['content'] == '1200', path
    assert soup.find('meta', attrs={'name': 'twitter:card'})['content'] == 'summary_large_image', path
    assert len(soup.find_all('h1')) == 1, path
    schemas = [json.loads(script.string) for script in soup.find_all('script', type='application/ld+json')]
    if path.startswith('/blog/'):
        assert any(item.get('@type') == 'BlogPosting' for schema in schemas for item in schema.get('@graph', [])), path
        assert soup.find('time', attrs={'datetime': True}), path
    if path.startswith('/projects/'):
        assert any(item.get('@type') == 'CreativeWork' for schema in schemas for item in schema.get('@graph', [])), path
    image = next(tag['content'] for tag in soup.find_all('meta', property='og:image') if '/og/' in tag['content'])
    preview = session.get(base + urlsplit(image).path, timeout=45)
    assert preview.status_code == 200 and preview.headers['Content-Type'].startswith('image/png'), (path, preview.status_code)
    assert int.from_bytes(preview.content[16:20], 'big') == 1200
    assert int.from_bytes(preview.content[20:24], 'big') == 630
    if path == '/':
        Path('artifacts').mkdir(exist_ok=True)
        Path('artifacts/makezaa-social-preview.png').write_bytes(preview.content)
    results.append({'path': path, 'title': soup.title.text, 'status': page.status_code, 'preview': '1200x630 PNG'})
for path in ['/admin/login', '/admin/forgot-password', '/admin', '/todos', '/api/mcp', '/.well-known/oauth-authorization-server']:
    page = session.get(base + path, timeout=30, allow_redirects=False)
    assert 'noindex' in page.headers.get('X-Robots-Tag', ''), (path, dict(page.headers))
    if path.startswith('/admin/') and page.status_code == 200:
        soup = BeautifulSoup(page.text, 'html.parser')
        assert 'noindex' in soup.find('meta', attrs={'name': 'robots'})['content']
        assert not soup.find('script', type='application/ld+json')
for path in ['/blog/makezaa-seo-nonexistent', '/projects/makezaa-seo-nonexistent', '/og/blog/makezaa-seo-nonexistent']:
    page = session.get(base + path, timeout=30)
    assert page.status_code == 404, (path, page.status_code)
robots = session.get(base + '/robots.txt', timeout=30).text
assert 'Disallow: /_next/' not in robots
assert 'Sitemap: https://www.makezaa.com/sitemap.xml' in robots
assert 'OAI-SearchBot' in robots
for path, target in [('/about', '/#about'), ('/services', '/#features'), ('/book-meeting', '/#book-meeting')]:
    page = session.get(base + path, timeout=30, allow_redirects=False)
    assert page.status_code in (301, 308), (path, page.status_code)
    assert page.headers['Location'].endswith(target), (path, page.headers.get('Location'))
print(json.dumps({'base': base, 'public_pages_checked': len(results), 'pages': results, 'private_headers': 'passed', 'missing_content': '404'}, indent=2))
