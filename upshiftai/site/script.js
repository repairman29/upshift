// Interactive Terminal Logic - The "Variable Reward" Hook

const command = "upshift analyze .";
const outputLines = [
  { text: "🔍 Scanning dependency tree...", delay: 400 },
  { text: "📦 Found 3 package ecosystems (npm, pip, go)", delay: 800 },
  { text: "⚠️  Detected 5 ancient dependencies", delay: 1200, color: "#d29922" },
  { text: "🛡️  Security Audit: 2 critical vulnerabilities", delay: 1600, color: "#f85149" },
  { text: "🤖 JARVIS: 'I recommend upgrading lodash first. It has a high impact.'", delay: 2400, color: "#3b82f6" },
  { text: "✨ Analysis complete. Run 'upshift fix' to automate.", delay: 3000, color: "#2ea043" }
];

const typeTarget = document.getElementById('type-target');
const outputContainer = document.getElementById('terminal-output');

function typeCommand() {
  let i = 0;
  typeTarget.textContent = "";
  outputContainer.innerHTML = "";
  
  const interval = setInterval(() => {
    typeTarget.textContent += command[i];
    i++;
    if (i >= command.length) {
      clearInterval(interval);
      setTimeout(runOutput, 300);
    }
  }, 50);
}

function runOutput() {
  let totalDelay = 0;
  
  outputLines.forEach(line => {
    totalDelay += line.delay;
    setTimeout(() => {
      const div = document.createElement('div');
      div.textContent = line.text;
      div.style.marginBottom = "6px";
      if (line.color) div.style.color = line.color;
      outputContainer.appendChild(div);
    }, totalDelay);
  });

  // Loop the animation
  setTimeout(typeCommand, totalDelay + 4000);
}

// Start animation on load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(typeCommand, 1000);
});

// Clipboard Logic
document.querySelector('.copy-btn').addEventListener('click', function() {
  navigator.clipboard.writeText('npx upshiftai-deps analyze .');
  const original = this.innerHTML;
  this.innerHTML = '<span style="font-size:12px">✓</span>';
  setTimeout(() => this.innerHTML = original, 2000);
});
// --- Live Scanner Logic ---

const REPLACEMENTS = {
  // npm
  'lodash': { replacement: 'lodash-es', note: 'Tree-shakeable' },
  'request': { replacement: 'axios, node-fetch', note: 'Deprecated' },
  'node-sass': { replacement: 'sass', note: 'Deprecated' },
  'moment': { replacement: 'date-fns', note: 'Maintenance mode' },
  'uuid': { replacement: 'crypto.randomUUID()', note: 'Native API' },
  'axios': { replacement: 'v1.x', note: 'Check CVEs if old' },
  'express': { replacement: 'v5.x', note: 'Major update available' },
  // pip
  'six': { replacement: 'stdlib', note: 'Python 2 legacy' },
  'python-dateutil': { replacement: 'zoneinfo', note: 'Use stdlib' },
  'requests': { replacement: 'httpx', note: 'Async support' }
};

const EXAMPLE_JSON = `{
  "name": "legacy-app",
  "dependencies": {
    "react": "16.8.0",
    "request": "2.88.2",
    "lodash": "4.17.15",
    "moment": "2.24.0",
    "node-sass": "4.14.1"
  },
  "devDependencies": {
    "uuid": "3.4.0"
  }
}`;

document.getElementById('paste-demo').addEventListener('click', () => {
  document.getElementById('scan-textarea').value = EXAMPLE_JSON;
});

document.getElementById('scan-btn').addEventListener('click', () => {
  const input = document.getElementById('scan-textarea').value;
  const output = document.querySelector('.scan-results');
  const placeholder = document.querySelector('.scan-placeholder');
  
  output.innerHTML = ''; // Clear previous
  
  try {
    let deps = {};
    
    // Attempt to parse JSON (npm)
    try {
      const json = JSON.parse(input);
      deps = { ...json.dependencies, ...json.devDependencies };
    } catch (e) {
      // Attempt to parse requirements.txt (simple)
      input.split('\n').forEach(line => {
        const parts = line.split(/[=<>~]/);
        if (parts[0]) deps[parts[0].trim()] = 'unknown';
      });
    }

    const issues = [];
    
    for (const [pkg, version] of Object.entries(deps)) {
      if (REPLACEMENTS[pkg]) {
        issues.push({ pkg, version, ...REPLACEMENTS[pkg], severity: 'high' });
      } else if (pkg.includes('fork') || pkg.includes('legacy')) {
        issues.push({ pkg, version, replacement: 'Check upstream', note: 'Fork detected', severity: 'medium' });
      }
    }

    if (issues.length === 0) {
      output.innerHTML = `<div class="scan-item success">
        <div class="scan-item-header">
          <span class="scan-pkg">No issues found</span>
        </div>
        <p class="scan-reason">Your dependencies look clean against our known database.</p>
      </div>`;
    } else {
      issues.forEach(issue => {
        const div = document.createElement('div');
        div.className = `scan-item ${issue.severity === 'high' ? 'danger' : 'warning'}`;
        div.innerHTML = `
          <div class="scan-item-header">
            <span class="scan-pkg">${issue.pkg}</span>
            <span class="scan-reason">${issue.note}</span>
          </div>
          <div class="scan-fix">
            <span>✨ Use <strong>${issue.replacement}</strong></span>
          </div>
        `;
        output.appendChild(div);
      });
      
      const summary = document.createElement('div');
      summary.style.marginTop = '20px';
      summary.style.textAlign = 'center';
      summary.innerHTML = `<p style="color: var(--text-muted); font-size: 13px;">Found ${issues.length} issues. <a href="docs.html" style="color: var(--accent-primary)">Run full scan</a> for deep analysis.</p>`;
      output.appendChild(summary);
    }

    placeholder.style.display = 'none';
    output.style.display = 'block';

  } catch (e) {
    alert('Could not parse input. Please paste valid package.json or requirements.txt');
  }
});
