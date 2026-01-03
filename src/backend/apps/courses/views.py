from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Category, Video, Task, TaskQuestion, UserCourse, StudentProgress, TaskSubmission
from .serializers import (
    CategorySerializer, VideoSerializer, TaskSerializer, 
    TaskQuestionSerializer, UserCourseSerializer, 
    StudentProgressSerializer, TaskSubmissionSerializer
)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]


class VideoViewSet(viewsets.ModelViewSet):
    queryset = Video.objects.all()
    serializer_class = VideoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def create(self, request, *args, **kwargs):
        """Handle video creation with file upload"""
        data = request.data.copy()
        
        # Handle video file or URL
        video_file = request.FILES.get('video_file')
        video_url = data.get('video_url')
        
        # Handle thumbnail file or URL
        thumbnail_file = request.FILES.get('thumbnail')
        thumbnail_url = data.get('thumbnail_url')
        
        # Create video instance
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        video = serializer.save()
        
        # Save video file if provided
        if video_file:
            video.video_file = video_file
        elif video_url:
            video.video_url = video_url
            
        # Save thumbnail file if provided
        if thumbnail_file:
            video.thumbnail = thumbnail_file
        elif thumbnail_url:
            video.thumbnail_url = thumbnail_url
            
        video.save()
        
        return Response(self.get_serializer(video).data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        """Handle video update with file upload"""
        instance = self.get_object()
        data = request.data.copy()
        
        # Handle video file or URL
        video_file = request.FILES.get('video_file')
        video_url = data.get('video_url')
        
        # Handle thumbnail file or URL
        thumbnail_file = request.FILES.get('thumbnail')
        thumbnail_url = data.get('thumbnail_url')
        
        serializer = self.get_serializer(instance, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        video = serializer.save()
        
        # Update video file if provided
        if video_file:
            video.video_file = video_file
            video.video_url = None
        elif video_url:
            video.video_url = video_url
            
        # Update thumbnail file if provided
        if thumbnail_file:
            video.thumbnail = thumbnail_file
            video.thumbnail_url = None
        elif thumbnail_url:
            video.thumbnail_url = thumbnail_url
            
        video.save()
        
        return Response(self.get_serializer(video).data)
    
    @action(detail=True, methods=['post'])
    def increment_view(self, request, pk=None):
        video = self.get_object()
        video.view_count += 1
        video.save()
        return Response({'view_count': video.view_count})
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        category_id = request.query_params.get('category_id')
        if category_id:
            videos = Video.objects.filter(category_id=category_id)
            serializer = self.get_serializer(videos, many=True)
            return Response(serializer.data)
        return Response({'error': 'category_id is required'}, status=status.HTTP_400_BAD_REQUEST)


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def by_video(self, request):
        video_id = request.query_params.get('video_id')
        if video_id:
            tasks = Task.objects.filter(video_id=video_id)
            serializer = self.get_serializer(tasks, many=True)
            return Response(serializer.data)
        return Response({'error': 'video_id is required'}, status=status.HTTP_400_BAD_REQUEST)


class TaskQuestionViewSet(viewsets.ModelViewSet):
    queryset = TaskQuestion.objects.all()
    serializer_class = TaskQuestionSerializer
    permission_classes = [IsAuthenticated]


class UserCourseViewSet(viewsets.ModelViewSet):
    queryset = UserCourse.objects.all()
    serializer_class = UserCourseSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def my_courses(self, request):
        courses = UserCourse.objects.filter(user=request.user)
        serializer = self.get_serializer(courses, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def grant_course(self, request):
        user_id = request.data.get('user_id')
        category_id = request.data.get('category_id')
        granted_by = request.data.get('granted_by', 'gift')
        
        course, created = UserCourse.objects.get_or_create(
            user_id=user_id,
            category_id=category_id,
            defaults={'granted_by': granted_by}
        )
        
        serializer = self.get_serializer(course)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class StudentProgressViewSet(viewsets.ModelViewSet):
    queryset = StudentProgress.objects.all()
    serializer_class = StudentProgressSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def my_progress(self, request):
        progress, created = StudentProgress.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(progress)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def complete_video(self, request):
        video_id = request.data.get('video_id')
        progress, created = StudentProgress.objects.get_or_create(user=request.user)
        
        if video_id not in progress.completed_videos:
            progress.completed_videos.append(video_id)
            progress.save()
        
        serializer = self.get_serializer(progress)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def complete_task(self, request):
        task_id = request.data.get('task_id')
        progress, created = StudentProgress.objects.get_or_create(user=request.user)
        
        if task_id not in progress.completed_tasks:
            progress.completed_tasks.append(task_id)
            progress.save()
        
        serializer = self.get_serializer(progress)
        return Response(serializer.data)


class TaskSubmissionViewSet(viewsets.ModelViewSet):
    queryset = TaskSubmission.objects.all()
    serializer_class = TaskSubmissionSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def my_submissions(self, request):
        submissions = TaskSubmission.objects.filter(user=request.user)
        serializer = self.get_serializer(submissions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def submit(self, request):
        task_id = request.data.get('task_id')
        file = request.FILES.get('file')
        score = request.data.get('score', 0)
        total = request.data.get('total', 0)
        
        submission = TaskSubmission.objects.create(
            user=request.user,
            task_id=task_id,
            file=file,
            score=score,
            total=total
        )
        
        serializer = self.get_serializer(submission)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
