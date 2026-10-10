import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { socket } from '../../lib/socket';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Send, MessageSquare, ArrowLeft } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function LiveChat() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // Admin chats with 'volunteer', Volunteer chats with 'admin'
  const targetRole = user?.role === 'volunteer' ? 'admin' : 'volunteer';
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  useEffect(() => {
    const handleIncomingMessage = (payload) => {
      setMessages(prev => [...prev, { ...payload, isMine: false }]);
    };

    socket.on('chat:message', handleIncomingMessage);
    return () => socket.off('chat:message', handleIncomingMessage);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !user.zoneId) return;

    const payload = {
      zoneId: user.zoneId,
      toRole: targetRole,
      message: input,
      senderName: user.name
    };

    socket.emit('chat:message', payload);
    setMessages(prev => [...prev, { ...payload, isMine: true, timestamp: new Date() }]);
    setInput('');
  };

  if (!user?.zoneId) {
    return (
      <div className="flex justify-center items-center h-[50vh] text-text-muted">
        <p>You must be assigned to a zone to use Live Chat.</p>
      </div>
    );
  }

  return (
    <div className={cn("max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col")}>
      <div className="flex items-center gap-4 border-b border-border-color pb-4 mb-4 shrink-0">
        <Link to={isAdmin ? '/admin' : '/volunteer'}>
          <Button variant="ghost" size="icon" className="shrink-0 text-text-muted hover:text-text-primary">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className={cn("p-3 rounded-full", isAdmin ? "bg-accent-primary/20 text-accent-primary" : "bg-accent-gold/20 text-accent-gold")}>
          <MessageSquare className="w-6 h-6" />
        </div>
        <div>
          <h1 className={cn("text-2xl font-bold tracking-tight", isAdmin ? "" : "text-brand-maroon")}>
            Zone Communications
          </h1>
          <p className="text-sm text-text-muted mt-1 font-mono uppercase">
            SECURE CHANNEL &bull; {targetRole}
          </p>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden bg-bg-panel border-border-color">
        <CardContent className="flex-1 flex flex-col p-0 h-full">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-bg-base/30">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-50 space-y-2">
                <MessageSquare className="w-12 h-12 mb-2" />
                <p className="font-mono uppercase text-sm">Empty Comms Buffer</p>
                <p className="text-xs">Send a message to ping the {targetRole}.</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={cn("flex flex-col max-w-[75%]", msg.isMine ? "ml-auto items-end" : "mr-auto items-start")}
                >
                  <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider mb-1 px-1">
                    {msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className={cn(
                    "px-4 py-2 rounded-2xl text-sm",
                    msg.isMine 
                      ? isAdmin ? "bg-accent-primary text-black font-medium" : "bg-brand-maroon text-white font-medium"
                      : "bg-bg-panel border border-border-color text-text-primary"
                  )}>
                    {msg.message}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-bg-panel border-t border-border-color shrink-0">
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Message ${targetRole} channel...`}
                className="flex-1 bg-bg-base border border-border-color rounded-full px-4 py-2 outline-none focus:border-accent-primary transition-colors text-text-primary"
              />
              <Button 
                type="submit" 
                disabled={!input.trim()}
                className={cn("rounded-full px-6", isAdmin ? "bg-accent-primary text-black hover:bg-cyan-600" : "bg-brand-maroon text-white hover:bg-red-900")}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
