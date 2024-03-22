import env from 'dotenv';


const { Client } = require('@notionhq/client');
const { google } = require('googleapis');

// Import necessary libraries

// Set up Notion client
const notion = new Client({
    auth: env.NOTION_API_KEY,
});

// Set up Google Calendar client
const auth = new google.auth.GoogleAuth({
    keyFile: env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/calendar'],
});
const calendar = google.calendar({ version: 'v3', auth });

// Sync function
async function syncCalendars() {
    try {
        // Fetch events from Notion calendar
        const notionEvents = await notion.calendar.events.list({
            calendar_id: env.NOTION_CALENDAR_ID,
        });

        // Iterate over Notion events and create/update corresponding events in Google Calendar
        for (const event of notionEvents.results) {
            const googleEvent = {
                summary: event.title,
                start: {
                    dateTime: event.start.dateTime,
                    timeZone: event.start.timeZone,
                },
                end: {
                    dateTime: event.end.dateTime,
                    timeZone: event.end.timeZone,
                },
            };

            // Check if the event already exists in Google Calendar
            const existingEvent = await calendar.events.get({
                calendarId: env.GOOGLE_CALENDAR_ID,
                eventId: event.id,
            });

            // If the event exists, update it; otherwise, create a new event
            if (existingEvent) {
                await calendar.events.update({
                    calendarId: env.GOOGLE_CALENDAR_ID,
                    eventId: event.id,
                    resource: googleEvent,
                });
            } else {
                await calendar.events.insert({
                    calendarId: env.GOOGLE_CALENDAR_ID,
                    resource: googleEvent,
                });
            }
        }

        console.log('Calendar sync complete!');
    } catch (error) {
        console.error('Error syncing calendars:', error);
    }
}

// Run the sync function
syncCalendars();