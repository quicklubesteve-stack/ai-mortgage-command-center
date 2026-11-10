/**
 * Embeddable Mortgage Agent Floating Widget
 * Usage on any website:
 * <script src="https://your-domain.com/widget.js" data-server="https://your-domain.com"></script>
 */

(function () {
  const currentScript = document.currentScript;
  const serverUrl = currentScript?.getAttribute('data-server') || window.location.origin;

  // Create floating bubble container
  const container = document.createElement('div');
  container.id = 'mortgage-agent-widget-root';
  container.innerHTML = `
    <style>
      #mortgage-widget-bubble {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #10b981, #059669);
        box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 999999;
        transition: transform 0.25s ease, box-shadow 0.25s ease;
      }
      #mortgage-widget-bubble:hover {
        transform: scale(1.08);
        box-shadow: 0 12px 30px rgba(16, 185, 129, 0.6);
      }
      #mortgage-widget-iframe-container {
        position: fixed;
        bottom: 96px;
        right: 24px;
        width: 440px;
        height: 650px;
        max-width: calc(100vw - 32px);
        max-height: calc(100vh - 120px);
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.15);
        display: none;
        z-index: 999998;
        background: #070a13;
      }
      #mortgage-widget-iframe {
        width: 100%;
        height: 100%;
        border: none;
      }
    </style>
    <div id="mortgage-widget-bubble" title="Chat with Mortgage Deal Filtration Assistant">
      <span style="font-size: 28px;">🏡</span>
    </div>
    <div id="mortgage-widget-iframe-container">
      <iframe id="mortgage-widget-iframe" src="${serverUrl}"></iframe>
    </div>
  `;

  document.body.appendChild(container);

  const bubble = document.getElementById('mortgage-widget-bubble');
  const iframeContainer = document.getElementById('mortgage-widget-iframe-container');

  let isOpen = false;
  bubble.addEventListener('click', () => {
    isOpen = !isOpen;
    iframeContainer.style.display = isOpen ? 'block' : 'none';
    bubble.innerHTML = isOpen ? '<span style="font-size: 24px; color: white;">✕</span>' : '<span style="font-size: 28px;">🏡</span>';
  });
})();
