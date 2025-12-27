import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Toolbar from './components/Toolbar';
import Grid from './components/Grid';
import Footer from './components/Footer';
import GlossaryModal from './components/GlossaryModal';

import SettingsModal from './components/SettingsModal';

import JsonView from './components/JsonView';
import TextView from './components/TextView';

function App() {
  const [tableData, setTableData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [datasetId, setDatasetId] = useState(null);
  const [fileType, setFileType] = useState('csv'); // csv, json, txt

  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectedCols, setSelectedCols] = useState(new Set());
  const [selectedCells, setSelectedCells] = useState(new Set());
  const [expandedCells, setExpandedCells] = useState(new Set());
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLang, setTargetLang] = useState('vi');

  const [taskId, setTaskId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [taskStatus, setTaskStatus] = useState('idle'); // idle, running, paused, completed
  const [notification, setNotification] = useState(null);

  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Polling for progress
  useEffect(() => {
    let interval;
    if (taskId && (taskStatus === 'running' || taskStatus === 'paused')) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`http://127.0.0.1:8000/progress/${taskId}`);
          if (response.ok) {
            const data = await response.json();
            const pct = data.total_items > 0 ? (data.processed_items / data.total_items) * 100 : 0;
            setProgress(pct);

            // Real-time update: Fetch data while running
            if (data.status === 'running' || taskStatus === 'running') {
              fetchDatasetData(datasetId);
            }

            if (data.status === 'completed') {
              setTaskStatus('completed');
              setIsTranslating(false);
              setTaskId(null);
              clearInterval(interval);
              setNotification("Translation completed!");
              fetchDatasetData(datasetId); // Refresh data
            } else if (data.status !== taskStatus) {
              // Sync status if changed externally or by action
              setTaskStatus(data.status);
            }
          }
        } catch (error) {
          console.error("Poll error:", error);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [taskId, taskStatus, datasetId]);

  // Stats
  const rowCount = tableData.length;
  const selectedCount = (selectedRows.size * columns.length) +
    (selectedCols.size * (tableData.length - selectedRows.size)) +
    selectedCells.size; // Approximation

  // --- Selection Logic ---
  const toggleRowSelection = (index) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  const toggleColumnSelection = (key) => {
    const newSelected = new Set(selectedCols);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedCols(newSelected);
  };

  const toggleCellSelection = (rowIndex, colKey) => {
    const cellId = `${rowIndex}-${colKey}`;
    const newSelected = new Set(selectedCells);
    if (newSelected.has(cellId)) {
      newSelected.delete(cellId);
    } else {
      newSelected.add(cellId);
    }
    setSelectedCells(newSelected);
  };

  const toggleMasterCheckbox = () => {
    if (selectedRows.size === tableData.length && selectedCols.size === columns.length) {
      clearSelection();
    } else {
      selectAll();
    }
  };

  const selectAll = () => {
    const allRows = new Set(tableData.map((_, idx) => idx));
    const allCols = new Set(columns.map(col => col.key));
    setSelectedRows(allRows);
    setSelectedCols(allCols);
  };

  const clearSelection = () => {
    setSelectedRows(new Set());
    setSelectedCols(new Set());
    setSelectedCells(new Set());
    setExpandedCells(new Set());
  };

  const toggleCellExpand = (cellId) => {
    setExpandedCells(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cellId)) {
        newSet.delete(cellId);
      } else {
        newSet.add(cellId);
      }
      return newSet;
    });
  };

  // --- Actions ---
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Reset state
      setTableData([]);
      clearSelection();
      setExpandedCells(new Set());

      const response = await fetch('http://127.0.0.1:8000/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      console.log("Upload response:", data);
      const datasetId = data.dataset_id;

      // Store datasetId in state
      setDatasetId(datasetId);
      setFileType(data.file_type || 'csv');

      // Update columns from backend
      if (data.columns) {
        console.log("Setting columns:", data.columns);
        setColumns(data.columns);
      }

      // Fetch initial data
      console.log("Fetching data for ID:", datasetId);
      await fetchDatasetData(datasetId);

      // Auto-select all after data is loaded
      setSelectedRows(new Set(tableData.map((_, idx) => idx)));
      setSelectedCols(new Set(columns.map(col => col.key)));

    } catch (error) {
      console.error("Upload error:", error);
      setNotification('Error uploading file: ' + error.message);
    }
  };

  const fetchDatasetData = async (id) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/dataset/${id}?limit=1000`);
      if (!response.ok) throw new Error('Fetch failed');

      const result = await response.json();
      console.log("Fetch result:", result);

      if (result.data) {
        setTableData(result.data);
        return result.data;
      } else {
        console.warn("No data received from backend");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setNotification('Error fetching data');
    }
  };

  const startTranslation = async () => {
    if (!datasetId) {
      setNotification("Please upload a dataset first.");
      return;
    }

    const targets = [];
    let rowsToSend = Array.from(selectedRows);
    const colsToSend = Array.from(selectedCols);

    if (colsToSend.length > 0 && rowsToSend.length === 0 && selectedCells.size === 0) {
      rowsToSend = tableData.map((_, idx) => idx);
    }

    selectedCells.forEach(cellId => {
      const [r, c] = cellId.split('-');
      if (!selectedRows.has(parseInt(r))) rowsToSend.push(parseInt(r));
      if (!selectedCols.has(c)) colsToSend.push(c);
    });

    const uniqueRows = [...new Set(rowsToSend)];
    const uniqueCols = [...new Set(colsToSend)];

    if (uniqueRows.length === 0 || uniqueCols.length === 0) {
      setNotification("Please select rows and columns to translate.");
      return;
    }

    setIsTranslating(true);
    setTaskStatus('running');
    setProgress(0);

    try {
      const response = await fetch('http://127.0.0.1:8000/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataset_id: datasetId,
          rows: uniqueRows,
          columns: uniqueCols
        })
      });

      const data = await response.json();
      setTaskId(data.task_id);

    } catch (error) {
      console.error(error);
      setNotification("Translation failed: " + error.message);
      setIsTranslating(false);
      setTaskStatus('idle');
    }
  };

  const pauseTranslation = async () => {
    if (!taskId) return;
    try {
      await fetch(`http://127.0.0.1:8000/pause/${taskId}`, { method: 'POST' });
      setTaskStatus('paused');
      setIsTranslating(false);
    } catch (e) {
      console.error(e);
    }
  };

  const resumeTranslation = async () => {
    if (!taskId) return;
    try {
      await fetch(`http://127.0.0.1:8000/resume/${taskId}`, { method: 'POST' });
      setTaskStatus('running');
      setIsTranslating(true);
    } catch (e) {
      console.error(e);
    }
  };

  const downloadDataset = () => {
    if (!datasetId) {
      setNotification("No dataset to export.");
      return;
    }
    window.location.href = `http://127.0.0.1:8000/export/${datasetId}`;
  };

  const handleUndo = async () => {
    if (!datasetId) return;
    try {
      const response = await fetch(`http://127.0.0.1:8000/undo/${datasetId}`, { method: 'POST' });
      if (response.ok) {
        setNotification("Undo successful");
        fetchDatasetData(datasetId);
      } else {
        setNotification("Nothing to undo");
      }
    } catch (e) {
      console.error(e);
      setNotification("Undo failed");
    }
  };

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter data based on search term (Memoized)
  const filteredData = React.useMemo(() => {
    if (!debouncedSearchTerm) return tableData;
    const term = debouncedSearchTerm.toLowerCase();
    return tableData.filter(row => {
      return Object.values(row).some(val =>
        val !== null && val !== undefined && String(val).toLowerCase().includes(term)
      );
    });
  }, [tableData, debouncedSearchTerm]);

  return (
    <div className="bg-gray-50 h-screen flex flex-col overflow-hidden text-sm text-slate-700 font-inter relative">
      <Header
        onUpload={handleFileUpload}
        onExport={downloadDataset}
        onTranslate={startTranslation}
        isTranslating={isTranslating}
        targetLang={targetLang}
        setTargetLang={setTargetLang}
        progress={progress}
        taskStatus={taskStatus}
        onPause={pauseTranslation}
        onResume={resumeTranslation}
        onOpenGlossary={() => setIsGlossaryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <Toolbar
        onSelectAll={selectAll}
        onClearSelection={clearSelection}
        onUndo={handleUndo}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {fileType === 'json' ? (
        <JsonView
          data={filteredData}
          onToggleRow={toggleRowSelection}
          selectedRows={selectedRows}
        />
      ) : fileType === 'txt' ? (
        <TextView
          data={filteredData}
          onToggleRow={toggleRowSelection}
          selectedRows={selectedRows}
        />
      ) : (
        <Grid
          data={filteredData}
          columns={columns}
          selectedRows={selectedRows}
          selectedCols={selectedCols}
          selectedCells={selectedCells}
          expandedCells={expandedCells}
          onToggleRow={toggleRowSelection}
          onToggleCol={toggleColumnSelection}
          onToggleCell={toggleCellSelection}
          onToggleMaster={toggleMasterCheckbox}
          onToggleExpand={toggleCellExpand}
        />
      )}

      <Footer
        rowCount={rowCount}
        selectedCount={selectedCount}
      />

      {/* Toast Notification */}
      {notification && (
        <div className="absolute bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded shadow-lg transition-opacity duration-300 z-50">
          {notification}
        </div>
      )}

      {/* Glossary Modal */}
      {isGlossaryOpen && (
        <GlossaryModal onClose={() => setIsGlossaryOpen(false)} />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  );
}

export default App;
