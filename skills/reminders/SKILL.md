# Reminders Skill

Use when the user asks to **set a reminder**, **set a timer**, **remind me**, or **alert me later**.

## When to use

- "Remind me in 5 minutes to ..."
- "Set a timer for 20 minutes"
- "Remind me at 3pm to call someone"
- "What reminders do I have?"
- "Cancel my reminder about X"

## Tools

| Trigger | Tool | Parameters |
|---------|------|------------|
| "remind me in X minutes/hours to Y" | `set_reminder` | `time: "in X minutes"`, `message: "Y"` |
| "remind me at 3pm to Y" | `set_reminder` | `time: "at 3pm"`, `message: "Y"` |
| "set a timer for X minutes" | `set_timer` | `duration: "X minutes"` |
| "timer X minutes" | `set_timer` | `duration: "X minutes"` |
| "show my reminders" | `list_reminders` | (no params) |
| "cancel reminder about X" | `cancel_reminder` | `message: "X"` |

## Notes

- Windows: Uses Task Scheduler → toast notifications. Persistent across reboots.
- macOS: Uses osascript notifications. Limited to ~24 hours.
- Reminders stored in `~/.jarvis/reminders/reminders.json`
