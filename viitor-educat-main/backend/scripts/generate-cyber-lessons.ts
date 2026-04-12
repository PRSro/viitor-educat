import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIR = path.join(__dirname, '../lessons/free/cybersecurity');

if (!fs.existsSync(DIR)) {
  fs.mkdirSync(DIR, { recursive: true });
}

const lessons = [
  // Fundamentals
  { id: 'fund-1', category: 'Fundamentals', title: 'The CIA Triad', desc: 'Confidentiality, Integrity, and Availability concepts.' },
  { id: 'fund-2', category: 'Fundamentals', title: 'Threat Modeling', desc: 'Identifying, communicating, and understanding threats.' },
  { id: 'fund-3', category: 'Fundamentals', title: 'Attack Surfaces', desc: 'Mapping physical and digital vulnerabilities.' },
  // Networking
  { id: 'net-1', category: 'Networking', title: 'TCP/IP Fundamentals', desc: 'Understanding the layers of standard network communication.' },
  { id: 'net-2', category: 'Networking', title: 'DNS Security', desc: 'How domains map and how they are poisoned.' },
  { id: 'net-3', category: 'Networking', title: 'HTTP vs HTTPS', desc: 'The backbone of web transport encryption.' },
  { id: 'net-4', category: 'Networking', title: 'Firewalls and VPNs', desc: 'Perimeter defense and secure tunnels.' },
  // Web Security (OWASP)
  { id: 'web-1', category: 'Web Security', title: 'SQL Injection', desc: 'Exploiting untrusted database inputs.' },
  { id: 'web-2', category: 'Web Security', title: 'Cross-Site Scripting (XSS)', desc: 'Client-side payload reflection.' },
  { id: 'web-3', category: 'Web Security', title: 'CSRF', desc: 'Cross-Site Request Forgery vulnerabilities.' },
  { id: 'web-4', category: 'Web Security', title: 'Insecure Direct Object References', desc: 'IDOR and access control flaws.' },
  { id: 'web-5', category: 'Web Security', title: 'Server-Side Request Forgery', desc: 'Coercing servers to make arbitrary requests.' },
  { id: 'web-6', category: 'Web Security', title: 'XXE Injection', desc: 'XML External Entity exploits.' },
  { id: 'web-7', category: 'Web Security', title: 'Remote Code Execution', desc: 'Executing arbitrary shell logic via the web layer.' },
  { id: 'web-8', category: 'Web Security', title: 'Broken Authentication', desc: 'Bypassing weak session management protocols.' },
  // Cryptography
  { id: 'crypt-1', category: 'Cryptography', title: 'Symmetric vs Asymmetric', desc: 'Shared keys vs key pairs.' },
  { id: 'crypt-2', category: 'Cryptography', title: 'Hashing Algorithms', desc: 'One-way math and collision resistance.' },
  { id: 'crypt-3', category: 'Cryptography', title: 'TLS Handshakes', desc: 'How certificates negotiate secure lines.' },
  // Operating Systems
  { id: 'os-1', category: 'Operating Systems', title: 'Linux Hardening', desc: 'Securing vanilla distributions.' },
  { id: 'os-2', category: 'Operating Systems', title: 'File Permissions & Isolation', desc: 'chmod, chown, and container sandboxing.' },
];

async function generate() {
  for (const l of lessons) {
    const filename = path.join(DIR, `${l.id}.json`);
    const data = {
      id: l.id,
      title: l.title,
      description: l.desc,
      category: 'Cybersecurity',
      topics: [l.category],
      difficulty: 'Beginner',
      estimatedDuration: 15,
      content: `### Welcome to ${l.title}
This lesson covers the fundamentals of ${l.title}.
Understand how ${l.desc} impacts modern security protocols.`,
      videoId: null,
      order: parseInt(l.id.split('-')[1]) || 1,
      createdAt: new Date().toISOString()
    };
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`Created ${filename}`);
  }
}

generate().catch(console.error);
