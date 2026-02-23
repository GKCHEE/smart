import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { collection, addDoc } from 'firebase/firestore';
import emailjs from '@emailjs/browser';
import { db } from './firebase';
import { Send, Sparkles, Loader2 } from 'lucide-react';

function App() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isPolishing, setIsPolishing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  const handleAiPolish = async () => {
    if (!message.trim()) return;

    const apiKey = import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      setStatus({ type: 'error', text: 'AI API key not configured.' });
      return;
    }

    setIsPolishing(true);
    setStatus(null);

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const prompt = `Rewrite the following text to be professional, polite, and concise: ${message}`;
      const result = await model.generateContent(prompt);
      const response = result.response;
      const polishedText = response.text();

      if (polishedText) {
        setMessage(polishedText.trim());
        setStatus({ type: 'success', text: 'Message polished!' });
      }
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'AI polish failed.' });
    } finally {
      setIsPolishing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      setStatus({ type: 'error', text: 'Please fill in all fields.' });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      // Save to Firebase
      await addDoc(collection(db, 'messages'), {
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
        createdAt: new Date().toISOString(),
      });

      // Send via EmailJS
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          from_name: name.trim(),
          from_email: email.trim(),
          message: message.trim(),
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );

      setStatus({ type: 'success', text: 'Message sent successfully!' });
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Failed to send message.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-10 pb-6 text-center">
            <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">
              Connect with Chin Cheong Ghee
            </h1>
            <p className="mt-2 text-slate-500 text-sm">
              Send me a message.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="message" className="block text-sm font-medium text-slate-700">
                  Message
                </label>
                <button
                  type="button"
                  onClick={handleAiPolish}
                  disabled={isPolishing || !message.trim()}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isPolishing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  ✨ AI Polish
                </button>
              </div>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message..."
                rows={5}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition resize-none"
              />
            </div>

            {status && (
              <p
                className={`text-sm ${
                  status.type === 'success' ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {status.text}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-slate-800 text-white font-medium hover:bg-slate-700 disabled:opacity-70 disabled:cursor-not-allowed transition"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
