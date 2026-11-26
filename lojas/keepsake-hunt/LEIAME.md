# Keepsake Hunt nas lojas: o que está pronto e o passo a passo

Esta pasta transforma o jogo do site em aplicativo para Google Play e App Store, usando o **Capacitor** (o jogo roda dentro do app, sem internet). Nada aqui foi instalado, nenhuma conta foi criada e nenhum dinheiro foi usado.

## O que já está pronto
| Arquivo | Para quê |
|---|---|
| `montar.mjs` | Copia o jogo para `www/`, tira o que é só do site (link "Todos os jogos", suíte) e põe o provedor das lojas |
| `provedor-capacitor.js` | Liga vídeo com prêmio, anúncio entre fases e compras ao jogo (`Monetizacao.usar`), e o botão Voltar do Android. Está em **modo de teste**: só anúncios de teste do Google e compras no ambiente de teste das lojas |
| `capacitor.config.json`, `package.json` | Configuração do app (nome, pacote, cor de fundo) e lista dos componentes a instalar |
| `ficha-da-loja.md` | Textos da loja, produtos, classificação e respostas de privacidade |
| `imagens/` | Ícone, gráfico de destaque e capturas de celular, iPhone e iPad, tirados do próprio jogo |
| `../../jogos/keepsake-hunt/privacidade.html` | Política de privacidade (fica pública no site depois de publicada; o link está nos Ajustes do jogo) |

## O que só você pode fazer (em ordem)
1. **Conta de desenvolvedor Google Play**: pagamento único de US$ 25, com documento e verificação de identidade. Conta pessoal nova precisa de um teste fechado com 12 pessoas por 14 dias antes de publicar.
2. **Conta Apple Developer**: US$ 99 por ano. Para publicar no iPhone é obrigatório ter um **Mac** com Xcode (ou um serviço de Mac na nuvem).
3. **E-mail de contato** para a página do jogo nas lojas.
4. **Dados fiscais e bancários** nas duas lojas (só se for vender ou receber de anúncios). Pessoa física com CPF funciona; o endereço aparece na loja, se você for vendedor.
5. **AdMob** (conta Google): criar o app e dois blocos de anúncio (vídeo com prêmio e intersticial) para Android e para iOS. Os IDs entram em `provedor-capacitor.js`, no lugar dos de teste, e o ID do app vai no projeto Android/iOS (passo 7).
6. **RevenueCat** (grátis até certo faturamento): criar o projeto, ligar às duas lojas e copiar as duas chaves públicas para `provedor-capacitor.js`. Criar nas lojas os 5 produtos da ficha, com os mesmos IDs.
7. **Montar e assinar** (eu posso fazer junto com você, num computador com Android Studio e, para iPhone, num Mac):
   ```
   cd lojas/keepsake-hunt
   npm install
   npx cap add android
   npx cap add ios
   npx capacitor-assets generate --iconBackgroundColor "#101816" --splashBackgroundColor "#101816"
   npm run android
   ```
   O Android Studio gera o pacote assinado (`.aab`). **Guarde a chave de assinatura fora do GitHub**: sem ela não dá para atualizar o app nunca mais.
8. **Testar num celular de verdade** com os anúncios de teste e uma compra de teste. Só depois trocar `TESTE = true` por `false`.

## Cuidados
- As versões dos componentes em `package.json` são as que existiam até a data desta preparação; confira na hora do `npm install`. O provedor foi testado com plugins simulados, não com os de verdade.
- Os anúncios estão como **não personalizados**. Para personalizar seria preciso mudar a política de privacidade e as respostas da ficha.
- O site continua igual: lá não há anúncio de verdade e nada é vendido.
- A Apple às vezes recusa apps que parecem "só um site". Este roda sem internet, tem compras pela loja e funciona com o botão Voltar e o modo deitado, o que costuma bastar.
