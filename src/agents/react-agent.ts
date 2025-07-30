import { StateGraph, END } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, isAIMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";

import { ExtendedAgentState, ExtendedAgentStateType } from "../utils/state.js";
import { searchTool, advancedSearchTool } from "../tools/search.js";

/**
 * Simple ReAct agent using prebuilt components
 * Best for straightforward tool-calling workflows
 */
export function createSimpleReactAgent() {
  const model = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0,
  });

  return createReactAgent({
    llm: model,
    tools: [searchTool],
    stateModifier: (state) => {
      // Add system message for agent behavior
      const systemMessage = new HumanMessage({
        content: "You are a helpful research assistant. Use the search tool when you need current information.",
      });
      
      return [systemMessage, ...state.messages];
    },
  });
}

/**
 * Advanced ReAct agent with custom state management
 * Demonstrates manual graph construction with proper error handling
 */
export function createAdvancedReactAgent() {
  const model = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0,
  });

  // Bind tools to the model
  const modelWithTools = model.bindTools([advancedSearchTool]);

  // Agent node - decides what action to take
  const agentNode = async (state: ExtendedAgentStateType) => {
    try {
      // Add system context based on current state
      const systemMessage = buildSystemMessage(state);
      const messages = [systemMessage, ...state.messages];

      const response = await modelWithTools.invoke(messages);
      
      return {
        messages: [response],
        actionHistory: ["Agent generated response"],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Agent error";
      
      return {
        messages: [
          new AIMessage({
            content: `I encountered an error: ${errorMessage}. Let me try to help you anyway.`,
          }),
        ],
        errors: [errorMessage],
        actionHistory: ["Agent error occurred"],
      };
    }
  };

  // Tool execution node
  const toolNode = async (state: ExtendedAgentStateType) => {
    const lastMessage = state.messages[state.messages.length - 1];
    
    if (!isAIMessage(lastMessage) || !lastMessage.tool_calls?.length) {
      return {
        errors: ["No tool calls found in last message"],
        actionHistory: ["Tool node called without tool calls"],
      };
    }

    const toolResults = [];
    
    for (const toolCall of lastMessage.tool_calls) {
      try {
        let result;
        
        switch (toolCall.name) {
          case "advanced_search":
            result = await advancedSearchTool.invoke(toolCall.args, {
              toolCall,
            });
            break;
          default:
            result = `Unknown tool: ${toolCall.name}`;
        }
        
        // Handle Command objects or regular results
        if (result && typeof result === 'object' && 'update' in result) {
          // This is a Command object, return it directly
          return result;
        } else {
          // Regular tool result, create ToolMessage
          toolResults.push({
            role: "tool" as const,
            content: typeof result === 'string' ? result : JSON.stringify(result),
            tool_call_id: toolCall.id,
          });
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Tool execution error";
        toolResults.push({
          role: "tool" as const,
          content: `Error executing ${toolCall.name}: ${errorMsg}`,
          tool_call_id: toolCall.id,
        });
      }
    }

    return {
      messages: toolResults,
      actionHistory: [`Executed ${toolResults.length} tool calls`],
    };
  };

  // Router function - decides next step
  const shouldContinue = (state: ExtendedAgentStateType) => {
    const lastMessage = state.messages[state.messages.length - 1];
    
    // Check for errors that should end the conversation
    if (state.errors && state.errors.length > 3) {
      return "end";
    }
    
    // If last message has tool calls, execute tools
    if (isAIMessage(lastMessage) && lastMessage.tool_calls?.length > 0) {
      return "tools";
    }
    
    return "end";
  };

  // Build the graph
  const workflow = new StateGraph(ExtendedAgentState)
    .addNode("agent", agentNode)
    .addNode("tools", toolNode)
    .addEdge("__start__", "agent")
    .addConditionalEdges(
      "agent",
      shouldContinue,
      {
        tools: "tools",
        end: END,
      }
    )
    .addEdge("tools", "agent");

  return workflow.compile();
}

/**
 * ReAct agent with memory and interrupts
 * Demonstrates persistence and human-in-the-loop patterns
 */
export function createMemoryReactAgent() {
  const model = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0,
  });

  const agent = createReactAgent({
    llm: model,
    tools: [searchTool, advancedSearchTool],
    stateSchema: ExtendedAgentState,
    stateModifier: (state) => {
      const systemMessage = buildSystemMessage(state);
      return [systemMessage, ...state.messages];
    },
  });

  // Add memory and interrupts
  const memory = new MemorySaver();
  
  return agent.compile({
    checkpointer: memory,
    interruptBefore: ["tools"], // Allow human review before tool execution
  });
}

/**
 * Custom routing agent that demonstrates advanced control flow
 */
export function createRoutingAgent() {
  const model = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0,
  });

  const classifyNode = async (state: ExtendedAgentStateType) => {
    const lastMessage = state.messages[state.messages.length - 1];
    const content = lastMessage.content.toString().toLowerCase();
    
    let taskType = "general";
    if (content.includes("search") || content.includes("find") || content.includes("look up")) {
      taskType = "search";
    } else if (content.includes("research") || content.includes("analyze") || content.includes("study")) {
      taskType = "research";
    }
    
    return {
      currentTask: taskType,
      actionHistory: [`Classified task as: ${taskType}`],
    };
  };

  const searchAgentNode = async (state: ExtendedAgentStateType) => {
    const modelWithSearch = model.bindTools([searchTool]);
    const response = await modelWithSearch.invoke([
      buildSystemMessage(state, "You are a search specialist. Use the search tool to find information."),
      ...state.messages,
    ]);
    
    return {
      messages: [response],
      actionHistory: ["Search agent responded"],
    };
  };

  const researchAgentNode = async (state: ExtendedAgentStateType) => {
    const modelWithResearch = model.bindTools([advancedSearchTool]);
    const response = await modelWithResearch.invoke([
      buildSystemMessage(state, "You are a research specialist. Conduct thorough research using advanced search."),
      ...state.messages,
    ]);
    
    return {
      messages: [response],
      actionHistory: ["Research agent responded"],
    };
  };

  const generalAgentNode = async (state: ExtendedAgentStateType) => {
    const response = await model.invoke([
      buildSystemMessage(state, "You are a general assistant. Answer questions directly when possible."),
      ...state.messages,
    ]);
    
    return {
      messages: [response],
      actionHistory: ["General agent responded"],
    };
  };

  const routeAfterClassification = (state: ExtendedAgentStateType) => {
    switch (state.currentTask) {
      case "search":
        return "search_agent";
      case "research":
        return "research_agent";
      default:
        return "general_agent";
    }
  };

  const shouldExecuteTools = (state: ExtendedAgentStateType) => {
    const lastMessage = state.messages[state.messages.length - 1];
    return isAIMessage(lastMessage) && lastMessage.tool_calls?.length > 0 ? "tools" : "end";
  };

  // Tool execution node (reused from above)
  const toolNode = async (state: ExtendedAgentStateType) => {
    // Implementation same as above
    const lastMessage = state.messages[state.messages.length - 1];
    
    if (!isAIMessage(lastMessage) || !lastMessage.tool_calls?.length) {
      return { actionHistory: ["No tools to execute"] };
    }

    // Execute tools (simplified for this example)
    return {
      messages: [{
        role: "tool" as const,
        content: "Tool execution completed",
        tool_call_id: lastMessage.tool_calls[0].id,
      }],
      actionHistory: ["Tools executed"],
    };
  };

  const workflow = new StateGraph(ExtendedAgentState)
    .addNode("classify", classifyNode)
    .addNode("search_agent", searchAgentNode)
    .addNode("research_agent", researchAgentNode)
    .addNode("general_agent", generalAgentNode)
    .addNode("tools", toolNode)
    .addEdge("__start__", "classify")
    .addConditionalEdges(
      "classify",
      routeAfterClassification,
      {
        search_agent: "search_agent",
        research_agent: "research_agent",
        general_agent: "general_agent",
      }
    )
    .addConditionalEdges(
      "search_agent",
      shouldExecuteTools,
      {
        tools: "tools",
        end: END,
      }
    )
    .addConditionalEdges(
      "research_agent",
      shouldExecuteTools,
      {
        tools: "tools",
        end: END,
      }
    )
    .addEdge("general_agent", END)
    .addEdge("tools", END);

  return workflow.compile();
}

// Helper function to build system messages
function buildSystemMessage(state: ExtendedAgentStateType, customPrompt?: string): HumanMessage {
  const basePrompt = customPrompt || "You are a helpful AI assistant.";
  
  let contextPrompt = basePrompt;
  
  if (state.userInfo && Object.keys(state.userInfo).length > 0) {
    contextPrompt += `\n\nUser context: ${JSON.stringify(state.userInfo)}`;
  }
  
  if (state.actionHistory && state.actionHistory.length > 0) {
    const recentActions = state.actionHistory.slice(-3);
    contextPrompt += `\n\nRecent actions: ${recentActions.join(", ")}`;
  }
  
  if (state.errors && state.errors.length > 0) {
    contextPrompt += `\n\nNote: There have been ${state.errors.length} previous errors.`;
  }
  
  return new HumanMessage({ content: contextPrompt });
}