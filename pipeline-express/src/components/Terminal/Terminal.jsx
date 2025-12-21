import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { Terminal as TerminalIcon, X, Minimize2, Maximize2, RotateCcw } from 'lucide-react';
import { adoVirtualShell } from '../../services/adoVirtualShell';
import '@xterm/xterm/css/xterm.css';
import './Terminal.css';

const Terminal = ({ isOpen, onClose, onMinimize, isMinimized, onFileOpen }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const commandHistoryRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const currentLineRef = useRef('');

  useEffect(() => {
    if (!isOpen || !terminalRef.current || xtermRef.current) return;

    // Wait for container to be ready
    const container = terminalRef.current;
    if (!container.offsetParent) {
      return;
    }

    // Create terminal instance
    const term = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: '"Cascadia Code", "Fira Code", "Consolas", "Monaco", monospace',
      theme: {
        background: '#0a0f0a',
        foreground: '#e8f5e8',
        cursor: '#00ff41',
        cursorAccent: '#0a0f0a',
        selectionBackground: '#00ff4130',
        black: '#000000',
        red: '#ff4444',
        green: '#00ff41',
        yellow: '#ffd700',
        blue: '#00bfff',
        magenta: '#ff00ff',
        cyan: '#00ffff',
        white: '#ffffff',
        brightBlack: '#666666',
        brightRed: '#ff6666',
        brightGreen: '#00ff88',
        brightYellow: '#ffff00',
        brightBlue: '#66b3ff',
        brightMagenta: '#ff66ff',
        brightCyan: '#66ffff',
        brightWhite: '#ffffff',
      },
      scrollback: 1000,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    term.open(terminalRef.current);

    // Fit terminal after a short delay to ensure DOM is ready
    setTimeout(() => {
      try {
        fitAddon.fit();
      } catch (err) {
        console.warn('Error fitting terminal:', err);
      }
    }, 50);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Setup ADO Virtual Shell callbacks
    adoVirtualShell.onFileOpen = (fileData) => {
      if (onFileOpen) {
        // Format fileData to match handleFileSelect expectations
        onFileOpen({
          path: fileData.path,
          name: fileData.name,
          content: fileData.content,
          language: fileData.language,
        });
      }
    };

    adoVirtualShell.onOutput = (data) => {
      if (term) {
        term.write(data);
      }
    };

    // Welcome message
    term.writeln('\x1b[1;32m╔══════════════════════════════════════════════════════════╗\x1b[0m');
    term.writeln('\x1b[1;32m║\x1b[0m  \x1b[1;36mWelcome to ADO Virtual Shell\x1b[0m                        \x1b[1;32m║\x1b[0m');
    term.writeln('\x1b[1;32m║\x1b[0m  \x1b[90mCloud-based terminal for Azure DevOps\x1b[0m              \x1b[1;32m║\x1b[0m');
    term.writeln('\x1b[1;32m╚══════════════════════════════════════════════════════════╝\x1b[0m');
    term.writeln('');
    term.writeln('\x1b[33mQuick Commands:\x1b[0m');
    term.writeln('  \x1b[36mls\x1b[0m       - List files and directories');
    term.writeln('  \x1b[36mcat\x1b[0m      - Display file contents');
    term.writeln('  \x1b[36mvim\x1b[0m      - Open file in editor');
    term.writeln('  \x1b[36mgit\x1b[0m      - Git commands (status, commit, etc.)');
    term.writeln('  \x1b[36mclaude\x1b[0m   - Claude Code integration');
    term.writeln('  \x1b[36mhelp\x1b[0m     - Show all commands');
    term.writeln('');
    writePrompt(term);

    setIsConnected(true);

    // Handle terminal input
    term.onData((data) => {
      handleTerminalData(data, term);
    });

    // Handle window resize
    const handleResize = () => {
      if (fitAddon && !isMinimized && xtermRef.current) {
        setTimeout(() => {
          try {
            fitAddon.fit();
          } catch (err) {
            console.warn('Error fitting terminal on resize:', err);
          }
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (term) {
        term.dispose();
      }
      xtermRef.current = null;
    };
  }, [isOpen]);

  // Fit terminal when minimized state changes
  useEffect(() => {
    if (fitAddonRef.current && isOpen && !isMinimized && xtermRef.current) {
      setTimeout(() => {
        try {
          fitAddonRef.current.fit();
        } catch (err) {
          console.warn('Error fitting terminal after minimize:', err);
        }
      }, 150);
    }
  }, [isMinimized, isOpen]);

  const writePrompt = (term) => {
    term.write('\r\n\x1b[1;32m➜\x1b[0m \x1b[1;34m~\x1b[0m ');
  };

  const handleTerminalData = (data, term) => {
    const code = data.charCodeAt(0);

    // Handle special keys
    if (code === 13) { // Enter
      const command = currentLineRef.current.trim();
      term.write('\r\n');

      if (command) {
        commandHistoryRef.current.push(command);
        historyIndexRef.current = commandHistoryRef.current.length;
        executeCommand(command, term);
      } else {
        writePrompt(term);
      }

      currentLineRef.current = '';
      return;
    }

    if (code === 127) { // Backspace
      if (currentLineRef.current.length > 0) {
        currentLineRef.current = currentLineRef.current.slice(0, -1);
        term.write('\b \b');
      }
      return;
    }

    if (code === 27) { // Escape sequences (arrow keys, etc.)
      if (data === '\x1b[A') { // Up arrow
        navigateHistory(-1, term);
        return;
      }
      if (data === '\x1b[B') { // Down arrow
        navigateHistory(1, term);
        return;
      }
      return;
    }

    // Regular character input
    if (code >= 32) {
      currentLineRef.current += data;
      term.write(data);
    }
  };

  const navigateHistory = (direction, term) => {
    const history = commandHistoryRef.current;
    if (history.length === 0) return;

    // Clear current line
    const currentLength = currentLineRef.current.length;
    for (let i = 0; i < currentLength; i++) {
      term.write('\b \b');
    }

    // Navigate history
    historyIndexRef.current += direction;
    if (historyIndexRef.current < 0) {
      historyIndexRef.current = 0;
    } else if (historyIndexRef.current >= history.length) {
      historyIndexRef.current = history.length;
      currentLineRef.current = '';
      return;
    }

    // Write history command
    const command = history[historyIndexRef.current];
    currentLineRef.current = command;
    term.write(command);
  };

  const executeCommand = async (command, term) => {
    const cmd = command.toLowerCase().trim();

    // Handle special local commands
    if (cmd === 'clear') {
      term.clear();
      writePrompt(term);
      return;
    }

    if (cmd === 'history') {
      if (commandHistoryRef.current.length === 0) {
        term.writeln('No command history');
      } else {
        term.writeln('\x1b[1;36mCommand History:\x1b[0m');
        commandHistoryRef.current.forEach((cmd, i) => {
          term.writeln(`  ${i + 1}  ${cmd}`);
        });
      }
      writePrompt(term);
      return;
    }

    // Execute command through ADO Virtual Shell
    try {
      const result = await adoVirtualShell.execute(command);

      // Handle different response types
      switch (result.type) {
        case 'clear':
          term.clear();
          break;

        case 'output':
          term.writeln(result.text);
          break;

        case 'error':
          term.writeln('\x1b[31m' + result.message + '\x1b[0m');
          break;

        case 'success':
          if (result.message) {
            term.writeln('\x1b[32m' + result.message + '\x1b[0m');
          }
          break;

        case 'info':
          term.writeln('\x1b[33m' + result.message + '\x1b[0m');
          break;

        case 'diff':
          // Display diff output
          term.writeln('\x1b[1;36m--- ' + result.path + ' (original)\x1b[0m');
          term.writeln('\x1b[1;36m+++ ' + result.path + ' (modified)\x1b[0m');
          term.writeln('\x1b[33m@@ Changes @@\x1b[0m');
          term.writeln('\x1b[31m- Original content\x1b[0m');
          term.writeln('\x1b[32m+ Modified content\x1b[0m');
          break;

        case 'checkout':
          // Handle branch checkout - could trigger a callback
          term.writeln('\x1b[32mSwitched to branch \'' + result.branch + '\'\x1b[0m');
          // Optionally trigger a refresh or callback here
          break;

        default:
          term.writeln('\x1b[33mUnknown response type\x1b[0m');
      }
    } catch (error) {
      term.writeln('\x1b[31mError: ' + error.message + '\x1b[0m');
    }

    writePrompt(term);
  };

  const handleClear = () => {
    if (xtermRef.current) {
      xtermRef.current.clear();
      writePrompt(xtermRef.current);
      currentLineRef.current = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`terminal-container ${isMinimized ? 'minimized' : ''}`}>
      <div className="terminal-header">
        <div className="terminal-title">
          <TerminalIcon size={16} />
          <span>Terminal</span>
          {isConnected && <span className="terminal-status">●</span>}
        </div>
        <div className="terminal-controls">
          <button
            className="terminal-btn"
            onClick={handleClear}
            title="Clear terminal"
          >
            <RotateCcw size={14} />
          </button>
          <button
            className="terminal-btn"
            onClick={onMinimize}
            title={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
          <button
            className="terminal-btn"
            onClick={onClose}
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      {!isMinimized && (
        <div className="terminal-body" ref={terminalRef} />
      )}
    </div>
  );
};

export default Terminal;
