import React from 'react';
import { Upload, Download, Play, Pause, Book, Settings } from 'lucide-react';

const Header = ({
    onUpload,
    onExport,
    onTranslate,
    isTranslating,
    targetLang,
    setTargetLang,
    progress,
    taskStatus,
    onPause,
    onResume,
    onOpenGlossary,
    onOpenSettings
}) => {
    return (
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-3">
                <div className="bg-blue-600 text-white p-1.5 rounded-md shadow-sm">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 8l6 6" />
                        <path d="M4 14h6" />
                        <path d="M2 5h12" />
                        <path d="M7 2h1" />
                        <path d="M22 22l-5-10-5 10" />
                        <path d="M14 18h6" />
                    </svg>
                </div>
                <h1 className="font-semibold text-lg text-gray-800 tracking-tight">Dataset Translator</h1>
            </div>

            <div className="flex items-center gap-3">
                {/* Progress Bar */}
                {(taskStatus === 'running' || taskStatus === 'paused') && (
                    <div className="flex items-center gap-2 mr-4 animate-fade-in">
                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-300 ${taskStatus === 'paused' ? 'bg-yellow-500' : 'bg-blue-500'}`}
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <span className="text-xs font-medium text-gray-600">{Math.round(progress)}%</span>
                    </div>
                )}

                <button
                    onClick={onOpenGlossary}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-all active:scale-95"
                >
                    <Book size={16} />
                    Glossary
                </button>

                <button
                    onClick={onOpenSettings}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-all active:scale-95"
                >
                    <Settings size={16} />
                    Settings
                </button>

                <div className="h-6 w-px bg-gray-300 mx-1"></div>

                <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-all active:scale-95 border border-gray-200 select-none">
                    <Upload size={16} />
                    <span>Upload</span>
                    <input type="file" className="hidden" accept=".csv,.xlsx,.xls" onChange={onUpload} />
                </label>

                <button
                    onClick={onExport}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-all active:scale-95 border border-gray-200"
                >
                    <Download size={16} />
                    Export
                </button>

                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-md">
                    <span className="text-xs font-medium text-gray-500 px-2">Target:</span>
                    <select
                        className="bg-transparent text-sm font-medium text-gray-800 focus:outline-none cursor-pointer"
                        value={targetLang}
                        onChange={(e) => setTargetLang(e.target.value)}
                    >
                        <option value="vi">Vietnamese</option>
                        <option value="en">English</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="ja">Japanese</option>
                        <option value="ko">Korean</option>
                        <option value="zh">Chinese</option>
                    </select>
                </div>

                {isTranslating ? (
                    taskStatus === 'paused' ? (
                        <button
                            onClick={onResume}
                            className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm transition-all hover:shadow active:scale-95"
                        >
                            <Play size={16} />
                            Resume
                        </button>
                    ) : (
                        <button
                            onClick={onPause}
                            className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 rounded-md shadow-sm transition-all hover:shadow active:scale-95"
                        >
                            <Pause size={16} />
                            Pause
                        </button>
                    )
                ) : (
                    <button
                        onClick={onTranslate}
                        className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-all hover:shadow active:scale-95"
                    >
                        <Play size={16} />
                        Translate
                    </button>
                )}
            </div>
        </div>
    );
};

export default Header;
