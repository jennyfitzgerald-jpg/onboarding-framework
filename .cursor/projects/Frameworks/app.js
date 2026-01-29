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
    document.getElementById('gatingForm').addEventListener('submit', handleGatingSubmit);
    document.getElementById('dateChangeForm').addEventListener('submit', handleDateChangeSubmit);
    document.getElementById('requirementsForm').addEventListener('submit', handleRequirementsSubmit);
    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);
    document.getElementById('readinessForm').addEventListener('submit', handleReadinessSubmit);
    
    // Filter
    document.getElementById('filterTier').addEventListener('change', filterClients);
    
    // Edit client
    document.getElementById('editClientBtn').addEventListener('click', () => {
        if (currentClient) openEditClientModal(currentClient);
    });

    // DPIA required toggle
    document.getElementById('clientDpiaRequiredInput')?.addEventListener('change', (e) => {
        const statusGroup = document.getElementById('dpiaStatusGroup');
        if (statusGroup) statusGroup.style.display = e.target.value === '1' ? 'block' : 'none';
    });
    document.getElementById('gatingDpiaRequired')?.addEventListener('change', (e) => {
        const statusGroup = document.getElementById('gatingDpiaStatusGroup');
        if (statusGroup) statusGroup.style.display = e.target.value === '1' ? 'block' : 'none';
    });

    // New buttons
    document.getElementById('editGatingBtn')?.addEventListener('click', openGatingModal);
    document.getElementById('changeDateBtn')?.addEventListener('click', openDateChangeModal);
    document.getElementById('editRequirementsBtn')?.addEventListener('click', openRequirementsModal);
    document.getElementById('addTaskBtn')?.addEventListener('click', () => openTaskModal(null));
    document.getElementById('recordReadinessBtn')?.addEventListener('click', openReadinessModal);
    
    // Escalation checkboxes
    document.getElementById('customerNonResponsiveCheck')?.addEventListener('change', handleEscalationChange);
    document.getElementById('salesEscalationCheck')?.addEventListener('change', handleEscalationChange);
}

// ============ VIEWS ============
function showView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    document.getElementById(`${viewName}View`).classList.add('active');
    document.querySelector(`[data-view="${viewName}"]`)?.classList.add('active');
    
    if (viewName === 'dashboard') loadDashboard();
    if (viewName === 'clients') loadClients();
    if (viewName === 'portfolio') loadPortfolio();
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
    
    // Phase status (traffic light) - Feature 11
    const phaseStatus = client.phase_status || 'planning';
    const phaseStatusMap = {
        'planning': { label: 'Planning', class: 'phase-planning' },
        'discovery': { label: 'Discovery', class: 'phase-discovery' },
        'in_build': { label: 'In Build', class: 'phase-build' },
        'ready_to_go_live': { label: 'Ready', class: 'phase-ready' },
        'live': { label: 'Live', class: 'phase-live' }
    };
    const phaseInfo = phaseStatusMap[phaseStatus] || phaseStatusMap.planning;
    
    return `
        <div class="client-card" data-id="${client.id}">
            <div class="client-card-header">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span class="phase-indicator ${phaseInfo.class}" title="${phaseInfo.label}"></span>
                    <h3 class="client-card-name">${escapeHtml(client.name)}</h3>
                </div>
                <span class="tier-badge ${tierClass}">${tierClass}</span>
            </div>
            <div class="client-card-meta">
                <span class="stage-indicator">${stageText}</span>
                ${client.short_code ? `<span class="short-code">${escapeHtml(client.short_code)}</span>` : ''}
                ${client.bdm_name ? `<span class="bdm-name">BDM: ${escapeHtml(client.bdm_name)}</span>` : ''}
                ${client.go_live_date ? `<span class="go-live-date">Go-Live: ${formatDate(client.go_live_date)}</span>` : ''}
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

async function renderClientDetail() {
    if (!currentClient) return;
    
    document.getElementById('clientName').textContent = currentClient.name;
    document.getElementById('clientTier').textContent = currentClient.tier || 'Standard';
    document.getElementById('clientTier').className = `tier-badge ${currentClient.tier || 'standard'}`;
    
    // Phase status badge
    const phaseStatus = currentClient.phase_status || 'planning';
    const phaseStatusMap = {
        'planning': 'Planning',
        'discovery': 'Discovery',
        'in_build': 'In Build',
        'ready_to_go_live': 'Ready to Go-Live',
        'live': 'Live'
    };
    document.getElementById('clientStage').textContent = phaseStatusMap[phaseStatus] || 'Planning';
    
    document.getElementById('clientBDM').textContent = currentClient.bdm_name || 'Not assigned';
    document.getElementById('clientShortCode').textContent = currentClient.short_code || '-';
    document.getElementById('clientContractDate').textContent = currentClient.contract_date ? formatDate(currentClient.contract_date) : '-';
    document.getElementById('clientGoLiveDate').textContent = currentClient.go_live_date ? formatDate(currentClient.go_live_date) : '-';
    document.getElementById('clientHealthScore').textContent = currentClient.health_score || 100;
    
    // Single source of truth
    if (currentClient.single_source_url) {
        document.getElementById('clientSingleSourceLink').href = currentClient.single_source_url;
        document.getElementById('clientSingleSourceLink').style.display = 'inline';
        document.getElementById('clientSingleSourceNone').style.display = 'none';
    } else {
        document.getElementById('clientSingleSourceLink').style.display = 'none';
        document.getElementById('clientSingleSourceNone').style.display = 'inline';
    }
    
    const steps = currentClient.steps || [];
    const completed = steps.filter(s => s.status === 'completed').length;
    const progress = steps.length ? Math.round((completed / steps.length) * 100) : 0;
    
    document.getElementById('clientProgress').textContent = `${progress}%`;
    document.getElementById('clientProgressFill').style.width = `${progress}%`;
    
    // Render all new sections
    renderGating();
    await renderAlerts();
    await renderRequirements();
    await renderDateHistory();
    await renderTasks();
    renderReadiness();
    renderEscalation();
    renderClientSteps(steps);
}

// ============ GATING (Feature 1) ============
function renderGating() {
    if (!currentClient) return;
    
    const contractStatus = currentClient.contract_status || '-';
    const dpiaRequired = currentClient.dpia_required === 1 ? 'Yes' : 'No';
    const dpiaStatus = currentClient.dpia_status || '-';
    
    document.getElementById('gatingContract').textContent = contractStatus;
    document.getElementById('gatingContract').className = `gating-value ${contractStatus === 'yes' ? 'gating-ok' : 'gating-warning'}`;
    document.getElementById('gatingDpiaRequired').textContent = dpiaRequired;
    document.getElementById('gatingDpiaStatus').textContent = dpiaStatus;
    document.getElementById('gatingDpiaStatus').className = `gating-value ${dpiaStatus === 'yes' || dpiaStatus === 'waived' ? 'gating-ok' : 'gating-warning'}`;
}

// ============ ALERTS (Feature 5) ============
async function renderAlerts() {
    if (!currentClient) return;
    
    try {
        const response = await fetch(`${API}/api/clients/${currentClient.id}/alerts`);
        const alerts = await response.json();
        
        const container = document.getElementById('alertsPanel');
        if (alerts.length === 0) {
            container.innerHTML = '<div class="no-alerts">No alerts - all clear!</div>';
            return;
        }
        
        container.innerHTML = alerts.map(alert => `
            <div class="alert-item alert-${alert.severity}">
                <span class="alert-icon">${alert.severity === 'high' ? '⚠️' : 'ℹ️'}</span>
                <span class="alert-message">${escapeHtml(alert.message)}</span>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading alerts:', error);
    }
}

// ============ REQUIREMENTS (Feature 2) ============
async function renderRequirements() {
    if (!currentClient) return;
    
    try {
        const response = await fetch(`${API}/api/clients/${currentClient.id}/requirements`);
        const req = await response.json();
        
        const container = document.getElementById('requirementsSection');
        if (!req) {
            container.innerHTML = '<div class="empty-state"><p>No requirements captured yet. Click "Edit Requirements" to add.</p></div>';
            return;
        }
        
        container.innerHTML = `
            <div class="requirements-display">
                ${req.standard_vs_non_standard ? `<div class="req-item"><strong>Standard vs Non-Standard:</strong> ${escapeHtml(req.standard_vs_non_standard)}</div>` : ''}
                ${req.integration_expectations ? `<div class="req-item"><strong>Integration Expectations:</strong> ${escapeHtml(req.integration_expectations)}</div>` : ''}
                ${req.specimen_blocks_slides_scope ? `<div class="req-item"><strong>Specimen/Blocks/Slides Scope:</strong> ${escapeHtml(req.specimen_blocks_slides_scope)}</div>` : ''}
                ${req.day1_scope ? `<div class="req-section"><h4>Day 1 (Minimum Viable Go-Live)</h4><p>${escapeHtml(req.day1_scope)}</p></div>` : ''}
                ${req.phase2_scope ? `<div class="req-section"><h4>Day 30 / Phase 2 / Future</h4><p>${escapeHtml(req.phase2_scope)}</p></div>` : ''}
                ${req.content ? `<div class="req-item"><strong>Additional Notes:</strong> ${escapeHtml(req.content)}</div>` : ''}
                ${req.final_playback_confirmed === 1 ? `<div class="req-confirmed">✓ Final requirements playback confirmed</div>` : ''}
                ${req.updated_at ? `<div class="req-updated">Last updated: ${formatDateTime(req.updated_at)}${req.updated_by ? ` by ${escapeHtml(req.updated_by)}` : ''}</div>` : ''}
            </div>
        `;
    } catch (error) {
        console.error('Error loading requirements:', error);
    }
}

// ============ DATE HISTORY (Feature 3) ============
async function renderDateHistory() {
    if (!currentClient) return;
    
    try {
        const response = await fetch(`${API}/api/clients/${currentClient.id}/go-live-history`);
        const history = await response.json();
        
        const container = document.getElementById('dateHistorySection');
        if (history.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No date history yet.</p></div>';
            return;
        }
        
        const original = history.find(h => h.original_or_revised === 'original');
        const revised = history.filter(h => h.original_or_revised === 'revised');
        
        let html = '<div class="date-history">';
        if (original) {
            html += `<div class="date-entry original"><strong>Original:</strong> ${formatDate(original.target_date)}</div>`;
        }
        revised.forEach((rev, idx) => {
            html += `<div class="date-entry revised">
                <strong>Revision ${idx + 1}:</strong> ${formatDate(rev.target_date)}
                ${rev.reason_for_change ? `<br><span class="date-reason">Reason: ${escapeHtml(rev.reason_for_change)}</span>` : ''}
                ${rev.approved_by ? `<br><span class="date-approver">Approved by: ${escapeHtml(rev.approved_by)}</span>` : ''}
                ${rev.delay_caused_by ? `<br><span class="date-delay">Delay caused by: ${escapeHtml(rev.delay_caused_by)}</span>` : ''}
            </div>`;
        });
        html += '</div>';
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading date history:', error);
    }
}

// ============ TASKS (Feature 4) ============
async function renderTasks() {
    if (!currentClient) return;
    
    try {
        const response = await fetch(`${API}/api/clients/${currentClient.id}/tasks`);
        const tasks = await response.json();
        
        const container = document.getElementById('tasksSection');
        if (tasks.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No tasks yet. Click "Add Task" to create one.</p></div>';
            return;
        }
        
        container.innerHTML = `
            <table class="tasks-table">
                <thead>
                    <tr>
                        <th>Requirement</th>
                        <th>Owner</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th>Phase</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${tasks.map(task => `
                        <tr class="task-row task-${task.status}">
                            <td>${escapeHtml(task.title)}</td>
                            <td>${escapeHtml(task.owner_team || task.owner_name || 'Unassigned')}</td>
                            <td>${task.due_date ? formatDate(task.due_date) : '-'}</td>
                            <td><span class="task-status-badge status-${task.status}">${task.status}</span></td>
                            <td><span class="task-phase-badge phase-${task.phase}">${task.phase === 'phase_1' ? 'Phase 1' : 'Phase 2'}</span></td>
                            <td>
                                <button class="btn btn-sm btn-secondary" onclick="openTaskModal('${task.id}')">Edit</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

// ============ READINESS (Feature 6) ============
function renderReadiness() {
    if (!currentClient) return;
    
    const container = document.getElementById('readinessSection');
    const btn = document.getElementById('recordReadinessBtn');
    
    if (currentClient.go_live_readiness_approved === 1) {
        container.innerHTML = `
            <div class="readiness-approved">
                <strong>✓ Approved for go-live</strong>
                <p>Approved by: ${escapeHtml(currentClient.go_live_readiness_approved_by || 'Unknown')}</p>
                <p>Approved at: ${currentClient.go_live_readiness_approved_at ? formatDateTime(currentClient.go_live_readiness_approved_at) : '-'}</p>
                ${currentClient.out_of_scope_phase2 ? `<p><strong>Explicitly out of scope / Phase 2:</strong> ${escapeHtml(currentClient.out_of_scope_phase2)}</p>` : ''}
            </div>
        `;
        btn.style.display = 'none';
    } else {
        container.innerHTML = '<div class="readiness-pending">Not yet approved for go-live. Click "Record Sign-Off" when ready.</div>';
        btn.style.display = 'inline-flex';
    }
}

// ============ ESCALATION (Feature 9) ============
function renderEscalation() {
    if (!currentClient) return;
    
    document.getElementById('customerNonResponsiveCheck').checked = currentClient.customer_non_responsive === 1;
    document.getElementById('salesEscalationCheck').checked = currentClient.sales_escalation_triggered === 1;
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
    document.getElementById('clientLegalEntityInput').value = client.legal_entity || '';
    document.getElementById('clientBrandNameInput').value = client.brand_name || '';
    document.getElementById('clientShortCodeInput').value = client.short_code || '';
    document.getElementById('clientOperatingSitesInput').value = client.operating_sites || '';
    document.getElementById('clientTierInput').value = client.tier || 'standard';
    document.getElementById('clientBDMInput').value = client.bdm_name || '';
    document.getElementById('clientContractDateInput').value = client.contract_date || '';
    document.getElementById('clientGoLiveDateInput').value = client.go_live_date || '';
    document.getElementById('clientPhaseStatusInput').value = client.phase_status || 'planning';
    document.getElementById('clientContractStatusInput').value = client.contract_status || '';
    document.getElementById('clientDpiaRequiredInput').value = client.dpia_required === 1 ? '1' : '0';
    document.getElementById('clientDpiaStatusInput').value = client.dpia_status || '';
    document.getElementById('clientSingleSourceUrlInput').value = client.single_source_url || '';
    document.getElementById('clientNotesInput').value = client.notes || '';
    
    // Show/hide DPIA status based on required
    const dpiaGroup = document.getElementById('dpiaStatusGroup');
    if (dpiaGroup) dpiaGroup.style.display = client.dpia_required === 1 ? 'block' : 'none';
    
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
        legal_entity: document.getElementById('clientLegalEntityInput').value.trim() || null,
        brand_name: document.getElementById('clientBrandNameInput').value.trim() || null,
        short_code: document.getElementById('clientShortCodeInput').value.trim() || null,
        operating_sites: document.getElementById('clientOperatingSitesInput').value.trim() || null,
        tier: document.getElementById('clientTierInput').value,
        bdm_name: document.getElementById('clientBDMInput').value.trim() || null,
        contract_date: document.getElementById('clientContractDateInput').value || null,
        go_live_date: document.getElementById('clientGoLiveDateInput').value || null,
        phase_status: document.getElementById('clientPhaseStatusInput').value,
        contract_status: document.getElementById('clientContractStatusInput').value || null,
        dpia_required: document.getElementById('clientDpiaRequiredInput').value === '1',
        dpia_status: document.getElementById('clientDpiaStatusInput').value || null,
        single_source_url: document.getElementById('clientSingleSourceUrlInput').value.trim() || null,
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
            await openClientDetail(id);
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

// ============ NEW MODAL HANDLERS ============

// Gating Modal
function openGatingModal() {
    if (!currentClient) return;
    document.getElementById('gatingClientId').value = currentClient.id;
    document.getElementById('gatingContractStatus').value = currentClient.contract_status || '';
    document.getElementById('gatingDpiaRequired').value = currentClient.dpia_required === 1 ? '1' : '0';
    document.getElementById('gatingDpiaStatus').value = currentClient.dpia_status || '';
    const dpiaGroup = document.getElementById('gatingDpiaStatusGroup');
    if (dpiaGroup) dpiaGroup.style.display = currentClient.dpia_required === 1 ? 'block' : 'none';
    document.getElementById('gatingModal').classList.add('active');
}

function closeGatingModal() {
    document.getElementById('gatingModal').classList.remove('active');
}

async function handleGatingSubmit(e) {
    e.preventDefault();
    const clientId = document.getElementById('gatingClientId').value;
    const data = {
        contract_status: document.getElementById('gatingContractStatus').value || null,
        dpia_required: document.getElementById('gatingDpiaRequired').value === '1',
        dpia_status: document.getElementById('gatingDpiaStatus').value || null
    };
    
    try {
        await fetch(`${API}/api/clients/${clientId}/gating`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        closeGatingModal();
        await openClientDetail(clientId);
    } catch (error) {
        console.error('Error updating gating:', error);
        alert('Failed to update gating');
    }
}

// Date Change Modal
function openDateChangeModal() {
    if (!currentClient) return;
    document.getElementById('dateChangeClientId').value = currentClient.id;
    document.getElementById('dateChangeTargetDate').value = currentClient.go_live_date || '';
    document.getElementById('dateChangeForm').reset();
    document.getElementById('dateChangeModal').classList.add('active');
}

function closeDateChangeModal() {
    document.getElementById('dateChangeModal').classList.remove('active');
}

async function handleDateChangeSubmit(e) {
    e.preventDefault();
    const clientId = document.getElementById('dateChangeClientId').value;
    const data = {
        target_date: document.getElementById('dateChangeTargetDate').value,
        reason_for_change: document.getElementById('dateChangeReason').value.trim(),
        approved_by: document.getElementById('dateChangeApprovedBy').value.trim(),
        delay_caused_by: document.getElementById('dateChangeDelayCausedBy').value || null
    };
    
    if (!data.target_date || !data.reason_for_change || !data.approved_by) {
        alert('Please fill in all required fields');
        return;
    }
    
    try {
        await fetch(`${API}/api/clients/${clientId}/go-live-date`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        closeDateChangeModal();
        await openClientDetail(clientId);
    } catch (error) {
        console.error('Error updating date:', error);
        alert('Failed to update date');
    }
}

// Requirements Modal
async function openRequirementsModal() {
    if (!currentClient) return;
    document.getElementById('requirementsClientId').value = currentClient.id;
    
    try {
        const response = await fetch(`${API}/api/clients/${currentClient.id}/requirements`);
        const req = await response.json();
        
        if (req) {
            document.getElementById('requirementsStandardVsNonStandard').value = req.standard_vs_non_standard || '';
            document.getElementById('requirementsIntegration').value = req.integration_expectations || '';
            document.getElementById('requirementsSpecimenScope').value = req.specimen_blocks_slides_scope || '';
            document.getElementById('requirementsDay1Scope').value = req.day1_scope || '';
            document.getElementById('requirementsPhase2Scope').value = req.phase2_scope || '';
            document.getElementById('requirementsContent').value = req.content || '';
            document.getElementById('requirementsPlaybackConfirmed').checked = req.final_playback_confirmed === 1;
        } else {
            document.getElementById('requirementsForm').reset();
        }
        
        document.getElementById('requirementsModal').classList.add('active');
    } catch (error) {
        console.error('Error loading requirements:', error);
        alert('Failed to load requirements');
    }
}

function closeRequirementsModal() {
    document.getElementById('requirementsModal').classList.remove('active');
}

async function handleRequirementsSubmit(e) {
    e.preventDefault();
    const clientId = document.getElementById('requirementsClientId').value;
    const data = {
        standard_vs_non_standard: document.getElementById('requirementsStandardVsNonStandard').value.trim() || null,
        integration_expectations: document.getElementById('requirementsIntegration').value.trim() || null,
        specimen_blocks_slides_scope: document.getElementById('requirementsSpecimenScope').value.trim() || null,
        day1_scope: document.getElementById('requirementsDay1Scope').value.trim() || null,
        phase2_scope: document.getElementById('requirementsPhase2Scope').value.trim() || null,
        content: document.getElementById('requirementsContent').value.trim() || null,
        final_playback_confirmed: document.getElementById('requirementsPlaybackConfirmed').checked,
        updated_by: 'Current User' // In production, get from auth
    };
    
    try {
        await fetch(`${API}/api/clients/${clientId}/requirements`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        closeRequirementsModal();
        await openClientDetail(clientId);
    } catch (error) {
        console.error('Error saving requirements:', error);
        alert('Failed to save requirements');
    }
}

// Task Modal
async function openTaskModal(taskId) {
    if (!currentClient) return;
    document.getElementById('taskClientId').value = currentClient.id;
    document.getElementById('taskId').value = taskId || '';
    document.getElementById('taskModalTitle').textContent = taskId ? 'Edit Task' : 'Add Task';
    
    if (taskId) {
        try {
            const response = await fetch(`${API}/api/clients/${currentClient.id}/tasks`);
            const tasks = await response.json();
            const task = tasks.find(t => t.id === taskId);
            
            if (task) {
                document.getElementById('taskTitle').value = task.title || '';
                document.getElementById('taskOwnerTeam').value = task.owner_team || '';
                document.getElementById('taskOwnerName').value = task.owner_name || '';
                document.getElementById('taskStartDate').value = task.start_date || '';
                document.getElementById('taskDueDate').value = task.due_date || '';
                document.getElementById('taskCompletionDate').value = task.completion_date || '';
                document.getElementById('taskStatus').value = task.status || 'not_started';
                document.getElementById('taskPhase').value = task.phase || 'phase_1';
                document.getElementById('taskSeverity').value = task.severity || '';
                document.getElementById('taskCompletionEvidence').value = task.completion_evidence || '';
            }
        } catch (error) {
            console.error('Error loading task:', error);
        }
    } else {
        document.getElementById('taskForm').reset();
    }
    
    document.getElementById('taskModal').classList.add('active');
}

function closeTaskModal() {
    document.getElementById('taskModal').classList.remove('active');
}

async function handleTaskSubmit(e) {
    e.preventDefault();
    const clientId = document.getElementById('taskClientId').value;
    const taskId = document.getElementById('taskId').value;
    const data = {
        title: document.getElementById('taskTitle').value.trim(),
        owner_team: document.getElementById('taskOwnerTeam').value.trim() || null,
        owner_name: document.getElementById('taskOwnerName').value.trim() || null,
        start_date: document.getElementById('taskStartDate').value || null,
        due_date: document.getElementById('taskDueDate').value || null,
        completion_date: document.getElementById('taskCompletionDate').value || null,
        status: document.getElementById('taskStatus').value,
        phase: document.getElementById('taskPhase').value,
        severity: document.getElementById('taskSeverity').value || null,
        completion_evidence: document.getElementById('taskCompletionEvidence').value.trim() || null
    };
    
    if (!data.title) {
        alert('Please enter a task title');
        return;
    }
    
    try {
        if (taskId) {
            await fetch(`${API}/api/clients/${clientId}/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            await fetch(`${API}/api/clients/${clientId}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }
        closeTaskModal();
        await openClientDetail(clientId);
    } catch (error) {
        console.error('Error saving task:', error);
        alert('Failed to save task');
    }
}

// Readiness Modal
function openReadinessModal() {
    if (!currentClient) return;
    document.getElementById('readinessClientId').value = currentClient.id;
    document.getElementById('readinessForm').reset();
    document.getElementById('readinessModal').classList.add('active');
}

function closeReadinessModal() {
    document.getElementById('readinessModal').classList.remove('active');
}

async function handleReadinessSubmit(e) {
    e.preventDefault();
    const clientId = document.getElementById('readinessClientId').value;
    const data = {
        approved_by: document.getElementById('readinessApprovedBy').value.trim(),
        out_of_scope_phase2: document.getElementById('readinessOutOfScope').value.trim() || null
    };
    
    if (!data.approved_by) {
        alert('Please enter the approver name');
        return;
    }
    
    try {
        await fetch(`${API}/api/clients/${clientId}/go-live-readiness`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        closeReadinessModal();
        await openClientDetail(clientId);
    } catch (error) {
        console.error('Error recording readiness:', error);
        alert('Failed to record readiness');
    }
}

// Escalation Handler
async function handleEscalationChange() {
    if (!currentClient) return;
    const data = {
        customer_non_responsive: document.getElementById('customerNonResponsiveCheck').checked,
        sales_escalation_triggered: document.getElementById('salesEscalationCheck').checked
    };
    
    try {
        await fetch(`${API}/api/clients/${currentClient.id}/escalation`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        await openClientDetail(currentClient.id);
    } catch (error) {
        console.error('Error updating escalation:', error);
    }
}

// Portfolio View (Feature 12)
async function loadPortfolio() {
    try {
        const response = await fetch(`${API}/api/portfolio`);
        const portfolio = await response.json();
        renderPortfolio(portfolio);
    } catch (error) {
        console.error('Error loading portfolio:', error);
    }
}

function renderPortfolio(clients) {
    const container = document.getElementById('portfolioTable');
    if (clients.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No active clients in portfolio.</p></div>';
        return;
    }
    
    const phaseStatusMap = {
        'planning': { label: 'Planning', class: 'phase-planning' },
        'discovery': { label: 'Discovery', class: 'phase-discovery' },
        'in_build': { label: 'In Build', class: 'phase-build' },
        'ready_to_go_live': { label: 'Ready', class: 'phase-ready' },
        'live': { label: 'Live', class: 'phase-live' }
    };
    
    container.innerHTML = `
        <table class="portfolio-table">
            <thead>
                <tr>
                    <th>Client</th>
                    <th>Phase Status</th>
                    <th>Current Stage</th>
                    <th>Key Blockers</th>
                    <th>Target Go-Live</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${clients.map(client => {
                    const phaseInfo = phaseStatusMap[client.phase_status] || phaseStatusMap.planning;
                    const blockers = client.key_blockers && client.key_blockers.length > 0 
                        ? client.key_blockers.join(', ') 
                        : '-';
                    return `
                        <tr>
                            <td>
                                <strong>${escapeHtml(client.name)}</strong>
                                ${client.short_code ? `<br><span class="short-code">${escapeHtml(client.short_code)}</span>` : ''}
                            </td>
                            <td><span class="phase-badge ${phaseInfo.class}">${phaseInfo.label}</span></td>
                            <td>Stage ${client.current_stage || 1}</td>
                            <td>${escapeHtml(blockers)}</td>
                            <td>${client.go_live_date ? formatDate(client.go_live_date) : '-'}</td>
                            <td>${client.updated_at ? formatDateTime(client.updated_at) : '-'}</td>
                            <td><button class="btn btn-sm btn-primary" onclick="openClientDetail('${client.id}')">View</button></td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
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

// Make functions global for inline handlers
window.showView = showView;
window.closeClientModal = closeClientModal;
window.closeAssignModal = closeAssignModal;
window.closeGatingModal = closeGatingModal;
window.closeDateChangeModal = closeDateChangeModal;
window.closeRequirementsModal = closeRequirementsModal;
window.closeTaskModal = closeTaskModal;
window.closeReadinessModal = closeReadinessModal;
window.openClientDetail = openClientDetail;
window.openTaskModal = openTaskModal;
