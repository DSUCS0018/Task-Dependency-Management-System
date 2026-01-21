from django.urls import path
from .views import TaskDependencyView, TaskDetailView

urlpatterns = [
    path('api/tasks/<int:task_id>/dependencies/', TaskDependencyView.as_view(), name='task-dependency'),
    path('api/tasks/<int:task_id>/', TaskDetailView.as_view(), name='task-detail'),
]
