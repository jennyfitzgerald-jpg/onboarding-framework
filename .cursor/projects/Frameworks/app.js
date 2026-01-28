// Diagnexia Onboarding Tracker - Multi-Client Version
const API = window.location.origin;

let clients = [];
let currentClient = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadDashboard();
});

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = e.currentTarget.dataset.view;
            showView(view);
        });
    });

    // Add client buttons
    document.getElementById('addClientBtn').addEventListener('click', openAddClientModal);
    document.getElementById('addClientBtn2').addEventListener('click', openAddClientModal);
    
    // Forms
    document.getElementById('clientForm').addEventListener('submit', handleClientSubmit);
    document.getElementById('assignForm').addEventListener('submit', handleAssignSubmit);
    
    // Filter
    document.getElementById('filterTier').addEventListener('change', filterClients);
    
    // Edit client
    document.getElementById('editClientBtn').addEventListener('click', () => {
        if (currentClient) openEditClientModal(currentClient);
    });
}

// ============ VIEWS ============
function showView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    document.getElementById(`${viewName}View`).classList.add('active');
    document.querySelector(`[data-view="${viewName}"]`)?.classList.add('active');
    
    if (viewName === 'dashboard') loadDashboard();
    if (viewName === 'clients') loadClients();
}

// ============ DASHBOARD ============
async function loadDashboard() {
    try {
        const [stats, clientsData] = await Promise.all([
            fetch(`${API}/api/stats`).then(r => r.json()),
            fetch(`${API}/api/clients`).then(r => r.json())
        ]);
        
        clients = clientsData;
        
        document.getElementById('statTotalClients').textContent = stats.total_clients || 0;
        document.getElementById('statActive').textContent = stats.active_clients || 0;
        document.getElementById('statOnboarding').textContent = stats.in_onboarding || 0;
        document.getElementById('statAtRisk').textContent = stats.at_risk || 0;
        
        renderRecentClients(clients.slice(0, 6));
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function renderRecentClients(clientsList) {
    const container = document.getElementById('recentClients');
    if (clientsList.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No clients yet. Add your first client to get started.</p></div>';
        return;
    }
    container.innerHTML = clientsList.map(c => createClientCard(c)).join('');
    attachClientCardListeners();
}

// ============ CLIENTS LIST ============
async function loadClients() {
    try {
        const response = await fetch(`${API}/api/clients`);
        clients = await response.json();
        renderClientsList(clients);
    } catch (error) {
        console.error('Error loading clients:', error);
    }
}

function renderClientsList(clientsList) {
    const container = document.getElementById('clientsList');
    if (clientsList.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No clients found. Add a client to start tracking their onboarding.</p></div>';
        return;
    }
    container.innerHTML = clientsList.map(c => createClientCard(c)).join('');
    attachClientCardListeners();
}

function createClientCard(client) {
    const progress = client.total_steps ? Math.round((client.completed_steps / client.total_steps) * 100) : 0;
    const tierClass = client.tier || 'standard';
    const stageText = client.current_stage <= 15 ? `Stage ${client.current_stage}` : 'BAU';
    
    return `
        <div class="client-card" data-id="${client.id}">
            <div class="client-card-header">
                <h3 class="client-card-name">${escapeHtml(client.name)}</h3>
                <span class="tier-badge ${tierClass}">${tierClass}</span>
            </div>
            <div class="client-card-meta">
                <span class="stage-indicator">${stageText}</span>
                ${client.bdm_name ? `<span class="bdm-name">BDM: ${escapeHtml(client.bdm_name)}</span>` : ''}
            </div>
            <div class="client-card-progress">
                <div class="progress-bar small">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <span class="progress-text">${progress}% complete</span>
            </div>
            <div class="client-card-footer">
                <span class="completed-count">${client.completed_steps || 0}/${client.total_steps || 15} steps</span>
                <button class="btn btn-sm btn-primary view-client-btn">View Details</button>
            </div>
        </div>
    `;
}

function attachClientCardListeners() {
    document.querySelectorAll('.client-card').forEach(card => {
        card.addEventListener('click', () => {
            const clientId = card.dataset.id;
            openClientDetail(clientId);
        });
    });
}

function filterClients() {
    const tier = document.getElementById('filterTier').value;
    const filtered = tier ? clients.filter(c => c.tier === tier) : clients;
    renderClientsList(filtered);
}

// ============ CLIENT DETAIL ============
async function openClientDetail(clientId) {
    try {
        const response = await fetch(`${API}/api/clients/${clientId}`);
        currentClient = await response.json();
        renderClientDetail();
        showView('clientDetail');
    } catch (error) {
        console.error('Error loading client:', error);
        alert('Failed to load client details');
    }
}

function renderClientDetail() {
    if (!currentClient) return;
    
    document.getElementById('clientName').textContent = currentClient.name;
    document.getElementById('clientTier').textContent = currentClient.tier || 'Standard';
    document.getElementById('clientTier').className = `tier-badge ${currentClient.tier || 'standard'}`;
    document.getElementById('clientStage').textContent = currentClient.current_stage <= 15 ? `Stage ${currentClient.current_stage}` : 'BAU';
    document.getElementById('clientBDM').textContent = currentClient.bdm_name || 'Not assigned';
    document.getElementById('clientContractDate').textContent = currentClient.contract_date ? formatDate(currentClient.contract_date) : '-';
    document.getElementById('clientGoLiveDate').textContent = currentClient.go_live_date ? formatDate(currentClient.go_live_date) : '-';
    document.getElementById('clientHealthScore').textContent = currentClient.health_score || 100;
    
    const steps = currentClient.steps || [];
    const completed = steps.filter(s => s.status === 'completed').length;
    const progress = steps.length ? Math.round((completed / steps.length) * 100) : 0;
    
    document.getElementById('clientProgress').textContent = `${progress}%`;
    document.getElementById('clientProgressFill').style.width = `${progress}%`;
    
    renderClientSteps(steps);
}

function renderClientSteps(steps) {
    const container = document.getElementById('clientSteps');
    container.innerHTML = steps.map(step => createStepCard(step)).join('');
    attachStepListeners();
}

function createStepCard(step) {
    const statusClass = step.status || 'pending';
    const isCompleted = step.status === 'completed';
    const isInProgress = step.status === 'in_progress';
    
    return `
        <div class="step-card ${statusClass}" data-step="${step.step_order}">
            <div class="step-header">
                <div class="step-number-wrapper">
                    <span class="step-number">${step.step_order}</span>
                    <div class="step-status-icon ${statusClass}">
                        ${isCompleted ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : 
                          isInProgress ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>' :
                          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg>'}
                    </div>
                </div>
                <div class="step-info">
                    <h4 class="step-title">${escapeHtml(step.title)}</h4>
                    <span class="step-owner">Default: ${escapeHtml(step.default_owner || 'Unassigned')}</span>
                </div>
                <div class="step-actions">
                    <select class="status-select" data-step="${step.step_order}">
                        <option value="pending" ${step.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="in_progress" ${step.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                        <option value="completed" ${step.status === 'completed' ? 'selected' : ''}>Completed</option>
                    </select>
                </div>
            </div>
            
            <div class="step-body">
                <div class="step-assignment">
                    <div class="assigned-person">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        <span class="person-name ${step.assigned_person ? '' : 'empty'}">${step.assigned_person || 'No one assigned'}</span>
                    </div>
                    <button class="btn btn-sm btn-secondary assign-btn" data-step="${step.step_order}">
                        ${step.assigned_person ? 'Reassign' : 'Assign Person'}
                    </button>
                </div>
                
                ${step.notes ? `<div class="step-notes"><strong>Notes:</strong> ${escapeHtml(step.notes)}</div>` : ''}
                
                <details class="step-details">
                    <summary>View Details</summary>
                    <pre class="step-description">${escapeHtml(step.description || 'No description')}</pre>
                </details>
                
                <div class="step-timestamps">
                    ${step.started_at ? `<span class="timestamp">Started: ${formatDateTime(step.started_at)}</span>` : ''}
                    ${step.completed_at ? `<span class="timestamp">Completed: ${formatDateTime(step.completed_at)}</span>` : ''}
                </div>
            </div>
        </div>
    `;
}

function attachStepListeners() {
    // Status change
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', async (e) => {
            const stepOrder = e.target.dataset.step;
            const newStatus = e.target.value;
            await updateStepStatus(stepOrder, newStatus);
        });
    });
    
    // Assign button
    document.querySelectorAll('.assign-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const stepOrder = e.target.dataset.step;
            openAssignModal(stepOrder);
        });
    });
}

async function updateStepStatus(stepOrder, status) {
    if (!currentClient) return;
    try {
        await fetch(`${API}/api/clients/${currentClient.id}/steps/${stepOrder}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        await openClientDetail(currentClient.id);
    } catch (error) {
        console.error('Error updating step:', error);
        alert('Failed to update step');
    }
}

// ============ MODALS ============
function openAddClientModal() {
    document.getElementById('clientModalTitle').textContent = 'Add New Client';
    document.getElementById('clientForm').reset();
    document.getElementById('clientId').value = '';
    document.getElementById('clientModal').classList.add('active');
}

function openEditClientModal(client) {
    document.getElementById('clientModalTitle').textContent = 'Edit Client';
    document.getElementById('clientId').value = client.id;
    document.getElementById('clientNameInput').value = client.name || '';
    document.getElementById('clientTierInput').value = client.tier || 'standard';
    document.getElementById('clientBDMInput').value = client.bdm_name || '';
    document.getElementById('clientContractDateInput').value = client.contract_date || '';
    document.getElementById('clientGoLiveDateInput').value = client.go_live_date || '';
    document.getElementById('clientNotesInput').value = client.notes || '';
    document.getElementById('clientModal').classList.add('active');
}

function closeClientModal() {
    document.getElementById('clientModal').classList.remove('active');
}

async function handleClientSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('clientId').value;
    const data = {
        name: document.getElementById('clientNameInput').value.trim(),
        tier: document.getElementById('clientTierInput').value,
        bdm_name: document.getElementById('clientBDMInput').value.trim() || null,
        contract_date: document.getElementById('clientContractDateInput').value || null,
        go_live_date: document.getElementById('clientGoLiveDateInput').value || null,
        notes: document.getElementById('clientNotesInput').value.trim() || null
    };
    
    if (!data.name) {
        alert('Please enter a client name');
        return;
    }
    
    try {
        if (id) {
            await fetch(`${API}/api/clients/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            await fetch(`${API}/api/clients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }
        closeClientModal();
        loadClients();
        if (currentClient && id === currentClient.id) {
            openClientDetail(id);
        }
    } catch (error) {
        console.error('Error saving client:', error);
        alert('Failed to save client');
    }
}

function openAssignModal(stepOrder) {
    const step = currentClient?.steps?.find(s => s.step_order == stepOrder);
    document.getElementById('assignClientId').value = currentClient?.id || '';
    document.getElementById('assignStepOrder').value = stepOrder;
    document.getElementById('assignPersonInput').value = step?.assigned_person || '';
    document.getElementById('assignNotesInput').value = step?.notes || '';
    document.getElementById('assignModal').classList.add('active');
}

function closeAssignModal() {
    document.getElementById('assignModal').classList.remove('active');
}

async function handleAssignSubmit(e) {
    e.preventDefault();
    
    const clientId = document.getElementById('assignClientId').value;
    const stepOrder = document.getElementById('assignStepOrder').value;
    const assignedPerson = document.getElementById('assignPersonInput').value.trim();
    const notes = document.getElementById('assignNotesInput').value.trim();
    
    try {
        await fetch(`${API}/api/clients/${clientId}/steps/${stepOrder}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assigned_person: assignedPerson, notes })
        });
        closeAssignModal();
        await openClientDetail(clientId);
    } catch (error) {
        console.error('Error assigning person:', error);
        alert('Failed to assign person');
    }
}

// ============ UTILITIES ============
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// Make showView global for inline handlers
window.showView = showView;
window.closeClientModal = closeClientModal;
window.closeAssignModal = closeAssignModal;
