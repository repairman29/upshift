/**
 * Reminders skill: set timers and reminders that notify you.
 * Windows: Uses Task Scheduler for persistent reminders.
 * macOS: Uses launchd or in-process timers.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const JARVIS_DIR = path.join(os.homedir(), '.jarvis');
const REMINDERS_DIR = path.join(JARVIS_DIR, 'reminders');
const REMINDERS_FILE = path.join(REMINDERS_DIR, 'reminders.json');

function isWindows() {
  return process.platform === 'win32';
}

function isMacOS() {
  return process.platform === 'darwin';
}

function ensureDirectories() {
  if (!fs.existsSync(JARVIS_DIR)) {
    fs.mkdirSync(JARVIS_DIR, { recursive: true });
  }
  if (!fs.existsSync(REMINDERS_DIR)) {
    fs.mkdirSync(REMINDERS_DIR, { recursive: true });
  }
}

function loadReminders() {
  try {
    ensureDirectories();
    if (fs.existsSync(REMINDERS_FILE)) {
      return JSON.parse(fs.readFileSync(REMINDERS_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Failed to load reminders:', error.message);
  }
  return { reminders: [] };
}

function saveReminders(data) {
  try {
    ensureDirectories();
    fs.writeFileSync(REMINDERS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Failed to save reminders:', error.message);
  }
}

function execPowerShell(script) {
  const escaped = script.replace(/"/g, '\\"');
  return execSync(`powershell -NoProfile -Command "${escaped}"`, {
    encoding: 'utf8',
    timeout: 30000,
    windowsHide: true
  }).trim();
}

function parseTimeExpression(expr) {
  // Parse expressions like "in 5 minutes", "in 1 hour", "at 3pm", "at 14:30"
  const now = new Date();
  
  // "in X minutes/hours/seconds"
  const inMatch = expr.match(/in\s+(\d+)\s*(minute|min|hour|hr|second|sec)s?/i);
  if (inMatch) {
    const amount = parseInt(inMatch[1]);
    const unit = inMatch[2].toLowerCase();
    const ms = unit.startsWith('hour') || unit.startsWith('hr') ? amount * 60 * 60 * 1000
             : unit.startsWith('min') ? amount * 60 * 1000
             : amount * 1000;
    return new Date(now.getTime() + ms);
  }
  
  // "at HH:MM" or "at H:MMam/pm" or "at Hpm"
  const atMatch = expr.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (atMatch) {
    let hours = parseInt(atMatch[1]);
    const minutes = parseInt(atMatch[2] || '0');
    const ampm = (atMatch[3] || '').toLowerCase();
    
    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;
    
    const target = new Date(now);
    target.setHours(hours, minutes, 0, 0);
    
    // If the time has passed today, schedule for tomorrow
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }
    return target;
  }
  
  // Just a number = minutes
  const justNumber = expr.match(/^(\d+)$/);
  if (justNumber) {
    const minutes = parseInt(justNumber[1]);
    return new Date(now.getTime() + minutes * 60 * 1000);
  }
  
  return null;
}

function generateId() {
  return `jarvis_reminder_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createWindowsReminder(id, triggerTime, message) {
  // Create a scheduled task that shows a toast notification
  const taskName = id;
  const dateStr = triggerTime.toISOString().slice(0, 10);
  const timeStr = triggerTime.toTimeString().slice(0, 8);
  
  // PowerShell script to show toast notification
  const toastScript = `
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null
$template = @"
<toast>
  <visual>
    <binding template="ToastText02">
      <text id="1">JARVIS Reminder</text>
      <text id="2">${message.replace(/"/g, '&quot;')}</text>
    </binding>
  </visual>
  <audio src="ms-winsoundevent:Notification.Reminder"/>
</toast>
"@
$xml = New-Object Windows.Data.Xml.Dom.XmlDocument
$xml.LoadXml($template)
$toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("JARVIS").Show($toast)
`.trim().replace(/\r?\n/g, '; ').replace(/"/g, '\\"');

  // Create the scheduled task
  const createTask = `
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-NoProfile -WindowStyle Hidden -Command "${toastScript}"'
$trigger = New-ScheduledTaskTrigger -Once -At '${dateStr} ${timeStr}'
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -DeleteExpiredTaskAfter (New-TimeSpan -Hours 1)
Register-ScheduledTask -TaskName '${taskName}' -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
`;
  
  execPowerShell(createTask);
}

function deleteWindowsReminder(id) {
  try {
    execPowerShell(`Unregister-ScheduledTask -TaskName '${id}' -Confirm:$false -ErrorAction SilentlyContinue`);
  } catch {
    // Task may not exist
  }
}

// Tool implementations
const tools = {
  set_reminder: async ({ time, message, recurring = false }) => {
    try {
      if (!time) {
        return {
          success: false,
          message: 'Please specify when to remind you (e.g. "in 5 minutes", "at 3pm", "in 1 hour").'
        };
      }
      if (!message) {
        return {
          success: false,
          message: 'Please specify what to remind you about.'
        };
      }
      
      const triggerTime = parseTimeExpression(time);
      if (!triggerTime) {
        return {
          success: false,
          message: `Could not parse time "${time}". Try "in 5 minutes", "in 1 hour", "at 3pm", or "at 14:30".`
        };
      }
      
      const id = generateId();
      const reminder = {
        id,
        message,
        time: time,
        triggerAt: triggerTime.toISOString(),
        recurring,
        created: new Date().toISOString(),
        status: 'scheduled'
      };
      
      if (isWindows()) {
        createWindowsReminder(id, triggerTime, message);
        reminder.platform = 'windows';
        reminder.method = 'task_scheduler';
      } else if (isMacOS()) {
        // For macOS, we'd use launchd or osascript with delay
        // Simple approach: use osascript with display notification after delay
        const delaySeconds = Math.round((triggerTime.getTime() - Date.now()) / 1000);
        if (delaySeconds > 0 && delaySeconds < 86400) { // Less than 24 hours
          const escapedMsg = message.replace(/"/g, '\\"');
          execSync(`(sleep ${delaySeconds} && osascript -e 'display notification "${escapedMsg}" with title "JARVIS Reminder"') &`, {
            shell: '/bin/bash',
            timeout: 5000
          });
          reminder.platform = 'macos';
          reminder.method = 'osascript';
        } else {
          return {
            success: false,
            message: 'macOS reminders only support up to 24 hours in the future. For longer reminders, use Calendar.'
          };
        }
      } else {
        return {
          success: false,
          message: 'Reminders are only supported on Windows and macOS.'
        };
      }
      
      // Save to local file
      const data = loadReminders();
      data.reminders.push(reminder);
      saveReminders(data);
      
      const timeStr = triggerTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      const dateStr = triggerTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
      
      return {
        success: true,
        message: `Reminder set: "${message}" at ${timeStr} on ${dateStr}`,
        reminder: {
          id,
          message,
          triggerAt: triggerTime.toISOString(),
          timeStr,
          dateStr
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to set reminder: ${error.message}`
      };
    }
  },

  list_reminders: async ({ includeCompleted = false }) => {
    try {
      const data = loadReminders();
      const now = new Date();
      
      let reminders = data.reminders;
      if (!includeCompleted) {
        reminders = reminders.filter(r => r.status === 'scheduled' && new Date(r.triggerAt) > now);
      }
      
      // Sort by trigger time
      reminders.sort((a, b) => new Date(a.triggerAt) - new Date(b.triggerAt));
      
      const formatted = reminders.map(r => {
        const t = new Date(r.triggerAt);
        return {
          id: r.id,
          message: r.message,
          time: t.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
          status: r.status,
          isPast: t < now
        };
      });
      
      return {
        success: true,
        reminders: formatted,
        count: formatted.length,
        message: formatted.length === 0 
          ? 'No upcoming reminders.' 
          : `${formatted.length} reminder(s) scheduled.`
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to list reminders: ${error.message}`
      };
    }
  },

  cancel_reminder: async ({ id, message }) => {
    try {
      const data = loadReminders();
      let index = -1;
      
      if (id) {
        index = data.reminders.findIndex(r => r.id === id);
      } else if (message) {
        // Find by message substring
        index = data.reminders.findIndex(r => 
          r.message.toLowerCase().includes(message.toLowerCase()) && r.status === 'scheduled'
        );
      }
      
      if (index === -1) {
        return {
          success: false,
          message: id ? `Reminder with ID "${id}" not found.` : `No reminder matching "${message}" found.`
        };
      }
      
      const reminder = data.reminders[index];
      
      // Delete from system scheduler
      if (isWindows()) {
        deleteWindowsReminder(reminder.id);
      }
      // macOS background process can't be easily cancelled; mark as cancelled
      
      reminder.status = 'cancelled';
      saveReminders(data);
      
      return {
        success: true,
        message: `Reminder cancelled: "${reminder.message}"`,
        reminder: {
          id: reminder.id,
          message: reminder.message
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to cancel reminder: ${error.message}`
      };
    }
  },

  set_timer: async ({ duration, message }) => {
    try {
      if (!duration) {
        return {
          success: false,
          message: 'Please specify a duration (e.g. "5 minutes", "1 hour", "30 seconds").'
        };
      }
      
      // Parse duration
      const match = duration.match(/(\d+)\s*(minute|min|hour|hr|second|sec)s?/i);
      if (!match) {
        return {
          success: false,
          message: `Could not parse duration "${duration}". Try "5 minutes", "1 hour", or "30 seconds".`
        };
      }
      
      const amount = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      const ms = unit.startsWith('hour') || unit.startsWith('hr') ? amount * 60 * 60 * 1000
               : unit.startsWith('min') ? amount * 60 * 1000
               : amount * 1000;
      
      const triggerTime = new Date(Date.now() + ms);
      const timerMessage = message || `Timer finished: ${duration}`;
      const id = generateId();
      
      if (isWindows()) {
        createWindowsReminder(id, triggerTime, timerMessage);
      } else if (isMacOS()) {
        const delaySec = Math.round(ms / 1000);
        const escapedMsg = timerMessage.replace(/"/g, '\\"');
        execSync(`(sleep ${delaySec} && osascript -e 'display notification "${escapedMsg}" with title "JARVIS Timer" sound name "Glass"') &`, {
          shell: '/bin/bash',
          timeout: 5000
        });
      } else {
        return { success: false, message: 'Timers are only supported on Windows and macOS.' };
      }
      
      // Save timer as a reminder
      const data = loadReminders();
      data.reminders.push({
        id,
        message: timerMessage,
        time: duration,
        triggerAt: triggerTime.toISOString(),
        type: 'timer',
        created: new Date().toISOString(),
        status: 'scheduled',
        platform: isWindows() ? 'windows' : 'macos'
      });
      saveReminders(data);
      
      const unitLabel = unit.startsWith('hour') || unit.startsWith('hr') ? 'hour' : unit.startsWith('min') ? 'minute' : 'second';
      const plural = amount === 1 ? '' : 's';
      
      return {
        success: true,
        message: `Timer set for ${amount} ${unitLabel}${plural}. You'll be notified at ${triggerTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`,
        timer: {
          id,
          duration,
          triggerAt: triggerTime.toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to set timer: ${error.message}`
      };
    }
  }
};

module.exports = { tools };
