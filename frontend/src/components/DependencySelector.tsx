import React, { useState, useEffect } from 'react';
import type { Task } from '../types';
import { taskService } from '../services/api';

interface DependencySelectorProps {
    currentTaskId: number;
    onDependencyAdded: () => void;
}

const DependencySelector: React.FC<DependencySelectorProps> = ({ currentTaskId, onDependencyAdded }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedTaskId, setSelectedTaskId] = useState<number | ''>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        loadTasks();
    }, [currentTaskId]);

    const loadTasks = async () => {
        try {
            const data = await taskService.getTasks();
            setTasks(data.filter(t => t.id !== currentTaskId));
        } catch (err) {
            console.error('Failed to load tasks', err);
        }
    };

    const handleAdd = async () => {
        if (!selectedTaskId) return;

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await taskService.addDependency(currentTaskId, Number(selectedTaskId));
            setSuccess('Linked!');
            setSelectedTaskId('');
            onDependencyAdded();
            setTimeout(() => setSuccess(null), 2000);
        } catch (err: any) {
            if (err.error) {
                let msg = err.error;
                if (err.path && Array.isArray(err.path)) {
                    msg += ` Cycle: ${err.path.join(' → ')}`;
                }
                setError(msg);
            } else {
                setError('Failed to link.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-4 pt-4 border-t border-white/5">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Add Blocking Task
            </h4>

            {error && (
                <div className="mb-2 text-xs text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-2 text-xs text-emerald-400 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                    {success}
                </div>
            )}

            <div className="flex gap-2">
                <select
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(Number(e.target.value))}
                    className="flex-1 text-sm bg-slate-900/50 border border-slate-700 text-slate-300 rounded-lg focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 py-1.5 px-3 transition-colors"
                    disabled={loading}
                >
                    <option value="">Select dependency...</option>
                    {tasks.map(task => (
                        <option key={task.id} value={task.id} className="bg-slate-800">
                            #{task.id}: {task.title}
                        </option>
                    ))}
                </select>
                <button
                    onClick={handleAdd}
                    disabled={!selectedTaskId || loading}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                        ${loading || !selectedTaskId
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20'}
                    `}
                >
                    {loading ? '...' : 'Link'}
                </button>
            </div>
        </div>
    );
};

export default DependencySelector;
