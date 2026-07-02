// ======================================================
// Service Worker برای یادآور هوشمند
// ======================================================

const CACHE_NAME = 'reminder-cache-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon-32x32.png',
    '/favicon-16x16.png',
    '/apple-touch-icon.png',
    '/android-chrome-192x192.png',
    '/android-chrome-512x512.png'
];

// ======================================================
// نصب سرویس‌ورکر و کش کردن فایل‌ها
// ======================================================
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('✅ فایل‌ها در کش ذخیره شدند');
                return cache.addAll(ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// ======================================================
// فعال‌سازی و پاک کردن کش قدیمی
// ======================================================
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => caches.delete(name))
                );
            })
            .then(() => self.clients.claim())
    );
});

// ======================================================
// رهگیری درخواست‌ها و پاسخ از کش
// ======================================================
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // اگر در کش وجود داشت، برگردون
                if (cachedResponse) {
                    return cachedResponse;
                }
                // در غیر این صورت از شبکه درخواست کن
                return fetch(event.request)
                    .then((response) => {
                        // اگر پاسخ معتبر بود، در کش ذخیره کن
                        if (response && response.status === 200) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseClone);
                                });
                        }
                        return response;
                    })
                    .catch(() => {
                        // اگر آفلاین بود، صفحه خطا برگردون
                        return new Response('آفلاین هستید!', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});

// ======================================================
// دریافت پیام از صفحه اصلی
// ======================================================
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        self.registration.showNotification(event.data.title, {
            body: event.data.body,
            icon: 'icon.png',
            badge: 'icon.png',
            vibrate: [200, 100, 200],
            requireInteraction: true,
            actions: [
                { action: 'open', title: '📂 باز کردن' }
            ]
        });
    }
});

// ======================================================
// مدیریت رویدادهای نوتیفیکیشن
// ======================================================
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'open') {
        // باز کردن برنامه
        event.waitUntil(
            clients.openWindow('/')
        );
    } else {
        // کلیک معمولی
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then((clientList) => {
                    if (clientList.length > 0) {
                        return clientList[0].focus();
                    }
                    return clients.openWindow('/');
                })
        );
    }
});

// ======================================================
// مدیریت نوتیفیکیشن‌های بسته شده
// ======================================================
self.addEventListener('notificationclose', (event) => {
    console.log('نوتیفیکیشن بسته شد:', event.notification.tag);
});

// ======================================================
// Push (برای ارسال از سرور - در صورت نیاز)
// ======================================================
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'یادآوری جدید';
    const options = {
        body: data.body || 'وقت یادآوری رسیده!',
        icon: 'icon.png',
        badge: 'icon.png',
        vibrate: [200, 100, 200],
        requireInteraction: true,
        actions: [
            { action: 'open', title: '📂 باز کردن' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

console.log('✅ Service Worker بارگذاری شد!');
