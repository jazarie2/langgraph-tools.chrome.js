import { tool } from "@langchain/core/tools";
import { Command } from "@langchain/langgraph";
import { ToolMessage } from "@langchain/core/messages";
import { z } from "zod";

/**
 * Simple search tool that simulates web search
 * Demonstrates basic tool creation pattern
 */
export const searchTool = tool(
  async ({ query }) => {
    try {
      // Simulate search API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockResults = [
        {
          title: `Search result for: ${query}`,
          content: `This is a detailed explanation about ${query}. It provides comprehensive information that would be useful for answering related questions.`,
          url: `https://example.com/search?q=${encodeURIComponent(query)}`,
          relevanceScore: 0.95,
        },
        {
          title: `Additional information about ${query}`,
          content: `Here's more context and background information about ${query} that complements the primary search result.`,
          url: `https://example.com/info/${query.replace(/\s+/g, '-')}`,
          relevanceScore: 0.87,
        },
      ];
      
      return JSON.stringify(mockResults, null, 2);
    } catch (error) {
      return `Search error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
  {
    name: "search",
    description: "Search for information on the web. Use this when you need current information or facts.",
    schema: z.object({
      query: z.string().describe("The search query to execute"),
    }),
  }
);

/**
 * Advanced search tool that updates graph state
 * Demonstrates state-updating tool pattern using Command
 */
export const advancedSearchTool = tool(
  async ({ query, maxResults = 3 }, config) => {
    try {
      // Simulate API call with configurable results
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const searchResults = Array.from({ length: maxResults }, (_, i) => ({
        title: `Result ${i + 1}: ${query}`,
        content: `Detailed content for search result ${i + 1} about ${query}. This provides relevant information for the user's query.`,
        url: `https://search-engine.com/result/${i + 1}?q=${encodeURIComponent(query)}`,
        relevanceScore: Math.random() * 0.3 + 0.7, // Random score between 0.7-1.0
      }));
      
      // Sort by relevance score
      searchResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      // Update graph state with search results
      return new Command({
        update: {
          searchResults,
          actionHistory: [`Searched for: "${query}" - Found ${searchResults.length} results`],
          messages: [
            new ToolMessage({
              content: `Found ${searchResults.length} search results for "${query}". Results have been saved to state.`,
              tool_call_id: config.toolCall?.id || "search-call",
            }),
          ],
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown search error';
      
      return new Command({
        update: {
          errors: [`Search failed: ${errorMessage}`],
          actionHistory: [`Search failed for: "${query}"`],
          messages: [
            new ToolMessage({
              content: `Search failed: ${errorMessage}`,
              tool_call_id: config.toolCall?.id || "search-call",
            }),
          ],
        },
      });
    }
  },
  {
    name: "advanced_search",
    description: "Perform advanced web search and save results to graph state for later analysis",
    schema: z.object({
      query: z.string().describe("The search query"),
      maxResults: z.number().optional().describe("Maximum number of results (default: 3)"),
    }),
  }
);

/**
 * Research tool that combines multiple searches
 * Demonstrates complex tool logic and state management
 */
export const researchTool = tool(
  async ({ topic, depth = "medium" }, config) => {
    try {
      const searchQueries = generateResearchQueries(topic, depth);
      const allResults: any[] = [];
      const researchNotes: string[] = [];
      
      // Perform multiple searches
      for (const query of searchQueries) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
        
        const results = mockSearch(query, 2);
        allResults.push(...results);
        researchNotes.push(`Searched "${query}": Found ${results.length} relevant sources`);
      }
      
      // Analyze and synthesize results
      const conclusion = synthesizeResearch(topic, allResults);
      
      return new Command({
        update: {
          searchResults: allResults,
          researchNotes,
          conclusion,
          actionHistory: [`Completed research on: "${topic}" (${depth} depth)`],
          messages: [
            new ToolMessage({
              content: `Research completed on "${topic}". Found ${allResults.length} sources and generated conclusion.`,
              tool_call_id: config.toolCall?.id || "research-call",
            }),
          ],
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Research error';
      
      return new Command({
        update: {
          errors: [`Research failed: ${errorMessage}`],
          messages: [
            new ToolMessage({
              content: `Research failed: ${errorMessage}`,
              tool_call_id: config.toolCall?.id || "research-call",
            }),
          ],
        },
      });
    }
  },
  {
    name: "research",
    description: "Conduct comprehensive research on a topic using multiple search strategies",
    schema: z.object({
      topic: z.string().describe("The research topic"),
      depth: z.enum(["shallow", "medium", "deep"]).optional().describe("Research depth level"),
    }),
  }
);

// Helper functions
function generateResearchQueries(topic: string, depth: string): string[] {
  const baseQueries = [topic, `${topic} overview`, `${topic} definition`];
  
  if (depth === "medium" || depth === "deep") {
    baseQueries.push(
      `${topic} benefits`,
      `${topic} challenges`,
      `${topic} examples`
    );
  }
  
  if (depth === "deep") {
    baseQueries.push(
      `${topic} research`,
      `${topic} statistics`,
      `${topic} trends`,
      `${topic} future outlook`
    );
  }
  
  return baseQueries;
}

function mockSearch(query: string, count: number) {
  return Array.from({ length: count }, (_, i) => ({
    title: `${query} - Result ${i + 1}`,
    content: `Comprehensive information about ${query}. This source provides valuable insights and data relevant to the research topic.`,
    url: `https://research-source.com/${query.replace(/\s+/g, '-')}-${i + 1}`,
    relevanceScore: Math.random() * 0.2 + 0.8,
  }));
}

function synthesizeResearch(topic: string, results: any[]): string {
  const sourceCount = results.length;
  const avgRelevance = results.reduce((sum, r) => sum + r.relevanceScore, 0) / sourceCount;
  
  return `Based on research from ${sourceCount} sources (avg. relevance: ${avgRelevance.toFixed(2)}), ` +
    `${topic} is a significant subject with multiple perspectives and applications. ` +
    `The research indicates both opportunities and challenges in this area, ` +
    `with ongoing developments that warrant continued attention and study.`;
}