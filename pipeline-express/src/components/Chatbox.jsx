import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Minimize2, Maximize2, Sparkles } from 'lucide-react';
import { TIMING } from '../constants/appConstants';
import './Chatbox.css';

const Chatbox = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hello! I\'m your AI assistant. I can help you build workflows, configure modules, and debug pipelines.', sender: 'system' }
  ]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    const userMsg = { id: Date.now(), text: message, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setMessage('');
    
    // Simulate response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: "I've received your request. As a prototype, I can't execute actions yet, but I'm ready to be connected to the backend!",
        sender: 'system'
      }]);
    }, TIMING.AI_RESPONSE_DELAY);
  };

  return (
    <div className={`chatbox-container ${isOpen ? 'open' : 'closed'}`}>
      <div className="chatbox-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="chatbox-title">
          <div className="chatbox-icon-wrapper">
            <Sparkles size={14} />
          </div>
          <span>AI Assistant</span>
        </div>
        <button className="chatbox-toggle" onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}>
          {isOpen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>
      
      {isOpen && (
        <div className="chatbox-content">
          <div className="chatbox-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`chatbox-message ${msg.sender}`}>
                {msg.sender === 'system' && (
                  <div className="message-avatar">
                    <Sparkles size={12} />
                  </div>
                )}
                <div className="message-text">{msg.text}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form className="chatbox-input-area" onSubmit={handleSend}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask AI to help build..."
              className="chatbox-input"
            />
            <button type="submit" className="chatbox-send-button" disabled={!message.trim()}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbox;
