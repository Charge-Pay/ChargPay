const loadingDots = document.getElementById("loading-dots");
let dotCount = 0;

function updateDots() {
    dotCount = (dotCount + 1) % 4; 
    loadingDots.textContent = ".".repeat(dotCount); 
}

setInterval(updateDots, 500); 

setTimeout(() => {
document.getElementById('mensagem').innerText = 'CARREGANDO!!!';
}, 5000);
    setTimeout(() => {
        window.location.href='../htmls/tela_carregamento.html';
    }, 10000)

