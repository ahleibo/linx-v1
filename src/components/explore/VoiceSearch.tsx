
import React, { useState, useEffect } from 'react';
import { Mic, MicOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface VoiceSearchProps {
  onResult: (transcript: string) => void;
  onClose: () => void;
}

export const VoiceSearch: React.FC<VoiceSearchProps> = ({ onResult, onClose }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if speech recognition is supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognitionConstructor();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onstart = () => {
        setIsListening(true);
      };

      recognitionInstance.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcriptResult = event.results[current][0].transcript;
        setTranscript(transcriptResult);
        
        if (event.results[current].isFinal) {
          onResult(transcriptResult);
        }
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  const startListening = () => {
    if (recognition) {
      setTranscript('');
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
    }
  };

  const handleSubmit = () => {
    if (transcript.trim()) {
      onResult(transcript);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-700 p-6 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Voice Search</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Voice Visualization */}
        <div className="flex flex-col items-center space-y-6">
          {/* Microphone Button */}
          <Button
            onClick={isListening ? stopListening : startListening}
            className={`
              w-20 h-20 rounded-full transition-all duration-300
              ${isListening 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-blue-500 hover:bg-blue-600'
              }
            `}
          >
            {isListening ? (
              <MicOff className="h-8 w-8" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </Button>

          {/* Status Text */}
          <div className="text-center">
            <p className="text-white font-medium">
              {isListening ? 'Listening...' : 'Tap to speak'}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {isListening ? 'Say your search query' : 'Voice search powered by AI'}
            </p>
          </div>

          {/* Transcript */}
          {transcript && (
            <div className="w-full p-4 bg-slate-800 rounded-lg border border-slate-700">
              <p className="text-white text-center">{transcript}</p>
            </div>
          )}

          {/* Action Buttons */}
          {transcript && (
            <div className="flex space-x-3 w-full">
              <Button
                variant="outline"
                onClick={() => setTranscript('')}
                className="flex-1 border-slate-600 text-slate-300 hover:text-white"
              >
                Clear
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
              >
                Search
              </Button>
            </div>
          )}

          {/* Browser Support Warning */}
          {!recognition && (
            <div className="w-full p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-amber-400 text-sm text-center">
                Voice search is not supported in this browser
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
