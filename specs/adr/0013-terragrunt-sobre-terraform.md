# ADR-0013 · Terragrunt sobre Terraform

|               |            |
| ------------- | ---------- |
| **Data**      | 2026-09-29 |
| **Estado**    | aceito     |
| **Substitui** | —          |

## Contexto

A infraestrutura usa **dois providers** (Google e Cloudflare, ADR-0006) e, na Fase 1,
**um único ambiente de nuvem** — `prod` — porque o `local` em Docker faz o papel de
desenvolvimento (ADR-0014). Ambientes adicionais entram depois do go-live, conforme as
condições de disparo daquele ADR.

Queremos **estado separado por componente** — rede, Cloud SQL, Cloud Run, storage,
Cloudflare — e não um estado monolítico. O motivo é raio de explosão: um `apply` que
mexe no Worker de borda não pode ter o Cloud SQL de produção no mesmo plano.

Isso dá, hoje, **cerca de cinco raízes Terraform**, cada uma precisando de bloco
`backend`, bloco `provider`, versões fixadas e variáveis comuns (projeto, região,
labels de custo). O bloco `backend` do Terraform **não aceita interpolação**, então
nem variável resolve a duplicação.

A infraestrutura **ainda não foi escrita** (ADR-0014): o desenvolvimento roda inteiro
em Docker. Decidir o layout agora custa nada; decidir depois significa reescrever
caminhos e chaves de estado.

**Sejamos honestos sobre o tamanho do problema hoje:** com um ambiente e cinco raízes,
o Terraform puro com `-backend-config` seria administrável. O argumento pró-Terragrunt
aqui **não é** a duplicação atual — é o que vem a seguir.

## Decisão

Usamos **Terragrunt** como camada fina sobre o **Terraform**.

- **Terraform** define os módulos: o que a infraestrutura é.
- **Terragrunt** define as raízes por ambiente e componente: backend, provider,
  variáveis comuns e dependências entre componentes.

Layout:

```
infra/terraform/
├── modules/                      # módulos Terraform reutilizáveis (.tf)
│   ├── cloud_run_service/
│   ├── cloud_sql_postgis/
│   ├── cloud_storage/
│   ├── cloudflare_edge/
│   └── ...
├── root.hcl                      # backend, providers e locals comuns (gerados)
└── environments/
    └── prod/
        ├── env.hcl               # project_id, região, labels do ambiente
        ├── network/terragrunt.hcl
        ├── database/terragrunt.hcl
        ├── storage/terragrunt.hcl
        ├── api/terragrunt.hcl
        └── edge/terragrunt.hcl
```

Um ambiente novo é um diretório novo em `environments/`, com seu `env.hcl`. Nenhum
módulo muda.

Regras firmadas:

1. **Um estado por componente por ambiente.** A chave do backend é derivada do caminho
   (`path_relative_to_include()`), nunca escrita à mão.
2. **`backend` e `provider` são gerados** por `generate` no `root.hcl`. Nenhum módulo
   declara backend.
3. **Dependência entre componentes é explícita** via bloco `dependency`, com
   `mock_outputs` para que o `plan` funcione antes do primeiro `apply`.
4. **Versão do Terraform e dos providers fixada** no `root.hcl`, valendo para tudo.
5. **`run-all apply` e `run-all destroy` são proibidos** sem confirmação humana
   explícita. Estão no `deny` de `.claude/settings.json`.
6. **Nada de `.tf` ou `.hcl` escrito enquanto a Fase 1 rodar apenas em local.** A
   estrutura e as regras existem; os arquivos nascem quando houver ambiente de nuvem
   para aplicá-los (ADR-0014).

## Alternativas consideradas

### Terraform puro, com `-backend-config` por raiz

- **A favor:** uma ferramenta a menos; é o caminho que a documentação oficial assume;
  qualquer pessoa que sabe Terraform opera sem aprender nada novo; **e com cinco raízes
  e um ambiente, hoje, seria suficiente.**
- **Contra:** `provider` e versões continuam duplicados em cada raiz; o `backend`
  exige `-backend-config` na linha de comando, o que vira script de shell ou um
  Makefile que reimplementa mal o que o Terragrunt já faz; e não há ordenação de
  dependência entre componentes — a ordem vira conhecimento na cabeça de quem aplica.
- **Por que não:** a duplicação cresce com **raízes × ambientes**. Com o segundo
  ambiente (que o ADR-0014 prevê para depois do go-live), são 10 raízes; com o terceiro, 15. Migrar para Terragrunt depois significa mover chaves de estado, que é a operação
  mais desagradável que existe em Terraform. O custo de adotar agora é quase zero,
  porque **não há nenhum arquivo escrito ainda**.

### Terraform workspaces

- **A favor:** nativo, sem ferramenta extra.
- **Contra:** workspaces compartilham **o mesmo backend e a mesma configuração de
  provider**, mudando só o estado. Nossos ambientes serão **projetos GCP diferentes**,
  com credenciais e buckets de estado diferentes. E é fácil aplicar no workspace errado
  — o ambiente vira estado de sessão, não caminho no disco.
- **Por que não:** workspaces servem para variações do mesmo ambiente, não para
  ambientes isolados.

### Um estado monolítico

- **A favor:** bem mais simples; sem dependências entre raízes.
- **Contra:** todo `apply` em produção carrega o Cloud SQL no plano; um erro de
  refresh ou um `taint` mal colocado põe o banco em risco; o `plan` fica lento.
- **Por que não:** raio de explosão inaceitável em produção — ainda mais com **um único
  ambiente** (ADR-0014), onde não há rede de segurança.

### Pulumi

- **A favor:** TypeScript em tudo (ADR-0001), sem HCL, com testes de verdade.
- **Contra:** o ecossistema Terraform para Cloudflare e para o GCP é mais maduro; o
  estado fica no serviço da Pulumi ou exige backend próprio.
- **Por que não:** o escopo já fechou Terraform, e não há ganho claro que justifique
  reabrir. Fica registrado como caminho possível, não recomendado.

## Consequências

**Positivas**

- Backend, provider e versões definidos **uma vez**, herdados por todas as raízes.
- Chave de estado derivada do caminho: impossível dois componentes colidirem.
- Dependência entre componentes explícita e ordenada, em vez de conhecimento tácito.
- Ambiente é **caminho no disco**, não estado de sessão — não dá para aplicar no lugar
  errado por engano.
- Raio de explosão pequeno: um `apply` toca um componente.
- Acrescentar o segundo ambiente é criar um diretório, não reestruturar.

**Negativas e custos aceitos**

- Mais uma ferramenta para instalar, versionar e aprender. **Com um ambiente só, o
  ganho imediato é modesto** — estamos pagando agora por uma estrutura que se paga
  quando o segundo ambiente chegar.
- Terragrunt é de terceiro (Gruntwork): acompanha as versões do Terraform com atraso, e
  já houve mudança de sintaxe entre versões maiores. A versão fica fixada.
- Mensagem de erro do Terragrunt é pior que a do Terraform, e o `generate` acrescenta
  uma camada de indireção ao depurar.
- `run-all` é perigoso por construção. Por isso está no `deny`.

**O que passa a ser proibido**

- Bloco `backend` ou `provider` escrito dentro de um módulo.
- Chave de estado escrita à mão.
- Terraform workspaces.
- `terragrunt run-all apply` e `run-all destroy` sem confirmação humana explícita.
- Escrever `.tf` ou `.hcl` antes de existir um ambiente de nuvem onde aplicá-los.

## Como verificar que a decisão está sendo respeitada

`.claude/rules/infra.md` (escopo em `infra/**` e `**/*.hcl`); agente `infra-cloud`;
skill `gcp-deploy`; `deny` em `.claude/settings.json`; o CI roda `terraform fmt -check`
e `terragrunt hclfmt --check` quando houver arquivos.
