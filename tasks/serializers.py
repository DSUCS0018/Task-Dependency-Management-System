from rest_framework import serializers
from .models import Task, TaskDependency

class TaskSerializer(serializers.ModelSerializer):
    dependencies = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = '__all__'

    def get_dependencies(self, obj):
        return list(obj.dependencies.values_list('depends_on_id', flat=True))

class TaskDependencySerializer(serializers.Serializer):
    depends_on_id = serializers.IntegerField()
