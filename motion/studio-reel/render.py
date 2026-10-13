"""Retexture the captured reel's project planes without replacing its motion.

The original frame count, scene cuts, backgrounds and introductory perspective
are retained. Three introductory planes are tracked with SIFT/RANSAC; subsequent
website viewport replacements follow the reference's measured scroll vectors.
Creavia and Aurea remain as the two permitted reference visuals in the full reel.
"""
from pathlib import Path
import argparse, json, sys, subprocess
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT/'artifacts/studio-motion/tools'))
import cv2, numpy as np, imageio_ffmpeg
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
OUT = ROOT/'public/studio/makezaa'
REF = ROOT/'public/studio/stream.mux.com'
SOURCES = {
 'hero': REF/'921N3eqnEGvaG6c735ET923SDF5OMbSeYls00HTIQ2Cg/1080p.mp4',
 'reel': REF/'NK902P1FV71RSNwUOJxq11aMWzCN6GjiI89kynjcRQyc/1080p.mp4'
}
PROJECTS = json.loads((HERE/'portfolio.json').read_text())
IMAGES = [cv2.imread(str(HERE/p['file'])) for p in PROJECTS]
if any(image is None for image in IMAGES): raise RuntimeError('Missing portfolio image')
SIFT = cv2.SIFT_create(nfeatures=1400)
MATCHER = cv2.BFMatcher()
TEMPLATE_DEFS = [
 ('agency',0,[600,315,720,451],0),
 ('vault',3,[571,347,778,489],4),
 ('forme',7,[570,326,780,458],6),
 ('creative',10,[456,224,1008,632],None)
]

def crop_cover(image, width, height):
 ratio = max(width/image.shape[1], height/image.shape[0])
 resized = cv2.resize(image,(round(image.shape[1]*ratio),round(image.shape[0]*ratio)),interpolation=cv2.INTER_AREA if ratio<1 else cv2.INTER_CUBIC)
 x=(resized.shape[1]-width)//2; y=0
 return resized[y:y+height,x:x+width]

def templates():
 cap=cv2.VideoCapture(str(SOURCES['hero'])); result=[]
 for name,t,box,project in TEMPLATE_DEFS:
  cap.set(cv2.CAP_PROP_POS_MSEC,t*1000);ok,frame=cap.read()
  if not ok:raise RuntimeError('Reference decode failed')
  x,y,w,h=box;image=cv2.resize(frame[y:y+h,x:x+w],(720,450))
  kp,desc=SIFT.detectAndCompute(cv2.cvtColor(image,cv2.COLOR_BGR2GRAY),None)
  result.append({'name':name,'project':project,'keys':kp,'desc':desc})
 cap.release();return result

def valid_quad(quad, inliers):
 if inliers<14 or not np.isfinite(quad).all():return False
 if not cv2.isContourConvex(np.round(quad).astype(np.int32)):return False
 edges=np.linalg.norm(np.roll(quad,-1,axis=0)-quad,axis=1)
 area=abs(cv2.contourArea(quad.astype(np.float32)))
 return (area>12000 and area<650000 and min(edges)>45 and
         .55<edges[0]/edges[2]<1.8 and .55<edges[1]/edges[3]<1.8 and
         -500<quad[:,1].mean()<1900 and 700<quad[:,0].mean()<1220)

def trace_intro():
 path=HERE/'intro-tracks.json'
 if path.exists():return json.loads(path.read_text())
 atlas=templates();cap=cv2.VideoCapture(str(SOURCES['hero']));tracks=[]
 for index in range(214):
  ok,frame=cap.read()
  if not ok:break
  small=cv2.resize(frame,(960,540))
  kp,desc=SIFT.detectAndCompute(cv2.cvtColor(small,cv2.COLOR_BGR2GRAY),None)
  found=[]
  for template in atlas:
   good=[m for m,n in MATCHER.knnMatch(template['desc'],desc,k=2) if m.distance<.73*n.distance]
   if len(good)<14:continue
   p=np.float32([template['keys'][m.queryIdx].pt for m in good]);q=np.float32([kp[m.trainIdx].pt for m in good])
   H,mask=cv2.findHomography(p,q,cv2.RANSAC,3)
   if H is None:continue
   quad=cv2.perspectiveTransform(np.float32([[[0,0],[720,0],[720,450],[0,450]]]),H)[0]*2
   if valid_quad(quad,int(mask.sum())):
    found.append({'name':template['name'],'project':template['project'],'quad':np.round(quad,3).tolist(),'inliers':int(mask.sum())})
  tracks.append(found)
  if index%30==0:print('Tracking',index,'/214',flush=True)
 cap.release()
 # Fill only short losses of a previously verified planar track.
 for name,_,_,_ in TEMPLATE_DEFS:
  valid=[i for i,row in enumerate(tracks) if any(p['name']==name for p in row)]
  for a,b in zip(valid,valid[1:]):
   if b-a>10:continue
   pa=next(p for p in tracks[a] if p['name']==name);pb=next(p for p in tracks[b] if p['name']==name)
   for i in range(a+1,b):
    q=np.array(pa['quad'])+(np.array(pb['quad'])-np.array(pa['quad']))*(i-a)/(b-a)
    tracks[i].append({**pa,'quad':q.tolist(),'interpolated':True})
 path.write_text(json.dumps(tracks,separators=(',',':')));return tracks

def replace_plane(frame, original, quad, image):
 quad=np.float32(quad)
 mask=np.zeros(frame.shape[:2],np.uint8)
 cv2.fillConvexPoly(mask,np.round(quad).astype(np.int32),255,cv2.LINE_AA)
 if image is None:frame[mask>0]=original[mask>0];return
 H=cv2.getPerspectiveTransform(np.float32([[0,0],[720,0],[720,450],[0,450]]),quad)
 warped=cv2.warpPerspective(image,H,(frame.shape[1],frame.shape[0]),flags=cv2.INTER_CUBIC)
 alpha=cv2.GaussianBlur(mask,(3,3),.6).astype(np.float32)[:,:,None]/255
 frame[:]=(frame*(1-alpha)+warped*alpha).astype(np.uint8)

def scene_project(mode, index):
 if mode=='hero':
  if index<214:return None
  if index<279:
   sequence=[0,4,6,1,5,2,3,7,0,5,2,6,3]
   return sequence[min((index-214)//5,len(sequence)-1)]
  if index<309 or index>=399:return None
  return 5 if index<339 else 6 if index<369 else 3
 # The frame numbers are the reference's actual hard cuts (720-frame reel).
 schedule=[(0,None),(30,5),(60,6),(90,3),(120,None),(210,None),
           (300,None),(330,5),(420,7),(450,1),(480,5),(510,1),
           (600,7),(630,None),(660,6),(690,6)]
 return next(p for start,p in reversed(schedule) if index>=start)

def segment_start(mode,index):
 if mode=='hero':
  if index<279:return 214+((index-214)//5)*5
  return next(start for start in reversed([279,309,339,369,399]) if index>=start)
 return next(start for start in reversed([0,30,60,90,120,210,300,330,420,450,480,510,600,630,660,690]) if index>=start)

def render(mode, tracks):
 cap=cv2.VideoCapture(str(SOURCES[mode]));fps=cap.get(cv2.CAP_PROP_FPS)
 count=int(cap.get(cv2.CAP_PROP_FRAME_COUNT));w=int(cap.get(cv2.CAP_PROP_FRAME_WIDTH));h=int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
 filename='hero-preview.mp4' if mode=='hero' else 'studio-reel.mp4'
 OUT.mkdir(parents=True,exist_ok=True)
 command=[imageio_ffmpeg.get_ffmpeg_exe(),'-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','bgr24','-s',f'{w}x{h}','-framerate',str(fps),'-i','pipe:0','-an','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(OUT/filename)]
 encoder=subprocess.Popen(command,stdin=subprocess.PIPE)
 scroll_x=scroll_y=0.;previous=None;previous_project=None;previous_start=None
 poses=[];stills=[];textures={i:crop_cover(im,720,450) for i,im in enumerate(IMAGES)}
 strips={}
 for i,image in enumerate(IMAGES):
  pages=[image]+[cv2.imread(str(HERE/p)) for p in PROJECTS[i].get('extraFiles',[])]
  scaled_pages=[cv2.resize(p,(1008,round(p.shape[0]*1008/p.shape[1])),interpolation=cv2.INTER_CUBIC) for p in pages]
  strip=np.concatenate(scaled_pages,axis=0)
  if strip.shape[0]<632:strip=crop_cover(strip,1008,632)
  strips[i]=strip
 for index in range(count):
  ok,original=cap.read()
  if not ok:raise RuntimeError('Unexpected reference end')
  frame=original.copy()
  if mode=='hero' and index<214:
   for plane in sorted(tracks[index],key=lambda p:np.array(p['quad'])[:,1].mean()):
    replace_plane(frame,original,plane['quad'],textures[plane['project']] if plane['project'] is not None else None)
   # The reference's fast vertical flip temporarily loses feature detail.
   if 172<=index<204 and not any(p['project']==6 for p in tracks[index]):
    mask=(original.max(axis=2)>25).astype(np.uint8)*255
    mask=cv2.morphologyEx(mask,cv2.MORPH_CLOSE,np.ones((9,9),np.uint8))
    contours,_=cv2.findContours(mask,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
    candidates=[cv2.boundingRect(c) for c in contours if cv2.contourArea(c)>8000]
    for x,y,bw,bh in candidates:
     if bw>500 and bh>90 and y>100:
      fullh=min(490,bh) if bh>440 else 490
      quad=[[x,y],[x+bw,y],[x+bw,y+fullh],[x,y+fullh]]
      replace_plane(frame,original,quad,textures[6])
  else:
   project=scene_project(mode,index);start=segment_start(mode,index)
   x,y,bw,bh=456,224,1008,632
   patch=cv2.resize(cv2.cvtColor(original[y:y+bh,x:x+bw],cv2.COLOR_BGR2GRAY),(252,158)).astype(np.float32)
   if project!=previous_project or start!=previous_start:scroll_x=scroll_y=0.;previous=None
   dx=dy=0.
   if previous is not None:
    (dx,dy),response=cv2.phaseCorrelate(previous,patch)
    if response<.16 or abs(dx)>15 or abs(dy)>15:dx=dy=0.
    scroll_x+=dx*4;scroll_y+=dy*4
   if project is not None:
    scaled=strips[project];ih,iw=scaled.shape[:2]
    cx=int(np.clip((iw-bw)/2-scroll_x,0,iw-bw));cy=int(np.clip(-scroll_y,0,ih-bh))
    replacement=scaled[cy:cy+bh,cx:cx+bw]
    sigma=min(abs(dy)*.2,2.5)
    if sigma>.25:replacement=cv2.GaussianBlur(replacement,(0,0),sigma)
    frame[y:y+bh,x:x+bw]=replacement
   poses.append({'frame':index,'project':project,'offset':[round(scroll_x,3),round(scroll_y,3)],'rect':[x,y,bw,bh]})
   previous=patch;previous_project=project;previous_start=start
  if index==0 and mode=='hero':
   Image.fromarray(cv2.cvtColor(frame,cv2.COLOR_BGR2RGB)).resize((960,540)).save(OUT/'hero-video-poster.webp',quality=88)
  if index%30==0:
   stills.append((index/fps,Image.fromarray(cv2.cvtColor(frame,cv2.COLOR_BGR2RGB)).resize((384,216))))
   print(mode,index,'/',count,flush=True)
  encoder.stdin.write(frame.tobytes())
 encoder.stdin.close()
 if encoder.wait()!=0:raise RuntimeError('Video encoder failed')
 cap.release()
 (HERE/f'{mode}-viewport-tracks.json').write_text(json.dumps(poses,separators=(',',':')))
 sheet=Image.new('RGB',(1536,((len(stills)+3)//4)*244),'#202020');draw=ImageDraw.Draw(sheet)
 for i,(t,im) in enumerate(stills):
  sx=i%4*384;sy=i//4*244;sheet.paste(im,(sx,sy));draw.text((sx+8,sy+220),f'{mode} {t:.2f}s',fill='white')
 sheet.save(ROOT/f'artifacts/studio-motion/{mode}-render.jpg',quality=92)
 return {'file':filename,'width':w,'height':h,'frames':count,'fps':fps,'duration':count/fps,'bytes':(OUT/filename).stat().st_size}

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--mode',choices=['hero','reel','both'],default='both');args=parser.parse_args()
 tracks=trace_intro() if args.mode in ('hero','both') else []
 modes=['hero','reel'] if args.mode=='both' else [args.mode]
 info=HERE/'render-info.json'
 results=json.loads(info.read_text()) if info.exists() else {}
 results.update({mode:render(mode,tracks) for mode in modes})
 info.write_text(json.dumps(results,indent=2));print(json.dumps(results,indent=2))
