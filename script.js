const MONTHS = {
  1: "Janeiro",
  2: "Fevereiro",
  3: "Março",
  4: "Abril",
  5: "Maio",
  6: "Junho",
  7: "Julho",
  8: "Agosto",
  9: "Setembro",
  10: "Outubro",
  11: "Novembro",
  12: "Dezembro"
};

const STORAGE_KEY = "frequencia_records";
const THEME_KEY = "frequencia_theme";
let frequencyChart = null;

document.addEventListener("DOMContentLoaded", () => {
  initializeTheme();
  initializeEventListeners();
  setCurrentYear();
  setFooterYear();
  loadHistory();
  updateDashboard();
});

function initializeEventListeners() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", switchTab);
  });

  document.getElementById("frequencyForm").addEventListener("submit", handleFormSubmit);
  document.getElementById("resetFormBtn").addEventListener("click", resetForm);
  document.getElementById("cancelEditBtn").addEventListener("click", cancelEdit);

  document.getElementById("exportPdfBtn").addEventListener("click", exportToPDF);
  document.getElementById("exportCsvBtn").addEventListener("click", exportToCSV);
  document.getElementById("clearHistoryBtn").addEventListener("click", clearHistory);
  document.getElementById("importCsvBtn").addEventListener("click", handleCsvImport);

  document.getElementById("themeToggleBtn").addEventListener("click", toggleTheme);

  document.getElementById("searchStudent").addEventListener("input", loadHistory);
  document.getElementById("filterMonth").addEventListener("change", loadHistory);
  document.getElementById("filterYear").addEventListener("input", loadHistory);
  document.getElementById("filterClass").addEventListener("input", loadHistory);

  document.getElementById("dashboardGroupBy").addEventListener("change", updateDashboard);
  document.getElementById("dashboardYear").addEventListener("input", updateDashboard);
  document.getElementById("dashboardMonth").addEventListener("change", updateDashboard);
  document.getElementById("dashboardClass").addEventListener("input", updateDashboard);
}

function switchTab(e) {
  const tabName = e.target.dataset.tab;

  document.querySelectorAll(".tab-content").forEach((tab) => tab.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));

  document.getElementById(tabName).classList.add("active");
  e.target.classList.add("active");

  if (tabName === "history") loadHistory();
  if (tabName === "dashboard") updateDashboard();
}

function initializeTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = savedTheme || (prefersDark ? "dark" : "light");
  applyTheme(theme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);

  document.getElementById("themeIcon").textContent = theme === "dark" ? "🌙" : "☀️";
  document.getElementById("themeText").textContent = theme === "dark" ? "Tema escuro" : "Tema claro";

  if (frequencyChart) {
    updateDashboard();
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  applyTheme(current === "dark" ? "light" : "dark");
}

function setFooterYear() {
  document.getElementById("ano").textContent = new Date().getFullYear();
}

function setCurrentYear() {
  const yearInput = document.getElementById("year");
  if (!yearInput.value) yearInput.value = new Date().getFullYear();
}

function showError(message) {
  const error = document.getElementById("errorMessage");
  error.textContent = message;
  error.style.display = "block";
}

function hideError() {
  const error = document.getElementById("errorMessage");
  error.textContent = "";
  error.style.display = "none";
}

function validateRecordData({ month, year, daysAttended, totalDays }) {
  if (!month || month < 1 || month > 12) return "Selecione um mês válido.";
  if (!year || year < 2000 || year > 2100) return "Informe um ano válido.";
  if (Number.isNaN(daysAttended) || daysAttended < 0) return "Dias frequentados inválido.";
  if (Number.isNaN(totalDays) || totalDays <= 0) return "Total de dias inválido.";
  if (daysAttended > totalDays) return "Dias frequentados não pode ser maior que o total.";
  return "";
}

function buildRecord(data, id = null, createdAt = null) {
  const frequency = Number(((data.daysAttended * 100) / data.totalDays).toFixed(2));
  return {
    id: id || Date.now() + Math.floor(Math.random() * 1000),
    studentName: data.studentName || "Sem Nome",
    inepCode: data.inepCode || "",
    className: data.className || "",
    month: data.month,
    year: data.year,
    daysAttended: data.daysAttended,
    totalDays: data.totalDays,
    frequency,
    reason: data.reason && data.reason !== "-" ? data.reason : "",
    createdAt: createdAt || new Date().toISOString()
  };
}

function handleFormSubmit(e) {
  e.preventDefault();
  hideError();

  const editingId = document.getElementById("editingId").value.trim();
  const studentName = document.getElementById("studentName").value.trim();
  const inepCode = document.getElementById("inepCode").value.trim();
  const className = document.getElementById("className").value.trim();
  const month = parseInt(document.getElementById("month").value, 10);
  const year = parseInt(document.getElementById("year").value, 10);
  const daysAttended = parseInt(document.getElementById("daysAttended").value, 10);
  const totalDays = parseInt(document.getElementById("totalDays").value, 10);
  const reason = document.getElementById("reason").value.trim();

  const validationMessage = validateRecordData({ month, year, daysAttended, totalDays });
  if (validationMessage) return showError(validationMessage);

  if (editingId) {
    const records = getRecords();
    const existing = records.find((r) => String(r.id) === editingId);
    const updated = buildRecord(
      { studentName, inepCode, className, month, year, daysAttended, totalDays, reason },
      Number(editingId),
      existing?.createdAt || null
    );
    const newRecords = records.map((r) => String(r.id) === editingId ? updated : r);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
    displayResult(updated);
  } else {
    const record = buildRecord({ studentName, inepCode, className, month, year, daysAttended, totalDays, reason });
    saveRecord(record);
    displayResult(record);
  }

  loadHistory();
  updateDashboard();
  resetForm();
  setCurrentYear();
}

function displayResult(record) {
  document.getElementById("resultCard").style.display = "block";
  document.getElementById("frequencyValue").textContent = formatPercent(record.frequency);
  document.getElementById("resultMonth").textContent = `${MONTHS[record.month]}/${record.year}`;
  document.getElementById("resultDaysAttended").textContent = record.daysAttended;
  document.getElementById("resultTotalDays").textContent = record.totalDays;

  toggleDetail("resultNameDiv", "resultName", record.studentName && record.studentName !== "Sem Nome" ? record.studentName : "");
  toggleDetail("resultInepDiv", "resultInep", record.inepCode);
  toggleDetail("resultClassDiv", "resultClass", record.className);
  toggleDetail("resultReasonDiv", "resultReason", record.reason);

  const approved = record.frequency >= 75;
  const status = document.getElementById("resultStatus");
  status.className = `result-status ${approved ? "status-approved" : "status-warning"}`;
  status.textContent = approved
    ? "Frequência satisfatória. Aluno dentro do mínimo recomendado."
    : "Atenção: frequência abaixo do mínimo recomendado de 75%.";
}

function toggleDetail(containerId, fieldId, value) {
  const container = document.getElementById(containerId);
  const field = document.getElementById(fieldId);

  if (value) {
    container.style.display = "flex";
    field.textContent = value;
  } else {
    container.style.display = "none";
    field.textContent = "-";
  }
}

function resetForm() {
  document.getElementById("frequencyForm").reset();
  document.getElementById("editingId").value = "";
  document.getElementById("formTitle").textContent = "Cadastrar Frequência";
  document.getElementById("submitBtn").textContent = "Salvar Frequência";
  document.getElementById("cancelEditBtn").style.display = "none";
  hideError();
}

function cancelEdit() {
  resetForm();
  setCurrentYear();
}

function getRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveRecord(record) {
  const records = getRecords();
  records.push(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function saveMultipleRecords(newRecords) {
  const records = getRecords();
  records.push(...newRecords);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function deleteRecord(id) {
  const confirmed = confirm("Deseja excluir este registro?");
  if (!confirmed) return;

  const records = getRecords().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  loadHistory();
  updateDashboard();
}

function editRecord(id) {
  const record = getRecords().find((r) => r.id === id);
  if (!record) return;

  document.querySelector('[data-tab="calculator"]').click();

  document.getElementById("editingId").value = record.id;
  document.getElementById("studentName").value = record.studentName || "";
  document.getElementById("inepCode").value = record.inepCode || "";
  document.getElementById("className").value = record.className || "";
  document.getElementById("month").value = record.month || "";
  document.getElementById("year").value = record.year || "";
  document.getElementById("daysAttended").value = record.daysAttended || "";
  document.getElementById("totalDays").value = record.totalDays || "";
  document.getElementById("reason").value = record.reason || "";

  document.getElementById("formTitle").textContent = "Editar Frequência";
  document.getElementById("submitBtn").textContent = "Atualizar Registro";
  document.getElementById("cancelEditBtn").style.display = "inline-block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function clearHistory() {
  const records = getRecords();
  if (!records.length) {
    alert("Não há registros para limpar.");
    return;
  }

  if (confirm("Deseja limpar todo o histórico?")) {
    localStorage.removeItem(STORAGE_KEY);
    loadHistory();
    updateDashboard();
    document.getElementById("resultCard").style.display = "none";
  }
}

function getFilteredRecords() {
  const search = document.getElementById("searchStudent").value.trim().toLowerCase();
  const month = document.getElementById("filterMonth").value;
  const year = document.getElementById("filterYear").value.trim();
  const className = document.getElementById("filterClass").value.trim().toLowerCase();

  return getRecords().filter((record) => {
    const matchesSearch = !search || String(record.studentName || "").toLowerCase().includes(search);
    const matchesMonth = !month || String(record.month) === String(month);
    const matchesYear = !year || String(record.year) === String(year);
    const matchesClass = !className || String(record.className || "").toLowerCase().includes(className);
    return matchesSearch && matchesMonth && matchesYear && matchesClass;
  });
}

function loadHistory() {
  const records = getFilteredRecords();
  const container = document.getElementById("historyContainer");

  if (!records.length) {
    container.innerHTML = `<p class="empty-message">Nenhum registro encontrado com os filtros atuais.</p>`;
    return;
  }

  const sorted = [...records].sort((a, b) => {
    if (a.studentName !== b.studentName) return a.studentName.localeCompare(b.studentName, "pt-BR");
    if (b.year !== a.year) return b.year - a.year;
    return b.month - a.month;
  });

  const rows = sorted.map((record) => `
    <tr>
      <td>${escapeHtml(record.studentName)}</td>
      <td>${escapeHtml(record.inepCode || "-")}</td>
      <td>${escapeHtml(record.className || "-")}</td>
      <td>${MONTHS[record.month]}/${record.year}</td>
      <td>${record.daysAttended}</td>
      <td>${record.totalDays}</td>
      <td><span class="frequency-badge ${record.frequency >= 75 ? "approved" : "warning"}">${formatPercent(record.frequency)}%</span></td>
      <td>${escapeHtml(record.reason || "-")}</td>
      <td class="row-actions">
        <button class="small-btn edit" onclick="editRecord(${record.id})">Editar</button>
        <button class="small-btn delete" onclick="deleteRecord(${record.id})">Excluir</button>
      </td>
    </tr>
  `).join("");

  container.innerHTML = `
    <div class="table-wrap">
      <table class="records-table">
        <thead>
          <tr>
            <th>Aluno</th>
            <th>INEP</th>
            <th>Turma</th>
            <th>Mês/Ano</th>
            <th>Freq.</th>
            <th>Total</th>
            <th>%</th>
            <th>Motivo</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function getDashboardFilteredRecords() {
  const year = document.getElementById("dashboardYear").value.trim();
  const month = document.getElementById("dashboardMonth").value;
  const className = document.getElementById("dashboardClass").value.trim().toLowerCase();

  return getRecords().filter((record) => {
    const matchesYear = !year || String(record.year) === String(year);
    const matchesMonth = !month || String(record.month) === String(month);
    const matchesClass = !className || String(record.className || "").toLowerCase().includes(className);
    return matchesYear && matchesMonth && matchesClass;
  });
}

function updateDashboard() {
  const records = getDashboardFilteredRecords();
  const groupBy = document.getElementById("dashboardGroupBy").value;

  const grouped = {};

  records.forEach((record) => {
    let key = "";

    if (groupBy === "student") key = record.studentName || "Sem Nome";
    if (groupBy === "year") key = String(record.year);
    if (groupBy === "month") key = MONTHS[record.month];
    if (groupBy === "class") key = record.className || "Sem turma";

    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(record.frequency);
  });

  const labels = Object.keys(grouped);
  const values = labels.map((label) => {
    const avg = grouped[label].reduce((sum, value) => sum + value, 0) / grouped[label].length;
    return Number(avg.toFixed(2));
  });

  renderChart(labels, values);

  const totalRecords = records.length;
  const average = totalRecords
    ? Number((records.reduce((sum, r) => sum + r.frequency, 0) / totalRecords).toFixed(2))
    : 0;
  const below75 = records.filter((r) => r.frequency < 75).length;
  const classes = new Set(records.map((r) => r.className).filter(Boolean)).size;

  document.getElementById("statTotalRecords").textContent = totalRecords;
  document.getElementById("statAverage").textContent = `${formatPercent(average)}%`;
  document.getElementById("statBelow75").textContent = below75;
  document.getElementById("statClasses").textContent = classes;
}

function renderChart(labels, values) {
  const ctx = document.getElementById("frequencyChart");
  if (!ctx) return;

  if (frequencyChart) frequencyChart.destroy();

  const theme = document.documentElement.getAttribute("data-theme");
  const textColor = theme === "dark" ? "#eef4ff" : "#10203d";
  const gridColor = theme === "dark" ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.1)";

  frequencyChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Média de Frequência (%)",
        data: values,
        borderWidth: 1,
        backgroundColor: [
          "rgba(37,99,235,0.75)",
          "rgba(34,197,94,0.75)",
          "rgba(245,158,11,0.75)",
          "rgba(6,182,212,0.75)",
          "rgba(139,92,246,0.75)",
          "rgba(239,68,68,0.75)",
          "rgba(16,185,129,0.75)"
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: { color: textColor }
        }
      },
      scales: {
        x: {
          ticks: { color: textColor },
          grid: { color: gridColor }
        },
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { color: textColor },
          grid: { color: gridColor }
        }
      }
    }
  });
}

function exportToCSV() {
  const records = getFilteredRecords();
  if (!records.length) {
    alert("Nenhum registro para exportar.");
    return;
  }

  const headers = [
    "Nome",
    "INEP",
    "Turma",
    "Mes",
    "Ano",
    "Dias Frequentados",
    "Total de Dias",
    "Frequencia",
    "Motivo",
    "Criado em"
  ];

  const rows = records.map((record) => [
    record.studentName || "",
    record.inepCode || "",
    record.className || "",
    MONTHS[record.month],
    record.year,
    record.daysAttended,
    record.totalDays,
    `${formatPercent(record.frequency)}%`,
    record.reason || "",
    formatDateTime(record.createdAt)
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");

  downloadFile("\uFEFF" + csvContent, "frequencia_escolar.csv", "text/csv;charset=utf-8;");
}

function exportToPDF() {
  const records = getFilteredRecords();
  if (!records.length) {
    alert("Nenhum registro para exportar.");
    return;
  }

  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("Biblioteca PDF não carregada.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");

  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 210, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Relatório de Frequência Escolar", 14, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 23);

  const rows = records.map((record) => [
    record.studentName || "Sem Nome",
    record.className || "-",
    `${MONTHS[record.month]}/${record.year}`,
    record.daysAttended,
    record.totalDays,
    `${formatPercent(record.frequency)}%`,
    record.reason || "-"
  ]);

  doc.autoTable({
    startY: 35,
    head: [["Aluno", "Turma", "Mês/Ano", "Freq.", "Total", "%", "Motivo"]],
    body: rows,
    styles: {
      fontSize: 9,
      cellPadding: 3,
      valign: "middle"
    },
    headStyles: {
      fillColor: [29, 78, 216],
      textColor: [255, 255, 255],
      fontStyle: "bold"
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    },
    margin: { left: 10, right: 10 }
  });

  const average = records.length
    ? (records.reduce((sum, r) => sum + r.frequency, 0) / records.length).toFixed(2)
    : "0.00";

  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo do Relatório", 14, finalY);
  doc.setFont("helvetica", "normal");
  doc.text(`Total de registros: ${records.length}`, 14, finalY + 7);
  doc.text(`Média geral de frequência: ${average}%`, 14, finalY + 14);
  doc.text(`Registros abaixo de 75%: ${records.filter((r) => r.frequency < 75).length}`, 14, finalY + 21);

  doc.save("relatorio_frequencia_escolar.pdf");
}

function handleCsvImport() {
  const fileInput = document.getElementById("csvFile");
  const result = document.getElementById("importResult");
  result.textContent = "";

  if (!fileInput.files || !fileInput.files.length) {
    result.textContent = "Selecione um arquivo CSV antes de importar.";
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = (event) => {
    try {
      const text = String(event.target.result || "").trim();
      if (!text) {
        result.textContent = "O arquivo está vazio.";
        return;
      }

      const lines = text.replace(/^\uFEFF/, "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length < 2) {
        result.textContent = "O CSV precisa ter cabeçalho e pelo menos uma linha.";
        return;
      }

      const importedRecords = [];
      const dataLines = lines.slice(1);

      dataLines.forEach((line) => {
        const columns = parseCSVLine(line);
        if (columns.length < 7) return;

        const [
          studentNameRaw,
          inepCodeRaw,
          classNameRaw,
          monthRaw,
          yearRaw,
          daysAttendedRaw,
          totalDaysRaw,
          reasonRaw = ""
        ] = columns;

        const month = parseInt(monthRaw, 10);
        const year = parseInt(yearRaw, 10);
        const daysAttended = parseInt(daysAttendedRaw, 10);
        const totalDays = parseInt(totalDaysRaw, 10);

        const validation = validateRecordData({ month, year, daysAttended, totalDays });
        if (validation) return;

        importedRecords.push(buildRecord({
          studentName: (studentNameRaw || "").trim(),
          inepCode: (inepCodeRaw || "").trim(),
          className: (classNameRaw || "").trim(),
          month,
          year,
          daysAttended,
          totalDays,
          reason: (reasonRaw || "").trim()
        }));
      });

      if (!importedRecords.length) {
        result.textContent = "Nenhum registro válido encontrado no arquivo.";
        return;
      }

      saveMultipleRecords(importedRecords);
      fileInput.value = "";
      result.textContent = `${importedRecords.length} registro(s) importado(s) com sucesso.`;
      loadHistory();
      updateDashboard();
    } catch {
      result.textContent = "Erro ao processar o CSV.";
    }
  };

  reader.onerror = () => {
    result.textContent = "Erro ao ler o arquivo.";
  };

  reader.readAsText(file, "utf-8");
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && insideQuotes && next === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function csvEscape(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function formatPercent(value) {
  const num = Number(value || 0);
  return num % 1 === 0 ? num.toFixed(0) : num.toFixed(2);
}

function formatDateTime(isoDate) {
  if (!isoDate) return "-";
  return new Date(isoDate).toLocaleString("pt-BR");
}

function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
