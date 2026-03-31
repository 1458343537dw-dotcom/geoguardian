// 定义缓存名称，每次更新应用时可以更改此版本号
const CACHE_NAME = 'geoguardian-cache-v1';

// 定义需要被缓存的核心文件列表，确保离线可用
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 监听安装事件：打开缓存并添加所需的文件
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 监听网络请求事件：实现离线访问逻辑
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // 如果缓存中有匹配的文件，则直接返回缓存；否则发起网络请求
      return response || fetch(event.request);
    })
  );
});