// 每次修改 Service Worker 逻辑，建议升级一下版本号，强制浏览器更新
const CACHE_NAME = 'geoguardian-cache-v2';

// 基础文件仍然提前缓存
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 安装阶段：缓存基础文件
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting(); // 强制立即接管控制权
});

// 激活阶段：清理旧版本的缓存，释放空间
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 核心修改：拦截请求，实现动态缓存 (Stale-While-Revalidate / Network First 混合)
self.addEventListener('fetch', (event) => {
  // 只处理 http 和 https 请求，忽略 chrome-extension 等特殊请求
  if (!(event.request.url.startsWith('http'))) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 1. 如果缓存里有这个文件，直接光速返回（解决离线访问的核心）
      if (cachedResponse) {
        return cachedResponse;
      }

      // 2. 如果缓存里没有，说明是第一次访问，去网络上请求
      return fetch(event.request).then((networkResponse) => {
        // 确保请求成功才进行缓存
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // 3. 克隆一份网络响应，把它存入缓存，以备下次离线使用
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch((error) => {
        console.error('Fetch failed, offline mode active:', error);
        // 断网且没缓存的情况（如果是请求图片等资源可以返回一个默认的离线占位图，这里我们保持静默）
      });
    })
  );
});