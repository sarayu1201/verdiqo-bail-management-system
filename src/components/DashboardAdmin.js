import { db, getOpenFraudAlerts } from '../verdiqo_db.js';

export const DashboardAdmin = {
    render(container, state, onUpdate) {
        if (!state.adminActiveTab) {
            state.adminActiveTab = 'admin-kpi';
        }

        container.innerHTML = `
            <div class="admin-layout" style="display: flex; flex-direction: column; gap: 20px;">
                <!-- Sub Navigation Bar -->
                <div class="sub-nav" style="display: flex; gap: 15px; border-bottom: 2px solid var(--color-border); padding-bottom: 10px;">
                    <button class="btn ${state.adminActiveTab === 'admin-kpi' ? 'btn-primary' : 'btn-secondary'}" id="admin-tab-kpis" style="font-weight: 600;">
                        📊 System KPIs & Charts
                    </button>
                    <button class="btn ${state.adminActiveTab === 'fraud-sentinel' ? 'btn-primary' : 'btn-secondary'}" id="admin-tab-fraud" style="font-weight: 600;">
                        🚨 Fraud Sentinel Alerts
                    </button>
                    <button class="btn ${state.adminActiveTab === 'audit-ledger' ? 'btn-primary' : 'btn-secondary'}" id="admin-tab-audit" style="font-weight: 600;">
                        🛡️ Cryptographic Audit Ledger
                    </button>
                </div>

                <div id="admin-content-mount"></div>
            </div>
        `;

        const mount = container.querySelector('#admin-content-mount');

        if (state.adminActiveTab === 'admin-kpi') {
            this.renderKpis(mount, state, onUpdate);
            this.attachChartEvents(mount);
        } else if (state.adminActiveTab === 'fraud-sentinel') {
            this.renderFraudSentinel(mount, state, onUpdate);
        } else if (state.adminActiveTab === 'audit-ledger') {
            this.renderAuditLedger(mount, state, onUpdate);
        }

        // Subnav listeners
        container.querySelector('#admin-tab-kpis').addEventListener('click', () => {
            state.adminActiveTab = 'admin-kpi';
            onUpdate();
        });
        container.querySelector('#admin-tab-fraud').addEventListener('click', () => {
            state.adminActiveTab = 'fraud-sentinel';
            onUpdate();
        });
        container.querySelector('#admin-tab-audit').addEventListener('click', () => {
            state.adminActiveTab = 'audit-ledger';
            onUpdate();
        });
    },

    renderKpis(mount, state, onUpdate) {
        const allCases = state.cases;
        
        // Calculations from state
        const totalApps = allCases.length;
        const grantedCount = allCases.filter(c => c.orderStatus === 'GRANTED').length;
        const deniedCount = allCases.filter(c => c.orderStatus === 'DENIED').length;
        const awaitingHearing = allCases.filter(c => c.applicationStatus === 'PENDING').length;

        // Fetch compliance alerts (exceeding 30 days or 3+ hearing delays)
        const activeComplianceAlerts = [];
        allCases.forEach(c => {
            // Check if custody exceeds 30 days (simulation: date of arrest to today is > 30 days)
            const arrestDate = new Date(c.dateOfArrest || c.arrestDate);
            const today = new Date();
            const diffTime = Math.abs(today - arrestDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays > 30 && c.orderStatus === 'PENDING') {
                activeComplianceAlerts.push({
                    type: 'CUSTODY_BENCHMARK',
                    caseNo: c.caseNumber,
                    name: c.accused.fullName,
                    detail: `Exceeded 30-day custody benchmark (Arrested: ${c.dateOfArrest})`
                });
            }

            // High hearing delay check
            if (c.previousCourtOrders && c.previousCourtOrders.toLowerCase().includes('rejection')) {
                activeComplianceAlerts.push({
                    type: 'HEARING_DELAYS',
                    caseNo: c.caseNumber,
                    name: c.accused.fullName,
                    detail: `Flagged with multiple hearing delays & prior rejections`
                });
            }
        });

        // SVG line chart hardcoded data: Dec -> May 2026
        // Old process: 48 mins (dotted)
        // Verdiqo: 14.2 mins (solid)
        mount.innerHTML = `
            <!-- KPI Grid -->
            <div class="kpi-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px;">
                <div class="kpi-card" style="background: var(--color-card-dark); border-top: 4px solid var(--color-navy-sec); padding: 15px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="font-size: 12px; color: var(--color-text-muted); text-transform: uppercase;">Total Applications</div>
                    <div style="font-size: 28px; font-weight: 800; color: #FFFFFF; font-family: var(--font-mono); margin-top: 5px;">${totalApps}</div>
                </div>
                <div class="kpi-card" style="background: var(--color-card-dark); border-top: 4px solid var(--color-success); padding: 15px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="font-size: 12px; color: var(--color-text-muted); text-transform: uppercase;">Granted Orders</div>
                    <div style="font-size: 28px; font-weight: 800; color: var(--color-success); font-family: var(--font-mono); margin-top: 5px;">${grantedCount}</div>
                </div>
                <div class="kpi-card" style="background: var(--color-card-dark); border-top: 4px solid var(--color-danger); padding: 15px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="font-size: 12px; color: var(--color-text-muted); text-transform: uppercase;">Denied Orders</div>
                    <div style="font-size: 28px; font-weight: 800; color: var(--color-danger); font-family: var(--font-mono); margin-top: 5px;">${deniedCount}</div>
                </div>
                <div class="kpi-card" style="background: var(--color-card-dark); border-top: 4px solid var(--color-warning); padding: 15px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="font-size: 12px; color: var(--color-text-muted); text-transform: uppercase;">Awaiting Hearing</div>
                    <div style="font-size: 28px; font-weight: 800; color: var(--color-warning); font-family: var(--font-mono); margin-top: 5px;">${awaitingHearing}</div>
                </div>
                <!-- Interactive Ratio Bar KPI -->
                <div class="kpi-card" style="grid-column: span 2; background: var(--color-card-dark); border-top: 4px solid var(--color-gold); padding: 15px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: flex; flex-direction: column; justify-content: center;">
                    <div style="font-size: 12px; color: var(--color-text-muted); text-transform: uppercase; margin-bottom: 8px; font-weight: 600;">Adjudication Decisions Ratio</div>
                    <div style="display: flex; height: 12px; border-radius: 6px; overflow: hidden; background: rgba(255,255,255,0.05); margin-bottom: 8px;">
                        <div style="width: ${((grantedCount / (grantedCount + deniedCount || 1)) * 100).toFixed(0)}%; background: var(--color-success); transition: width 0.5s;" title="Granted: ${grantedCount}"></div>
                        <div style="width: ${((deniedCount / (grantedCount + deniedCount || 1)) * 100).toFixed(0)}%; background: var(--color-danger); transition: width 0.5s;" title="Denied: ${deniedCount}"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 11px; font-family: var(--font-mono);">
                        <span style="color: var(--color-success);">Granted: ${((grantedCount / (grantedCount + deniedCount || 1)) * 100).toFixed(0)}% (${grantedCount})</span>
                        <span style="color: var(--color-danger);">Denied: ${((deniedCount / (grantedCount + deniedCount || 1)) * 100).toFixed(0)}% (${deniedCount})</span>
                    </div>
                </div>
            </div>

            <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-top: 15px;">
                <!-- SVG Line Chart (Left) -->
                <div class="card" style="flex: 2; min-width: 380px; background: var(--color-card-dark); border: 1px solid var(--color-border); border-radius: 8px; padding: 20px;">
                    <h3 style="color: #FFFFFF; font-family: var(--font-brand); margin: 0 0 15px 0;">Bail Verification Time Trends (Dec 2025 – May 2026)</h3>
                    
                    <div style="width: 100%; height: 250px; position: relative;">
                        <!-- SVG graphic container -->
                        <svg viewBox="0 0 500 220" width="100%" height="100%">
                            <!-- Grid lines -->
                            <line x1="50" y1="20" x2="450" y2="20" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
                            <line x1="50" y1="60" x2="450" y2="60" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
                            <line x1="50" y1="100" x2="450" y2="100" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
                            <line x1="50" y1="140" x2="450" y2="140" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
                            <line x1="50" y1="180" x2="450" y2="180" stroke="rgba(255,255,255,0.1)" stroke-width="1.5" />

                            <!-- Y-Axis labels (time in min) -->
                            <text x="15" y="25" fill="var(--color-text-muted)" font-size="10" font-family="monospace">50 min</text>
                            <text x="15" y="105" fill="var(--color-text-muted)" font-size="10" font-family="monospace">25 min</text>
                            <text x="15" y="185" fill="var(--color-text-muted)" font-size="10" font-family="monospace">0 min</text>

                            <!-- X-Axis labels (months) -->
                            <text x="50" y="200" fill="var(--color-text-muted)" font-size="10" font-family="monospace" text-anchor="middle">Dec</text>
                            <text x="130" y="200" fill="var(--color-text-muted)" font-size="10" font-family="monospace" text-anchor="middle">Jan</text>
                            <text x="210" y="200" fill="var(--color-text-muted)" font-size="10" font-family="monospace" text-anchor="middle">Feb</text>
                            <text x="290" y="200" fill="var(--color-text-muted)" font-size="10" font-family="monospace" text-anchor="middle">Mar</text>
                            <text x="370" y="200" fill="var(--color-text-muted)" font-size="10" font-family="monospace" text-anchor="middle">Apr</text>
                            <text x="450" y="200" fill="var(--color-text-muted)" font-size="10" font-family="monospace" text-anchor="middle">May</text>

                            <!-- Line 1: Old Process (48 min constantly - Dotted Red) -->
                            <line x1="50" y1="28" x2="450" y2="28" stroke="var(--color-danger)" stroke-width="2.5" stroke-dasharray="5,5" />
                            <text x="440" y="42" fill="var(--color-danger)" font-size="9" font-weight="700">Old: 48 min</text>

                             <!-- Line 2: Verdiqo Process (Solid Blue decreasing to 14.2 min) -->
                             <path d="M 50 130 Q 130 140, 210 148 T 290 152 T 370 150 T 450 153" fill="none" stroke="var(--color-navy-sec)" stroke-width="4.5" stroke-linecap="round" />
                             
                             <!-- Dots for Verdiqo (Interactive classes and data-val values) -->
                             <circle cx="50" cy="130" r="5" class="chart-dot" data-val="12.5 min (Dec)" fill="var(--color-blue-num)" style="cursor: pointer; transition: all 0.2s;" />
                             <circle cx="130" cy="140" r="5" class="chart-dot" data-val="13.5 min (Jan)" fill="var(--color-blue-num)" style="cursor: pointer; transition: all 0.2s;" />
                             <circle cx="210" cy="148" r="5" class="chart-dot" data-val="14.5 min (Feb)" fill="var(--color-blue-num)" style="cursor: pointer; transition: all 0.2s;" />
                             <circle cx="290" cy="152" r="5" class="chart-dot" data-val="14.0 min (Mar)" fill="var(--color-blue-num)" style="cursor: pointer; transition: all 0.2s;" />
                             <circle cx="370" cy="150" r="5" class="chart-dot" data-val="14.2 min (Apr)" fill="var(--color-blue-num)" style="cursor: pointer; transition: all 0.2s;" />
                             <circle cx="450" cy="153" r="5" class="chart-dot" data-val="14.2 min (May)" fill="var(--color-blue-num)" style="cursor: pointer; transition: all 0.2s;" />
                             <text x="430" y="175" fill="var(--color-blue-num)" font-size="9.5" font-weight="800">Verdiqo: 14.2 min</text>
                         </svg>
                     </div>

                    <!-- Chart Legend -->
                    <div style="display: flex; gap: 20px; font-size: 12px; margin-top: 10px; justify-content: center;">
                        <span style="color: var(--color-danger); font-weight: 700;">- - - - Old Manual Process</span>
                        <span style="color: var(--color-navy-sec); font-weight: 700;">———— Verdiqo Digital Check</span>
                    </div>
                </div>

                <!-- Right panel: High Court Compliance Alerts (Right) -->
                <div class="card" style="flex: 1; min-width: 250px; background: var(--color-card-dark); border: 1px solid var(--color-border); border-radius: 8px; padding: 20px;">
                    <h3 style="color: #FFFFFF; font-family: var(--font-brand); margin: 0 0 15px 0;">HC Compliance Alerts</h3>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        ${activeComplianceAlerts.length > 0 ? activeComplianceAlerts.map(alert => `
                            <div style="border-left: 3px solid var(--color-danger); background: var(--color-navy); border-radius: 4px; padding: 12px;">
                                <div style="display: flex; justify-content: space-between; font-weight: 700; color: #FFFFFF; font-size: 13px; margin-bottom: 4px;">
                                    <span>${alert.name}</span>
                                    <span style="color: var(--color-danger); font-family: var(--font-mono); font-size: 11px;">${alert.caseNo}</span>
                                </div>
                                <div style="font-size: 12px; color: var(--color-text-muted);">${alert.detail}</div>
                            </div>
                        `).join('') : `
                            <div style="text-align: center; color: var(--color-text-muted); font-size: 13px; padding: 20px;">
                                ✓ 100% High Court compliance. No benchmark violations found.
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    },

    renderFraudSentinel(mount, state, onUpdate) {
        // Pull alerts dynamically
        const openAlerts = db.fraudAlerts;

        mount.innerHTML = `
            <div style="margin-bottom: 15px;">
                <h3 style="color: #FFFFFF; font-family: var(--font-brand); margin: 0 0 5px 0;">Fraud Sentinel Surveillance Panel</h3>
                <p style="color: var(--color-text-muted); font-size: 13px; margin: 0;">Automated triggers checking duplicate asset pledging and identity mismatches</p>
            </div>

            <!-- Alerts Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;" id="fraud-alerts-container">
                ${openAlerts.map(alert => {
                    // Badge details
                    let badgeBg = '';
                    let badgeColor = '#FFFFFF';
                    const severity = alert.severity || 'WARNING';

                    if (severity === 'CRITICAL') { badgeBg = 'var(--color-danger)'; }
                    else if (severity === 'OVERCOMMIT') { badgeBg = 'var(--color-warning)'; }
                    else { badgeBg = 'var(--color-blue-num)'; }

                    // Button Action Label
                    let actionLabel = 'Audit File';
                    if (alert.alertType.includes('Property') || alert.alertType.includes('Title')) {
                        actionLabel = 'Block Surety';
                    } else if (alert.alertType.includes('Biometric') || alert.alertType.includes('Substitution')) {
                        actionLabel = 'Remand Proxy';
                    } else if (alert.alertType.includes('Default') || alert.alertType.includes('Overload')) {
                        actionLabel = 'View Obligations';
                    }

                    return `
                        <div class="card alert-card" data-alertid="${alert.alertId}" style="background: var(--color-card-dark); border: 1px solid var(--color-border); border-radius: 8px; padding: 20px; display: flex; flex-direction: column; gap: 15px; position: relative;">
                            <!-- Alert Header -->
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                                <div>
                                    <span class="badge" style="background: ${badgeBg}; color: ${badgeColor}; padding: 3px 6px; border-radius: 4px; font-size: 10px; font-weight: 800; display: inline-block; margin-bottom: 6px;">
                                        ${severity}
                                    </span>
                                    <h4 style="color: #FFFFFF; font-size: 15px; margin: 0; font-weight: 700;">${alert.alertType}</h4>
                                </div>
                                <span style="font-family: var(--font-mono); font-size: 11px; color: var(--color-gold); font-weight: 700;">${alert.alertId}</span>
                            </div>

                            <!-- Alert Meta -->
                            <div style="font-size: 12px; color: var(--color-text-muted); display: flex; flex-direction: column; gap: 4px; background: var(--color-navy); padding: 10px; border-radius: 4px;">
                                <div><strong style="color: #FFFFFF;">Case No:</strong> ${alert.caseNos}</div>
                                <div><strong style="color: #FFFFFF;">Subject:</strong> ${alert.accusedSurety}</div>
                                <div><strong style="color: #FFFFFF;">Ref:</strong> ${alert.aadhaarPropertyRef}</div>
                            </div>

                            <!-- Alert Body -->
                            <p style="font-size: 13px; color: var(--color-text-muted); margin: 0; line-height: 1.4;">
                                ${alert.description}
                            </p>

                            <!-- Alert Footer Actions -->
                            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--color-border); padding-top: 12px; margin-top: auto;">
                                <button class="btn btn-primary btn-alert-action" data-alertid="${alert.alertId}" data-action="${actionLabel}" style="font-size: 12px; padding: 6px 12px; background: ${actionLabel === 'Block Surety' ? 'var(--color-danger)' : 'var(--color-navy-sec)'}; border: none;">
                                    ${actionLabel}
                                </button>
                                <span class="badge" style="background: ${alert.alertStatus === 'OPEN' ? 'rgba(248, 113, 113, 0.15)' : 'rgba(74, 222, 128, 0.15)'}; color: ${alert.alertStatus === 'OPEN' ? 'var(--color-danger)' : 'var(--color-success)'}; font-size: 11px; font-weight: 700; border: none; padding: 2px 6px; border-radius: 4px;">
                                    ${alert.alertStatus}
                                </span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        // Event listeners for action buttons
        mount.querySelectorAll('.btn-alert-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const alertId = e.currentTarget.getAttribute('data-alertid');
                const action = e.currentTarget.getAttribute('data-action');
                
                // Mutation trigger
                const idx = db.fraudAlerts.findIndex(a => a.alertId === alertId);
                if (idx !== -1) {
                    db.fraudAlerts[idx].alertStatus = 'CLOSED (RESOLVED)';
                    db.fraudAlerts[idx].actionTaken = `${action} Compiled successfully`;
                    state.saveDatabase();
                }

                alert(`Fraud Alert Security Case ${alertId} has been resolved successfully!`);
                onUpdate();
            });
        });
    },

    renderAuditLedger(mount, state, onUpdate) {
        const logs = state.logs || [];
        
        let logRows = '';
        if (logs.length === 0) {
            logRows = `
                <tr>
                    <td colspan="5" style="padding: 20px; text-align: center; color: var(--color-text-muted);">
                        No cryptographic logs recorded in the session database.
                    </td>
                </tr>
            `;
        } else {
            logRows = logs.map(log => {
                let badgeBg = 'rgba(56, 189, 248, 0.15)';
                let badgeColor = 'var(--color-blue-num)';
                if (log.category.startsWith('AUTH_')) {
                    badgeBg = 'rgba(74, 222, 128, 0.15)';
                    badgeColor = 'var(--color-success)';
                } else if (log.category === 'VERDICT_SUBMIT') {
                    badgeBg = 'rgba(248, 113, 113, 0.15)';
                    badgeColor = 'var(--color-danger)';
                } else if (log.category === 'DOCKET_VIEW') {
                    badgeBg = 'rgba(251, 191, 36, 0.15)';
                    badgeColor = 'var(--color-gold)';
                }

                return `
                    <tr style="border-bottom: 1px solid var(--color-border); transition: background 0.2s;">
                        <td style="padding: 12px 8px; font-family: var(--font-mono); font-size: 11.5px; color: var(--color-text-muted); white-space: nowrap;">
                            ${log.timestamp}
                        </td>
                        <td style="padding: 12px 8px; font-weight: 700; color: var(--color-text-main);">
                            ${log.user}
                        </td>
                        <td style="padding: 12px 8px; white-space: nowrap;">
                            <span class="badge" style="background: ${badgeBg}; color: ${badgeColor}; border: none; font-size: 10px; font-weight: 800; padding: 3px 6px; border-radius: 4px; display: inline-block;">
                                ${log.category}
                            </span>
                        </td>
                        <td style="padding: 12px 8px; color: var(--color-text-muted); font-size: 12px; max-width: 300px; overflow: hidden; text-overflow: ellipsis;">
                            ${log.details}
                        </td>
                        <td style="padding: 12px 8px; font-family: var(--font-mono); font-size: 11px; color: var(--color-gold); font-weight: 600; text-transform: uppercase;">
                            ${log.hash}
                        </td>
                    </tr>
                `;
            }).join('');
        }

        mount.innerHTML = `
            <div class="card" style="background: var(--color-card-dark); border: 1px solid var(--color-border); border-radius: 8px; padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border); padding-bottom: 12px; margin-bottom: 20px;">
                    <div>
                        <h3 style="color: #FFFFFF; font-family: var(--font-brand); margin: 0; font-size: 18px;">Quantex Cryptographic Audit Trail</h3>
                        <p style="color: var(--color-text-muted); font-size: 12px; margin: 4px 0 0 0;">Immutable surveillance ledger tracking secure system operations and digital signature dispatches</p>
                    </div>
                    
                    <button class="btn btn-secondary" id="btn-refresh-audit-log" style="font-size: 11px; font-weight: 700; padding: 6px 12px;">
                        🔄 Refresh Trail
                    </button>
                </div>

                <div style="overflow-x: auto; max-height: 480px;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead>
                            <tr style="border-bottom: 2px solid var(--color-border); color: var(--color-text-main); font-size: 12px; text-transform: uppercase;">
                                <th style="padding: 8px; font-weight: 700;">Timestamp</th>
                                <th style="padding: 8px; font-weight: 700;">Authorized User</th>
                                <th style="padding: 8px; font-weight: 700;">Action Type</th>
                                <th style="padding: 8px; font-weight: 700;">Details & Parameters</th>
                                <th style="padding: 8px; font-weight: 700;">SHA256 Hash</th>
                            </tr>
                        </thead>
                        <tbody id="audit-trail-rows">
                            ${logRows}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        mount.querySelector('#btn-refresh-audit-log').addEventListener('click', async () => {
            const btn = mount.querySelector('#btn-refresh-audit-log');
            btn.disabled = true;
            btn.textContent = "Loading...";
            
            try {
                const res = await fetch('/api/logs');
                if (res.ok) {
                    state.logs = await res.json();
                }
            } catch (e) {
                console.warn("Refresh failed:", e);
            }
            
            onUpdate();
        });
    },

    attachChartEvents(mount) {
        const tooltip = document.createElement('div');
        tooltip.id = 'chart-tooltip';
        tooltip.style.cssText = 'position: absolute; display: none; background: rgba(15, 23, 42, 0.95); border: 1px solid var(--color-border); color: #fff; padding: 6px 10px; border-radius: 4px; font-size: 11px; pointer-events: none; font-family: monospace; box-shadow: 0 4px 10px rgba(0,0,0,0.3); z-index: 100;';
        mount.appendChild(tooltip);

        const dots = mount.querySelectorAll('.chart-dot');
        dots.forEach(dot => {
            dot.addEventListener('mouseover', (e) => {
                const val = e.currentTarget.getAttribute('data-val');
                tooltip.innerHTML = `<strong>Latency:</strong> ${val}`;
                tooltip.style.display = 'block';
                e.currentTarget.setAttribute('r', '7.5');
                e.currentTarget.style.fill = 'var(--color-gold)';
            });
            dot.addEventListener('mousemove', (e) => {
                const rect = mount.getBoundingClientRect();
                tooltip.style.left = `${e.clientX - rect.left + 15}px`;
                tooltip.style.top = `${e.clientY - rect.top - 15}px`;
            });
            dot.addEventListener('mouseout', (e) => {
                tooltip.style.display = 'none';
                e.currentTarget.setAttribute('r', '5');
                e.currentTarget.style.fill = 'var(--color-blue-num)';
            });
        });
    }
};
