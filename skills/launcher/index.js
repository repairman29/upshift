const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Helper function to execute shell commands safely
function execCommand(command, options = {}) {
  try {
    return execSync(command, { 
      encoding: 'utf8', 
      timeout: 10000,
      ...options 
    }).trim();
  } catch (error) {
    throw new Error(`Command failed: ${error.message}`);
  }
}

// Helper function to check if running on macOS
function isMacOS() {
  return process.platform === 'darwin';
}

// Helper function to check if running on Windows
function isWindows() {
  return process.platform === 'win32';
}

// Helper function to run PowerShell (Windows)
function execPowerShell(script) {
  const escaped = script.replace(/'/g, "''");
  return execSync(`powershell -NoProfile -Command "${escaped}"`, {
    encoding: 'utf8',
    timeout: 15000,
    windowsHide: true
  }).trim();
}

// Helper function to get app bundle ID from name (macOS)
function getAppBundleId(appName) {
  const commonApps = {
    'chrome': 'com.google.Chrome',
    'firefox': 'org.mozilla.firefox',
    'safari': 'com.apple.Safari',
    'vs code': 'com.microsoft.VSCode',
    'cursor': 'com.todesktop.230313mzl4w4u92',
    'slack': 'com.tinyspeck.slackmacgap',
    'spotify': 'com.spotify.client',
    'discord': 'com.hnc.Discord',
    'notion': 'notion.id',
    'figma': 'com.figma.Desktop'
  };
  const normalizedName = appName.toLowerCase();
  return commonApps[normalizedName] || appName;
}

// Windows: map friendly name to process/Start-Process target
function getWindowsAppTarget(appName) {
  const map = {
    'chrome': 'chrome',
    'google chrome': 'chrome',
    'firefox': 'firefox',
    'edge': 'msedge',
    'microsoft edge': 'msedge',
    'vs code': 'code',
    'code': 'code',
    'cursor': 'cursor',
    'slack': 'slack',
    'spotify': 'spotify',
    'discord': 'discord',
    'notion': 'notion',
    'figma': 'figma',
    'teams': 'teams',
    'microsoft teams': 'teams',
    'outlook': 'outlook',
    'explorer': 'explorer',
    'notepad': 'notepad',
    'calculator': 'calculator',
    'cmd': 'cmd',
    'powershell': 'powershell'
  };
  const normalized = appName.toLowerCase().trim();
  return map[normalized] || appName;
}

// Tool implementations
const tools = {
  launch_app: async ({ app, newInstance = false }) => {
    if (isWindows()) {
      try {
        const target = getWindowsAppTarget(app);
        const ps = newInstance
          ? `Start-Process -FilePath "${target}"`
          : `Start-Process -FilePath "${target}"`;
        execPowerShell(ps);
        return {
          success: true,
          message: `Launched ${app}${newInstance ? ' (new instance)' : ''}`,
          app: app,
          platform: 'windows'
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to launch ${app}: ${error.message}. On Windows, use the app name (e.g. chrome, notepad) or full path.`,
          app: app
        };
      }
    }
    if (!isMacOS()) {
      throw new Error('App launching currently only supported on macOS and Windows');
    }

    try {
      const bundleId = getAppBundleId(app);
      const command = newInstance 
        ? `open -n -a "${bundleId}"`
        : `open -a "${bundleId}"`;
      
      execCommand(command);
      return {
        success: true,
        message: `Launched ${app}${newInstance ? ' (new instance)' : ''}`,
        app: app,
        bundleId: bundleId
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to launch ${app}: ${error.message}`,
        app: app
      };
    }
  },

  quit_app: async ({ app, force = false }) => {
    if (isWindows()) {
      try {
        const target = getWindowsAppTarget(app);
        const exe = target.includes('.exe') ? target : `${target}.exe`;
        const ps = force
          ? `Get-Process -Name "${target}" -ErrorAction SilentlyContinue | Stop-Process -Force`
          : `Get-Process -Name "${target}" -ErrorAction SilentlyContinue | Stop-Process`;
        execPowerShell(ps);
        return {
          success: true,
          message: `${force ? 'Force ' : ''}Quit ${app}`,
          app: app,
          force: force,
          platform: 'windows'
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to quit ${app}: ${error.message}. Use the process name without .exe (e.g. chrome, notepad).`,
          app: app
        };
      }
    }
    if (!isMacOS()) {
      throw new Error('App quitting currently only supported on macOS and Windows');
    }

    try {
      const bundleId = getAppBundleId(app);
      const command = force 
        ? `pkill -f "${bundleId}" || killall "${app}"`
        : `osascript -e 'quit app "${app}"'`;
      
      execCommand(command);
      return {
        success: true,
        message: `${force ? 'Force ' : ''}Quit ${app}`,
        app: app,
        force: force
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to quit ${app}: ${error.message}`,
        app: app
      };
    }
  },

  list_running_apps: async ({ sortBy = 'name' }) => {
    if (isWindows()) {
      try {
        const ps = `Get-Process | Where-Object { $_.MainWindowTitle -ne '' -or $_.ProcessName -match '^(chrome|firefox|code|cursor|slack|discord|spotify|notion|teams|outlook)$' } | Select-Object -First 50 ProcessName, Id, @{N='MemoryMB';E={[math]::Round($_.WorkingSet64/1MB,1)}}, @{N='CPU';E={$_.CPU}} | ConvertTo-Json -Compress`;
        const out = execPowerShell(ps);
        let procs = [];
        try {
          procs = JSON.parse(out);
          if (!Array.isArray(procs)) procs = [procs];
        } catch {
          return { success: true, apps: [], totalApps: 0, sortedBy: sortBy, platform: 'windows' };
        }
        const apps = procs.map(p => ({
          pid: p.Id,
          name: (p.ProcessName || '').replace('.exe', ''),
          memoryMB: Math.round(p.MemoryMB || 0),
          memoryPercent: 0,
          cpu: parseFloat(p.CPU) || 0
        }));
        apps.sort((a, b) => {
          switch (sortBy) {
            case 'memory': return (b.memoryMB || 0) - (a.memoryMB || 0);
            case 'cpu': return (b.cpu || 0) - (a.cpu || 0);
            default: return (a.name || '').localeCompare(b.name || '');
          }
        });
        return {
          success: true,
          apps: apps.slice(0, 20),
          totalApps: apps.length,
          sortedBy: sortBy,
          platform: 'windows'
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to list running apps: ${error.message}`
        };
      }
    }
    if (!isMacOS()) {
      throw new Error('App listing currently only supported on macOS and Windows');
    }

    try {
      // Get running applications with memory usage
      const psOutput = execCommand(`ps axo pid,comm,%mem,rss -r`);
      const lines = psOutput.split('\n').slice(1); // Skip header
      
      const apps = lines
        .filter(line => line.trim() && line.includes('.app'))
        .map(line => {
          const parts = line.trim().split(/\s+/);
          const pid = parts[0];
          const memPercent = parts[2];
          const memKB = parts[3];
          const comm = parts.slice(1, -2).join(' ');
          const appName = comm.split('/').pop().replace('.app', '');
          
          return {
            pid: parseInt(pid),
            name: appName,
            memoryPercent: parseFloat(memPercent),
            memoryMB: Math.round(parseInt(memKB) / 1024),
            command: comm
          };
        });

      // Sort based on preference
      apps.sort((a, b) => {
        switch (sortBy) {
          case 'memory':
            return b.memoryMB - a.memoryMB;
          case 'cpu':
            return b.memoryPercent - a.memoryPercent; // Using memory % as proxy
          default:
            return a.name.localeCompare(b.name);
        }
      });

      return {
        success: true,
        apps: apps.slice(0, 20), // Limit to top 20
        totalApps: apps.length,
        sortedBy: sortBy
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to list running apps: ${error.message}`
      };
    }
  },

  system_control: async ({ action, value }) => {
    if (isWindows()) {
      try {
        let ps, message;
        switch (action) {
          case 'lock':
            ps = 'rundll32 user32.dll,LockWorkStation';
            message = 'Screen locked';
            execSync(ps, { windowsHide: true, timeout: 5000 });
            break;
          case 'sleep':
            ps = 'rundll32 powrprof.dll,SetSuspendState 0,1,0';
            message = 'System going to sleep';
            execSync(ps, { windowsHide: true, timeout: 5000 });
            break;
          case 'volume_up': {
            const v = `Add-Type -TypeDefinition "using System;using System.Runtime.InteropServices;public class V{ [DllImport(\\\"user32.dll\\\")]public static extern void keybd_event(byte b,byte s,uint f,UIntPtr e);public static void U(){ keybd_event(0xAF,0,0,UIntPtr.Zero);keybd_event(0xAF,0,2,UIntPtr.Zero);} }"; [V]::U()`;
            execPowerShell(v);
            message = value ? `Set volume to ${value}%` : 'Volume increased';
            break;
          }
          case 'volume_down': {
            const v = `Add-Type -TypeDefinition "using System;using System.Runtime.InteropServices;public class V{ [DllImport(\\\"user32.dll\\\")]public static extern void keybd_event(byte b,byte s,uint f,UIntPtr e);public static void D(){ keybd_event(0xAE,0,0,UIntPtr.Zero);keybd_event(0xAE,0,2,UIntPtr.Zero);} }"; [V]::D()`;
            execPowerShell(v);
            message = value ? `Set volume to ${value}%` : 'Volume decreased';
            break;
          }
          case 'volume_mute': {
            const v = `Add-Type -TypeDefinition "using System;using System.Runtime.InteropServices;public class V{ [DllImport(\\\"user32.dll\\\")]public static extern void keybd_event(byte b,byte s,uint f,UIntPtr e);public static void M(){ keybd_event(0xAD,0,0,UIntPtr.Zero);keybd_event(0xAD,0,2,UIntPtr.Zero);} }"; [V]::M()`;
            execPowerShell(v);
            message = 'Volume muted';
            break;
          }
          case 'brightness_up':
          case 'brightness_down':
          case 'wifi_on':
          case 'wifi_off':
          case 'bluetooth_on':
          case 'bluetooth_off':
          case 'restart':
          case 'shutdown':
          case 'empty_trash':
          case 'toggle_dark_mode':
            return {
              success: false,
              message: `"${action}" not yet implemented on Windows. Use Settings or system tray.`,
              action: action,
              platform: 'windows'
            };
          default:
            throw new Error(`Unknown system action: ${action}`);
        }
        return { success: true, message, action, value, platform: 'windows' };
      } catch (error) {
        return {
          success: false,
          message: `System control failed: ${error.message}`,
          action: action
        };
      }
    }
    if (!isMacOS()) {
      throw new Error('System control currently only supported on macOS and Windows');
    }

    try {
      let command;
      let message;

      switch (action) {
        case 'volume_up':
          command = value ? `osascript -e "set volume output volume ${value}"` 
                          : `osascript -e "set volume output volume (output volume of (get volume settings) + 10)"`;
          message = value ? `Set volume to ${value}%` : 'Volume increased';
          break;
        
        case 'volume_down':
          command = value ? `osascript -e "set volume output volume ${value}"` 
                          : `osascript -e "set volume output volume (output volume of (get volume settings) - 10)"`;
          message = value ? `Set volume to ${value}%` : 'Volume decreased';
          break;
        
        case 'volume_mute':
          command = `osascript -e "set volume with output muted"`;
          message = 'Volume muted';
          break;
        
        case 'brightness_up':
          command = `brightness 1`; // Increase brightness (requires brightness CLI tool)
          message = 'Brightness increased';
          break;
        
        case 'brightness_down':
          command = `brightness 0.1`; // Decrease brightness
          message = 'Brightness decreased';
          break;
        
        case 'wifi_on':
          command = `networksetup -setairportpower en0 on`;
          message = 'WiFi enabled';
          break;
        
        case 'wifi_off':
          command = `networksetup -setairportpower en0 off`;
          message = 'WiFi disabled';
          break;
        
        case 'bluetooth_on':
          command = `blueutil -p 1`; // Requires blueutil
          message = 'Bluetooth enabled';
          break;
        
        case 'bluetooth_off':
          command = `blueutil -p 0`; // Requires blueutil
          message = 'Bluetooth disabled';
          break;
        
        case 'sleep':
          command = `pmset sleepnow`;
          message = 'System going to sleep';
          break;
        
        case 'lock':
          command = `osascript -e 'tell application "System Events" to keystroke "q" using {control down, command down}'`;
          message = 'Screen locked';
          break;
        
        case 'restart':
          command = `sudo shutdown -r now`;
          message = 'System restarting (requires sudo)';
          break;
        
        case 'shutdown':
          command = `sudo shutdown -h now`;
          message = 'System shutting down (requires sudo)';
          break;
        
        case 'empty_trash':
          command = `osascript -e 'tell application "Finder" to empty trash'`;
          message = 'Trash emptied';
          break;
        
        case 'toggle_dark_mode':
          command = `osascript -e 'tell application "System Events" to tell appearance preferences to set dark mode to not dark mode'`;
          message = 'Dark mode toggled';
          break;
        
        default:
          throw new Error(`Unknown system action: ${action}`);
      }

      execCommand(command);
      return {
        success: true,
        message: message,
        action: action,
        value: value
      };
    } catch (error) {
      return {
        success: false,
        message: `System control failed: ${error.message}`,
        action: action
      };
    }
  },

  quick_calc: async ({ expression }) => {
    try {
      // Handle unit conversions first
      if (expression.includes(' to ') || expression.includes('convert')) {
        return handleUnitConversion(expression);
      }
      
      // Handle timezone conversions
      if (expression.match(/(EST|PST|GMT|UTC|CST|MST|EDT|PDT)/i)) {
        return handleTimezoneConversion(expression);
      }
      
      // Handle percentage calculations
      if (expression.includes('% of') || expression.includes('percent of')) {
        const match = expression.match(/(\d+(?:\.\d+)?)\s*%?\s*(?:percent)?\s*of\s*(\d+(?:\.\d+)?)/i);
        if (match) {
          const percentage = parseFloat(match[1]);
          const number = parseFloat(match[2]);
          const result = (percentage / 100) * number;
          return {
            success: true,
            result: result,
            expression: expression,
            formatted: `${percentage}% of ${number} = ${result}`
          };
        }
      }
      
      // Basic math evaluation (safe)
      const sanitized = expression.replace(/[^0-9+\-*/().,\s]/g, '');
      const result = eval(sanitized);
      
      return {
        success: true,
        result: result,
        expression: expression,
        formatted: `${expression} = ${result}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Calculation failed: ${error.message}`,
        expression: expression
      };
    }
  },

  open_url: async ({ url, browser, incognito = false }) => {
    try {
      // Add protocol if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      if (isWindows()) {
        const ps = `Start-Process "${url}"`;
        execPowerShell(ps);
        return {
          success: true,
          message: `Opened ${url}${browser ? ` in ${browser}` : ''}${incognito ? ' (incognito)' : ''}`,
          url: url,
          browser: browser,
          platform: 'windows'
        };
      }

      let command;
      if (isMacOS() && browser) {
        const browserCommands = {
          chrome: incognito ? `open -a "Google Chrome" --args --incognito "${url}"` 
                            : `open -a "Google Chrome" "${url}"`,
          firefox: `open -a "Firefox" "${url}"`,
          safari: `open -a "Safari" "${url}"`,
          edge: `open -a "Microsoft Edge" "${url}"`
        };
        command = browserCommands[browser.toLowerCase()];
        if (!command) {
          throw new Error(`Unknown browser: ${browser}`);
        }
      } else if (isMacOS()) {
        command = `open "${url}"`;
      } else {
        throw new Error('open_url not supported on this platform');
      }

      execCommand(command);
      return {
        success: true,
        message: `Opened ${url}${browser ? ` in ${browser}` : ''}${incognito ? ' (incognito)' : ''}`,
        url: url,
        browser: browser
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to open URL: ${error.message}`,
        url: url
      };
    }
  },

  process_manager: async ({ action, query, pid, limit = 10 }) => {
    if (isWindows()) {
      try {
        if (action === 'kill') {
          if (pid) {
            execPowerShell(`Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue`);
            return { success: true, message: `Killed process ${pid}`, pid, platform: 'windows' };
          }
          if (query) {
            const name = query.replace('.exe', '');
            execPowerShell(`Get-Process -Name "${name}" -ErrorAction SilentlyContinue | Stop-Process -Force`);
            return { success: true, message: `Killed processes matching "${query}"`, query, platform: 'windows' };
          }
          return { success: false, message: 'Either pid or query required for kill action' };
        }
        let ps;
        if (action === 'list' || action === 'top_cpu' || action === 'top_memory') {
          ps = `Get-Process | Sort-Object ${action === 'top_memory' ? 'WorkingSet64 -Descending' : 'CPU -Descending'} | Select-Object -First ${limit} ProcessName, Id, @{N='CPU';E={$_.CPU}}, @{N='MemoryMB';E={[math]::Round($_.WorkingSet64/1MB,1)}} | ConvertTo-Json -Compress`;
        } else if (action === 'search' && query) {
          ps = `Get-Process | Where-Object { $_.ProcessName -like "*${query}*" } | Select-Object -First ${limit} ProcessName, Id, @{N='CPU';E={$_.CPU}}, @{N='MemoryMB';E={[math]::Round($_.WorkingSet64/1MB,1)}} | ConvertTo-Json -Compress`;
        } else {
          ps = `Get-Process | Sort-Object CPU -Descending | Select-Object -First ${limit} ProcessName, Id, @{N='CPU';E={$_.CPU}}, @{N='MemoryMB';E={[math]::Round($_.WorkingSet64/1MB,1)}} | ConvertTo-Json -Compress`;
        }
        const out = execPowerShell(ps);
        let procs = [];
        try {
          procs = JSON.parse(out);
          if (!Array.isArray(procs)) procs = [procs];
        } catch {
          return { success: true, processes: [], action, query, count: 0, platform: 'windows' };
        }
        const processes = procs.map(p => ({
          pid: p.Id,
          command: (p.ProcessName || '').replace('.exe', ''),
          cpu: parseFloat(p.CPU) || 0,
          memory: parseFloat(p.MemoryMB) || 0
        }));
        return {
          success: true,
          processes,
          action,
          query,
          count: processes.length,
          platform: 'windows'
        };
      } catch (error) {
        return {
          success: false,
          message: `Process management failed: ${error.message}`,
          action
        };
      }
    }

    try {
      let command;
      let processes = [];

      switch (action) {
        case 'list':
          command = `ps axo pid,ppid,comm,%cpu,%mem,rss`;
          break;
        case 'top_cpu':
          command = `ps axo pid,comm,%cpu,%mem -r | head -${limit + 1}`;
          break;
        case 'top_memory':
          command = `ps axo pid,comm,%cpu,%mem -m | head -${limit + 1}`;
          break;
        case 'search':
          command = `ps axo pid,comm,%cpu,%mem | grep -i "${query}"`;
          break;
        case 'kill':
          if (pid) {
            command = `kill ${pid}`;
            execCommand(command);
            return {
              success: true,
              message: `Killed process ${pid}`,
              pid: pid
            };
          } else if (query) {
            command = `pkill -f "${query}"`;
            execCommand(command);
            return {
              success: true,
              message: `Killed processes matching "${query}"`,
              query: query
            };
          } else {
            throw new Error('Either pid or query required for kill action');
          }
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      const output = execCommand(command);
      const lines = output.split('\n').slice(1); // Skip header

      processes = lines.slice(0, limit).map(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 4) {
          return {
            pid: parseInt(parts[0]),
            command: parts[1],
            cpu: parseFloat(parts[2]) || 0,
            memory: parseFloat(parts[3]) || 0
          };
        }
        return null;
      }).filter(Boolean);

      return {
        success: true,
        processes: processes,
        action: action,
        query: query,
        count: processes.length
      };
    } catch (error) {
      return {
        success: false,
        message: `Process management failed: ${error.message}`,
        action: action
      };
    }
  },

  get_system_info: async ({ info = 'all' }) => {
    if (isWindows()) {
      try {
        const os = require('os');
        const systemInfo = {};

        if (info === 'all' || info === 'cpu') {
          const cpus = os.cpus();
          systemInfo.cpu = {
            physicalCores: cpus.length,
            logicalCores: cpus.length,
            model: cpus[0]?.model || 'Unknown',
            usage: 0
          };
        }

        if (info === 'all' || info === 'memory') {
          const total = os.totalmem();
          const free = os.freemem();
          systemInfo.memory = {
            total: Math.round(total / 1024 / 1024 / 1024),
            free: Math.round(free / 1024 / 1024),
            used: Math.round((total - free) / 1024 / 1024 / 1024)
          };
        }

        if (info === 'all' || info === 'disk') {
          try {
            const ps = `Get-PSDrive C | Select-Object @{N='Used';E={[math]::Round($_.Used/1GB,1)}}, @{N='Free';E={[math]::Round($_.Free/1GB,1)}} | ConvertTo-Json -Compress`;
            const out = execPowerShell(ps);
            const d = JSON.parse(out);
            systemInfo.disk = {
              total: `${(d.Used + d.Free).toFixed(1)} GB`,
              used: `${d.Used} GB`,
              available: `${d.Free} GB`,
              mountPoint: 'C:\\'
            };
          } catch {
            systemInfo.disk = { total: 'N/A', used: 'N/A', available: 'N/A', mountPoint: 'C:\\' };
          }
        }

        if (info === 'all' || info === 'battery') {
          try {
            const ps = `Get-WmiObject Win32_Battery | Select-Object EstimatedChargeRemaining, BatteryStatus | ConvertTo-Json -Compress`;
            const out = execPowerShell(ps);
            const b = JSON.parse(out);
            systemInfo.battery = {
              percentage: b.EstimatedChargeRemaining || 0,
              status: b.BatteryStatus === 2 ? 'charging' : b.BatteryStatus === 1 ? 'discharging' : 'unknown',
              isCharging: b.BatteryStatus === 2
            };
          } catch {
            systemInfo.battery = { error: 'Battery info not available' };
          }
        }

        if (info === 'all' || info === 'power') {
          try {
            const schemeOut = execPowerShell('powercfg /getactivescheme');
            const guidMatch = schemeOut.match(/GUID: ([a-f0-9-]+)/i);
            const guid = guidMatch ? guidMatch[1].toLowerCase() : null;
            const knownPlans = {
              '381b4222-f694-41f0-9685-ff5bb260df2e': 'Balanced',
              '8c5e7fda-e8bf-4a96-9a85-a6e1a703af35': 'High performance',
              'a1841308-3541-4fab-bc81-f71556f20b4a': 'Power saver',
              'e9a42b02-d5df-448d-aa00-03f14749eb61': 'Ultimate Performance'
            };
            systemInfo.powerPlan = guid ? (knownPlans[guid] || guid) : 'unknown';
          } catch {
            systemInfo.powerPlan = { error: 'Power plan not available' };
          }
        }

        return {
          success: true,
          systemInfo,
          timestamp: new Date().toISOString(),
          platform: 'windows'
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to get system info: ${error.message}`,
          requestedInfo: info
        };
      }
    }

    try {
      const systemInfo = {};

      if (info === 'all' || info === 'cpu') {
        const cpuInfo = execCommand(`sysctl -n hw.ncpu hw.logicalcpu`);
        const [physical, logical] = cpuInfo.split('\n');
        systemInfo.cpu = {
          physicalCores: parseInt(physical),
          logicalCores: parseInt(logical),
          usage: parseFloat(execCommand(`ps -A -o %cpu | awk '{s+=$1} END {print s}'`) || '0')
        };
      }

      if (info === 'all' || info === 'memory') {
        const memInfo = execCommand(`vm_stat`);
        const pageSize = parseInt(execCommand(`vm_stat | head -1 | grep -o '[0-9]\\+'`));
        const freePages = parseInt(memInfo.match(/Pages free:\s+(\d+)/)?.[1] || '0');
        const totalMem = parseInt(execCommand(`sysctl -n hw.memsize`));
        
        systemInfo.memory = {
          total: Math.round(totalMem / 1024 / 1024 / 1024), // GB
          free: Math.round((freePages * pageSize) / 1024 / 1024), // MB
          used: Math.round((totalMem - (freePages * pageSize)) / 1024 / 1024 / 1024) // GB
        };
      }

      if (info === 'all' || info === 'disk') {
        const diskInfo = execCommand(`df -h /`);
        const diskLine = diskInfo.split('\n')[1];
        const [, total, used, available] = diskLine.split(/\s+/);
        
        systemInfo.disk = {
          total: total,
          used: used,
          available: available,
          mountPoint: '/'
        };
      }

      if (info === 'all' || info === 'battery') {
        try {
          const batteryInfo = execCommand(`pmset -g batt`);
          const batteryMatch = batteryInfo.match(/(\d+)%.*?(\w+)/);
          if (batteryMatch) {
            systemInfo.battery = {
              percentage: parseInt(batteryMatch[1]),
              status: batteryMatch[2].toLowerCase(),
              isCharging: batteryMatch[2].toLowerCase().includes('charging')
            };
          }
        } catch {
          systemInfo.battery = { error: 'Battery info not available' };
        }
      }

      return {
        success: true,
        systemInfo: systemInfo,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get system info: ${error.message}`,
        requestedInfo: info
      };
    }
  },

  daily_brief: async ({ topProcesses = 3 }) => {
    try {
      const sys = await tools.get_system_info({ info: 'all' });
      if (!sys.success) {
        return { success: false, message: 'Could not get system info for brief.' };
      }
      const procs = await tools.process_manager({ action: 'top_memory', limit: topProcesses });
      const si = sys.systemInfo || {};
      const now = new Date();
      const timeStr = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
      const dateStr = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      let batteryStr = 'N/A';
      if (si.battery && !si.battery.error) {
        batteryStr = `${si.battery.percentage}%${si.battery.isCharging ? ' (charging)' : ''}`;
      }
      let memoryStr = 'N/A';
      if (si.memory) {
        memoryStr = `${si.memory.used} GB used / ${si.memory.total} GB total`;
      }
      let powerStr = '';
      if (si.powerPlan && typeof si.powerPlan === 'string' && !si.powerPlan.error) {
        powerStr = ` • Power: ${si.powerPlan}`;
      }
      const procList = (procs.processes || []).slice(0, topProcesses).map(p => `${p.name || p.processName} (${Math.round((p.workingSetMB || p.memory || 0))} MB)`).join(', ') || '—';
      const summary = [
        `**${dateStr}** ${timeStr}`,
        `Battery: ${batteryStr}${powerStr}`,
        `Memory: ${memoryStr}`,
        `Top ${topProcesses} by RAM: ${procList}`
      ].join('\n');
      return {
        success: true,
        summary,
        date: dateStr,
        time: timeStr,
        battery: si.battery,
        memory: si.memory,
        powerPlan: si.powerPlan,
        topProcesses: procs.processes || []
      };
    } catch (error) {
      return {
        success: false,
        message: `Daily brief failed: ${error.message}`
      };
    }
  },

  insert_symbol: async ({ name, copyToClipboard = true }) => {
    const symbols = {
      shrug: '¯\\_(ツ)_/¯',
      thumbs_up: '👍',
      thumbs_down: '👎',
      bullet: '•',
      sigma: 'Σ',
      check: '✓',
      x: '✗',
      arrow_right: '→',
      heart: '❤',
      fire: '🔥',
      star: '★',
      copy: '©',
      trademark: '™',
      registered: '®',
      degree: '°',
      infinity: '∞',
      lambda: 'λ',
      pi: 'π',
      delta: 'Δ',
      omega: 'Ω',
      ellipsis: '…',
      em_dash: '—',
      en_dash: '–'
    };
    const key = (name || '').toLowerCase().replace(/\s+/g, '_');
    const text = symbols[key];
    if (!text) {
      const names = Object.keys(symbols).join(', ');
      return {
        success: false,
        message: `Unknown symbol "${name}". Try: ${names}`,
        available: Object.keys(symbols)
      };
    }
    if (copyToClipboard && isWindows()) {
      try {
        const escaped = text.replace(/'/g, "''");
        execPowerShell(`Set-Clipboard -Value '${escaped}'`);
      } catch (e) {
        return { success: true, symbol: text, copied: false, message: `Symbol: ${text} (clipboard failed: ${e.message})` };
      }
    }
    return {
      success: true,
      symbol: text,
      copied: copyToClipboard && isWindows(),
      message: copyToClipboard && isWindows() ? `Copied ${text} to clipboard` : `Symbol: ${text}`
    };
  },

  screenshot: async ({ type = 'fullscreen', app, save = false, path: savePath }) => {
    if (isWindows()) {
      try {
        const os = require('os');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const desktop = path.join(os.homedir(), 'Desktop');
        const defaultPath = savePath || path.join(desktop, `Screenshot-${timestamp}.png`);
        const safePath = defaultPath.replace(/\\/g, '\\\\');
        const ps = save
          ? `Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing; $s=[System.Windows.Forms.Screen]::PrimaryScreen.Bounds; $b=New-Object System.Drawing.Bitmap $s.Width,$s.Height; $g=[System.Drawing.Graphics]::FromImage($b); $g.CopyFromScreen($s.Location,[System.Drawing.Point]::Empty,$s.Size); $b.Save('${safePath}',[System.Drawing.Imaging.ImageFormat]::Png); $g.Dispose(); $b.Dispose()`
          : `Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing; $s=[System.Windows.Forms.Screen]::PrimaryScreen.Bounds; $b=New-Object System.Drawing.Bitmap $s.Width,$s.Height; $g=[System.Drawing.Graphics]::FromImage($b); $g.CopyFromScreen($s.Location,[System.Drawing.Point]::Empty,$s.Size); [System.Windows.Forms.Clipboard]::SetImage($b); $g.Dispose(); $b.Dispose()`;
        execPowerShell(ps);
        return {
          success: true,
          message: save ? `Screenshot saved to ${defaultPath}` : 'Screenshot copied to clipboard',
          type: type,
          path: save ? defaultPath : null,
          app: app,
          platform: 'windows'
        };
      } catch (error) {
        return {
          success: false,
          message: `Screenshot failed: ${error.message}. On Windows only fullscreen is supported.`,
          type: type
        };
      }
    }
    if (!isMacOS()) {
      throw new Error('Screenshots currently only supported on macOS and Windows');
    }

    try {
      let command;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const defaultPath = savePath || `${require('os').homedir()}/Desktop/Screenshot-${timestamp}.png`;

      switch (type) {
        case 'fullscreen':
          command = save ? `screencapture "${defaultPath}"` : `screencapture -c`;
          break;
        case 'window':
          if (app) {
            command = save ? `screencapture -l $(GetWindowID "${app}") "${defaultPath}"` 
                           : `screencapture -l $(GetWindowID "${app}") -c`;
          } else {
            command = save ? `screencapture -w "${defaultPath}"` : `screencapture -w -c`;
          }
          break;
        case 'selection':
          command = save ? `screencapture -s "${defaultPath}"` : `screencapture -s -c`;
          break;
        case 'clipboard':
          command = `screencapture -c`;
          break;
        default:
          throw new Error(`Unknown screenshot type: ${type}`);
      }

      execCommand(command);
      
      return {
        success: true,
        message: save ? `Screenshot saved to ${defaultPath}` : 'Screenshot copied to clipboard',
        type: type,
        path: save ? defaultPath : null,
        app: app
      };
    } catch (error) {
      return {
        success: false,
        message: `Screenshot failed: ${error.message}`,
        type: type
      };
    }
  },

  focus_mode: async ({ action = 'on', duration }) => {
    // Focus mode: mute audio + enable Windows Focus Assist (or macOS Do Not Disturb)
    if (isWindows()) {
      try {
        if (action === 'on' || action === 'enable') {
          // Mute system volume
          const mutePs = `Add-Type -TypeDefinition "using System;using System.Runtime.InteropServices;public class V{ [DllImport(\\\"user32.dll\\\")]public static extern void keybd_event(byte b,byte s,uint f,UIntPtr e);public static void M(){ keybd_event(0xAD,0,0,UIntPtr.Zero);keybd_event(0xAD,0,2,UIntPtr.Zero);} }"; [V]::M()`;
          execPowerShell(mutePs);
          // Enable Focus Assist (Priority only mode via registry - requires restart of explorer or takes effect on next session)
          // Note: Full Focus Assist control requires Windows Settings API; this sets the preference
          try {
            execPowerShell(`Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\CloudStore\\Store\\Cache\\DefaultAccount\\$$windows.data.notifications.quiethourssettings\\Current" -Name "Data" -Value ([byte[]](0x02,0x00,0x00,0x00,0x00,0x00,0x00,0x00)) -ErrorAction SilentlyContinue`);
          } catch {
            // Focus Assist registry may not exist; continue anyway - mute is the primary action
          }
          const msg = duration
            ? `Focus mode enabled for ${duration} minutes. Audio muted. Say "focus mode off" when done.`
            : 'Focus mode enabled. Audio muted. Say "focus mode off" when done.';
          return {
            success: true,
            message: msg,
            action: 'on',
            duration: duration || null,
            platform: 'windows',
            effects: ['audio_muted', 'focus_assist_requested']
          };
        } else if (action === 'off' || action === 'disable') {
          // Unmute (toggle mute key again)
          const unmutePs = `Add-Type -TypeDefinition "using System;using System.Runtime.InteropServices;public class V{ [DllImport(\\\"user32.dll\\\")]public static extern void keybd_event(byte b,byte s,uint f,UIntPtr e);public static void M(){ keybd_event(0xAD,0,0,UIntPtr.Zero);keybd_event(0xAD,0,2,UIntPtr.Zero);} }"; [V]::M()`;
          execPowerShell(unmutePs);
          return {
            success: true,
            message: 'Focus mode disabled. Audio restored.',
            action: 'off',
            platform: 'windows',
            effects: ['audio_toggled']
          };
        } else if (action === 'status') {
          return {
            success: true,
            message: 'Focus mode status: check system tray for Focus Assist icon or volume indicator.',
            action: 'status',
            platform: 'windows'
          };
        } else {
          return { success: false, message: `Unknown focus_mode action: ${action}. Use on, off, or status.` };
        }
      } catch (error) {
        return {
          success: false,
          message: `Focus mode failed: ${error.message}`,
          action: action
        };
      }
    }
    if (isMacOS()) {
      try {
        if (action === 'on' || action === 'enable') {
          // Mute + DND on macOS
          execCommand(`osascript -e "set volume with output muted"`);
          // Toggle Do Not Disturb (requires macOS Monterey+)
          try {
            execCommand(`shortcuts run "Turn On Do Not Disturb" 2>/dev/null || osascript -e 'tell application "System Events" to keystroke "D" using {control down, option down, command down}'`);
          } catch {
            // DND shortcut may not exist
          }
          return {
            success: true,
            message: duration
              ? `Focus mode enabled for ${duration} minutes. Audio muted.`
              : 'Focus mode enabled. Audio muted.',
            action: 'on',
            duration: duration || null,
            platform: 'macos',
            effects: ['audio_muted', 'dnd_requested']
          };
        } else if (action === 'off' || action === 'disable') {
          execCommand(`osascript -e "set volume without output muted"`);
          return {
            success: true,
            message: 'Focus mode disabled. Audio restored.',
            action: 'off',
            platform: 'macos'
          };
        }
        return { success: false, message: `Unknown focus_mode action: ${action}` };
      } catch (error) {
        return { success: false, message: `Focus mode failed: ${error.message}` };
      }
    }
    return { success: false, message: 'Focus mode not supported on this platform.' };
  },

  get_active_window: async () => {
    // Returns the currently focused window's app name and title
    if (isWindows()) {
      try {
        const ps = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class Win {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint p);
}
"@
$h = [Win]::GetForegroundWindow()
$sb = New-Object System.Text.StringBuilder 256
[Win]::GetWindowText($h, $sb, 256) | Out-Null
$title = $sb.ToString()
$pid = 0
[Win]::GetWindowThreadProcessId($h, [ref]$pid) | Out-Null
$proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
@{ app = $proc.ProcessName; title = $title; pid = $pid } | ConvertTo-Json -Compress
`;
        const out = execPowerShell(ps);
        const info = JSON.parse(out);
        return {
          success: true,
          app: info.app || 'unknown',
          title: info.title || '',
          pid: info.pid || null,
          platform: 'windows'
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to get active window: ${error.message}`,
          platform: 'windows'
        };
      }
    }
    if (isMacOS()) {
      try {
        const script = `
tell application "System Events"
  set frontApp to name of first application process whose frontmost is true
end tell
tell application frontApp
  if exists (window 1) then
    set winTitle to name of window 1
  else
    set winTitle to ""
  end if
end tell
return frontApp & "|" & winTitle
`;
        const out = execCommand(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
        const [app, title] = out.split('|');
        return {
          success: true,
          app: app || 'unknown',
          title: title || '',
          platform: 'macos'
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to get active window: ${error.message}`,
          platform: 'macos'
        };
      }
    }
    return { success: false, message: 'get_active_window not supported on this platform.' };
  }
};

// Helper functions for calculations
function handleUnitConversion(expression) {
  // Basic unit conversion - would be expanded with a proper conversion library
  const conversions = {
    // Length
    'miles to km': (val) => val * 1.60934,
    'km to miles': (val) => val * 0.621371,
    'feet to meters': (val) => val * 0.3048,
    'meters to feet': (val) => val * 3.28084,
    // Weight
    'lbs to kg': (val) => val * 0.453592,
    'kg to lbs': (val) => val * 2.20462,
    // Temperature
    'fahrenheit to celsius': (val) => (val - 32) * 5/9,
    'celsius to fahrenheit': (val) => (val * 9/5) + 32
  };

  const match = expression.match(/(\d+(?:\.\d+)?)\s*(.+)/);
  if (match) {
    const value = parseFloat(match[1]);
    const conversionType = match[2].toLowerCase().trim();
    
    if (conversions[conversionType]) {
      const result = conversions[conversionType](value);
      return {
        success: true,
        result: result,
        expression: expression,
        formatted: `${value} ${conversionType.replace(' to ', ' = ')} ${result.toFixed(2)}`
      };
    }
  }

  return {
    success: false,
    message: `Unit conversion not supported: ${expression}`
  };
}

function handleTimezoneConversion(expression) {
  // Basic timezone conversion - would use a proper timezone library in production
  return {
    success: false,
    message: 'Timezone conversion not yet implemented - would use moment.js or date-fns-tz'
  };
}

module.exports = { tools };