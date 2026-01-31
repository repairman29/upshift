# Microsoft 365 Skill

Use when the user asks about **Outlook**, **email**, **calendar**, **meetings**, or **Microsoft 365**.

## When to use

- **"Show my email"**, **"Unread messages"**, **"Inbox"** → `outlook_list_mail` (folder: inbox, unreadOnly if unread).
- **"Read that email"** (after listing) → `outlook_read_mail` with the message ID from the list.
- **"Send email to X"**, **"Email Y about Z"** → `outlook_send_mail` (to, subject, body).
- **"Find email about X"**, **"Search inbox for Y"** → `outlook_search_mail` with query.
- **"What's on my calendar today?"**, **"Meetings this week"** → `calendar_list_events` (startDate/endDate as needed).
- **"Schedule a meeting"**, **"Add calendar event"** → `calendar_create_event` (subject, start, end; optional body, location, attendees).

## Notes

- User must have completed OAuth once (`node skills/microsoft-365/oauth-helper.js`) and have `MICROSOFT_REFRESH_TOKEN` in `.env`.
- For calendar list, omit start/end to get today; pass ISO dates for a range.
- For create event, start/end are ISO date-times; optional `timeZone` (default UTC).
