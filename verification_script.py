import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'task_manager.settings')
django.setup()

from tasks.models import Task, TaskDependency
from django.core.exceptions import ValidationError

def run_verification():
    print("Creating tasks...")
    # Clear existing data for clean run
    TaskDependency.objects.all().delete()
    Task.objects.all().delete()

    task_a = Task.objects.create(title="Task A", status="pending")
    task_b = Task.objects.create(title="Task B", status="pending")
    task_c = Task.objects.create(title="Task C", status="pending")
    print(f"Tasks created: {task_a}, {task_b}, {task_c}")

    print("Creating valid dependency A -> B")
    TaskDependency.objects.create(task=task_a, depends_on=task_b)
    print("Dependency A -> B created.")

    print("Creating valid dependency B -> C")
    TaskDependency.objects.create(task=task_b, depends_on=task_c)
    print("Dependency B -> C created.")

    print("Attempting to create circular dependency C -> A (should fail)")
    try:
        # This should fail because A->B->C, so adding C->A creates a cycle
        dep = TaskDependency(task=task_c, depends_on=task_a)
        dep.save()
        print("ERROR: Circular dependency C -> A was incorrectly allowed!")
    except ValidationError as e:
        print(f"SUCCESS: Circular dependency caught: {e}")
    except Exception as e:
        print(f"ERROR: Unexpected exception: {e}")

    # Verify self-dependency
    print("Attempting to create self dependency A -> A (should fail)")
    try:
        dep = TaskDependency(task=task_a, depends_on=task_a)
        dep.save()
        print("ERROR: Self dependency A -> A was incorrectly allowed!")
    except ValidationError as e:
        print(f"SUCCESS: Self dependency caught: {e}")

if __name__ == "__main__":
    run_verification()
