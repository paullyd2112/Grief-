const PHONE = /(?:\+?\d[\d\s\-().]{6,}\d)/;
const EMAIL = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;
const URL_PATTERN = /https?:\/\/[^\s]+/i;
const SOCIAL = /(?:@[a-zA-Z0-9._]{2,})|(?:(?:instagram|snapchat|snap|ig|insta|twitter|tiktok|telegram|signal|whatsapp|discord|facebook|fb)[:\s]*[a-zA-Z0-9._]{2,})/i;

export function containsContactInfo(text: string): boolean {
  return (
    PHONE.test(text) ||
    EMAIL.test(text) ||
    URL_PATTERN.test(text) ||
    SOCIAL.test(text)
  );
}
