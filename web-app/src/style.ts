import { css } from "@linaria/core";

export const container = css`
  height: 100vh;

  .app-title {
    padding: 8px 16px;
  }

  .mcp-install {
    padding: 16px;
    border-top: 1px solid hsl(var(--border));
  }

  .mcp-install-input {
    width: 287px;
  }

  .app-content {
    flex: 1;
    padding: 16px;
    border-left: 1px solid hsl(var(--border));
  }

  .mcp-list-header {
    padding-bottom: 16px;
  }

  .mcp-list-container {
    padding: 16px;
    border: 1px solid hsl(var(--border));
    border-radius: 6px;
    background-color: hsl(var(--card));
    color: hsl(var(--card-foreground));
  }

  .mcp-list-item-name {
    margin-bottom: 4px;
  }

  .mcp-list-item-version {
    padding: 2px 8px;
    margin-left: 8px;
    font-size: 0.8rem;
    background-color: hsl(var(--chart-2));
    color: hsl(var(--primary-foreground));
    border-radius: 4px;
  }

  .mcp-list-item-info {
    font-size: 0.9rem;
    color: hsl(var(--muted-foreground));
    line-height: 1.4;
  }

  .mcp-list-item-commit {
    padding: 2px 4px;
    background-color: hsl(var(--chart-3));
    color: hsl(var(--primary-foreground));
    border-radius: 4px;
    font-size: 0.8rem;
  }
`;
