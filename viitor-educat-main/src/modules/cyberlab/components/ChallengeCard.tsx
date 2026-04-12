import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TerminalEmulator } from './TerminalEmulator';
import { ChevronDown, ChevronUp, CheckCircle, Lock } from 'lucide-react';

export interface Challenge {
  id: string;
  title: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  points: number;
  description: string;
  hints: string[];
}

interface ChallengeCardProps {
  challenge: Challenge;
  solved: boolean;
  onSolve: (flag: string) => Promise<boolean>;
}

const diffColors = {
  Easy: 'bg-green-500/10 text-green-500 border-green-500/20',
  Medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  Hard: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  Expert: 'bg-red-500/10 text-red-500 border-red-500/20'
};

export function ChallengeCard({ challenge, solved, onSolve }: ChallengeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [hintsOpen, setHintsOpen] = useState<boolean[]>(new Array(challenge.hints.length).fill(false));

  const toggleHint = (index: number) => {
    const newHints = [...hintsOpen];
    newHints[index] = !newHints[index];
    setHintsOpen(newHints);
  };

  const getCommands = () => {
    const commands: Record<string, (args: string[]) => string> = {};
    if (challenge.id === 'sqli-1') {
      commands['login'] = (args) => {
        const input = args.join(' ');
        if (input === "' OR '1'='1") {
          return `Access Granted. Flag: viitor{' OR '1'='1}`;
        }
        return `Access Denied.`;
      };
    }
    // More challenge-specific commands can go here
    commands['submit'] = (args) => {
      const input = args.join(' ');
      if (!input) return 'Usage: submit <flag>';
      onSolve(input).then(correct => {
        if (!correct) {
          console.log("Wrong flag");
        }
      });
      return 'Checking flag...';
    };
    return commands;
  };

  if (!expanded) {
    return (
      <Card 
        className="p-5 cursor-pointer hover:bg-muted/50 transition-colors border border-border group"
        onClick={() => setExpanded(true)}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{challenge.title}</h3>
              {solved && <CheckCircle className="w-4 h-4 text-primary" />}
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-0.5 rounded-full border text-xs">{challenge.category}</div>
              <div className={`px-2 py-0.5 rounded-full border text-xs ${diffColors[challenge.difficulty]}`}>
                {challenge.difficulty}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="font-bold text-xl text-primary">{challenge.points}</span>
            <span className="text-sm text-muted-foreground ml-1">pts</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{challenge.description}</p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col md:flex-row min-h-[500px] border border-border overflow-hidden col-span-full">
      {/* Left Pane: Info */}
      <div className="flex-1 p-6 flex flex-col border-b md:border-b-0 md:border-r border-border bg-card/50">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">{challenge.title}</h2>
            <div className="flex items-center gap-2">
              <div className="px-2 py-0.5 rounded-full border text-xs">{challenge.category}</div>
              <div className={`px-2 py-0.5 rounded-full border text-xs ${diffColors[challenge.difficulty]}`}>{challenge.difficulty}</div>
              <div className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">{challenge.points} Points</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>
            Close
          </Button>
        </div>

        <div className="prose prose-sm dark:prose-invert mb-8">
          <p className="text-base leading-relaxed">{challenge.description}</p>
        </div>

        <div className="mt-auto space-y-4">
          <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Hints</h4>
          <div className="space-y-2">
            {challenge.hints.map((hint, i) => (
              <div key={i} className="rounded-md border border-border overflow-hidden">
                <button 
                  className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors text-sm font-medium"
                  onClick={() => toggleHint(i)}
                >
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Lock className="w-4 h-4" /> Hint {i + 1}
                  </span>
                  {hintsOpen[i] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {hintsOpen[i] && (
                  <div className="p-4 bg-background text-sm text-foreground border-t border-border">
                    {hint}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Pane: Terminal */}
      <div className="flex-1 bg-black p-2 min-h-[400px]">
        <TerminalEmulator 
          commands={getCommands()} 
          initialOutput={[
             `Starting CyberLab Instance...`,
             `Challenge ID: ${challenge.id}`,
             `Target locked. Execute commands to investigate.`,
             `Type 'help' for available commands.`,
             `Use 'submit <flag>' to submit your final answer.`
          ]} 
        />
      </div>
    </Card>
  );
}
