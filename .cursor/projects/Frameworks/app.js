// API Configuration
const API_BASE_URL = window.location.origin;

// State management
let steps = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadSteps();
    setupEventListeners();
});

// API Functions
async function loadSteps() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/steps`);
        if (!response.ok) throw new Error('Failed to load steps');
        steps = await response.json();
        renderSteps();
        updateProgress();
    } catch (error) {
        console.error('Error loading steps:', error);
        showError('Failed to load steps. Make sure the server is running.');
    }
}

async function createStep(stepData) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/steps`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(stepData)
        });
        if (!response.ok) throw new Error('Failed to create step');
        const newStep = await response.json();
        await loadSteps(); // Reload all steps
        return newStep;
    } catch (error) {
        console.error('Error creating step:', error);
        throw error;
    }
}

async function updateStep(stepId, stepData) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/steps/${stepId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(stepData)
        });
        if (!response.ok) throw new Error('Failed to update step');
        const updatedStep = await response.json();
        await loadSteps(); // Reload all steps
        return updatedStep;
    } catch (error) {
        console.error('Error updating step:', error);
        throw error;
    }
}

async function deleteStep(stepId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/steps/${stepId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete step');
        await loadSteps(); // Reload all steps
    } catch (error) {
        console.error('Error deleting step:', error);
        throw error;
    }
}

async function toggleStepCompletion(stepId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/steps/${stepId}/toggle`, {
            method: 'PATCH'
        });
        if (!response.ok) throw new Error('Failed to toggle step');
        await loadSteps(); // Reload all steps
    } catch (error) {
        console.error('Error toggling step:', error);
        throw error;
    }
}

async function getStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/stats`);
        if (!response.ok) throw new Error('Failed to load stats');
        return await response.json();
    } catch (error) {
        console.error('Error loading stats:', error);
        throw error;
    }
}

// Event Listeners
function setupEventListeners() {
    // Add step button
    document.getElementById('addStepBtn').addEventListener('click', () => {
        openAddModal();
    });

    // Share button
    document.getElementById('shareBtn').addEventListener('click', () => {
        openShareModal();
    });

    // Modal close buttons
    document.getElementById('closeAddModal').addEventListener('click', closeAddModal);
    document.getElementById('closeEditModal').addEventListener('click', closeEditModal);
    document.getElementById('closeShareModal').addEventListener('click', closeShareModal);
    document.getElementById('cancelAddStep').addEventListener('click', closeAddModal);
    document.getElementById('cancelEditStep').addEventListener('click', closeEditModal);

    // Forms
    document.getElementById('addStepForm').addEventListener('submit', handleAddStep);
    document.getElementById('editStepForm').addEventListener('submit', handleEditStep);

    // Copy URL button
    document.getElementById('copyUrlBtn').addEventListener('click', copyShareUrl);

    // Close modals on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// Render steps
function renderSteps() {
    const container = document.getElementById('frameworkContainer');
    const emptyState = document.getElementById('emptyState');

    if (steps.length === 0) {
        container.innerHTML = '';
        emptyState.classList.add('visible');
        return;
    }

    emptyState.classList.remove('visible');
    container.innerHTML = steps.map((step, index) => createStepCard(step, index)).join('');
    
    // Attach event listeners to rendered cards
    attachStepEventListeners();
}

function createStepCard(step, index) {
    const isCompleted = step.completed || false;
    const leader = step.leader || '';
    const category = step.category || 'other';
    
    return `
        <div class="step-card ${isCompleted ? 'completed' : ''}" data-id="${step.id}">
            <div class="step-header">
                <div class="step-title-section">
                    <span class="step-number">${index + 1}</span>
                    <h3 class="step-title">${escapeHtml(step.title)}</h3>
                </div>
                <div class="step-actions">
                    <button class="btn btn-sm btn-secondary edit-step" data-id="${step.id}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Edit
                    </button>
                    <button class="btn btn-sm btn-danger delete-step" data-id="${step.id}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        Delete
                    </button>
                </div>
            </div>
            ${step.description ? `<p class="step-description">${escapeHtml(step.description)}</p>` : ''}
            <div class="step-meta">
                <div class="step-meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span class="step-leader ${leader ? '' : 'empty'}" data-id="${step.id}" data-leader="${leader || ''}">
                        ${leader || 'No leader assigned'}
                    </span>
                    <button class="btn btn-sm btn-secondary assign-leader-btn" data-id="${step.id}" title="Assign Leader">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="8.5" cy="7" r="4"></circle>
                            <line x1="20" y1="8" x2="20" y2="14"></line>
                            <line x1="23" y1="11" x2="17" y2="11"></line>
                        </svg>
                        ${leader ? 'Change' : 'Assign'}
                    </button>
                </div>
                <span class="step-category ${category}">${category}</span>
                <span class="step-status ${isCompleted ? 'completed' : 'pending'}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        ${isCompleted 
                            ? '<path d="M20 6L9 17l-5-5"></path>'
                            : '<circle cx="12" cy="12" r="10"></circle>'
                        }
                    </svg>
                    ${isCompleted ? 'Completed' : 'Pending'}
                </span>
            </div>
        </div>
    `;
}

function attachStepEventListeners() {
    // Edit buttons
    document.querySelectorAll('.edit-step').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const stepId = e.currentTarget.dataset.id;
            openEditModal(stepId);
        });
    });

    // Delete buttons
    document.querySelectorAll('.delete-step').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const stepId = e.currentTarget.dataset.id;
            if (confirm('Are you sure you want to delete this step?')) {
                try {
                    await deleteStep(stepId);
                } catch (error) {
                    alert('Failed to delete step. Please try again.');
                }
            }
        });
    });

    // Assign leader buttons
    document.querySelectorAll('.assign-leader-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const stepId = btn.dataset.id;
            const step = steps.find(s => s.id === stepId);
            const currentLeader = step?.leader || '';
            
            const leaderName = prompt('Enter the name of the person leading this step:', currentLeader);
            if (leaderName !== null && leaderName.trim() !== '') {
                try {
                    await updateStep(stepId, {
                        title: step.title,
                        description: step.description || '',
                        leader: leaderName.trim(),
                        category: step.category || 'other',
                        completed: step.completed || false,
                        step_order: step.step_order || 0
                    });
                } catch (error) {
                    alert('Failed to assign leader. Please try again.');
                }
            }
        });
    });

    // Toggle completion on card click
    document.querySelectorAll('.step-card').forEach(card => {
        card.addEventListener('click', async (e) => {
            // Don't toggle if clicking on buttons or inputs
            if (e.target.closest('.step-actions') || e.target.closest('button')) {
                return;
            }
            const stepId = card.dataset.id;
            try {
                await toggleStepCompletion(stepId);
            } catch (error) {
                alert('Failed to update step. Please try again.');
            }
        });
    });
}

// Step Management
async function handleAddStep(e) {
    e.preventDefault();
    
    const title = document.getElementById('stepTitle').value.trim();
    const description = document.getElementById('stepDescription').value.trim();
    const leader = document.getElementById('stepLeader').value.trim();
    const category = document.getElementById('stepCategory').value;

    if (!title) {
        alert('Please enter a step title');
        return;
    }

    try {
        await createStep({
            title,
            description: description || null,
            leader: leader || null,
            category: category || 'other',
            step_order: steps.length
        });
        closeAddModal();
        resetAddForm();
    } catch (error) {
        alert('Failed to create step. Please try again.');
    }
}

async function handleEditStep(e) {
    e.preventDefault();
    
    const stepId = document.getElementById('editStepId').value;
    const title = document.getElementById('editStepTitle').value.trim();
    const description = document.getElementById('editStepDescription').value.trim();
    const leader = document.getElementById('editStepLeader').value.trim();
    const category = document.getElementById('editStepCategory').value;
    const completed = document.getElementById('editStepCompleted').checked;

    if (!title) {
        alert('Please enter a step title');
        return;
    }

    try {
        const step = steps.find(s => s.id === stepId);
        await updateStep(stepId, {
            title,
            description: description || null,
            leader: leader || null,
            category: category || 'other',
            completed,
            step_order: step?.step_order || 0
        });
        closeEditModal();
    } catch (error) {
        alert('Failed to update step. Please try again.');
    }
}

// Modal Management
function openAddModal() {
    document.getElementById('addStepModal').classList.add('active');
    document.getElementById('stepTitle').focus();
}

function closeAddModal() {
    document.getElementById('addStepModal').classList.remove('active');
    resetAddForm();
}

function resetAddForm() {
    document.getElementById('addStepForm').reset();
}

function openEditModal(stepId) {
    const step = steps.find(s => s.id === stepId);
    if (!step) return;

    document.getElementById('editStepId').value = step.id;
    document.getElementById('editStepTitle').value = step.title;
    document.getElementById('editStepDescription').value = step.description || '';
    document.getElementById('editStepLeader').value = step.leader || '';
    document.getElementById('editStepCategory').value = step.category || 'other';
    document.getElementById('editStepCompleted').checked = step.completed || false;

    document.getElementById('editStepModal').classList.add('active');
}

function closeEditModal() {
    document.getElementById('editStepModal').classList.remove('active');
}

async function openShareModal() {
    const url = window.location.href;
    document.getElementById('shareUrl').value = url;
    
    try {
        const stats = await getStats();
        document.getElementById('totalSteps').textContent = stats.total;
        document.getElementById('completedSteps').textContent = stats.completed;
        document.getElementById('pendingSteps').textContent = stats.pending;
    } catch (error) {
        // Fallback to local calculation
        const completed = steps.filter(s => s.completed).length;
        const pending = steps.filter(s => !s.completed).length;
        document.getElementById('totalSteps').textContent = steps.length;
        document.getElementById('completedSteps').textContent = completed;
        document.getElementById('pendingSteps').textContent = pending;
    }
    
    document.getElementById('shareModal').classList.add('active');
}

function closeShareModal() {
    document.getElementById('shareModal').classList.remove('active');
}

function copyShareUrl() {
    const urlInput = document.getElementById('shareUrl');
    urlInput.select();
    urlInput.setSelectionRange(0, 99999); // For mobile devices
    
    try {
        document.execCommand('copy');
        const btn = document.getElementById('copyUrlBtn');
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        btn.style.background = 'var(--success-color)';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);
    } catch (err) {
        // Fallback for modern browsers
        navigator.clipboard.writeText(urlInput.value).then(() => {
            const btn = document.getElementById('copyUrlBtn');
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            btn.style.background = 'var(--success-color)';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
        }).catch(() => {
            alert('Failed to copy URL. Please copy it manually.');
        });
    }
}

// Progress Management
function updateProgress() {
    if (steps.length === 0) {
        document.getElementById('progressPercentage').textContent = '0%';
        document.getElementById('progressFill').style.width = '0%';
        return;
    }

    const completed = steps.filter(s => s.completed).length;
    const percentage = Math.round((completed / steps.length) * 100);
    
    document.getElementById('progressPercentage').textContent = `${percentage}%`;
    document.getElementById('progressFill').style.width = `${percentage}%`;
}

// Utility
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    // Simple error display - you can enhance this
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #ef4444; color: white; padding: 1rem; border-radius: 8px; z-index: 10000;';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}
