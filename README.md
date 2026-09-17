# Brinquedo da Bela

Brinquedo infantil de teclado com bichinhos, natureza, princesas originais e falas em português brasileiro.

## Versão web

O conteúdo de `dist/` é a versão pública estática. Ela funciona em qualquer navegador, mas navegadores não permitem que uma página bloqueie teclas do sistema como a tecla Windows, Alt+Tab ou Ctrl+Alt+Del.

## Aplicativo Windows

O executável portátil mantém a janela em tela cheia e sempre no topo. O bloqueador nativo encaminha as teclas para o brinquedo e impede atalhos do Windows enquanto o aplicativo está aberto. `Ctrl+Alt+Del` continua reservado pelo próprio Windows. O botão `×` é a saída do brinquedo.

```powershell
npm install
npm run build:desktop
```

## Voz local

As falas são geradas localmente pelo Kokoro com a voz brasileira feminina `pf_dora`, sem chamadas de voz em tempo de execução.


Site publicado: https://brinquedo-da-bela.pages.dev/

