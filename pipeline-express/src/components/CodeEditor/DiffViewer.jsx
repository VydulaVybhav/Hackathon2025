import React, { useState, useEffect, useRef } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import './DiffViewer.css';

const DiffViewer = ({ original, modified, language, theme }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const editorRef = useRef(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      // Cleanup editor on unmount
      if (editorRef.current) {
        try {
          editorRef.current.dispose();
        } catch (e) {
          console.warn('Error disposing diff editor:', e);
        }
      }
    };
  }, []);

  const handleEditorDidMount = (editor) => {
    if (isMounted.current) {
      editorRef.current = editor;
      setIsLoading(false);
    }
  };

  const handleEditorError = (err) => {
    console.error('DiffEditor error:', err);
    setError(err);
    setIsLoading(false);
  };

  if (error) {
    return (
      <div className="diff-viewer-error">
        <p>Unable to load diff view</p>
        <p className="diff-viewer-error-detail">Please try toggling the view again</p>
      </div>
    );
  }

  return (
    <div className="diff-viewer">
      {isLoading && (
        <div className="diff-viewer-loading">
          Loading diff...
        </div>
      )}
      <DiffEditor
        height="100%"
        language={language}
        original={original || ''}
        modified={modified || ''}
        theme={theme}
        onMount={handleEditorDidMount}
        loading={<div className="diff-viewer-loading">Initializing...</div>}
        options={{
          readOnly: true,
          renderSideBySide: true,
          enableSplitViewResizing: true,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: 'on',
          renderOverviewRuler: true,
          diffWordWrap: 'on',
          ignoreTrimWhitespace: false,
        }}
      />
    </div>
  );
};

export default DiffViewer;
