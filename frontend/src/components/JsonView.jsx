import React from 'react';

const JsonView = ({ data, onToggleRow, selectedRows }) => {
    return (
        <div className="flex-1 overflow-auto bg-white">
            <table className="w-full border-collapse text-sm">
                <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th className="w-10 p-2 border-b">
                            {/* Checkbox logic handled by parent if needed, or per-row */}
                        </th>
                        <th className="p-2 border-b text-left font-medium text-gray-600 w-1/3">Key (Path)</th>
                        <th className="p-2 border-b text-left font-medium text-gray-600">Value</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, idx) => (
                        <tr key={idx} className="border-b hover:bg-blue-50 transition-colors">
                            <td className="p-2 text-center">
                                <input
                                    type="checkbox"
                                    checked={selectedRows.has(idx)}
                                    onChange={() => onToggleRow(idx)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                            </td>
                            <td className="p-2 font-mono text-xs text-blue-600 align-top break-all">
                                {row.key}
                            </td>
                            <td className="p-2 text-gray-800 align-top">
                                {row.value}
                            </td>
                        </tr>
                    ))}
                    {data.length === 0 && (
                        <tr>
                            <td colSpan="3" className="p-8 text-center text-gray-400">
                                No data available
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default JsonView;
