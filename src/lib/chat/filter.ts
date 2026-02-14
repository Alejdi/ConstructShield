export interface FilterResult {
  isFlagged: boolean;
  flagReason: string | null;
  filteredContent: string;
}

const PHONE_REGEX =
  /(\+?\d{1,4}[\s.-]?)?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const URL_REGEX = /https?:\/\/[^\s]+/gi;

const LEAKAGE_KEYWORDS = [
  "cash",
  "venmo",
  "paypal",
  "zelle",
  "cashapp",
  "cash app",
  "whatsapp",
  "telegram",
  "signal",
  "imessage",
  "pay me directly",
  "pay directly",
  "off platform",
  "my number is",
  "call me at",
  "text me at",
  "email me at",
  "wire transfer",
  "bank transfer",
  "western union",
];

export function filterMessage(content: string): FilterResult {
  let isFlagged = false;
  let flagReason: string | null = null;
  let filteredContent = content;

  // Check for phone numbers
  if (PHONE_REGEX.test(content)) {
    isFlagged = true;
    flagReason = "phone_number";
    filteredContent = filteredContent.replace(PHONE_REGEX, "[PHONE REMOVED]");
  }
  // Reset regex lastIndex
  PHONE_REGEX.lastIndex = 0;

  // Check for email addresses
  if (EMAIL_REGEX.test(content)) {
    isFlagged = true;
    flagReason = flagReason ? `${flagReason},email` : "email";
    filteredContent = filteredContent.replace(EMAIL_REGEX, "[EMAIL REMOVED]");
  }
  EMAIL_REGEX.lastIndex = 0;

  // Check for URLs
  if (URL_REGEX.test(content)) {
    isFlagged = true;
    flagReason = flagReason ? `${flagReason},url` : "url";
    filteredContent = filteredContent.replace(URL_REGEX, "[LINK REMOVED]");
  }
  URL_REGEX.lastIndex = 0;

  // Check for leakage keywords
  const lowerContent = content.toLowerCase();
  for (const keyword of LEAKAGE_KEYWORDS) {
    if (lowerContent.includes(keyword)) {
      isFlagged = true;
      flagReason = flagReason
        ? `${flagReason},keyword:${keyword}`
        : `keyword:${keyword}`;
      break;
    }
  }

  return { isFlagged, flagReason, filteredContent };
}
