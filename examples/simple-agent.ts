/**
 * Simple LangGraph Agent Example
 * 
 * This example demonstrates the core patterns defined in the .cursorrules file:
 * - State management with Annotations
 * - Tool creation and integration
 * - Agent patterns with proper error handling
 * - Streaming and configuration
 */

import { HumanMessage } from "@langchain/core/messages";
import { createSimpleReactAgent, createAdvancedReactAgent } from "../src/agents/react-agent.js";

async function runSimpleExample() {
  console.log("🚀 Starting Simple ReAct Agent Example\n");

  try {
    // Create the agent using prebuilt components
    const agent = createSimpleReactAgent();

    // Run the agent with a query that will trigger tool use
    const input = {
      messages: [
        new HumanMessage({
          content: "What are the latest developments in artificial intelligence? Please search for current information.",
        }),
      ],
    };

    console.log("User Query:", input.messages[0].content);
    console.log("\n--- Agent Execution ---");

    // Stream the execution to see each step
    const stream = await agent.stream(input);

    for await (const chunk of stream) {
      const nodeNames = Object.keys(chunk);
      const nodeName = nodeNames[0];
      const nodeOutput = chunk[nodeName];

      console.log(`\n[${nodeName.toUpperCase()}]`);
      
      if (nodeOutput.messages) {
        const lastMessage = nodeOutput.messages[nodeOutput.messages.length - 1];
        if (lastMessage.content) {
          console.log("Content:", lastMessage.content.slice(0, 200) + "...");
        }
        if (lastMessage.tool_calls) {
          console.log("Tool Calls:", lastMessage.tool_calls.map(tc => tc.name));
        }
      }
    }

    console.log("\n✅ Simple example completed successfully!");

  } catch (error) {
    console.error("❌ Error in simple example:", error);
  }
}

async function runAdvancedExample() {
  console.log("\n🔬 Starting Advanced ReAct Agent Example\n");

  try {
    // Create the advanced agent with custom state management
    const agent = createAdvancedReactAgent();

    const input = {
      messages: [
        new HumanMessage({
          content: "I need comprehensive research on renewable energy trends. Please gather detailed information.",
        }),
      ],
      userInfo: {
        interests: ["environment", "technology"],
        expertise_level: "intermediate",
      },
      config: {
        max_search_results: 5,
        research_depth: "deep",
      },
    };

    console.log("User Query:", input.messages[0].content);
    console.log("User Context:", JSON.stringify(input.userInfo, null, 2));
    console.log("\n--- Advanced Agent Execution ---");

    // Execute with detailed state tracking
    const result = await agent.invoke(input);

    console.log("\n--- Final State ---");
    console.log("Messages Count:", result.messages.length);
    console.log("Action History:", result.actionHistory);
    
    if (result.searchResults) {
      console.log("Search Results:", result.searchResults.length, "items");
    }
    
    if (result.errors && result.errors.length > 0) {
      console.log("Errors:", result.errors);
    }

    // Display the final response
    const finalMessage = result.messages[result.messages.length - 1];
    if (finalMessage.content) {
      console.log("\nFinal Response Preview:");
      console.log(finalMessage.content.slice(0, 300) + "...");
    }

    console.log("\n✅ Advanced example completed successfully!");

  } catch (error) {
    console.error("❌ Error in advanced example:", error);
  }
}

async function runStreamingExample() {
  console.log("\n📡 Starting Streaming Example\n");

  try {
    const agent = createAdvancedReactAgent();

    const input = {
      messages: [
        new HumanMessage({
          content: "Search for information about climate change impacts on agriculture.",
        }),
      ],
    };

    console.log("User Query:", input.messages[0].content);
    console.log("\n--- Streaming Agent Execution ---");

    // Demonstrate event streaming for real-time updates
    const eventStream = await agent.streamEvents(input, { version: "v1" });

    let stepCount = 0;
    for await (const event of eventStream) {
      if (event.event === "on_chain_start" && event.name !== "LangGraph") {
        stepCount++;
        console.log(`\n[STEP ${stepCount}] Starting: ${event.name}`);
      }
      
      if (event.event === "on_chain_end" && event.name !== "LangGraph") {
        console.log(`[STEP ${stepCount}] Completed: ${event.name}`);
      }
      
      if (event.event === "on_tool_start") {
        console.log(`🔧 Tool starting: ${event.name}`);
      }
      
      if (event.event === "on_tool_end") {
        console.log(`✅ Tool completed: ${event.name}`);
      }
    }

    console.log("\n✅ Streaming example completed successfully!");

  } catch (error) {
    console.error("❌ Error in streaming example:", error);
  }
}

// Configuration example
function demonstrateConfiguration() {
  console.log("\n⚙️  Configuration Best Practices\n");

  // Environment-based configuration
  const config = {
    llm: {
      modelName: process.env.MODEL_NAME || "gpt-4o-mini",
      temperature: parseFloat(process.env.TEMPERATURE || "0"),
      apiKey: process.env.OPENAI_API_KEY,
    },
    tools: {
      searchApiKey: process.env.SEARCH_API_KEY,
      maxResults: parseInt(process.env.MAX_SEARCH_RESULTS || "3"),
    },
    agent: {
      maxSteps: parseInt(process.env.MAX_AGENT_STEPS || "10"),
      enableMemory: process.env.ENABLE_MEMORY === "true",
      interruptBefore: process.env.INTERRUPT_BEFORE?.split(",") || [],
    },
  };

  console.log("Example Configuration:");
  console.log(JSON.stringify(config, null, 2));

  console.log("\nEnvironment Variables to Set:");
  console.log("- OPENAI_API_KEY: Your OpenAI API key");
  console.log("- MODEL_NAME: Model to use (default: gpt-4o-mini)");
  console.log("- TEMPERATURE: Model temperature (default: 0)");
  console.log("- MAX_SEARCH_RESULTS: Maximum search results (default: 3)");
  console.log("- MAX_AGENT_STEPS: Maximum agent steps (default: 10)");
  console.log("- ENABLE_MEMORY: Enable persistence (default: false)");
  console.log("- INTERRUPT_BEFORE: Comma-separated nodes to interrupt before");
}

// Main execution function
async function main() {
  console.log("🎯 LangGraph JavaScript Examples");
  console.log("================================\n");

  demonstrateConfiguration();
  
  if (!process.env.OPENAI_API_KEY) {
    console.log("\n⚠️  Warning: OPENAI_API_KEY not set. Examples will fail without it.");
    console.log("Set your API key: export OPENAI_API_KEY='your-key-here'\n");
    return;
  }

  try {
    await runSimpleExample();
    await runAdvancedExample();
    await runStreamingExample();
  } catch (error) {
    console.error("❌ Error running examples:", error);
  }

  console.log("\n🎉 All examples completed!");
  console.log("\nNext steps:");
  console.log("1. Review the .cursorrules file for comprehensive patterns");
  console.log("2. Explore src/agents/ for more complex examples");
  console.log("3. Check src/tools/ for tool creation patterns");
  console.log("4. Look at src/utils/state.ts for state management examples");
}

// Run the examples
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}