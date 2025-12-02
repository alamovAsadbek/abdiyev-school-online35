from rest_framework import serializers
from .models import Category, Video, Task, TaskQuestion, UserCourse, StudentProgress, TaskSubmission

class CategorySerializer(serializers.ModelSerializer):
    video_count = serializers.ReadOnlyField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'icon', 'color', 'price', 
                  'video_count', 'created_at']


class TaskQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskQuestion
        fields = ['id', 'question', 'options', 'correct_answer', 'order']


class TaskSerializer(serializers.ModelSerializer):
    questions = TaskQuestionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Task
        fields = ['id', 'video', 'title', 'description', 'file', 
                  'allow_resubmission', 'questions', 'created_at']


class VideoSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Video
        fields = ['id', 'category', 'category_name', 'title', 'description', 
                  'duration', 'thumbnail', 'video_url', 'order', 'view_count', 
                  'tasks', 'created_at']


class UserCourseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = UserCourse
        fields = ['id', 'user', 'user_name', 'category', 'category_name', 
                  'granted_by', 'granted_at', 'expires_at']


class StudentProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProgress
        fields = ['id', 'user', 'completed_videos', 'completed_tasks']


class TaskSubmissionSerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source='task.title', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = TaskSubmission
        fields = ['id', 'user', 'user_name', 'task', 'task_title', 
                  'file', 'score', 'total', 'submitted_at']
