-- Create conversations table for user-to-user messaging
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1_id UUID NOT NULL,
  participant_2_id UUID NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_conversation UNIQUE (participant_1_id, participant_2_id)
);

-- Create conversation_messages table
CREATE TABLE public.conversation_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- Policies for conversations
CREATE POLICY "Users can view their own conversations"
ON public.conversations
FOR SELECT
USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

CREATE POLICY "Users can create conversations"
ON public.conversations
FOR INSERT
WITH CHECK (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

CREATE POLICY "Users can update their conversations"
ON public.conversations
FOR UPDATE
USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

-- Policies for conversation_messages
CREATE POLICY "Users can view messages in their conversations"
ON public.conversation_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = conversation_messages.conversation_id
    AND (conversations.participant_1_id = auth.uid() OR conversations.participant_2_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages in their conversations"
ON public.conversation_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = conversation_messages.conversation_id
    AND (conversations.participant_1_id = auth.uid() OR conversations.participant_2_id = auth.uid())
  )
);

CREATE POLICY "Users can update messages they received"
ON public.conversation_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = conversation_messages.conversation_id
    AND (conversations.participant_1_id = auth.uid() OR conversations.participant_2_id = auth.uid())
  )
);

-- Enable realtime for conversation_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_messages;

-- Add indexes for better performance
CREATE INDEX idx_conversations_participant_1 ON public.conversations(participant_1_id);
CREATE INDEX idx_conversations_participant_2 ON public.conversations(participant_2_id);
CREATE INDEX idx_conversation_messages_conversation ON public.conversation_messages(conversation_id);
CREATE INDEX idx_conversation_messages_sender ON public.conversation_messages(sender_id);

-- Function to update last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update last_message_at
CREATE TRIGGER update_conversation_last_message_trigger
AFTER INSERT ON public.conversation_messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_last_message();