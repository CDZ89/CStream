import React, { useState, useEffect } from 'react';
import { Play, Square, RefreshCcw, Shield, Bot, Send, MessageSquare } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function BotAdmin() {
  const [status, setStatus] = useState('online');
  const [loading, setLoading] = useState(false);
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const toggleBot = async (action: 'start' | 'stop' | 'restart') => {
    setLoading(true);
    try {
      const response = await fetch('/api/bot/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await response.json();
      if (data.success) {
        setStatus(action === 'stop' ? 'offline' : 'online');
      }
    } catch (error) {
      console.error('Error managing bot:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBotData = async () => {
    try {
      const response = await fetch('/api/admin/bot/channels');
      if (response.ok) {
        const data = await response.json();
        setChannels(data.channels || []);
      }
    } catch (e) {
      console.error('Error loading bot data:', e);
    }
  };

  const sendMessage = async () => {
    if (!selectedChannel || !message) return;
    setSending(true);
    try {
      const response = await fetch('/api/admin/bot/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: selectedChannel,
          message: message
        })
      });
      if (response.ok) {
        setMessage('');
        alert('Message envoyé !');
      } else {
        alert('Erreur lors de l\'envoi');
      }
    } catch (e) {
      console.error('Error sending message:', e);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/bot/status');
        const data = await response.json();
        setStatus(data.status);
      } catch (e) {
        setStatus('offline');
      }
    };
    checkStatus();
    loadBotData();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 bg-[#0f0f0f] min-h-screen text-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Bot className="w-8 h-8 text-[#E50914]" />
          <h1 className="text-3xl font-bold italic tracking-tighter">BOT CONTROL PANEL</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/5 shadow-2xl">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              État du Système
            </h2>
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-3 h-3 rounded-full ${status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-lg font-medium uppercase tracking-widest">
                {status === 'online' ? 'En Ligne' : 'Hors Ligne'}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => toggleBot('start')} 
                disabled={loading || status === 'online'}
                className="bg-green-600 hover:bg-green-700 text-white flex gap-2"
              >
                <Play size={18} /> Démarrer
              </Button>
              <Button 
                onClick={() => toggleBot('stop')} 
                disabled={loading || status === 'offline'}
                className="bg-red-600 hover:bg-red-700 text-white flex gap-2"
              >
                <Square size={18} /> Arrêter
              </Button>
              <Button 
                onClick={() => toggleBot('start')} 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white flex gap-2"
              >
                <RefreshCcw size={18} /> Redémarrer
              </Button>
            </div>
          </div>

          <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/5 shadow-2xl">
            <h2 className="text-xl font-semibold mb-4">Infos Bot</h2>
            <div className="space-y-3 text-gray-400">
              <p>ID: <span className="text-white font-mono">CStream-Premium-v1</span></p>
              <p>Version: <span className="text-white font-mono">3.9.5</span></p>
              <p>Serveur: <span className="text-white font-mono">cstream-1--outrra22.replit.app</span></p>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/5 shadow-2xl">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#E50914]" />
            Notifications & Annonces
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Choisir un canal</label>
              <select 
                className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-[#E50914] focus:outline-none"
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
              >
                <option value="">Sélectionner un canal...</option>
                {channels.map(channel => (
                  <option key={channel.id} value={channel.id}>
                    #{channel.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Message</label>
              <textarea 
                className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-[#E50914] focus:outline-none min-h-[120px]"
                placeholder="Écrivez votre message ici..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <Button 
              onClick={sendMessage}
              disabled={sending || !selectedChannel || !message}
              className="w-full bg-[#E50914] hover:bg-[#b90710] text-white flex gap-2 py-6 text-lg"
            >
              {sending ? <RefreshCcw className="animate-spin" /> : <Send size={20} />}
              Envoyer l'annonce
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
