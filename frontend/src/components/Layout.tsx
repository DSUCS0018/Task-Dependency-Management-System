import React from 'react';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans flex flex-col">
            {/* Glassmorphism Header */}
            <header className="sticky top-0 z-50 glass border-b border-white/10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <span className="text-white font-bold text-lg">TD</span>
                        </div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            Task Dependency System
                        </h1>
                    </div>
                    <nav className="flex items-center space-x-4">
                        {/* Placeholder for future nav items or user profile */}
                        <div className="text-sm text-slate-400">v1.0</div>
                    </nav>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-grow container mx-auto px-4 py-8 animate-fade-in">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 py-6 mt-12">
                <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
                    <p>© 2026 Task Dependency System. Built for learning.</p>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
