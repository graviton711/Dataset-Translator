import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus } from 'lucide-react';

const GlossaryModal = ({ onClose }) => {
    const [terms, setTerms] = useState([]);
    const [newTerm, setNewTerm] = useState("");
    const [newTrans, setNewTrans] = useState("");
    const [newType, setNewType] = useState("pre");

    useEffect(() => {
        fetchTerms();
    }, []);

    const fetchTerms = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8000/glossary');
            if (res.ok) {
                const data = await res.json();
                setTerms(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleAdd = async () => {
        if (!newTerm || !newTrans) return;
        try {
            const res = await fetch('http://127.0.0.1:8000/glossary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ term: newTerm, translation: newTrans, type: newType })
            });
            if (res.ok) {
                setNewTerm("");
                setNewTrans("");
                fetchTerms();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id) => {
        try {
            await fetch(`http://127.0.0.1:8000/glossary/${id}`, { method: 'DELETE' });
            fetchTerms();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-[800px] max-h-[80vh] flex flex-col animate-scale-in">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-lg font-semibold">Custom Glossary</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 border-b bg-gray-50 flex gap-2">
                    <input
                        className="border rounded px-2 py-1 flex-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Term (e.g. Prompt)"
                        value={newTerm}
                        onChange={e => setNewTerm(e.target.value)}
                    />
                    <input
                        className="border rounded px-2 py-1 flex-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Translation (e.g. Lời nhắc)"
                        value={newTrans}
                        onChange={e => setNewTrans(e.target.value)}
                    />
                    <select
                        className="border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={newType}
                        onChange={e => setNewType(e.target.value)}
                    >
                        <option value="pre">Pre-translate (Protect/Replace)</option>
                        <option value="post">Post-translate (Correct)</option>
                    </select>
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
                                <th className="py-2">Term</th>
                                <th className="py-2">Translation</th>
                                <th className="py-2">Type</th>
                                <th className="py-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {terms.map(item => (
                                <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors">
                                    <td className="py-2">{item.term}</td>
                                    <td className="py-2">{item.translation}</td>
                                    <td className="py-2">
                                        <span className={`text-xs px-2 py-0.5 rounded ${item.type === 'pre' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                            {item.type === 'pre' ? 'Pre' : 'Post'}
                                        </span>
                                    </td>
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
                            {terms.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="text-center py-8 text-gray-400">
                                        No terms added yet.
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

export default GlossaryModal;
