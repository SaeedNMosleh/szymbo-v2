# Szymbo V2

A Next.js-powered intelligent Polish language learning platform that leverages AI to provide adaptive, concept-based learning experiences.

![Polish Language Learning Platform](https://img.shields.io/badge/Learning-Polish-red)
![Next.js 15](https://img.shields.io/badge/Next.js-15-black)
![React 19](https://img.shields.io/badge/React-19-blue)

## Features

- **Concept-Based Learning**: AI-powered concept extraction and management system
- **Adaptive Practice Sessions**: Personalized exercises with spaced repetition (SRS)
- **Smart Question Generation**: LLM-generated practice questions across 18+ question types
- **Progress Tracking**: Track mastery of grammar and vocabulary concepts
- **Time and Date Practice**: Specialized modules for learning Polish time and date expressions

## Technology Stack

- **Frontend**: Next.js, React 19, Tailwind CSS, shadcn/ui components
- **Backend**: Next.js API routes, MongoDB with Mongoose
- **AI Integration**: OpenAI and Groq LLM integration for concept extraction and question generation
- **Data Models**: Comprehensive models for concepts, courses, practice sessions and more

## Architecture & Core Flows

### Concept Extraction Pipeline

1. **Extraction**: LLM analyzes course content to identify discrete concepts
2. **Similarity Matching**: New concepts are compared with existing ones to prevent duplication
3. **Human Review**: Extracted concepts undergo validation with human-in-the-loop approval
4. **Concept Storage**: Approved concepts are stored with metadata for learning system use

### Practice Engine Flow

1. **Concept Selection**: SRS algorithm selects concepts due for review based on forgetting curves
2. **Question Generation**: Dynamic question creation with difficulty adaptation based on user mastery
3. **Interleaving**: Concepts are mixed to improve retention through varied practice
4. **Performance Analysis**: User responses update concept mastery levels and adjust review schedules

## Development

### Installation

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev
```

### Build & Run

```bash
# Build for production
npm run build

# Start production server
npm start
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

### Project Organization

- `/app`: Next.js application routes and pages
- `/components`: React components (Features and UI components)
- `/datamodels`: MongoDB schemas and interfaces
- `/lib`: Core business logic
  - `/conceptExtraction`: AI-powered concept extraction system
  - `/practiceEngine`: Adaptive learning algorithm with spaced repetition
  - `/questionGeneration`: Question creation and validation logic

### Deployment Instructions

This project is optimized for deployment on Vercel.

```bash
# Build with legacy peer dependencies
npm install --legacy-peer-deps && npm run build
```

## Getting Started

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Visit [https://szymbo-pro.vercel.app/](https://szymbo-pro.vercel.app/) to see the application.

## Project Structure

- `/app`: Next.js application routes and pages
- `/components`: React components (Features and UI components)
- `/datamodels`: MongoDB schemas and interfaces
- `/lib`: Core business logic
  - `/conceptExtraction`: AI-powered concept extraction system
  - `/practiceEngine`: Adaptive learning algorithm with spaced repetition
  - `/questionGeneration`: Question creation and validation logic

## Deployment

This project is optimized for deployment on Vercel.

```bash
# Build with legacy peer dependencies
npm install --legacy-peer-deps && npm run build
```
