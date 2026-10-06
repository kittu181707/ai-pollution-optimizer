import type { APIGatewayProxyEvent } from 'aws-lambda';
import { body, json } from '../http';
import { parseIcs } from '../core/ics';

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    const input = body<{ icsText: string }>(event.body);
    if (typeof input.icsText !== 'string' || input.icsText.length > 512_000) {
      return json(400, { message: 'Calendar file must be smaller than 512 KB' });
    }
    if (!input.icsText.includes('BEGIN:VCALENDAR')) {
      return json(400, { message: 'This does not look like an .ics calendar file' });
    }
    const parsed = parseIcs(input.icsText);
    if (!parsed.events.length) return json(400, { message: 'No timed events were found for a usable day' });
    return json(200, parsed);
  } catch (error) {
    return json(400, { message: error instanceof Error ? error.message : 'Could not parse calendar' });
  }
};
