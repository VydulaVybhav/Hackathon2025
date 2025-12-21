import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { X, Code2, Download, Copy, Check, PanelRightClose, PanelRight, Database, GitCommit, FolderTree, GitCompare, Terminal as TerminalIcon } from 'lucide-react';
import EditorAnnotations from './EditorAnnotations';
import AccuracyScore from './AccuracyScore';
import DiffViewer from './DiffViewer';
import { GitFileBrowser } from '../GitFileBrowser';
import CommitDialog from '../GitFileBrowser/CommitDialog';
import BranchSwitchDialog from '../GitFileBrowser/BranchSwitchDialog';
import { Terminal } from '../Terminal';
import { adoService } from '../../services/adoService';
import { analyzeCode, generateDemoAnnotations } from '../../utils/aiAnnotationAnalyzer';
import './CodeEditorModal.css';

const CodeEditorModal = ({
  isOpen,
  onClose,
  initialValue = '',
  onSave,
  language = 'yaml',
  title = 'Code Editor',
  readOnly = false,
  showSuccess,
  showError,
  // IDE mode flag
  ideMode = false,
}) => {
  const [value, setValue] = useState(initialValue);
  const [copied, setCopied] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [annotations, setAnnotations] = useState(ideMode ? {} : []);
  const [currentLine, setCurrentLine] = useState(null);
  const editorRef = useRef(null);

  // IDE-specific state
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [modifiedFiles, setModifiedFiles] = useState(new Set());
  const [showCommitDialog, setShowCommitDialog] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [showFilesystem, setShowFilesystem] = useState(ideMode);

  // New features state
  const [showDiff, setShowDiff] = useState(false);
  const [showBranchSwitchDialog, setShowBranchSwitchDialog] = useState(false);
  const [pendingBranch, setPendingBranch] = useState(null);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalMinimized, setTerminalMinimized] = useState(false);

  useEffect(() => {
    if (!ideMode) {
      setValue(initialValue);
    }
  }, [initialValue, isOpen, ideMode]);

  const activeTab = ideMode ? openTabs.find(tab => tab.id === activeTabId) : null;
  const currentValue = ideMode && activeTab ? activeTab.content : value;
  const currentLanguage = ideMode && activeTab ? activeTab.language : language;
  const currentTitle = ideMode && activeTab ? activeTab.path : title;
  const currentAnnotations = ideMode && activeTabId ? (annotations[activeTabId] || []) : annotations;
  const modifiedCount = modifiedFiles.size;

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    // Focus the editor when it mounts
    editor.focus();

    // Track cursor position for annotations
    editor.onDidChangeCursorPosition((e) => {
      setCurrentLine(e.position.lineNumber);
    });

    // Configure Monaco editor theme to match your app
    monaco.editor.defineTheme('pipeline-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0a0f0a',
        'editor.foreground': '#e8f5e8',
        'editorLineNumber.foreground': '#00ff4150',
        'editorLineNumber.activeForeground': '#00ff41',
        'editor.selectionBackground': '#00ff4130',
        'editor.inactiveSelectionBackground': '#00ff4115',
        'editorCursor.foreground': '#00ff41',
        'editor.lineHighlightBackground': '#1a2e1a20',
      }
    });

    monaco.editor.defineTheme('pipeline-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#1a2e1a',
        'editorLineNumber.foreground': '#008f2450',
        'editorLineNumber.activeForeground': '#008f24',
        'editor.selectionBackground': '#008f2430',
        'editor.inactiveSelectionBackground': '#008f2415',
        'editorCursor.foreground': '#008f24',
        'editor.lineHighlightBackground': '#f0f5f0',
      }
    });
  };

  const handleSave = () => {
    if (ideMode && activeTab) {
      // In IDE mode, just mark as saved
      if (showSuccess) {
        showSuccess(`${activeTab.name} marked for commit`);
      }
    } else {
      // Regular mode
      if (onSave) {
        onSave(value);
      }
      onClose();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const extensions = {
      yaml: 'yml',
      json: 'json',
      python: 'py',
      javascript: 'js',
      typescript: 'ts',
      bash: 'sh',
      powershell: 'ps1',
      markdown: 'md',
    };

    const ext = extensions[currentLanguage] || 'txt';
    const blob = new Blob([currentValue], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getCurrentTheme = () => {
    const isDark = document.body.classList.contains('dark-theme') ||
                   !document.body.classList.contains('light-theme');
    return isDark ? 'pipeline-dark' : 'pipeline-light';
  };

  // Annotation handlers
  const handleAddAnnotation = (annotation) => {
    const newAnnotation = {
      ...annotation,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };

    if (ideMode && activeTabId) {
      setAnnotations({
        ...annotations,
        [activeTabId]: [...(annotations[activeTabId] || []), newAnnotation],
      });
    } else {
      setAnnotations([...annotations, newAnnotation]);
    }
  };

  const handleUpdateAnnotation = (id, updates) => {
    if (ideMode && activeTabId) {
      setAnnotations({
        ...annotations,
        [activeTabId]: (annotations[activeTabId] || []).map(ann =>
          ann.id === id ? { ...ann, ...updates } : ann
        ),
      });
    } else {
      setAnnotations(annotations.map(ann =>
        ann.id === id ? { ...ann, ...updates } : ann
      ));
    }
  };

  const handleDeleteAnnotation = (id) => {
    if (ideMode && activeTabId) {
      setAnnotations({
        ...annotations,
        [activeTabId]: (annotations[activeTabId] || []).filter(ann => ann.id !== id),
      });
    } else {
      setAnnotations(annotations.filter(ann => ann.id !== id));
    }
  };

  const handleAIAnalyze = () => {
    const aiAnnotations = analyzeCode(currentValue, currentLanguage);
    if (ideMode && activeTabId) {
      setAnnotations({
        ...annotations,
        [activeTabId]: [...(annotations[activeTabId] || []), ...aiAnnotations],
      });
    } else {
      setAnnotations([...annotations, ...aiAnnotations]);
    }
  };

  const handleLoadDemoData = () => {
    const demoAnnotations = generateDemoAnnotations();
    if (ideMode && activeTabId) {
      setAnnotations({
        ...annotations,
        [activeTabId]: demoAnnotations,
      });
    } else {
      setAnnotations(demoAnnotations);
    }
    setShowAnnotations(true);
  };

  // IDE-specific handlers
  const handleFileSelect = async (file) => {
    // Check if file is already open
    const existingTab = openTabs.find(tab => tab.path === file.path);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      // If file has highlightLine, scroll to it
      if (file.highlightLine && editorRef.current) {
        setTimeout(() => {
          editorRef.current.revealLineInCenter(file.highlightLine);
          editorRef.current.setPosition({ lineNumber: file.highlightLine, column: 1 });
        }, 100);
      }
      return;
    }

    // Create new tab
    const newTab = {
      id: Date.now().toString(),
      ...file,
      originalContent: file.content,
    };

    setOpenTabs([...openTabs, newTab]);
    setActiveTabId(newTab.id);

    // If file has highlightLine, scroll to it after tab opens
    if (file.highlightLine) {
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.revealLineInCenter(file.highlightLine);
          editorRef.current.setPosition({ lineNumber: file.highlightLine, column: 1 });
        }
      }, 200);
    }
  };

  const handleCloseTab = (tabId, e) => {
    e?.stopPropagation();

    const tab = openTabs.find(t => t.id === tabId);
    if (tab && modifiedFiles.has(tab.path)) {
      if (!window.confirm(`${tab.name} has unsaved changes. Close anyway?`)) {
        return;
      }
      const newModified = new Set(modifiedFiles);
      newModified.delete(tab.path);
      setModifiedFiles(newModified);
    }

    const newTabs = openTabs.filter(t => t.id !== tabId);
    setOpenTabs(newTabs);

    if (activeTabId === tabId && newTabs.length > 0) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    } else if (newTabs.length === 0) {
      setActiveTabId(null);
    }
  };

  const handleContentChange = (newContent) => {
    if (ideMode && activeTab) {
      setOpenTabs(openTabs.map(tab => {
        if (tab.id === activeTabId) {
          const isModified = newContent !== tab.originalContent;
          const newModified = new Set(modifiedFiles);

          if (isModified) {
            newModified.add(tab.path);
            // Sync with terminal virtual shell
            if (typeof window !== 'undefined' && window.adoVirtualShell) {
              window.adoVirtualShell.trackChange(tab.path, newContent);
            }
          } else {
            newModified.delete(tab.path);
          }
          setModifiedFiles(newModified);

          return { ...tab, content: newContent };
        }
        return tab;
      }));
    } else {
      setValue(newContent || '');
    }
  };

  const handleBatchCommit = async (commitMessage) => {
    const filesToCommit = openTabs.filter(tab => modifiedFiles.has(tab.path));

    if (filesToCommit.length === 0) {
      if (showError) {
        showError('No modified files to commit');
      }
      return;
    }

    try {
      setIsCommitting(true);

      // Commit each file
      for (const tab of filesToCommit) {
        await adoService.commitFileChange(
          tab.path,
          tab.content,
          `${commitMessage}\n\nFile: ${tab.name}`,
          tab.id
        );
      }

      if (showSuccess) {
        showSuccess(`Successfully committed ${filesToCommit.length} file(s)!`);
      }

      // Update original content and clear modified flags
      setOpenTabs(openTabs.map(tab => ({
        ...tab,
        originalContent: tab.content,
      })));
      setModifiedFiles(new Set());
      setShowCommitDialog(false);
    } catch (error) {
      console.error('Batch commit failed:', error);
      if (showError) {
        showError(`Failed to commit: ${error.message}`);
      }
    } finally {
      setIsCommitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="code-editor-overlay"
      onClick={ideMode ? undefined : onClose}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div
        className={`code-editor-modal ${ideMode ? 'ide-mode' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="code-editor-header">
          <div className="code-editor-title">
            <Code2 size={20} />
            <h2>{ideMode ? 'Code Workspace' : title}</h2>
            {ideMode && modifiedCount > 0 && (
              <span className="code-editor-modified-badge">{modifiedCount} modified</span>
            )}
            {!ideMode && <span className="code-editor-language">{language}</span>}
          </div>
          <div className="code-editor-actions">
            {ideMode && (
              <>
                <button
                  className="code-editor-btn code-editor-btn-icon"
                  onClick={() => setShowFilesystem(!showFilesystem)}
                  title={showFilesystem ? "Hide filesystem" : "Show filesystem"}
                >
                  <FolderTree size={18} />
                </button>
                <button
                  className={`code-editor-btn code-editor-btn-icon ${showTerminal ? 'code-editor-btn-active' : ''}`}
                  onClick={() => setShowTerminal(!showTerminal)}
                  title={showTerminal ? "Hide terminal" : "Show terminal"}
                >
                  <TerminalIcon size={18} />
                </button>
              </>
            )}
            {ideMode && activeTab && (
              <button
                className={`code-editor-btn code-editor-btn-icon ${showDiff ? 'code-editor-btn-active' : ''}`}
                onClick={() => {
                  setShowDiff(!showDiff);
                }}
                title={showDiff ? "Hide diff view" : "Show diff view"}
              >
                <GitCompare size={18} />
              </button>
            )}
            {ideMode && modifiedCount > 0 && (
              <button
                className="code-editor-btn code-editor-btn-icon code-editor-btn-commit"
                onClick={() => setShowCommitDialog(true)}
                title="Commit all changes"
              >
                <GitCommit size={18} />
              </button>
            )}
            <button
              className="code-editor-btn code-editor-btn-icon"
              onClick={handleLoadDemoData}
              title="Load demo annotations"
            >
              <Database size={18} />
            </button>
            <button
              className="code-editor-btn code-editor-btn-icon"
              onClick={() => setShowAnnotations(!showAnnotations)}
              title={showAnnotations ? "Hide annotations" : "Show annotations"}
            >
              {showAnnotations ? <PanelRightClose size={18} /> : <PanelRight size={18} />}
            </button>
            <button
              className="code-editor-btn code-editor-btn-icon"
              onClick={handleCopy}
              title="Copy to clipboard"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
            <button
              className="code-editor-btn code-editor-btn-icon"
              onClick={handleDownload}
              title="Download file"
            >
              <Download size={18} />
            </button>
            <button
              className="code-editor-btn code-editor-btn-icon"
              onClick={onClose}
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs (IDE mode only) */}
        {ideMode && openTabs.length > 0 && (
          <div className="code-editor-tabs">
            {openTabs.map(tab => (
              <div
                key={tab.id}
                className={`code-editor-tab ${activeTabId === tab.id ? 'active' : ''} ${modifiedFiles.has(tab.path) ? 'modified' : ''}`}
                onClick={() => setActiveTabId(tab.id)}
              >
                <span className="code-editor-tab-name">{tab.name}</span>
                {modifiedFiles.has(tab.path) && <span className="code-editor-tab-dot">●</span>}
                <button
                  className="code-editor-tab-close"
                  onClick={(e) => handleCloseTab(tab.id, e)}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Editor and Annotations Layout */}
        <div className="code-editor-body">
          {/* Filesystem Sidebar (IDE mode only) */}
          {ideMode && showFilesystem && (
            <div className="code-editor-filesystem">
              <GitFileBrowser
                isOpen={true}
                onFileSelect={handleFileSelect}
                onBranchChangeRequest={(newBranch) => {
                  // Check for modified files
                  if (modifiedFiles.size > 0) {
                    setPendingBranch(newBranch);
                    setShowBranchSwitchDialog(true);
                    return false; // Show dialog first
                  }
                  return true; // Allow branch change
                }}
                pendingBranchSwitch={!showBranchSwitchDialog && modifiedFiles.size === 0 ? pendingBranch : null}
              />
            </div>
          )}

          {/* Editor Content */}
          {(ideMode && activeTab) || !ideMode ? (
            <>
              <div className={`code-editor-content ${showAnnotations ? 'with-annotations' : ''}`}>
                {showDiff && ideMode && activeTab ? (
                  <DiffViewer
                    key={`diff-${activeTabId}`}
                    original={activeTab.originalContent || ''}
                    modified={activeTab.content || ''}
                    language={currentLanguage}
                    theme={getCurrentTheme()}
                  />
                ) : (
                  <Editor
                    key={activeTabId || 'default'}
                    height="100%"
                    language={currentLanguage}
                    value={currentValue}
                    onChange={handleContentChange}
                    onMount={handleEditorDidMount}
                    theme={getCurrentTheme()}
                    options={{
                      readOnly,
                      minimap: { enabled: true },
                      fontSize: 14,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      insertSpaces: true,
                      wordWrap: 'on',
                      formatOnPaste: true,
                      formatOnType: true,
                      folding: true,
                      lineDecorationsWidth: 10,
                      lineNumbersMinChars: 3,
                      renderLineHighlight: 'all',
                      scrollbar: {
                        verticalScrollbarSize: 10,
                        horizontalScrollbarSize: 10,
                      },
                      // Enhanced IDE features
                      quickSuggestions: true,
                      suggestOnTriggerCharacters: true,
                      acceptSuggestionOnEnter: 'on',
                      tabCompletion: 'on',
                      wordBasedSuggestions: 'allDocuments',
                      parameterHints: { enabled: true },
                      autoClosingBrackets: 'always',
                      autoClosingQuotes: 'always',
                      autoIndent: 'full',
                      // Find/Replace
                      find: {
                        seedSearchStringFromSelection: 'always',
                        autoFindInSelection: 'never',
                      },
                      // Multi-cursor
                      multiCursorModifier: 'ctrlCmd',
                      // Bracket matching
                      matchBrackets: 'always',
                      bracketPairColorization: { enabled: true },
                    }}
                  />
                )}
              </div>

              {/* Annotations Panel */}
              {showAnnotations && (
                <div className="code-editor-annotations">
                  <AccuracyScore
                    annotations={currentAnnotations}
                    totalLines={currentValue.split('\n').length}
                  />
                  <EditorAnnotations
                    filePath={currentTitle}
                    annotations={currentAnnotations}
                    onAddAnnotation={handleAddAnnotation}
                    onUpdateAnnotation={handleUpdateAnnotation}
                    onDeleteAnnotation={handleDeleteAnnotation}
                    currentLine={currentLine}
                    editorRef={editorRef}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="code-editor-empty-state">
              <h3>No files open</h3>
              <p>Select a file from the sidebar to start editing</p>
            </div>
          )}
        </div>

        {/* Terminal (IDE mode only) */}
        {ideMode && showTerminal && (
          <Terminal
            isOpen={showTerminal}
            onClose={() => setShowTerminal(false)}
            onMinimize={() => setTerminalMinimized(!terminalMinimized)}
            isMinimized={terminalMinimized}
            onFileOpen={handleFileSelect}
          />
        )}

        {/* Footer */}
        <div className="code-editor-footer">
          <div className="code-editor-info">
            <span>Lines: {currentValue.split('\n').length}</span>
            <span>Characters: {currentValue.length}</span>
            {ideMode && <span>Open Files: {openTabs.length}</span>}
          </div>
          <div className="code-editor-buttons">
            <button
              className="code-editor-btn code-editor-btn-secondary"
              onClick={onClose}
            >
              {ideMode ? 'Close Workspace' : 'Cancel'}
            </button>
            {!readOnly && !ideMode && (
              <button
                className="code-editor-btn code-editor-btn-primary"
                onClick={handleSave}
              >
                Save Changes
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Commit Dialog (IDE mode only) */}
      {ideMode && (
        <CommitDialog
          isOpen={showCommitDialog}
          onClose={() => setShowCommitDialog(false)}
          onCommit={handleBatchCommit}
          fileName={`${modifiedCount} file(s)`}
          isLoading={isCommitting}
        />
      )}

      {/* Branch Switch Dialog (IDE mode only) */}
      {ideMode && (
        <BranchSwitchDialog
          isOpen={showBranchSwitchDialog}
          onClose={() => {
            setShowBranchSwitchDialog(false);
            setPendingBranch(null);
          }}
          onConfirm={() => {
            // Clear all tabs and modified files
            setOpenTabs([]);
            setActiveTabId(null);
            setModifiedFiles(new Set());
            setShowBranchSwitchDialog(false);
            // pendingBranch will be applied via pendingBranchSwitch prop
            // Clear it after a short delay to ensure GitFileBrowser processes it
            setTimeout(() => setPendingBranch(null), 100);
          }}
          modifiedCount={modifiedFiles.size}
          newBranch={pendingBranch}
        />
      )}
    </div>
  );
};

export default CodeEditorModal;
