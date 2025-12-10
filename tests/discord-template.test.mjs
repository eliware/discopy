import { jest } from '@jest/globals';
test('discord-template.mjs can be imported without error', async () => {
  process.env.LOG_LEVEL = 'none';
  await import('../discord-template.mjs');
  expect(true).toBe(true);
});