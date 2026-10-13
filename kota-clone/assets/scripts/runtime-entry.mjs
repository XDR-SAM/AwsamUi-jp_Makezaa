// React expects the published component-level style nodes during hydration.
// Their CSS remains stored in separate files and is loaded before hydration.
await Promise.all([...document.querySelectorAll('body link[data-kota-style]')].map(async link => {
  const response=await fetch(link.href);
  if(!response.ok) throw new Error('Stylesheet unavailable: '+link.href);
  const style=document.createElement('style');
  for(const attr of link.attributes){
    if(!['rel','href','data-kota-style'].includes(attr.name)) style.setAttribute(attr.name,attr.value);
  }
  style.textContent=await response.text();
  link.replaceWith(style);
}));
await import('/assets/framerusercontent.com/sites/7vFNuBjjmgWQGw1uf5GxGn/script_main.D5QD7EHo.mjs');
