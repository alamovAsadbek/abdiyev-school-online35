from django.contrib import admin
from .models import Category, Module, Video, Task, TaskQuestion, UserCourse, StudentProgress, TaskSubmission


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'price', 'is_modular', 'requires_sequential', 'video_count', 'created_at']
    search_fields = ['name', 'description']
    list_filter = ['is_modular', 'requires_sequential', 'created_at']


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'category', 'order', 'price', 'video_count', 'created_at']
    list_filter = ['category', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['category', 'order']


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'category', 'duration', 'order', 'view_count', 'created_at']
    list_filter = ['category', 'created_at']
    search_fields = ['title', 'description']
    ordering = ['category', 'order']


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'video', 'allow_resubmission', 'created_at']
    list_filter = ['video__category', 'allow_resubmission', 'created_at']
    search_fields = ['title', 'description']


@admin.register(TaskQuestion)
class TaskQuestionAdmin(admin.ModelAdmin):
    list_display = ['id', 'task', 'question', 'order']
    list_filter = ['task']
    ordering = ['task', 'order']


@admin.register(UserCourse)
class UserCourseAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'category', 'granted_by', 'granted_at', 'expires_at']
    list_filter = ['granted_by', 'granted_at', 'category']
    search_fields = ['user__username', 'category__name']


@admin.register(StudentProgress)
class StudentProgressAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'completed_videos_count', 'completed_tasks_count']
    search_fields = ['user__username']
    
    def completed_videos_count(self, obj):
        return len(obj.completed_videos) if obj.completed_videos else 0
    completed_videos_count.short_description = 'Completed Videos'
    
    def completed_tasks_count(self, obj):
        return len(obj.completed_tasks) if obj.completed_tasks else 0
    completed_tasks_count.short_description = 'Completed Tasks'


@admin.register(TaskSubmission)
class TaskSubmissionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'task', 'score', 'total', 'submitted_at']
    list_filter = ['submitted_at', 'task__video__category']
    search_fields = ['user__username', 'task__title']
