import { Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

/**
 * Standard message-based state for conversational agents
 * Uses MessagesAnnotation pattern for automatic message handling
 */
export const MessagesState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => (x || []).concat(y || []),
    default: () => [],
  }),
});

/**
 * Extended state for agents that need additional context
 */
export const ExtendedAgentState = Annotation.Root({
  // Core conversation messages
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => (x || []).concat(y || []),
    default: () => [],
  }),
  
  // User information and context
  userInfo: Annotation<Record<string, any>>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  
  // Current task or workflow state
  currentTask: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  
  // Action history for debugging and analysis
  actionHistory: Annotation<string[]>({
    reducer: (x, y) => (x || []).concat(y || []),
    default: () => [],
  }),
  
  // Error tracking
  errors: Annotation<string[]>({
    reducer: (x, y) => (x || []).concat(y || []),
    default: () => [],
  }),
  
  // Configuration and settings
  config: Annotation<Record<string, any>>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
});

/**
 * Research-specific state for agents that perform research tasks
 */
export const ResearchAgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => (x || []).concat(y || []),
    default: () => [],
  }),
  
  query: Annotation<string>(),
  
  searchResults: Annotation<Array<{
    title: string;
    content: string;
    url: string;
    relevanceScore?: number;
  }>>({
    reducer: (x, y) => (x || []).concat(y || []),
    default: () => [],
  }),
  
  researchNotes: Annotation<string[]>({
    reducer: (x, y) => (x || []).concat(y || []),
    default: () => [],
  }),
  
  conclusion: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
});

/**
 * Multi-agent coordination state
 */
export const MultiAgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => (x || []).concat(y || []),
    default: () => [],
  }),
  
  activeAgent: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "coordinator",
  }),
  
  agentOutputs: Annotation<Record<string, any>>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  
  taskQueue: Annotation<Array<{
    id: string;
    type: string;
    assignedTo?: string;
    status: "pending" | "in_progress" | "completed" | "failed";
    data: any;
  }>>({
    reducer: (existing, update) => {
      const existingTasks = existing || [];
      const newTasks = update || [];
      
      // Merge tasks by ID, updating existing ones
      const taskMap = new Map();
      existingTasks.forEach(task => taskMap.set(task.id, task));
      newTasks.forEach(task => taskMap.set(task.id, { ...taskMap.get(task.id), ...task }));
      
      return Array.from(taskMap.values());
    },
    default: () => [],
  }),
});

// Type exports for better TypeScript support
export type MessagesStateType = typeof MessagesState.State;
export type ExtendedAgentStateType = typeof ExtendedAgentState.State;
export type ResearchAgentStateType = typeof ResearchAgentState.State;
export type MultiAgentStateType = typeof MultiAgentState.State;