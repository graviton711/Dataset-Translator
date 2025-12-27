import React from 'react';

export default function Grid({
    data,
    columns,
    selectedRows,
    selectedCols,
    selectedCells,
    expandedCells,
    onToggleRow,
    onToggleCol,
    onToggleCell,
    onToggleMaster,
    onToggleExpand
}) {
    const isMasterChecked = data.length > 0 && selectedRows.size === data.length && selectedCols.size === columns.length;

    return (
        <main className="flex-1 overflow-auto relative bg-white" id="gridContainer">
            <table className="w-full border-collapse min-w-[1000px]">
                <thead className="bg-gray-50 text-gray-500 font-medium text-left text-xs uppercase tracking-wider">
                    <tr>
                        <th className="grid-header-checkbox p-0 border-b border-r border-gray-200 w-12 min-w-[48px] h-10 text-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                            <input
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                id="masterCheckbox"
                                type="checkbox"
                                checked={isMasterChecked}
                                onChange={onToggleMaster}
                            />
                        </th>
                        {columns.map(col => (
                            <th
                                key={col.key}
                                className={`grid-header-cell px-4 py-3 border-b border-r border-gray-200 text-xs font-semibold text-gray-600 bg-gray-50 cursor-pointer hover:bg-gray-100 select-none transition-colors ${selectedCols.has(col.key) ? 'col-selected border-b-indigo-400' : ''}`}
                                style={{ width: col.width }}
                                onClick={() => onToggleCol(col.key)}
                            >
                                <div className="flex items-center justify-between">
                                    <span>{col.label}</span>
                                    {col.editable && <span className="material-symbols-outlined text-[14px] text-gray-400">translate</span>}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100" id="tableBody">
                    {data.length === 0 ? (
                        <tr className="text-center text-gray-500 mt-10">
                            <td colSpan={columns.length + 1} className="py-10">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-4xl text-gray-300">table_view</span>
                                    <p>No dataset loaded. Please upload a file.</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        data.map((row, index) => (
                            <tr key={row.id || index} className={`hover:bg-gray-50 group transition-colors ${selectedRows.has(index) ? 'bg-indigo-50' : ''}`}>
                                <td className="grid-row-checkbox border-b border-r border-gray-200 text-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] bg-white group-hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        checked={selectedRows.has(index)}
                                        onChange={() => onToggleRow(index)}
                                    />
                                </td>
                                {columns.map(col => {
                                    const cellId = `${index}-${col.key}`;
                                    const isSelected = selectedCells.has(cellId) || selectedRows.has(index) || selectedCols.has(col.key);
                                    const isExpanded = expandedCells.has(cellId);
                                    const cellValue = row[col.key];

                                    // Simple logic to detect "translated" state for visual flair (Vietnamese characters)
                                    const isTranslated = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(cellValue + "");

                                    return (
                                        <td
                                            key={col.key}
                                            className={`px-4 py-2 border-b border-r border-gray-200 text-sm ${isExpanded ? 'whitespace-pre-wrap break-words' : 'truncate max-w-xs'} cursor-text relative ${isSelected ? 'cell-selected text-indigo-900' : 'text-gray-700'} ${isTranslated && col.key !== 'id' ? 'italic text-green-700' : ''}`}
                                            title={cellValue}
                                            onClick={(e) => {
                                                if (!e.shiftKey && !e.ctrlKey) {
                                                    onToggleCell(index, col.key);
                                                }
                                            }}
                                            onDoubleClick={() => onToggleExpand(cellId)}
                                        >
                                            {cellValue}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </main>
    );
}
