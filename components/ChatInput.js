import { useState } from "react";
import styles from './ChatInput.module.css';

export default function ChatInput({ onSendMessage, isLoading }) {
  const [input, setInput] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  return (
    <div className={styles.chatInputContainer}>
      <textarea
        className={styles.chatInput}
        type="text"
        value={input}
        onKeyDown={handleKeyDown}
        rows={1}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message..."
        disabled={isLoading}
        style={{
          overflowY: input.split("\n").length > 5 ? 'scroll' : 'hidden',
          maxHeight: '200px', // Set a max height for 5 lines
        }}
      />
      <button onClick={handleSend} disabled={isLoading} className={styles.button}>
        {isLoading ? "Sending..." : "Send"}
      </button>
    </div>
  );
}
