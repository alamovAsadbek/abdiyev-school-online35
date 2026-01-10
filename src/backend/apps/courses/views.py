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
from apps.notifacations.models import Notification, UserNotification
from apps.users.models import User

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
        video_url = data.get('video_url', '')
        
        # Handle thumbnail file or URL
        thumbnail_file = request.FILES.get('thumbnail')
        thumbnail_url = data.get('thumbnail_url', '')
        
        # Remove file fields from data to avoid serializer conflicts
        fields_to_remove = ['video_file', 'thumbnail', 'thumbnail_url']
        for field in fields_to_remove:
            data.pop(field, None)
        
        # Create video instance with basic fields
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
        video_url = data.get('video_url', '')
        
        # Handle thumbnail file or URL
        thumbnail_file = request.FILES.get('thumbnail')
        thumbnail_url = data.get('thumbnail_url', '')
        
        # Remove file fields from data to avoid serializer conflicts
        fields_to_remove = ['video_file', 'thumbnail', 'thumbnail_url', 'video_url']
        for field in fields_to_remove:
            data.pop(field, None)
        
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

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        video = self.get_object()
        tasks = video.tasks.all()
        
        # Get all submissions for this video's tasks
        submissions = TaskSubmission.objects.filter(task__in=tasks)
        
        stats_data = {
            'view_count': video.view_count,
            'task_count': tasks.count(),
            'total_submissions': submissions.count(),
            'pending_submissions': submissions.filter(status='pending').count(),
            'approved_submissions': submissions.filter(status='approved').count(),
            'rejected_submissions': submissions.filter(status='rejected').count(),
        }
        return Response(stats_data)

    @action(detail=False, methods=['post'])
    def bulk_update_order(self, request):
        updates = request.data.get('updates', [])
        for item in updates:
            Video.objects.filter(id=item['id']).update(order=item['order'])
        return Response({'status': 'success'})

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
        
        # Agar yangi kurs berilgan bo'lsa, xabarnoma yuborish
        if created:
            try:
                user = User.objects.get(id=user_id)
                category = Category.objects.get(id=category_id)
                
                # Xabarnoma yaratish
                notification = Notification.objects.create(
                    title="Sizga yangi kurs sovg'a qilindi! 🎁",
                    message=f"Tabriklaymiz! Sizga '{category.name}' kursi sovg'a qilindi. Endi barcha video darslarni bepul ko'rishingiz mumkin.",
                    type='course'
                )
                notification.recipients.add(user)
                notification.sent_count = 1
                notification.save()
                
                # UserNotification yaratish
                UserNotification.objects.create(
                    user=user,
                    notification=notification
                )
            except Exception as e:
                print(f"Error sending gift notification: {e}")
        
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
    
    @action(detail=False, methods=['get'])
    def by_task(self, request):
        """Get all submissions for a specific task with detailed answers"""
        task_id = request.query_params.get('task_id')
        if not task_id:
            return Response({'error': 'task_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        submissions = TaskSubmission.objects.filter(task_id=task_id).select_related('user', 'task')
        serializer = self.get_serializer(submissions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_video(self, request):
        """Get all submissions for a specific video's tasks"""
        video_id = request.query_params.get('video_id')
        if not video_id:
            return Response({'error': 'video_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        submissions = TaskSubmission.objects.filter(task__video_id=video_id).select_related('user', 'task')
        serializer = self.get_serializer(submissions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def detail_with_answers(self, request, pk=None):
        """Get submission detail with question details"""
        submission = self.get_object()
        task = submission.task
        questions = task.questions.all().order_by('order')
        
        serializer_data = self.get_serializer(submission).data
        
        # Add detailed question info with user answers
        questions_detail = []
        for q in questions:
            user_answer = submission.answers.get(str(q.id))
            questions_detail.append({
                'id': q.id,
                'question': q.question,
                'options': q.options,
                'correct_answer': q.correct_answer,
                'user_answer': user_answer,
                'is_correct': user_answer == q.correct_answer if user_answer is not None else False,
            })
        
        serializer_data['questions_detail'] = questions_detail
        return Response(serializer_data)
    
    @action(detail=False, methods=['post'])
    def submit(self, request):
        task_id = request.data.get('task_id')
        file = request.FILES.get('file')
        text_content = request.data.get('text_content', '')
        answers = request.data.get('answers', {})
        score = request.data.get('score', 0)
        total = request.data.get('total', 0)
        
        try:
            task = Task.objects.get(id=task_id)
        except Task.DoesNotExist:
            return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Determine initial status based on task type
        initial_status = 'pending'
        if task.task_type == 'test':
            initial_status = 'approved'  # Test auto-approved
        
        # Check if submission already exists
        existing = TaskSubmission.objects.filter(user=request.user, task_id=task_id).first()
        
        if existing:
            if not task.allow_resubmission:
                return Response({'error': 'Resubmission not allowed'}, status=status.HTTP_400_BAD_REQUEST)
            # Update existing submission
            existing.file = file if file else existing.file
            existing.text_content = text_content if text_content else existing.text_content
            existing.answers = answers if answers else existing.answers
            existing.score = score
            existing.total = total
            existing.status = initial_status
            existing.feedback = None
            existing.reviewed_at = None
            existing.save()
            submission = existing
        else:
            submission = TaskSubmission.objects.create(
                user=request.user,
                task_id=task_id,
                file=file,
                text_content=text_content,
                answers=answers,
                score=score,
                total=total,
                status=initial_status
            )
        
        serializer = self.get_serializer(submission)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Teacher approves a submission"""
        from django.utils import timezone
        submission = self.get_object()
        feedback = request.data.get('feedback', '')
        
        submission.status = 'approved'
        submission.feedback = feedback
        submission.reviewed_at = timezone.now()
        submission.save()
        
        # Send notification to student
        try:
            notification = Notification.objects.create(
                title="Vazifangiz tasdiqlandi! ✅",
                message=f"'{submission.task.title}' vazifangiz o'qituvchi tomonidan tasdiqlandi.",
                type='task'
            )
            notification.recipients.add(submission.user)
            notification.sent_count = 1
            notification.save()
            
            UserNotification.objects.create(
                user=submission.user,
                notification=notification
            )
        except Exception as e:
            print(f"Error sending approval notification: {e}")
        
        serializer = self.get_serializer(submission)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Teacher rejects a submission"""
        from django.utils import timezone
        submission = self.get_object()
        feedback = request.data.get('feedback', '')
        
        submission.status = 'rejected'
        submission.feedback = feedback
        submission.reviewed_at = timezone.now()
        submission.save()
        
        # Send notification to student
        try:
            notification = Notification.objects.create(
                title="Vazifangiz qaytarildi ❌",
                message=f"'{submission.task.title}' vazifangiz qaytarildi. Iltimos qayta topshiring. Izoh: {feedback}",
                type='task'
            )
            notification.recipients.add(submission.user)
            notification.sent_count = 1
            notification.save()
            
            UserNotification.objects.create(
                user=submission.user,
                notification=notification
            )
        except Exception as e:
            print(f"Error sending rejection notification: {e}")
        
        serializer = self.get_serializer(submission)
        return Response(serializer.data)
