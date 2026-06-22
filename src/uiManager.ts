/**
 * Quiet Garden - UI and Mobile UX Manager
 */

export class UIManager {
  private lastHapticTime = 0;

  constructor() {
    this.createPrivacyBanner();
    this.createQuickReferenceCard();
    this.initAudioActivationNotification();
  }

  /**
   * Short short buzz for gesture triggers on supported mobile devices
   */
  public triggerHapticFeedback() {
    const now = Date.now();
    if (now - this.lastHapticTime > 300) { // Limit frequency
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        try {
          navigator.vibrate(25); // very short 25ms buzz
        } catch (e) {
          // ignore if disabled or restricted
        }
      }
      this.lastHapticTime = now;
    }
  }

  /**
   * Render a sleek floating banner at the bottom stating on-device camera processing privacy
   */
  private createPrivacyBanner() {
    if (document.getElementById('privacy-banner-container')) return;

    const banner = document.createElement('div');
    banner.id = 'privacy-banner-container';
    banner.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-darkCharcoal/90 text-white/90 text-[11px] px-5 py-2.5 rounded-full shadow-lg z-40 flex items-center gap-2 border border-white/10 font-sans tracking-wide select-none transition-all duration-500 ease-out';
    banner.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.3)';
    
    banner.innerHTML = `
      <span class="text-[14px]">🛡️</span>
      <span>All camera processing stays on your device. <strong>No data is recorded or uploaded.</strong></span>
      <button id="close-privacy-banner" class="opacity-60 hover:opacity-100 ml-3 font-semibold text-rose-300 font-sans cursor-pointer focus:outline-none">[Close]</button>
    `;

    document.body.appendChild(banner);

    const closeBtn = banner.querySelector('#close-privacy-banner');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        banner.style.opacity = '0';
        banner.style.transform = 'translate(-50%, 20px)';
        setTimeout(() => banner.remove(), 600);
      });
    }
  }

  /**
   * First-load dismissing Quick-Reference Gesture Card
   */
  private createQuickReferenceCard() {
    if (document.getElementById('quick-ref-modal-overlay')) return;

    const shown = localStorage.getItem('quickRefCardShown');
    if (shown === 'true') return;

    const overlay = document.createElement('div');
    overlay.id = 'quick-ref-modal-overlay';
    overlay.className = 'fixed inset-0 bg-[#1e1c18]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-500 select-none';

    overlay.innerHTML = `
      <div class="bg-cream border-4 border-[#1e1c18] rounded-[30px] shadow-[8px_8px_0px_#1e1c18] p-6 max-w-sm w-full relative z-10 animate-fade-in font-sans">
        <h3 class="font-serif italic text-darkCharcoal text-2xl font-bold text-center mb-3">Your Healing Gestures</h3>
        <p class="text-xs text-darkCharcoal/85 leading-relaxed text-center mb-5 font-sans">
          Welcome to the Mindful Gesture Sanctuary. Let your hand shapes flow into organic visuals and natural music. Try these five core practices:
        </p>
        
        <div class="space-y-3.5 mb-6">
          <div class="flex items-center gap-3 bg-white/40 p-2 rounded-xl border border-darkCharcoal/10">
            <span class="text-2xl">✊ ➔ 🖐️</span>
            <div>
              <strong class="text-left font-bold block text-darkCharcoal uppercase tracking-tight text-[11px]">✊ Released Butterflies</strong>
              <span class="text-[11px] text-darkCharcoal/70">Clench first, then unfold fully to release gentle butterflies.</span>
            </div>
          </div>
          <div class="flex items-center gap-3 bg-white/40 p-2 rounded-xl border border-darkCharcoal/10">
            <span class="text-2xl">🖐️ ➔ 🌾</span>
            <div>
              <strong class="text-left font-bold block text-darkCharcoal uppercase tracking-tight text-[11px]">🖐️ Flowing Blossoms</strong>
              <span class="text-[11px] text-darkCharcoal/70">Open flat palm and glide horizontally to grow wildflowers.</span>
            </div>
          </div>
          <div class="flex items-center gap-3 bg-white/40 p-2 rounded-xl border border-darkCharcoal/10">
            <span class="text-2xl">👆 ➔ 🌧️</span>
            <div>
              <strong class="text-left font-bold block text-darkCharcoal uppercase tracking-tight text-[11px]">👆 Soothing Rainfall</strong>
              <span class="text-[11px] text-darkCharcoal/70">Tap index finger quickly downward to splash nourishing rain.</span>
            </div>
          </div>
          <div class="flex items-center gap-3 bg-white/40 p-2 rounded-xl border border-darkCharcoal/10">
            <span class="text-2xl">🤏 ➔ 💧</span>
            <div>
              <strong class="text-left font-bold block text-darkCharcoal uppercase tracking-tight text-[11px]">🤏 Focused Water Droplets</strong>
              <span class="text-[11px] text-darkCharcoal/70">Pinch thumb and index together to focus floating condensation.</span>
            </div>
          </div>
          <div class="flex items-center gap-3 bg-white/40 p-2 rounded-xl border border-darkCharcoal/10">
            <span class="text-2xl">✋ ➔ 🍄</span>
            <div>
              <strong class="text-left font-bold block text-[#c49a6c] uppercase tracking-tight text-[11px]">✋ Sacred Stillness</strong>
              <span class="text-[11px] text-darkCharcoal/70">Hold your flat palm frozen still to sprout beautiful mushrooms.</span>
            </div>
          </div>
        </div>
        
        <button id="close-quick-ref-btn" class="w-full py-2.5 bg-[#5a5a40] text-cream border-2 border-darkCharcoal rounded-full font-serif italic hover:bg-darkCharcoal hover:text-cream transition-all duration-300 font-medium cursor-pointer shadow-[2px_3px_0px_rgba(30,28,24,0.15)]">
          Begin Sanctuary Practice
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('#close-quick-ref-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        overlay.style.opacity = '0';
        setTimeout(() => {
          overlay.remove();
          localStorage.setItem('quickRefCardShown', 'true');
        }, 500);
      });
    }
  }

  private initAudioActivationNotification() {
    window.addEventListener('click', () => {
      const banner = document.getElementById('audio-notif-fading');
      if (banner) {
        banner.style.opacity = '0';
        setTimeout(() => banner.remove(), 1000);
      }
    }, { once: true });
  }

  /**
   * Helper to display temporary therapeutic messages on gesture release
   */
  public showTherapeuticCaption(msg: string, x: number, y: number) {
    const cap = document.createElement('div');
    cap.className = 'floating-caption font-serif';
    cap.innerText = msg;
    cap.style.left = `${x}px`;
    cap.style.top = `${y}px`;
    
    document.body.appendChild(cap);
    
    // Automatically trigger fading away
    setTimeout(() => {
      cap.style.opacity = '0';
      setTimeout(() => cap.remove(), 1000);
    }, 2800);
  }
}
