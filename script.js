// ==================== Constantes ====================
const MONTHS = {
    1: 'Janeiro',
    2: 'Fevereiro',
    3: 'Março',
    4: 'Abril',
    5: 'Maio',
    6: 'Junho',
    7: 'Julho',
    8: 'Agosto',
    9: 'Setembro',
    10: 'Outubro',
    11: 'Novembro',
    12: 'Dezembro'
};

const STORAGE_KEY = 'frequencia_records';

// ==================== Inicialização ====================
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    setCurrentYear();
    loadHistory();
});

// ==================== Event Listeners ====================
function initializeEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', switchTab);
    });

    // Form submission
    document.getElementById('frequencyForm').addEventListener('submit', handleFormSubmit);

    // History actions
    document.getElementById('exportPdfBtn').addEventListener('click', exportToPDF);
    document.getElementById('exportCsvBtn').addEventListener('click', exportToCSV);
    document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);

    // Import CSV
    document.getElementById('importCsvBtn').addEventListener('click', handleCsvImport);
}

// ==================== Tab Switching ====================
function switchTab(e) {
    const tabName = e.target.dataset.tab;
    
    // Remove active class from all tabs and buttons
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Add active class to selected tab and button
    document.getElementById(tabName).classList.add('active');
    e.target.classList.add('active');

    // Reload history when switching to history tab
    if (tabName === 'history') {
        loadHistory();
    }
}

// ==================== Form Handling ====================
function handleFormSubmit(e) {
    e.preventDefault();

    // Get form values
    const studentName = document.getElementById('studentName').value.trim();
    const inepCode = document.getElementById('inepCode').value.trim();
    const className = document.getElementById('className').value.trim();
    const month = parseInt(document.getElementById('month').value);
    const year = parseInt(document.getElementById('year').value);
    const daysAttended = parseInt(document.getElementById('daysAttended').value);
    const totalDays = parseInt(document.getElementById('totalDays').value);
    const reason = document.getElementById('reason').value.trim();

    // Validate required fields
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.style.display = 'none';

    if (!month) {
        showError('Por favor, selecione um mês');
        return;
    }

    if (!year || year < 2000 || year > 2100) {
        showError('Por favor, insira um ano válido');
        return;
    }

    if (!daysAttended || daysAttended <= 0) {
        showError('Dias frequentados deve ser um número positivo');
        return;
    }

    if (!totalDays || totalDays <= 0) {
        showError('Total de dias letivos deve ser um número positivo');
        return;
    }

    if (daysAttended > totalDays) {
        showError('Dias frequentados não pode ser maior que o total de dias letivos');
        return;
    }

    // Calculate frequency
    const frequency = Math.round((daysAttended * 100) / totalDays);

    // Create record object
    const record = {
        id: Date.now(),
        studentName: studentName || 'Sem Nome',
        inepCode: inepCode || '',
        className: className || '',
        month,
        year,
        daysAttended,
        totalDays,
        frequency,
        reason: reason || '',
        createdAt: new Date().toISOString()
    };

    // Save to localStorage
    saveRecord(record);

    // Display result
    displayResult(record);

    // Reset form
    document.getElementById('frequencyForm').reset();
    setCurrentYear();
}

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.style.display = 'flex';
}

function displayResult(record) {
    const resultCard = document.getElementById('resultCard');
    
    // Update values
    document.getElementById('frequencyValue').textContent = record.frequency;
    document.getElementById('resultMonth').textContent = `${MONTHS[record.month]}/${record.year}`;
    document.getElementById('resultDaysAttended').textContent = record.daysAttended;
    document.getElementById('resultTotalDays').textContent = record.totalDays;

    // Show/hide optional fields
    if (record.studentName && record.studentName !== 'Sem Nome') {
        document.getElementById('resultNameDiv').style.display = 'flex';
        document.getElementById('resultName').textContent = record.studentName;
    } else {
        document.getElementById('resultNameDiv').style.display = 'none';
    }

    if (record.inepCode) {
        document.getElementById('resultInepDiv').style.display = 'flex';
        document.getElementById('resultInep').textContent = record.inepCode;
    } else {
        document.getElementById('resultInepDiv').style.display = 'none';
    }

    if (record.className) {
        document.getElementById('resultClassDiv').style.display = 'flex';
        document.getElementById('resultClass').textContent = record.className;
    } else {
        document.getElementById('resultClassDiv').style.display = 'none';
    }

    if (record.reason) {
        document.getElementById('resultReasonDiv').style.display = 'flex';
        document.getElementById('resultReason').textContent = record.reason;
    } else {
        document.getElementById('resultReasonDiv').style.display = 'none';
    }

    // Set status
    const resultStatus = document.getElementById('resultStatus');
    if (record.frequency >= 75) {
        resultStatus.className = 'result-status approved';
        resultStatus.textContent = '✓ Frequência Aprovada';
    } else {
        resultStatus.className = 'result-status warning';
        resultStatus.textContent = '⚠ Atenção Necessária';
    }

    resultCard.style.display = 'block';
}

function setCurrentYear() {
    const yearInput = document.getElementById('year');
    if (!yearInput.value) {
        yearInput.value = new Date().getFullYear();
    }
}

// ==================== Storage Functions ====================
function saveRecord(record) {
    const records = getRecords();
    records.push(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function getRecords() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function deleteRecord(id) {
    const records = getRecords();
    const filtered = records.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    loadHistory();
}

function clearHistory() {
    if (confirm('Tem certeza que deseja limpar todo o histórico? Esta ação não pode ser desfeita.')) {
        localStorage.removeItem(STORAGE_KEY);
        loadHistory();
    }
}

// ==================== History Display ====================
function loadHistory() {
    const records = getRecords();
    const container = document.getElementById('historyContainer');

    if (records.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhum registro no histórico. Comece calculando a frequência de um aluno.</p>';
        return;
    }

    // Group records by student
    const groupedByStudent = {};
    records.forEach(record => {
        const key = record.studentName;
        if (!groupedByStudent[key]) {
            groupedByStudent[key] = [];
        }
        groupedByStudent[key].push(record);
    });

    // Sort records by date (newest first)
    Object.keys(groupedByStudent).forEach(key => {
        groupedByStudent[key].sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
        });
    });

    // Build HTML
    let html = '';
    Object.entries(groupedByStudent).forEach(([studentName, studentRecords]) => {
        const avgFrequency = Math.round(
            studentRecords.reduce((sum, r) => sum + r.frequency, 0) / studentRecords.length
        );
        const approvedMonths = studentRecords.filter(r => r.frequency >= 75).length;

        html += `
            <div class="student-card">
                <h3>${studentName}</h3>
                <div class="student-info">
                    ${studentRecords[0].className ? `<div class="student-info-item"><span class="student-info-label">Turma</span><span class="student-info-value">${studentRecords[0].className}</span></div>` : ''}
                    ${studentRecords[0].inepCode ? `<div class="student-info-item"><span class="student-info-label">INEP</span><span class="student-info-value">${studentRecords[0].inepCode}</span></div>` : ''}
                    <div class="student-info-item"><span class="student-info-label">Registros</span><span class="student-info-value">${studentRecords.length}</span></div>
                </div>
                <table class="records-table">
                    <thead>
                        <tr>
                            <th>Mês/Ano</th>
                            <th>Dias Freq.</th>
                            <th>Total de Dias</th>
                            <th>Frequência</th>
                            <th>Motivo</th>
                            <th>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${studentRecords.map(record => `
                            <tr>
                                <td><strong>${MONTHS[record.month]}/${record.year}</strong></td>
                                <td>${record.daysAttended}</td>
                                <td>${record.totalDays}</td>
                                <td><span class="frequency-badge ${record.frequency >= 75 ? 'approved' : 'warning'}">${record.frequency}%</span></td>
                                <td>${record.reason || '-'}</td>
                                <td><button class="delete-btn" onclick="deleteRecord(${record.id})">Deletar</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="student-summary">
                    <div class="summary-item">
                        <span class="summary-label">Frequência Média</span>
                        <span class="summary-value">${avgFrequency}%</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Meses Aprovados</span>
                        <span class="summary-value">${approvedMonths}/${studentRecords.length}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Taxa de Aprovação</span>
                        <span class="summary-value">${Math.round((approvedMonths / studentRecords.length) * 100)}%</span>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ==================== Export Functions ====================
function exportToPDF() {
    const records = getRecords();
    if (records.length === 0) {
        alert('Nenhum registro para exportar');
        return;
    }

    // Group records by student
    const groupedByStudent = {};
    records.forEach(record => {
        const key = record.studentName;
        if (!groupedByStudent[key]) {
            groupedByStudent[key] = [];
        }
        groupedByStudent[key].push(record);
    });

    // Sort
    Object.keys(groupedByStudent).forEach(key => {
        groupedByStudent[key].sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
        });
    });

    // Create HTML content
    let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Relatório de Frequência Escolar</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: Arial, sans-serif; padding: 30px; background-color: #f5f5f5; color: #333; }
                .container { background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 1200px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 40px; border-bottom: 4px solid #667eea; padding-bottom: 20px; }
                .header h1 { color: #333; font-size: 32px; margin-bottom: 10px; }
                .header p { color: #666; font-size: 14px; margin: 5px 0; }
                .student-section { margin-bottom: 50px; page-break-inside: avoid; }
                .student-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px; }
                .student-header h2 { font-size: 20px; margin-bottom: 8px; }
                .student-info { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; font-size: 13px; }
                .student-info-item { display: flex; justify-content: space-between; }
                .student-info-label { font-weight: 600; margin-right: 10px; }
                table { width: 100%; border-collapse: collapse; background-color: white; margin-bottom: 30px; }
                thead { background: linear-gradient(to right, #667eea, #764ba2); color: white; }
                th { padding: 15px; text-align: left; font-weight: 600; font-size: 13px; border-bottom: 2px solid #e5e7eb; }
                td { padding: 12px 15px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
                tbody tr:nth-child(even) { background-color: #f9fafb; }
                .frequency-high { color: #059669; font-weight: 700; background-color: #d1fae5; padding: 6px 10px; border-radius: 4px; display: inline-block; text-align: center; min-width: 50px; }
                .frequency-low { color: #d97706; font-weight: 700; background-color: #fef3c7; padding: 6px 10px; border-radius: 4px; display: inline-block; text-align: center; min-width: 50px; }
                .summary { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 20px; border-left: 4px solid #667eea; border-radius: 4px; margin-top: 20px; }
                .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin-top: 15px; }
                .summary-item { text-align: center; }
                .summary-label { color: #666; font-size: 12px; font-weight: 600; margin-bottom: 5px; }
                .summary-value { color: #333; font-size: 24px; font-weight: 700; }
                .footer { margin-top: 50px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
                @media print { body { background-color: white; padding: 0; } .container { box-shadow: none; padding: 0; } .student-section { page-break-inside: avoid; margin-bottom: 40px; } }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📊 Relatório de Frequência Escolar</h1>
                    <p>Acompanhamento mensal de frequência dos alunos</p>
                    <p style="font-size: 12px; margin-top: 10px;">Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
                </div>
    `;

    // Add student sections
    Object.entries(groupedByStudent).forEach(([studentName, studentRecords]) => {
        const totalRecords = studentRecords.length;
        const avgFrequency = Math.round(
            studentRecords.reduce((sum, r) => sum + r.frequency, 0) / totalRecords
        );
        const approvedMonths = studentRecords.filter(r => r.frequency >= 75).length;

        htmlContent += `
            <div class="student-section">
                <div class="student-header">
                    <h2>${studentName}</h2>
                    <div class="student-info">
                        ${studentRecords[0].className ? `<div class="student-info-item"><span class="student-info-label">Turma:</span> ${studentRecords[0].className}</div>` : ''}
                        ${studentRecords[0].inepCode ? `<div class="student-info-item"><span class="student-info-label">INEP:</span> ${studentRecords[0].inepCode}</div>` : ''}
                        <div class="student-info-item"><span class="student-info-label">Registros:</span> ${totalRecords} mês(es)</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Mês</th>
                            <th>Dias Frequentados</th>
                            <th>Total de Dias</th>
                            <th>Frequência</th>
                            <th>Motivo</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${studentRecords.map(record => {
                            const frequencyClass = record.frequency >= 75 ? 'frequency-high' : 'frequency-low';
                            return `
                                <tr>
                                    <td><strong>${MONTHS[record.month]}/${record.year}</strong></td>
                                    <td>${record.daysAttended}</td>
                                    <td>${record.totalDays}</td>
                                    <td><span class="${frequencyClass}">${record.frequency}%</span></td>
                                    <td>${record.reason || '-'}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>

                <div class="summary">
                    <strong>Resumo do Aluno</strong>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <div class="summary-label">Frequência Média</div>
                            <div class="summary-value">${avgFrequency}%</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Meses Aprovados</div>
                            <div class="summary-value">${approvedMonths}/${totalRecords}</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Taxa de Aprovação</div>
                            <div class="summary-value">${Math.round((approvedMonths / totalRecords) * 100)}%</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    htmlContent += `
                <div class="footer">
                    <p>Este relatório foi gerado automaticamente pelo Sistema de Cálculo de Frequência Escolar.</p>
                    <p>Para mais informações ou dúvidas, entre em contato com a instituição.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    // Open print dialog
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
}

function exportToCSV() {
    const records = getRecords();
    if (records.length === 0) {
        alert('Nenhum registro para exportar');
        return;
    }

    // Sort records
    records.sort((a, b) => {
        if (a.studentName !== b.studentName) return a.studentName.localeCompare(b.studentName);
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
    });

    // Create CSV content
    let csv = 'Nome,INEP,Turma,Mês,Ano,Dias Frequentados,Total de Dias,Frequência,Motivo\n';
    
    records.forEach(record => {
        csv += `"${record.studentName}","${record.inepCode}","${record.className}",${record.month},${record.year},${record.daysAttended},${record.totalDays},${record.frequency},"${record.reason}"\n`;
    });

    // Download CSV
    downloadFile(csv, 'frequencia_alunos.csv', 'text/csv;charset=utf-8;');
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

// ==================== Import Functions ====================
function handleCsvImport() {
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];

    if (!file) {
        alert('Por favor, selecione um arquivo CSV');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const csv = e.target.result;
            const lines = csv.trim().split('\n');
            
            if (lines.length < 2) {
                alert('Arquivo CSV vazio ou inválido');
                return;
            }

            // Skip header
            const records = getRecords();
            let importedCount = 0;
            let errorCount = 0;

            for (let i = 1; i < lines.length; i++) {
                try {
                    const line = lines[i].trim();
                    if (!line) continue;

                    // Parse CSV line
                    const values = parseCSVLine(line);
                    
                    if (values.length < 7) {
                        errorCount++;
                        continue;
                    }

                    const [name, inep, className, month, year, daysAttended, totalDays, reason] = values;

                    // Validate
                    const monthNum = parseInt(month);
                    const yearNum = parseInt(year);
                    const daysNum = parseInt(daysAttended);
                    const totalNum = parseInt(totalDays);

                    if (!name || !monthNum || !yearNum || !daysNum || !totalNum) {
                        errorCount++;
                        continue;
                    }

                    if (daysNum > totalNum) {
                        errorCount++;
                        continue;
                    }

                    // Calculate frequency
                    const frequency = Math.round((daysNum * 100) / totalNum);

                    // Create record
                    const record = {
                        id: Date.now() + i,
                        studentName: name,
                        inepCode: inep || '',
                        className: className || '',
                        month: monthNum,
                        year: yearNum,
                        daysAttended: daysNum,
                        totalDays: totalNum,
                        frequency,
                        reason: reason && reason !== '-' ? reason : '',
                        createdAt: new Date().toISOString()
                    };

                    records.push(record);
                    importedCount++;
                } catch (err) {
                    errorCount++;
                }
            }

            // Save all records
            localStorage.setItem(STORAGE_KEY, JSON.stringify(records));

            // Show result
            alert(`Importação concluída!\n\nRegistros importados: ${importedCount}\nErros: ${errorCount}`);

            // Clear file input
            fileInput.value = '';

            // Reload history
            loadHistory();
        } catch (err) {
            alert('Erro ao processar arquivo CSV: ' + err.message);
        }
    };

    reader.readAsText(file);
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
            result.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
}
