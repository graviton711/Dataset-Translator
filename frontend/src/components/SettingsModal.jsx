import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Code } from 'lucide-react';

const SettingsModal = ({ onClose }) => {
    const [patterns, setPatterns] = useState([]);
    const [startTag, setStartTag] = useState("");
    const [endTag, setEndTag] = useState("");

    useEffect(() => {
        fetchPatterns();
    }, []);

    const fetchPatterns = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8000/settings/patterns');
            if (res.ok) {
                const data = await res.json();
                setPatterns(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleAdd = async () => {
        if (!startTag || !endTag) return;
        try {
            const res = await fetch('http://127.0.0.1:8000/settings/patterns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ start: startTag, end: endTag })
            });
            if (res.ok) {
                setStartTag("");
                setEndTag("");
                fetchPatterns();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id) => {
        try {
            await fetch(`http://127.0.0.1:8000/settings/patterns/${id}`, { method: 'DELETE' });
            fetchPatterns();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-[600px] max-h-[80vh] flex flex-col animate-scale-in">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Code size={20} className="text-blue-600" />
                        Protected Patterns
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 bg-blue-50 text-sm text-blue-800 border-b">
                    Define start and end tags for content that should <strong>NOT</strong> be translated.
                    Examples: <code>&lt;think&gt;...&lt;/think&gt;</code>, <code>'''...'''</code>.
                </div>

                <div className="p-4 border-b bg-gray-50 flex gap-2">
                    <input
                        className="border rounded px-2 py-1 flex-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Start Tag (e.g. <think>)"
                        value={startTag}
                        onChange={e => setStartTag(e.target.value)}
                    />
                    <input
                        className="border rounded px-2 py-1 flex-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="End Tag (e.g. </think>)"
                        value={endTag}
                        onChange={e => setEndTag(e.target.value)}
                    />
                    <button
                        onClick={handleAdd}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-1"
                    >
                        <Plus size={16} /> Add
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs text-gray-500 border-b">
                                <th className="py-2">Start Tag</th>
                                <th className="py-2">End Tag</th>
                                <th className="py-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {patterns.map(item => (
                                <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors">
                                    <td className="py-2 font-mono text-xs bg-gray-100 px-1 rounded">{item.start}</td>
                                    <td className="py-2 font-mono text-xs bg-gray-100 px-1 rounded">{item.end}</td>
                                    <td className="py-2 text-right">
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="text-red-500 hover:text-red-700 active:scale-90 transition-transform"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {patterns.length === 0 && (
                                <tr>
                                    <td colSpan="3" className="text-center py-8 text-gray-400">
                                        No protected patterns defined.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
