import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FaCopy, FaRobot } from 'react-icons/fa'; // Importing the robot icon
import styles from './ChatDisplay.module.css';

const ChatDisplay = ({ messages, userImage }) => {
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const renderMessage = (message, index) => {
    if (!message.content) return null; // Skip if content is empty or undefined
    
    if (message.role === 'assistant') {
      return (
        <div key={index} className={styles.assistantMessage}>
          <FaRobot className={styles.icon} /> 
          <div className={styles.messageContent}>
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
                        <button className={styles.copyButton}><FaCopy /> Copy</button>
                      </CopyToClipboard>
                    </div>
                  ) : (
                    <code className={styles.inlineCode} {...props}>{children}</code>
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
          </div>
          <div className={styles.modelInfo}>Model used: {message.model}</div>
        </div>
      );
    } else {
      return (
        <div key={index} className={styles.userMessage}>
          <img src={userImage} alt="User" className={styles.userIcon} />
          <div className={styles.messageContent}>{message.content}</div>
        </div>
      );
    }
  };
  

  return (
    <div className={styles.chatDisplay}>
      {messages.map((msg, index) => renderMessage(msg, index))}
      <div ref={chatEndRef}></div>
    </div>
  );
};

export default ChatDisplay;