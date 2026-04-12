import React from 'react';
import { CheckCircle2, Shield, Swords, Activity, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';

export interface CertNode {
  id: string;
  title: string;
  roles: 'Beginner' | 'Red Team' | 'Blue Team';
  x: number;
  y: number;
  completed?: boolean;
}

export interface CertEdge {
  from: string;
  to: string;
}

const NODES: CertNode[] = [
  { id: 'itf', title: 'CompTIA IT Fund.', roles: 'Beginner', x: 20, y: 50 },
  { id: 'sec', title: 'Security+', roles: 'Beginner', x: 40, y: 50 },
  { id: 'cys', title: 'CySA+', roles: 'Blue Team', x: 60, y: 25 },
  { id: 'casp', title: 'CASP+', roles: 'Blue Team', x: 80, y: 25 },
  { id: 'cissp', title: 'CISSP', roles: 'Blue Team', x: 100, y: 25 },
  { id: 'pent', title: 'PenTest+', roles: 'Red Team', x: 60, y: 75 },
  { id: 'ceh', title: 'CEH', roles: 'Red Team', x: 80, y: 75 },
  { id: 'oscp', title: 'OSCP', roles: 'Red Team', x: 100, y: 75 },
];

const EDGES: CertEdge[] = [
  { from: 'itf', to: 'sec' },
  { from: 'sec', to: 'cys' },
  { from: 'sec', to: 'pent' },
  { from: 'cys', to: 'casp' },
  { from: 'casp', to: 'cissp' },
  { from: 'pent', to: 'ceh' },
  { from: 'ceh', to: 'oscp' },
];

export function CertRoadmap({ userCompleted = [] }: { userCompleted?: string[] }) {
  const containerWidth = 800;
  const containerHeight = 400;

  const getNodeCoords = (xPercent: number, yPercent: number) => {
    return {
      x: (xPercent / 120) * containerWidth,
      y: (yPercent / 100) * containerHeight,
    };
  };

  const isCompleted = (id: string) => userCompleted.includes(id);
  
  // Simulate one node as "current" (the next immediate one to take)
  const isCurrent = (id: string) => {
    if (isCompleted(id)) return false;
    // Simple heuristic: if all incoming edges are from completed nodes, it's current.
    const incomingEdges = EDGES.filter(e => e.to === id);
    if (incomingEdges.length === 0) return true; // Root
    return incomingEdges.some(e => isCompleted(e.from));
  };

  return (
    <Card data-card="true" className="p-8 pb-12 relative overflow-hidden bg-black/40 border-[#00ff88]/30 mt-6 shadow-[0_0_15px_rgba(0,255,136,0.1)]">
      <div className="flex items-center gap-2 mb-8">
        <Activity className="w-6 h-6 text-[#00ff88]" />
        <h2 className="text-xl font-bold tracking-tight text-[#00ff88] uppercase">Certification Roadmap</h2>
      </div>

      <div className="relative w-full h-[400px] overflow-x-auto overflow-y-hidden">
        <div className="min-w-[800px] h-full relative">
          
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
              <linearGradient id="neonGlowBase" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(0, 255, 136, 0.2)" />
                <stop offset="100%" stopColor="rgba(0, 255, 136, 0.8)" />
              </linearGradient>
            </defs>

            {EDGES.map((edge, i) => {
              const startNode = NODES.find(n => n.id === edge.from);
              const endNode = NODES.find(n => n.id === edge.to);
              if (!startNode || !endNode) return null;

              const c1 = getNodeCoords(startNode.x, startNode.y);
              const c2 = getNodeCoords(endNode.x, endNode.y);
              
              const completedLine = isCompleted(startNode.id) && isCompleted(endNode.id);
              const activeLine = isCompleted(startNode.id) && !isCompleted(endNode.id);

              return (
                <path
                  key={i}
                  d={`M ${c1.x} ${c1.y} C ${(c1.x + c2.x)/2} ${c1.y}, ${(c1.x + c2.x)/2} ${c2.y}, ${c2.x} ${c2.y}`}
                  fill="none"
                  stroke={completedLine ? '#00ff88' : activeLine ? 'url(#neonGlowBase)' : 'rgba(0, 255, 136, 0.15)'}
                  strokeWidth="3"
                  className={activeLine ? 'animate-pulse drop-shadow-[0_0_5px_rgba(0,255,136,0.8)]' : ''}
                />
              );
            })}
          </svg>

          {NODES.map((node) => {
            const coords = getNodeCoords(node.x, node.y);
            const comp = isCompleted(node.id);
            const cur = isCurrent(node.id);

            return (
              <div
                key={node.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group z-10 transition-transform hover:scale-105 cursor-pointer"
                style={{ left: coords.x, top: coords.y }}
              >
                <div 
                  className={`relative flex items-center justify-center w-14 h-14 rounded-full border-2 bg-black/80
                    ${comp ? 'border-[#00ff88] text-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.5)]' : 
                      cur ? 'border-yellow-400 text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-pulse' : 
                      'border-[#00ff88]/30 text-[#00ff88]/40 shadow-none'}`}
                >
                  {comp ? <CheckCircle2 className="w-6 h-6" /> : 
                   node.roles === 'Red Team' ? <Swords className="w-6 h-6" /> :
                   node.roles === 'Blue Team' ? <Shield className="w-6 h-6" /> : 
                   <ArrowRight className="w-6 h-6" />}
                </div>
                <div className="mt-3 text-center">
                  <p className={`font-mono font-semibold text-sm ${comp ? 'text-[#00ff88]' : cur ? 'text-yellow-400' : 'text-[#00ff88]/60'}`}>
                    {node.title}
                  </p>
                  <p className="text-[10px] text-[#00ff88]/40 uppercase tracking-wider">{node.roles}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
