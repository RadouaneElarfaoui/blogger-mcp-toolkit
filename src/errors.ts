import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

/**
 * Centralized error handler for all Blogger API tool calls.
 * Extracts meaningful error messages from googleapis GaxiosError responses
 * and returns them in the MCP-compatible { isError: true } format so the
 * LLM can understand what went wrong.
 */
export function handleApiError(
  error: unknown,
  toolName: string
): CallToolResult {
  let message: string;

  if (error instanceof Error) {
    // googleapis GaxiosError includes response data with structured error info
    const gaxiosError = error as unknown as Record<string, unknown>;
    const responseData = (
      gaxiosError.response as Record<string, unknown> | undefined
    )?.data as Record<string, unknown> | undefined;
    const apiError = responseData?.error as
      | { code?: number; message?: string }
      | undefined;

    if (apiError?.message) {
      message = `[${apiError.code ?? "UNKNOWN"}] ${apiError.message}`;
    } else {
      message = error.message;
    }
  } else {
    message = String(error);
  }

  console.error(`[${toolName}] Error: ${message}`);

  return {
    isError: true,
    content: [{ type: "text", text: `Error in ${toolName}: ${message}` }],
  };
}
