import React, { useState } from 'react';
import { taskService } from '../services/api';
import type { Task } from '../types';

interface TaskFormProps {
    onTaskAdded: () => void;
    tasks?: Task[]; // support tasks prop if passed, though unused in form logic directly
}

const TaskForm: React.FC<TaskFormProps> = ({ onTaskAdded }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        try {
            setIsSubmitting(true);
            setError(null);
            setSuccess(null);
            await taskService.createTask(title, description);
            setTitle('');
            setDescription('');
            setSuccess('Task created successfully!');
            onTaskAdded();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            console.error('Task Creation Error:', err);
            const errorMessage = err.response?.data?.error || err.message || 'Failed to create task.';
            setError(`Error: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="glass-card p-6 rounded-xl relative overflow-hidden transition-all duration-300 hover:shadow-primary/10">
            {error && (
                <div className="mb-4 p-3 bg-red-500/10 text-red-400 rounded-lg text-sm border border-red-500/20 animate-fade-in">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm border border-emerald-500/20 animate-fade-in">
                    {success}
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-1">
                        Task Title
                    </label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 placeholder-slate-500 transition-all"
                        placeholder="e.g. Learn React Hooks"
                        required
                        disabled={isSubmitting}
                    />
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">
                        Description <span className="text-slate-500 text-xs">(optional)</span>
                    </label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 placeholder-slate-500 transition-all resize-none"
                        placeholder="Add some details..."
                        rows={3}
                        disabled={isSubmitting}
                    />
                </div>

                <div className="pt-2 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting || !title.trim()}
                        className={`
                            px-6 py-2 rounded-lg font-medium text-white shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95
                            ${isSubmitting || !title.trim()
                                ? 'bg-slate-700 cursor-not-allowed opacity-50'
                                : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 hover:shadow-indigo-500/40'}
                        `}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating...
                            </span>
                        ) : 'Create Task'}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default TaskForm;
