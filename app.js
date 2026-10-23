const API_BASE = "/api";

const itensDaBiblioteca = [
  {
    titulo: "Amazonas Philatelico - Ano I nº 01",
    categoria: "revistas",
    tipo: "PDF",
    imagem: "assets/amazonas-philatelico-ano-i-n-01.png",
    descricao: "Boletim do Clube Filatélico do Amazonas, edição Ano I nº 01.",
    link: "https://drive.google.com",
  },
  {
    titulo: "Amazonas Philatelico - Ano I nº 02",
    categoria: "revistas",
    tipo: "PDF",
    imagem: "assets/amazonas-philatelico-ano-i-n-02.png",
    descricao: "Boletim do Clube Filatélico do Amazonas, edição Ano I nº 02.",
    link: "https://drive.google.com",
  },
  {
    titulo: "Amazonas Philatelico - Ano I nº 03",
    categoria: "revistas",
    tipo: "PDF",
    imagem: "assets/amazonas-philatelico-ano-i-n-03.png",
    descricao: "Boletim do Clube Filatélico do Amazonas, edição Ano I nº 03.",
    link: "https://drive.google.com",
  },
  {
    titulo: "Amazonas Philatelico - Ano II nº 04",
    categoria: "revistas",
    tipo: "PDF",
    imagem: "assets/amazonas-philatelico-ano-ii-n-04.png",
    descricao:
      "Boletim do Clube Filatélico do Amazonas, edição Ano II nº 04.",
    link: "https://drive.google.com",
  },
  {
    titulo: "Amazonas Philatelico - Ano II nº 05",
    categoria: "revistas",
    tipo: "PDF",
    imagem: "assets/amazonas-philatelico-ano-ii-n-05.png",
    descricao:
      "Boletim do Clube Filatélico do Amazonas, edição Ano II nº 05.",
    link: "https://drive.google.com",
  },
];

function escaparHtml(valor) {
  return String(valor).replace(/[&<>"']/g, (caractere) => {
    const entidades = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entidades[caractere];
  });
}

function getAdminToken() {
  return sessionStorage.getItem("cfaAdminToken");
}

async function chamarApi(caminho, opcoes = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(opcoes.headers || {}),
  };
  const token = getAdminToken();

  if (token) headers.Authorization = `Bearer ${token}`;

  const resposta = await fetch(`${API_BASE}${caminho}`, {
    ...opcoes,
    headers,
  });
  const texto = await resposta.text();
  const dados = texto ? JSON.parse(texto) : {};

  if (!resposta.ok) {
    throw new Error(dados.error || "Não foi possível concluir a operação.");
  }

  return dados;
}

function formParaObjeto(formulario) {
  return Object.fromEntries(new FormData(formulario).entries());
}

function iniciarCabecalhoFixo() {
  const cabecalhoDoSite = document.querySelector(".site-header");
  if (!cabecalhoDoSite) return;

  let estaCompacto = false;

  function sincronizarDistanciaDoTopo() {
    const alturaDaBarraSuperior =
      document.querySelector(".topbar")?.offsetHeight || 0;
    const alturaDaMarca =
      document.querySelector(".brand-panel")?.offsetHeight || 0;
    const distancia = alturaDaBarraSuperior + alturaDaMarca;

    cabecalhoDoSite.style.setProperty("--header-stick-top", `-${distancia}px`);
    return distancia;
  }

  function atualizarEstadoDoCabecalho() {
    const distancia = sincronizarDistanciaDoTopo();
    const deveCompactar = !estaCompacto && window.scrollY > distancia + 30;
    const deveExpandir =
      estaCompacto && window.scrollY < Math.max(20, distancia - 80);

    if (!deveCompactar && !deveExpandir) return;

    estaCompacto = deveCompactar;
    cabecalhoDoSite.classList.toggle("is-compact", estaCompacto);
  }

  window.addEventListener("scroll", atualizarEstadoDoCabecalho, {
    passive: true,
  });
  window.addEventListener("resize", atualizarEstadoDoCabecalho);
  atualizarEstadoDoCabecalho();
}

function iniciarNavegacaoDaPaginaInicial() {
  if (document.body.dataset.pagina !== "inicio") return;

  const links = Array.from(document.querySelectorAll('.main-nav a[href^="#"]'));
  if (!links.length) return;

  function atualizarLinkAtivo() {
    const posicaoAtual = window.scrollY + 160;
    let linkAtivo = links[0];

    links.forEach((link) => {
      const secao = document.querySelector(link.getAttribute("href"));
      if (secao && secao.offsetTop <= posicaoAtual) linkAtivo = link;
    });

    links.forEach((link) => {
      link.classList.toggle("active", link === linkAtivo);
    });
  }

  window.addEventListener("scroll", atualizarLinkAtivo, { passive: true });
  atualizarLinkAtivo();
}

function iniciarGaleriaDoClube() {
  const galeria = document.querySelector(".club-gallery-grid");
  if (!galeria || !window.HTMLDialogElement) return;

  const dialogo = document.createElement("dialog");
  const conteudo = document.createElement("div");
  const botaoFechar = document.createElement("button");
  const imagemAmpliada = document.createElement("img");
  const legenda = document.createElement("p");
  let gatilhoAtual = null;

  dialogo.className = "gallery-lightbox";
  dialogo.setAttribute("aria-modal", "true");
  conteudo.className = "gallery-lightbox-content";
  botaoFechar.className = "gallery-lightbox-close";
  botaoFechar.type = "button";
  botaoFechar.setAttribute("aria-label", "Fechar imagem ampliada");
  botaoFechar.textContent = "×";
  imagemAmpliada.className = "gallery-lightbox-image";
  legenda.className = "gallery-lightbox-caption";
  legenda.id = "gallery-lightbox-caption";
  dialogo.setAttribute("aria-labelledby", legenda.id);

  conteudo.append(botaoFechar, imagemAmpliada, legenda);
  dialogo.append(conteudo);
  document.body.append(dialogo);

  galeria.querySelectorAll("figure").forEach((item) => {
    const imagem = item.querySelector("img");
    const textoDaLegenda = item.querySelector("figcaption")?.textContent.trim();
    if (!imagem || !textoDaLegenda) return;

    const botao = document.createElement("button");
    botao.className = "gallery-thumbnail";
    botao.type = "button";
    botao.setAttribute("aria-label", `Ampliar imagem: ${textoDaLegenda}`);
    botao.append(imagem);
    item.prepend(botao);

    botao.addEventListener("click", () => {
      gatilhoAtual = botao;
      imagemAmpliada.src = imagem.currentSrc || imagem.src;
      imagemAmpliada.alt = imagem.alt;
      legenda.textContent = textoDaLegenda;
      document.body.classList.add("gallery-lightbox-open");
      dialogo.showModal();
      botaoFechar.focus();
    });
  });

  botaoFechar.addEventListener("click", () => dialogo.close());
  dialogo.addEventListener("click", (evento) => {
    if (evento.target === dialogo) dialogo.close();
  });
  dialogo.addEventListener("close", () => {
    document.body.classList.remove("gallery-lightbox-open");
    gatilhoAtual?.focus();
  });
}

function iniciarBiblioteca() {
  const gradeDaBiblioteca = document.querySelector("#libraryGrid");
  const campoBuscaBiblioteca = document.querySelector("#librarySearch");
  const filtroBiblioteca = document.querySelector("#libraryFilter");
  const campoUpload = document.querySelector("#fileInput");
  const listaUpload = document.querySelector("#uploadList");

  if (gradeDaBiblioteca && campoBuscaBiblioteca && filtroBiblioteca) {
    function renderizarBiblioteca() {
      const termo = campoBuscaBiblioteca.value.trim().toLowerCase();
      const categoria = filtroBiblioteca.value;

      const itensVisiveis = itensDaBiblioteca.filter((item) => {
        const categoriaCombina =
          categoria === "todos" || item.categoria === categoria;
        const textoPesquisavel =
          `${item.titulo} ${item.descricao} ${item.tipo}`.toLowerCase();

        return categoriaCombina && textoPesquisavel.includes(termo);
      });

      gradeDaBiblioteca.innerHTML = itensVisiveis.length
        ? itensVisiveis
            .map(
              (item) => `
                <article class="library-item" data-secao="item-biblioteca">
                  <img class="library-cover" src="${escaparHtml(item.imagem)}" alt="Capa ${escaparHtml(item.titulo)}" loading="lazy">
                  <span class="file-type">${escaparHtml(item.tipo)}</span>
                  <h3>${escaparHtml(item.titulo)}</h3>
                  <p>${escaparHtml(item.descricao)}</p>
                  <a href="${escaparHtml(item.link)}" target="_blank" rel="noreferrer">Abrir arquivo</a>
                </article>
              `,
            )
            .join("")
        : '<p class="empty-state">Nenhum arquivo encontrado para esse filtro.</p>';
    }

    campoBuscaBiblioteca.addEventListener("input", renderizarBiblioteca);
    filtroBiblioteca.addEventListener("change", renderizarBiblioteca);
    renderizarBiblioteca();
  }

  if (campoUpload && listaUpload) {
    campoUpload.addEventListener("change", () => {
      const arquivos = Array.from(campoUpload.files);

      listaUpload.innerHTML = arquivos
        .map((arquivo) => {
          const tamanhoEmMb = (arquivo.size / 1024 / 1024).toFixed(2);
          return `<li>${escaparHtml(arquivo.name)} <strong>${tamanhoEmMb} MB</strong></li>`;
        })
        .join("");
    });
  }
}

function iniciarLogin() {
  document.querySelectorAll(".login-card").forEach((formulario) => {
    formulario.addEventListener("submit", async (evento) => {
      evento.preventDefault();

      const mensagem = formulario.querySelector(".login-message");
      const ehAdministrador = formulario.dataset.login === "admin";
      const campos = formulario.querySelectorAll("input");
      const identificador = campos[0]?.value.trim();
      const senha = campos[1]?.value.trim();

      if (!mensagem) return;

      if (!ehAdministrador) {
        mensagem.textContent =
          "Área do associado preparada para integração futura.";
        return;
      }

      mensagem.textContent = "Validando acesso...";

      try {
        const dados = await chamarApi("/login", {
          method: "POST",
          body: JSON.stringify({ username: identificador, password: senha }),
        });

        sessionStorage.setItem("cfaAdminAuthenticated", "true");
        sessionStorage.setItem("cfaAdminToken", dados.token);
        window.location.href = "admin.html";
      } catch (erro) {
        sessionStorage.removeItem("cfaAdminAuthenticated");
        sessionStorage.removeItem("cfaAdminToken");
        mensagem.textContent =
          erro.message ||
          "Login administrativo indisponível. Confira as variáveis do backend.";
      }
    });
  });
}

function iniciarPainelAdministrativo() {
  const painelAdministrativo = document.querySelector("[data-admin-app]");
  if (!painelAdministrativo) return;

  const estaAutenticado =
    sessionStorage.getItem("cfaAdminAuthenticated") === "true" &&
    Boolean(getAdminToken());
  const conteudoProtegido = painelAdministrativo.querySelector(
    "[data-admin-content]",
  );
  const conteudoBloqueado = painelAdministrativo.querySelector(
    "[data-admin-locked]",
  );
  const botaoSair = painelAdministrativo.querySelector("[data-admin-logout]");
  const formulariosAdmin =
    painelAdministrativo.querySelectorAll("[data-admin-form]");

  painelAdministrativo.classList.toggle("is-authenticated", estaAutenticado);

  if (conteudoProtegido) conteudoProtegido.hidden = !estaAutenticado;
  if (conteudoBloqueado) conteudoBloqueado.hidden = estaAutenticado;

  botaoSair?.addEventListener("click", () => {
    sessionStorage.removeItem("cfaAdminAuthenticated");
    sessionStorage.removeItem("cfaAdminToken");
    window.location.href = "login.html";
  });

  formulariosAdmin.forEach((formulario) => {
    formulario.addEventListener("submit", async (evento) => {
      evento.preventDefault();

      const status = formulario.querySelector("[data-form-status]");
      const endpoint = formulario.dataset.endpoint;
      const metodo = formulario.dataset.method || "POST";

      if (!status || !endpoint) return;

      status.textContent = "Salvando...";

      try {
        await chamarApi(endpoint, {
          method: metodo,
          body: JSON.stringify(formParaObjeto(formulario)),
        });
        formulario.reset();
        status.textContent = "Conteúdo salvo no banco de dados.";
      } catch (erro) {
        status.textContent =
          erro.message || "Não foi possível salvar. Verifique o backend.";
      }
    });
  });
}

iniciarCabecalhoFixo();
iniciarNavegacaoDaPaginaInicial();
iniciarGaleriaDoClube();
iniciarBiblioteca();
iniciarLogin();
iniciarPainelAdministrativo();
