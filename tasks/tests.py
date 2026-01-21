from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from .models import Task, TaskDependency

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
        
        # Path should be [A, B, C, A] (or [C, A, B, C] depending on implementation start)
        # Service implementation:
        # detect_cycle(source=C, target=A)
        # DFS starts at A.
        # A -> B -> C -> A.
        # Returns [C, A, B, C] (Source C prepended to path [A, B, C])
        # Wait, let's trace my service:
        # source=C, target=A
        # stack=[(A, [A])]
        # pop (A, [A]). Not source. Dependencies of A -> B. stack.append((B, [A, B]))
        # pop (B, [A, B]). Not source. Dependencies of B -> C. stack.append((C, [A, B, C]))
        # pop (C, [A, B, C]). Is source (C==C).
        # return True, [source] + path  => [C, A, B, C]
        
        detected_path = response_data['path']
        # We just check the set of IDs or exact sequence for correctness
        self.assertEqual(detected_path, [self.task_c.id, self.task_a.id, self.task_b.id, self.task_c.id])

