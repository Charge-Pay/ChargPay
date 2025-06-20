(function() {
  const maxLength = 11; 
  const cpfCodeDisplay = document.getElementById('cpfCodeDisplay');
  let codeDigits = [];

  function updateDisplay() {
    let display = codeDigits.map(d => d).join('');
    cpfCodeDisplay.textContent = display.padEnd(maxLength, '_');
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
    window.location.href = '../index.html';
  });

  document.getElementById('proceedBtn').addEventListener('click', async () => {
    if (codeDigits.length === maxLength) {
      const cpf = codeDigits.join('');
      const selectedTotem = sessionStorage.getItem('selectedTotem'); 

      if (!selectedTotem) {
          alert('Nenhum totem selecionado. Por favor, volte ao início.');
          window.location.href = '../index.html';
          return;
      }

      try {
          const response = await fetch('/api/client', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ cpf: cpf, telefone: 'Aguardando', totem: selectedTotem }) 
          });

          const data = await response.json();

          if (response.ok) {
              sessionStorage.setItem('clientId', data.clientId); 
              sessionStorage.setItem('userCpf', cpf); 
              window.location.href = 'telefone.html';
          } else {
              alert(`Erro: ${data.error || 'Não foi possível processar o CPF.'}`);
          }
      } catch (error) {
          console.error('Erro ao enviar CPF:', error);
          alert('Erro de conexão ao processar CPF.');
      }
    } else {
      alert('CPF inválido! Por favor, insira 11 dígitos.');
    }
  });

})();