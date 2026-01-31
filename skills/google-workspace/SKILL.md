# Google Workspace Skill

Use when the user asks about **Gmail**, **Google Calendar**, **Google email**, or **Google Workspace**.

## When to use

- **"Show my Gmail"**, **"Unread emails"**, **"Inbox"** → `gmail_list_mail` (unreadOnly if unread).
- **"Read that email"** (after listing) → `gmail_read_mail` with the message ID from the list.
- **"Send email to X"**, **"Email Y about Z"** (Gmail) → `gmail_send_mail` (to, subject, body).
- **"Find email about X"**, **"Search Gmail for Y"** → `gmail_search_mail` with query (Gmail search syntax supported).
- **"What's on my calendar today?"**, **"Google Calendar events this week"** → `calendar_list_events` (timeMin/timeMax as needed).
- **"Schedule a meeting"**, **"Add Google Calendar event"** → `calendar_create_event` (summary, start, end; optional description, location, attendees).

## Notes

- User must have completed OAuth once (`node skills/google-workspace/oauth-helper.js`) and have `GOOGLE_REFRESH_TOKEN` in `.env`.
- For calendar list, omit timeMin/timeMax to get today through 7 days; pass ISO strings for a custom range.
- For create event, start/end are ISO date-times (e.g. 2024-01-15T14:00:00Z).
