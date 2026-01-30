import { existsSync, readFileSync } from "fs";
import path from "path";

export type UpshiftConfig = {
  // Packages to always skip when upgrading
  ignore?: string[];
  
  // Default upgrade mode: "all" | "minor" | "patch"
  defaultMode?: "all" | "minor" | "patch";
  
  // Auto-run tests after upgrade
  autoTest?: boolean;
  
  // Skip confirmation prompts
  autoConfirm?: boolean;
  
  // AI settings
  ai?: {
    // Auto-enable AI for explains
    autoEnable?: boolean;
    // Max credits to use per session
    maxCredits?: number;
  };
  
  // Scan settings
  scan?: {
    // Exclude these packages from scan results
    exclude?: string[];
    // Only show packages above this severity
    minSeverity?: "low" | "moderate" | "high" | "critical";
  };
  
  // Registry settings
  registry?: {
    // Custom npm registry URL
    url?: string;
    // Auth token (use env var reference like $NPM_TOKEN)
    token?: string;
  };
};

const CONFIG_FILES = [
  ".upshiftrc.json",
  ".upshiftrc",
  "upshift.config.json",
];

const DEFAULT_CONFIG: UpshiftConfig = {
  ignore: [],
  defaultMode: "minor",
  autoTest: true,
  autoConfirm: false,
  ai: {
    autoEnable: false,
    maxCredits: 50,
  },
  scan: {
    exclude: [],
    minSeverity: "low",
  },
};

let cachedConfig: UpshiftConfig | null = null;

export function loadConfig(cwd: string = process.cwd()): UpshiftConfig {
  if (cachedConfig) return cachedConfig;

  for (const filename of CONFIG_FILES) {
    const configPath = path.join(cwd, filename);
    if (existsSync(configPath)) {
      try {
        const raw = readFileSync(configPath, "utf8");
        const userConfig = JSON.parse(raw) as Partial<UpshiftConfig>;
        cachedConfig = mergeConfig(DEFAULT_CONFIG, userConfig);
        return cachedConfig;
      } catch (error) {
        console.warn(`Warning: Failed to parse ${filename}: ${error}`);
      }
    }
  }

  cachedConfig = DEFAULT_CONFIG;
  return cachedConfig;
}

export function clearConfigCache(): void {
  cachedConfig = null;
}

function mergeConfig(
  defaults: UpshiftConfig,
  user: Partial<UpshiftConfig>
): UpshiftConfig {
  return {
    ...defaults,
    ...user,
    ai: { ...defaults.ai, ...user.ai },
    scan: { ...defaults.scan, ...user.scan },
    registry: user.registry ? { ...defaults.registry, ...user.registry } : defaults.registry,
  };
}

export function shouldIgnorePackage(config: UpshiftConfig, packageName: string): boolean {
  if (!config.ignore || config.ignore.length === 0) return false;
  
  return config.ignore.some(pattern => {
    if (pattern.includes("*")) {
      // Simple glob matching
      const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
      return regex.test(packageName);
    }
    return packageName === pattern;
  });
}

export function createConfigTemplate(): string {
  return JSON.stringify(
    {
      "$schema": "https://upshiftai.dev/schema/config.json",
      ignore: ["@types/*"],
      defaultMode: "minor",
      autoTest: true,
      autoConfirm: false,
      ai: {
        autoEnable: false,
        maxCredits: 50,
      },
      scan: {
        exclude: [],
        minSeverity: "low",
      },
    },
    null,
    2
  );
}
