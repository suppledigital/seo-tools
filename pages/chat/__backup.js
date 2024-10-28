import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import ChatDisplay from "../../components/ChatDisplay";
import ChatInput from "../../components/ChatInput";
import ChatHistory from "../../components/ChatHistory";
import styles from './chat.module.css';

// Helper function to save chat data to localStorage
const saveChatToLocalStorage = (chatId, messages) => {
  const chatData = { messages, lastUpdated: new Date().getTime() };
  localStorage.setItem(`chat_${chatId}`, JSON.stringify(chatData));
};

// Helper function to retrieve chat data from localStorage
const getChatFromLocalStorage = (chatId) => {
  const chatData = JSON.parse(localStorage.getItem(`chat_${chatId}`));
  if (chatData) {
    const { messages, lastUpdated } = chatData;
    const now = new Date().getTime();
    const daysElapsed = (now - lastUpdated) / (1000 * 60 * 60 * 24);
    if (daysElapsed <= 100) {
      return messages;
    }
    localStorage.removeItem(`chat_${chatId}`); // Remove if older than 100 days
  }
  return [];
};

export default function ChatHome() {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState([]);
  const [chatWindows, setChatWindows] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4o'); // Default to GPT

   // Dropdown toggling logic
   const [showUserMenu, setShowUserMenu] = useState(false);
   const [showModelMenu, setShowModelMenu] = useState(false);


  // Load all saved chat windows from localStorage
  useEffect(() => {
    const savedWindows = Object.keys(localStorage)
      .filter(key => key.startsWith('chat_'))
      .map(key => key.replace('chat_', ''));
    setChatWindows(savedWindows);
  }, []);

  // Load chat history when switching chat windows
  useEffect(() => {
    if (currentChatId) {
      const chatHistory = getChatFromLocalStorage(currentChatId);
      setMessages(chatHistory);
    }
  }, [currentChatId]);

  const handleSendMessage = async (message) => {
    // Create a new chat window if none exists
    if (!currentChatId) {
      const newChatId = `chat_${Date.now()}`;
      setChatWindows((prevWindows) => [newChatId, ...prevWindows]); // Add new chat to the top
      setCurrentChatId(newChatId);
      localStorage.setItem(`chat_${newChatId}`, JSON.stringify({ messages: [] }));
    }
  
    const newMessage = { role: "user", content: message };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
  
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: updatedMessages, model: selectedModel }), // Send selected model to API
    });
  
    const { sessionId } = await response.json();
    const eventSource = new EventSource(`/api/chat/stream?sessionId=${sessionId}&model=${selectedModel}`);
  
    let assistantMessageContent = "";
    let model = selectedModel; // Capture model at message time
  
    eventSource.onmessage = function (event) {
      if (event.data === "[DONE]") {
        eventSource.close();
        setMessages((prevMessages) => [
          ...prevMessages.slice(0, -1),
          { role: "assistant", content: assistantMessageContent, model },
        ]);
        saveChatToLocalStorage(currentChatId, [
          ...updatedMessages,
          { role: "assistant", content: assistantMessageContent, model },
        ]);
        setIsLoading(false);
        return;
      }
  
      const { content } = JSON.parse(event.data);
      if (content) {
        assistantMessageContent += content;
  
        setMessages((prevMessages) => {
          const newMessages = [...prevMessages];
          if (newMessages[newMessages.length - 1]?.role === "assistant") {
            newMessages[newMessages.length - 1].content = assistantMessageContent;
          } else {
            newMessages.push({ role: "assistant", content: assistantMessageContent });
          }
          return newMessages;
        });
      }
    };
  
    eventSource.onerror = function () {
      eventSource.close();
      setIsLoading(false);
    };
  };
  


  // Function to delete a chat window
  const deleteChat = (chatId) => {
    localStorage.removeItem(`chat_${chatId}`);
    setChatWindows((prevWindows) => prevWindows.filter((id) => id !== chatId));

    // Clear the current chat if the deleted one was active
    if (currentChatId === chatId) {
      setCurrentChatId(null);
      setMessages([]);
    }
  };

  if (status === 'loading') return <p>Loading...</p>;

  if (status === 'unauthenticated') {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Please Sign In</h1>
        <button className={styles.button} onClick={() => signIn('google')}>Sign in with Google</button>
      </div>
    );
  }
  const userImage = session?.user?.image || 'default-image-url'; // Fallback in case image is unavailable
  console.log(userImage);


  return (
    <div className={styles.chatContainer}>
      <ChatHistory history={chatWindows} setHistory={setChatWindows} deleteChat={deleteChat} setCurrentChatId={setCurrentChatId} />
      
      <div className={styles.mainChat}>
        <div className={styles.header}>
          <select
            className={styles.modelDropdown}
            onChange={(e) => setSelectedModel(e.target.value)}
            value={selectedModel}
          >
            <option value="gpt-4o">GPT (Default)</option>
            <option value="o1-preview">GPT-o1-preview</option>
            <option value="o1-mini">GPT-o1-mini</option>
            <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Good for content)</option>
            <option value="claude-3-opus-20240229">Claude 3 Opus (Latest)</option>
          </select>

          <div className={styles.userIcon} onClick={() => setShowUserMenu(!showUserMenu)}>
            <img src={userImage} alt="User" className={styles.userIconImg} /> {/* User image */} 
            <div className={`${styles.dropdownMenu} ${showUserMenu ? styles.show : ''}`}>
              <span className={styles.userName}>{session?.user?.email}</span>
              <button onClick={() => signOut()}>Sign Out</button>
            </div>
          </div>
        </div>

        {/* Pass the model as a prop to ChatDisplay */}
        <ChatDisplay messages={messages} model={selectedModel} userImage={userImage} />
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}