import { useState, useEffect } from 'react';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import GraphView from './components/GraphView';
import { taskService } from './services/api';
import type { Task } from './types';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  // We need tasks in App to pass to GraphView, so we might need to hoist state or fetch twice.
  // Fetching twice is simpler for now to keep components decoupled, or we can move fetch to App.
  // Let's move fetch to App to avoid double network requests and keep sync.
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await taskService.getTasks();
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [refreshKey]);

  const handleTaskAdded = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Refetch when status changes in list (we can pass this down)
  const handleRefresh = () => {
    fetchTasks();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Task Manager
        </h1>
        <TaskForm onTaskAdded={handleTaskAdded} />

        {/* Pass tasks to List and Graph */}
        <div className="space-y-8">
          <TaskList tasks={tasks} loading={loading} onRefresh={handleRefresh} />
          <GraphView tasks={tasks} />
        </div>
      </div>
    </div>
  )
}

export default App
