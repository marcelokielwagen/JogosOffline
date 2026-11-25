// Palavras e dicas das partidas rápidas de tecnologia. Uma por linha: PALAVRA|dica. Sem acento; o Ç vale.
// Só entram na grade palavras que cabem nela; os outros temas vêm das palavras de grades.js e grades-temas.js.
const BANCO = {
  'Tecnologia da informação': `
COMPUTADOR|Máquina que processa dados
INFORMATICA|Área que estuda o tratamento de dados por computador
TECNOLOGIA|O T da sigla TI
APLICATIVO|Programa instalado no celular
MOUSE|Aparelho que move a setinha na tela
TECLADO|Onde se digita
MONITOR|Tela do computador
IMPRESSORA|Passa o documento para o papel
SOFTWARE|A parte do computador que não se toca: os programas
HARDWARE|A parte física do computador
SISTEMA|Windows e Linux são exemplos de ___ operacional
ARQUIVO|Documento, foto ou planilha salva no computador
PASTA|Organiza os arquivos
MEMORIA|RAM é um tipo dela
DISCO|HD quer dizer ___ rígido
USB|Entrada do pen drive
PIXEL|Cada pontinho da imagem na tela
WINDOWS|Sistema operacional da Microsoft
LINUX|Sistema operacional do pinguim
TABLET|Aparelho de tela entre o celular e o notebook
NOTEBOOK|Computador portátil
CELULAR|Telefone que cabe no bolso
SCANNER|Digitaliza documentos de papel
WEBCAM|Câmera das reuniões por vídeo
DRIVER|Programa que faz o sistema conversar com um aparelho
BACKUP|Cópia de segurança
PLANILHA|Documento de linhas, colunas e fórmulas
LICENÇA|Autorização para usar um programa
CHAMADO|Pedido aberto para a equipe de atendimento
SUPORTE|Equipe que ajuda quando algo não funciona
USUARIO|Quem usa o sistema
LOGIN|Ato de entrar no sistema
TELA|Parte do celular que se toca
CHIP|Pecinha que dá linha ao celular
BATERIA|Precisa de recarga no notebook
EMAIL|Mensagem com arroba no endereço
ICONE|Figurinha que abre um programa
MENU|Lista de opções de um programa
ATALHO|Ctrl+C é um ___ de teclado
JANELA|Área da tela que se abre, fecha e minimiza
CURSOR|Seta ou barrinha que pisca na tela
BIT|Menor unidade de informação: 0 ou 1
BYTE|Conjunto de oito bits
VERSAO|A 2.0 vem depois da 1.0
DADOS|Informações guardadas no computador
INTERNET|Rede mundial de computadores
PROJETO|Trabalho com prazo, escopo e custo
GESTOR|Quem comanda a equipe
ANALISTA|Cargo de quem estuda e melhora sistemas
EXCEL|Programa de planilhas da Microsoft
FONTE|Leva energia às peças do computador
PLACA|___-mãe: onde se encaixam as peças
COOLER|Ventilador que esfria o processador
GAMER|Computador feito para jogos`,

  'Segurança cibernética': `
RANSOMWARE|Praga que sequestra os arquivos e cobra para devolver
SEGURANÇA|Proteção contra riscos e ataques
ANTIVIRUS|Programa que detecta e remove pragas digitais
CIBERATAQUE|Investida criminosa feita pela internet
SENHA|Não se conta a ninguém, e "123456" é fraca
HACKER|Especialista em explorar sistemas
VIRUS|Praga digital que se espalha pelos arquivos
GOLPE|Trapaça, como a do falso boleto
TROJAN|Cavalo de Troia digital, em inglês
WORM|Praga que se espalha sozinha pela rede ("verme")
SPAM|E-mail indesejado enviado em massa
PHISHING|Golpe que "pesca" dados com mensagem falsa
MALWARE|Nome geral dos programas maliciosos
SPYWARE|Programa espião
BOTNET|Rede de computadores infectados e controlados de longe
FIREWALL|"Parede de fogo" que filtra o tráfego da rede
TOKEN|Aparelho ou código que confirma o acesso ao banco
BIOMETRIA|Uso da digital ou do rosto para entrar
CHAVE|Pode ser pública ou privada na criptografia
CIFRA|Código que esconde a mensagem
HASH|Impressão digital de um arquivo
VPN|Túnel privado pela internet
LGPD|Lei brasileira de proteção de dados
SOC|Central que vigia a segurança dia e noite
SIEM|Sistema que reúne e cruza registros de segurança
PATCH|Remendo que corrige falha de programa
BRECHA|Abertura por onde o invasor entra
ATAQUE|Ação do invasor
FRAUDE|Crime de enganar para ter vantagem
VAZAMENTO|Exposição indevida de dados
AUDITORIA|Verificação de controles e registros
POLITICA|Documento com as regras de segurança da empresa
RISCO|Chance de algo dar errado
AMEAÇA|O que pode causar dano ao sistema
DEFESA|Papel do time azul
BLOQUEIO|Trava da tela do celular
ACESSO|Permissão de entrar
CADEADO|Símbolo do site seguro
FALHA|Defeito que abre caminho ao invasor
EXPLOIT|Código que se aproveita de uma vulnerabilidade
BACKDOOR|"Porta dos fundos" deixada pelo invasor
ROOTKIT|Praga que se esconde no fundo do sistema
PROXY|Intermediário entre o usuário e a internet
PENTEST|Teste de invasão autorizado
SANDBOX|"Caixa de areia" para testar arquivo suspeito
ADWARE|Praga que enche a tela de propaganda
ISCA|O link falso é a ___ do golpista
CRIME|Invadir computador alheio é um
PERICIA|Investigação técnica das provas digitais
ALERTA|Aviso de atividade suspeita
DDOS|Ataque que derruba um site com excesso de acessos
RESGATE|Valor cobrado pelo sequestrador de dados
PIN|Senha numérica curta
SIGILO|Segredo profissional
LOG|Registro do que aconteceu no sistema`,

  'Infraestrutura de TI': `
DATACENTER|Centro que abriga os servidores da empresa
SERVIDORES|Computadores que atendem toda a rede
VIRTUALIZAR|Transformar uma máquina física em várias lógicas
REDUNDANCIA|Ter peça reserva para o serviço não parar
RACK|Armário de metal dos equipamentos
STORAGE|Equipamento de armazenamento de dados
SWITCH|Liga os computadores da rede por cabo
ROTEADOR|Escolhe o caminho dos dados entre redes
CABO|Fio que liga o equipamento à rede
FIBRA|Cabo que leva dados por luz: ___ óptica
NOBREAK|Segura a energia quando falta luz
GERADOR|Motor a diesel que produz energia de emergência
ENERGIA|Sem ela o servidor desliga
BACKUP|Cópia de segurança
RAID|Conjunto de discos que trabalham juntos
SSD|Disco rápido, sem partes móveis
CLUSTER|Grupo de servidores que trabalham como um só
NUVEM|Infraestrutura alugada e usada pela internet
BLADE|Servidor fino como uma lâmina
COOLER|Ventilador que esfria o processador
CPU|Sigla do processador
RAM|Memória que se apaga ao desligar
HUB|Antecessor simples do switch
DNS|Traduz o nome do site para endereço IP
DHCP|Entrega endereços IP automaticamente
VLAN|Rede virtual que separa setores no mesmo switch
ZABBIX|Programa livre de monitoramento
TICKET|Chamado registrado com número
SLA|Acordo de nível de serviço
UPTIME|Tempo em que o serviço fica no ar
ATIVO|Cada equipamento do inventário
LINK|Ligação contratada com a operadora
TOMADA|Onde se liga o equipamento na parede
SENSOR|Mede a temperatura da sala
FITA|Mídia magnética de backup
DISCO|Guarda dados no servidor
BACKBONE|Espinha dorsal da rede
DOMINIO|Reúne usuários e máquinas no Active Directory
VMWARE|Empresa famosa de máquinas virtuais
DOCKER|Programa de contêineres com a baleia no logotipo
SNAPSHOT|Foto do estado da máquina virtual
REPLICA|Cópia idêntica em outro lugar
HOST|Máquina que hospeda outras
KERNEL|Núcleo do sistema operacional
LATENCIA|Atraso da resposta na rede
ESCALA|Crescer conforme a demanda é ter ___
ANTENA|Capta ou envia o sinal sem fio
RADIO|Enlace sem fio entre dois prédios
TORRE|Sustenta as antenas
PROVEDOR|Empresa que fornece internet
ALARME|Soa quando algo sai do normal
CONSOLE|Tela de comando do equipamento
MIGRAÇAO|Mudança de um ambiente para outro
FAILOVER|Troca automática para o equipamento reserva
GABINETE|Caixa que guarda as peças do computador
PORTA|Cada encaixe do switch
TELEFONIA|Serviço dos ramais e ligações`,

  'Redes e internet': `
NAVEGADOR|Chrome, Edge e Firefox são exemplos
CABEAMENTO|Conjunto de fios da rede do prédio
TRANSMISSAO|Envio de dados ou de imagem ao vivo
HIPERTEXTO|Texto com links, o HT de HTML
WIFI|Internet sem fio de casa
MODEM|Aparelho que traz a internet da operadora
SITE|Conjunto de páginas na internet
PAGINA|Cada tela de um site
LINK|Texto clicável que leva a outro lugar
BUSCA|O que o Google faz
CHAT|Conversa por mensagens
BLOG|Diário ou coluna na internet
VIDEO|O que se assiste no YouTube
STREAMING|Assistir sem baixar
UPLOAD|Enviar arquivo para a internet
DOWNLOAD|Baixar arquivo da internet
PING|Teste do tempo de resposta
PACOTE|Cada pedaço de dados que viaja pela rede
URL|Endereço de uma página
HTTP|Começo do endereço do site
WEB|Teia mundial de páginas
COOKIE|"Biscoito" que o site grava no navegador
DOMINIO|Nome do site, como exemplo.com.br
EMAIL|Correio eletrônico
SINAL|Fica fraco longe do roteador
ANTENA|Capta o sinal
SATELITE|Gira em volta da Terra e leva internet a lugares distantes
BANDA|___ larga: internet rápida
GIGABIT|Mil megabits
ETHERNET|Padrão da rede com cabo
HOTSPOT|Ponto de acesso sem fio
ROAMING|Uso do celular fora da área da operadora
BLUETOOTH|Liga o fone sem fio ao celular
GATEWAY|Porta de saída da rede
MASCARA|___ de sub-rede: separa rede e máquina
TCP|Par do IP no protocolo da internet
MALHA|Rede mesh, em português
PONTE|Liga dois trechos de rede (bridge)
PROTOCOLO|Conjunto de regras da comunicação
SERVIDOR|Atende os pedidos dos clientes
CLIENTE|Quem pede dados ao servidor
CONEXAO|Se cai, a internet para
PERFIL|Sua página na rede social
POST|Publicação na rede social
LIVE|Vídeo ao vivo
REDE|Computadores ligados entre si
ROTA|Caminho dos dados
FEED|Linha de publicações que se rola com o dedo
FTP|Protocolo antigo de enviar arquivos
SSH|Acesso remoto seguro por terminal
ARROBA|Símbolo do e-mail`,

  'Programação': `
ALGORITMO|Sequência de passos para resolver um problema
JAVASCRIPT|Linguagem que dá vida às páginas da web
COMPILADOR|Traduz o código para a linguagem da máquina
PYTHON|Linguagem com nome de cobra
JAVA|Linguagem com a xícara de café no logotipo
CODIGO|O que o programador escreve
BUG|Defeito no programa ("inseto" em inglês)
VARIAVEL|Guarda um valor que pode mudar
LOOP|Repetição, em inglês
FUNÇAO|Bloco de código com nome, que se chama várias vezes
CLASSE|Molde para criar objetos
OBJETO|Instância de uma classe
METODO|Função que pertence a um objeto
TESTE|Confere se o programa funciona
GIT|Sistema de controle de versão
COMMIT|Grava as mudanças no repositório
BRANCH|Ramo do código no Git
DEPLOY|Colocar o sistema no ar
API|Permite que um programa converse com outro
JSON|Formato de dados com chaves e dois-pontos
HTML|Linguagem de marcação das páginas
CSS|Define cores e estilos da página
SQL|Linguagem de consulta a bancos de dados
ARRAY|Vetor, em inglês
LISTA|Coleção de itens em ordem
PILHA|O último a entrar é o primeiro a sair
FILA|O primeiro a entrar é o primeiro a sair
STRING|Texto, para o programador
INTEIRO|Número sem casas decimais
BOOLEANO|Só pode ser verdadeiro ou falso
LOGICA|Raciocínio que organiza o programa
SINTAXE|Regras de escrita da linguagem
DEBUG|Caça aos erros do código
FRAMEWORK|Estrutura pronta para criar sistemas
SCRIPT|Roteiro curto de comandos
EDITOR|Programa onde se escreve o código
SPRINT|Ciclo curto de trabalho no Scrum
SCRUM|Método ágil com reuniões diárias
KANBAN|Quadro de tarefas em colunas
REACT|Biblioteca de telas criada pelo Facebook
RUST|Linguagem cujo nome significa "ferrugem"
PHP|Linguagem do WordPress
BINARIO|Sistema de zeros e uns
ERRO|Falha apontada na tela
LAÇO|Estrutura de repetição
MODULO|Parte separada do programa
CONSTANTE|Valor que não muda
RECURSAO|Função que chama a si mesma
HERANÇA|Quando uma classe recebe o que é da classe-mãe
MERGE|Junção de dois ramos no Git
TIPO|Texto e número são exemplos de ___ de dado`,

  'Dados, nuvem e IA': `
KUBERNETES|Orquestrador de contêineres com o leme no logotipo
ESTATISTICA|Ciência das médias e das probabilidades
AUTOMATIZAR|Deixar a máquina fazer sozinha
NUVEM|Computação usada pela internet
AZURE|Nuvem da Microsoft
AWS|Nuvem da Amazon
DADOS|O "petróleo" da era digital
BANCO|___ de dados: onde ficam as informações
TABELA|Linhas e colunas do banco de dados
COLUNA|Cada campo da tabela
REGISTRO|Cada linha da tabela
CONSULTA|Pergunta feita ao banco de dados
INDICE|Acelera a busca no banco de dados
ORACLE|Banco de dados com nome de "oráculo"
MYSQL|Banco de dados livre com o golfinho no logotipo
CHATBOT|Robô que conversa por texto
ROBO|Máquina automática
MODELO|O que se treina na inteligência artificial
TREINO|Fase em que a IA aprende
NEURONIO|Unidade da rede neural, imitando o cérebro
PROMPT|Pedido escrito para a IA
SENSOR|Colhe medidas do ambiente
GRAFICO|Pode ser de barras, de linhas ou de pizza
PAINEL|Dashboard, em português
RELATORIO|Documento com os resultados
PLANILHA|Arquivo do Excel
BIGDATA|Grande volume de dados, em inglês
MINERAÇAO|Garimpo de informações nos dados
DOCKER|Programa da baleia que roda contêineres
CONTEINER|Caixa isolada onde roda o programa
SAAS|Software vendido como serviço
ESCALA|Crescer conforme o uso é ter ___
REGIAO|Local do datacenter da nuvem
CUSTO|Quanto se gasta
DEVOPS|Une desenvolvimento e operação
PIPELINE|Esteira de etapas automáticas
METRICA|Medida acompanhada no painel
MEDIA|Soma dividida pela quantidade
AMOSTRA|Pequena parte que representa o todo
PADRAO|O que se repete nos dados
PREVISAO|Estimativa do futuro
DRONE|Voa por controle remoto
IOT|Sigla da internet das coisas
VOZ|Comando falado à assistente virtual
IMAGEM|Foto ou desenho gerado pela IA
CHAVE|___ primária: identifica a linha da tabela
LAGO|"Data lake": ___ de dados
FILTRO|Mostra só o que interessa
EXCEL|Planilha da Microsoft
CSV|Arquivo de valores separados por vírgula
TOKEN|Pedacinho de texto lido pela IA`,
};
