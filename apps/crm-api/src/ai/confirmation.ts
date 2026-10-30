const APPROVAL_PATTERNS = [
  /\b(yes|yeah|yep|yup|sure|ok|okay|go ahead|launch|send it|confirm|approved?|do it|proceed)\b/i,
  /\b(let'?s go|fire it|ship it)\b/i,
];

const REJECTION_PATTERNS = [
  /\b(no|nope|cancel|stop|wait|not yet|hold|don'?t)\b/i,
];

export function detectUserApproval(text: string): "approve" | "reject" | "neutral" {
  const trimmed = text.trim();
  if (!trimmed) return "neutral";

  if (REJECTION_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return "reject";
  }

  if (APPROVAL_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return "approve";
  }

  return "neutral";
}

export function shouldAskForConfirmation(message: string): boolean {
  return (
    message.includes("Should I launch") ||
    message.includes("confirm") ||
    message.includes("ready to send")
  );
}
