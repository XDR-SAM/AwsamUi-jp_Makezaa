// Resolve asset URLs held inside Framer's binary CMS without changing the CMS.
(() => {
  const map = window.__KOTA_ARCHIVE_URLS || {};
  const resolve = value => {
    if (typeof value !== 'string') return value;
    if (map[value]) return map[value];
    return value.replace(/https?:\/\/[^\s,"'()]+|\/assets\/[A-Za-z0-9_.@/-]+/g, url => map[url] || map[url.replace(/&amp;/g,'&')] || url);
  };
  const setAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function(name,value) {
    return setAttribute.call(this,name,/^(src|srcset|poster|style)$/i.test(name) ? resolve(value) : value);
  };
  for (const [Type,props] of [[HTMLImageElement,['src','srcset']],[HTMLMediaElement,['src']],[HTMLVideoElement,['poster']],[HTMLSourceElement,['src','srcset']]]) {
    for (const key of props) {
      const descriptor=Object.getOwnPropertyDescriptor(Type.prototype,key);
      if (!descriptor?.set) continue;
      Object.defineProperty(Type.prototype,key,{...descriptor,set(value){descriptor.set.call(this,resolve(value));}});
    }
  }
  const setProperty=CSSStyleDeclaration.prototype.setProperty;
  CSSStyleDeclaration.prototype.setProperty=function(name,value,priority){return setProperty.call(this,name,resolve(value),priority);};
  for(const key of ['backgroundImage','cssText']) {
    const d=Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype,key);
    if(d?.set) Object.defineProperty(CSSStyleDeclaration.prototype,key,{...d,set(value){d.set.call(this,resolve(value));}});
  }
  const nativeFetch=window.fetch.bind(window);
  window.fetch=(input,options)=>nativeFetch(typeof input==='string'?resolve(input):input,options);
})();
