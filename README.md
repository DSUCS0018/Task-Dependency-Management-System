# Task Dependency Management System

A Django-based system for managing tasks with support for complex dependencies, automatic status updates, and circular dependency detection.

## Tech Stack
- **Backend:** Django 4.x, Django REST Framework
- **Database:** SQLite (default) / MySQL
- **Language:** Python 3.x

## Features
- **Task Management:** Create and manage tasks with statuses (pending, in_progress, completed, blocked).
- **Dependency Management:** Define dependencies between tasks.
- **Circular Dependency Detection:** Prevents cycles (e.g., A -> B -> A) using DFS and returns the cycle path.
- **Auto Status Updates:**
    - Task becomes `blocked` if any dependency is `blocked`.
    - Task becomes `in_progress` (ready) only when all dependencies are `completed`.
    - Updates propagate recursively to dependent tasks.

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd "Task Dependency Management System"
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install django djangorestframework django-cors-headers mysqlclient
   ```

4. **Apply migrations:**
   ```bash
   python manage.py migrate
   ```

5. **Run the server:**
   ```bash
   python manage.py runserver
   ```

## API Endpoints

### 1. Add Dependency
**POST** `/api/tasks/{task_id}/dependencies/`

Adds a dependency where `{task_id}` depends on the task specified in the body.

**Request Body:**
```json
{
  "depends_on_id": 5
}
```

**Response (Success - 201):**
```json
{
  "status": "Dependency added"
}
```

**Response (Error - Circular Dependency - 400):**
```json
{
  "error": "Circular dependency detected",
  "path": [1, 5, 2, 1]
}
```

### 2. Update Task Status
**PATCH** `/api/tasks/{task_id}/`

Updates a task's status. Triggers automatic status updates for any dependent tasks.

**Request Body:**
```json
{
  "status": "completed"
}
```

**Response (Success - 200):**
```json
{
  "id": 1,
  "title": "Task A",
  "status": "completed",
  ...
}
```

## Testing

Run the unit tests to verify logic:
```bash
python manage.py test tasks
```
