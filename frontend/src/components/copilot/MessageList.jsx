import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import ErrorState from './ErrorState';

export default function MessageList({
  messages,
  isLoading,
  error,
  onRetry,
  onConfirmAction,
  onCancelAction,
  isProcessingAction,
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, error]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
      {messages.map((msg, idx) => (
        <MessageBubble
          key={idx}
          message={msg}
          onConfirmAction={onConfirmAction}
          onCancelAction={onCancelAction}
          isProcessingAction={isProcessingAction}
        />
      ))}

      {isLoading && <TypingIndicator />}

      {error && <ErrorState error={error} onRetry={onRetry} />}

      <div ref={bottomRef} className="h-1" />
    </div>
  );
}
