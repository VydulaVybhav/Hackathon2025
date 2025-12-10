import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import './EditorAnnotations.css';

/**
 * EditorAnnotations - Chess-style commentary for code
 * Uses chess annotation symbols: !, !!, ?, ??, !?, ?!
 */
const EditorAnnotations = ({
  filePath,
  annotations = [],
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  currentLine,
  editorRef
}) => {
  const [showAnnotationInput, setShowAnnotationInput] = useState(false);
  const [newAnnotation, setNewAnnotation] = useState({ line: 0, text: '', type: 'good' });
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [selectedLine, setSelectedLine] = useState(null);

  // Chess annotation types
  const ANNOTATION_TYPES = {
    brilliant: { symbol: '!!', label: 'Brilliant Move', color: '#00ff88', description: 'Exceptional code/solution' },
    good: { symbol: '!', label: 'Good Move', color: '#00ff41', description: 'Good implementation' },
    interesting: { symbol: '!?', label: 'Interesting', color: '#00bfff', description: 'Interesting approach' },
    dubious: { symbol: '?!', label: 'Dubious', color: '#ffd700', description: 'Questionable choice' },
    mistake: { symbol: '?', label: 'Mistake', color: '#ff9500', description: 'Potential issue' },
    blunder: { symbol: '??', label: 'Blunder', color: '#ff4444', description: 'Critical error' },
  };

  // Update selected line when cursor moves
  useEffect(() => {
    if (currentLine !== null) {
      setSelectedLine(currentLine);
    }
  }, [currentLine]);

  const handleAddAnnotation = () => {
    if (newAnnotation.text.trim()) {
      onAddAnnotation({
        ...newAnnotation,
        line: selectedLine || newAnnotation.line,
        timestamp: new Date().toISOString(),
      });
      setNewAnnotation({ line: 0, text: '', type: 'good' });
      setShowAnnotationInput(false);
    }
  };

  const startEdit = (annotation) => {
    setEditingId(annotation.id);
    setEditText(annotation.text);
  };

  const saveEdit = (id) => {
    if (editText.trim()) {
      onUpdateAnnotation(id, { text: editText });
      setEditingId(null);
      setEditText('');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  // Group annotations by line number
  const annotationsByLine = annotations.reduce((acc, ann) => {
    if (!acc[ann.line]) acc[ann.line] = [];
    acc[ann.line].push(ann);
    return acc;
  }, {});

  const sortedLines = Object.keys(annotationsByLine).sort((a, b) => Number(a) - Number(b));

  return (
    <div className="editor-annotations-panel">
      {/* Header */}
      <div className="annotations-header">
        <div className="annotations-title">
          <MessageSquare size={18} />
          <h3>Code Review</h3>
          <span className="annotations-count">{annotations.length}</span>
        </div>
        <button
          className="annotations-add-btn"
          onClick={() => {
            setNewAnnotation({ ...newAnnotation, line: selectedLine || 1 });
            setShowAnnotationInput(true);
          }}
          title="Add annotation at current line"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Chess Legend */}
      <div className="annotations-legend">
        <div className="legend-title">Annotation Symbols:</div>
        <div className="legend-items">
          {Object.entries(ANNOTATION_TYPES).map(([key, type]) => (
            <div key={key} className="legend-item" title={type.description}>
              <span className="legend-symbol" style={{ color: type.color }}>{type.symbol}</span>
              <span className="legend-label">{type.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Current Line Info */}
      {selectedLine && (
        <div className="annotations-current-line">
          Line: <strong>{selectedLine}</strong>
        </div>
      )}

      {/* Add New Annotation */}
      {showAnnotationInput && (
        <div className="annotation-input-card">
          <div className="annotation-input-header">
            <span>Line {newAnnotation.line}</span>
            <button onClick={() => setShowAnnotationInput(false)}>
              <X size={14} />
            </button>
          </div>

          <select
            value={newAnnotation.type}
            onChange={(e) => setNewAnnotation({ ...newAnnotation, type: e.target.value })}
            className="annotation-type-select"
          >
            {Object.entries(ANNOTATION_TYPES).map(([key, type]) => (
              <option key={key} value={key}>
                {type.symbol} {type.label} - {type.description}
              </option>
            ))}
          </select>

          <textarea
            value={newAnnotation.text}
            onChange={(e) => setNewAnnotation({ ...newAnnotation, text: e.target.value })}
            placeholder="Add your analysis..."
            className="annotation-textarea"
            rows={3}
            autoFocus
          />

          <div className="annotation-actions">
            <button
              onClick={() => setShowAnnotationInput(false)}
              className="annotation-btn annotation-btn-cancel"
            >
              Cancel
            </button>
            <button
              onClick={handleAddAnnotation}
              className="annotation-btn annotation-btn-primary"
              disabled={!newAnnotation.text.trim()}
            >
              Add Annotation
            </button>
          </div>
        </div>
      )}

      {/* Annotations List */}
      <div className="annotations-list">
        {annotations.length === 0 ? (
          <div className="annotations-empty">
            <MessageSquare size={32} opacity={0.3} />
            <p>No annotations yet</p>
            <small>Click + to add your first code review</small>
          </div>
        ) : (
          sortedLines.map(lineNum => (
            <div key={lineNum} className="annotation-line-group">
              <div className="annotation-line-header">
                <span className="annotation-line-number">Line {lineNum}</span>
                <span className="annotation-count-badge">
                  {annotationsByLine[lineNum].length}
                </span>
              </div>

              {annotationsByLine[lineNum].map(annotation => {
                const typeInfo = ANNOTATION_TYPES[annotation.type] || ANNOTATION_TYPES.good;
                return (
                  <div
                    key={annotation.id}
                    className="annotation-card"
                    style={{ borderLeftColor: typeInfo.color }}
                  >
                    <div className="annotation-card-header">
                      <span
                        className="annotation-symbol"
                        style={{ color: typeInfo.color }}
                      >
                        {typeInfo.symbol}
                      </span>
                      <span className="annotation-type-label">{typeInfo.label}</span>
                      <div className="annotation-card-actions">
                        {editingId === annotation.id ? (
                          <>
                            <button onClick={() => saveEdit(annotation.id)} title="Save">
                              <Check size={14} />
                            </button>
                            <button onClick={cancelEdit} title="Cancel">
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(annotation)} title="Edit">
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => onDeleteAnnotation(annotation.id)}
                              title="Delete"
                              className="annotation-delete-btn"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {editingId === annotation.id ? (
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="annotation-edit-textarea"
                        rows={3}
                        autoFocus
                      />
                    ) : (
                      <div className="annotation-text">{annotation.text}</div>
                    )}

                    {annotation.timestamp && (
                      <div className="annotation-timestamp">
                        {new Date(annotation.timestamp).toLocaleString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EditorAnnotations;
