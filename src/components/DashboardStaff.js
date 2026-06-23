import { db, getCasesByStatus } from '../verdiqo_db.js';
import { VerificationEngine } from '../utils/verificationEngine.js';

export const DashboardStaff = {
    render(container, state, onUpdate) {
        if (!state.staffActiveTab) {
            state.staffActiveTab = 'dashboard';
        }

        container.innerHTML = `
            <div class="staff-layout" style="display: flex; flex-direction: column; gap: 20px;">
                <!-- Sub Navigation Bar -->
                <div class="sub-nav" style="display: flex; gap: 15px; border-bottom: 2px solid var(--color-border); padding-bottom: 10px;">
                    <button class="btn ${state.staffActiveTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}" id="staff-tab-dash" style="font-weight: 600;">
                        📁 Applications Dashboard
                    </button>
                    <button class="btn ${state.staffActiveTab === 'new-form' ? 'btn-primary' : 'btn-secondary'}" id="staff-tab-new" style="font-weight: 600;">
                        ➕ New Bail Application
                    </button>
                </div>

                <div id="staff-content-mount"></div>
            </div>
        `;

        const mount = container.querySelector('#staff-content-mount');

        if (state.staffActiveTab === 'dashboard') {
            this.renderDashboard(mount, state, onUpdate);
        } else {
            this.renderNewForm(mount, state, onUpdate);
        }

        // Event Listeners for sub-nav
        container.querySelector('#staff-tab-dash').addEventListener('click', () => {
            state.staffActiveTab = 'dashboard';
            onUpdate();
        });
        container.querySelector('#staff-tab-new').addEventListener('click', () => {
            state.staffActiveTab = 'new-form';
            onUpdate();
        });
    },
    renderDashboard(mount, state, onUpdate) {
        // Top counters calculation
        const allCases = state.cases;
        const totalToday = allCases.length;

        const getCaseCategory = (c) => {
            const risk = parseInt(c.checks?.risk?.score || c.aiRiskScore0100 || c.aiRiskScore010 || "0");
            const status = c.applicationStatus || 'CHECKING';
            if (status === 'ALERT' || status === 'DENIED' || risk >= 80) {
                return 'alert';
            } else if (status === 'CHECKING') {
                return 'checking';
            } else {
                return 'verified';
            }
        };

        const verifiedReady = allCases.filter(c => getCaseCategory(c) === 'verified').length;
        const stillChecking = allCases.filter(c => getCaseCategory(c) === 'checking').length;
        const alertsRaised = allCases.filter(c => getCaseCategory(c) === 'alert').length;

        // Current filter (stored on state so it survives tab switches)
        if (!state.ledgerFilter) state.ledgerFilter = 'all';

        const filterLabels = {
            all: 'All Applications',
            verified: 'Verified & Ready',
            checking: 'Still Checking',
            alert: 'Alerts Raised'
        };

        // Helper: get filtered list
        const getFiltered = (filter) => {
            if (filter === 'verified') return allCases.filter(c => getCaseCategory(c) === 'verified');
            if (filter === 'checking') return allCases.filter(c => getCaseCategory(c) === 'checking');
            if (filter === 'alert') return allCases.filter(c => getCaseCategory(c) === 'alert');
            return allCases;
        };

        const buildRows = (cases) => {
            if (cases.length === 0) return `
                <tr><td colspan="6" style="padding: 30px; text-align: center; color: var(--color-text-muted); font-size: 15px;">
                    No cases match this filter.
                </td></tr>`;
            return cases.map(c => {
                let badgeBg = '';
                let badgeColor = '#FFFFFF';
                const status = c.applicationStatus || 'CHECKING';
                if (status === 'GRANTED') { badgeBg = 'var(--color-success)'; }
                else if (status === 'CHECKING') { badgeBg = 'var(--color-warning)'; }
                else if (status === 'ALERT') { badgeBg = 'var(--color-danger)'; }
                else if (status === 'DENIED') { badgeBg = '#7f1d1d'; }
                else { badgeBg = '#4b5563'; }

                return `
                    <tr class="clickable-row" data-caseno="${c.caseNumber}" style="border-bottom: 1px solid var(--color-border); cursor: pointer; transition: background 0.2s;">
                        <td style="padding: 14px 12px; font-weight: 600; color: var(--color-text-main); font-size: 15px;">${c.accused.fullName}</td>
                        <td style="padding: 14px 12px; font-family: var(--font-mono); color: var(--color-text-muted); font-size: 14px;">${c.caseNumber}</td>
                        <td style="padding: 14px 12px; color: var(--color-text-muted); font-size: 14px;">${c.ipcSections}</td>
                        <td style="padding: 14px 12px; color: var(--color-text-muted); font-size: 14px;">${c.bailType}</td>
                        <td style="padding: 14px 12px; font-family: var(--font-mono); color: var(--color-text-muted); font-size: 14px;">${c.hearingDate ? c.hearingDate.split('T')[1] || '10:30' : '10:30'}</td>
                        <td style="padding: 14px 12px;">
                            <span class="badge" style="background: ${badgeBg}; color: ${badgeColor}; padding: 5px 10px; border-radius: 4px; font-size: 12.5px; font-weight: 700;">${status}</span>
                        </td>
                    </tr>`;
            }).join('');
        };

        const cardStyle = (filter, borderColor) => {
            const isActive = state.ledgerFilter === filter;
            return `background: var(--color-card-dark); border-left: 5px solid ${borderColor}; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); cursor: pointer; transition: box-shadow 0.2s, transform 0.15s; ${isActive ? 'box-shadow: 0 0 0 3px ' + borderColor + ', 0 4px 12px rgba(0,0,0,0.2); transform: translateY(-2px);' : ''}`;
        };

        mount.innerHTML = `
            <!-- Counters Grid -->
            <div class="counters-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px;">
                <div class="kpi-filter-card" data-filter="all" style="${cardStyle('all', 'var(--color-navy-sec)')}">
                    <div style="font-size: 14px; color: var(--color-text-muted); text-transform: uppercase; font-weight: 600;">Total Applications Today</div>
                    <div style="font-size: 36px; font-weight: 800; color: var(--color-blue-num); font-family: var(--font-mono);">${totalToday}</div>
                    <div style="font-size: 12px; color: var(--color-text-muted); margin-top: 4px;">Click to show all ↗</div>
                </div>
                <div class="kpi-filter-card" data-filter="verified" style="${cardStyle('verified', 'var(--color-success)')}">
                    <div style="font-size: 14px; color: var(--color-text-muted); text-transform: uppercase; font-weight: 600;">Verified &amp; Ready</div>
                    <div style="font-size: 36px; font-weight: 800; color: var(--color-success); font-family: var(--font-mono);">${verifiedReady}</div>
                    <div style="font-size: 12px; color: var(--color-text-muted); margin-top: 4px;">Click to filter ↗</div>
                </div>
                <div class="kpi-filter-card" data-filter="checking" style="${cardStyle('checking', 'var(--color-warning)')}">
                    <div style="font-size: 14px; color: var(--color-text-muted); text-transform: uppercase; font-weight: 600;">Still Checking</div>
                    <div style="font-size: 36px; font-weight: 800; color: var(--color-warning); font-family: var(--font-mono);">${stillChecking}</div>
                    <div style="font-size: 12px; color: var(--color-text-muted); margin-top: 4px;">Click to filter ↗</div>
                </div>
                <div class="kpi-filter-card" data-filter="alert" style="${cardStyle('alert', 'var(--color-danger)')}">
                    <div style="font-size: 14px; color: var(--color-text-muted); text-transform: uppercase; font-weight: 600;">Alerts Raised</div>
                    <div style="font-size: 36px; font-weight: 800; color: var(--color-danger); font-family: var(--font-mono);">${alertsRaised}</div>
                    <div style="font-size: 12px; color: var(--color-text-muted); margin-top: 4px;">Click to filter ↗</div>
                </div>
            </div>

            <!-- Case List Table -->
            <div class="card" style="background: var(--color-card-dark); border: 1px solid var(--color-border); border-radius: 8px; padding: 20px; margin-top: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div>
                        <h3 style="color: var(--color-text-main); font-family: var(--font-brand); margin: 0 0 4px 0; font-size: 22px;">Applications Ledger</h3>
                        <div id="ledger-filter-label" style="font-size: 14px; color: var(--color-gold); font-weight: 600;">
                            Showing: ${filterLabels[state.ledgerFilter]}
                            ${state.ledgerFilter !== 'all' ? `<span id="clear-filter-btn" style="margin-left: 10px; color: var(--color-text-muted); cursor: pointer; text-decoration: underline; font-weight: 400;">✕ Clear filter</span>` : ''}
                        </div>
                    </div>
                    <span id="ledger-record-count" style="font-size: 14px; color: var(--color-text-muted); font-weight: 600;">${getFiltered(state.ledgerFilter).length} record(s)</span>
                </div>
                <div class="table-container" style="overflow-x: auto;">
                    <table class="data-table" style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead>
                            <tr style="background: var(--color-table-header); color: var(--color-text-main); border-bottom: 2px solid var(--color-border); font-size: 14px; font-weight: 700;">
                                <th style="padding: 14px 12px;">Accused Name</th>
                                <th style="padding: 14px 12px;">Case Number</th>
                                <th style="padding: 14px 12px;">IPC Sections</th>
                                <th style="padding: 14px 12px;">Bail Type</th>
                                <th style="padding: 14px 12px;">Hearing Time</th>
                                <th style="padding: 14px 12px;">Status</th>
                            </tr>
                        </thead>
                        <tbody id="case-table-body" style="font-size: 14.5px;">
                            ${buildRows(getFiltered(state.ledgerFilter))}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // KPI card click → filter table live (no full re-render)
        mount.querySelectorAll('.kpi-filter-card').forEach(card => {
            card.addEventListener('click', () => {
                const filter = card.getAttribute('data-filter');
                state.ledgerFilter = filter;

                // Update card highlight
                mount.querySelectorAll('.kpi-filter-card').forEach(c => {
                    c.style.transform = '';
                    c.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                });
                const borderColors = { all: 'var(--color-navy-sec)', verified: 'var(--color-success)', checking: 'var(--color-warning)', alert: 'var(--color-danger)' };
                card.style.boxShadow = `0 0 0 3px ${borderColors[filter]}, 0 4px 12px rgba(0,0,0,0.2)`;
                card.style.transform = 'translateY(-2px)';

                // Update table rows live
                const tbody = mount.querySelector('#case-table-body');
                tbody.innerHTML = buildRows(getFiltered(filter));

                // Update label
                const label = mount.querySelector('#ledger-filter-label');
                label.innerHTML = `Showing: ${filterLabels[filter]} ${filter !== 'all' ? `<span id="clear-filter-btn" style="margin-left:10px;color:var(--color-text-muted);cursor:pointer;text-decoration:underline;font-weight:400;">✕ Clear filter</span>` : ''}`;
                
                const recordCountSpan = mount.querySelector('#ledger-record-count');
                if (recordCountSpan) {
                    recordCountSpan.textContent = getFiltered(filter).length + ' record(s)';
                }

                // Clear filter click (re-bind since inner HTML replaced)
                const clearBtn = mount.querySelector('#clear-filter-btn');
                if (clearBtn) clearBtn.addEventListener('click', (e) => { e.stopPropagation(); mount.querySelector('[data-filter="all"]').click(); });

                // Reattach row events
                attachRowEvents();
            });
        });

        // Clear filter button (initial render)
        const clearBtn = mount.querySelector('#clear-filter-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                mount.querySelector('[data-filter="all"]').click();
            });
        }

        // Row hover + click
        const attachRowEvents = () => {
            mount.querySelectorAll('.clickable-row').forEach(row => {
                row.addEventListener('mouseover', () => { row.style.background = 'rgba(46, 117, 182, 0.15)'; });
                row.addEventListener('mouseout', () => { row.style.background = 'transparent'; });
                row.addEventListener('click', (e) => {
                    const caseNo = e.currentTarget.getAttribute('data-caseno');
                    state.openDocumentSelector(caseNo);
                });
            });
        };
        attachRowEvents();
    },



    renderNewForm(mount, state, onUpdate) {
        if (!state.formSectionIndex) {
            state.formSectionIndex = 1;
        }
        if (!state.formValues) {
            state.formValues = {};
        }

        // Biometric scanning state (in-memory per form-load)
        if (!state.accusedFingerScanned) state.accusedFingerScanned = false;
        if (!state.accusedIrisScanned) state.accusedIrisScanned = false;
        if (!state.suretyFingerScanned) state.suretyFingerScanned = false;

        const saveFormValues = () => {
            const f = (id) => {
                const el = mount.querySelector(id);
                return el ? el.value : '';
            };
            const c = (id) => {
                const el = mount.querySelector(id);
                return el ? el.checked : false;
            };
            
            const isProp = mount.querySelector('#surety-type-property')?.checked;
            
            state.formValues = {
                caseNo: f('#form-case-no'),
                firNo: f('#form-fir-no'),
                ipc: f('#form-ipc'),
                arrestDate: f('#form-arrest-date'),
                agency: f('#form-agency'),
                officer: f('#form-officer'),
                filingDate: f('#form-filing-date'),
                
                checkCharacter: c('#check-character'),
                checkEmployment: c('#check-employment'),
                checkCommunity: c('#check-community'),
                
                accusedName: f('#form-accused-name'),
                accusedFather: f('#form-accused-father'),
                accusedDob: f('#form-accused-dob'),
                accusedAadhaar: f('#form-accused-aadhaar'),
                accusedPan: f('#form-accused-pan'),
                accusedMobile: f('#form-accused-mobile'),
                accusedDl: f('#form-accused-dl'),
                accusedPassport: f('#form-accused-passport'),
                accusedEmployment: f('#form-accused-employment'),
                accusedIncome: f('#form-accused-income'),
                accusedBank: f('#form-accused-bank'),
                accusedCibil: f('#form-accused-cibil'),
                accusedAddress: f('#form-accused-address'),
                accusedNcrb: f('#form-accused-ncrb'),
                
                suretyType: isProp ? 'Property' : 'Individual',
                
                suretyPropAddr: f('#form-surety-prop-addr'),
                suretySurvey: f('#form-surety-survey'),
                suretyPatta: f('#form-surety-patta'),
                suretyValue: f('#form-surety-value'),
                suretyDeed: f('#form-surety-deed'),
                suretyEncumbrance: f('#form-surety-encumbrance'),
                
                suretyName: f('#form-surety-name'),
                suretyRel: f('#form-surety-rel'),
                suretyMobile: f('#form-surety-mobile'),
                suretyAadhaar: f('#form-surety-aadhaar'),
                suretyPan: f('#form-surety-pan'),
                suretyEmployment: f('#form-surety-employment'),
                suretyIncome: f('#form-surety-income'),
                
                judgeName: f('#form-judge-name'),
                judgeId: f('#form-judge-id'),
                courtName: f('#form-court-name'),
                bailAmount: f('#form-bail-amount'),
                hearingTime: f('#form-hearing-time'),
                
                ppObjections: f('#form-pp-objections'),
                defenceArgs: f('#form-defence-args'),
                prevOrders: f('#form-prev-orders'),
                
                bailType: f('#form-bail-type'),
                bailStatus: f('#form-bail-status'),
                condWeekly: c('#cond-weekly'),
                condPassport: c('#cond-passport'),
                condWitness: c('#cond-witness'),
                condGeo: c('#cond-geo')
            };
        };

        mount.innerHTML = `
            <div class="card" style="background: var(--color-card-dark); border: 1px solid var(--color-border); border-radius: 8px; padding: 25px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--color-border); padding-bottom: 15px;">
                    <h3 style="color: var(--color-text-main); font-family: var(--font-brand); margin: 0; font-size: 18px;">New Bail Application Registration</h3>
                    <button class="btn" id="btn-demo-autofill" style="font-size: 14px; font-weight: 700; background: #e67e22; border: none; color: #FFFFFF; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                        ⚡ Demo Autofill
                    </button>
                </div>
                
                <!-- Tabs for Form Sections -->
                <div class="form-tabs" style="display: flex; gap: 10px; margin-bottom: 25px; flex-wrap: wrap;">
                    <button class="btn ${state.formSectionIndex === 1 ? 'btn-primary' : 'btn-secondary'}" id="form-sec-tab-1" style="font-size: 13px; font-weight: 600;">1. Case Details</button>
                    <button class="btn ${state.formSectionIndex === 2 ? 'btn-primary' : 'btn-secondary'}" id="form-sec-tab-2" style="font-size: 13px; font-weight: 600;">2. Accused Details</button>
                    <button class="btn ${state.formSectionIndex === 3 ? 'btn-primary' : 'btn-secondary'}" id="form-sec-tab-3" style="font-size: 13px; font-weight: 600;">3. Surety Details</button>
                    <button class="btn ${state.formSectionIndex === 4 ? 'btn-primary' : 'btn-secondary'}" id="form-sec-tab-4" style="font-size: 13px; font-weight: 600;">4. Arguments &amp; Court</button>
                </div>

                <!-- Form Panel -->
                <form id="new-bail-form-element" novalidate>
                    <!-- SECTION 1 -->
                    <div id="form-section-1-view" style="display: ${state.formSectionIndex === 1 ? 'block' : 'none'};">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-bottom: 20px;">
                            <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                <label style="color: var(--color-text-muted); font-size: 13px;">Case Number</label>
                                <input type="text" id="form-case-no" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" required placeholder="BMS/2026/00XX" value="${state.formValues.caseNo || ''}">
                            </div>
                            <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                <label style="color: var(--color-text-muted); font-size: 13px;">FIR Number</label>
                                <input type="text" id="form-fir-no" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" required value="${state.formValues.firNo || ''}">
                            </div>
                            <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                <label style="color: var(--color-text-muted); font-size: 13px;">Charged IPC Sections</label>
                                <input type="text" id="form-ipc" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" required placeholder="e.g. IPC 420, 468" value="${state.formValues.ipc || ''}">
                            </div>
                            <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                <label style="color: var(--color-text-muted); font-size: 13px;">Arrest Date</label>
                                <input type="date" id="form-arrest-date" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" required value="${state.formValues.arrestDate || ''}">
                            </div>
                            <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                <label style="color: var(--color-text-muted); font-size: 13px;">Investigating Agency</label>
                                <input type="text" id="form-agency" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" required placeholder="e.g. Rajamundry Town PS" value="${state.formValues.agency || ''}">
                            </div>
                            <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                <label style="color: var(--color-text-muted); font-size: 13px;">PS Officer Name</label>
                                <input type="text" id="form-officer" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" required placeholder="SI Ravi Kumar" value="${state.formValues.officer || ''}">
                            </div>
                            <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                <label style="color: var(--color-text-muted); font-size: 13px;">Application Filing Date</label>
                                <input type="date" id="form-filing-date" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" required value="${state.formValues.filingDate || ''}">
                            </div>
                        </div>

                        <div style="margin-bottom: 24px; padding: 16px; background: var(--color-navy); border: 1px solid var(--color-border); border-radius: 8px;">
                            <div style="font-size: 12px; font-weight: 700; color: var(--color-gold); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px; display: flex; align-items: center; gap: 6px;">
                                📎 Supporting Evidence &amp; Documents
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                <label style="display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: var(--color-card-dark); border: 1px solid var(--color-border); border-radius: 6px; cursor: pointer; transition: border-color 0.2s;">
                                    <input type="checkbox" id="check-character" ${state.formValues.checkCharacter !== false ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: var(--color-gold); cursor: pointer; flex-shrink: 0;">
                                    <div>
                                        <div style="color: var(--color-text-main); font-size: 13px; font-weight: 600;">Character Certificates</div>
                                        <div style="color: var(--color-text-muted); font-size: 11px; margin-top: 2px;">Issued by local authority / employer</div>
                                    </div>
                                </label>
                                <label style="display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: var(--color-card-dark); border: 1px solid var(--color-border); border-radius: 6px; cursor: pointer; transition: border-color 0.2s;">
                                    <input type="checkbox" id="check-employment" ${state.formValues.checkEmployment !== false ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: var(--color-gold); cursor: pointer; flex-shrink: 0;">
                                    <div>
                                        <div style="color: var(--color-text-main); font-size: 13px; font-weight: 600;">Employment Letters</div>
                                        <div style="color: var(--color-text-muted); font-size: 11px; margin-top: 2px;">Current employment / income proof</div>
                                    </div>
                                </label>
                                <label style="display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: var(--color-card-dark); border: 1px solid var(--color-border); border-radius: 6px; cursor: pointer; transition: border-color 0.2s;">
                                    <input type="checkbox" id="check-community" ${state.formValues.checkCommunity !== false ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: var(--color-gold); cursor: pointer; flex-shrink: 0;">
                                    <div>
                                        <div style="color: var(--color-text-main); font-size: 13px; font-weight: 600;">Community Ties Evidence</div>
                                        <div style="color: var(--color-text-muted); font-size: 11px; margin-top: 2px;">Property ownership / family residence proof</div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- SECTION 2 -->
                    <div id="form-section-2-view" style="display: ${state.formSectionIndex === 2 ? 'block' : 'none'};">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-bottom: 20px;">
                            <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                <label style="color: var(--color-text-muted); font-size: 13px;">Accused Full Name</label>
                                <input type="text" id="form-accused-name" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" required value="${state.formValues.accusedName || ''}">
                            </div>
                            <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                <label style="color: var(--color-text-muted); font-size: 13px;">Father's Name</label>
                                <input type="text" id="form-accused-father" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" required value="${state.formValues.accusedFather || ''}">
                            </div>
                            <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                <label style="color: var(--color-text-muted); font-size: 13px;">DOB</label>
                                <input type="date" id="form-accused-dob" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" required value="${state.formValues.accusedDob || ''}">
                            </div>
                            <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                <label style="color: var(--color-text-muted); font-size: 13px;">Aadhaar Number</label>
                                <input type="text" id="form-accused-aadhaar" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" required placeholder="XXXX XXXX XXXX" value="${state.formValues.accusedAadhaar || ''}">
                            </div>
                            <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                <label style="color: var(--color-text-muted); font-size: 13px;">PAN Number</label>
                                <input type="text" id="form-accused-pan" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" required value="${state.formValues.accusedPan || ''}">
                            </div>
                            <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                <label style="color: var(--color-text-muted); font-size: 13px;">Mobile Number</label>
                                <input type="text" id="form-accused-mobile" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" required value="${state.formValues.accusedMobile || ''}">
                            </div>
                            <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                <label style="color: var(--color-text-muted); font-size: 13px;">Driving License (DL) No.</label>
                                <input type="text" id="form-accused-dl" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" value="${state.formValues.accusedDl || ''}">
                            </div>
                            <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                <label style="color: var(--color-text-muted); font-size: 13px;">Passport Number</label>
                                <input type="text" id="form-accused-passport" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" value="${state.formValues.accusedPassport || ''}">
                            </div>
                            <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                <label style="color: var(--color-text-muted); font-size: 13px;">Employment</label>
                                <input type="text" id="form-accused-employment" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" required value="${state.formValues.accusedEmployment || ''}">
                            </div>
                            <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                <label style="color: var(--color-text-muted); font-size: 13px;">Monthly Income (₹)</label>
                                <input type="number" id="form-accused-income" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" required value="${state.formValues.accusedIncome || ''}">
                            </div>
                            <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                <label style="color: var(--color-text-muted); font-size: 13px;">Bank Account No.</label>
                                <input type="text" id="form-accused-bank" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" required value="${state.formValues.accusedBank || ''}">
                            </div>
                            <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                <label style="color: var(--color-text-muted); font-size: 13px;">CIBIL Score</label>
                                <input type="number" id="form-accused-cibil" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" required value="${state.formValues.accusedCibil || ''}">
                            </div>
                        </div>

                        <div class="form-group" style="display: flex; flex-direction: column; gap: 5px; margin-bottom: 20px;">
                            <label style="color: var(--color-text-muted); font-size: 13px;">Residential Address</label>
                            <input type="text" id="form-accused-address" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" required value="${state.formValues.accusedAddress || ''}">
                        </div>

                        <div class="form-group" style="display: flex; flex-direction: column; gap: 5px; margin-bottom: 20px;">
                            <label style="color: var(--color-text-muted); font-size: 13px;">Previous Criminal History (NCRB)</label>
                            <textarea id="form-accused-ncrb" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" rows="2">${state.formValues.accusedNcrb || ''}</textarea>
                        </div>

                        <!-- Biometric panels -->
                        <div style="margin-bottom: 20px;">
                            <label style="color: var(--color-text-muted); font-size: 13px; display: block; margin-bottom: 10px;">Accused Biometric Capture</label>
                            <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                                <div class="bio-panel" style="flex: 1; min-width: 200px; background: var(--color-navy); border: 1px dashed var(--color-border); padding: 18px; border-radius: 8px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; position: relative;">
                                    <div style="color: #FFFFFF; font-size: 13px; font-weight: 600;">Fingerprint Scanning (10 digits)</div>
                                    <div class="biometric-scanner-box" style="position: relative; width: 76px; height: 76px; background: rgba(0, 0, 0, 0.25); border: 2px solid ${state.accusedFingerScanned ? 'var(--color-success)' : (state.accusedFingerScanning ? '#ef4444' : 'var(--color-gold)')}; border-radius: 10px; display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: inset 0 0 10px rgba(0,0,0,0.5);">
                                        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="${state.accusedFingerScanned ? 'var(--color-success)' : (state.accusedFingerScanning ? '#ef4444' : 'var(--color-gold)')}" stroke-width="1.5" style="transition: all 0.3s;">
                                            <path d="M12 2a10 10 0 0 0-1.8 19.8M9 4.3a8 8 0 0 1 6 0M7.2 7a6 6 0 0 1 9.6 0M6 10.3a4 4 0 0 1 4-4M10 6a2 2 0 0 1 4 0" />
                                            <path stroke-linecap="round" d="M12 10a2 2 0 0 0-2 2v2a2 2 0 0 0 4 0v-2a2 2 0 0 0-2-2zM8 12v3M16 12v3" />
                                        </svg>
                                        ${state.accusedFingerScanning 
                                            ? `<div class="scanner-laser-line" style="position: absolute; left: 0; top: 0; width: 100%; height: 3px; background: #ef4444; box-shadow: 0 0 8px #ef4444; animation: scanLaser 1.2s infinite linear;"></div>
                                               <div style="position: absolute; width: 100%; height: 100%; background: rgba(239, 68, 68, 0.12); animation: pulseAlpha 1.2s infinite;"></div>`
                                            : ''
                                        }
                                    </div>
                                    <div id="accused-finger-status" style="font-weight: 700; font-size: 12px; color: ${state.accusedFingerScanned ? 'var(--color-success)' : (state.accusedFingerScanning ? '#ef4444' : 'var(--color-warning)')};">
                                        ${state.accusedFingerScanned ? '✓ Fingeprints Captured' : (state.accusedFingerScanning ? '⚡ Scanning...' : 'Awaiting Scan')}
                                    </div>
                                    <button class="btn btn-secondary" type="button" id="btn-scan-accused-finger" style="font-size: 11px; padding: 5px 10px;" ${state.accusedFingerScanning || state.accusedFingerScanned ? 'disabled' : ''}>
                                        ${state.accusedFingerScanned ? 'Captured' : 'Scan Fingerprints'}
                                    </button>
                                </div>
                                <div class="bio-panel" style="flex: 1; min-width: 200px; background: var(--color-navy); border: 1px dashed var(--color-border); padding: 18px; border-radius: 8px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; position: relative;">
                                    <div style="color: #FFFFFF; font-size: 13px; font-weight: 600;">Retina/Iris Scanning</div>
                                    <div class="biometric-scanner-box" style="position: relative; width: 76px; height: 76px; background: rgba(0, 0, 0, 0.25); border: 2px solid ${state.accusedIrisScanned ? 'var(--color-success)' : (state.accusedIrisScanning ? '#3b82f6' : 'var(--color-gold)')}; border-radius: 10px; display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: inset 0 0 10px rgba(0,0,0,0.5);">
                                        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="${state.accusedIrisScanned ? 'var(--color-success)' : (state.accusedIrisScanning ? '#3b82f6' : 'var(--color-gold)')}" stroke-width="1.5" style="transition: all 0.3s;">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                        ${state.accusedIrisScanning 
                                            ? `<div class="scanner-laser-line" style="position: absolute; left: 0; top: 0; width: 100%; height: 3px; background: #3b82f6; box-shadow: 0 0 8px #3b82f6; animation: scanLaser 1.2s infinite linear;"></div>
                                               <div style="position: absolute; width: 100%; height: 100%; background: rgba(59, 130, 246, 0.12); animation: pulseAlpha 1.2s infinite;"></div>`
                                            : ''
                                        }
                                    </div>
                                    <div id="accused-iris-status" style="font-weight: 700; font-size: 12px; color: ${state.accusedIrisScanned ? 'var(--color-success)' : (state.accusedIrisScanning ? '#3b82f6' : 'var(--color-warning)')};">
                                        ${state.accusedIrisScanned ? '✓ Retina Scanned' : (state.accusedIrisScanning ? '⚡ Scanning...' : 'Awaiting Scan')}
                                    </div>
                                    <button class="btn btn-secondary" type="button" id="btn-scan-accused-iris" style="font-size: 11px; padding: 5px 10px;" ${state.accusedIrisScanning || state.accusedIrisScanned ? 'disabled' : ''}>
                                        ${state.accusedIrisScanned ? 'Retina OK' : 'Scan Retina/Iris'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- SECTION 3 -->
                    <div id="form-section-3-view" style="display: ${state.formSectionIndex === 3 ? 'block' : 'none'};">
                        <!-- Toggle Property vs Individual -->
                        <div style="margin-bottom: 24px; padding: 16px; background: var(--color-navy); border: 1px solid var(--color-border); border-radius: 8px;">
                            <div style="font-size: 12px; font-weight: 700; color: var(--color-gold); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px;">🏛️ Surety Backing Type</div>
                            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                                <label style="flex: 1; min-width: 180px; display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: var(--color-card-dark); border: 2px solid var(--color-border); border-radius: 8px; cursor: pointer; transition: border-color 0.2s;">
                                    <input type="radio" name="surety-type" id="surety-type-property" value="Property" ${state.formValues.suretyType !== 'Individual' ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: var(--color-gold); cursor: pointer; flex-shrink: 0;">
                                    <div>
                                        <div style="color: var(--color-text-main); font-size: 13px; font-weight: 700;">🏠 Property Backed</div>
                                        <div style="color: var(--color-text-muted); font-size: 11px; margin-top: 2px;">Land / immovable asset as collateral</div>
                                    </div>
                                </label>
                                <label style="flex: 1; min-width: 180px; display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: var(--color-card-dark); border: 2px solid var(--color-border); border-radius: 8px; cursor: pointer; transition: border-color 0.2s;">
                                    <input type="radio" name="surety-type" id="surety-type-individual" value="Individual" ${state.formValues.suretyType === 'Individual' ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: var(--color-gold); cursor: pointer; flex-shrink: 0;">
                                    <div>
                                        <div style="color: var(--color-text-main); font-size: 13px; font-weight: 700;">👤 Individual Guarantor</div>
                                        <div style="color: var(--color-text-muted); font-size: 11px; margin-top: 2px;">Solvent person guaranteeing appearance</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <!-- Property Fields -->
                        <div id="surety-property-fields" style="display: ${state.formValues.suretyType !== 'Individual' ? 'block' : 'none'};">
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-bottom: 20px;">
                                <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                    <label style="color: var(--color-text-muted); font-size: 13px;">Property Address</label>
                                    <input type="text" id="form-surety-prop-addr" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" value="${state.formValues.suretyPropAddr || ''}">
                                </div>
                                <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                    <label style="color: var(--color-text-muted); font-size: 13px;">Survey Number</label>
                                    <input type="text" id="form-surety-survey" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" value="${state.formValues.suretySurvey || ''}">
                                </div>
                                <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                    <label style="color: var(--color-text-muted); font-size: 13px;">Patta Number</label>
                                    <input type="text" id="form-surety-patta" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" value="${state.formValues.suretyPatta || ''}">
                                </div>
                                <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                    <label style="color: var(--color-text-muted); font-size: 13px;">Market Value (₹)</label>
                                    <input type="number" id="form-surety-value" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" value="${state.formValues.suretyValue || ''}">
                                </div>
                                <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                    <label style="color: var(--color-text-muted); font-size: 13px;">Title Deed ID</label>
                                    <input type="text" id="form-surety-deed" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" value="${state.formValues.suretyDeed || ''}">
                                </div>
                                <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                    <label style="color: var(--color-text-muted); font-size: 13px;">Encumbrance Status</label>
                                    <select id="form-surety-encumbrance" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;">
                                        <option value="CLEAN" ${state.formValues.suretyEncumbrance === 'CLEAN' ? 'selected' : ''}>Clean / Unencumbered</option>
                                        <option value="AWAITING MUTATION" ${state.formValues.suretyEncumbrance === 'AWAITING MUTATION' ? 'selected' : ''}>Awaiting Mutation</option>
                                        <option value="ENCUMBERED" ${state.formValues.suretyEncumbrance === 'ENCUMBERED' ? 'selected' : ''}>Encumbered / Pledged</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Individual Fields -->
                        <div id="surety-individual-fields" style="display: ${state.formValues.suretyType === 'Individual' ? 'block' : 'none'};">
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-bottom: 20px;">
                                <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                    <label style="color: var(--color-text-muted); font-size: 13px;">Surety Name</label>
                                    <input type="text" id="form-surety-name" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" value="${state.formValues.suretyName || ''}">
                                </div>
                                <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                    <label style="color: var(--color-text-muted); font-size: 13px;">Relationship to Accused</label>
                                    <input type="text" id="form-surety-rel" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" value="${state.formValues.suretyRel || ''}">
                                </div>
                                <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                    <label style="color: var(--color-text-muted); font-size: 13px;">Mobile Number</label>
                                    <input type="text" id="form-surety-mobile" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" value="${state.formValues.suretyMobile || ''}">
                                </div>
                                <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                    <label style="color: var(--color-text-muted); font-size: 13px;">Aadhaar Number</label>
                                    <input type="text" id="form-surety-aadhaar" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" value="${state.formValues.suretyAadhaar || ''}">
                                </div>
                                <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                    <label style="color: var(--color-text-muted); font-size: 13px;">PAN Number</label>
                                    <input type="text" id="form-surety-pan" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" value="${state.formValues.suretyPan || ''}">
                                </div>
                                <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                    <label style="color: var(--color-text-muted); font-size: 13px;">Employment</label>
                                    <input type="text" id="form-surety-employment" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" value="${state.formValues.suretyEmployment || ''}">
                                </div>
                                <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                    <label style="color: var(--color-text-muted); font-size: 13px;">Monthly Income (₹)</label>
                                    <input type="number" id="form-surety-income" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" value="${state.formValues.suretyIncome || ''}">
                                </div>
                            </div>
                        </div>

                        <!-- Surety Biometrics -->
                        <div style="margin-bottom: 20px;">
                            <label style="color: var(--color-text-muted); font-size: 13px; display: block; margin-bottom: 10px;">Surety Biometric Capture</label>
                            <div style="max-width: 260px; background: var(--color-navy); border: 1px dashed var(--color-border); padding: 18px; border-radius: 8px; text-align: center; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 8px; position: relative;">
                                <div style="color: #FFFFFF; font-size: 13px; font-weight: 600;">Fingers/Iris Authentication</div>
                                <div class="biometric-scanner-box" style="position: relative; width: 76px; height: 76px; background: rgba(0, 0, 0, 0.25); border: 2px solid ${state.suretyFingerScanned ? 'var(--color-success)' : (state.suretyFingerScanning ? '#ef4444' : 'var(--color-gold)')}; border-radius: 10px; display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: inset 0 0 10px rgba(0,0,0,0.5);">
                                    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="${state.suretyFingerScanned ? 'var(--color-success)' : (state.suretyFingerScanning ? '#ef4444' : 'var(--color-gold)')}" stroke-width="1.5" style="transition: all 0.3s;">
                                        <path d="M12 2a10 10 0 0 0-1.8 19.8M9 4.3a8 8 0 0 1 6 0M7.2 7a6 6 0 0 1 9.6 0M6 10.3a4 4 0 0 1 4-4M10 6a2 2 0 0 1 4 0" />
                                        <path stroke-linecap="round" d="M12 10a2 2 0 0 0-2 2v2a2 2 0 0 0 4 0v-2a2 2 0 0 0-2-2zM8 12v3M16 12v3" />
                                    </svg>
                                    ${state.suretyFingerScanning 
                                        ? `<div class="scanner-laser-line" style="position: absolute; left: 0; top: 0; width: 100%; height: 3px; background: #ef4444; box-shadow: 0 0 8px #ef4444; animation: scanLaser 1.2s infinite linear;"></div>
                                           <div style="position: absolute; width: 100%; height: 100%; background: rgba(239, 68, 68, 0.12); animation: pulseAlpha 1.2s infinite;"></div>`
                                        : ''
                                    }
                                </div>
                                <div id="surety-finger-status" style="font-weight: 700; font-size: 12px; color: ${state.suretyFingerScanned ? 'var(--color-success)' : (state.suretyFingerScanning ? '#ef4444' : 'var(--color-warning)')};">
                                    ${state.suretyFingerScanned ? '✓ Biometrics Captured' : (state.suretyFingerScanning ? '⚡ Authenticating...' : 'Awaiting Scan')}
                                </div>
                                <button class="btn btn-secondary" type="button" id="btn-scan-surety-finger" style="font-size: 11px; padding: 5px 10px;" ${state.suretyFingerScanning || state.suretyFingerScanned ? 'disabled' : ''}>
                                    ${state.suretyFingerScanned ? 'Verification OK' : 'Scan Biometrics'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- SECTION 4 -->
                    <div id="form-section-4-view" style="display: ${state.formSectionIndex === 4 ? 'block' : 'none'};">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-bottom: 20px;">
                            <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                <label style="color: var(--color-text-muted); font-size: 13px;">Judge Name</label>
                                <input type="text" id="form-judge-name" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" required placeholder="J. Kameswara Rao" value="${state.formValues.judgeName || ''}">
                            </div>
                            <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                <label style="color: var(--color-text-muted); font-size: 13px;">Judge ID</label>
                                <input type="text" id="form-judge-id" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" required placeholder="JUDGE-KAMESWARA" value="${state.formValues.judgeId || ''}">
                            </div>
                            <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                <label style="color: var(--color-text-muted); font-size: 13px;">Court Name</label>
                                <input type="text" id="form-court-name" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" required placeholder="Sessions Court Room 2" value="${state.formValues.courtName || ''}">
                            </div>
                            <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                <label style="color: var(--color-text-muted); font-size: 13px;">Bail Type</label>
                                <select id="form-bail-type" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;">
                                    <option value="First Bail" ${state.formValues.bailType === 'First Bail' ? 'selected' : ''}>First Bail</option>
                                    <option value="Anticipatory" ${state.formValues.bailType === 'Anticipatory' ? 'selected' : ''}>Anticipatory</option>
                                    <option value="Second Bail" ${state.formValues.bailType === 'Second Bail' ? 'selected' : ''}>Second Bail</option>
                                </select>
                            </div>
                            <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                <label style="color: var(--color-text-muted); font-size: 13px;">Proposed Bail Amount (₹)</label>
                                <input type="number" id="form-bail-amount" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" required value="${state.formValues.bailAmount || ''}">
                            </div>
                            <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                <label style="color: var(--color-text-muted); font-size: 13px;">Hearing Date & Time</label>
                                <input type="datetime-local" id="form-hearing-time" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" required value="${state.formValues.hearingTime || ''}">
                            </div>
                            <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                <label style="color: var(--color-text-muted); font-size: 13px;">Bail Case Status</label>
                                <select id="form-bail-status" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;">
                                    <option value="CHECKING" ${state.formValues.bailStatus === 'CHECKING' ? 'selected' : ''}>CHECKING (Under verification)</option>
                                    <option value="PENDING" ${state.formValues.bailStatus === 'PENDING' ? 'selected' : ''}>PENDING (Awaiting hearing)</option>
                                    <option value="ALERT" ${state.formValues.bailStatus === 'ALERT' ? 'selected' : ''}>ALERT (Suspicious matches)</option>
                                </select>
                            </div>
                        </div>

                        <!-- Release Conditions -->
                        <div style="margin-bottom: 24px; padding: 16px; background: var(--color-navy); border: 1px solid var(--color-border); border-radius: 8px;">
                            <div style="font-size: 12px; font-weight: 700; color: var(--color-gold); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px; display: flex; align-items: center; gap: 6px;">
                                ⚖️ Release Conditions
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px;">
                                <label style="display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: var(--color-card-dark); border: 1px solid var(--color-border); border-radius: 6px; cursor: pointer;">
                                    <input type="checkbox" id="cond-weekly" ${state.formValues.condWeekly !== false ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: var(--color-gold); cursor: pointer; flex-shrink: 0;">
                                    <div>
                                        <div style="color: var(--color-text-main); font-size: 13px; font-weight: 600;">Weekly Reporting to PS</div>
                                        <div style="color: var(--color-text-muted); font-size: 11px; margin-top: 2px;">Report to local Police Station weekly</div>
                                    </div>
                                </label>
                                <label style="display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: var(--color-card-dark); border: 1px solid var(--color-border); border-radius: 6px; cursor: pointer;">
                                    <input type="checkbox" id="cond-passport" ${state.formValues.condPassport !== false ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: var(--color-gold); cursor: pointer; flex-shrink: 0;">
                                    <div>
                                        <div style="color: var(--color-text-main); font-size: 13px; font-weight: 600;">Passport Surrender</div>
                                        <div style="color: var(--color-text-muted); font-size: 11px; margin-top: 2px;">Surrender to court registry</div>
                                    </div>
                                </label>
                                <label style="display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: var(--color-card-dark); border: 1px solid var(--color-border); border-radius: 6px; cursor: pointer;">
                                    <input type="checkbox" id="cond-witness" ${state.formValues.condWitness !== false ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: var(--color-gold); cursor: pointer; flex-shrink: 0;">
                                    <div>
                                        <div style="color: var(--color-text-main); font-size: 13px; font-weight: 600;">No Contact with Witnesses</div>
                                        <div style="color: var(--color-text-muted); font-size: 11px; margin-top: 2px;">No tampering / communication</div>
                                    </div>
                                </label>
                                <label style="display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: var(--color-card-dark); border: 1px solid var(--color-border); border-radius: 6px; cursor: pointer;">
                                    <input type="checkbox" id="cond-geo" ${state.formValues.condGeo === true ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: var(--color-gold); cursor: pointer; flex-shrink: 0;">
                                    <div>
                                        <div style="color: var(--color-text-main); font-size: 13px; font-weight: 600;">Geofencing Restrictions</div>
                                        <div style="color: var(--color-text-muted); font-size: 11px; margin-top: 2px;">GPS ankle monitor / zone boundary</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <!-- Arguments text areas -->
                        <div style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 25px;">
                            <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                <label style="color: var(--color-text-muted); font-size: 13px;">Public Prosecutor (PP) Objections</label>
                                <textarea id="form-pp-objections" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" rows="2">${state.formValues.ppObjections !== undefined ? state.formValues.ppObjections : 'Flight risk possible due to substantial assets.'}</textarea>
                            </div>
                            <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                <label style="color: var(--color-text-muted); font-size: 13px;">Defence Counsel Arguments</label>
                                <textarea id="form-defence-args" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" rows="2">${state.formValues.defenceArgs !== undefined ? state.formValues.defenceArgs : 'Accused is cooperative; items recovered; family dependent.'}</textarea>
                            </div>
                            <div class="form-group" style="display: flex; flex-direction: column; gap: 5px;">
                                <label style="color: var(--color-text-muted); font-size: 13px;">Previous Court Orders</label>
                                <textarea id="form-prev-orders" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 8px; color: #FFFFFF; border-radius: 4px;" rows="2">${state.formValues.prevOrders !== undefined ? state.formValues.prevOrders : 'None.'}</textarea>
                            </div>
                        </div>
                    </div>

                    <!-- Action buttons -->
                    <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--color-border); padding-top: 15px; margin-top: 20px;">
                        <button class="btn btn-secondary" type="button" id="btn-form-reset">Reset Form</button>
                        
                        <div style="display: flex; gap: 10px;">
                            <button class="btn btn-secondary" type="button" id="btn-prev-section" style="display: ${state.formSectionIndex > 1 ? 'inline-block' : 'none'};">Back</button>
                            
                            ${state.formSectionIndex < 4 
                                ? `<button class="btn btn-primary" type="button" id="btn-next-section">Next</button>`
                                : `<button class="btn btn-primary" type="submit" id="btn-submit-form" style="background: var(--color-success); border-color: var(--color-success);">Submit & Compile System Checks</button>`
                            }
                        </div>
                    </div>
                </form>
            </div>
        `;

        // Switch Surety View Field Panels based on Radio
        const handleSuretyToggle = () => {
            const isProp = mount.querySelector('#surety-type-property').checked;
            mount.querySelector('#surety-property-fields').style.display = isProp ? 'block' : 'none';
            mount.querySelector('#surety-individual-fields').style.display = isProp ? 'none' : 'block';
        };

        mount.querySelectorAll('input[name="surety-type"]').forEach(radio => {
            radio.addEventListener('change', handleSuretyToggle);
        });

        // Tab triggers
        for (let i = 1; i <= 4; i++) {
            mount.querySelector(`#form-sec-tab-${i}`).addEventListener('click', (e) => {
                e.preventDefault();
                saveFormValues();
                state.formSectionIndex = i;
                onUpdate();
            });
        }

        // Section Navigation
        if (mount.querySelector('#btn-prev-section')) {
            mount.querySelector('#btn-prev-section').addEventListener('click', () => {
                saveFormValues();
                state.formSectionIndex -= 1;
                onUpdate();
            });
        }

        if (mount.querySelector('#btn-next-section')) {
            mount.querySelector('#btn-next-section').addEventListener('click', () => {
                saveFormValues();
                state.formSectionIndex += 1;
                onUpdate();
            });
        }

        // Biometric scanning simulation with animations
        mount.querySelector('#btn-scan-accused-finger').addEventListener('click', () => {
            saveFormValues();
            state.accusedFingerScanning = true;
            onUpdate();
            setTimeout(() => {
                state.accusedFingerScanning = false;
                state.accusedFingerScanned = true;
                onUpdate();
                state.addAuditLog('BIOMETRIC_SCAN', `Accused fingerprint scanned and matched with UIDAI database successfully.`);
            }, 1800);
        });
        mount.querySelector('#btn-scan-accused-iris').addEventListener('click', () => {
            saveFormValues();
            state.accusedIrisScanning = true;
            onUpdate();
            setTimeout(() => {
                state.accusedIrisScanning = false;
                state.accusedIrisScanned = true;
                onUpdate();
                state.addAuditLog('BIOMETRIC_SCAN', `Accused retina/iris scan verified via biometric gateway.`);
            }, 1800);
        });
        mount.querySelector('#btn-scan-surety-finger').addEventListener('click', () => {
            saveFormValues();
            state.suretyFingerScanning = true;
            onUpdate();
            setTimeout(() => {
                state.suretyFingerScanning = false;
                state.suretyFingerScanned = true;
                onUpdate();
                state.addAuditLog('BIOMETRIC_SCAN', `Surety biometric validation successfully authorized.`);
            }, 1800);
        });

        // Reset button
        mount.querySelector('#btn-form-reset').addEventListener('click', () => {
            state.formValues = {};
            state.accusedFingerScanned = false;
            state.accusedIrisScanned = false;
            state.suretyFingerScanned = false;
            state.formSectionIndex = 1;
            onUpdate();
        });

        // Autofill demo data
        mount.querySelector('#btn-demo-autofill').addEventListener('click', () => {
            const rand = Math.floor(Math.random() * 900) + 100;
            const cNo = `BMS/2026/0${rand}`;
            const fNo = `FIR/${rand}/2026-RJM`;

            state.formValues = {
                caseNo: cNo,
                firNo: fNo,
                ipc: "IPC 420, 468",
                arrestDate: "2026-05-15",
                agency: "Rajamundry Central PS",
                officer: "SI Ravi Kumar",
                filingDate: "2026-06-17",

                checkCharacter: true,
                checkEmployment: true,
                checkCommunity: true,

                accusedName: "Srinivas Rao Vemuri",
                accusedFather: "Satyanarayana Vemuri",
                accusedDob: "1985-06-15",
                accusedAadhaar: "567823419012",
                accusedPan: "ABCPV1234D",
                accusedMobile: "9849001122",
                accusedDl: "AP09-2011-1234567",
                accusedPassport: "NIL",
                accusedEmployment: "Textile Trader",
                accusedIncome: "45000",
                accusedBank: "SB/4421/ANDBANK",
                accusedCibil: "687",
                accusedAddress: "W/8 Subhash Road, Rajamundry",
                accusedNcrb: "0 previous NCRB cases.",

                suretyType: "Property",
                suretyPropAddr: "W/8 Subhash Road, Rajamundry",
                suretySurvey: "RS-104/12-C",
                suretyPatta: "P-8472-RJM",
                suretyValue: "650000",
                suretyDeed: "TD-2026-RJM-482",
                suretyEncumbrance: "CLEAN",

                suretyName: "Srinivas Rao Vemuri",
                suretyRel: "Self",
                suretyMobile: "9849001122",
                suretyAadhaar: "567823419012",
                suretyPan: "ABCPV1234D",
                suretyEmployment: "Textile Trader",
                suretyIncome: "45000",

                judgeName: "J. Kameswara Rao",
                judgeId: "JUDGE-KAMESWARA",
                courtName: "Sessions Court Room 2",
                bailAmount: "50000",
                hearingTime: "2026-06-20T10:30",

                bailType: "First Bail",
                bailStatus: "CHECKING",
                condWeekly: true,
                condPassport: true,
                condWitness: true,
                condGeo: false,

                ppObjections: "Flight risk possible due to substantial assets.",
                defenceArgs: "Accused is cooperative; items recovered; family dependent.",
                prevOrders: "None."
            };

            state.accusedFingerScanned = true;
            state.accusedIrisScanned = true;
            state.suretyFingerScanned = true;

            onUpdate();
        });

        // Submit form
        const form = mount.querySelector('#new-bail-form-element');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Validate biometric status
            if (!state.accusedFingerScanned || !state.accusedIrisScanned) {
                alert("CRITICAL ERROR: Aadhaar biometric verification must be completed before filing.");
                return;
            }

            // Save final form values
            saveFormValues();

            const cNo = state.formValues.caseNo;
            const isProp = state.formValues.suretyType === 'Property';
            const ncrbCountVal = parseInt(state.formValues.accusedCibil) < 600 ? 2 : 0;
            const proposedBailAmount = parseInt(state.formValues.bailAmount) || 50000;

            // Render dummy API integration loader modal
            const loaderOverlay = document.createElement('div');
            loaderOverlay.style = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(5,12,22,0.9); display: flex; justify-content: center; align-items: center; z-index: 1000; font-family: var(--font-body);';
            loaderOverlay.innerHTML = `
                <div style="background: var(--color-card-dark); border: 2px solid var(--color-border); border-radius: 8px; width: 90%; max-width: 500px; padding: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); box-sizing: border-box;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div class="loader-spinner" style="border: 4px solid rgba(255,255,255,0.1); border-left-color: var(--color-blue-num); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
                        <h3 style="color: var(--color-text-main); font-family: var(--font-brand); margin: 0 0 5px 0;">Quantex Smart Verification Gateway</h3>
                        <p style="color: var(--color-text-muted); font-size: 12px; margin: 0;">Querying secure government API tunnels...</p>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 12px; font-size: 13px;" id="loader-steps">
                        <div id="step-1" style="color: var(--color-text-muted);">⌛ [1/5] UIDAI Gateway (uidai.gov.in) - Identity Biometric Check...</div>
                        <div id="step-2" style="color: var(--color-text-muted);">⌛ [2/5] NSDL Income Tax API (incometax.gov.in) - Solvency Check...</div>
                        <div id="step-3" style="color: var(--color-text-muted);">⌛ [3/5] NCRB CCTNS Records (ncrb.gov.in) - Prior Cases Query...</div>
                        <div id="step-4" style="color: var(--color-text-muted);">⌛ [4/5] MeeBhoomi Land Revenue (meebhoomi.ap.gov.in) - Deed Audit...</div>
                        <div id="step-5" style="color: var(--color-text-muted);">⌛ [5/5] Quantex Decision Suite - Compiling Smart Advice...</div>
                    </div>
                </div>
                <style>
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                </style>
            `;
            document.body.appendChild(loaderOverlay);

            // Step 1: UIDAI
            await new Promise(r => setTimeout(r, 600));
            loaderOverlay.querySelector('#step-1').innerHTML = '✓ [1/5] UIDAI: Biometric Match Verified (10/10 Fingers, 2/2 Iris)';
            loaderOverlay.querySelector('#step-1').style.color = 'var(--color-success)';

            // Step 2: NSDL
            await new Promise(r => setTimeout(r, 500));
            loaderOverlay.querySelector('#step-2').innerHTML = '✓ [2/5] NSDL: Financial Capacity Solvency Verified';
            loaderOverlay.querySelector('#step-2').style.color = 'var(--color-success)';

            // Step 3: NCRB
            await new Promise(r => setTimeout(r, 550));
            loaderOverlay.querySelector('#step-3').innerHTML = `✓ [3/5] NCRB: Query Complete (${ncrbCountVal} active FIRs found)`;
            loaderOverlay.querySelector('#step-3').style.color = 'var(--color-success)';

            // Step 4: MeeBhoomi
            await new Promise(r => setTimeout(r, 600));
            loaderOverlay.querySelector('#step-4').innerHTML = isProp ? '✓ [4/5] MeeBhoomi: Survey Deed Pledged & Mutation Entry Recorded' : '✓ [4/5] MeeBhoomi: Individual Solvency Certified';
            loaderOverlay.querySelector('#step-4').style.color = 'var(--color-success)';

            // Step 5: Quantex
            await new Promise(r => setTimeout(r, 450));
            loaderOverlay.querySelector('#step-5').innerHTML = '✓ [5/5] Quantex: AI Decision Scoring Compiled successfully';
            loaderOverlay.querySelector('#step-5').style.color = 'var(--color-success)';

            await new Promise(r => setTimeout(r, 400));
            loaderOverlay.remove();

            // Run verification engine checks
            const identityCheck = VerificationEngine.verifyIdentity(
                state.formValues.accusedAadhaar,
                state.accusedFingerScanned,
                state.accusedIrisScanned
            );

            const accusedIncome = parseInt(state.formValues.accusedIncome) || 0;
            const accusedCibil = parseInt(state.formValues.accusedCibil) || 600;
            const suretyIncome = isProp ? accusedIncome : (parseInt(state.formValues.suretyIncome) || 0);
            const pan = isProp ? state.formValues.accusedPan : state.formValues.suretyPan;
            
            const financeCheck = VerificationEngine.verifyFinancialCapacity(
                pan,
                [suretyIncome * 12],
                25000,
                accusedCibil,
                proposedBailAmount
            );

            const riskCheck = VerificationEngine.calculateRiskScore(
                ncrbCountVal,
                0, // prevBailsGranted
                0, // prevBailsHonored
                0, // abscondingCount
                false // travelRestricted
            );

            const suretyLoadCheck = VerificationEngine.verifySuretyLoad(
                0, // activeBailCount
                0  // pastDefaults
            );

            const encumbrance = isProp ? state.formValues.suretyEncumbrance : 'CLEAN';
            const propertyVal = isProp ? (parseInt(state.formValues.suretyValue) || 0) : 0;
            const ownerName = isProp ? state.formValues.accusedName : state.formValues.suretyName;
            const propertyCheck = VerificationEngine.verifyProperty(
                isProp,
                ownerName,
                ownerName,
                encumbrance !== 'CLEAN',
                propertyVal,
                proposedBailAmount
            );

            const recommendationCheck = VerificationEngine.compileRecommendation(
                identityCheck,
                financeCheck,
                riskCheck,
                suretyLoadCheck,
                propertyCheck
            );

            // Gather data and insert into AppState.cases
            const newCase = {
                caseNumber: cNo,
                firNumber: state.formValues.firNo,
                ipcSections: state.formValues.ipc,
                dateOfArrest: state.formValues.arrestDate,
                policeStation: `${state.formValues.agency} (${state.formValues.officer})`,
                presidingJudge: `Hon'ble ${state.formValues.judgeName}`,
                judgeId: state.formValues.judgeId,
                courtLocation: state.formValues.courtName + ", East Godavari",
                caseStatus: "Checking",
                previousCourtOrders: state.formValues.prevOrders,
                filingDate: state.formValues.filingDate,
                supportingDocs: [
                    state.formValues.checkCharacter ? 'Character Certificate' : '',
                    state.formValues.checkEmployment ? 'Employment Letter' : '',
                    state.formValues.checkCommunity ? 'Community Ties Evidence' : ''
                ].filter(Boolean),
                bailType: state.formValues.bailType,
                proposedBailAmount: proposedBailAmount,
                proposedConditions: [
                    state.formValues.condWeekly ? 'Weekly Reporting' : '',
                    state.formValues.condPassport ? 'Passport Deposit' : '',
                    state.formValues.condWitness ? 'No Contact with Witnesses' : '',
                    state.formValues.condGeo ? 'Geofencing Restrictions' : ''
                ].filter(Boolean),
                hearingDate: state.formValues.hearingTime,
                currentStatus: "Checking",
                orderStatus: "PENDING",
                applicationStatus: state.formValues.bailStatus,
                judgeRemarks: "",
                digitalSignature: "",
                accused: {
                    fullName: state.formValues.accusedName,
                    dob: state.formValues.accusedDob,
                    age: "40",
                    fathersName: state.formValues.accusedFather,
                    address: state.formValues.accusedAddress,
                    mobileNumber: state.formValues.accusedMobile,
                    aadhaarNumber: state.formValues.accusedAadhaar,
                    panNumber: state.formValues.accusedPan,
                    drivingLicense: state.formValues.accusedDl || 'NIL',
                    passportNumber: state.formValues.accusedPassport || 'NIL',
                    employmentDetails: state.formValues.accusedEmployment,
                    monthlyIncome: accusedIncome,
                    bankAccount: state.formValues.accusedBank,
                    cibilScore: accusedCibil,
                    criminalHistory: state.formValues.accusedNcrb || 'None',
                    ncrbCount: ncrbCountVal,
                    prevBailsGranted: 0,
                    prevBailsHonored: 0,
                    abscondingCount: 0,
                    travelRestricted: false,
                    bankBalance6m: 25000
                },
                surety: {
                    suretyType: isProp ? "PROPERTY" : "INDIVIDUAL",
                    fullName: isProp ? state.formValues.accusedName : state.formValues.suretyName,
                    relationToAccused: isProp ? "Self" : state.formValues.suretyRel,
                    mobileNumber: isProp ? state.formValues.accusedMobile : state.formValues.suretyMobile,
                    aadhaarNumber: isProp ? state.formValues.accusedAadhaar : state.formValues.suretyAadhaar,
                    panNumber: isProp ? state.formValues.accusedPan : state.formValues.suretyPan,
                    employmentDetails: isProp ? state.formValues.accusedEmployment : state.formValues.suretyEmployment,
                    monthlyIncome: suretyIncome,
                    avgAnnualItr: suretyIncome * 12,
                    activeBailCount: 0,
                    propertyAddress: isProp ? state.formValues.suretyPropAddr : "",
                    surveyNumber: isProp ? state.formValues.suretySurvey : "",
                    propertyValuation: propertyVal,
                    propertyOwnershipDoc: isProp ? `Title Deed ID: ${state.formValues.suretyDeed}` : "N/A",
                    propertyRevenueRecord: isProp ? `Patta No: ${state.formValues.suretyPatta}` : "N/A",
                    encumbranceStatus: encumbrance,
                    mutationStatus: "PENDING"
                },
                checks: {
                    identity: {
                        status: identityCheck.status,
                        reasonEn: identityCheck.reasonEn,
                        reasonHi: identityCheck.reasonHi
                    },
                    finance: {
                        status: financeCheck.status,
                        reasonEn: financeCheck.reasonEn,
                        reasonHi: financeCheck.reasonHi
                    },
                    risk: {
                        score: riskCheck.score,
                        riskLevel: riskCheck.riskLevel,
                        status: riskCheck.riskLevel,
                        reasonEn: riskCheck.reasons.join('; '),
                        reasonHi: riskCheck.reasonsHi.join('; ')
                    },
                    suretyLoad: {
                        status: suretyLoadCheck.status,
                        reasonEn: suretyLoadCheck.reasonEn,
                        reasonHi: suretyLoadCheck.reasonHi
                    },
                    property: {
                        status: propertyCheck.status,
                        reasonEn: propertyCheck.reasonEn,
                        reasonHi: propertyCheck.reasonHi
                    },
                    recommendation: {
                        verdict: recommendationCheck.verdict,
                        status: recommendationCheck.verdict === 'GRANT_BAIL' ? 'ACCEPT' : (recommendationCheck.verdict === 'GRANT_WITH_CONDITIONS' ? 'CONDITIONAL ACCEPT' : 'REJECT'),
                        reasoningEn: recommendationCheck.reasoningEn,
                        reasoningHi: recommendationCheck.reasoningHi,
                        textEn: recommendationCheck.reasoningEn,
                        textHi: recommendationCheck.reasoningHi
                    }
                }
            };

            state.cases.unshift(newCase);
            state.addAuditLog('CASE_REGISTER', `Registered new bail application ${cNo} for ${newCase.accused.fullName} under IPC ${newCase.ipcSections}.`);
            
            // Clear form state
            state.formValues = {};
            state.accusedFingerScanned = false;
            state.accusedIrisScanned = false;
            state.suretyFingerScanned = false;
            state.formSectionIndex = 1;

            state.saveDatabase();
            
            alert(`Application for Case ${cNo} filed and compiled successfully!`);
            state.staffActiveTab = 'dashboard';
            onUpdate();
        });
    }
};
