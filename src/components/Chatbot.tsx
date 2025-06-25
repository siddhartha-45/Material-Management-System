import React, { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import axios from 'axios';

const GROQ_MODEL = 'llama-3.3-70b-versatile'; // ← Updated model

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      text: 'Hello! How can I help you with RINL steel plant operations today?',
      isBot: true,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = { text: inputValue, isBot: false };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: GROQ_MODEL,
          messages: [
            {
              role: 'system',
              content:
                'You are a helpful assistant for RINL steel plant operations.',
            },
            ...[...messages, userMessage].map((msg) => ({
              role: msg.isBot ? 'assistant' : 'user',
              content: msg.text,
            })),
          ],
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const botReply = response.data.choices?.[0]?.message?.content;
      if (botReply) {
        setMessages((prev) => [...prev, { text: botReply, isBot: true }]);
      } else {
        throw new Error('No reply from AI.');
      }
    } catch (error: any) {
      console.error('Groq API error:', error.response?.data || error.message);
      setMessages((prev) => [
        ...prev,
        {
          text:
            '⚠️ AI failed to respond. ' +
            (error.response?.data?.error?.message || error.message),
          isBot: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-2xl w-80 h-96 flex flex-col animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-slate-900 text-white p-4 rounded-t-lg flex justify-between items-center">
            <h3 className="font-semibold">RINL Assistant</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-300 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    msg.isBot
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-teal-600 text-white'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-sm text-gray-400 italic">Typing...</div>
            )}
          </div>

          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={loading}
                className="bg-teal-600 hover:bg-teal-700 text-white p-2 rounded-md"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
