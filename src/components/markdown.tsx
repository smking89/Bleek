"use client";

import { Fragment, type ReactNode } from "react";
import type { User } from "@/lib/types";

const TOKEN =
  /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|__[^_\n]+__|~~[^~\n]+~~|`[^`\n]+`|https?:\/\/[^\s<]+|<@[a-zA-Z0-9_-]+>)/g;

function renderToken(token: string, users: User[], key: string): ReactNode {
  if (/^\*\*[^*]+\*\*$/.test(token)) return <strong key={key}>{token.slice(2, -2)}</strong>;
  if (/^__[^_]+__$/.test(token)) return <strong key={key}>{token.slice(2, -2)}</strong>;
  if (/^\*[^*]+\*$/.test(token)) return <em key={key}>{token.slice(1, -1)}</em>;
  if (/^~~[^~]+~~$/.test(token)) return <s key={key}>{token.slice(2, -2)}</s>;
  if (/^`[^`]+`$/.test(token)) return <code key={key}>{token.slice(1, -1)}</code>;

  if (token.startsWith("<@")) {
    const id = token.slice(2, -1);
    const user = users.find((u) => u.id === id);
    return (
      <span key={key} className="msg-mention">
        @{user ? user.name : "unknown"}
      </span>
    );
  }

  if (/^https?:\/\//.test(token)) {
    return (
      <a key={key} href={token} target="_blank" rel="noreferrer noopener">
        {token}
      </a>
    );
  }

  return <Fragment key={key}>{token}</Fragment>;
}

export function MessageContent({ content, users }: { content: string; users: User[] }) {
  const lines = content.split("\n");
  return (
    <div className="msg-content">
      {lines.map((line, lineIndex) => (
        <Fragment key={lineIndex}>
          {line
            .split(TOKEN)
            .filter((part) => part !== "")
            .map((part, partIndex) => renderToken(part, users, `${lineIndex}-${partIndex}`))}
          {lineIndex < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </div>
  );
}
