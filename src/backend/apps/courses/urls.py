from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, VideoViewSet, TaskViewSet, 
    TaskQuestionViewSet, UserCourseViewSet, 
    StudentProgressViewSet, TaskSubmissionViewSet
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'videos', VideoViewSet, basename='video')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'task-questions', TaskQuestionViewSet, basename='task-question')
router.register(r'user-courses', UserCourseViewSet, basename='user-course')
router.register(r'progress', StudentProgressViewSet, basename='progress')
router.register(r'submissions', TaskSubmissionViewSet, basename='submission')

urlpatterns = [
    path('', include(router.urls)),
]
