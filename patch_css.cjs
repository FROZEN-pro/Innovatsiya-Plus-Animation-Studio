const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

css += `
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-surface: var(--surface);
  --color-surface-hover: var(--surface-hover);
  --color-border: var(--border);
  --color-muted: var(--muted);
}

:root {
  --background: #f8fafc;
  --foreground: #0f172a;
  --surface: rgba(0, 0, 0, 0.05);
  --surface-hover: rgba(0, 0, 0, 0.1);
  --border: rgba(0, 0, 0, 0.1);
  --primary: #f59e0b;
  --primary-foreground: #000000;
  --muted: rgba(0, 0, 0, 0.5);
}

.dark {
  --background: #050505;
  --foreground: #ffffff;
  --surface: rgba(255, 255, 255, 0.05);
  --surface-hover: rgba(255, 255, 255, 0.1);
  --border: rgba(255, 255, 255, 0.1);
  --primary: #f59e0b;
  --primary-foreground: #000000;
  --muted: rgba(255, 255, 255, 0.5);
}

html, body {
  background-color: var(--background);
  color: var(--foreground);
  transition: background-color 0.3s ease, color 0.3s ease;
}
`;

fs.writeFileSync('src/index.css', css);
