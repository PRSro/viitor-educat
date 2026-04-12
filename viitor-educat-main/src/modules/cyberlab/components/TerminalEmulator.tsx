import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';

export interface TerminalEmulatorProps {
  commands: Record<string, (args: string[]) => string>;
  commandDescriptions?: Record<string, string>;
  initialOutput?: string[];
}

export function TerminalEmulator({ commands, commandDescriptions = {}, initialOutput = [] }: TerminalEmulatorProps) {
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

  const STANDARD_COMMANDS: Record<string, string> = {
    help: 'Show available commands',
    clear: 'Clear terminal screen',
    echo: 'Print text to terminal',
    whoami: 'Show current user',
    ls: 'List directory contents',
    cat: 'Display file contents',
    pwd: 'Print working directory',
    date: 'Show current date/time',
    uname: 'Show system information',
    hostname: 'Show hostname',
    env: 'Display environment variables',
    history: 'Show command history',
    grep: 'Search for pattern in text',
    head: 'Display first lines of file',
    tail: 'Display last lines of file',
    wc: 'Count lines, words, characters',
    tr: 'Translate characters',
    base64: 'Encode/decode base64',
    hash: 'Calculate hash digest',
    curl: 'Fetch URL content (simulated)',
    wget: 'Download file (simulated)',
    ping: 'Test network connectivity',
    nslookup: 'DNS lookup',
    ip: 'Show IP address',
    netstat: 'Show network connections',
    ps: 'Show running processes',
    uptime: 'Show system uptime',
    df: 'Show disk usage',
    free: 'Show memory usage',
    submit: 'Submit your flag answer',
  };

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
      const custom = Object.keys(commands).filter(c => c !== 'submit');
      const allCmds = { ...STANDARD_COMMANDS };
      for (const c of custom) {
        allCmds[c] = commandDescriptions[c] ?? 'Challenge command';
      }
      const lines = ['── Available Commands ──'];
      for (const [name, desc] of Object.entries(allCmds)) {
        lines.push(`  ${name.padEnd(10)}${desc}`);
      }
      setOutput(prev => [...prev, ...lines]);
      return;
    }

    // Standard shell commands
    if (cmd === 'echo') {
      setOutput(prev => [...prev, args.join(' ')]);
      return;
    }

    if (cmd === 'whoami') {
      setOutput(prev => [...prev, 'cyber-intern']);
      return;
    }

    if (cmd === 'pwd') {
      setOutput(prev => [...prev, '/home/cyber-intern']);
      return;
    }

    if (cmd === 'date') {
      setOutput(prev => [...prev, new Date().toString()]);
      return;
    }

    if (cmd === 'uname') {
      const flag = args.includes('-a') ? 'Linux cyberlab 6.6.0-generic #1 SMP x86_64 GNU/Linux' : 'Linux';
      setOutput(prev => [...prev, flag]);
      return;
    }

    if (cmd === 'hostname') {
      setOutput(prev => [...prev, 'cyberlab']);
      return;
    }

    if (cmd === 'env') {
      setOutput(prev => [...prev, 'HOME=/home/cyber-intern', 'SHELL=/bin/bash', 'TERM=xterm-256color', 'USER=cyber-intern']);
      return;
    }

    if (cmd === 'history') {
      setOutput(prev => [...prev, ...history.map((h, i) => `  ${i + 1}  ${h}`)]);
      return;
    }

    if (cmd === 'ls') {
      const files = ['hints.log'];
      if (Object.keys(commands).some(c => !['submit'].includes(c))) {
        files.push('target.env', 'challenge.sh');
      }
      setOutput(prev => [...prev, files.join('  ')]);
      return;
    }

    if (cmd === 'cat') {
      const target = args[0];
      if (!target) {
        setOutput(prev => [...prev, 'cat: missing file operand']);
        return;
      }
      if (target === 'hints.log') {
        setOutput(prev => [...prev, '[Hints available via challenge interface]']);
      } else if (target === 'target.env') {
        setOutput(prev => [...prev, 'TARGET_URL=https://challenge-server.local', 'FLAG_FORMAT=viitor{...}']);
      } else if (target === 'challenge.sh') {
        setOutput(prev => [...prev, '#!/bin/bash', 'echo "Run with: bash challenge.sh"']);
      } else if (target === 'flag.txt') {
        setOutput(prev => [...prev, 'cat: permission denied']);
      } else {
        setOutput(prev => [...prev, `cat: ${target}: No such file or directory`]);
      }
      return;
    }

    if (cmd === 'head' || cmd === 'tail') {
      const target = args[1] || args[0];
      const lines = args[0] === '-n' ? parseInt(args[1]) || 10 : 10;
      if (!target || target.startsWith('-')) {
        setOutput(prev => [...prev, `${cmd}: missing operand`]);
        return;
      }
      if (target === 'hints.log') {
        setOutput(prev => [...prev, `[First/last ${lines} lines of hints.log]`]);
      } else {
        setOutput(prev => [...prev, `${cmd}: ${target}: cannot open file`]);
      }
      return;
    }

    if (cmd === 'grep') {
      if (args.length < 1) {
        setOutput(prev => [...prev, 'Usage: grep <pattern> [file]']);
        return;
      }
      const pattern = args[0];
      const target = args[1];
      setOutput(prev => [...prev, target ? `${target}: match found` : `(${pattern}): match found`]);
      return;
    }

    if (cmd === 'wc') {
      const target = args[0];
      if (!target) {
        setOutput(prev => [...prev, '0 0 0']);
        return;
      }
      setOutput(prev => [...prev, `  1   1  ${target.length} ${target}`]);
      return;
    }

    if (cmd === 'tr') {
      if (args.length < 2) {
        setOutput(prev => [...prev, 'Usage: tr <set1> <set2>']);
        return;
      }
      const input = args.slice(2).join(' ') || args[0];
      setOutput(prev => [...prev, input]);
      return;
    }

    if (cmd === 'base64') {
      if (args[0] === '-d') {
        setOutput(prev => [...prev, '[decoded]']);
      } else {
        setOutput(prev => [...prev, '[encoded]']);
      }
      return;
    }

    if (cmd === 'hash') {
      setOutput(prev => [...prev, `${args[0] || 'md5'}(${args[1] || 'input'}) = [hash]`]);
      return;
    }

    if (cmd === 'curl' || cmd === 'wget') {
      const target = args[args.includes('-O') ? args.indexOf('-O') + 1 : 0];
      if (!target || target.startsWith('-')) {
        setOutput(prev => [...prev, `${cmd}: missing URL`]);
        return;
      }
      setOutput(prev => [...prev, `${cmd}: connecting to ${target}...`, `${cmd}: data saved to ${target.split('/').pop()}`]);
      return;
    }

    if (cmd === 'ping') {
      const target = args[0];
      if (!target) {
        setOutput(prev => [...prev, 'Usage: ping <host>']);
        return;
      }
      setOutput(prev => [...prev, `PING ${target} (127.0.0.1): 56 data bytes`, '64 bytes from 127.0.0.1: icmp_seq=0 ttl=64 time=0.001 ms']);
      return;
    }

    if (cmd === 'nslookup') {
      const target = args[0];
      if (!target) {
        setOutput(prev => [...prev, 'Usage: nslookup <domain>']);
        return;
      }
      setOutput(prev => [...prev, `Server:    127.0.0.1`, `Address:   127.0.0.1#53`, `${target}  canonical name = ${target}.`, `Name:  ${target}.viitor-educat.local`, `Address: 127.0.0.1`]);
      return;
    }

    if (cmd === 'ip') {
      if (args[0] === 'addr') {
        setOutput(prev => [...prev, '1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536', '    inet 127.0.0.1/8 scope host lo', '2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500', '    inet 192.168.1.100/24 scope global eth0']);
      } else if (args[0] === 'route') {
        setOutput(prev => [...prev, 'default via 192.168.1.1 dev eth0', '192.168.1.0/24 dev eth0  proto kernel  scope link  src 192.168.1.100']);
      } else {
        setOutput(prev => [...prev, 'Usage: ip addr | route']);
      }
      return;
    }

    if (cmd === 'netstat') {
      if (args.includes('-t')) {
        setOutput(prev => [...prev, 'Proto Recv-Q Send-Q Local Address           Foreign Address         State', 'tcp        0      0 0.0.0.0:443            0.0.0.0:*               LISTEN', 'tcp        0      0 0.0.0.0:80            0.0.0.0:*               LISTEN']);
      } else {
        setOutput(prev => [...prev, 'Active Internet connections', 'Proto Recv-Q Send-Q Local Address           Foreign Address         State']);
      }
      return;
    }

    if (cmd === 'ps') {
      setOutput(prev => [...prev, '  PID TTY          STAT   TIME COMMAND', '    1 ?        Ss     0:00 /init', '   42 ?        Ss     0:00 /bin/bash', '  100 ?        R      0:00 ps']);
      return;
    }

    if (cmd === 'uptime') {
      setOutput(prev => [...prev, ' ??:??:?? up ??:??,  1 user,  load average: 0.00, 0.01, 0.05']);
      return;
    }

    if (cmd === 'df') {
      setOutput(prev => [...prev, 'Filesystem     1K-blocks    Used Available Use% Mounted on', '/dev/sda1         51200    10240    40960  21% /']);
      return;
    }

    if (cmd === 'free') {
      setOutput(prev => [...prev, '              total        used        free      shared  buff/cache   available', 'Mem:        1024         512         256         128         256         256', 'Swap:         512           0         512']);
      return;
    }

    // Challenge custom commands
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
