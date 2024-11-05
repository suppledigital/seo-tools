import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ChatDisplay from "../../components/ChatDisplay";
import ChatInput from "../../components/ChatInput";
import ChatHistory from "../../components/ChatHistory";
import styles from './chat.module.css';

// Save chat data to localStorage
const saveChatToLocalStorage = (chatId, sessionId, messages) => {
  const chatData = { sessionId, messages, lastUpdated: new Date().getTime() };
  localStorage.setItem(`chat_${chatId}`, JSON.stringify(chatData));
};

// Retrieve chat data from localStorage
const getChatFromLocalStorage = (chatId) => {
  const chatData = JSON.parse(localStorage.getItem(`chat_${chatId}`));
  if (chatData) {
    const { sessionId, messages, lastUpdated } = chatData;
    const now = new Date().getTime();
    const daysElapsed = (now - lastUpdated) / (1000 * 60 * 60 * 24);
    if (daysElapsed <= 100) {
      return { sessionId, messages };
    }
    localStorage.removeItem(`chat_${chatId}`);
  }
  return { sessionId: null, messages: [] };
};

export default function ChatHome() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [chatWindows, setChatWindows] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedModel') || 'gpt-4';
    }
    return 'gpt-4';
  });
    const [socket, setSocket] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const savedWindows = Object.keys(localStorage)
      .filter(key => key.startsWith('chat_'))
      .map(key => key.replace('chat_', ''));
    setChatWindows(savedWindows);

    const chatIdFromUrl = router.query.chatId;
    if (chatIdFromUrl && savedWindows.includes(chatIdFromUrl)) {
      setCurrentChatId(chatIdFromUrl);
    }
  }, []);
  useEffect(() => {
    console.log("Selected model changed to:", selectedModel);
  }, [selectedModel]);
  useEffect(() => {
    if (selectedModel) {
      localStorage.setItem('selectedModel', selectedModel);
    }
  }, [selectedModel]);
  
  
  

  useEffect(() => {
    if (currentChatId) {
      const { sessionId: savedSessionId, messages: chatHistory } = getChatFromLocalStorage(currentChatId);
      setMessages(chatHistory);
      setSessionId(savedSessionId || Date.now()); // Set a sessionId if it doesn't exist

      // Update URL with current chat ID
      router.push(`/chat?chatId=${currentChatId}`, undefined, { shallow: true });
    }
  }, [currentChatId]);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_NODE_ENV === 'production'
      ? process.env.NEXT_PUBLIC_WS_URL
      : 'ws://localhost:8080';

    console.log('WebSocket URL:', wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log(data);
        if (data.sessionId && !sessionId) {
          setSessionId(data.sessionId);
        }
        if (data.end == true) {
          
          setIsLoading(false);
          return;
        }
        if (data.content) {
          setMessages((prevMessages) => {
            const newMessages = [...prevMessages];
            if (newMessages[newMessages.length - 1]?.role === "assistant") {
              newMessages[newMessages.length - 1].content += data.content;
            } else {
              newMessages.push({ role: "assistant", content: data.content, model: data.model });
            }
            saveChatToLocalStorage(currentChatId, sessionId, newMessages);
            return newMessages;
          });
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };

    ws.onclose = () => {
      setSocket(null);
    };

    return () => {
      ws.close();
    };
  }, []); // Empty dependency array

  const handleSendMessage = (message) => {
    if (!currentChatId) {
      const newChatId = `chat_${Date.now()}`;
      const newSessionId = Date.now();
      setChatWindows((prevWindows) => [newChatId, ...prevWindows]);
      setCurrentChatId(newChatId);
      setSessionId(newSessionId);
      localStorage.setItem(`chat_${newChatId}`, JSON.stringify({ sessionId: newSessionId, messages: [] }));
    }

    const newMessage = { role: "user", content: message };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    saveChatToLocalStorage(currentChatId, sessionId, updatedMessages);

    // Check if sessionId is set before sending
    if (sessionId && socket && socket.readyState === WebSocket.OPEN) {
      console.log("Sending message:", { message, model: selectedModel, sessionId });
      socket.send(JSON.stringify({ message, model: selectedModel, sessionId }));
      console.log("Sent message with sessionId:", sessionId); // Debugging log
    } else {
      console.error("WebSocket is not connected or sessionId is missing");
    }
  };

  const deleteChat = (chatId) => {
    localStorage.removeItem(`chat_${chatId}`);
    setChatWindows((prevWindows) => prevWindows.filter((id) => id !== chatId));

    if (currentChatId === chatId) {
      setCurrentChatId(null);
      setMessages([]);
      setSessionId(null);
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

  const userImage = session?.user?.image || 'default-image-url';

  return (
    <div className={styles.chatContainer}>
      <ChatHistory 
        history={chatWindows} 
        setHistory={setChatWindows} 
        deleteChat={deleteChat} 
        setCurrentChatId={(chatId) => {
          setCurrentChatId(chatId);
          router.push(`/chat?chatId=${chatId}`, undefined, { shallow: true });
        }}
        currentChatId={currentChatId}
      />
      
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
            <img src={userImage} alt="User" className={styles.userIconImg} />
            <div className={`${styles.dropdownMenu} ${showUserMenu ? styles.show : ''}`}>
              <span className={styles.userName}>{session?.user?.email}</span>
              <button onClick={() => signOut()}>Sign Out</button>
            </div>
          </div>
        </div>

        <ChatDisplay messages={messages} model={selectedModel} userImage={userImage} />
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
