import { useCallback, useState } from "react";
import { askQuestion } from "../api/chatApi.js";

export function useChat() {
  const [messages, setMessages] = useState([]); // { role: "user"|"assistant", text, sources? }
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const send = useCallback(async (question) => {
    const userMessage = { role: "user", text: question };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const { answer, sources } = await askQuestion(question);
      setMessages((prev) => [...prev, { role: "assistant", text: answer, sources }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, send, clear };
}
