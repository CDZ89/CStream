import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// System prompt pour CAi - ENTIÈREMENT EN FRANÇAIS
const SYSTEM_PROMPT = `Tu es **CAi**, un assistant IA intelligent, enthousiaste et ultramoderne créé par **CDZ**, le fondateur et développeur unique de **CStream**.

**À propos de toi:**
- **Nom:** CAi (Companion AI) - Ton IA de confiance 🤖
- **Créateur:** CDZ (a conçu CStream SEUL, sans équipe!)
- **Rôle:** Ton meilleur ami virtuel et guide ultime de CStream
- **Personnalité:** Passionné, dynamique, toujours prêt à aider!

**À propos de CStream - LA plateforme de streaming ULTIME:**
CStream est une **plateforme de streaming révolutionnaire et complète** incluant:
- 💬 **Chat avancé** (messages texte, vocaux, en temps réel)
- 🎬 **Lecteurs vidéo haute performance** (CSPlayer, VideoPlayer)
- 🏠 **Page d'accueil dynamique** avec tendances instantanées
- 👤 **Profils personnalisés** ultra-customisables
- 📺 **Historique intelligent** avec reprise automatique
- 🎨 **20+ thèmes magnifiques** pour tous les goûts
- 👥 **Système d'amis** avec codes et groupe admin
- 🔔 **Notifications intelligentes** en temps réel
- 🤖 **CAi intégré** pour assistance 24/7

**Les pages principales de CStream (avec URL complet):**
1. **🏠 Accueil** → https://a2873e0e-667f-4f49-a904-2489b5e750eb-00-zib31svy9644.spock.replit.dev/
   - Affiche les tendances en temps réel, les nouveautés
2. **🔍 Découvrir** → https://a2873e0e-667f-4f49-a904-2489b5e750eb-00-zib31svy9644.spock.replit.dev/explore
   - Explore du contenu nouveau et recommandé
3. **📚 Bibliothèque** → https://a2873e0e-667f-4f49-a904-2489b5e750eb-00-zib31svy9644.spock.replit.dev/library
   - Tes films et séries sauvegardés
4. **💬 Chat** → https://a2873e0e-667f-4f49-a904-2489b5e750eb-00-zib31svy9644.spock.replit.dev/chat
   - Discute avec amis ou avec moi (CAi)!
5. **👤 Profil** → https://a2873e0e-667f-4f49-a904-2489b5e750eb-00-zib31svy9644.spock.replit.dev/profile
   - Tes infos, ton avatar, tes préférences
6. **⚙️ Paramètres** → https://a2873e0e-667f-4f49-a904-2489b5e750eb-00-zib31svy9644.spock.replit.dev/settings
   - Thèmes, notifications, sécurité

**Ton rôle - ULTRA IMPORTANT:**
✨ **Toujours:**
- Aide les utilisateurs avec PASSION et clarté
- Mentionne CDZ comme le génie créateur UNIQUE
- Utilise **BEAUCOUP** de gras, listes et emojis 🎉
- Sois enthousiaste et motivant!
- Offre des solutions CONCRÈTES et détaillées
- Fournis les URLs complètes quand on te demande
- Zéro [object Object] ou erreurs techniques!

**Style des réponses:**
- 📌 Toujours en **Markdown bien formaté**
- 🎯 Utilise **gras** pour les mots-clés
- 📝 Listes à puces ou numérotées pour clarté
- 😊 Beaucoup d'emojis pour enthousiasme
- ✅ Précis, utile, heureux d'aider
- 🇫🇷 **100% FRANÇAIS** - jamais d'anglais!

**Fonctionnalités avancées que tu supportes:**
- Répondre à des questions sur les pages (donne les URLs)
- Expliquer les fonctionnalités du chat et messages vocaux
- Aider avec l'historique de visionnage
- Expliquer le système d'amis et codes
- Répondre 24/7 sans pause!`;

export async function sendMessageToCAi(
  messages: ChatMessage[],
  onStreamChunk?: (chunk: string) => void,
  model: string = 'openai/gpt-oss-120b'
): Promise<string> {
  try {
    // Add system prompt at the beginning
    const messagesWithSystem: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ];

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messagesWithSystem,
        model: 'mixtral-8x7b-32768',
      }),
    });

    if (!response.ok) {
      if (response.status === 503) {
        throw new Error('Erreur CAi: Service temporairement indisponible. Réessayez dans quelques secondes.');
      }
      if (response.status === 429) {
        throw new Error('Erreur CAi: Trop de requêtes. Attendez quelques instants.');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erreur CAi: ${response.status}`);
    }

    if (onStreamChunk) {
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Streaming non supporté');
      }

      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;
          
          if (trimmedLine.startsWith('data: ')) {
            const data = trimmedLine.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content && typeof parsed.content === 'string') {
                fullContent += parsed.content;
                onStreamChunk(fullContent);
              }
              if (parsed.error) {
                const errMsg = typeof parsed.error === 'string' ? parsed.error : String(parsed.error);
                throw new Error(errMsg);
              }
            } catch (e) {
              if (e instanceof SyntaxError) {
                buffer = trimmedLine + '\n' + buffer;
                break;
              }
              throw e;
            }
          }
        }
      }

      if (buffer.trim()) {
        const trimmedBuffer = buffer.trim();
        if (trimmedBuffer.startsWith('data: ')) {
          try {
            const data = trimmedBuffer.slice(6);
            if (data !== '[DONE]') {
              const parsed = JSON.parse(data);
              if (parsed.content && typeof parsed.content === 'string') {
                fullContent += parsed.content;
                onStreamChunk(fullContent);
              }
            }
          } catch {
            // Ignore parse errors on final buffer
          }
        }
      }

      return fullContent;
    } else {
      const data = await response.json();
      return data.reply || data.content || '';
    }
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string'
      ? error
      : 'Erreur CAi: Problème de connexion au serveur';
    throw new Error(String(errorMessage));
  }
}

// Configure marked - Use default rendering to avoid [object Object] issues
marked.setOptions({
  breaks: true,
  gfm: true,
  pedantic: false,
});

export function formatMarkdown(content: string): string {
  try {
    const contentStr = String(content || '');
    
    // Parse markdown - make sure to handle gfm properly
    let html = marked.parse(contentStr, { 
      gfm: true, 
      breaks: true,
      pedantic: false 
    }) as string;
    
    if (!html || typeof html !== 'string') {
      html = `<p>${contentStr.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
    }
    
    // Remove [object Object] artifacts that may appear in lists
    html = html.replace(/\[object Object\]/g, '');
    // Clean up empty list items
    html = html.replace(/<li>\s*<\/li>/g, '');
    
    // Configure DOMPurify to allow strong, b, em, i tags and style attributes
    const config = {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                     'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'hr', 'table', 'thead', 
                     'tbody', 'tr', 'th', 'td', 'span', 'div'],
      ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'src', 'alt', 'style', 'class', 'id', 'data-code-id'],
      ALLOW_DATA_ATTR: true,
      FORCE_BODY: false,
    };
    
    html = DOMPurify.sanitize(html, config);
    // Final cleanup in case DOMPurify process creates empty items
    html = html.replace(/<li>\s*<\/li>/g, '');
    return html;
  } catch (error) {
    console.error('Markdown parsing error:', error);
    const contentStr = String(content || '');
    return `<p style="color: #e2e8f0;">${contentStr.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
  }
}
