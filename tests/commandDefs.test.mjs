import fs from 'fs';
import path from 'path';

describe('Command definitions (.json) are valid and follow Discord command schema', () => {
  const commandsDir = path.join(process.cwd(), 'commands');
  const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.json'));
  const localeKeys = [
    "bg", "cs", "da", "de", "el", "en-GB", "en-US", "es-419", "es-ES", "fi", "fr", "hi", "hr", "hu", "id", "it", "ja", "ko", "lt", "nl", "no", "pl", "pt-BR", "ro", "ru", "sv-SE", "th", "tr", "uk", "vi", "zh-CN", "zh-TW"
  ];
  const chatInputRegex = /^[-_'\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/u;
  function checkChatInput(str, context) {
    if (typeof str !== 'string') {
      throw new Error(`${context} is not a string (type=${typeof str})`);
    }
    if (!chatInputRegex.test(str)) {
      throw new Error(`${context} does not match chatInputRegex: "${str}"`);
    }
    for (const ch of str) {
      if (ch.toLowerCase && ch.toUpperCase && ch.toLowerCase() !== ch.toUpperCase()) {
        if (ch !== ch.toLowerCase()) {
          throw new Error(`${context} contains uppercase character "${ch}" in "${str}"`);
        }
      }
    }
  }
  if (files.length === 0) {
    test('dummy test - no command definition files present', () => {
      expect(true).toBe(true);
    });
  }
  for (const file of files) {
    const filePath = path.join(commandsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    let parsed;
    test(`${file} parses as JSON`, () => {
      expect(() => { parsed = JSON.parse(content); }).not.toThrow(`Failed to parse JSON in ${file}`);
    });
    parsed = JSON.parse(content);
    test(`${file} has valid name and type`, () => {
      expect(typeof parsed.name).toBe('string');
      expect(typeof parsed.type).toBe('number');
    });
    if (parsed.type === 1) {
      test(`${file} (CHAT_INPUT) has valid description, name, and localizations`, () => {
        expect(typeof parsed.description).toBe('string');
        checkChatInput(parsed.name, `${file} name`);
        expect(parsed.name_localizations).toBeDefined();
        for (const key of localeKeys) {
          expect(parsed.name_localizations[key]).toBeDefined();
          expect(typeof parsed.name_localizations[key]).toBe('string');
          checkChatInput(parsed.name_localizations[key], `${file} name_localizations[${key}]`);
        }
        expect(parsed.description_localizations).toBeDefined();
        for (const key of localeKeys) {
          expect(parsed.description_localizations[key]).toBeDefined();
          expect(typeof parsed.description_localizations[key]).toBe('string');
        }
      });
      if (parsed.options) {
        for (const [i, opt] of parsed.options.entries()) {
          test(`${file} option[${i}] has valid name and localizations`, () => {
            expect(opt.name_localizations).toBeDefined();
            expect(opt.description_localizations).toBeDefined();
            checkChatInput(opt.name, `${file} option[${i}] name`);
            for (const key of localeKeys) {
              expect(opt.name_localizations[key]).toBeDefined();
              expect(typeof opt.name_localizations[key]).toBe('string');
              checkChatInput(opt.name_localizations[key], `${file} option[${i}] name_localizations[${key}]`);
              expect(opt.description_localizations[key]).toBeDefined();
              expect(typeof opt.description_localizations[key]).toBe('string');
            }
          });
        }
      }
    } else if (parsed.type > 1) {
      test(`${file} (USER/MESSAGE) has valid name and no description`, () => {
        expect(typeof parsed.name).toBe('string');
        expect(parsed.name.length).toBeGreaterThanOrEqual(1);
        expect(parsed.name.length).toBeLessThanOrEqual(32);
        expect(parsed.name_localizations).toBeDefined();
        for (const key of localeKeys) {
          expect(parsed.name_localizations[key]).toBeDefined();
          expect(typeof parsed.name_localizations[key]).toBe('string');
          expect(parsed.name_localizations[key].length).toBeGreaterThanOrEqual(1);
          expect(parsed.name_localizations[key].length).toBeLessThanOrEqual(32);
        }
        if (parsed.options) {
          for (const [i, opt] of parsed.options.entries()) {
            expect(typeof opt.name).toBe('string');
            expect(opt.name.length).toBeGreaterThanOrEqual(1);
            expect(opt.name.length).toBeLessThanOrEqual(32);
            expect(opt.name_localizations).toBeDefined();
            for (const key of localeKeys) {
              expect(opt.name_localizations[key]).toBeDefined();
              expect(typeof opt.name_localizations[key]).toBe('string');
              expect(opt.name_localizations[key].length).toBeGreaterThanOrEqual(1);
              expect(opt.name_localizations[key].length).toBeLessThanOrEqual(32);
            }
          }
        }
        expect(parsed.description).toBeUndefined();
        expect(parsed.description_localizations).toBeUndefined();
      });
    }
  }
});
