(function () {
  
  const scriptElement = document.currentScript;
  const sd=scriptElement.dataset
  const backgroundColor = sd.background || '#333';
  const textColor = sd.color || '#fff';
  const fontSize = sd.fontSize || '16px';
  const buttonBackgroundColor = sd.buttonBackground || '#fff';
  const buttonTextColor = sd.buttonColor || '#333';
  const buttonFontSize = sd.buttonFontSize || '14px';
  const buttonBorderRadius = sd.buttonBorderRadius || '';
  const buttonStyle = sd.buttonStyle
  const padding = sd.padding || '16px';
  
  if (localStorage.getItem('cookieConsent') === 'accepted') {
    return;
  }

  const consentBox = document.createElement('div');
  consentBox.id = 'cookie-consent';
  consentBox.style.position = 'fixed';
  consentBox.style.bottom = '0';
  consentBox.style.left = '0';
  consentBox.style.width = '100%';
  consentBox.style.backgroundColor = backgroundColor;
  consentBox.style.color = textColor;
  consentBox.style.padding = padding;
  consentBox.style.fontSize = fontSize;
  consentBox.style.zIndex = '9999';
  consentBox.style.boxSizing = 'border-box';
  consentBox.style.display = 'flex';
  consentBox.style.justifyContent = 'space-between';
  consentBox.style.alignItems = 'center';

  const content = document.createElement('p');
  content.innerHTML =`Мы используем cookie-файлы и сервисы веб-аналитики для улучшения
работы сайта. Оставаясь на сайте, вы соглашаетесь на
<a style="color: ${textColor}; text-decoration: underline;" href="/yandex-agreement" target="_blank" rel="noopener noreferrer">использование файлов
cookie и передачу данных службам веб-аналитики</a>`;
    // `Мы используем cookie-файлы для улучшения предоставляемых услуг. Оставаясь на сайте, вы соглашаетесь на
    // <a style="color: ${textColor}; text-decoration: underline;" href="/yandex-agreement" target="_blank" rel="noopener noreferrer">использование файлов куки и передачу данных службам веб-аналитики</a>`;
  content.style.margin = '0';
  content.style.wordBreak = 'break-word'; // Разрывает длинные слова
  content.style.color=consentBox.style.color

  const acceptButton = document.createElement('button');
  if(buttonStyle){
    acceptButton.style.cssText=buttonStyle
  }

  acceptButton.textContent = 'Принять';
  acceptButton.style.backgroundColor = buttonBackgroundColor;
  acceptButton.style.color = buttonTextColor;
  acceptButton.style.border = 'none';
  acceptButton.style.padding = '8px 16px';
  acceptButton.style.fontSize = buttonFontSize;
  acceptButton.style.cursor = 'pointer';
  acceptButton.style.minWidth = 'auto';
  acceptButton.style.display = 'inline-block';

  acceptButton.style.borderRadius=buttonBorderRadius

  acceptButton.addEventListener('click', () => {
    localStorage.setItem('cookieConsent', 'accepted');
    consentBox.style.display = 'none';
  });

  consentBox.appendChild(content);
  consentBox.appendChild(acceptButton);

  // Добавляем медиазапросы для мобильных устройств
  const styleElement = document.createElement('style');
  styleElement.innerHTML = `
    @media (max-width: 768px) {
      #cookie-consent {
        padding: 12px;
        font-size: var(--font-size-mobile, 14px);
      }
      #cookie-consent p {
        margin: 0;
      }
      #accept-cookie {
        padding: 6px 12px;
        font-size: var(--button-font-size-mobile, 12px);
      }
    }
  `;
  document.head.appendChild(styleElement);

  document.body.appendChild(consentBox);
})();