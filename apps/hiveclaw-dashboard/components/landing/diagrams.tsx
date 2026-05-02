"use client";

import { C } from "./colors";

export function HeroIllustration() {
  const agents = [
    { id: "A", label: "Researcher", angle: -90, color: C.blue, r: 160 },
    { id: "B", label: "Planner", angle: -30, color: C.purple, r: 160 },
    { id: "C", label: "Writer", angle: 30, color: C.orange, r: 160 },
    { id: "D", label: "Security", angle: 90, color: C.red, r: 160 },
    { id: "E", label: "Demo", angle: 150, color: C.green, r: 160 },
    { id: "F", label: "Executor", angle: 210, color: C.purple, r: 160 },
  ];
  const cx = 260;
  const cy = 240;

  return (
    <svg viewBox="0 0 520 480" width="520" height="480" xmlns="http://www.w3.org/2000/svg" style={{ maxWidth: "100%" }}>
      <defs>
        <filter id="hc-softblur">
          <feGaussianBlur stdDeviation="18" />
        </filter>
      </defs>

      <ellipse cx={cx} cy={cy} rx={90} ry={70} fill={C.purple} opacity="0.10" filter="url(#hc-softblur)" />

      {agents.map((a) => {
        const rad = (a.angle * Math.PI) / 180;
        const ax = cx + Math.cos(rad) * a.r;
        const ay = cy + Math.sin(rad) * a.r;
        const mx = cx + Math.cos(rad) * 70;
        const my = cy + Math.sin(rad) * 70;
        return (
          <g key={a.id}>
            <line x1={ax} y1={ay} x2={mx} y2={my} stroke={a.color} strokeWidth="2" strokeDasharray="5,4" opacity="0.7" />
            <circle cx={mx + Math.cos(rad) * -6} cy={my + Math.sin(rad) * -6} r={3} fill={a.color} opacity="0.9" />
          </g>
        );
      })}

      <polygon
        points={`${cx},${cy - 58} ${cx + 50},${cy - 29} ${cx + 50},${cy + 29} ${cx},${cy + 58} ${cx - 50},${cy + 29} ${cx - 50},${cy - 29}`}
        fill="#f8f4ff"
        stroke={C.purple}
        strokeWidth="2.5"
      />
      <text x={cx} y={cy - 8} textAnchor="middle" fontFamily="Inter,sans-serif" fontWeight="700" fontSize="11" fill={C.purple}>
        Shared Hive
      </text>
      <text x={cx} y={cy + 7} textAnchor="middle" fontFamily="Inter,sans-serif" fontWeight="700" fontSize="11" fill={C.purple}>
        Memory
      </text>
      <text x={cx} y={cy + 22} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="9" fill={C.muted}>
        🔐 encrypted
      </text>

      {agents.map((a) => {
        const rad = (a.angle * Math.PI) / 180;
        const ax = cx + Math.cos(rad) * a.r;
        const ay = cy + Math.sin(rad) * a.r;
        return (
          <g key={`n-${a.id}`}>
            <circle cx={ax} cy={ay} r={30} fill={a.color + "20"} stroke={a.color} strokeWidth="2" />
            <text x={ax} y={ay + 4} textAnchor="middle" fontFamily="Inter,sans-serif" fontWeight="700" fontSize="11" fill={a.color}>
              {a.id}
            </text>
            <text x={ax} y={ay + 42} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="9" fill={C.muted}>
              {a.label}
            </text>
            <ellipse
              cx={ax + Math.cos(rad) * 44}
              cy={ay + Math.sin(rad) * 44}
              rx={16}
              ry={10}
              fill={a.color + "18"}
              stroke={a.color}
              strokeWidth="1.2"
              strokeDasharray="3,2"
            />
            <text
              x={ax + Math.cos(rad) * 44}
              y={ay + Math.sin(rad) * 44 + 4}
              textAnchor="middle"
              fontFamily="Inter,sans-serif"
              fontSize="7"
              fill={a.color}
            >
              priv
            </text>
          </g>
        );
      })}

      <rect x="400" y="60" width="100" height="48" rx="12" fill="#e8fff6" stroke={C.green} strokeWidth="2" />
      <text x="450" y="80" textAnchor="middle" fontFamily="Inter,sans-serif" fontWeight="700" fontSize="10" fill={C.green}>
        0G Storage
      </text>
      <text x="450" y="96" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="8.5" fill={C.muted}>
        encrypted blobs
      </text>
      <line x1={cx + 50} y1={cy - 20} x2="400" y2="84" stroke={C.green} strokeWidth="1.5" strokeDasharray="4,3" opacity="0.6" />

      <rect x="400" y="360" width="100" height="48" rx="12" fill="#fff3e8" stroke={C.orange} strokeWidth="2" />
      <text x="450" y="380" textAnchor="middle" fontFamily="Inter,sans-serif" fontWeight="700" fontSize="10" fill={C.orange}>
        0G Chain
      </text>
      <text x="450" y="396" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="8.5" fill={C.muted}>
        HiveRegistry
      </text>
      <line x1={cx + 50} y1={cy + 20} x2="400" y2="384" stroke={C.orange} strokeWidth="1.5" strokeDasharray="4,3" opacity="0.6" />
    </svg>
  );
}

export function ArchDiagram() {
  return (
    <svg viewBox="0 0 700 360" width="100%" xmlns="http://www.w3.org/2000/svg" style={{ maxWidth: 700 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect x={30 + i * 120} y={20} width={90} height={60} rx={12} fill={C.green + "18"} stroke={C.green} strokeWidth="1.5" />
          <text x={75 + i * 120} y={46} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="10" fontWeight="700" fill={C.green}>
            Agent {i + 1}
          </text>
          <text x={75 + i * 120} y={61} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="8.5" fill={C.muted}>
            HiveClaw
          </text>
          <line x1={75 + i * 120} y1={80} x2={75 + i * 120} y2={120} stroke={C.green} strokeWidth="1.5" strokeDasharray="3,3" />
        </g>
      ))}

      <rect x={215} y={120} width={170} height={48} rx={12} fill={C.purple + "18"} stroke={C.purple} strokeWidth="2" />
      <text x={300} y={140} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="11" fontWeight="700" fill={C.purple}>
        Memory Router
      </text>
      <text x={300} y={157} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="9" fill={C.muted}>
        routes private vs shared
      </text>

      <rect x={60} y={220} width={130} height={50} rx={12} fill={C.blue + "15"} stroke={C.blue} strokeWidth="1.5" />
      <text x={125} y={241} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="10" fontWeight="700" fill={C.blue}>
        Private Memory
      </text>
      <text x={125} y={257} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="8.5" fill={C.muted}>
        per-agent namespace
      </text>
      <line x1={215} y1={168} x2={125} y2={220} stroke={C.blue} strokeWidth="1.5" strokeDasharray="4,3" />

      <rect x={335} y={220} width={150} height={50} rx={12} fill={C.purple + "15"} stroke={C.purple} strokeWidth="1.5" />
      <text x={410} y={241} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="10" fontWeight="700" fill={C.purple}>
        Shared Hive Mem
      </text>
      <text x={410} y={257} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="8.5" fill={C.muted}>
        encrypted before upload
      </text>
      <line x1={385} y1={168} x2={410} y2={220} stroke={C.purple} strokeWidth="1.5" strokeDasharray="4,3" />

      <rect x={330} y={310} width={100} height={40} rx={10} fill={C.green + "18"} stroke={C.green} strokeWidth="1.5" />
      <text x={380} y={326} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="10" fontWeight="700" fill={C.green}>
        0G Storage
      </text>
      <text x={380} y={341} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="8.5" fill={C.muted}>
        encrypted blobs
      </text>
      <line x1={380} y1={270} x2={380} y2={310} stroke={C.green} strokeWidth="1.5" />

      <rect x={490} y={310} width={100} height={40} rx={10} fill={C.orange + "18"} stroke={C.orange} strokeWidth="1.5" />
      <text x={540} y={326} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="10" fontWeight="700" fill={C.orange}>
        0G Chain
      </text>
      <text x={540} y={341} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="8.5" fill={C.muted}>
        HiveRegistry
      </text>
      <line x1={490} y1={310} x2={460} y2={270} stroke={C.orange} strokeWidth="1.5" strokeDasharray="4,3" />
    </svg>
  );
}
