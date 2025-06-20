(function() {
  const maxLength = 11; 
  const telCodeDisplay = document.getElementById('telCodeDisplay');
  let codeDigits = [];

  function updateDisplay() {
    let display = codeDigits.map(d => d).join('');
    telCodeDisplay.textContent = display.padEnd(maxLength, '_');
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
    window.location.href='../htmls/cpf.html';
  });

  document.getElementById('proceedBtn').addEventListener('click', async () => {
    if (codeDigits.length === maxLength) {
      const clientId = sessionStorage.getItem('clientId');
      const userCpf = sessionStorage.getItem('userCpf'); 
      const telefone = codeDigits.join(''); 
      const selectedTotem = sessionStorage.getItem('selectedTotem'); 

      if (!clientId || !userCpf || !selectedTotem) {
          alert('Erro: Informações de cliente ou totem faltando. Por favor, reinicie o processo.');
          window.location.href = '../index.html';
          return;
      }

      try {
          const response = await fetch('/api/client', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  cpf: userCpf, 
                  telefone: telefone,
                  totem: selectedTotem 
              })
          });

          const data = await response.json();

          if (response.ok) {
              sessionStorage.setItem('userPhone', telefone); 
              window.location.href = '../htmls/sms.html';
          } else {
              alert(`Erro ao atualizar telefone: ${data.error || 'Não foi possível atualizar o telefone.'}`);
          }
      } catch (error) {
          console.error('Erro ao enviar telefone:', error);
          alert('Erro de conexão ao enviar telefone.');
      }

    } else {
      alert('Por favor, insira seu número de telefone completo com ' + maxLength + ' dígitos.');
    }
  });

})();