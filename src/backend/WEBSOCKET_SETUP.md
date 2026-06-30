# WebSocket Notifications (Django Channels)

Backend endi real-time bildirishnomalar uchun WebSocket ishlatadi.
Frontend `notifications/unread_count` ni 15s da bir so'ramaydi — `ws://.../ws/notifications/?token=<JWT>` ulanadi.

## O'rnatish

```bash
pip install channels daphne
```

`requirements.txt` ga qo'shing:

```
channels>=4.0
daphne>=4.0
```

## Ishga tushirish

WSGI o'rniga ASGI server kerak:

```bash
daphne -b 0.0.0.0 -p 8001 config.asgi:application
```

Yoki development uchun `runserver` ham daphne'ni avtomatik ishlatadi
(channels INSTALLED_APPS ga qo'shilgan, va `daphne` undan oldin turishi shart — bu allaqachon qilingan).

## Frontend sozlamasi

Standart holda WS URL `API_BASE_URL` dan hosil qilinadi (`http://x/api` → `ws://x`).
Boshqacha qilish uchun `.env`:

```
VITE_WS_URL=ws://127.0.0.1:8001
```

## Channel layer

`InMemoryChannelLayer` ishlatilgan — bitta process uchun yetadi.
Production / multi-worker uchun Redis layer kerak:

```python
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {'hosts': [('127.0.0.1', 6379)]},
    },
}
```
