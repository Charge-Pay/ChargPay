(function() {
  let senha = "1234"; 
  const maxLength = 4; 
  const cardCodeDisplay = document.getElementById('cardCodeDisplay');
  let codeDigits = [];

  function updateDisplay() {
    let display = codeDigits.map(d => d).join('');
    cardCodeDisplay.textContent = display.padEnd(maxLength, '_');
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

  document.getElementById('proceedBtn').addEventListener('click', async () => {
    if (codeDigits.join('') === senha) {
      const clientId = sessionStorage.getItem('clientId');
      const selectedTotem = sessionStorage.getItem('selectedTotem');
      const energiaKw = 50; 
      const custoKw = 2.90; 
      const nomeCartao = "Cliente Teste";
      const numeroCartao = "1111222233334444";
      const validadeCartao = "12/25";
      const codSeguranca = "123";
      const metodoPag = "Credito";

      if (!clientId || !selectedTotem) {
          alert('Erro: Informações de cliente ou totem faltando. Por favor, reinicie o processo.');
          window.location.href = '../index.html';
          return;
      }

      try {
          const rechargeResponse = await fetch('/api/recharge/start', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  clientId: clientId,
                  energiaKw: energiaKw,
                  custoKw: custoKw,
                  totem: selectedTotem
              })
          });

          const rechargeData = await rechargeResponse.json();

          if (!rechargeResponse.ok) {
              throw new Error(rechargeData.error || 'Failed to initiate recharge.');
          }

          sessionStorage.setItem('rechargeId', rechargeData.rechargeId); 

          const paymentResponse = await fetch('/api/payment', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  rechargeId: rechargeData.rechargeId, 
                  nomeCartao: nomeCartao,
                  numeroCartao: numeroCartao,
                  validadeCartao: validadeCartao,
                  codSeguranca: codSeguranca,
                  metodoPag: metodoPag,
                  senhaCartao: codeDigits.join('') 
              })
          });

          const paymentData = await paymentResponse.json();

          if (paymentResponse.ok) {
              sessionStorage.setItem('transactionId', paymentData.transactionId);
              sessionStorage.setItem('transactionCode', paymentData.codTransacao);
              window.location.href = '../htmls/validando.html';
          } else {
              alert(`Payment Error: ${paymentData.error || 'Could not process payment.'}`);
          }
      } catch (error) {
          console.error('Error in recharge/payment flow:', error);
          alert('An error occurred during the recharge process. Please try again.');
      }
    } else {
      alert('Senha incorreta!');
    }
  });

})();