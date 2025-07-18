# Practice Session Updates - 3-Attempt Workflow Implementation

## Overview
This document outlines the comprehensive updates made to implement the 3-attempt question handling workflow with abandon-as-completion behavior in the Polish language learning application.

## Changes Made

### 1. ConceptPracticeSession Model Updates
**File:** `datamodels/conceptPracticeSession.model.ts`

#### New Interface: IQuestionResponse
```typescript
export interface IQuestionResponse {
  questionId: string;
  attempts: number; // Current attempt number (1-3)
  isCorrect: boolean;
  responseTime: number; // Total time across all attempts
  userAnswer: string; // Final answer provided
  timestamp: Date; // When the question was completed
}
```

#### Updated IConceptPracticeSession
- Added `questionResponses: IQuestionResponse[]` - Detailed responses per question
- Added `completionReason: 'completed' | 'abandoned'` - How session ended
- Changed `completedAt` to optional - Can be abandoned before completion
- Updated `sessionMetrics` to remove redundant fields:
  - Removed: `averageResponseTime`, `conceptsReviewed`, `bankQuestionsUsed`
  - Kept: `totalQuestions`, `correctAnswers`, `newQuestionsGenerated`

### 2. New API Endpoints

#### POST /api/practice-new/start
**File:** `app/api/practice-new/start/route.ts`
- Initializes practice sessions with database records
- Creates session in database before returning questions
- Tracks session metadata and fallback strategies

#### POST /api/practice-new/session-answer
**File:** `app/api/practice-new/session-answer/route.ts`
- Handles individual question attempts (1-3 attempts max)
- Tracks attempts per question in session
- Updates QuestionBank.successRate after question completion (not each attempt)
- Updates ConceptProgress when question is completed
- Shows correct answer only after 3rd failed attempt

#### POST /api/practice-new/session-complete
**File:** `app/api/practice-new/session-complete/route.ts`
- Completes sessions (both 'completed' and 'abandoned')
- Calculates metrics based on actual questions attempted
- Provides session analysis and recommendations
- Updates concept progress summary

### 3. Type System Updates
**File:** `lib/practiceEngine/types.ts`

#### Updated QuestionResponse Interface
- Added `showCorrectAnswer?: boolean` - Whether to show correct answer
- Updated comments to reflect 3-attempt workflow

#### Updated PracticeSessionState Interface
- Added `completionReason?: 'completed' | 'abandoned'`
- Added `currentAttempt?: number` - Current attempt for active question
- Added `questionsCompleted?: number` - Questions completed (correct or 3 attempts)

#### Updated SessionMetrics Interface
- Added `attemptsBreakdown` object with first/second/third attempt counts
- Added `questionsCompleted` and `questionsAttempted` counters
- Added `completionReason` field

### 4. Database Schema Changes

#### New QuestionResponseSchema
- Embedded document for tracking individual question responses
- Constraints: attempts (1-3), responseTime (>= 0)
- References QuestionBank via questionId

#### Updated ConceptPracticeSessionSchema
- Added `questionResponses` array field
- Added `completionReason` enum field
- Simplified `sessionMetrics` object
- Made `completedAt` optional

## Workflow Implementation

### 3-Attempt Question Handling

1. **Question Presentation**: Client receives question from `/api/practice-new/start`
2. **Answer Submission**: Client submits answer to `/api/practice-new/session-answer`
3. **Attempt Tracking**: Server tracks attempt number (1-3) per question
4. **Validation**: LLM validates answer and provides feedback
5. **Completion Logic**: 
   - Question completes on correct answer OR 3rd attempt
   - Correct answer shown only after 3rd failed attempt
   - Progress updates only when question is completed

### Abandon-as-Completion Behavior

1. **Session Tracking**: All responses tracked in database
2. **Partial Progress**: Metrics calculated from actual attempts, not planned questions
3. **Completion Endpoint**: `/api/practice-new/session-complete` handles both cases
4. **Analysis**: Same analysis provided regardless of completion reason
5. **Recommendations**: Tailored suggestions based on completion reason

### Metrics Calculation

- **Based on Actual Attempts**: Only questions attempted count toward metrics
- **Attempt Distribution**: Tracks performance by attempt number
- **Partial Session Support**: Handles abandoned sessions with incomplete data
- **Progress Updates**: ConceptProgress updated for all completed questions

## Benefits

1. **Improved Learning**: 3-attempt system provides multiple chances without penalty
2. **Better Metrics**: Accurate tracking of actual vs planned practice
3. **Flexible Completion**: Abandoned sessions still provide valuable data
4. **Detailed Analytics**: Comprehensive attempt-level analysis
5. **Enhanced UX**: Clear feedback and progress indication

## Usage Examples

### Starting a Practice Session
```typescript
const response = await fetch('/api/practice-new/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mode: 'normal',
    maxQuestions: 10,
    maxConcepts: 5
  })
});
```

### Submitting an Answer
```typescript
const response = await fetch('/api/practice-new/session-answer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'session_123',
    questionId: 'q_456',
    userAnswer: 'moja odpowiedź',
    responseTime: 5000,
    attemptNumber: 1
  })
});
```

### Completing a Session
```typescript
const response = await fetch('/api/practice-new/session-complete', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'session_123',
    completionReason: 'completed', // or 'abandoned'
    totalTimeSpent: 300000
  })
});
```

## Database Migration Notes

- **Backward Compatibility**: Old sessions without questionResponses will continue to work
- **Data Migration**: Existing sessions may need migration script for new fields
- **Indexes**: Existing indexes on ConceptPracticeSession remain valid
- **Field Changes**: completedAt is now optional, completionReason has default value

## Testing Recommendations

1. **Unit Tests**: Test attempt counting logic in session-answer endpoint
2. **Integration Tests**: Test complete workflow from start to completion
3. **Edge Cases**: Test abandonment scenarios and partial session handling
4. **Performance Tests**: Verify database queries perform well with new schema
5. **Migration Tests**: Ensure existing data compatibility

## Next Steps

1. **Frontend Integration**: Update React components to use new API workflow
2. **Analytics Dashboard**: Create views for attempt-level analytics
3. **Performance Monitoring**: Monitor database performance with new schema
4. **User Testing**: Validate UX with 3-attempt workflow
5. **Documentation**: Update API documentation for new endpoints