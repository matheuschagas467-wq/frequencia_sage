// ==================== Constantes ====================
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

// ==================== Inicialização ====================
document.addEventListener("DOMContentLoaded", () => {
  initializeEventListeners();
  setCurrentYear();
  setFooterYear();
  loadHistory();
});

// ==================== Footer ====================
function setFooterYear() {
  const yearSpan = document.getElementById("ano");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
}

// ==================== Event Listeners ====================
function initializeEventListeners() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", switchTab);
  });

  document.getElementById("frequencyForm").addEventListener("submit", handleFormSubmit);

  document.getElementById("resetFormBtn").addEventListener("click", resetForm);

  document.getElementById("exportPdfBtn").addEventListener("click", exportToPDF);

  document.getElementById("exportCsvBtn").addEventListener("click", exportToCSV);

  document.getElementById("clearHistoryBtn").addEventListener("click", clearHistory);

  document.getElementById("importCsvBtn").addEventListener("click", handleCsvImport);
}

// ==================== Tabs ====================
function switchTab(e) {
  const tabName = e.target.dataset.tab;

  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.remove("active");
  });

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  document.getElementById(tabName).classList.add("active");
  e.target.classList.add("active");

  if (tabName === "history") {
    loadHistory();
  }
}

// ==================== Formulário ====================
function handleFormSubmit(e) {
  e.preventDefault();

  const studentName = document.getElementById("studentName").value.trim();
  const inepCode = document.getElementById("inepCode").value.trim();
  const className = document.getElementById("className").value.trim();
  const month = parseInt(document.getElementById("month").value, 10);
  const year = parseInt(document.getElementById("year").value, 10);
  const daysAttended = parseInt(document.getElementById("daysAttended").value, 10);
  const totalDays = parseInt(document.getElementById("totalDays").value, 10);
  const reason = document.getElementById("reason").value.trim();

  hideError();

  const validationMessage = validateRecordData({
    month,
    year,
    daysAttended,
    totalDays
  });

  if (validationMessage) {
    return showError(validationMessage);
  }

  const record = buildRecord({
    studentName,
    inepCode,
    className,
    month,
    year,
    daysAttended,
    totalDays,
    reason
  });

  saveRecord(record);
  displayResult(record);
  loadHistory();
  resetForm();
  setCurrentYear();
}

function validateRecordData({ month, year, daysAttended, totalDays }) {
  if (!month || month < 1 || month > 12) return "Por favor, selecione um mês válido.";
  if (!year || year < 2000 || year > 2100) return "Ano inválido.";
  if (Number.isNaN(daysAttended) || daysAttended < 0) return "Dias frequentados inválido.";
  if (Number.isNaN(totalDays) || totalDays <= 0) return "Total de dias inválido.";
  if (daysAttended > totalDays) return "Dias frequentados não pode ser maior que o total de dias.";
  return "";
}

function buildRecord(data) {
  const frequency = Number(((data.daysAttended * 100) / data.totalDays).toFixed(2));

  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    studentName: data.studentName || "Sem Nome",
    inepCode: data.inepCode || "",
    className: data.className || "",
    month: data.month,
    year: data.year,
    daysAttended: data.daysAttended,
    totalDays: data.totalDays,
    frequency,
    reason: data.reason && data.reason !== "-" ? data.reason : "",
    createdAt: new Date().toISOString()
  };
}

function showError(message) {
  const errorMessage = document.getElementById("errorMessage");
  errorMessage.textContent = message;
  errorMessage.style.display = "block";
}

function hideError() {
  const errorMessage = document.getElementById("errorMessage");
  errorMessage.textContent = "";
  errorMessage.style.display = "none";
}

function resetForm() {
  document.getElementById("frequencyForm").reset();
  hideError();
}

function setCurrentYear() {
  const yearInput = document.getElementById("year");
  if (yearInput && !yearInput.value) {
    yearInput.value = new Date().getFullYear();
  }
}

// ==================== Storage ====================
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
  const records = getRecords().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  loadHistory();
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
    document.getElementById("resultCard").style.display = "none";
  }
}

// ==================== Resultado ====================
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

  const resultStatus = document.getElementById("resultStatus");
  const approved = record.frequency >= 75;

  resultStatus.className = `result-status ${approved ? "status-approved" : "status-warning"}`;
  resultStatus.textContent = approved
    ? "Frequência satisfatória. Aluno dentro do mínimo recomendado."
    : "Atenção: frequência abaixo do mínimo recomendado de 75%.";
}

function toggleDetail(containerId, valueId, value) {
  const container = document.getElementById(containerId);
  const field = document.getElementById(valueId);

  if (value) {
    container.style.display = "flex";
    field.textContent = value;
  } else {
    container.style.display = "none";
    field.textContent = "-";
  }
}

// ==================== Histórico ====================
function loadHistory() {
  const records = getRecords();
  const container = document.getElementById("historyContainer");

  if (!records.length) {
    container.innerHTML = `
      <p class="empty-message">Nenhum registro no histórico. Comece calculando a frequência de um aluno.</p>
    `;
    return;
  }

  const grouped = {};
  records.forEach((record) => {
    const key = record.studentName || "Sem Nome";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(record);
  });

  const sortedGroups = Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0], "pt-BR"));

  let html = "";

  sortedGroups.forEach(([studentName, items]) => {
    items.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.month - a.month;
    });

    const avg = (items.reduce((sum, item) => sum + Number(item.frequency), 0) / items.length).toFixed(2);
    const approvedCount = items.filter((item) => item.frequency >= 75).length;

    html += `
      <div class="student-card">
        <h3>${escapeHtml(studentName)}</h3>
        <table class="records-table">
          <thead>
            <tr>
              <th>Mês/Ano</th>
              <th>Turma</th>
              <th>Dias</th>
              <th>Total</th>
              <th>Frequência</th>
              <th>Motivo</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((record) => `
              <tr>
                <td>${MONTHS[record.month]}/${record.year}</td>
                <td>${escapeHtml(record.className || "-")}</td>
                <td>${record.daysAttended}</td>
                <td>${record.totalDays}</td>
                <td>
                  <span class="frequency-badge ${record.frequency >= 75 ? "approved" : "warning"}">
                    ${formatPercent(record.frequency)}%
                  </span>
                </td>
                <td>${escapeHtml(record.reason || "-")}</td>
                <td>
                  <button class="delete-btn" onclick="deleteRecord(${record.id})">Excluir</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="student-summary">
          <div><strong>Média:</strong> ${formatPercent(avg)}%</div>
          <div><strong>Registros satisfatórios:</strong> ${approvedCount}/${items.length}</div>
          <div><strong>Total de registros:</strong> ${items.length}</div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// ==================== Exportar CSV ====================
function exportToCSV() {
  const records = getRecords();
  if (!records.length) {
    alert("Nenhum registro para exportar.");
    return;
  }

  const headers = [
    "Nome",
    "INEP",
    "Turma",
    "Mês",
    "Ano",
    "Dias Frequentados",
    "Total de Dias",
    "Frequência",
    "Motivo",
    "Criado em"
  ];

  const rows = records.map((record) => [
    record.studentName || "",
    record.inepCode || "",
    record.className || "",
    record.month,
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

// ==================== Exportar PDF ====================
function exportToPDF() {
  const records = getRecords();
  if (!records.length) {
    alert("Nenhum registro para exportar.");
    return;
  }

  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("Biblioteca de PDF não carregada.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Relatório de Frequência Escolar", 14, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 23);

  let y = 32;

  records.forEach((record, index) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.text(`${index + 1}. ${record.studentName || "Sem Nome"}`, 14, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.text(`INEP: ${record.inepCode || "-"}`, 16, y);
    y += 5;
    doc.text(`Turma: ${record.className || "-"}`, 16, y);
    y += 5;
    doc.text(`Período: ${MONTHS[record.month]}/${record.year}`, 16, y);
    y += 5;
    doc.text(`Dias frequentados: ${record.daysAttended}`, 16, y);
    y += 5;
    doc.text(`Total de dias: ${record.totalDays}`, 16, y);
    y += 5;
    doc.text(`Frequência: ${formatPercent(record.frequency)}%`, 16, y);
    y += 5;
    doc.text(`Motivo: ${record.reason || "-"}`, 16, y);
    y += 9;

    doc.line(14, y - 3, 196, y - 3);
    y += 2;
  });

  doc.save("relatorio_frequencia_escolar.pdf");
}

// ==================== Importar CSV ====================
function handleCsvImport() {
  const fileInput = document.getElementById("csvFile");
  const importResult = document.getElementById("importResult");

  importResult.textContent = "";

  if (!fileInput.files || !fileInput.files.length) {
    importResult.textContent = "Selecione um arquivo CSV antes de importar.";
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = function (event) {
    try {
      const text = String(event.target.result || "").trim();

      if (!text) {
        importResult.textContent = "O arquivo está vazio.";
        return;
      }

      const lines = text
        .replace(/^\uFEFF/, "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length < 2) {
        importResult.textContent = "O CSV precisa ter cabeçalho e ao menos uma linha de dados.";
        return;
      }

      const dataLines = lines.slice(1);
      const importedRecords = [];
      const errors = [];

      dataLines.forEach((line, index) => {
        const columns = parseCSVLine(line);

        if (columns.length < 7) {
          errors.push(`Linha ${index + 2}: quantidade de colunas insuficiente.`);
          return;
        }

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

        const validationMessage = validateRecordData({
          month,
          year,
          daysAttended,
          totalDays
        });

        if (validationMessage) {
          errors.push(`Linha ${index + 2}: ${validationMessage}`);
          return;
        }

        const record = buildRecord({
          studentName: (studentNameRaw || "").trim() || "Sem Nome",
          inepCode: (inepCodeRaw || "").trim(),
          className: (classNameRaw || "").trim(),
          month,
          year,
          daysAttended,
          totalDays,
          reason: (reasonRaw || "").trim()
        });

        importedRecords.push(record);
      });

      if (!importedRecords.length) {
        importResult.textContent = errors.length
          ? `Nenhum registro importado. Erros encontrados: ${errors.join(" | ")}`
          : "Nenhum registro válido encontrado.";
        return;
      }

      saveMultipleRecords(importedRecords);
      loadHistory();

      importResult.textContent = `${importedRecords.length} registro(s) importado(s) com sucesso.${errors.length ? ` Algumas linhas foram ignoradas.` : ""}`;

      if (errors.length) {
        console.warn("Erros de importação:", errors);
      }

      fileInput.value = "";
    } catch (error) {
      console.error(error);
      importResult.textContent = "Erro ao processar o arquivo CSV.";
    }
  };

  reader.onerror = function () {
    importResult.textContent = "Erro ao ler o arquivo.";
  };

  reader.readAsText(file, "utf-8");
}

// ==================== Utilitários ====================
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
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
  const stringValue = String(value ?? "");
  return `"${stringValue.replace(/"/g, '""')}"`;
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

function formatPercent(value) {
  return Number(value).toFixed(Number(value) % 1 === 0 ? 0 : 2);
}

function formatDateTime(isoDate) {
  if (!isoDate) return "-";
  const date = new Date(isoDate);
  return date.toLocaleString("pt-BR");
}

function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
