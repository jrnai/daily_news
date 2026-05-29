import { useEffect, useRef, useState } from "react";
import { useChat } from "../hooks/useChat.js";

export function ChatPanel() {
  const { messages, isLoading, error, send, clear } = useChat();
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  function handleSubmit(e) {
    e.preventDefault();
    const q = input.trim();
    if (!q || isLoading) return;
    setInput("");
    send(q);
  }

  return (
    <div className={`chat-panel${open ? " chat-panel--open" : ""}`}>
      <button
        className="chat-toggle"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Toggle AI news assistant"
      >
        <span className="chat-toggle-icon">✦</span>
        <span>Ask the feed</span>
      </button>

      {open && (
        <div className="chat-window" role="dialog" aria-label="AI news assistant">
          <div className="chat-header">
            <span>Ask the feed — answers only from current articles</span>
            <button type="button" className="chat-clear" onClick={clear} title="Clear conversation">
              Clear
            </button>
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <p className="chat-empty">
                Ask anything about today's stories. The AI will only use what's in the current feed.
              </p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg chat-msg--${msg.role}`}>
                <p className="chat-msg-text">{msg.text}</p>
                {msg.sources?.length > 0 && (
                  <div className="chat-sources">
                    <span className="chat-sources-label">Sources used:</span>
                    <ul>
                      {msg.sources.map((s) => (
                        <li key={s.url}>
                          <a href={s.url} target="_blank" rel="noopener noreferrer">
                            {s.title}
                          </a>
                          <span className="chat-source-name"> — {s.source}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="chat-msg chat-msg--assistant chat-msg--loading">
                <span className="spinner" />
                <span>Thinking…</span>
              </div>
            )}
            {error && (
              <div className="chat-msg chat-msg--error">
                <p>{error}</p>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form className="chat-form" onSubmit={handleSubmit}>
            <input
              className="chat-input"
              type="text"
              placeholder="e.g. What's new in AI this week?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
            <button type="submit" className="chat-send" disabled={!input.trim() || isLoading}>
              Ask
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
