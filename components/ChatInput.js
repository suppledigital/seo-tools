import { useState } from "react";
import styles from './ChatInput.module.css';

export default function ChatInput({ onSendMessage, isLoading }) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() === "") return;
    onSendMessage(input);
    setInput(""); // Clear input after sending
  };

  return (
    <div className={styles.chatInput}>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message..."
        disabled={isLoading}
        className={styles.input}
      />
      <button onClick={handleSend} disabled={isLoading} className={styles.button}>
        {isLoading ? "Sending..." : "Send"}
      </button>
    </div>
  );
}
