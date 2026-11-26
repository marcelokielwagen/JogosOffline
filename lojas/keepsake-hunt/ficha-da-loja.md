# Keepsake Hunt: ficha para as lojas

Texto pronto para copiar na Google Play Console e no App Store Connect. Idioma principal: português do Brasil.

## Identidade
| Campo | Valor |
|---|---|
| Nome do app | Keepsake Hunt |
| Subtítulo (App Store, até 30) | Objetos escondidos e memórias |
| Pacote / Bundle ID | `io.github.marcelokielwagen.keepsakehunt` (dá para trocar antes do primeiro envio; depois, não) |
| Versão | 1.0.0 (código 1) |
| Categoria | Jogos › Quebra-cabeça (Play) · Jogos › Quebra-cabeça e Família (App Store) |
| Público-alvo | 13 anos ou mais (fora do programa "Família", por causa dos anúncios) |
| Classificação indicativa | Livre: sem violência, sem conversa entre jogadores, sem apostas |
| Preço | Grátis, com anúncios e compras opcionais no app |
| Política de privacidade | https://marcelokielwagen.github.io/JogosOffline/jogos/keepsake-hunt/privacidade.html |
| E-mail de contato | **falta: você escolhe** (aparece na página da loja) |

## Descrição curta (Play, até 80 caracteres)
Remexa mesas cheias de objetos, ache o que falta e restaure uma casa antiga.

## Descrição completa
Uma casa antiga ficou para você, e cada gaveta guarda uma lembrança.

Em Keepsake Hunt a mesa é uma pilha de objetos de verdade: tocar pega, arrastar o dedo remexe, e o que estava embaixo aparece. Ache os objetos da lista antes que o tempo acabe, junte combos e descubra o medalhão dourado escondido em cada fase.

• 50 fases em cinco cômodos: escritório, cozinha, ateliê, sala de TI e sótão
• 8 jeitos de jogar: lista, objetos enterrados, todos iguais, pela sombra, pares, no escuro com a luz no dedo, um por vez e só pelos nomes
• Restaure a casa com as estrelas que ganhar e veja cada cômodo voltar à vida
• 50 lembranças contam a história de Aurora, Bento, Clara e Téo, com cartas para ler
• Acervo com os 118 objetos, que dá para girar e olhar de perto
• Mesa do dia, missões, evento da semana e gavetas com prêmios sempre à vista
• Ímã, vento e relógio para quando a mesa apertar, e ajuda automática para quem empaca
• Funciona sem internet, partidas curtas e sons feitos para o celular
• Nada é sorteado: você sempre vê o que vai receber

Feito para quem gosta de prestar atenção nos detalhes, sem pressa demais.

## Palavras-chave (App Store, até 100 caracteres, separadas por vírgula)
objetos escondidos,procurar,achar,casa,memórias,relaxante,offline,quebra-cabeça,detalhes,restaurar

## O que há de novo (1.0.0)
Primeira versão: 50 fases, casa para restaurar, álbum de lembranças, acervo, mesa do dia, missões e evento da semana.

## Imagens (pasta `imagens/`)
| Loja | Arquivos | Tamanho |
|---|---|---|
| Ícone | `icone-1024.png` (App Store), `icone-512.png` (Play) | 1024 e 512 px, sem transparência |
| Gráfico de destaque (Play) | `grafico-1024x500.jpg` | 1024 × 500 |
| Celular (Play) | `play-1` a `play-8` | 1080 × 1920 |
| iPhone 6,7" | `iphone-1` a `iphone-8` | 1290 × 2796 |
| iPad 12,9" | `ipad-1` a `ipad-8` | 2048 × 2732 |

Ordem sugerida: 1 início, 2 fase, 3 remexer, 4 casa, 5 lembrança, 6 acervo, 7 missões, 8 reforços. Refazer: `node ferramentas/keepsake-hunt/lojas.mjs` e `node ferramentas/keepsake-hunt/icone.mjs`.

## Produtos dentro do app (criar iguais nas duas lojas)
| ID na loja | Tipo | Nome | O que entrega | Preço sugerido |
|---|---|---|---|---|
| `keepsake.inicial` | não consumível | Pacote da casa | 600 moedas, 3 de cada ferramenta e 24 h sem gastar vida (uma vez) | R$ 9,90 |
| `keepsake.sem_anuncios` | não consumível | Sem anúncios | Tira os anúncios entre as fases | R$ 12,90 |
| `keepsake.moedas_500` | consumível | 500 moedas | 500 moedas | R$ 4,90 |
| `keepsake.moedas_1500` | consumível | 1.500 moedas | 1.500 moedas | R$ 12,90 |
| `keepsake.moedas_4000` | consumível | 4.000 moedas | 4.000 moedas | R$ 29,90 |

Os preços são sugestão: a loja converte para cada país.

## Respostas dos questionários
**Classificação (IARC na Play e questionário da Apple):** violência: não; medo: não; linguagem: não; drogas, álcool e tabaco: não; sexo e nudez: não; apostas ou simulação de apostas: não (nada é sorteado); conversa ou conteúdo de outros usuários: não; compartilha localização: não; compras digitais: sim; anúncios: sim.

**Segurança dos dados (Play) / Privacidade do app (Apple), com anúncios ligados:**
- Coleta pelo próprio app: nenhuma (tudo fica no aparelho).
- Coletado por terceiros: identificador do aparelho/publicidade e dados de diagnóstico, pelo AdMob, para publicidade e prevenção de fraude; compras (histórico), pelo RevenueCat, para funcionalidade do app.
- Dados usados para rastrear entre apps: não (anúncios não personalizados). Se um dia os anúncios forem personalizados, a resposta muda para "sim" e o iOS pede permissão.
- Dados criptografados em trânsito: sim. Pedido de exclusão: não se aplica (não há conta; desinstalar apaga tudo).

**Anúncios:** contém anúncios: sim. **Acesso para revisão:** não precisa de login.
