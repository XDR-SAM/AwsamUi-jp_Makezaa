"""Move the captured design's media into Next's public asset library."""
from pathlib import Path
import json, shutil

ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'kota-clone/asset-manifest.json').read_text(encoding='utf-8'))
extensions={'.png','.jpg','.jpeg','.webp','.gif','.svg','.avif','.mp4','.webm','.woff','.woff2','.ttf'}
assets={}
for url,item in manifest.items():
    source=ROOT/'kota-clone'/item['path']
    if source.suffix.lower() not in extensions: continue
    relative=Path(item['path']).relative_to('assets')
    dest=ROOT/'public/studio'/relative
    dest.parent.mkdir(parents=True,exist_ok=True)
    if not dest.exists(): shutil.copy2(source,dest)
    assets[url]='/studio/'+relative.as_posix()
(ROOT/'public/studio/asset-provenance.json').write_text(json.dumps({'source':'https://madebykota.com/','assets':assets},indent=2),encoding='utf-8')
def media(fragment,preferred=''):
    matches=[(u,p) for u,p in assets.items() if fragment in u and (not preferred or preferred in u)]
    if not matches: raise ValueError(fragment)
    return matches[0][1]
named={
 'heroBackground':'/studio/makezaa/hero-background.webp',
 'heroFilmPoster':'/studio/makezaa/hero-video-poster.webp',
 'heroFilm':'/studio/makezaa/hero-preview.mp4',
 'reel':'/studio/makezaa/studio-reel.mp4',
 'serviceWordpressFilm':'/studio/makezaa/service-wordpress-preview.mp4',
 'serviceWordpressPoster':'/studio/makezaa/service-wordpress-poster.webp',
 'serviceShopifyFilm':'/studio/makezaa/service-shopify-preview.mp4',
 'serviceShopifyPoster':'/studio/makezaa/service-shopify-poster.webp',
 'serviceWeb':media('BP0200Otu','1080p'),
 'serviceCommerce':media('SJ2mU2I','1080p'),
 'serviceMotion':media('jeHaeZGX','1080p'),
 'processFilm':'/studio/makezaa/laptop-preview-desktop.mp4',
 'processFilmPoster':'/studio/makezaa/laptop-poster-desktop.webp',
 'footerFilm':'/studio/makezaa/laptop-preview-mobile.mp4',
 'footerFilmPoster':'/studio/makezaa/laptop-poster-mobile.webp',
 'chromeMask':media('7XHsXml'),
 'chromeFallback':media('sfiqWot'),
 'projectVisuals':[media(f,'scale-down-to=1024') for f in ['yptcMoj','IUwksVC','Onf67uB','0GvsMey','0dyhnsQN']],
 'loaderImages':[media(f,'scale-down-to=1024') for f in ['j5qfcqTf','9kqEJRK','Pcgs4wY','PBmTjMm','pvrT8Ty','3heQiYts','lq0qhgT','wxi2R8j']],
 'loaderMobileImages':[media(f) for f in ['wmgcUTv','5qIWwG2','hFFMmA1','hMvDEVn','Suq6eTp','NkopGPi','IP1WI7z','BVDHmFl']],
}
(ROOT/'lib/studio-assets.ts').write_text('// Local media, served by Next.js. The Framer app/router is not embedded.\nexport const studioAssets = '+json.dumps(named,indent=2)+' as const;\n',encoding='utf-8')
print('Copied',len(assets),'media assets; generated named references.')
