# LangGraph JavaScript/TypeScript Rules for Cursor

This repository provides comprehensive Cursor rules for developing LangGraph applications in JavaScript and TypeScript. The rules guide you through building reliable, scalable, and maintainable AI agents using LangGraph's powerful graph-based architecture.

## 🎯 What's Included

### 📋 Comprehensive Rules (`.cursorrules`)
- **Core Architecture Principles**: Graph structure, state management, and node patterns
- **Tool Development Guidelines**: Creating tools, state updates, and error handling
- **Agent Patterns**: ReAct agents, custom implementations, and routing logic
- **State Management**: Reducers, annotations, and message handling
- **Best Practices**: Error handling, streaming, memory, and testing patterns
- **Integration Guidelines**: LangChain integration, APIs, and databases

### 🛠️ Example Implementation
- **State Definitions** (`src/utils/state.ts`): Various state patterns for different use cases
- **Tool Examples** (`src/tools/search.ts`): Basic and advanced tool patterns with state updates
- **Agent Examples** (`src/agents/react-agent.ts`): Multiple agent implementations
- **Working Example** (`examples/simple-agent.ts`): Runnable examples demonstrating all patterns

## 🚀 Quick Start

### 1. Setup
```bash
# Clone or copy the .cursorrules file to your project root
cp .cursorrules /path/to/your/langgraph/project/

# Install dependencies
npm install @langchain/langgraph @langchain/core @langchain/openai zod
```

### 2. Environment Configuration
```bash
# Set your API keys
export OPENAI_API_KEY="your-openai-api-key"
export MODEL_NAME="gpt-4o-mini"  # optional
export TEMPERATURE="0"           # optional
```

### 3. Try the Examples
```bash
# Run the example
npm run dev  # or tsx examples/simple-agent.ts
```

## 📖 Core Concepts Covered

### State Management
```typescript
// Proper state definition with reducers
const MyState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  userInfo: Annotation<object>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
});
```

### Tool Creation
```typescript
// Basic tool
const searchTool = tool(
  async ({ query }) => {
    // Implementation
    return results;
  },
  {
    name: "search",
    description: "Search for information",
    schema: z.object({
      query: z.string().describe("Search query"),
    }),
  }
);

// State-updating tool
const advancedTool = tool(
  async (input, config) => {
    return new Command({
      update: {
        searchResults: results,
        messages: [new ToolMessage(...)],
      },
    });
  },
  { /* config */ }
);
```

### Agent Patterns
```typescript
// ReAct agent with prebuilt components
const agent = createReactAgent({
  llm: model,
  tools: [searchTool],
  stateSchema: MyState,
});

// Custom agent implementation
const workflow = new StateGraph(MyState)
  .addNode("agent", agentNode)
  .addNode("tools", toolNode)
  .addConditionalEdges("agent", shouldContinue, {
    continue: "tools",
    end: END,
  })
  .compile();
```

## 🎨 Patterns and Examples

### 1. Simple ReAct Agent
- Uses prebuilt `createReactAgent`
- Basic tool integration
- Automatic message handling

### 2. Advanced Custom Agent
- Manual graph construction
- Custom state management
- Error handling and recovery
- Complex routing logic

### 3. Memory and Persistence
- Checkpointers for state persistence
- Human-in-the-loop interrupts
- Conversation memory

### 4. Multi-Agent Systems
- Agent coordination
- Task routing
- Shared state management

## 🔧 Development Workflow

### Using with Cursor
1. Place `.cursorrules` in your project root
2. Cursor will automatically apply these rules when writing LangGraph code
3. The rules provide context-aware suggestions for:
   - State definitions and reducers
   - Tool creation patterns
   - Error handling strategies
   - Agent architecture decisions

### Key Rules Benefits
- **Consistent Patterns**: Standardized approaches across your codebase
- **Error Prevention**: Built-in error handling and validation patterns
- **Performance Optimization**: Streaming, async operations, and state efficiency
- **Maintainability**: Clear separation of concerns and modular design
- **Type Safety**: TypeScript patterns for better development experience

## 📚 Architecture Guidelines

### State Design
- Use `Annotation.Root` for state schemas
- Define appropriate reducers for data merging
- Provide default values for all state fields
- Keep state minimal and focused

### Tool Development
- Validate inputs with Zod schemas
- Handle errors gracefully
- Use `Command` objects for state updates
- Document tool purposes clearly

### Agent Structure
- Separate concerns into focused nodes
- Use conditional edges for decision logic
- Implement proper error boundaries
- Enable streaming for better UX

### Error Handling
- Graceful degradation on tool failures
- User-friendly error messages
- State corruption prevention
- Recovery mechanisms

## 🎯 Best Practices

### Performance
- Stream long-running operations
- Use background runs for intensive tasks
- Optimize state updates
- Implement proper cancellation

### Testing
- Test nodes in isolation
- Mock external dependencies
- Validate state transitions
- Test error scenarios

### Configuration
- Use environment variables
- Provide sensible defaults
- Document configuration options
- Support different environments

## 🔗 Integration

### LangChain Integration
- Seamless tool compatibility
- Leverage existing integrations
- Follow LangChain patterns

### External APIs
- Implement rate limiting
- Use retry mechanisms
- Handle API errors
- Cache responses appropriately

### Database Integration
- Use async operations
- Implement connection pooling
- Handle database errors
- Use transactions for consistency

## 📖 Learn More

- [LangGraph JavaScript Documentation](https://langchain-ai.github.io/langgraphjs/)
- [LangChain Core Concepts](https://js.langchain.com/docs/)
- [Tool Development Guide](https://js.langchain.com/docs/modules/tools/)
- [State Management Patterns](https://langchain-ai.github.io/langgraphjs/concepts/low_level/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add new patterns or improve existing ones
4. Update documentation
5. Submit a pull request

## 📄 License

MIT License - feel free to use these rules in your projects!

---

**Happy coding with LangGraph!** 🚀 These rules will help you build reliable, maintainable, and powerful AI agents using JavaScript and TypeScript.