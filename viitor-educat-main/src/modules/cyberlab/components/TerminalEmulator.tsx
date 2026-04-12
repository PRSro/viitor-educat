import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';

export interface TerminalEmulatorProps {
  commands: Record<string, (args: string[]) => string>;
  initialOutput?: string[];
}

export function TerminalEmulator({ commands, initialOutput = [] }: TerminalEmulatorProps) {
  const [output, setOutput] = useState<string[]>(initialOutput);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output]);

  const executeCommand = (cmdStr: string) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) {
      setOutput(prev => [...prev, '$ ']);
      return;
    }

    setHistory(prev => [...prev, trimmed]);
    setHistoryIndex(-1);
    
    setOutput(prev => [...prev, `$ ${trimmed}`]);

    const parts = trimmed.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);

    if (cmd === 'clear') {
      setOutput([]);
      return;
    }

    if (cmd === 'help') {
      const allCmds = ['help', 'clear', 'echo', 'whoami', 'ls', 'cat', ...Object.keys(commands)];
      setOutput(prev => [...prev, `Available commands: ${allCmds.join(', ')}`]);
      return;
    }

    if (cmd === 'echo') {
      setOutput(prev => [...prev, args.join(' ')]);
      return;
    }

    if (cmd === 'whoami') {
      setOutput(prev => [...prev, 'cyber-intern']);
      return;
    }

    if (cmd === 'ls') {
      setOutput(prev => [...prev, 'flag.txt  hints.log']);
      return;
    }

    if (cmd === 'cat') {
      setOutput(prev => [...prev, 'cat: permission denied. Try analyzing the system or executing challenge commands.']);
      return;
    }

    if (commands[cmd]) {
      const result = commands[cmd](args);
      setOutput(prev => [...prev, ...result.split('\n')]);
      return;
    }

    setOutput(prev => [...prev, `bash: ${cmd}: command not found`]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(nextIdx);
        setInput(history[history.length - 1 - nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInput(history[history.length - 1 - nextIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  return (
    <div 
      className="bg-black/90 rounded-md border border-green-500/30 p-4 font-mono text-xs sm:text-sm text-green-400 h-full w-full shadow-[0_0_15px_rgba(34,197,94,0.1)] flex flex-col items-start text-left"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex items-center gap-2 mb-2 w-full border-b border-green-500/20 pb-2 text-green-500/50">
        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
        <span className="ml-2">guest@cyberlab:~</span>
      </div>
      
      <div ref={scrollRef} className="flex-1 w-full overflow-y-auto whitespace-pre-wrap break-words flex flex-col">
        {output.map((line, i) => (
          <div key={i} className="min-h-[1.5em] leading-relaxed opacity-90">{line}</div>
        ))}
        
        <div className="flex w-full mt-1">
          <span className="text-green-500 mr-2 shrink-0">$</span>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-green-400 font-mono shadow-none focus:ring-0 p-0 m-0 caret-transparent relative"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            style={{ textShadow: '0 0 5px rgba(74, 222, 128, 0.4)' }}
          />
        </div>
      </div>
    </div>
  );
}
