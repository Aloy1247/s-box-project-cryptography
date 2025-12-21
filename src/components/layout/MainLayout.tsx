import type { ReactNode } from 'react';

interface MainLayoutProps {
    leftSidebar: ReactNode;
    center: ReactNode;
    rightSidebar: ReactNode;
}

export function MainLayout({ leftSidebar, center, rightSidebar }: MainLayoutProps) {
    return (
        <div className="flex flex-1 min-h-0 h-full">
            {/* Left Sidebar - Selection */}
            <aside className="w-80 flex-none flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm relative pt-28 pb-16">
                {leftSidebar}
            </aside>

            {/* Center - Construction Workspace */}
            <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50/50 dark:bg-black/20 pt-28 pb-16">
                {center}
            </main>

            {/* Right Sidebar - Analysis */}
            <aside className="w-80 flex-none flex flex-col border-l border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden pt-28 pb-16">
                {rightSidebar}
            </aside>
        </div>
    );
}
