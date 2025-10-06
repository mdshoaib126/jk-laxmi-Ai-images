// JK Lakshmi AR Facade Designer - Service Worker
// Handles caching, offline functionality, and PWA features

const CACHE_NAME = 'jk-lakshmi-ar-v1.0.0'
const STATIC_CACHE = 'jk-static-v1'
const DYNAMIC_CACHE = 'jk-dynamic-v1'

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/upload',
  '/offline.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  // Add other critical assets
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error)
      })
  )
  
  // Force activation of new service worker
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.ok && request.method === 'GET') {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseClone)
              })
          }
          return response
        })
        .catch(() => {
          // Try to serve from cache when offline
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse
              }
              // Return offline page for failed API requests
              return caches.match('/offline.html')
            })
        })
    )
    return
  }

  // Handle image requests (uploads, generated designs)
  if (request.destination === 'image' || url.pathname.includes('/uploads/') || url.pathname.includes('/generated/')) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }
          
          return fetch(request)
            .then((response) => {
              if (response.ok) {
                const responseClone = response.clone()
                caches.open(DYNAMIC_CACHE)
                  .then((cache) => {
                    cache.put(request, responseClone)
                  })
              }
              return response
            })
            .catch(() => {
              // Return placeholder image for failed image requests
              return new Response(
                '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" dy=".35em" fill="#6b7280">Image Unavailable</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              )
            })
        })
    )
    return
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigation responses
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseClone)
              })
          }
          return response
        })
        .catch(() => {
          // Serve cached page or offline page
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse
              }
              return caches.match('/offline.html')
            })
        })
    )
    return
  }

  // Handle static assets
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        
        return fetch(request)
          .then((response) => {
            if (response.ok) {
              const responseClone = response.clone()
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseClone)
                })
            }
            return response
          })
      })
  )
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag)
  
  if (event.tag === 'upload-design') {
    event.waitUntil(syncUploadDesign())
  }
  
  if (event.tag === 'share-design') {
    event.waitUntil(syncShareDesign())
  }
})

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received')
  
  const options = {
    body: event.data ? event.data.text() : 'Your facade design is ready!',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    },
    actions: [
      {
        action: 'view',
        title: 'View Design',
        icon: '/icon-192x192.png'
      },
      {
        action: 'share',
        title: 'Share',
        icon: '/icon-192x192.png'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('JK Lakshmi AR Designer', options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event.action)
  
  event.notification.close()
  
  const actionUrl = event.action === 'share' ? '/share' : '/'
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(actionUrl) && 'focus' in client) {
            return client.focus()
          }
        }
        
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(actionUrl)
        }
      })
  )
})

// Helper functions for background sync
async function syncUploadDesign() {
  try {
    // Get pending uploads from IndexedDB or localStorage
    const pendingUploads = await getPendingUploads()
    
    for (const upload of pendingUploads) {
      try {
        await fetch('/api/upload', {
          method: 'POST',
          body: upload.formData
        })
        
        // Remove from pending uploads
        await removePendingUpload(upload.id)
        
        console.log('Service Worker: Upload synced successfully')
      } catch (error) {
        console.error('Service Worker: Failed to sync upload', error)
      }
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed', error)
  }
}

async function syncShareDesign() {
  try {
    // Get pending shares from storage
    const pendingShares = await getPendingShares()
    
    for (const share of pendingShares) {
      try {
        await fetch('/api/share', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(share.data)
        })
        
        // Remove from pending shares
        await removePendingShare(share.id)
        
        console.log('Service Worker: Share synced successfully')
      } catch (error) {
        console.error('Service Worker: Failed to sync share', error)
      }
    }
  } catch (error) {
    console.error('Service Worker: Share sync failed', error)
  }
}

// Storage helpers (simplified - would use IndexedDB in production)
async function getPendingUploads() {
  // Implementation would read from IndexedDB
  return []
}

async function removePendingUpload(id) {
  // Implementation would remove from IndexedDB
}

async function getPendingShares() {
  // Implementation would read from IndexedDB
  return []
}

async function removePendingShare(id) {
  // Implementation would remove from IndexedDB
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('Service Worker: Periodic sync triggered', event.tag)
  
  if (event.tag === 'check-new-features') {
    event.waitUntil(checkForNewFeatures())
  }
})

async function checkForNewFeatures() {
  try {
    // Check for app updates or new features
    const response = await fetch('/api/version')
    const data = await response.json()
    
    // Notify user of updates if needed
    if (data.hasUpdates) {
      self.registration.showNotification('JK Lakshmi AR Designer', {
        body: 'New features available! Update the app to get the latest improvements.',
        icon: '/icon-192x192.png',
        actions: [
          {
            action: 'update',
            title: 'Update Now'
          }
        ]
      })
    }
  } catch (error) {
    console.error('Service Worker: Failed to check for updates', error)
  }
}