import React from 'react';
import { CheckSquare, Square, RotateCcw, Search } from 'lucide-react';

const Toolbar = ({ onSelectAll, onClearSelection, onUndo, searchTerm, setSearchTerm }) => {
    return (
        <div className="bg-white border-b px-4 py-2 flex items-center gap-4 shadow-sm">
            <div className="flex items-center gap-2">
                <button
                    onClick={onSelectAll}
                    className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:bg-gray-100 px-2 py-1.5 rounded transition-all active:scale-95"
                >
                    <CheckSquare size={14} />
                    Select All
                </button>
                <button
                    onClick={onClearSelection}
                    className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:bg-gray-100 px-2 py-1.5 rounded transition-all active:scale-95"
                >
                    <Square size={14} />
                    Clear
                </button>
            </div>

            <div className="h-4 w-px bg-gray-300 mx-2"></div>

            <button
                onClick={onUndo}
                className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:bg-gray-100 px-2 py-1.5 rounded transition-all active:scale-95"
                title="Undo last translation"
            >
                <RotateCcw size={14} />
                Undo
            </button>

            <div className="flex-1"></div>

            <div className="relative">
                <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 transition-all focus:w-64"
                />
            </div>
        </div>
    );
};

export default Toolbar;
