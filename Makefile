# Ambiente local completo em Docker (ADR-0010).
# `make help` lista os alvos.

SHELL := /bin/bash
.DEFAULT_GOAL := help
COMPOSE := docker compose
# serviços que expõem um endpoint de saúde verificável de fora
-include .env
WEB_HOST_PORT ?= 3010
API_HOST_PORT ?= 3011
EDGE_HOST_PORT ?= 8787
AUTH_HOST_PORT ?= 9098
STORAGE_HOST_PORT ?= 9000
STORAGE_MASTER_HOST_PORT ?= 9333
MAIL_UI_HOST_PORT ?= 8026
DB_HOST_PORT ?= 5442
RUNTIME_SERVICES := db auth storage mail api worker edge web
HTTP_SERVICES := api:$(API_HOST_PORT)/health edge:$(EDGE_HOST_PORT)/__edge/health web:$(WEB_HOST_PORT)/ auth:$(AUTH_HOST_PORT)/

.PHONY: help
help: ## Lista os alvos disponíveis
	@grep -hE '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	 | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

.PHONY: env
env: ## Cria o .env a partir do .env.example, se ainda não existir
	@test -f .env || (cp .env.example .env && echo "  .env criado a partir do .env.example")

.PHONY: up
up: env ## Sobe a stack completa (constrói o que faltar) e espera ficar saudável
	$(COMPOSE) up -d --build
	@# Espera só os serviços de longa duração: `install` e `storage-init` rodam e saem.
	$(COMPOSE) up -d --wait --wait-timeout 600 $(RUNTIME_SERVICES)
	@$(MAKE) --no-print-directory health

.PHONY: down
down: ## Derruba a stack, preservando os volumes
	$(COMPOSE) down

.PHONY: clean
clean: ## Derruba a stack e APAGA os volumes (banco zerado)
	$(COMPOSE) down -v --remove-orphans

.PHONY: rebuild
rebuild: ## Reconstrói as imagens sem cache
	$(COMPOSE) build --no-cache
	$(COMPOSE) up -d
	$(COMPOSE) up -d --wait --wait-timeout 600 $(RUNTIME_SERVICES)

.PHONY: ps
ps: ## Estado e saúde dos containers
	$(COMPOSE) ps

.PHONY: logs
logs: ## Segue o log de tudo (ou de um serviço: make logs s=api)
	@if [ -n "$(s)" ]; then $(COMPOSE) logs -f --tail=200 $(s); \
	else $(COMPOSE) logs -f --tail=100; fi

.PHONY: sh
sh: ## Shell dentro de um container: make sh s=api
	@test -n "$(s)" || (echo "Uso: make sh s=<serviço>"; exit 1)
	$(COMPOSE) exec $(s) sh

.PHONY: health
health: ## Verifica a saúde de todos os serviços
	@echo "── Saúde dos containers ─────────────────────────────────────────"
	@$(COMPOSE) ps --format '  {{.Service}}\t{{.State}}\t{{.Health}}' 2>/dev/null \
	 || $(COMPOSE) ps
	@echo
	@echo "── Endpoints ────────────────────────────────────────────────────"
	@fail=0; \
	for entry in $(HTTP_SERVICES); do \
	  name=$${entry%%:*}; rest=$${entry#*:}; \
	  if curl -fsS --max-time 5 "http://localhost:$$rest" > /dev/null 2>&1; then \
	    printf "  \033[32m✓\033[0m %-6s http://localhost:%s\n" "$$name" "$$rest"; \
	  else \
	    printf "  \033[31m✗\033[0m %-6s http://localhost:%s\n" "$$name" "$$rest"; fail=1; \
	  fi; \
	done; \
	if $(COMPOSE) exec -T db pg_isready -U $${POSTGRES_USER:-fmc} -d $${POSTGRES_DB:-fmc} >/dev/null 2>&1; then \
	  printf "  \033[32m✓\033[0m %-6s postgres://localhost:$(DB_HOST_PORT)\n" "db"; \
	else printf "  \033[31m✗\033[0m %-6s postgres://localhost:$(DB_HOST_PORT)\n" "db"; fail=1; fi; \
	if curl -fsS --max-time 5 http://localhost:$(STORAGE_MASTER_HOST_PORT)/cluster/healthz >/dev/null 2>&1; then \
	  printf "  \033[32m✓\033[0m %-6s http://localhost:$(STORAGE_HOST_PORT)\n" "storage"; \
	else printf "  \033[31m✗\033[0m %-6s http://localhost:$(STORAGE_HOST_PORT)\n" "storage"; fail=1; fi; \
	if curl -fsS --max-time 5 http://localhost:$(MAIL_UI_HOST_PORT)/ >/dev/null 2>&1; then \
	  printf "  \033[32m✓\033[0m %-6s http://localhost:$(MAIL_UI_HOST_PORT)\n" "mail"; \
	else printf "  \033[31m✗\033[0m %-6s http://localhost:$(MAIL_UI_HOST_PORT)\n" "mail"; fail=1; fi; \
	echo; \
	if [ $$fail -eq 0 ]; then echo "  Tudo saudável."; \
	else echo "  Há serviço fora do ar. Veja: make logs s=<serviço>"; exit 1; fi

.PHONY: migrate
migrate: ## Aplica as migrações no banco local
	$(COMPOSE) exec -T api pnpm --filter @fmc/db db:migrate

.PHONY: seed
seed: ## Popula dados de desenvolvimento (fictícios)
	$(COMPOSE) exec -T api pnpm --filter @fmc/db db:seed

.PHONY: psql
psql: ## Abre o psql no banco local
	$(COMPOSE) exec db psql -U $${POSTGRES_USER:-fmc} -d $${POSTGRES_DB:-fmc}

.PHONY: test
test: ## Roda os testes dentro dos containers
	$(COMPOSE) run --rm tools pnpm test

.PHONY: check
check: ## Formatação + lint + typecheck + test + build, dentro dos containers
	$(COMPOSE) run --rm tools sh -c "pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build"

.PHONY: install
install: ## Reinstala as dependências dentro dos containers
	$(COMPOSE) run --rm install
