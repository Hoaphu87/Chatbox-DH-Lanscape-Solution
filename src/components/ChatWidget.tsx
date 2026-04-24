import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Phone, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getChatResponse } from '../services/gemini';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import BookingForm from './BookingForm';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  type?: 'text' | 'form' | 'success';
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(true);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: "Hi! I'm Assistant Darrell. How can I help with your yard today?" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const saveMessageToFirestore = async (role: 'user' | 'model', text: string) => {
    try {
      await addDoc(collection(db, 'sessions', sessionId, 'messages'), {
        role,
        text,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Error saving message:", e);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (text: string = inputValue) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);
    
    // Save user message
    saveMessageToFirestore('user', text);

    try {
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const response = await getChatResponse(text, history);
      
      const botMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: response || '' };
      setMessages(prev => [...prev, botMsg]);
      
      // Save bot response
      if (response) saveMessageToFirestore('model', response);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const startBooking = () => {
    const text = "I'd like to book a Free Landscape Consultation!";
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    
    saveMessageToFirestore('user', text);
    
    setTimeout(() => {
      const response = "Excellent! To get things moving, please share your address and a phone number. Darrell will contact you as soon as he receives your information to set a time.";
      const botMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: response,
        type: 'form'
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
      saveMessageToFirestore('model', response);
    }, 1000);
  };

  const handleBookingSuccess = () => {
    setMessages(prev => [
      ...prev,
      { 
        id: Date.now().toString(), 
        role: 'model', 
        text: "Thank you for your information! Darrell will contact you very soon to confirm your consultation. We're excited to help you transform your yard!",
        type: 'success'
      }
    ]);
  };

  return (
    <>
      
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="chat-window"
            initial={{ y: 100, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-[380px] h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 border border-stone-100"
          >
            {/* Header */}
            <div className="bg-[#2d5a27] p-4 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-xl">D</div>
                <div>
                  <h3 className="font-semibold text-sm">DH Landscape Assistant</h3>
                  <p className="text-[10px] opacity-80">Expert Garden Help</p>
                </div>
              </div>
              
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fdfaf6]">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div 
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-[#2d5a27] text-white rounded-br-none' 
                        : 'bg-white text-stone-800 border border-stone-200 shadow-sm rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  {msg.type === 'form' && (
                    <BookingForm onSuccess={handleBookingSuccess} />
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="text-[12px] text-stone-400 italic animate-pulse">
                  Assistant Darrell is typing...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Footer */}
            <div className="p-4 border-top border-stone-100 bg-white space-y-3 shrink-0">
              {!messages.some(m => m.type === 'form') && (
                <button
                  onClick={startBooking}
                  className="w-full bg-[#2d5a27] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#1e3d1a] transition-colors"
                >
                  Book Free Consultation
                </button>
              )}
              <div className="flex gap-2">
                <a 
                  href="tel:+17783863334" 
                  className="flex items-center gap-2 px-6 py-2 border-2 border-[#2d5a27] text-[#2d5a27] rounded-full text-xs font-bold hover:bg-[#ebf0ea] transition-colors"
                >
                  <Phone size={14} /> Call
                </a>
                <div className="flex-1 flex gap-1 items-center bg-stone-50 rounded-full px-3 border border-stone-200">
                  <input
                    type="text"
                    placeholder="Write a message..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    className="flex-1 bg-transparent border-none outline-none text-xs py-2"
                  />
                  <button 
                    onClick={() => handleSend()}
                    className="text-[#2d5a27] disabled:opacity-30"
                    disabled={!inputValue.trim() || isTyping}
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
