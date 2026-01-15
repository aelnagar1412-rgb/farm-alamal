
import React, { useState, useRef, useEffect } from 'react';
import { getSimpleChatResponse } from '../services/geminiService';
import { ChatBubbleIcon, PaperAirplaneIcon, XIcon, SparklesIcon } from './Icons';

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

const AiAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async () => {
        if (input.trim() === '' || isLoading) return;

        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const aiResponse = await getSimpleChatResponse(input);
            const aiMessage: Message = { sender: 'ai', text: aiResponse };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage: Message = { sender: 'ai', text: "حدث خطأ ما، يرجى المحاولة مرة أخرى." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 left-6 bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-transform transform hover:scale-110"
                aria-label="افتح المساعد الذكي"
            >
                <ChatBubbleIcon className="w-8 h-8" />
            </button>

            {isOpen && (
                <div className="fixed bottom-24 left-6 w-96 h-[32rem] bg-white rounded-lg shadow-2xl flex flex-col z-50">
                    <header className="flex items-center justify-between p-4 bg-gray-800 text-white rounded-t-lg">
                        <div className="flex items-center space-x-2">
                           <SparklesIcon className="w-6 h-6 text-green-400" />
                           <h3 className="font-bold">المساعد الذكي</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white">
                           <XIcon className="w-6 h-6" />
                        </button>
                    </header>
                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                        <div className="space-y-4">
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs px-4 py-2 rounded-lg ${msg.sender === 'user' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                        <p className="text-sm">{msg.text}</p>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-200 text-gray-800 rounded-lg p-2">
                                        <span className="animate-pulse">...يفكر</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                    <footer className="p-4 border-t bg-white">
                        <div className="flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="اسأل عن أي شيء..."
                                className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                                disabled={isLoading}
                            />
                            <button onClick={handleSendMessage} disabled={isLoading} className="ms-3 p-3 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:bg-gray-400">
                                <PaperAirplaneIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    </footer>
                </div>
            )}
        </>
    );
};

export default AiAssistant;
