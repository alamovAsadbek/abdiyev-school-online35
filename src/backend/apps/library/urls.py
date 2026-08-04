from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.library.views import BookModelViewSet

router = DefaultRouter()
router.register(r'books', BookModelViewSet, basename='book')

urlpatterns = [
    path('', include(router.urls)),
]
