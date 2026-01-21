from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from .models import Task, TaskDependency
from .services import update_task_status

class TaskDependencyViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.task_a = Task.objects.create(title="Task A")
        self.task_b = Task.objects.create(title="Task B")
        self.task_c = Task.objects.create(title="Task C")

    def test_create_dependency_success(self):
        """Helper to create A->B"""
        url = f'/api/tasks/{self.task_a.id}/dependencies/'
        data = {'depends_on_id': self.task_b.id}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(TaskDependency.objects.filter(task=self.task_a, depends_on=self.task_b).exists())

    def test_circular_dependency_detection(self):
        # Setup A->B->C
        TaskDependency.objects.create(task=self.task_a, depends_on=self.task_b)
        TaskDependency.objects.create(task=self.task_b, depends_on=self.task_c)

        # Attempt C->A
        url = f'/api/tasks/{self.task_c.id}/dependencies/'
        data = {'depends_on_id': self.task_a.id}
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response_data = response.json()
        self.assertIn('error', response_data)
        self.assertEqual(response_data['error'], 'Circular dependency detected')
        self.assertIn('path', response_data)
        
        detected_path = response_data['path']
        self.assertEqual(detected_path, [self.task_c.id, self.task_a.id, self.task_b.id, self.task_c.id])

class TaskStatusUpdateTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.task_a = Task.objects.create(title="Task A", status='pending') # Depends on B
        self.task_b = Task.objects.create(title="Task B", status='pending') 
        TaskDependency.objects.create(task=self.task_a, depends_on=self.task_b)

    def test_status_update_all_completed(self):
        # Initial: A is pending because B is pending
        self.assertEqual(self.task_a.status, 'pending')
        
        # Complete B via API (triggering propagation)
        url = f'/api/tasks/{self.task_b.id}/'
        data = {'status': 'completed'}
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Reload A
        self.task_a.refresh_from_db()
        # A should be 'in_progress' because all dependencies (B) are completed
        self.assertEqual(self.task_a.status, 'in_progress')

    def test_status_update_blocked(self):
        # Block B via API
        url = f'/api/tasks/{self.task_b.id}/'
        data = {'status': 'blocked'}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Reload A
        self.task_a.refresh_from_db()
        # A should be 'blocked'
        self.assertEqual(self.task_a.status, 'blocked')

    def test_propagation_chain(self):
        # A -> B -> C
        self.task_c = Task.objects.create(title="Task C", status='pending')
        TaskDependency.objects.create(task=self.task_b, depends_on=self.task_c)
        
        # Setup: All pending
        
        # 1. Complete C
        url = f'/api/tasks/{self.task_c.id}/'
        self.client.patch(url, {'status': 'completed'}, format='json')
        
        # Check B
        self.task_b.refresh_from_db()
        self.assertEqual(self.task_b.status, 'in_progress') # Ready because C done
        
        # Check A
        self.task_a.refresh_from_db()
        self.assertEqual(self.task_a.status, 'pending') # Only B is in_progress, not completed
        
        # 2. Complete B
        url = f'/api/tasks/{self.task_b.id}/'
        self.client.patch(url, {'status': 'completed'}, format='json')
        
        # Check A
        self.task_a.refresh_from_db()
        self.assertEqual(self.task_a.status, 'in_progress') # Ready because B done

    def test_propagation_blocked_chain(self):
        # A -> B -> C
        self.task_c = Task.objects.create(title="Task C", status='pending')
        TaskDependency.objects.create(task=self.task_b, depends_on=self.task_c)
        
        # Block C
        url = f'/api/tasks/{self.task_c.id}/'
        self.client.patch(url, {'status': 'blocked'}, format='json')
        
        # Check B (should be blocked)
        self.task_b.refresh_from_db()
        self.assertEqual(self.task_b.status, 'blocked')
        
        # Check A (should be blocked because B is blocked)
        self.task_a.refresh_from_db()
        self.assertEqual(self.task_a.status, 'blocked')
