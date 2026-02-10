import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceChatProps {
  onTranscript: (text: string) => Promise<void>;
  isLoading: boolean;
  isAISpeaking: boolean;
}

declare global {
  interface Window {
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export const VoiceChat = ({ onTranscript, isLoading, isAISpeaking }: VoiceChatProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [isFinal, setIsFinal] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check browser support for Web Speech API
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      setRecognitionSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'fr-FR'; // French by default
    recognition.maxAlternatives = 1;
    recognition.serviceURI = ''; // Use default speech recognition service

    recognition.onstart = () => {
      setIsRecording(true);
      setTranscript('');
      setIsFinal(false);
    };

    recognition.onresult = (event) => {
      let interim = '';
      let finalTranscript = '';
      let hasUnstable = false;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;
        
        if (event.results[i].isFinal) {
          // Final results with high confidence
          if (confidence > 0.5) {
            finalTranscript += text + ' ';
            setIsFinal(true);
          }
        } else {
          // Interim results
          interim += text;
          hasUnstable = true;
        }
      }

      // Prioritize final transcripts, fallback to interim
      const bestTranscript = finalTranscript.trim() || interim.trim();
      if (bestTranscript) {
        setTranscript(bestTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        toast.error('Aucune parole détectée. Veuillez parler plus fort.');
      } else if (event.error === 'audio-capture') {
        toast.error('Microphone non détecté. Vérifiez les permissions.');
      } else if (event.error === 'network') {
        toast.error('Erreur réseau. Vérifiez votre connexion.');
      } else {
        toast.error(`Erreur micro: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const startRecording = () => {
    if (!recognitionRef.current) {
      toast.error('Reconnaissance vocale non supportée');
      return;
    }
    
    recognitionRef.current.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleSend = async () => {
    if (!transcript.trim()) {
      toast.error('Veuillez enregistrer un message');
      return;
    }

    try {
      await onTranscript(transcript);
      setTranscript('');
    } catch (error) {
      console.error('Error sending transcript:', error);
      toast.error('Erreur lors de l\'envoi');
    }
  };

  if (!recognitionSupported) {
    return (
      <div className="text-xs text-muted-foreground">
        Reconnaissance vocale non disponible
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 w-full">
      {/* Recording indicator */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="w-2 h-2 bg-red-500 rounded-full"
            />
            <span className="text-xs text-red-500 font-medium">En écoute</span>
          </motion.div>
        )}

        {isAISpeaking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1"
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.4, repeat: Infinity }}
              className="w-2 h-2 bg-blue-500 rounded-full"
            />
            <span className="text-xs text-blue-500 font-medium">L'IA parle</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transcript display */}
      {transcript && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 text-xs bg-primary/10 rounded px-2 py-1 text-primary max-w-[200px] truncate"
        >
          {transcript}
        </motion.div>
      )}

      {/* Voice controls */}
      <div className="flex gap-1">
        {!isRecording ? (
          <Button
            size="sm"
            variant="outline"
            onClick={startRecording}
            disabled={isLoading}
            title="Appuyer pour parler"
            className="h-8 w-8 p-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="destructive"
            onClick={stopRecording}
            title="Arrêter l'enregistrement"
            className="h-8 w-8 p-0"
          >
            <MicOff className="w-4 h-4" />
          </Button>
        )}

        {transcript && (
          <Button
            size="sm"
            onClick={handleSend}
            disabled={isLoading}
            title="Envoyer le message"
            className="h-8 w-8 p-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

// Helper to play audio response
export const playAudioResponse = async (text: string, characterName?: string) => {
  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voice: mapCharacterToVoice(characterName),
      }),
    });

    if (!response.ok) {
      throw new Error(`TTS error: ${response.statusText}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    return new Promise((resolve) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve(null);
      };
      audio.play().catch((err) => {
        console.error('Error playing audio:', err);
        resolve(null);
      });
    });
  } catch (error) {
    console.error('Error generating audio:', error);
    toast.error('Erreur audio');
    return null;
  }
};

// Map character names to TTS voices
function mapCharacterToVoice(characterName?: string): string {
  const voiceMap: Record<string, string> = {
    einstein: 'male_deep',
    ada: 'female_young',
    socrates: 'male_philosopher',
    sherlock: 'male_british',
    marie: 'female_confident',
    leonardo: 'male_creative',
  };

  if (!characterName) return 'male_default';
  const normalized = characterName.toLowerCase();
  return voiceMap[normalized] || 'male_default';
}
