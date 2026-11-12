# Avaliação Geral do Projeto Filminis - Frontend

**Data:** 2026-11-12  
**Status do Backend:** ✅ Pronto (API completa, testada e documentada)  
**Status do Frontend:** 🟡 Parcial - Base estruturada, funcionalidades críticas faltando

---

## Resumo Executivo

O backend (Filminis API) está **completo e funcional** com:
- Autenticação JWT (Access + Refresh Token + Blacklist)
- Controle de roles (Admin/User)
- CRUD completo de Filmes, Atores, Diretores
- Dados auxiliares (Categorias, Produtoras, Linguagens, Países, Gêneros)
- Fluxo de aprovação de filmes
- Documentação OpenAPI/Swagger
- Testes automatizados

O frontend possui **estrutura base** (React + Vite + React Router) com:
- ✅ Layout com Header/Footer
- ✅ Página de Login (UI completa)
- ✅ Página de Listagem de Filmes (Grid/Lista + Paginação + Busca)
- ✅ Landing Page
- ✅ Context de Autenticação (básico)
- ✅ Componentes reutilizáveis (Button, Input, Field)
- ❌ **Integração real com API** (apenas listagem pública)
- ❌ **Páginas protegidas e funcionalidades autenticadas**

---

## Requisitos Críticos (Bloqueadores para MVP)

### 1. Autenticação e Autorização Completa
| Item | Status | Backend Endpoint | Observação |
|------|--------|------------------|------------|
| Login com JWT | 🟡 Parcial | `POST /send_loginho` | UI pronta, mas AuthContext não persiste tokens |
| Refresh Token | ❌ Ausente | `POST /refresh` | Necessário para sessões longas |
| Logout com Blacklist | ❌ Ausente | `POST /logout` | Segurança: invalidar refresh token no servidor |
| Persistência de Sessão | ❌ Ausente | - | Usar localStorage/cookies httpOnly |
| Proteção de Rotas | ❌ Ausente | - | `ProtectedRoute` + `AdminRoute` |
| Redirecionamento pós-login | 🟡 Parcial | - | Login navega para `/`, mas não restaura rota original |
| Perfil do Usuário (`/me`) | ❌ Ausente | `GET /me` | Exibir dados, avatar, role |
| Edição de Perfil | ❌ Ausente | `PATCH /edit/me` | Nome, sobrenome, apelido, foto |

### 2. Gestão de Filmes (Core Business)
| Item | Status | Backend Endpoint | Observação |
|------|--------|------------------|------------|
| Listagem Pública | ✅ Pronto | `GET /listagem` | Já implementado em Movies.jsx |
| Detalhe do Filme | ❌ Ausente | `GET /filme?id=` | Página `/movies/:id` com info completa |
| Cadastro de Filme (User) | ❌ Ausente | `POST /cadastrani` | Form multi-step: dados + relacionamentos |
| Aprovação de Filme (Admin) | ❌ Ausente | `PUT /aprovafilme?id=` | Lista de pendentes + botão aprovar |
| Edição de Filme (Admin) | ❌ Ausente | `PATCH /filme?id=` | Form pré-preenchido |
| Exclusão de Filme (Admin) | ❌ Ausente | `DELETE /filme?id=` | Confirmação modal |
| Filmes Pendentes (Admin) | ❌ Ausente | `GET /filmes-pendentes` | Dashboard de moderação |

### 3. Gestão de Atores e Diretores
| Item | Status | Backend Endpoint | Observação |
|------|--------|------------------|------------|
| Listagem Pública | ❌ Ausente | `GET /atores`, `GET /diretores` | Páginas dedicadas |
| Detalhe (Público) | ❌ Ausente | `GET /ator?id=`, `GET /diretor?id=` | Páginas de perfil |
| Cadastro (User) | ❌ Ausente | `POST /addCat` | Form com foto URL + gênero |
| Edição (Admin) | ❌ Ausente | `PATCH /ator?id=`, `PATCH /diretor?id=` | |
| Exclusão (Admin) | ❌ Ausente | `DELETE /atores?id=`, `DELETE /diretores?id=` | |

### 4. Dados Auxiliares (Cadastros de Apoio)
| Item | Status | Backend Endpoint | Observação |
|------|--------|------------------|------------|
| Categorias | ❌ Ausente | `GET /categorias`, `POST /addCat` | Select no cadastro de filme |
| Produtoras | ❌ Ausente | `GET /produtoras`, `POST /addCat` | Select no cadastro de filme |
| Linguagens | ❌ Ausente | `GET /linguagens`, `POST /addCat` | Multi-select no cadastro |
| Países | ❌ Ausente | `GET /paises`, `POST /addCat` | Multi-select (origem + pessoas) |
| Gêneros (Pessoas) | ❌ Ausente | - | Select no cadastro ator/diretor |

### 5. Administração de Usuários (Admin)
| Item | Status | Backend Endpoint | Observação |
|------|--------|------------------|------------|
| Listar Usuários | ❌ Ausente | `GET /usuarios` | Tabela com role, actions |
| Alterar Role | ❌ Ausente | `PATCH /user/role?id=` | Dropdown user↔admin |

---

## Requisitos Desejáveis (Pós-MVP / Qualidade)

### UX/UI e Funcionalidades Avançadas
| Item | Prioridade | Descrição |
|------|------------|-----------|
| Busca com Debounce | 🟢 Alta | Evitar requests excessivos ao digitar |
| Filtros Avançados | 🟢 Alta | Por categoria, ano, duração, status |
| Ordenação | 🟢 Alta | Título, ano, duração, popularidade |
| Infinite Scroll / Load More | 🟡 Média | Alternativa à paginação tradicional |
| Favoritos / Watchlist | 🟡 Média | Persistir no backend ou localStorage |
| Avaliações / Reviews | 🟡 Média | Sistema de notas e comentários |
| Modo Escuro/Claro | 🟡 Média | Toggle no header, persistir preferência |
| Internacionalização (i18n) | 🔵 Baixa | PT-BR / EN |
| PWA / Offline | 🔵 Baixa | Service Worker, cache estratégico |

### Acessibilidade (a11y)
| Item | Prioridade | Descrição |
|------|------------|-----------|
| ARIA Labels completos | 🟢 Alta | Botões, inputs, navegação |
| Navegação por Teclado | 🟢 Alta | Focus visible, skip links |
| Contraste de Cores | 🟢 Alta | WCAG AA mínimo |
| Screen Reader Support | 🟡 Média | Live regions para loading/erros |

### Performance e Qualidade
| Item | Prioridade | Descrição |
|------|------------|-----------|
| React Query / SWR | 🟢 Alta | Cache, dedup, background refetch |
| Code Splitting | 🟢 Alta | Lazy load routes (`React.lazy`) |
| Image Optimization | 🟡 Média | Lazy load, WebP, placeholders |
| Error Boundaries | 🟡 Média | Capturar erros de renderização |
| Testes (Vitest + RTL) | 🟡 Média | Unit + Integration + E2E |
| CI/CD Pipeline | 🟡 Média | Lint, test, build, deploy |

### Segurança
| Item | Prioridade | Descrição |
|------|------------|-----------|
| CSP Headers | 🟢 Alta | Content Security Policy |
| Sanitização de Inputs | 🟢 Alta | DOMPurify para sinopses/HTML |
| Rate Limiting (Client) | 🟡 Média | Evitar spam de requests |
| Secure Cookie Storage | 🟢 Alta | httpOnly, SameSite, Secure |

---

## Gap Analysis: Frontend Atual vs. Necessário

### Componentes Existentes (Reutilizáveis)
```
✅ Button (variants, loading, fullWidth)
✅ Input (controlled, placeholder, types)
✅ Field (label, hint, error, required)
✅ Header (logo, nav links)
✅ Footer
✅ Card (filme - Movies.jsx)
✅ Layout (DefaultLayout com Outlet)
```

### Componentes a Criar
```
🔴 ProtectedRoute / AdminRoute (HOC ou wrapper)
🔴 MovieDetailPage (/movies/:id)
🔴 MovieForm (create/edit - multi-step)
🔴 PendingMoviesList (admin)
🔴 ActorList / ActorDetail / ActorForm
🔴 DirectorList / DirectorDetail / DirectorForm
🔴 AuxiliaryDataManager (categorias, produtoras, etc.)
🔴 UserProfile / UserEditForm
🔴 AdminUserManagement (table + role change)
🔴 SearchBar com debounce + filtros
🔴 Modal/Dialog (confirmações, forms)
🔴 Toast/Notification System
🔴 Loading Skeletons
🔴 Empty States
🔴 Error Display (API errors amigáveis)
```

### Serviços API a Implementar (`services/api.js`)
```javascript
// Auth
✅ sendLogin(email, password)
❌ refreshToken(refreshToken)
❌ logout(refreshToken)
❌ getMe(accessToken)
❌ updateMe(accessToken, data)

// Filmes
✅ movies() // listagem pública
❌ getMovie(id, accessToken?)
❌ createMovie(accessToken, data)
❌ updateMovie(accessToken, id, data)
❌ deleteMovie(accessToken, id)
❌ approveMovie(accessToken, id)
❌ getPendingMovies(accessToken)

// Atores
❌ getActors()
❌ getActor(id)
❌ createActor(accessToken, data)
❌ updateActor(accessToken, id, data)
❌ deleteActor(accessToken, id)

// Diretores
❌ getDirectors()
❌ getDirector(id)
❌ createDirector(accessToken, data)
❌ updateDirector(accessToken, id, data)
❌ deleteDirector(accessToken, id)

// Dados Auxiliares
❌ getCategories()
❌ getProducers()
❌ getLanguages()
❌ getCountries()
❌ createAuxiliary(accessToken, cat, nome, genero?, foto?)

// Admin Users
❌ getUsers(accessToken)
❌ updateUserRole(accessToken, id, role)
```

### Rotas a Adicionar (`routes/index.jsx`)
```jsx
// Públicas
/                    → Landpage (✅)
/movies              → Movies (✅)
/movies/:id          → MovieDetail (❌)
/actors              → ActorList (❌)
/actors/:id          → ActorDetail (❌)
/directors           → DirectorList (❌)
/directors/:id       → DirectorDetail (❌)
/login               → Login (✅)
/register            → Register (❌)

// Autenticadas (User + Admin)
/profile             → UserProfile (❌)
/profile/edit        → UserEditForm (❌)
/movies/new          → MovieForm (create) (❌)
/movies/:id/edit     → MovieForm (edit) (❌)
/actors/new          → ActorForm (❌)
/actors/:id/edit     → ActorForm (❌)
/directors/new       → DirectorForm (❌)
/directors/:id/edit  → DirectorForm (❌)

// Admin only
/admin/pending       → PendingMoviesList (❌)
/admin/users         → AdminUserManagement (❌)
/admin/categories    → AuxiliaryManager (❌)
/admin/producers     → AuxiliaryManager (❌)
/admin/languages     → AuxiliaryManager (❌)
/admin/countries     → AuxiliaryManager (❌)
```

---

## Plano de Implementação Sugerido

### Fase 1: Fundação de Auth (1-2 dias)
1. Completar `AuthContext` com persistência (localStorage)
2. Implementar `refreshToken`, `logout`, `getMe`, `updateMe` no `api.js`
3. Criar `ProtectedRoute` e `AdminRoute`
4. Adicionar `/register` page
5. Integrar Header com estado de login (avatar, dropdown, logout)

### Fase 2: Filmes - Leitura Completa (1-2 dias)
1. `MovieDetailPage` com todos os campos do backend
2. Navegação from Movies list → Detail
3. Carregar relacionamentos (atores, diretores, categorias, etc.)

### Fase 3: Filmes - Escrita (User) (2-3 dias)
1. `MovieForm` multi-step (dados básicos → relacionamentos)
2. Selects carregando dados auxiliares da API
3. Validação client-side + feedback de erros da API
4. Integração com `createMovie`

### Fase 4: Admin - Moderação (1-2 dias)
1. `PendingMoviesList` com cards + botão aprovar
2. `approveMovie` integration
3. Badges de status (pendente/aprovado/rejeitado)

### Fase 5: Atores/Diretores + Dados Auxiliares (2-3 dias)
1. List/Detail pages (públicas)
2. Forms de criação (autenticado)
3. Forms de edição/exclusão (admin)
4. Manager para categorias, produtoras, linguagens, países

### Fase 6: Admin Users + Perfil (1 dia)
1. `UserProfile` + `UserEditForm`
2. `AdminUserManagement` table + role change

### Fase 7: Polimento & Qualidade (2-3 dias)
1. React Query / SWR para cache
2. Error Boundaries + Toast system
3. Loading skeletons + empty states
4. Testes básicos
5. Code splitting (lazy routes)
6. Acessibilidade review

---

## Estimativa de Esforço Total

| Fase | Dias | Tipo |
|------|------|------|
| 1. Auth Foundation | 2 | Crítico |
| 2. Movie Reading | 2 | Crítico |
| 3. Movie Writing | 3 | Crítico |
| 4. Admin Moderation | 2 | Crítico |
| 5. Actors/Directors/Aux | 3 | Crítico |
| 6. Admin Users/Profile | 1 | Crítico |
| 7. Polish & Quality | 3 | Desejável |
| **Total** | **~16 dias** | |

---

## Riscos e Dependências

1. **Backend CORS** - Verificar se `Access-Control-Allow-Credentials` + origins configurados
2. **Refresh Token Rotation** - Backend implementa? Frontend deve lidar com novo refresh token
3. **Upload de Imagens** - Backend aceita apenas URLs; considerar integração com serviço de upload (Cloudinary, S3 presigned)
4. **Validação Duplicada** - Manter validações no frontend sincronizadas com backend
5. **Estados de Loading Globais** - Implementar `NProgress` ou similar para UX

---

## Próximos Passos Imediatos

1. [ ] Completar `services/api.js` com todos os endpoints
2. [ ] Evoluir `AuthContext` para persistência + refresh automático
3. [ ] Criar `ProtectedRoute` / `AdminRoute`
4. [ ] Implementar `MovieDetailPage`
5. [ ] Começar `MovieForm` (create)

---

*Documento gerado automaticamente baseado na análise do código atual (backend + frontend) e especificação OpenAPI.*