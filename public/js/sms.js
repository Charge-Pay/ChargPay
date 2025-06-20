(function() {
  let senha = "123456" 
  const maxLength = 6; 
  const smsCodeDisplay = document.getElementById('smsCodeDisplay');
  let codeDigits = [];

  function updateDisplay() {
    let display = codeDigits.map(d => d).join('');
    smsCodeDisplay.textContent = display.padEnd(maxLength, '_');
  }

  function onKeyPress(key) {
    if (key === 'backspace') {
      codeDigits.pop();
    } else if (codeDigits.length < maxLength && /^\d$/.test(key)) {
      codeDigits.push(key);
    }
    updateDisplay();
  }

  updateDisplay();

  document.querySelectorAll('.keypad .key').forEach(button => {
    button.addEventListener('click', () => {
      const key = button.getAttribute('data-key');
      onKeyPress(key);
    });
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.target.tagName === 'BUTTON' || ev.target.isContentEditable || ev.target.tagName === 'INPUT') {
      return; 
    }
    if(ev.key >= '0' && ev.key <= '9') {
      onKeyPress(ev.key);
    } else if (ev.key === 'Backspace') {
      onKeyPress('backspace');
    }
  });

  document.getElementById('cancelBtn').addEventListener('click', () => {
    codeDigits = [];
    updateDisplay();
    window.location.href='../htmls/telefone.html';
  });

  document.getElementById('proceedBtn').addEventListener('click', () => {
    if (codeDigits.length === maxLength) {
      if (codeDigits.join('') === senha) {
        window.location.href='../htmls/pagamento.html'
      } else {
        alert('Código incorreto!')
      }
    } else {
      alert('Por favor, insira o código SMS completo com ' + maxLength + ' dígitos.');
    }
  });

})();