import React from 'react';

const TextView = ({ data, onToggleRow, selectedRows }) => {
    return (
        <div className="flex-1 overflow-auto bg-white p-4">
            <div className="max-w-4xl mx-auto bg-white shadow-sm border rounded-lg overflow-hidden">
                {data.map((row, idx) => (
                    <div
                        key={idx}
                        className={`flex border-b last:border-b-0 hover:bg-blue-50 transition-colors ${selectedRows.has(idx) ? 'bg-blue-50' : ''}`}
                    >
                        <div className="w-12 bg-gray-50 border-r p-2 text-right text-xs text-gray-400 select-none flex items-start justify-end gap-2">
                            <input
                                type="checkbox"
                                checked={selectedRows.has(idx)}
                                onChange={() => onToggleRow(idx)}
                                className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            {row.line}
                        </div>
                        <div className="flex-1 p-2 text-sm text-gray-800 whitespace-pre-wrap font-mono">
                            {row.content}
                        </div>
                    </div>
                ))}
                {data.length === 0 && (
                    <div className="p-8 text-center text-gray-400">
                        No text content available
                    </div>
                )}
            </div>
        </div>
    );
};

export default TextView;
