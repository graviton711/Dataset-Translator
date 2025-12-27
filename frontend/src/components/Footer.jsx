import React from 'react';

export default function Footer({ rowCount, selectedCount }) {
    return (
        <footer className="bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between text-xs text-gray-500 shrink-0">
            <div className="flex items-center gap-4">
                <span id="rowCount">{rowCount} rows</span>
                <span className="text-indigo-600 font-medium" id="selectedCount">{selectedCount} cells targeted</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>System Ready</span>
            </div>
        </footer>
    );
}
