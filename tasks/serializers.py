from rest_framework import serializers
from .models import Task, TaskDependency

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'

class TaskDependencySerializer(serializers.Serializer):
    depends_on_id = serializers.IntegerField()
