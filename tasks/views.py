from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Task, TaskDependency
from .serializers import TaskDependencySerializer, TaskSerializer
from .services import detect_cycle, trigger_dependent_updates

class TaskDependencyView(APIView):
    def post(self, request, task_id):
        task = get_object_or_404(Task, id=task_id)
        serializer = TaskDependencySerializer(data=request.data)
        
        if serializer.is_valid():
            depends_on_id = serializer.validated_data['depends_on_id']
            depends_on_task = get_object_or_404(Task, id=depends_on_id)
            
            # Check for circular dependency
            is_circular, path = detect_cycle(task.id, depends_on_task.id)
            
            if is_circular:
                return Response({
                    "error": "Circular dependency detected",
                    "path": path
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                TaskDependency.objects.create(task=task, depends_on=depends_on_task)
                
                # New dependency might affect the task's status immediately
                # e.g. if the new dependency is blocked, this task becomes blocked.
                from .services import update_task_status
                update_task_status(task)
                
                return Response({"status": "Dependency added"}, status=status.HTTP_201_CREATED)
            except Exception as e:
                 return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
                 
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TaskListView(APIView):
    def get(self, request):
        tasks = Task.objects.all()
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = TaskSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TaskDetailView(APIView):
    def patch(self, request, task_id):
        task = get_object_or_404(Task, id=task_id)
        serializer = TaskSerializer(task, data=request.data, partial=True)
        
        if serializer.is_valid():
            task = serializer.save()
            
            # Trigger updates for dependent tasks
            trigger_dependent_updates(task)
            
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, task_id):
        task = get_object_or_404(Task, id=task_id)
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
