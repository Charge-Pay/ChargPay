const loadingDots = document.getElementById("loading-dots");
let dotCount = 0;

function updateDots() {
    dotCount = (dotCount + 1) % 4;
    loadingDots.textContent = ".".repeat(dotCount);
}

setInterval(updateDots, 500);

setTimeout(() => {
document.getElementById('mensagem').innerText = 'CARTÃO VALIDADO!!!';
}, 5000);
    setTimeout(() => {
        window.location.href='../htmls/plugar_carregador.html';
    }, 10000)

