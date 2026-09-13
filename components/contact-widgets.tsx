'use client';

import { MessageCircle, Send } from 'lucide-react';
import { useBrand } from './brand-provider';

export function ContactWidgets() {
  const brand = useBrand();
  if (!brand) return null;
  const whatsappNumber = brand.whatsappNumber.replace(/\D/g, '');
  const showWhatsApp = brand.whatsappEnabled && whatsappNumber.length >= 7;
  const showTelegram =
    brand.telegramEnabled && /^https:\/\/(t\.me|telegram\.me)\//.test(brand.telegramUrl);
  const showLiveChat = brand.liveChatEnabled && Boolean(brand.liveChatEmbedCode.trim());

  return (
    <>
      <div className="contact-widget-buttons" aria-label="Chat options">
        {showTelegram && (
          <a
            className="contact-widget-button telegram"
            href={brand.telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat on Telegram"
          >
            <Send size={24} />
          </a>
        )}
        {showWhatsApp && (
          <a
            className="contact-widget-button whatsapp"
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat on WhatsApp"
          >
            <MessageCircle size={26} />
          </a>
        )}
      </div>
      {showLiveChat && (
        <iframe
          className="custom-chat-frame"
          title="Customer support live chat"
          sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          srcDoc={`<!doctype html><html><head><meta name="referrer" content="strict-origin-when-cross-origin"><style>html,body{margin:0;width:100%;height:100%;background:transparent}</style></head><body>${brand.liveChatEmbedCode}</body></html>`}
        />
      )}
    </>
  );
}
