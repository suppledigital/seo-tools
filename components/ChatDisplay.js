import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FaCopy } from 'react-icons/fa';
import styles from './ChatDisplay.module.css';

const ChatDisplay = ({ messages }) => {
  const chatEndRef = useRef(null);

  // Scroll to bottom smoothly when messages update
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const renderMessage = (message, index) => {
    if (message.role === 'assistant') {
      return (
        <div key={index} className={styles.assistantMessage}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const language = className ? className.replace('language-', '') : '';

                return !inline ? (
                  <div className={styles.codeBlock}>
                    <pre>
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                    <CopyToClipboard text={String(children)}>
                      <button className={styles.copyButton}>
                        <FaCopy /> Copy
                      </button>
                    </CopyToClipboard>
                  </div>
                ) : (
                  <code className={styles.inlineCode} {...props}>
                    {children}
                  </code>
                );
              },
              blockquote({ children }) {
                return <blockquote className={styles.blockquote}>{children}</blockquote>;
              },
              img({ src, alt }) {
                return <img src={src} alt={alt} className={styles.image} />;
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
          {/* Display model used below assistant message */}
          <div className={styles.modelInfo}>Model used: {message.model}</div>
        </div>
      );
    } else {
      return (
        <div key={index} className={styles.userMessage}>
          {message.content}
        </div>
      );
    }
  };

  return (
    <div className={styles.chatDisplay}>
      {messages.map((msg, index) => renderMessage(msg, index))}
      <div ref={chatEndRef}></div> {/* Scroll target */}
    </div>
  );
};

export default ChatDisplay;
