$(document).ready(function () {
    function renderRecords() {
        const records = JSON.parse(localStorage.getItem('records')) || [];
        $('#monthly-records').empty();

        records.forEach((record, index) => {
            let totalExpenses = 0;
            record.expenses.forEach(expense => {
                totalExpenses += parseFloat(expense.value);
            });
            let remainingSalary = record.salary - totalExpenses;
            let card = $(`
                <div class="card mb-3 ${record.status}">
                    <div class="card-body">
                        <h5 class="card-title custom-font">${record.month}</h5>
                        <button class="delete-card btn btn-danger" style="position: absolute; top: 0; right: 0;">&times;</button>
                        <div class="card-details">
                            <div class="row mb-2">
                                <div class="col custom-font"><i class="fas fa-money-bill-wave"></i> Salário:</div>
                                <div class="col text-end">${record.salary}</div>
                            </div>
                            <hr>
                            <div class="row">
                                <div class="col">
                                    ${renderExpenses(record.expenses)}
                                </div>
                            </div>
                            <hr>
                            <div class="row">
                                <div class="col custom-font"><i class="fas fa-shopping-cart"></i> Total despesas:</div>
                                <div class="col text-end">${totalExpenses}</div>
                            </div>
                            <div class="row">
                                <div class="col custom-font"><i class="fas fa-wallet"></i> Total restante do salário:</div>
                                <div class="col text-end">${remainingSalary}</div>
                            </div>
                            <div class="row">
                                <div class="col custom-font">Status:</div>
                                <div class="col text-end">${getStatusMessage(record.status)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `);
            card.on('click', function () {
                $(this).find('.card-details').slideToggle();
            });

            card.on('click', '.edit-expense', function (e) {
                e.stopPropagation(); // evita que o evento de clique do cartão seja disparado
                let expenseIndex = $(this).data('index');
                let newExpenseValue = prompt("Novo valor da despesa:");
                editExpense(record.month, expenseIndex, newExpenseValue);
            });

            card.on('click', '.delete-expense', function (e) {
                e.stopPropagation(); // evita que o evento de clique do cartão seja disparado
                let expenseIndex = $(this).data('index');
                deleteExpense(record.month, expenseIndex);
            });

            card.on('click', '.delete-card', function (e) {
                e.stopPropagation(); // evita que o evento de clique do cartão seja disparado
                deleteCard(record.month);
            });

            // Adicione a classe de fonte personalizada aos elementos desejados
            card.find('.card-title, .col, .card-subtitle, .custom-font').addClass('custom-font');

            $('#monthly-records').append(card);
        });

        renderChart();
    }

    let chart = null; // Variável para armazenar o objeto do gráfico

    function renderChart() {
        const records = JSON.parse(localStorage.getItem('records')) || [];
        const labels = records.map(record => record.month);
        const data = records.map(record => record.expenses.reduce((total, expense) => total + parseFloat(expense.value), 0));

        const ctx = document.getElementById('expensesChart').getContext('2d');

        if (chart) {
            chart.destroy(); // Destrói o gráfico anterior, se existir
        }

        chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Total de despesas',
                    data,
                    backgroundColor: '#FFEA00',
                    borderColor: '#ffff',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    function deleteCard(month) {
        let records = JSON.parse(localStorage.getItem('records')) || [];
        const index = records.findIndex(record => record.month === month);
        if (index !== -1) {
            records.splice(index, 1);
        }
        localStorage.setItem('records', JSON.stringify(records));
        renderRecords();
    }

    function renderExpenses(expenses) {
        let expensesHtml = '';
        expenses.forEach((expense, index) => {
            expensesHtml += `
                <p>
                    Descrição: ${expense.description} - Valor: ${expense.value}
                    <button class="edit-expense" data-index="${index}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-expense" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </p>`;
        });
        return expensesHtml;
    }

    $('#month').on('change', function () {
        const month = $(this).val();
        const records = JSON.parse(localStorage.getItem('records')) || [];
        const monthRecord = records.find(record => record.month === month);
        if (monthRecord) {
            $('#salary').prop('disabled', true);
            const alertModal = new bootstrap.Modal(document.getElementById('alertModal'));
            alertModal.show();
        } else {
            $('#salary').prop('disabled', false);
        }
    });

    $('#account-manager').on('submit', function (e) {
        e.preventDefault();
        const month = $('#month').val();
        let salary = parseFloat($('#salary').val());
        const expenseDescription = $('#expense-description').val();
        const expenseValue = parseFloat($('#expense').val());
        let records = JSON.parse(localStorage.getItem('records')) || [];
        let monthRecord = records.find(record => record.month === month);
        if (monthRecord) {
            monthRecord.expenses.push({ description: expenseDescription, value: expenseValue });
            let totalExpenses = monthRecord.expenses.reduce((total, expense) => total + parseFloat(expense.value), 0);
            let remainingSalary = monthRecord.salary - totalExpenses;
            monthRecord.status = getRecordStatus(remainingSalary, monthRecord.salary);
        } else {
            let status = getRecordStatus(salary - expenseValue, salary);
            records.push({
                month,
                salary,
                expenses: [{ description: expenseDescription, value: expenseValue }],
                status
            });
        }
        localStorage.setItem('records', JSON.stringify(records));
        renderRecords();
        this.reset();
    });

    function editExpense(month, expenseIndex, newExpenseValue) {
        // Verificar se um valor foi fornecido
        if (newExpenseValue === null || newExpenseValue === '') {
            return;
        }

        let records = JSON.parse(localStorage.getItem('records')) || [];
        let monthRecord = records.find(record => record.month === month);
        if (monthRecord) {
            monthRecord.expenses[expenseIndex].value = newExpenseValue;
            let totalExpenses = monthRecord.expenses.reduce((total, expense) => total + parseFloat(expense.value), 0);
            let remainingSalary = monthRecord.salary - totalExpenses;
            monthRecord.status = getRecordStatus(remainingSalary, monthRecord.salary);
        }
        localStorage.setItem('records', JSON.stringify(records));
        renderRecords();
    }

    function getStatusMessage(status) {
        switch (status) {
            case 'card-green':
                return 'Economizando';
            case 'card-yellow':
                return 'Gastando um Pouco';
            case 'card-red':
                return 'Gastou demais';
            default:
                return 'Status Desconhecido';
        }
    }

    function deleteExpense(month, expenseIndex) {
        let records = JSON.parse(localStorage.getItem('records')) || [];
        let monthRecord = records.find(record => record.month === month);
        if (monthRecord) {
            monthRecord.expenses.splice(expenseIndex, 1);
            let totalExpenses = monthRecord.expenses.reduce((total, expense) => total + parseFloat(expense.value), 0);
            let remainingSalary = monthRecord.salary - totalExpenses;
            monthRecord.status = getRecordStatus(remainingSalary, monthRecord.salary);
        }
        localStorage.setItem('records', JSON.stringify(records));
        renderRecords();
    }

    function getRecordStatus(remaining, total) {
        let percentage = remaining / total;
        if (percentage >= 2 / 3) return 'card-green';
        else if (percentage >= 1 / 3) return 'card-yellow';
        else return 'card-red';
    }

    renderRecords();
});
