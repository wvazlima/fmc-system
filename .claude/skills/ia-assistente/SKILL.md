---
name: ia-assistente
description: Regras do assistente agronômico — números só via tools, citar dado de origem, não prescrever defensivo nem dose, franquia de uso. Use ao implementar ou revisar qualquer funcionalidade de IA voltada ao usuário final (assistente, relatório gerado, alerta, lançamento por áudio, análise de foto).
---

# O assistente agronômico

Vale para tudo que é IA voltada ao **usuário final**: o assistente (Fase 2), relatórios
gerados, alertas automáticos, lançamento por áudio e análise de foto (Fase 3).

Duas regras da constitution governam aqui: **§4** (números são calculados por código) e
**§7** (a IA sugere, não prescreve).

## Regra 1 — o modelo nunca calcula

O assistente **não soma, não divide, não calcula percentual e não projeta resultado**.
Ele recebe números já calculados e os interpreta.

```
❌  "Aqui estão os lançamentos do talhão. Calcule o custo por saca."
✅  tool get_cost_per_bag(plotId, season) → { costPerBagCents: 45000, bags: 1000 }
    "O custo por saca do talhão Baixada na safra 26/27 foi de R$ 450,00."
```

Por quê: o produtor decide compra e venda com esse número. Número alucinado não é bug
de UX, é prejuízo. E número calculado é auditável; número de LLM não é.

**Implicação prática:** toda pergunta que envolve número precisa de uma **tool
determinística** que execute a consulta. Se a tool não existe, o assistente responde que
não tem esse dado — **não estima**.

## Regra 2 — a IA não prescreve

**Proibido:** nome comercial de defensivo + dose + momento de aplicação como
recomendação. Diagnóstico afirmativo de doença.

**Permitido:** apontar o padrão, citar o dado e encaminhar ao agrônomo.

```
❌  "Aplique Opera 0,75 L/ha nos próximos 5 dias."
❌  "O talhão está com ferrugem."
✅  "O talhão da Baixada está com vigor abaixo dos demais há três semanas, concentrado
    na parte de baixo. Não faltou chuva, e a foto de campo mais recente mostra sinais
    compatíveis com ferrugem. Vale uma vistoria do agrônomo nessa área."
```

Recomendação de defensivo e dose é **receituário agronômico** — ato privativo de
profissional habilitado, com responsabilidade técnica e legal. E erro de dose queima
lavoura.

O mesmo vale na Fase 3: a análise de maturação, de folha e de defeito é **apoio**. O
diagnóstico é do agrônomo; a classificação oficial é do classificador.

## Regra 3 — sempre citar a origem

Toda afirmação carrega o dado que a sustenta: qual talhão, qual período, qual medida,
de onde veio. O usuário precisa poder verificar.

```
✅  "Gasto com foliar 34% acima da safra passada (R$ 66 mil contra R$ 49 mil),
    considerando os lançamentos de competência até 15/03."
❌  "Seus gastos com foliar estão altos."
```

Se um dado é **projeção** (custo por saca antes do fechamento da colheita), diga que é
projeção.

Se um dado veio do **histórico importado**, diga — ele tem rigor menor (constitution
§11).

## Escopo e permissão

- O assistente respeita **exatamente** as mesmas permissões do usuário. Dono e gerente
  veem financeiro; **operador nunca** (constitution §6).
- As tools recebem o `AccessScope` e filtram por `organization_id` e pelas fazendas
  acessíveis. **Não** existe tool que ignora escopo.
- O assistente não inventa fazenda, talhão, lote ou animal que não existe.

## Franquia de uso

O assistente custa por token. A mensalidade prevê um volume.

- Contabilize consumo **por organização**.
- Alerta ao se aproximar do limite; degradação suave (relatório menos frequente), nunca
  corte abrupto no meio do trabalho.
- Relatório agendado (semanal, mensal) é gerado uma vez e reaproveitado, não regerado a
  cada abertura de tela.
- Cache do resultado de tool determinística dentro da janela em que o dado não muda.

## Lançamento por áudio (Fase 2)

- O modelo transcreve e **propõe** um lançamento estruturado. Ele **não grava direto**.
- O usuário confere e confirma. O lançamento nasce como rascunho.
- Termo do domínio é resolvido contra o `specs/glossario.md` e contra os cadastros reais
  (talhões e lotes daquela fazenda), não inventado.
- Número dito em áudio (peso, volume, quantidade) é **sempre** apresentado para
  confirmação, nunca aceito direto.

## Checklist antes de soltar qualquer funcionalidade de IA

- [ ] Nenhum número vem do modelo; todos vêm de tool determinística.
- [ ] Toda tool respeita `AccessScope` e filtra por `organization_id`.
- [ ] Nenhuma saída recomenda produto, dose ou momento de aplicação.
- [ ] Nenhuma saída afirma diagnóstico de doença.
- [ ] Toda afirmação cita o dado de origem e o período.
- [ ] Projeção é rotulada como projeção; histórico importado é sinalizado.
- [ ] Operador não recebe nada financeiro pelo assistente.
- [ ] Consumo é contabilizado por organização.
