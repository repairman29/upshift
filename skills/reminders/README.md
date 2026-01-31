# Reminders Skill

Set timers and reminders that notify you via system notifications.

## Tools

| Tool | Description |
|------|-------------|
| `set_reminder` | Schedule a reminder for a specific time |
| `set_timer` | Set a countdown timer |
| `list_reminders` | Show upcoming reminders |
| `cancel_reminder` | Cancel a scheduled reminder |

## Usage Examples

- "Remind me in 5 minutes to check the oven"
- "Remind me at 3pm to call Mom"
- "Set a timer for 20 minutes"
- "What reminders do I have?"
- "Cancel the reminder about the oven"

## Time Formats

- `in X minutes` / `in X hours` / `in X seconds`
- `at 3pm` / `at 3:30pm` / `at 15:30`
- Just a number (e.g. `5`) = 5 minutes

## Platform Support

### Windows
Uses Windows Task Scheduler for persistent reminders. Reminders survive reboots and show as toast notifications.

### macOS
Uses background shell processes with `osascript` for display notifications. Limited to ~24 hours. For longer reminders, use Calendar.

## Storage

Reminders are stored in `~/.jarvis/reminders/reminders.json`.

## Notes

- Timers and reminders are local to this machine
- Windows reminders auto-delete 1 hour after they fire
- To see past reminders, use `list_reminders` with `includeCompleted: true`
