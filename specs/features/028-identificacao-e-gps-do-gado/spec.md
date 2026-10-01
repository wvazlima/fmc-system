# 028 · Identificação do gado: brinco e rastreador GPS

|                        |                                                             |
| ---------------------- | ----------------------------------------------------------- |
| **Estado**             | rascunho                                                    |
| **Fase**               | 2 (a confirmar — ver dúvida 1)                             |
| **Depende de**         | `003-gado-entrada-e-lotes`, `004-gado-manejo-e-prenhez`, `012` |
| **Princípios em jogo** | constitution §1, §3, §6, §8, §9, §10                        |

---

## Problema

O controle individual do gado começa na identificação. Se o animal não tem um
identificador confiável, nada do que vem depois — prenhez, exames, custo por cabeça,
margem — se sustenta: a informação se perde entre o curral e o escritório.

Hoje a identificação é o brinco lido a olho e anotado no papel. Com 100 a 300 animais
passando por mês, isso significa centenas de leituras manuais, cada uma com chance de
erro, repassadas por telefone até a digitação. Um dígito trocado vira um animal que
não existe ou um histórico colado no bicho errado.

O produtor levantou duas coisas diferentes, e misturá-las seria um erro:

- **Brinco (anilha):** identificação individual, barata, já existente na operação. É
  fundação.
- **Rastreador GPS:** localização do animal no pasto, "tem a possibilidade" nas
  palavras dele. É hardware novo, com custo por animal e por mês, e com um problema
  específico neste negócio: **o rebanho gira**. Comprar rastreador para um animal que
  fica quatro meses na fazenda é uma conta bem diferente de rastrear matriz que fica
  anos.

Esta spec trata as duas, na ordem certa, e deixa a segunda condicionada à conta
fechar.

## Usuários e perfis afetados

| Perfil   | O que passa a fazer                                                      | O que **não** pode ver                 |
| -------- | ------------------------------------------------------------------------ | -------------------------------------- |
| Dono     | Vê a localização do rebanho e a cobertura de identificação               | —                                      |
| Gerente  | Administra brincos, substituições e os dispositivos                      | —                                      |
| Operador | Lê o brinco no curral e registra o manejo pelo identificador             | Custo do dispositivo, valor do animal  |

## Histórias

- Como **operador**, quero identificar o animal no curral sem digitar o número à mão.
- Como **gerente**, quero trocar o brinco de um animal sem perder o histórico dele.
- Como **gerente**, quero importar uma leitura em lote feita no manejo.
- Como **dono**, quero saber onde está o rebanho e ser avisado quando um animal sai da
  área.

## Critérios de aceite

### CA-01 · Identidade do animal é interna, não o brinco

- **Dado** um animal identificado pelo brinco 1180
- **Quando** o brinco cai e é substituído pelo 2042
- **Então** o animal continua sendo o mesmo registro, com o mesmo UUID v7
- **E** o histórico de identificadores guarda o 1180 com data de início e de fim
- **E** uma busca pelo 1180 encontra o animal (glossário: `ear_tag` é único na
  organização e reutilizável após a saída)

### CA-02 · Leitura eletrônica entra sem digitação

- **Dado** um brinco eletrônico lido por bastão ou leitor
- **Quando** a leitura chega ao aplicativo
- **Então** o animal é identificado e a tela já abre no manejo em curso
- **E** leitura de um identificador desconhecido oferece o cadastro imediato, sem sair
  da tela
- **E** leitura repetida do mesmo animal no mesmo manejo não duplica o registro
  (constitution §2)

### CA-03 · Manejo em série no curral

- **Dado** um manejo com 120 animais em sequência
- **Quando** o operador trabalha no curral
- **Então** a tela aceita a próxima leitura sem navegação extra, com alvo de toque de
  ao menos 44 px e contraste de uso sob sol (constitution §8)
- **E** o tempo entre dois registros não depende de rede

### CA-04 · Importação de leitura em lote

- **Dado** um arquivo de leituras exportado de um leitor
- **Quando** o gerente o importa
- **Então** cada leitura vira evento vinculado ao animal, com data e manejo
- **E** leituras sem correspondência são apresentadas para resolução, nunca descartadas
- **E** a importação é um lote reversível (constitution §11)

### CA-05 · Localização por rastreador, quando houver

- **Dado** um animal com dispositivo de rastreio vinculado
- **Quando** a posição é recebida do provedor
- **Então** ela é gravada como série temporal do **animal**, com data/hora e precisão
- **E** aparece no mapa da fazenda sobre o mapa base próprio (feature `012`,
  constitution §10)
- **E** o dado fica no Cloud SQL, nunca em KV, D1 ou cache de borda (constitution §9)

### CA-06 · Cerca virtual e alerta de saída

- **Dado** uma geometria de área cadastrada (PostGIS, feature `012`)
- **Quando** a posição de um animal fica fora dela
- **Então** é gerado um alerta com animal, horário e local
- **E** o alerta informa o fato, sem afirmar causa (furto, cerca quebrada, erro de GPS)
  — constitution §7

### CA-07 · Dispositivo tem custo e ciclo de vida

- **Dado** um rastreador
- **Quando** ele é cadastrado
- **Então** guarda número de série, data de ativação, custo de aquisição e custo mensal
- **E** ao sair o animal, o dispositivo volta ao estoque de dispositivos para
  reaproveitamento
- **E** o custo é apropriado ao lote ou à fazenda, conforme o rateio configurado
  (feature `010`)

### CA-OFF · Cenário offline

- **Dado** que o operador está no curral, sem sinal, com o leitor na mão
- **Quando** registra 120 leituras em sequência
- **Então** todas são gravadas no banco local com UUID v7 do cliente e aparecem como
  `pendentes`
- **E** a tela responde imediatamente a cada leitura, sem esperar rede
- **E** ao sincronizar, nenhum evento duplica, mesmo com envio repetido
  (constitution §2)
- **E** a posição de GPS do rastreador é dado que **chega do provedor pelo servidor** —
  não depende do dispositivo do operador

### CA-OP · Cenário de operador

- **Dado** um operador alocado na fazenda A
- **Quando** ele identifica o animal e registra o manejo
- **Então** vê identificador, categoria, lote e o histórico sanitário necessário ao
  trabalho
- **E** não recebe preço de compra, custo acumulado, margem nem custo do dispositivo —
  os campos não entram na projeção nem no sync (constitution §6)
- **E** ao tentar ler animal da fazenda B, recebe 403

## Regras de negócio

1. A identidade do animal é o UUID v7 interno; o brinco é **atributo com histórico**,
   nunca a chave.
2. Um identificador ativo é único na organização; identificadores antigos ficam no
   histórico com período de vigência.
3. Tipos de identificador: `visual_tag`, `electronic_tag`, `sisbov`, `gps_device` — um
   animal pode ter mais de um ao mesmo tempo.
4. Leitura é evento idempotente: a mesma leitura reenviada não cria registro novo.
5. Posição de GPS é série temporal do animal, com precisão declarada; posição imprecisa
   não gera alerta.
6. Dispositivo tem custo de aquisição e custo recorrente, rastreados e rateados.
7. Alerta descreve o fato, nunca a causa (constitution §7).
8. Telemetria fica no Cloud SQL (constitution §9); o provedor é integração, não fonte
   de verdade.
9. Operador nunca recebe valor (constitution §6).

## Fora de escopo

- Compra, homologação e instalação do hardware de rastreio.
- Rastreamento de GPS de **funcionário** (feature `012` mantém fora de escopo).
- Balança eletrônica integrada e captura automática de peso — ver dúvida 6.
- Certificação SISBOV e exigências de exportação — ver dúvida 4.
- Comportamento animal, cio por sensor e sensoriamento de saúde.

## Dúvidas abertas

| #   | Dúvida                                                                                                                                        | Para quem | Estado |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ------ |
| 1   | **Todo animal tem brinco hoje? Quem lê o brinco no curral?** (pergunta já enviada no levantamento e ainda sem resposta)                        | produtor  | aberta |
| 2   | O brinco é só visual ou já existe eletrônico? Existe bastão leitor na fazenda?                                                                | produtor  | aberta |
| 3   | GPS seria para todo o rebanho ou só para matriz e animal de maior valor? Com giro de 100–300 por mês, rastrear tudo pode não fechar a conta.   | produtor  | aberta |
| 4   | As fazendas têm cobertura de celular no pasto? Sem isso, o rastreador precisa ser satelital, e o custo muda de patamar.                        | produtor  | aberta |
| 5   | Já existe fornecedor de rastreio em vista? Qual o custo por animal/mês? Isso define se a feature é viável.                                     | produtor  | aberta |
| 6   | Existe balança com saída de dados no curral? Integrá-la pouparia mais digitação que o GPS.                                                     | produtor  | aberta |
| 7   | O rastreador é despesa do período ou imobilizado a depreciar?                                                                                  | contador  | aberta |
