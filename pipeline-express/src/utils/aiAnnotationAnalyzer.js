/**
 * AI Annotation Analyzer - Chess-style code review
 * Analyzes code and generates annotations based on patterns and best practices
 */

// Analysis patterns for different annotation types
const ANALYSIS_PATTERNS = {
  // !! Brilliant moves - Exceptional code patterns
  brilliant: [
    { pattern: /async|await|Promise/, context: 'proper async handling', message: 'Excellent async/await usage for clean asynchronous code!' },
    { pattern: /try\s*{[\s\S]*catch/, context: 'error handling', message: 'Brilliant error handling with try-catch block!' },
    { pattern: /\.map\(|\.filter\(|\.reduce\(/, context: 'functional programming', message: 'Great use of functional programming patterns!' },
    { pattern: /useMemo|useCallback/, context: 'React optimization', message: 'Smart optimization with React hooks!' },
  ],

  // ! Good moves - Good implementation
  good: [
    { pattern: /const |let /, context: 'modern JS', message: 'Good use of modern JavaScript variable declarations.' },
    { pattern: /===|!==/, context: 'strict equality', message: 'Proper strict equality comparison.' },
    { pattern: /\/\/|\/\*/, context: 'documentation', message: 'Good code documentation!' },
    { pattern: /function\s+\w+|const\s+\w+\s*=\s*\(/, context: 'function definition', message: 'Well-defined function structure.' },
  ],

  // !? Interesting moves - Interesting approaches
  interesting: [
    { pattern: /eval\(|new Function/, context: 'dynamic code', message: 'Interesting approach, but consider alternatives to eval/Function.' },
    { pattern: /setTimeout|setInterval/, context: 'timing', message: 'Interesting timing logic - ensure cleanup on unmount.' },
    { pattern: /localStorage|sessionStorage/, context: 'storage', message: 'Interesting use of browser storage - consider security implications.' },
  ],

  // ?! Dubious moves - Questionable choices
  dubious: [
    { pattern: /var /, context: 'old syntax', message: 'Questionable use of var - prefer const/let for block scoping.' },
    { pattern: /==|!=/, context: 'loose equality', message: 'Dubious loose equality - consider using === or !== instead.' },
    { pattern: /console\.log|console\.error/, context: 'debugging', message: 'Console statements in production code - consider removing.' },
  ],

  // ? Mistakes - Potential issues
  mistake: [
    { pattern: /\.innerHTML\s*=/, context: 'XSS risk', message: 'Potential XSS vulnerability using innerHTML!' },
    { pattern: /password|secret|key.*=\s*['"][^'"]+['"]/, context: 'hardcoded secrets', message: 'Hardcoded secrets detected - use environment variables!' },
    { pattern: /TODO|FIXME|HACK/, context: 'tech debt', message: 'Technical debt marker - needs attention!' },
  ],

  // ?? Blunders - Critical errors
  blunder: [
    { pattern: /eval\(['"]/, context: 'code injection', message: 'CRITICAL: eval() with user input is a major security risk!' },
    { pattern: /while\s*\(\s*true\s*\)/, context: 'infinite loop', message: 'CRITICAL: Potential infinite loop detected!' },
    { pattern: /catch\s*\([^)]*\)\s*{\s*}/, context: 'swallowing errors', message: 'CRITICAL: Empty catch block swallows errors!' },
  ],
};

/**
 * Analyze code and generate AI annotations
 * @param {string} code - The code to analyze
 * @param {string} language - Programming language
 * @returns {Array} Array of annotation objects
 */
export const analyzeCode = (code, language = 'javascript') => {
  const annotations = [];
  const lines = code.split('\n');

  // Analyze each line
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmedLine = line.trim();

    // Skip empty lines and pure comments
    if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('*')) {
      return;
    }

    // Check against each pattern category
    Object.entries(ANALYSIS_PATTERNS).forEach(([type, patterns]) => {
      patterns.forEach(({ pattern, context, message }) => {
        if (pattern.test(line)) {
          annotations.push({
            id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            line: lineNumber,
            type,
            text: `[AI Analysis - ${context}] ${message}`,
            timestamp: new Date().toISOString(),
            isAI: true,
          });
        }
      });
    });
  });

  // Remove duplicates on the same line
  const uniqueAnnotations = annotations.reduce((acc, curr) => {
    const exists = acc.find(a => a.line === curr.line && a.type === curr.type);
    if (!exists) acc.push(curr);
    return acc;
  }, []);

  return uniqueAnnotations;
};

/**
 * Generate demo annotations for testing
 */
export const generateDemoAnnotations = () => {
  return [
    {
      id: 'demo-1',
      line: 5,
      type: 'brilliant',
      text: '[AI Analysis] Brilliant use of async/await pattern! This makes the code highly readable and maintainable.',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      isAI: true,
    },
    {
      id: 'demo-2',
      line: 12,
      type: 'good',
      text: '[AI Analysis] Good implementation of error handling. Consider adding specific error types for better debugging.',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      isAI: true,
    },
    {
      id: 'demo-3',
      line: 23,
      type: 'interesting',
      text: '[AI Analysis] Interesting approach using localStorage. Be aware of size limitations and consider IndexedDB for larger data.',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      isAI: true,
    },
    {
      id: 'demo-4',
      line: 34,
      type: 'dubious',
      text: '[AI Analysis] Questionable use of var here. Modern JavaScript prefers const/let for better scoping and to prevent hoisting issues.',
      timestamp: new Date(Date.now() - 900000).toISOString(),
      isAI: true,
    },
    {
      id: 'demo-5',
      line: 45,
      type: 'mistake',
      text: '[AI Analysis] Console.log statements should be removed in production. Consider using a proper logging library.',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      isAI: true,
    },
    {
      id: 'demo-6',
      line: 56,
      type: 'blunder',
      text: '[AI Analysis - CRITICAL] Empty catch block detected! This swallows errors silently and makes debugging impossible. Always log or handle errors appropriately.',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      isAI: true,
    },
    {
      id: 'demo-7',
      line: 15,
      type: 'brilliant',
      text: '[Human Review] This optimization reduced load time by 60%! Great work on identifying the bottleneck.',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      isAI: false,
    },
    {
      id: 'demo-8',
      line: 67,
      type: 'good',
      text: '[Human Review] Clean separation of concerns. The component is now much more testable.',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      isAI: false,
    },
  ];
};

/**
 * Get AI analysis summary
 */
export const getAnalysisSummary = (annotations) => {
  const aiAnnotations = annotations.filter(a => a.isAI);
  const summary = {
    total: aiAnnotations.length,
    brilliant: aiAnnotations.filter(a => a.type === 'brilliant').length,
    good: aiAnnotations.filter(a => a.type === 'good').length,
    interesting: aiAnnotations.filter(a => a.type === 'interesting').length,
    dubious: aiAnnotations.filter(a => a.type === 'dubious').length,
    mistakes: aiAnnotations.filter(a => a.type === 'mistake').length,
    blunders: aiAnnotations.filter(a => a.type === 'blunder').length,
  };

  // Calculate code quality score (0-100)
  const score = Math.max(0, Math.min(100,
    (summary.brilliant * 15) +
    (summary.good * 10) +
    (summary.interesting * 5) -
    (summary.dubious * 5) -
    (summary.mistakes * 10) -
    (summary.blunders * 20) +
    50
  ));

  return { ...summary, score };
};
