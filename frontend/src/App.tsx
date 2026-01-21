import { useState, useEffect } from 'react';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import GraphView from './components/GraphView';
import Layout from './components/Layout';
import { taskService } from './services/api';
import type { Task } from './types';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
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

  const handleRefresh = () => {
    fetchTasks();
  };

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form and List */}
        <div className="lg:col-span-12 xl:col-span-4 space-y-8">
          <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="p-1 rounded bg-indigo-500/20 text-indigo-400">⚡</span>
              New Task
            </h2>
            <TaskForm onTaskAdded={handleTaskAdded} tasks={tasks} />
          </section>

          <section className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="p-1 rounded bg-emerald-500/20 text-emerald-400">📋</span>
              Task List
            </h2>
            <TaskList tasks={tasks} loading={loading} onRefresh={handleRefresh} />
          </section>
        </div>

        {/* Right Column: Visualization */}
        <div className="lg:col-span-12 xl:col-span-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span className="p-1 rounded bg-pink-500/20 text-pink-400">🕸️</span>
            Dependency Graph
          </h2>
          <div className="glass p-1 rounded-xl h-[600px]">
            <GraphView tasks={tasks} />
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default App
