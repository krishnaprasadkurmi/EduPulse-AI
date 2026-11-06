import React from 'react';
import { Bot, User, CheckCircle2 } from 'lucide-react';
import ToolActionPreview from './ToolActionPreview';
import ConfirmationCard from './ConfirmationCard';

export default function MessageBubble({
  message,
  onConfirmAction,
  onCancelAction,
  isProcessingAction,
}) {
  const isUser = message.sender === 'user';

  // Format assistant text with basic markdown formatting
  const renderFormattedContent = (content) => {
    if (!content) return null;

    const lines = content.split('\n');

    return (
      <div className="space-y-1 text-xs leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }

          // Format bold **text**
          const parts = line.split(/(\*\*.*?\*\*)/g);
          const formattedLine = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-bold text-slate-900 dark:text-white">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            if (part.startsWith('*') && part.endsWith('*')) {
              return (
                <em key={pIdx} className="italic text-slate-600 dark:text-slate-300">
                  {part.slice(1, -1)}
                </em>
              );
            }
            return part;
          });

          // Bullet points
          if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1">
                <span className="text-indigo-500 font-bold shrink-0">•</span>
                <span>{formattedLine}</span>
              </div>
            );
          }

          return <div key={idx}>{formattedLine}</div>;
        })}
      </div>
    );
  };

  if (isUser) {
    return (
      <div className="flex justify-end my-2.5 animate-in fade-in slide-in-from-bottom-2">
        <div className="max-w-[85%] bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-3 rounded-2xl rounded-tr-sm shadow-sm text-xs leading-relaxed">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5 my-2.5 animate-in fade-in slide-in-from-bottom-2">
      <div className="w-8 h-8 rounded-full ring-2 ring-indigo-500/30 overflow-hidden shrink-0 shadow-sm mt-0.5 bg-slate-800">
        <img src="/copilot-robot.jpg" alt="EduPulse AI" className="w-full h-full object-cover" />
      </div>

      <div className="max-w-[88%] space-y-1.5">
        <div className="p-3.5 rounded-2xl rounded-tl-sm bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm text-slate-800 dark:text-slate-200">
          {message.tool && <ToolActionPreview toolName={message.tool} />}

          {renderFormattedContent(message.text)}

          {/* Interactive Confirmation Card if write action */}
          {message.requiresConfirmation && message.action && (
            <ConfirmationCard
              action={message.action}
              onConfirm={() => onConfirmAction(message.action.actionId)}
              onCancel={() => onCancelAction(message.action.actionId)}
              isProcessing={isProcessingAction}
            />
          )}
        </div>

        <div className="text-[10px] text-slate-400 dark:text-slate-500 pl-1 flex items-center gap-1">
          <span>EduPulse Academic Engine</span>
          <span>•</span>
          <span className="font-mono text-[9px]">{message.timestamp || 'Just now'}</span>
        </div>
      </div>
    </div>
  );
}
