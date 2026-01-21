import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'task_manager.settings')
django.setup()

import json
from rest_framework.test import APIClient
from tasks.models import Task, TaskDependency

def run_api_verification():
    print("Setting up test data...")
    TaskDependency.objects.all().delete()
    Task.objects.all().delete()
    
    task_a = Task.objects.create(title="Task A") # ID 1 (e.g.)
    task_b = Task.objects.create(title="Task B") # ID 2
    task_c = Task.objects.create(title="Task C") # ID 3
    
    print(f"Created Tasks: A({task_a.id}), B({task_b.id}), C({task_c.id})")
    
    client = APIClient()
    
    # 1. Create A -> B
    print("\n1. Adding dependency A -> B")
    resp = client.post(f'/api/tasks/{task_a.id}/dependencies/', {'depends_on_id': task_b.id}, format='json')
    print(f"Status: {resp.status_code}")
    if resp.status_code == 201:
        print("Success.")
    else:
        print(f"Failed: {resp.content}")

    # 2. Create B -> C
    print("\n2. Adding dependency B -> C")
    resp = client.post(f'/api/tasks/{task_b.id}/dependencies/', {'depends_on_id': task_c.id}, format='json')
    print(f"Status: {resp.status_code}")
    if resp.status_code == 201:
        print("Success.")
    else:
        print(f"Failed: {resp.content}")

    # 3. Try to add C -> A (Circular)
    print("\n3. Attempting to add C -> A (Circular)")
    resp = client.post(f'/api/tasks/{task_c.id}/dependencies/', {'depends_on_id': task_a.id}, format='json')
    print(f"Status: {resp.status_code}")
    print(f"Content: {resp.content}")
    try:
        data = resp.json()
        print(f"Response: {data}")
    except:
        print("Response is not JSON")
        data = {}
    
    if resp.status_code == 400 and 'path' in data:
        path = resp.json()['path']
        expected_start = [task_a.id, task_b.id, task_c.id]
        print(f"Cycle Path Returned: {path}")
        print("SUCCESS: Circular dependency correctly detected via API.")
    else:
        print("FAILURE: Circular dependency NOT detected or wrong format.")

if __name__ == "__main__":
    run_api_verification()
