export enum QuestionType {
  CLOZE_GAP = "cloze_gap",
  MULTIPLE_CHOICE = "multiple_choice",
  MAKE_SENTENCE = "make_sentence",
  Q_AND_A = "q_and_a",
}

export enum MistakeType {
  TYPO = "typo",
  GRAMMAR = "grammar",
  VOCAB = "vocab",
  WORD_ORDER = "word_order",
  INCOMPLETE_ANSWER = "incomplete_answer",
}

export enum CourseType {
  NEW = "new",
  REVIEW = "review",
  MIXED = "mixed",
}

export enum QuestionLevel {
  A1 = "A1",
  A2 = "A2",
  B1 = "B1",
  B2 = "B2",
  C1 = "C1",
  C2 = "C2",
}

export enum ConceptCategory {
  GRAMMAR = "grammar",
  VOCABULARY = "vocabulary",
}

export enum PracticeMode {
  NORMAL = "normal",
  PREVIOUS = "previous",
  DRILL = "drill",
}

export enum ConceptExtractionStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  REVIEWED = "reviewed",
}
