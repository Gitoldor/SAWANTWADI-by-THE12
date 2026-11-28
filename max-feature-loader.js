/* Loads the MAX Drive experience only after the shared membership checker confirms a MAX plan. */
(() => {
  'use strict';
  if (window.__sho1re1MaxFeatureLoader) return;
  window.__sho1re1MaxFeatureLoader = true;
  let loading = false;
  let loaded = false;

  function isMax() {
    const access = window.Sho1re1Pro;
    return !!(access && access.getCached() === true &&
      /MAX/i.test(String(access.getPlanId() || '')));
  }

  function addScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-max-feature="' + src + '"]');
      if (existing) {
        if (existing.dataset.loaded === '1') return resolve();
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.dataset.maxFeature = src;
      script.onload = () => { script.dataset.loaded = '1'; resolve(); };
      script.onerror = () => reject(new Error('Could not load MAX feature: ' + src));
      document.body.appendChild(script);
    });
  }

  function warmConnections() {
    ['https://unpkg.com','https://tiles.openfreemap.org','https://valhalla1.openstreetmap.de',
     'https://overpass-api.de','https://overpass.kumi.systems'].forEach(url => {
      if (document.querySelector('link[rel="preconnect"][href="' + url + '"]')) return;
      const link = document.createElement('link');
      link.rel = 'preconnect'; link.href = url; link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }

  async function sync() {
    if (!isMax()) {
      if (window.Sho1re1Drive && window.Sho1re1Drive.stop) window.Sho1re1Drive.stop();
      return;
    }
    if (loaded || loading) return;
    loading = true;
    warmConnections();
    try {
      await addScript('./max-road-map-openfreemap.js?v=20261128instant2');
      if (!isMax()) return;
      // Warm large CDN libraries and IndexedDB road snapshots before the
      // user opens Drive. These downloads run in parallel with module setup.
      const mapWarm = window.Sho1re1RoadMap && window.Sho1re1RoadMap.preload
        ? window.Sho1re1RoadMap.preload().catch(error => console.warn('MAX map preload:', error))
        : Promise.resolve();
      await addScript('./max-road-graph.js?v=20261128instant2');
      if (!isMax()) return;
      const graphWarm = window.Sho1re1RoadGraph && window.Sho1re1RoadGraph.preload
        ? window.Sho1re1RoadGraph.preload().catch(error => console.warn('MAX graph cache preload:', error))
        : Promise.resolve();
      await addScript('./max-drive-osrm.js?v=20261128instant3');
      // Do not block Drive controls on optional cache warming.
      Promise.all([mapWarm, graphWarm]).catch(() => {});
      loaded = true;
    } catch (error) {
      console.warn('MAX Drive could not be initialized:', error);
    } finally {
      loading = false;
    }
  }

  const access = window.Sho1re1Pro;
  if (!access) return;
  access.onChange(sync);
  access.check().then(sync).catch(() => {});
  window.addEventListener('sho1re1:prochange', sync);
})();
