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