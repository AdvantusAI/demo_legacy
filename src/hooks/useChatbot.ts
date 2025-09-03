
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
  id: string;
  message_type: 'user' | 'assistant';
  content: string;
  metadata?: any;
  created_at: string;
}

interface Conversation {
  id: string;
  conversation_title: string;
  created_at: string;
  context_filters: any;
}

export function useChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation);
    }
  }, [currentConversation]);

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('chatbot_conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!error && data) {
        setConversations(data);
        if (data.length > 0 && !currentConversation) {
          setCurrentConversation(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('chatbot_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data.map(msg => ({
          ...msg,
          message_type: msg.message_type as 'user' | 'assistant'
        })));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const createNewConversation = async (title: string = 'Nueva Conversación') => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('chatbot_conversations')
        .insert({
          user_id: user.id,
          conversation_title: title,
          context_filters: {}
        })
        .select()
        .single();

      if (!error && data) {
        setConversations(prev => [data, ...prev]);
        setCurrentConversation(data.id);
        setMessages([]);
        return data.id;
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
    return null;
  };

  const sendMessage = async (content: string, contextFilters?: any) => {
    if (!currentConversation || !user) {
      // Create new conversation if none exists
      const newConvId = await createNewConversation();
      if (!newConvId) return;
    }

    setLoading(true);
    try {
      // Add user message
      const { data: userMessage, error: userError } = await supabase
        .from('chatbot_messages')
        .insert({
          conversation_id: currentConversation,
          message_type: 'user',
          content,
          metadata: { context_filters: contextFilters }
        })
        .select()
        .single();

      if (userError) throw userError;

      // Add user message to state immediately
      setMessages(prev => [...prev, {
        ...userMessage,
        message_type: userMessage.message_type as 'user' | 'assistant'
      }]);

      // Generate AI response
      const aiResponse = await generateAIResponse(content, contextFilters);

      // Add AI message
      const { data: aiMessage, error: aiError } = await supabase
        .from('chatbot_messages')
        .insert({
          conversation_id: currentConversation,
          message_type: 'assistant',
          content: aiResponse.content,
          metadata: aiResponse.metadata
        })
        .select()
        .single();

      if (aiError) throw aiError;

      // Add AI message to state
      setMessages(prev => [...prev, {
        ...aiMessage,
        message_type: aiMessage.message_type as 'user' | 'assistant'
      }]);

    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAIResponse = async (userMessage: string, contextFilters?: any) => {
    // Simple local AI logic for demo purposes
    const message = userMessage.toLowerCase();
    
    if (message.includes('recomendación') || message.includes('recomienda')) {
      return {
        content: `Basándome en tus datos actuales${contextFilters?.productId ? ` para el producto ${contextFilters.productId}` : ''}, te recomiendo:

1. **Revisar precisión del pronóstico**: Si está por debajo del 80%, considera ajustar los parámetros del modelo.

2. **Monitorear volatilidad**: Alta variabilidad requiere mayor stock de seguridad.

3. **Análizar tendencias**: ${contextFilters?.trend === 'increasing' ? 'La tendencia creciente sugiere incrementar pronósticos futuros.' : 'Mantén un seguimiento cercano de los cambios de demanda.'}

¿Te gustaría que analice algún producto específico o genere un escenario what-if?`,
        metadata: { type: 'recommendation', context: contextFilters }
      };
    }

    if (message.includes('analisis') || message.includes('análisis')) {
      return {
        content: `Realizando análisis de tus datos de pronóstico...

**Métricas clave encontradas:**
- Precisión promedio: 78%
- Productos con alta volatilidad: 12
- Tendencia general: Estable con ligero crecimiento

**Áreas de oportunidad:**
1. Mejorar precisión en productos de alta rotación
2. Ajustar stock de seguridad para productos volátiles
3. Implementar promociones para productos de baja rotación

¿Quieres que profundice en algún aspecto específico?`,
        metadata: { type: 'analysis', metrics: { accuracy: 78, volatile_products: 12 } }
      };
    }

    if (message.includes('escenario') || message.includes('what-if')) {
      return {
        content: `Te puedo ayudar a crear escenarios what-if para:

📈 **Ajustes de pronóstico**: Incrementar/decrementar demanda
🎯 **Impacto promocional**: Simular efecto de promociones
📦 **Disrupciones de suministro**: Evaluar riesgos de desabasto
🔄 **Cambios estacionales**: Modelar variaciones por temporada

Para crear un escenario, ve a la pestaña "IA Asistente" y usa el Constructor de Escenarios, o dime qué tipo de escenario te interesa analizar.`,
        metadata: { type: 'scenario_help' }
      };
    }

    // Default response
    return {
      content: `¡Hola! Soy tu asistente de pronósticos inteligente. Puedo ayudarte con:

🎯 **Análisis de datos**: Revisar precisión, tendencias y outliers
📊 **Recomendaciones**: Sugerir mejoras basadas en tus datos
🔮 **Escenarios What-If**: Simular diferentes situaciones
📈 **Optimización**: Identificar oportunidades de mejora

¿En qué puedo ayudarte hoy? Puedes preguntarme sobre análisis, recomendaciones, o escenarios específicos.`,
      metadata: { type: 'greeting' }
    };
  };

  return {
    messages,
    conversations,
    currentConversation,
    loading,
    sendMessage,
    createNewConversation,
    setCurrentConversation,
    loadConversations
  };
}
