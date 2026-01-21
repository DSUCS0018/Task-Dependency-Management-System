from django.db import models
from django.core.exceptions import ValidationError

class Task(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('blocked', 'Blocked'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class TaskDependency(models.Model):
    task = models.ForeignKey(Task, related_name='dependencies', on_delete=models.CASCADE)
    depends_on = models.ForeignKey(Task, related_name='dependents', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['task', 'depends_on'], name='unique_dependency')
        ]
        indexes = [
            models.Index(fields=['task', 'depends_on']),
        ]

    def clean(self):
        if self.task == self.depends_on:
            raise ValidationError("A task cannot depend on itself.")
        
        # Check for circular dependency
        # This is a simple recursive check. For very large graphs, this might be slow,
        # but for typical task lists it's acceptable.
        if self.task_id and self.depends_on_id:
             if self.check_circular(self.depends_on, self.task):
                raise ValidationError(f"Circular dependency detected: {self.task} -> ... -> {self.depends_on} -> {self.task}")

    def check_circular(self, current_task, target_task, visited=None):
        if visited is None:
            visited = set()
        
        if current_task == target_task:
            return True
        
        visited.add(current_task)
        
        # We need to look at what 'current_task' depends on.
        # current_task.dependencies gives us TaskDependency objects where task=current_task.
        # We want the 'depends_on' field of those objects.
        for dependency in current_task.dependencies.all():
            next_task = dependency.depends_on
            if next_task in visited:
                continue
            if self.check_circular(next_task, target_task, visited):
                return True
        return False

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.task.title} depends on {self.depends_on.title}"
