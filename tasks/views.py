from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Task, TaskDependency
from .serializers import TaskDependencySerializer
from .services import detect_cycle

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
            
            # Create dependency
            # Note: The model's clean() method also checks, but we duplicate here 
            # for the specific requirement of returning the path error.
            # We can use get_or_create to avoid duplicates if that's desired, 
            # but requirements didn't specify. Assuming duplicate check in model handles it.
            try:
                TaskDependency.objects.create(task=task, depends_on=depends_on_task)
                return Response({"status": "Dependency added"}, status=status.HTTP_201_CREATED)
            except Exception as e:
                 # Clean failed or unique constraint
                 return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
                 
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
