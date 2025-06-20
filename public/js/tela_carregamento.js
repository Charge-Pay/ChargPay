document.addEventListener('DOMContentLoaded', async () => {
  const selectedTotem = sessionStorage.getItem('selectedTotem');
  const rechargeId = sessionStorage.getItem('rechargeId');

  if (!selectedTotem || !rechargeId) {
      alert('Erro: Informações de recarga faltando. Voltando para a tela inicial.');
      window.location.href = '../index.html';
      return;
  }

  const updateChargerDetails = async () => {
      try {
          const response = await fetch(`/api/recharge/${rechargeId}`);
          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }
          const details = await response.json();

          const box = document.getElementById(`box${selectedTotem}`);
          if (box) {
              const detailElements = box.querySelectorAll(
                  '.union, .img, .union-2, .union-3, .union-4, .union-5, .union-6, .union-7, ' +
                  '.rectangle, .rectangle-2, .rectangle-3, .rectangle-4, .rectangle-5, .rectangle-6, .rectangle-7, .rectangle-8, ' +
                  '.data-min, .data-kw, .data-multa, .data-total, .text-wrapper-3, .text-wrapper-4, .text-wrapper-5, .text-wrapper-6, ' +
                  '.text-wrapper-10, .text-wrapper-11, .text-wrapper-12, .text-wrapper-13'
              );
              detailElements.forEach(el => el.style.display = ''); 

              const minElement = box.querySelector('.data-min');
              const kwElement = box.querySelector('.data-kw');
              const multaElement = box.querySelector('.data-multa');
              const totalElement = box.querySelector('.data-total');

              if (minElement) minElement.textContent = `${details.min} min`;
              if (kwElement) kwElement.textContent = `${details.kw} Kw`;
              if (multaElement) multaElement.textContent = `R$ ${details.multa.replace('.', ',')}`;
              if (totalElement) totalElement.textContent = `R$ ${details.total.replace('.', ',')}`;
          }
      } catch (error) {
          console.error('Falha ao buscar detalhes da recarga:', error);
      }
  };

  updateChargerDetails(); 
  setInterval(updateChargerDetails, 5000); 

  const gerenciarEstado = (box) => {
    const estado = box.getAttribute('data-estado');
    const letra = box.getAttribute('data-letra');

    switch(estado) {
      case 'carregando':
        alert('Carregador ocupado!');
        break;
      case 'disponivel':
        alert('Este carregador está disponível, mas você já está recarregando.');
        break;
      case 'carregado':
        alert('Recarga encerrada! Remova o carregador!');
        break;
    }
  };

  document.querySelectorAll('#boxA, #boxB, #boxC').forEach(box => {
    box.addEventListener('click', () => gerenciarEstado(box));
  });
});