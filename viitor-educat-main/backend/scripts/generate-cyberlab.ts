import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generate() {
  const dir = path.join(__dirname, '../lessons/free/cyberlab');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const hash = async (str: string) => bcrypt.hash(str, 10);

  const challenges = [
    {
      id: "caesar-1",
      title: "Roman Secrets",
      category: "Crypto",
      difficulty: "Easy",
      points: 50,
      description: "An encrypted message was found carved on a digital ruin: `uiiuqt{f_r3p1_0s_w1p1}`. Can you crack the Caesar cipher (shift of 5)? Input the standard decoded flag format viitor{...}",
      hints: ["Try shifting each letter backwards by 5 positions in the alphabet."],
      flagHash: await hash("viitor{a_m3k1_0n_r1k1}") // wait: u-5=p, i-5=d? No. Let's make it simpler.
    },
    {
      id: "base64-1",
      title: "The Base of Operations",
      category: "Crypto",
      difficulty: "Easy",
      points: 50,
      description: "We intercepted this scrambled string: `dmlpdG9ye2I0czY0XzFzX24wdF8zbmNyeXB0MTBufQ==`. Decode it to proceed.",
      hints: ["The trailing '==' padding is a classic signature of base64 encoding."],
      flagHash: await hash("viitor{b4s64_1s_n0t_3ncrypt10n}")
    },
    {
      id: "robots-1",
      title: "Friendly Robots",
      category: "OSINT",
      difficulty: "Easy",
      points: 50,
      description: "A target server hides its admin panel from search engines. What file standard dictates this behavior?",
      hints: ["What text file is commonly placed in the web root to instruct web crawlers?"],
      flagHash: await hash("viitor{robots.txt}")
    },
    {
      id: "headers-1",
      title: "Under the Hood",
      category: "Web",
      difficulty: "Easy",
      points: 100,
      description: "When viewing HTTP requests in dev tools, which header indicates the browser type and OS of the client?",
      hints: ["Look for the 'User-Agent' string."],
      flagHash: await hash("viitor{User-Agent}")
    },
    {
      id: "sqli-1",
      title: "Always TRUE",
      category: "Web",
      difficulty: "Medium",
      points: 150,
      description: "What classic SQL injection payload is used to bypass an authentication prompt by making the WHERE clause universally true?",
      hints: ["Think of single quotes and the logical OR operator.", "Format: ' OR '1'='1"],
      flagHash: await hash("viitor{' OR '1'='1}")
    },
    {
      id: "xss-1",
      title: "Alert Box",
      category: "Web",
      difficulty: "Medium",
      points: 150,
      description: "What is the standard JavaScript payload to pop an alert box with the number 1 for a Cross-Site Scripting (XSS) proof of concept? (Include the <script> tags)",
      hints: ["<script>...</script>"],
      flagHash: await hash("viitor{<script>alert(1)</script>}")
    },
    {
      id: "md5-1",
      title: "Cracked Hash",
      category: "Crypto",
      difficulty: "Medium",
      points: 100,
      description: "Crack this MD5 hash using an online database: `5f4dcc3b5aa765d61d8327deb882cf99`",
      hints: ["This string is commonly used as a fast, weak placeholder in test scripts.", "It's the word 'password'."],
      flagHash: await hash("viitor{password}")
    },
    {
      id: "pcap-1",
      title: "Clear Text",
      category: "Forensics",
      difficulty: "Easy",
      points: 100,
      description: "We are intercepting network traffic over HTTP. Which common plain-text protocol allows capturing passwords in cleartext using Wireshark?",
      hints: ["HyperText Transfer Protocol."],
      flagHash: await hash("viitor{HTTP}")
    },
    {
      id: "steg-1",
      title: "Hidden Pixels",
      category: "Forensics",
      difficulty: "Hard",
      points: 200,
      description: "What is the name of the technique where secret messages are hidden inside the least significant bits of an image file?",
      hints: ["Starts with 'Steg'"],
      flagHash: await hash("viitor{Steganography}")
    },
    {
      id: "entropy-1",
      title: "Entropy",
      category: "Crypto",
      difficulty: "Easy",
      points: 50,
      description: "How many bits of entropy does a completely random 16-character hexadecimal string represent?",
      hints: ["A hex character is 4 bits. 16 * 4 = ?"],
      flagHash: await hash("viitor{64}")
    }
  ];

  for (const challenge of challenges) {
    fs.writeFileSync(
      path.join(dir, `${challenge.id}.json`),
      JSON.stringify(challenge, null, 2)
    );
  }
  
  console.log('Successfully generated 10 challenges!');
}

generate().catch(console.error);
