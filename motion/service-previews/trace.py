from pathlib import Path
import sys, json
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'artifacts/studio-motion/tools'))
import cv2,numpy as np
cv2.setRNGSeed(41)

HERE=ROOT/'motion/service-previews'
SOURCES={'wordpress':'BP0200Otu1K9wAS3EYw00ewY7oNNy4gBzZiQqh758BrbsQ','shopify':'SJ2mU2IfrQe3jkt22bmriMiit7Xl00El9gNpFXisIZ2w'}
INITIAL_SHOP=[
 [200,-8,250,158],[740,-55,238,149],[806,-112,214,181],
 [978,70,377,237],[991,302,250,162],[568,117,207,130],
 [121,293,187,118],[492,342,130,81],[716,389,146,91],
 [-204,333,257,161],[368,478,95,82],[164,560,133,111],
 [620,561,83,51],[875,571,174,123],[473,662,62,45],
 [-213,657,341,211],[712,711,106,84],[297,761,101,65],
 [552,819,89,73],[936,812,256,215],[156,917,179,123],
 [408,972,152,94],[700,929,168,135],[-143,1080,201,126],
 [-193,1150,265,168],[557,1149,222,143],[268,1237,344,214],
 [214,1293,207,131],[822,1281,280,176],
]

def detect(frame, mode):
 mask=(frame.max(axis=2)>6).astype('uint8')*255
 mask=cv2.morphologyEx(mask,cv2.MORPH_CLOSE,np.ones((5,5),np.uint8))
 cs,_=cv2.findContours(mask,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
 boxes=[]
 for c in cs:
  x,y,w,h=cv2.boundingRect(c);a=cv2.contourArea(c)
  if mode=='wordpress':
   if w>850 and h>40:
    if y==0:y=y+h-550
    boxes.append([100,y,880,550])
  elif a>1500 and a/(w*h)>.82 and .6<w/h<3 and w<380 and h<300:
   if x>1 and y>1 and x+w<1079 and y+h<1349:boxes.append([x,y,w,h])
 return sorted(boxes,key=lambda b:b[1])

def overlap(a,b):
 x=max(a[0],b[0]);y=max(a[1],b[1]);r=min(a[0]+a[2],b[0]+b[2]);d=min(a[1]+a[3],b[1]+b[3])
 return max(0,r-x)*max(0,d-y)/max(1,min(a[2]*a[3],b[2]*b[3]))

def points(gray,box):
 x,y,w,h=box;x1=max(0,round(x));y1=max(0,round(y));x2=min(1080,round(x+w));y2=min(1350,round(y+h))
 mask=np.zeros(gray.shape,np.uint8)
 if x2>x1 and y2>y1:mask[y1:y2,x1:x2]=255
 found=cv2.goodFeaturesToTrack(gray,60,.005,3,mask=mask)
 return found if found is not None else np.empty((0,1,2),np.float32)

def trace(mode):
 cap=cv2.VideoCapture(str(ROOT/'public/studio/stream.mux.com'/SOURCES[mode]/'1080p.mp4'))
 fps=cap.get(5);n=int(cap.get(7));objects=[];tracks=[];old=None
 for f in range(n):
  ok,frame=cap.read()
  if not ok:raise RuntimeError('Missing frame')
  gray=cv2.cvtColor(frame,cv2.COLOR_BGR2GRAY)
  if old is not None:
   valid=[o for o in objects if len(o['points'])>=4]
   if valid:
    counts=[len(o['points']) for o in valid];allp=np.concatenate([o['points'] for o in valid])
    new,status,error=cv2.calcOpticalFlowPyrLK(old,gray,allp,None,winSize=(25,25),maxLevel=3)
    offset=0
    for o,count in zip(valid,counts):
     good=status[offset:offset+count].ravel().astype(bool)&(error[offset:offset+count].ravel()<35)
     a=allp[offset:offset+count][good];b=new[offset:offset+count][good];offset+=count
     if len(a)>=4:
      M,inliers=cv2.estimateAffinePartial2D(a,b,method=cv2.RANSAC,ransacReprojThreshold=1.5)
      if M is not None:
       scale=np.sqrt(M[0,0]**2+M[1,0]**2)
       if .95<scale<1.05:
        x,y,w,h=o['box'];center=np.array([x+w/2,y+h/2,1]);cx,cy=M@center
        if abs(cx-center[0])<45 and abs(cy-center[1])<60:
         o['box']=[cx-w*scale/2,cy-h*scale/2,w*scale,h*scale]
         o['last']=f;o['points']=b[inliers.ravel().astype(bool)]
         continue
     o['points']=np.empty((0,1,2),np.float32)
  candidates=detect(frame,mode)
  for box in candidates:
   existing=[o for o in objects if overlap(box,o['box'])>.55 and f-o['last']<20 and .45<o['box'][2]*o['box'][3]/(box[2]*box[3])<2.2]
   if existing:
    o=max(existing,key=lambda o:overlap(box,o['box']));o['box']=box;o['last']=f;o['measured']=f
    o['points']=points(gray,box)
    for other in existing:
     if other is not o and overlap(other['box'],box)>.8:other['last']=-1000;other['points']=np.empty((0,1,2),np.float32)
    continue
   objects.append({'id':len(objects),'box':box,'points':points(gray,box),'last':f,'born':f,'measured':f})
  for o in objects:
   x,y,w,h=o['box']
   if f-o['last']<=12 and x+w>0 and x<1080 and y+h>0 and y<1350:
    if f%6==0 or len(o['points'])<12:o['points']=points(gray,o['box'])
  active=[]
  for o in objects:
   x,y,w,h=o['box'];x1=max(0,round(x));x2=min(1080,round(x+w));y1=max(0,round(y));y2=min(1350,round(y+h))
   if f-o['last']>5 or x2<=x1 or y2<=y1:continue
   support=(gray[y1:y2,x1:x2]>6).mean()
   if support<.035:continue
   active.append({'id':o['id'],'box':[round(float(v),3) for v in o['box']],'measured':f==o.get('measured')})
  tracks.append(active);old=gray
  if f%60==0:print(mode,f,'objects',len(objects),'active',len(active),flush=True)
 cap.release()
 (HERE/f'{mode}-tracks.json').write_text(json.dumps({'fps':fps,'frames':n,'width':1080,'height':1350,'tracks':tracks},separators=(',',':')))
 print('Saved',mode,'total objects',len(objects))

def trace_shopify():
 """Match each card to an absolute source view to avoid flow drift."""
 cap=cv2.VideoCapture(str(ROOT/'public/studio/stream.mux.com'/SOURCES['shopify']/'1080p.mp4'))
 fps=cap.get(5);n=int(cap.get(7));sift=cv2.SIFT_create(nfeatures=6500,contrastThreshold=.018)
 catalog=[]
 def add(gray,box):
  x,y,w,h=box;left=max(0,round(x));top=max(0,round(y));right=min(1080,round(x+w));bottom=min(1350,round(y+h))
  if right<=left or bottom<=top:return
  kp,desc=sift.detectAndCompute(gray[top:bottom,left:right],None)
  if desc is None or len(kp)<4:return
  order=sorted(range(len(kp)),key=lambda i:kp[i].response,reverse=True)[:160]
  pts=np.float32([[kp[i].pt[0]+left,kp[i].pt[1]+top] for i in order])
  catalog.append({'id':len(catalog),'box':np.array(box,dtype=float),'points':pts,'desc':desc[order]})
 def match(gray):
  kp,desc=sift.detectAndCompute(gray,None)
  if desc is None or not catalog:return []
  matcher=cv2.FlannBasedMatcher(dict(algorithm=1,trees=4),dict(checks=32))
  matcher.add([desc]);matcher.train()
  all_matches=matcher.knnMatch(np.concatenate([o['desc'] for o in catalog]),k=2)
  results=[];offset=0
  for o in catalog:
   size=len(o['desc']);ms=all_matches[offset:offset+size];offset+=size
   good=[(i,a) for i,pair in enumerate(ms) if len(pair)==2 for a,b in [pair] if a.distance<.63*b.distance]
   if len(good)<4:continue
   a=np.float32([o['points'][i] for i,m in good]);b=np.float32([kp[m.trainIdx].pt for i,m in good])
   M,inliers=cv2.estimateAffinePartial2D(a,b,method=cv2.RANSAC,ransacReprojThreshold=1.1)
   if M is None or int(inliers.sum())<4 or inliers.mean()<.45:continue
   scale=np.hypot(M[0,0],M[1,0]);rotation=abs(np.arctan2(M[1,0],M[0,0]))
   if not .12<scale<4 or rotation>.025:continue
   x,y,w,h=o['box'];cx,cy=M@np.array([x+w/2,y+h/2,1]);box=[cx-w*scale/2,cy-h*scale/2,w*scale,h*scale]
   if box[0]+box[2]<=0 or box[0]>=1080 or box[1]+box[3]<=0 or box[1]>=1350:continue
   results.append({'id':o['id'],'box':box,'matrix':M,'scale':scale,'inliers':int(inliers.sum())})
  return results
 # Discover cards when they are sufficiently visible, then trace every frame
 # against the complete catalog, including cards that enter after frame zero.
 for f in range(0,n,30):
  cap.set(cv2.CAP_PROP_POS_FRAMES,f);ok,frame=cap.read();gray=cv2.cvtColor(frame,cv2.COLOR_BGR2GRAY)
  if f==0:
   for box in INITIAL_SHOP:add(gray,box)
  poses=match(gray)
  for box in detect(frame,'shopify'):
   candidates=[p for p in poses if overlap(box,p['box'])>.65 and .4<p['box'][2]*p['box'][3]/(box[2]*box[3])<2.5]
   if candidates:
    p=max(candidates,key=lambda p:overlap(box,p['box']))
    # Correct a seed that began clipped at the frame edge using a later full view.
    x,y,w,h=box;cx,cy=cv2.invertAffineTransform(p['matrix'])@np.array([x+w/2,y+h/2,1]);scale=p['scale']
    catalog[p['id']]['box']=np.array([cx-w/scale/2,cy-h/scale/2,w/scale,h/scale])
   else:add(gray,box)
  print('shopify catalog',f,len(catalog),flush=True)
 tracks=[];recent={};next_identity=len(catalog)
 cap.set(cv2.CAP_PROP_POS_FRAMES,0)
 for f in range(n):
  ok,frame=cap.read();gray=cv2.cvtColor(frame,cv2.COLOR_BGR2GRAY);poses=match(gray)
  observed=detect(frame,'shopify');used=set()
  for p in poses:
   candidates=[(i,b) for i,b in enumerate(observed) if overlap(b,p['box'])>.75 and .6<p['box'][2]*p['box'][3]/(b[2]*b[3])<1.6]
   if candidates:
    i,box=max(candidates,key=lambda pair:overlap(pair[1],p['box']));p['box']=box;p['measured']=True;used.add(i)
   else:p['measured']=False
  # Edge observations also keep very small cards stable when too few SIFT
  # features remain. These use the same identity as the preceding frame.
  ids={p['id'] for p in poses}
  for i,box in enumerate(observed):
   if i in used:continue
   candidates=[(id,last) for id,last in recent.items() if id not in ids and f-last['frame']<5 and overlap(box,last['box'])>.65]
   if candidates:
    id,last=max(candidates,key=lambda pair:overlap(pair[1]['box'],box));poses.append({'id':id,'box':box,'measured':True,'inliers':0});ids.add(id)
   else:
    poses.append({'id':next_identity,'box':box,'measured':True,'inliers':0});ids.add(next_identity);next_identity+=1
  # Remove duplicate matches to one native card, preferring measured edges.
  final=[]
  for p in sorted(poses,key=lambda p:(p['measured'],p['inliers']),reverse=True):
   if any(overlap(p['box'],q['box'])>.85 and .65<p['box'][2]*p['box'][3]/(q['box'][2]*q['box'][3])<1.5 for q in final):continue
   # Keep a card's assigned portfolio texture stable if its edges were visible
   # before enough SIFT features became available to identify its source view.
   same=[(id,last) for id,last in recent.items() if f-last['frame']==1 and overlap(p['box'],last['box'])>.85 and .65<p['box'][2]*p['box'][3]/(last['box'][2]*last['box'][3])<1.5 and id not in {q['id'] for q in final}]
   if same:p['id']=max(same,key=lambda pair:overlap(p['box'],pair[1]['box']))[0]
   final.append(p)
  for p in final:recent[p['id']]={'frame':f,'box':p['box']}
  tracks.append([{'id':p['id'],'box':[round(float(v),3) for v in p['box']],'measured':p['measured']} for p in final])
  if f%60==0:print('shopify trace',f,'active',len(final),flush=True)
 cap.release()
 (HERE/'shopify-tracks.json').write_text(json.dumps({'fps':fps,'frames':n,'width':1080,'height':1350,'tracks':tracks},separators=(',',':')))
 print('Saved absolute Shopify tracks',len(catalog))

if __name__=='__main__':
 for mode in sys.argv[1:] or SOURCES:
  if mode=='shopify':trace_shopify()
  else:trace(mode)
