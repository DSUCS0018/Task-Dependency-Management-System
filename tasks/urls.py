from django.urls import path
from .views import TaskDependencyView

urlpatterns = [
    path('api/tasks/<int:task_id>/dependencies/', TaskDependencyView.as_view(), name='task-dependency'),
]
