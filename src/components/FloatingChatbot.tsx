
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, X, Send, Loader2, Bot, User } from 'lucide-react';
import { useChatbot } from '@/hooks/useChatbot';
import { cn } from '@/lib/utils';

interface FloatingChatbotProps {
  contextFilters?: {
    productId?: string;
    locationId?: string;
    customerId?: string;
  };
}

export function FloatingChatbot({ contextFilters }: FloatingChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    messages, 
    loading, 
    sendMessage, 
    createNewConversation 
  } = useChatbot();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const message = inputMessage.trim();
    setInputMessage('');
    await sendMessage(message, contextFilters);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="w-96 h-[500px] shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-sm">Asistente IA de Pronósticos</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {contextFilters && (contextFilters.productId || contextFilters.locationId) && (
            <div className="text-xs text-muted-foreground">
              Contexto: {contextFilters.productId} {contextFilters.locationId && `- ${contextFilters.locationId}`}
            </div>
          )}
        </CardHeader>
        
        <CardContent className="flex flex-col h-[400px] p-0">
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-4 py-4">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <div className="text-center">
                    <Bot className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm">¡Hola! ¿En qué puedo ayudarte?</p>
                  </div>
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.message_type === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.message_type === 'assistant' && (
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg p-3 text-sm",
                      message.message_type === 'user'
                        ? "bg-blue-600 text-white ml-auto"
                        : "bg-gray-100 text-gray-900"
                    )}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    <div className={cn(
                      "text-xs mt-1 opacity-70",
                      message.message_type === 'user' ? "text-blue-100" : "text-gray-500"
                    )}>
                      {formatTime(message.created_at)}
                    </div>
                  </div>
                  
                  {message.message_type === 'user' && (
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              
              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje..."
                disabled={loading}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || loading}
                size="sm"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <div className="flex gap-1 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendMessage('dame recomendaciones', contextFilters)}
                disabled={loading}
                className="text-xs h-7"
              >
                Recomendaciones
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendMessage('analiza mis datos', contextFilters)}
                disabled={loading}
                className="text-xs h-7"
              >
                Análisis
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendMessage('crear escenario', contextFilters)}
                disabled={loading}
                className="text-xs h-7"
              >
                Escenarios
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
