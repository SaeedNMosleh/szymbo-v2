// Polish date validation prompt
export const DATE_VALIDATION_PROMPT = `
    Validate if the given answer in Polish correctly represents the date {date}.
    The user's answer is:
    Day: "{userDay}"
    Month: "{userMonth}"
    Year: "{userYear}"
    
    The correct forms are:
    Day: "{correctDay}"
    Month: "{correctMonth}"
    Year: "{correctYear}"

    Respond in the following format:
    Day correct: [true/false]
    Month correct: [true/false]
    Year correct: [true/false]
    Comment: [provide a brief comment about each part of the answer, mentioning any typos or grammatical issues]
  `;

// System prompt for date validation (not used in current implementation but consistent with other modules)
export const DATE_VALIDATION_SYSTEM_PROMPT = "You are a Polish language expert validating date expressions in Polish.";