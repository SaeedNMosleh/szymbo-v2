SOFTWARE ENGINEERING PRINCIPLES:
- Extensibility: Design enums for future growth without breaking changes
- Type Safety: Comprehensive TypeScript usage with strict validation
- Maintainability: Clear, descriptive naming conventions
- Documentation: JSDoc comments for all public enums
- Consistency: Follow existing codebase patterns and naming

ARCHITECTURE GUIDELINES:
- Single Responsibility: Each enum serves one specific domain purpose
- Open/Closed Principle: Enums should be closed for modification, open for extension
- Interface Segregation: Separate concerns into focused enum groups
- Dependency Management: Minimal coupling between enum definitions

REQUIREMENTS:
Add ConceptCategory enum (GRAMMAR, VOCABULARY only - extensible design)
Add PracticeMode enum (NORMAL, PREVIOUS, DRILL)
Maintain backward compatibility with all existing enums
Follow snake_case for enum values, PascalCase for enum names

QUALITY STANDARDS:
- Add comprehensive JSDoc documentation
- Include usage examples in comments
- Validate enum value consistency across the application
- Ensure TypeScript strict mode compliance
- Add runtime validation helpers if needed

PERFORMANCE CONSIDERATIONS:
- Use string enums for better debugging and serialization
- Avoid complex enum computations
- Consider tree-shaking implications

Follow existing enum patterns in the codebase, maintain consistency with current naming conventions, and ensure all new enums integrate seamlessly with existing type system.