# Django Backend API

Django REST API backend with JWT authentication for the learning management system.

## Features

- **JWT Authentication** - Token-based authentication using `djangorestframework-simplejwt`
- **Username-based Login** - Login using username instead of email
- **User Management** - Admin and Student roles with blocking functionality
- **Course Management** - Categories, videos, and tasks
- **Payment System** - Track user payments and subscriptions
- **Notifications** - Send notifications to users
- **Progress Tracking** - Track student video completion and task submissions

## Setup Instructions

### 1. Create Virtual Environment

```bash
cd src/backend
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. Create Superuser

```bash
python manage.py createsuperuser
```

Enter username and password when prompted (email is optional).

### 5. Run Development Server

```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/`

## API Endpoints

### Authentication

- `POST /api/users/register/` - Register new user
  ```json
  {
    "username": "student1",
    "password": "password123",
    "password2": "password123"
  }
  ```

- `POST /api/users/login/` - Login
  ```json
  {
    "username": "student1",
    "password": "password123"
  }
  ```
  Returns:
  ```json
  {
    "user": {...},
    "access": "access_token",
    "refresh": "refresh_token"
  }
  ```

- `POST /api/token/refresh/` - Refresh access token
  ```json
  {
    "refresh": "refresh_token"
  }
  ```

### Users

- `GET /api/users/` - List all users
- `GET /api/users/{id}/` - Get user details
- `GET /api/users/me/` - Get current user profile
- `PUT /api/users/{id}/` - Update user
- `POST /api/users/change_password/` - Change password
- `POST /api/users/{id}/block/` - Block user
- `POST /api/users/{id}/unblock/` - Unblock user

### Categories (Courses)

- `GET /api/categories/` - List all categories
- `POST /api/categories/` - Create category
- `GET /api/categories/{id}/` - Get category details
- `PUT /api/categories/{id}/` - Update category
- `DELETE /api/categories/{id}/` - Delete category

### Videos

- `GET /api/videos/` - List all videos
- `GET /api/videos/by_category/?category_id={id}` - Get videos by category
- `POST /api/videos/` - Create video
- `GET /api/videos/{id}/` - Get video details
- `PUT /api/videos/{id}/` - Update video
- `DELETE /api/videos/{id}/` - Delete video
- `POST /api/videos/{id}/increment_view/` - Increment view count

### Tasks

- `GET /api/tasks/` - List all tasks
- `GET /api/tasks/by_video/?video_id={id}` - Get tasks by video
- `POST /api/tasks/` - Create task
- `GET /api/tasks/{id}/` - Get task details
- `PUT /api/tasks/{id}/` - Update task
- `DELETE /api/tasks/{id}/` - Delete task

### User Courses

- `GET /api/user-courses/` - List all user courses
- `GET /api/user-courses/my_courses/` - Get current user's courses
- `POST /api/user-courses/grant_course/` - Grant course to user
  ```json
  {
    "user_id": 1,
    "category_id": 1,
    "granted_by": "gift"
  }
  ```

### Progress

- `GET /api/progress/my_progress/` - Get current user's progress
- `POST /api/progress/complete_video/` - Mark video as completed
  ```json
  {
    "video_id": "vid-1"
  }
  ```
- `POST /api/progress/complete_task/` - Mark task as completed
  ```json
  {
    "task_id": "task-1"
  }
  ```

### Task Submissions

- `GET /api/submissions/` - List all submissions
- `GET /api/submissions/my_submissions/` - Get current user's submissions
- `POST /api/submissions/submit/` - Submit task
  ```json
  {
    "task_id": 1,
    "file": "file",
    "score": 8,
    "total": 10
  }
  ```

### Payments

- `GET /api/payments/` - List all payments
- `GET /api/payments/my_payments/` - Get current user's payments
- `GET /api/payments/by_user/?user_id={id}` - Get payments by user
- `POST /api/payments/` - Create payment

### Notifications

- `GET /api/notifications/` - List all notifications
- `POST /api/notifications/send_notification/` - Send notification
  ```json
  {
    "title": "New Video",
    "message": "New video added",
    "type": "info",
    "send_to_all": true
  }
  ```

- `GET /api/user-notifications/my_notifications/` - Get current user's notifications
- `POST /api/user-notifications/{id}/mark_as_read/` - Mark notification as read
- `POST /api/user-notifications/mark_all_read/` - Mark all notifications as read

## Authentication

All endpoints except registration and login require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Admin Panel

Access Django admin panel at `http://localhost:8000/admin/` using superuser credentials.

## Notes

- The default database is SQLite (`db.sqlite3`)
- Media files are stored in `media/` directory
- CORS is enabled for all origins in development
- Access token lifetime: 30 days
- Refresh token lifetime: 90 days
