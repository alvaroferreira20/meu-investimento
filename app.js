var valuesHidden = localStorage.getItem("hideValues") === "true";

function toggleHideValues() {
  valuesHidden = !valuesHidden;
  localStorage.setItem("hideValues", valuesHidden);
  document.querySelectorAll(".card-value, .positive, .negative, td").forEach(function(el) {
    if (el.textContent.match(/R\$/)) {
      el.style.filter = valuesHidden ? "blur(8px)" : "none";
      el.style.userSelect = valuesHidden ? "none" : "auto";
    }
  });
}

function applyHide() {
  if (valuesHidden) {
    setTimeout(function() {
      document.querySelectorAll(".card-value, .positive, .negative, td").forEach(function(el) {
        if (el.textContent.match(/R\$/)) {
          el.style.filter = "blur(8px)";
          el.style.userSelect = "none";
        }
      });
    }, 100);
  }
}


function toggleMobileMenu() {
  document.getElementById("mobile-menu").classList.toggle("open");
  document.getElementById("mobile-menu-overlay").classList.toggle("open");
}

function showPageMobile(page) {
  toggleMobileMenu();
  document.querySelectorAll("main > div").forEach(function(d) { d.style.display = "none"; });
  document.getElementById("page-" + page).style.display = "block";
  renderPage(page);
}

// Data Storage
function getData(key) { return JSON.parse(localStorage.getItem(key) || "[]"); }
function setData(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
function getProfile() { return JSON.parse(localStorage.getItem("profile") || "{}"); }
function setProfile(p) { localStorage.setItem("profile", JSON.stringify(p)); }

// Navigation
function showPage(page) {
  document.querySelectorAll("main > div").forEach(d => d.style.display = "none");
  document.getElementById("page-" + page).style.display = "block";
  document.querySelectorAll("#sidebar a").forEach(a => a.classList.remove("active"));
  event.target.classList.add("active");
  renderPage(page);
}

function toggleTheme() {
  var t = document.documentElement.getAttribute("data-theme") === "dark" ? "" : "dark";
  document.documentElement.setAttribute("data-theme", t);
  localStorage.setItem("theme", t);
}

// Format currency
function fmt(v) { return "R$ " + Number(v || 0).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, "."); }

// Render pages
function renderPage(page) {
  switch(page) {
    case "dashboard": renderDashboard(); break;
    case "receitas": renderReceitas(); break;
    case "gastos": renderGastos(); break;
    case "metas": renderMetas(); break;
    case "investimentos": renderInvestimentos(); break;
    case "bancos": renderBancos(); break;
    case "perfil": renderPerfil(); break;
  }
}

function renderDashboard() {
  var el = document.getElementById("page-dashboard");
  var receitas = getData("receitas");
  var gastos = getData("gastos");
  var metas = getData("metas");
  var profile = getProfile();
  var now = new Date();
  var mes = now.getMonth();
  var ano = now.getFullYear();

  var recMes = receitas.filter(r => { var d = new Date(r.data); return d.getMonth() === mes && d.getFullYear() === ano; }).reduce((s,r) => s + Number(r.valor), 0);
  var gasMes = gastos.filter(g => { var d = new Date(g.data); return d.getMonth() === mes && d.getFullYear() === ano; }).reduce((s,g) => s + Number(g.valor), 0) + getParcelasMes();
  var econMes = recMes - gasMes;
  var totalRec = receitas.reduce((s,r) => s + Number(r.valor), 0);
  var totalGas = gastos.reduce((s,g) => s + Number(g.valor), 0);
  var saldo = totalRec - totalGas;
  var totalInvest = getData('investimentos').reduce(function(s,inv) { return s + Number(inv.valor); }, 0);

  el.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center"><h1 class="page-title">Dashboard</h1><button class="btn" onclick="toggleHideValues()" style="font-size:0.75rem">' + (valuesHidden ? 'Mostrar Valores' : 'Ocultar Valores') + '</button></div>' +
    '<p style="color:var(--text2);margin-bottom:1.5rem">Ola, ' + (profile.nome || "Usuario") + ' - ' + now.toLocaleDateString("pt-BR") + '</p>' +
    '<div class="cards-grid">' +
    '<div class="card"><div class="card-label">Saldo Disponivel</div><div class="card-value ' + (saldo >= 0 ? "positive" : "negative") + '">' + fmt(saldo) + '</div></div>' +
    '<div class="card"><div class="card-label">Recebido no Mes</div><div class="card-value positive">' + fmt(recMes) + '</div></div>' +
    '<div class="card"><div class="card-label">Gasto no Mes</div><div class="card-value negative">' + fmt(gasMes) + '</div></div>' +
    '<div class="card"><div class="card-label">Economia do Mes</div><div class="card-value ' + (econMes >= 0 ? "positive" : "negative") + '">' + fmt(econMes) + '</div></div>' +
    '<div class="card"><div class="card-label">Total Investido</div><div class="card-value positive">' + fmt(totalInvest) + '</div></div>' +
    '<div class="card"><div class="card-label">Total Recebido</div><div class="card-value">' + fmt(totalRec) + '</div></div>' +
    '<div class="card"><div class="card-label">Total Gasto</div><div class="card-value">' + fmt(totalGas) + '</div></div>' +
    '<div class="card"><div class="card-label">Parcelas Ativas</div><div class="card-value negative">' + fmt(getParcelasMes()) + '/mes</div></div>' +
    '</div>' +
    '<div class="section"><div class="section-title">Gastos por Categoria (Mes)</div><div class="chart-container"><canvas id="chart-gastos"></canvas></div></div>' +
    '<div class="section"><div class="section-title">Receitas x Gastos (Ultimos 6 meses)</div><div class="chart-container"><canvas id="chart-evolucao"></canvas></div></div>';

  // Chart gastos por categoria
  var catGastos = {};
  gastos.filter(g => { var d = new Date(g.data); return d.getMonth() === mes && d.getFullYear() === ano; }).forEach(g => {
    catGastos[g.categoria] = (catGastos[g.categoria] || 0) + Number(g.valor);
  });
  if (Object.keys(catGastos).length > 0) {
    new Chart(document.getElementById("chart-gastos"), {
      type: "doughnut",
      data: { labels: Object.keys(catGastos), datasets: [{ data: Object.values(catGastos), backgroundColor: ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316","#06b6d4","#84cc16"] }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "right" } } }
    });
  }

  // Chart evolucao
  var meses = [];
  for (var i = 5; i >= 0; i--) {
    var d = new Date(ano, mes - i, 1);
    meses.push({ m: d.getMonth(), a: d.getFullYear(), label: d.toLocaleDateString("pt-BR", {month:"short"}) });
  }
  var recData = meses.map(m => receitas.filter(r => { var d = new Date(r.data); return d.getMonth() === m.m && d.getFullYear() === m.a; }).reduce((s,r) => s + Number(r.valor), 0));
  var gasData = meses.map(m => gastos.filter(g => { var d = new Date(g.data); return d.getMonth() === m.m && d.getFullYear() === m.a; }).reduce((s,g) => s + Number(g.valor), 0));
  new Chart(document.getElementById("chart-evolucao"), {
    type: "bar",
    data: { labels: meses.map(m => m.label), datasets: [{ label: "Receitas", data: recData, backgroundColor: "#10b981" }, { label: "Gastos", data: gasData, backgroundColor: "#ef4444" }] },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

function renderReceitas() {
  var el = document.getElementById("page-receitas");
  var receitas = getData("receitas");
  var cats = ["Salario","Vale Alimentacao","Vale Refeicao","Bonus","PPR","Dividendos","Renda Extra","Freelancer","Outros"];

  el.innerHTML = '<h1 class="page-title">Receitas</h1>' +
    '<div class="section"><div class="section-title">Nova Receita</div>' +
    '<div class="form-grid">' +
    '<div class="form-group"><label>Valor</label><input type="number" id="rec-valor" step="0.01"></div>' +
    '<div class="form-group"><label>Categoria</label><select id="rec-cat">' + cats.map(c => "<option>" + c + "</option>").join("") + '</select></div>' +
    '<div class="form-group"><label>Data</label><input type="date" id="rec-data" value="' + new Date().toISOString().split("T")[0] + '"></div>' +
    '<div class="form-group"><label>Observacao</label><input type="text" id="rec-obs"></div>' +
    '</div><button class="btn" onclick="addReceita()">Adicionar</button></div>' +
    '<div class="section"><div class="section-title">Historico</div><div class="table-container"><table><thead><tr><th>Data</th><th>Categoria</th><th>Valor</th><th>Obs</th><th></th></tr></thead><tbody>' +
    receitas.sort((a,b) => b.data.localeCompare(a.data)).map((r,i) => '<tr><td>' + new Date(r.data).toLocaleDateString("pt-BR") + '</td><td>' + r.categoria + '</td><td class="positive">' + fmt(r.valor) + '</td><td>' + (r.obs||"") + '</td><td><button class="btn btn-danger" onclick="delReceita(' + i + ')">X</button></td></tr>').join("") +
    '</tbody></table></div></div>';
}

function addReceita() {
  var r = getData("receitas");
  r.push({ valor: document.getElementById("rec-valor").value, categoria: document.getElementById("rec-cat").value, data: document.getElementById("rec-data").value, obs: document.getElementById("rec-obs").value });
  setData("receitas", r);
  renderReceitas();
}
function delReceita(i) { var r = getData("receitas").sort((a,b) => b.data.localeCompare(a.data)); r.splice(i,1); setData("receitas", r); renderReceitas(); }

function renderGastos() {
  var el = document.getElementById("page-gastos");
  var gastos = getData("gastos");
  var cats = ["Alimentacao","Mercado","Restaurante","Combustivel","Pedagio","Seguro","Academia","Streaming","Celular","Internet","Compras","Saude","Educacao","Lazer","Cartao","Impostos","Outros"];
  var formas = ["Pix","Debito","Credito","Dinheiro","Boleto"];

  el.innerHTML = '<h1 class="page-title">Gastos</h1>' +
    '<div class="section"><div class="section-title">Novo Gasto</div>' +
    '<div class="form-grid">' +
    '<div class="form-group"><label>Valor</label><input type="number" id="gas-valor" step="0.01"></div>' +
    '<div class="form-group"><label>Categoria</label><select id="gas-cat">' + cats.map(c => "<option>" + c + "</option>").join("") + '</select></div>' +
    '<div class="form-group"><label>Forma de Pagamento</label><select id="gas-forma">' + formas.map(f => "<option>" + f + "</option>").join("") + '</select></div>' +
    '<div class="form-group"><label>Data</label><input type="date" id="gas-data" value="' + new Date().toISOString().split("T")[0] + '"></div>' +
    '<div class="form-group"><label>Observacao</label><input type="text" id="gas-obs"></div>' +
    '</div><button class="btn" onclick="addGasto()">Adicionar</button></div>' +
    '<div class="section"><div class="section-title">Historico</div><div class="table-container"><table><thead><tr><th>Data</th><th>Categoria</th><th>Forma</th><th>Valor</th><th>Obs</th><th></th></tr></thead><tbody>' +
    gastos.sort((a,b) => b.data.localeCompare(a.data)).map((g,i) => '<tr><td>' + new Date(g.data).toLocaleDateString("pt-BR") + '</td><td>' + g.categoria + '</td><td>' + (g.forma||"") + '</td><td class="negative">' + fmt(g.valor) + '</td><td>' + (g.obs||"") + '</td><td><button class="btn btn-danger" onclick="delGasto(' + i + ')">X</button></td></tr>').join("") +
    '</tbody></table></div></div>' + renderParcelas();
  applyHide();
}

function addGasto() {
  var g = getData("gastos");
  g.push({ valor: document.getElementById("gas-valor").value, categoria: document.getElementById("gas-cat").value, forma: document.getElementById("gas-forma").value, data: document.getElementById("gas-data").value, obs: document.getElementById("gas-obs").value });
  setData("gastos", g);
  renderGastos();
}
function delGasto(i) { var g = getData("gastos").sort((a,b) => b.data.localeCompare(a.data)); g.splice(i,1); setData("gastos", g); renderGastos(); }

function renderMetas() {
  var el = document.getElementById("page-metas");
  var metas = getData("metas");

  el.innerHTML = '<h1 class="page-title">Metas</h1>' +
    '<div class="section"><div class="section-title">Nova Meta</div>' +
    '<div class="form-grid">' +
    '<div class="form-group"><label>Nome</label><input type="text" id="meta-nome"></div>' +
    '<div class="form-group"><label>Valor Total</label><input type="number" id="meta-total" step="0.01"></div>' +
    '<div class="form-group"><label>Valor Atual</label><input type="number" id="meta-atual" step="0.01"></div>' +
    '</div><button class="btn" onclick="addMeta()">Adicionar</button></div>' +
    '<div class="cards-grid">' +
    metas.map((m,i) => {
      var pct = m.total > 0 ? Math.round((m.atual / m.total) * 100) : 0;
      return '<div class="meta-card"><div class="meta-title">' + m.nome + '</div><div class="meta-info">' + fmt(m.atual) + ' / ' + fmt(m.total) + '</div><div class="meta-pct">' + pct + '%</div><div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div><button class="btn btn-danger" style="margin-top:0.5rem;font-size:0.7rem" onclick="delMeta(' + i + ')">Remover</button></div>';
    }).join("") +
    '</div>';
}

function addMeta() {
  var m = getData("metas");
  m.push({ nome: document.getElementById("meta-nome").value, total: Number(document.getElementById("meta-total").value), atual: Number(document.getElementById("meta-atual").value) });
  setData("metas", m);
  renderMetas();
}
function delMeta(i) { var m = getData("metas"); m.splice(i,1); setData("metas", m); renderMetas(); }

function renderInvestimentos() {
  var el = document.getElementById("page-investimentos");
  var investimentos = getData("investimentos");
  var cats = ["Tesouro Direto","CDB","LCI","LCA","FIIs","Acoes","ETFs","Previdencia","Cripto","Poupanca","Outros"];
  var totalInvest = investimentos.reduce(function(s,inv) { return s + Number(inv.valor); }, 0);

  el.innerHTML = '<h1 class="page-title">Investimentos</h1>' +
    '<div class="cards-grid">' +
    '<div class="card"><div class="card-label">Total Investido</div><div class="card-value positive">' + fmt(totalInvest) + '</div></div>' +
    '<div class="card"><div class="card-label">Ativos</div><div class="card-value">' + investimentos.length + '</div></div>' +
    '</div>' +
    '<div class="section"><div class="section-title">Novo Investimento</div>' +
    '<div class="form-grid">' +
    '<div class="form-group"><label>Nome/Titulo</label><input type="text" id="inv-nome"></div>' +
    '<div class="form-group"><label>Categoria</label><select id="inv-cat">' + cats.map(function(c) { return "<option>" + c + "</option>"; }).join("") + '</select></div>' +
    '<div class="form-group"><label>Valor Investido</label><input type="number" id="inv-valor" step="0.01"></div>' +
    '<div class="form-group"><label>Rentabilidade (%/ano)</label><input type="number" id="inv-rent" step="0.01"></div>' +
    '<div class="form-group"><label>Data Aplicacao</label><input type="date" id="inv-data" value="' + new Date().toISOString().split("T")[0] + '"></div>' +
    '<div class="form-group"><label>Vencimento</label><input type="date" id="inv-venc"></div>' +
    '</div><button class="btn" onclick="addInvestimento()">Adicionar</button></div>' +
    '<div class="section"><div class="section-title">Meus Investimentos</div><div class="table-container"><table><thead><tr><th>Nome</th><th>Categoria</th><th>Valor</th><th>Rentabilidade</th><th>Data</th><th>Vencimento</th><th></th></tr></thead><tbody>' +
    investimentos.map(function(inv, i) {
      return '<tr><td><strong>' + inv.nome + '</strong></td><td>' + inv.categoria + '</td><td class="positive">' + fmt(inv.valor) + '</td><td>' + (inv.rent || "-") + '% a.a.</td><td>' + new Date(inv.data).toLocaleDateString("pt-BR") + '</td><td>' + (inv.venc ? new Date(inv.venc).toLocaleDateString("pt-BR") : "-") + '</td><td><button class="btn btn-danger" style="font-size:0.65rem;padding:4px 8px" onclick="delInvestimento(' + i + ')">X</button></td></tr>';
    }).join("") +
    '</tbody></table></div></div>' +
    '<div class="section"><div class="section-title">Distribuicao por Categoria</div><div class="chart-container"><canvas id="chart-invest"></canvas></div></div>';

  // Grafico
  var catInvest = {};
  investimentos.forEach(function(inv) { catInvest[inv.categoria] = (catInvest[inv.categoria] || 0) + Number(inv.valor); });
  if (Object.keys(catInvest).length > 0) {
    new Chart(document.getElementById("chart-invest"), {
      type: "doughnut",
      data: { labels: Object.keys(catInvest), datasets: [{ data: Object.values(catInvest), backgroundColor: ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316","#06b6d4","#84cc16","#78716c"] }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "right" } } }
    });
  }
  applyHide();
}

function addInvestimento() {
  var inv = getData("investimentos");
  inv.push({
    nome: document.getElementById("inv-nome").value,
    categoria: document.getElementById("inv-cat").value,
    valor: Number(document.getElementById("inv-valor").value),
    rent: document.getElementById("inv-rent").value,
    data: document.getElementById("inv-data").value,
    venc: document.getElementById("inv-venc").value
  });
  setData("investimentos", inv);
  renderInvestimentos();
}

function delInvestimento(i) { var inv = getData("investimentos"); inv.splice(i,1); setData("investimentos", inv); renderInvestimentos(); }


function renderBancos() {
  var el = document.getElementById("page-bancos");
  var bancos = getData("bancos");
  var totalSaldo = bancos.reduce(function(s,b) { return s + Number(b.saldo); }, 0);
  var cats = ["Conta Corrente","Conta Poupanca","Conta Digital","Carteira"];

  el.innerHTML = '<h1 class="page-title">Bancos</h1>' +
    '<div class="cards-grid">' +
    '<div class="card"><div class="card-label">Saldo Total</div><div class="card-value positive">' + fmt(totalSaldo) + '</div></div>' +
    '<div class="card"><div class="card-label">Contas</div><div class="card-value">' + bancos.length + '</div></div>' +
    '</div>' +
    '<div class="section"><div class="section-title">Adicionar Banco</div>' +
    '<div class="form-grid">' +
    '<div class="form-group"><label>Banco</label><input type="text" id="banco-nome" placeholder="Nubank, Itau, Inter..."></div>' +
    '<div class="form-group"><label>Tipo</label><select id="banco-tipo">' + cats.map(function(c){return "<option>"+c+"</option>";}).join("") + '</select></div>' +
    '<div class="form-group"><label>Saldo Atual</label><input type="number" id="banco-saldo" step="0.01"></div>' +
    '</div><button class="btn" onclick="addBanco()">Adicionar</button></div>' +
    '<div class="section"><div class="section-title">Minhas Contas</div><div class="table-container"><table><thead><tr><th>Banco</th><th>Tipo</th><th>Saldo</th><th></th></tr></thead><tbody>' +
    bancos.map(function(b, i) {
      var cls = Number(b.saldo) >= 0 ? "positive" : "negative";
      return '<tr><td><strong>' + b.nome + '</strong></td><td>' + b.tipo + '</td><td class="' + cls + '">' + fmt(b.saldo) + '</td><td><button class="btn" style="font-size:0.65rem;padding:4px 8px;margin-right:4px" onclick="editSaldoBanco(' + i + ')">Atualizar</button><button class="btn btn-danger" style="font-size:0.65rem;padding:4px 8px" onclick="delBanco(' + i + ')">X</button></td></tr>';
    }).join("") +
    '</tbody></table></div></div>';
  applyHide();
}

function addBanco() {
  var b = getData("bancos");
  b.push({ nome: document.getElementById("banco-nome").value, tipo: document.getElementById("banco-tipo").value, saldo: Number(document.getElementById("banco-saldo").value) });
  setData("bancos", b);
  renderBancos();
}

function editSaldoBanco(i) {
  var b = getData("bancos");
  var novoSaldo = prompt("Novo saldo para " + b[i].nome + ":", b[i].saldo);
  if (novoSaldo !== null) { b[i].saldo = Number(novoSaldo); setData("bancos", b); renderBancos(); }
}

function delBanco(i) { var b = getData("bancos"); b.splice(i,1); setData("bancos", b); renderBancos(); }

function renderPerfil() {
  var el = document.getElementById("page-perfil");
  var p = getProfile();
  el.innerHTML = '<h1 class="page-title">Perfil</h1>' +
    '<div class="section"><div class="form-grid">' +
    '<div class="form-group"><label>Nome</label><input type="text" id="perf-nome" value="' + (p.nome||"") + '"></div>' +
    '<div class="form-group"><label>Salario</label><input type="number" id="perf-salario" value="' + (p.salario||"") + '"></div>' +
    '<div class="form-group"><label>Objetivo Financeiro</label><input type="text" id="perf-obj" value="' + (p.objetivo||"") + '"></div>' +
    '</div><button class="btn" onclick="savePerfil()">Salvar</button></div>';
}

function savePerfil() {
  setProfile({ nome: document.getElementById("perf-nome").value, salario: document.getElementById("perf-salario").value, objetivo: document.getElementById("perf-obj").value });
  alert("Perfil salvo!");
}


// Parcelas Cartao
function renderParcelas() {
  var parcelas = getData("parcelas");
  var now = new Date();
  var html = '<div class="section"><div class="section-title">Parcelas do Cartao de Credito</div>' +
    '<div class="form-grid">' +
    '<div class="form-group"><label>Produto/Descricao</label><input type="text" id="parc-nome"></div>' +
    '<div class="form-group"><label>Valor da Parcela</label><input type="number" id="parc-valor" step="0.01"></div>' +
    '<div class="form-group"><label>Total de Parcelas</label><input type="number" id="parc-total" min="1"></div>' +
    '<div class="form-group"><label>Parcelas Pagas</label><input type="number" id="parc-pagas" min="0" value="0"></div>' +
    '<div class="form-group"><label>Data Inicio (1a parcela)</label><input type="date" id="parc-inicio"></div>' +
    '</div><button class="btn" onclick="addParcela()">Adicionar Parcela</button></div>';

  if (parcelas.length > 0) {
    html += '<div class="section"><div class="section-title">Minhas Parcelas</div><div class="table-container"><table><thead><tr><th>Produto</th><th>Parcela</th><th>Progresso</th><th>Restante</th><th>Termina em</th><th>Status</th><th></th></tr></thead><tbody>';
    parcelas.forEach(function(p, i) {
      var fimDate = new Date(p.inicio);
      fimDate.setMonth(fimDate.getMonth() + Number(p.total) - 1);
      var restantes = Number(p.total) - Number(p.pagas);
      var totalGasto = Number(p.valor) * Number(p.total);
      var status = restantes <= 0 ? '<span class="badge badge-green">Quitado</span>' : '<span class="badge badge-red">' + restantes + 'x restantes</span>';
      html += '<tr><td><strong>' + p.nome + '</strong><br><small style="color:var(--text2)">Total: ' + fmt(totalGasto) + '</small></td><td>' + fmt(p.valor) + '</td><td>' + p.pagas + '/' + p.total + '</td><td>' + fmt(p.valor * restantes) + '</td><td>' + fimDate.toLocaleDateString("pt-BR", {month:"short", year:"numeric"}) + '</td><td>' + status + '</td><td><button class="btn" style="font-size:0.65rem;padding:4px 8px" onclick="pagarParcela(' + i + ')">+1</button> <button class="btn btn-danger" style="font-size:0.65rem;padding:4px 8px" onclick="delParcela(' + i + ')">X</button></td></tr>';
    });
    html += '</tbody></table></div></div>';
  }
  return html;
}

function addParcela() {
  var p = getData("parcelas");
  p.push({
    nome: document.getElementById("parc-nome").value,
    valor: Number(document.getElementById("parc-valor").value),
    total: Number(document.getElementById("parc-total").value),
    pagas: Number(document.getElementById("parc-pagas").value),
    inicio: document.getElementById("parc-inicio").value
  });
  setData("parcelas", p);
  renderGastos();
}

function pagarParcela(i) {
  var p = getData("parcelas");
  if (p[i].pagas < p[i].total) p[i].pagas++;
  setData("parcelas", p);
  renderGastos();
}

function delParcela(i) { var p = getData("parcelas"); p.splice(i,1); setData("parcelas", p); renderGastos(); }

function getParcelasMes() {
  var parcelas = getData("parcelas");
  var now = new Date();
  var total = 0;
  parcelas.forEach(function(p) {
    var inicio = new Date(p.inicio);
    var fim = new Date(p.inicio);
    fim.setMonth(fim.getMonth() + Number(p.total));
    if (now >= inicio && now <= fim && p.pagas < p.total) {
      total += Number(p.valor);
    }
  });
  return total;
}

// Init
document.addEventListener("DOMContentLoaded", function() {
  var theme = localStorage.getItem("theme");
  if (theme) document.documentElement.setAttribute("data-theme", theme);
  renderDashboard();
});
