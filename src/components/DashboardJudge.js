import { getComplianceByCase } from '../verdiqo_db.js';

export const DashboardJudge = {
    render(container, state, onUpdate) {
        // Default selected case if not set
        if (!state.selectedCaseNumber && state.cases.length > 0) {
            state.selectedCaseNumber = state.cases[0].caseNumber;
        }

        const selectedCase = state.cases.find(c => c.caseNumber === state.selectedCaseNumber);

        container.innerHTML = `
            <div class="judge-container" style="display: flex; gap: 20px; flex-wrap: wrap;">
                <!-- Left Sidebar: Today's Hearing Listings -->
                <div class="sidebar" style="flex: 1; min-width: 280px; max-width: 350px; background: var(--color-card-dark); border: 1px solid var(--color-border); border-radius: 8px; padding: 15px; display: flex; flex-direction: column; gap: 12px; height: fit-content;">
                    <h3 style="color: var(--color-text-main); font-family: var(--font-brand); border-bottom: 1px solid var(--color-border); padding-bottom: 10px; margin: 0;">Today's Hearings</h3>
                    <div class="hearings-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 500px; overflow-y: auto;">
                        ${state.cases.map(c => {
                            const active = c.caseNumber === state.selectedCaseNumber;
                            // Set status dot color
                            let dotColor = '#9ca3af'; // Grey (adjudicated/signed)
                            if (c.applicationStatus === 'PENDING') {
                                dotColor = 'var(--color-success)'; // Green (ready)
                            } else if (c.applicationStatus === 'ALERT') {
                                dotColor = 'var(--color-danger)'; // Red (alert)
                            } else if (c.applicationStatus === 'CHECKING') {
                                dotColor = 'var(--color-warning)'; // Orange
                            }

                            return `
                                <div class="hearing-card" data-caseno="${c.caseNumber}" style="background: ${active ? 'rgba(46, 117, 182, 0.15)' : 'var(--color-navy)'}; border: 1px solid ${active ? 'var(--color-navy-sec)' : 'var(--color-border)'}; border-radius: 6px; padding: 12px; cursor: pointer; transition: all 0.2s;">
                                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                                        <span style="font-weight: 700; color: ${active ? 'var(--color-text-main)' : '#FFFFFF'}; font-size: 14px;">${c.accused.fullName}</span>
                                        <span style="height: 10px; width: 10px; background-color: ${dotColor}; border-radius: 50%; display: inline-block;" title="Status: ${c.applicationStatus}"></span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; font-size: 11px; color: ${active ? 'var(--color-text-muted)' : '#cbd5e1'};">
                                        <span>${c.caseNumber}</span>
                                        <span style="font-weight: 600;">${c.bailType}</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Right Content Panel -->
                <div class="content-panel" style="flex: 2; min-width: 450px; display: flex; flex-direction: column; gap: 20px;">
                    ${selectedCase ? this.renderCaseDetails(selectedCase, state, onUpdate) : `
                        <div class="card" style="background: var(--color-card-dark); border: 1px solid var(--color-border); border-radius: 8px; padding: 40px; text-align: center; color: var(--color-text-muted);">
                            Select a case from the hearings list to begin adjudication.
                        </div>
                    `}
                </div>
            </div>

            <!-- Confirmation Modal Overlay -->
            <div id="verdict-modal-overlay" class="modal-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(5, 12, 22, 0.85); justify-content: center; align-items: center; z-index: 1000;">
                <div class="modal-content" style="background: var(--color-card-dark); border: 2px solid var(--color-border); border-radius: 12px; padding: 30px; width: 90%; max-width: 820px; position: relative; box-shadow: 0 10px 25px rgba(0,0,0,0.5); max-height: 90vh; overflow-y: auto; box-sizing: border-box;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 25px; align-items: start;">
                        <!-- Left Adjudication Panel -->
                        <div style="display: flex; flex-direction: column; gap: 15px;">
                            <div style="text-align: center; margin-bottom: 5px;">
                                <div style="width: 60px; height: 60px; background: rgba(74, 222, 128, 0.15); border: 3px solid var(--color-success); border-radius: 50%; display: flex; justify-content: center; align-items: center; margin: 0 auto 10px;">
                                    <span style="font-size: 30px; color: var(--color-success); font-weight: 800;">✓</span>
                                </div>
                                <h3 style="color: #FFFFFF; font-family: var(--font-brand); font-size: 20px; margin: 0 0 5px 0;">Verdict Securely Transmitted</h3>
                                <p style="color: var(--color-text-muted); font-size: 13px; margin: 0;">Cryptographic Dispatch Confirmed</p>
                            </div>

                            <div style="background: var(--color-table-header); border: 1px solid var(--color-border); border-radius: 6px; padding: 15px;">
                                <div style="display: grid; grid-template-columns: 100px 1fr; gap: 8px; font-size: 13px; margin-bottom: 6px;">
                                    <span style="color: var(--color-text-muted);">Case No:</span>
                                    <span style="color: var(--color-text-main); font-weight: 600; font-family: var(--font-mono);" id="modal-case-no"></span>
                                </div>
                                <div style="display: grid; grid-template-columns: 100px 1fr; gap: 8px; font-size: 13px; margin-bottom: 6px;">
                                    <span style="color: var(--color-text-muted);">Accused:</span>
                                    <span style="color: var(--color-text-main); font-weight: 600;" id="modal-accused"></span>
                                </div>
                                <div style="display: grid; grid-template-columns: 100px 1fr; gap: 8px; font-size: 13px; margin-bottom: 6px;">
                                    <span style="color: var(--color-text-muted);">Order Type:</span>
                                    <span style="color: var(--color-text-main); font-weight: 700;" id="modal-verdict"></span>
                                </div>
                                <div style="display: grid; grid-template-columns: 100px 1fr; gap: 8px; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                    <span style="color: var(--color-text-muted);">Secure Hash:</span>
                                    <span style="color: var(--color-gold); font-family: var(--font-mono); font-size: 11px;" id="modal-hash"></span>
                                </div>
                            </div>

                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                <h4 style="color: #FFFFFF; font-size: 13px; margin: 0 0 5px 0; font-weight: 600;">Executed Instant Directives:</h4>
                                <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--color-success);">
                                    <span>✓</span> Rajamundry Central Jail API – remand/release dispatch compiled
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--color-success);">
                                    <span>✓</span> AP Police Crimes Network – bail reporting schedule created
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--color-success);">
                                    <span>✓</span> Webland Revenue Registry – surety land encumbrance mutated and locked
                                </div>
                            </div>

                            <button class="btn btn-primary" id="btn-modal-close" style="width: 100%; padding: 10px; margin-top: 10px;">Return to Hearings List</button>
                        </div>

                        <!-- Right Smartphone Notification Simulator Panel -->
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 10px; border-left: 1px solid var(--color-border); padding-left: 20px;">
                            <h4 style="color: #FFFFFF; font-size: 13px; font-family: var(--font-brand); margin: 0 0 5px 0; text-align: center;">Citizen WhatsApp Notification Dispatch</h4>
                            
                            <div class="phone-mockup-frame">
                                <div class="phone-status-bar">
                                    <span>15:32</span>
                                    <span style="display: flex; gap: 3px;">📶 🪫 94%</span>
                                </div>
                                <div class="wa-header">
                                    <span style="font-size: 16px;">⚖️</span>
                                    <div style="display: flex; flex-direction: column; text-align: left;">
                                        <strong style="font-size: 11px;">VERDIQO e-Courts</strong>
                                        <span style="font-size: 8px; color: rgba(255,255,255,0.6);">Official Verification Desk</span>
                                    </div>
                                </div>
                                <div class="whatsapp-chat-body">
                                    <div class="wa-message-bubble">
                                        📢 *VERDIQO ADJUDICATION ALERT*<br><br>
                                        Dear Accused, your bail application *<span id="wa-case-no"></span>* has been *<span id="wa-verdict"></span>* by Hon'ble Presiding Judge J. Kameswara Rao.<br><br>
                                        *Secure Reference Hash:*<br>
                                        <span id="wa-hash" style="font-family: monospace; font-size: 9px; word-break: break-all;"></span><br><br>
                                        *Release Directives:* Sent to Rajamundry Central Jail.<br><br>
                                        Download Certified digital order here:<br>
                                        https://verdiqo.gov.in/bms/order/<span id="wa-hash-short"></span>
                                        <div class="wa-time">15:32 ✓✓</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Event listeners for Sidebar
        container.querySelectorAll('.hearing-card').forEach(card => {
            card.addEventListener('click', (e) => {
                state.selectedCaseNumber = e.currentTarget.getAttribute('data-caseno');
                state.eSignAffixed = false; // Reset eSign state on case change
                state.remarks = ""; // Reset remarks
                state.addAuditLog('DOCKET_VIEW', `Judge accessed case record dockets for ${state.selectedCaseNumber}`);
                onUpdate();
            });
        });
    },

    renderCaseDetails(c, state, onUpdate) {
        // Parsing risk score field
        const rawRisk = c.checks?.risk?.score || c.aiRiskScore0100 || c.aiRiskScore010 || "0";
        const riskScore = parseInt(rawRisk);
        
        let riskColor = 'var(--color-success)';
        if (riskScore >= 80) riskColor = 'var(--color-danger)';
        else if (riskScore >= 40) riskColor = 'var(--color-warning)';

        const idVerified = c.checks?.identity?.status === 'GREEN' || c.accused?.identityVerified === 'YES';

        return `
            <!-- Accused Details Card -->
            <div class="card" style="background: var(--color-card-dark); border: 1px solid var(--color-border); border-radius: 8px; padding: 20px; display: flex; flex-direction: column; gap: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <h2 style="color: var(--color-text-main); font-family: var(--font-brand); margin: 0 0 5px 0; font-size: 24px;">${c.accused.fullName}</h2>
                        <div style="color: var(--color-text-muted); font-size: 13px; font-family: var(--font-mono);">${c.caseNumber} • ${c.firNumber}</div>
                    </div>
                    
                    <div style="display: flex; gap: 10px;">
                        <span class="badge" style="background: ${idVerified ? 'var(--color-success)' : 'var(--color-danger)'}; color: #FFFFFF; font-weight: 700; font-size: 11px; padding: 5px 10px; border-radius: 4px;">
                            ${idVerified ? '✓ Identity Verified' : '⚠ Verification Alert'}
                        </span>
                        <span class="badge" style="background: ${riskColor}; color: #FFFFFF; font-weight: 700; font-size: 11px; padding: 5px 10px; border-radius: 4px;">
                            Risk Score: ${riskScore}/100
                        </span>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; font-size: 13px; border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); padding: 15px 0;">
                    <div>
                        <div style="color: var(--color-text-muted); margin-bottom: 2px;">IPC Sections</div>
                        <div style="color: var(--color-text-main); font-weight: 600;">${c.ipcSections}</div>
                    </div>
                    <div>
                        <div style="color: var(--color-text-muted); margin-bottom: 2px;">Bail Type</div>
                        <div style="color: var(--color-text-main); font-weight: 600;">${c.bailType}</div>
                    </div>
                    <div>
                        <div style="color: var(--color-text-muted); margin-bottom: 2px;">Court / Location</div>
                        <div style="color: var(--color-text-main); font-weight: 600;">${c.courtLocation}</div>
                    </div>
                    <div>
                        <div style="color: var(--color-text-muted); margin-bottom: 2px;">Hearing Time</div>
                        <div style="color: var(--color-text-main); font-weight: 600; font-family: var(--font-mono);">${c.hearingDate ? c.hearingDate.replace('T', ' ') : 'N/A'}</div>
                    </div>
                </div>

                <button class="btn btn-primary" id="btn-case-docket" style="align-self: flex-start; font-size: 12px; display: flex; align-items: center; gap: 6px;">
                    📄 Open Case Docket Reports
                </button>
            </div>

            <!-- Three Checklist Panels -->
            <div class="checklists-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <div class="card" style="background: var(--color-card-dark); border: 1px solid var(--color-border); border-radius: 8px; padding: 15px;">
                    <h4 style="color: var(--color-text-main); font-size: 14px; margin: 0 0 10px 0; border-bottom: 1px solid var(--color-border); padding-bottom: 5px;">1. Accused Verification</h4>
                    <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: var(--color-text-muted);">
                        <div>• Biometrics: <span style="color: ${idVerified ? 'var(--color-success)' : 'var(--color-danger)'}; font-weight: 600;">${idVerified ? 'MATCHED' : 'ALERT'}</span></div>
                        <div>• NCRB Matches: <span style="color: var(--color-text-main); font-weight: 600;">${c.accused.criminalHistory}</span></div>
                        <div>• Flight Risk Status: <span style="color: var(--color-text-main); font-weight: 600;">${c.accused.abscondingCount > 0 ? 'HIGH' : 'LOW'}</span></div>
                    </div>
                </div>
                <div class="card" style="background: var(--color-card-dark); border: 1px solid var(--color-border); border-radius: 8px; padding: 15px;">
                    <h4 style="color: var(--color-text-main); font-size: 14px; margin: 0 0 10px 0; border-bottom: 1px solid var(--color-border); padding-bottom: 5px;">2. Surety & Property</h4>
                    <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: var(--color-text-muted);">
                        <div>• Capacity: <span style="color: var(--color-text-main); font-weight: 600;">${c.surety?.financialCapacityCheck || 'ADEQUATE'}</span></div>
                        <div>• Guarantees: <span style="color: var(--color-text-main); font-weight: 600;">${c.surety?.activeBailCount || '0'}/${c.surety?.maxAllowed || '2'}</span></div>
                        <div>• Mutation: <span style="color: var(--color-text-main); font-weight: 600;">${c.surety?.mutationStatus || 'PENDING'}</span></div>
                    </div>
                </div>
                <div class="card" style="background: var(--color-card-dark); border: 1px solid var(--color-border); border-radius: 8px; padding: 15px; cursor: pointer;" id="card-trigger-decision-panel">
                    <h4 style="color: var(--color-gold); font-size: 14px; margin: 0 0 10px 0; border-bottom: 1px solid var(--color-border); padding-bottom: 5px;">3. Decision Advice 🗲</h4>
                    <div style="font-size: 12px; color: var(--color-text-muted);">
                        AI Decision support engine compiles 4 factors. Click to view risk scoring matrix.
                    </div>
                </div>
            </div>

            <!-- Quantex Smart Decision Advice Panel -->
            <div class="card" id="decision-advice-panel" style="background: var(--color-card-dark); border: 1px solid var(--color-border); border-radius: 8px; padding: 25px; display: flex; flex-direction: column; gap: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border); padding-bottom: 10px; margin: 0;">
                    <h3 style="color: var(--color-text-main); font-family: var(--font-brand); margin: 0;">Quantex Smart Decision Advice</h3>
                    <span style="font-size: 11px; font-family: var(--font-mono); color: var(--color-gold);">QUANTEX INTELLIGENCE ENGINE v4.2</span>
                </div>

                <div style="display: flex; gap: 25px; flex-wrap: wrap; align-items: center;">
                    <!-- Circular Risk Gauge -->
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 10px; flex: 1; min-width: 150px;">
                        <div style="position: relative; width: 120px; height: 120px; border-radius: 50%; background: conic-gradient(${riskColor} ${riskScore}%, var(--color-navy) 0); display: flex; justify-content: center; align-items: center;">
                            <div style="width: 100px; height: 100px; border-radius: 50%; background: var(--color-card-dark); display: flex; flex-direction: column; justify-content: center; align-items: center;">
                                <span style="font-size: 28px; font-weight: 800; color: var(--color-text-main); font-family: var(--font-mono);">${riskScore}</span>
                                <span style="font-size: 10px; color: var(--color-text-muted);">RISK INDEX</span>
                            </div>
                        </div>
                    </div>

                    <!-- Risk Breakdown Matrix -->
                    <div style="flex: 2; min-width: 250px;">
                        <h4 style="color: var(--color-text-main); font-size: 14px; margin: 0 0 10px 0;">Automated Risk Matrix Points</h4>
                        <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
                            <thead>
                                <tr style="border-bottom: 1px solid var(--color-border); color: var(--color-text-muted);">
                                    <th style="padding: 6px;">Risk Factor</th>
                                    <th style="padding: 6px;">Source Database</th>
                                    <th style="padding: 6px; text-align: right;">Points Added</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style="border-bottom: 1px dotted var(--color-border); color: var(--color-text-main);">
                                    <td style="padding: 6px;">NCRB CCTNS FIR Cases</td>
                                    <td style="padding: 6px; color: var(--color-text-muted);">ncrb.gov.in</td>
                                    <td style="padding: 6px; text-align: right; font-family: var(--font-mono); color: var(--color-danger);">+${c.accused.ncrbCount * 15 || 0}</td>
                                </tr>
                                <tr style="border-bottom: 1px dotted var(--color-border); color: var(--color-text-main);">
                                    <td style="padding: 6px;">Absconding / Default Record</td>
                                    <td style="padding: 6px; color: var(--color-text-muted);">Local Adjudication Ledger</td>
                                    <td style="padding: 6px; text-align: right; font-family: var(--font-mono); color: var(--color-danger);">+${c.accused.abscondingCount * 30 || 0}</td>
                                </tr>
                                <tr style="border-bottom: 1px dotted var(--color-border); color: var(--color-text-main);">
                                    <td style="padding: 6px;">MEA Lookout Watchlist</td>
                                    <td style="padding: 6px; color: var(--color-text-muted);">passportindia.gov.in</td>
                                    <td style="padding: 6px; text-align: right; font-family: var(--font-mono); color: var(--color-danger);">+${c.accused.travelRestricted ? '50' : '0'}</td>
                                </tr>
                                <tr style="border-bottom: 1px dotted var(--color-border); color: var(--color-text-main);">
                                    <td style="padding: 6px;">Surety Guarantee Overcommit</td>
                                    <td style="padding: 6px; color: var(--color-text-muted);">e-Courts Registry</td>
                                    <td style="padding: 6px; text-align: right; font-family: var(--font-mono); color: var(--color-danger);">+${c.surety?.guaranteeOverload === 'YES' ? '40' : '0'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style="font-size: 13px; color: var(--color-text-muted); border-top: 1px solid var(--color-border); padding-top: 15px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div>
                        <span style="color: var(--color-text-muted);">Crime Severity Class:</span>
                        <strong style="color: var(--color-text-main); margin-left: 5px;">${c.proposedBailAmount >= 100000 ? 'NON-BAILABLE / VIOLENT' : 'BAILABLE / STANDING'}</strong>
                    </div>
                    <div>
                        <span style="color: var(--color-text-muted);">Prosecution Evidence Strength:</span>
                        <strong style="color: var(--color-text-main); margin-left: 5px;">PRIMA FACIE STRONG</strong>
                    </div>
                </div>

                <!-- Advice Recommendation Banner -->
                ${this.renderRecommendationBanner(riskScore)}
            </div>

            <!-- Judicial Adjudication Action Bar + e-SIGN -->
            <div class="card" style="background: var(--color-card-dark); border: 1px solid var(--color-border); border-radius: 8px; padding: 25px; display: flex; flex-direction: column; gap: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border); padding-bottom: 10px; margin: 0;">
                    <h3 style="color: var(--color-text-main); font-family: var(--font-brand); margin: 0;">Judicial Adjudication Panel</h3>
                    <span style="font-size: 11px; font-family: var(--font-mono); color: var(--color-danger); font-weight: 800;">PRESIDING JUDGE ENCRYPTED AUTHORIZATION</span>
                </div>

                <!-- Action Button Grid -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px;">
                    <button class="btn" id="btn-grant-bail" style="background: ${state.adjudicationDecision === 'GRANTED' ? 'var(--color-success)' : 'rgba(74, 222, 128, 0.1)'}; border: 1px solid var(--color-success); color: ${state.adjudicationDecision === 'GRANTED' ? '#FFFFFF' : 'var(--color-success)'}; font-weight: 700; padding: 12px 6px;">Grant Bail</button>
                    <button class="btn" id="btn-grant-cond" style="background: ${state.adjudicationDecision === 'CONDITIONAL' ? 'var(--color-warning)' : 'rgba(251, 191, 36, 0.1)'}; border: 1px solid var(--color-warning); color: ${state.adjudicationDecision === 'CONDITIONAL' ? '#FFFFFF' : 'var(--color-warning)'}; font-weight: 700; padding: 12px 6px;">Grant With Conditions</button>
                    <button class="btn" id="btn-deny-bail" style="background: ${state.adjudicationDecision === 'DENIED' ? 'var(--color-danger)' : 'rgba(248, 113, 113, 0.1)'}; border: 1px solid var(--color-danger); color: ${state.adjudicationDecision === 'DENIED' ? '#FFFFFF' : 'var(--color-danger)'}; font-weight: 700; padding: 12px 6px;">Deny Bail</button>
                    <button class="btn" id="btn-adjourn" style="background: ${state.adjudicationDecision === 'ADJOURNED' ? '#4b5563' : 'rgba(75, 85, 99, 0.1)'}; border: 1px solid #4b5563; color: ${state.adjudicationDecision === 'ADJOURNED' ? '#FFFFFF' : 'var(--color-text-main)'}; font-weight: 700; padding: 12px 6px;">Adjourn Hearing</button>
                </div>

                <!-- Custom Remarks Text Area (Visible when conditions or deny is picked) -->
                <div id="custom-remarks-container" style="display: ${state.adjudicationDecision === 'CONDITIONAL' || state.adjudicationDecision === 'DENIED' ? 'block' : 'none'};">
                    <label style="color: var(--color-text-muted); font-size: 13px; display: block; margin-bottom: 6px;">Define Adjudication Remarks & Special Release Conditions</label>
                    <textarea id="adjudication-remarks" style="width: 100%; background: var(--color-table-header); border: 1px solid var(--color-border); border-radius: 4px; padding: 10px; color: var(--color-text-main); font-family: var(--font-body); font-size: 13px;" rows="3" placeholder="Enter custom terms, geofencing limits, or reasons for denial...">${state.remarks || ''}</textarea>
                </div>

                <!-- e-Sign Interaction Box -->
                <div style="border-top: 1px solid var(--color-border); padding-top: 20px; display: flex; flex-direction: column; gap: 15px; align-items: center;">
                    <div id="esign-interactive-box" style="width: 100%; max-width: 400px; height: 90px; background: var(--color-table-header); border: 2px dashed ${state.eSignAffixed ? 'var(--color-success)' : 'var(--color-border)'}; border-radius: 6px; display: flex; flex-direction: column; justify-content: center; align-items: center; cursor: pointer; transition: all 0.2s; text-align: center; padding: 10px;">
                        ${state.eSignAffixed 
                            ? `<span style="color: var(--color-success); font-weight: 700; font-size: 15px; display: flex; align-items: center; gap: 8px;">
                                 ✓ AADHAAR E-SIGN SECURELY AFFIXED
                               </span>
                               <span style="color: var(--color-text-muted); font-size: 11px; font-family: var(--font-mono); margin-top: 4px;">SHA256: ${c.caseNumber.replace(/[/]/g, '')}-JUDGE-SIGN-OK</span>`
                            : `<span style="color: var(--color-gold); font-weight: 600; font-size: 14px;">Click to Aadhaar e-Sign</span>
                               <span style="color: var(--color-text-muted); font-size: 11px; margin-top: 4px;">Requires linked biometric token authentication</span>`
                        }
                    </div>

                    ${state.eSignAffixed 
                        ? `<p style="color: var(--color-success); font-size: 12px; font-weight: 700; margin: 0;">e-Sign affixed. Click SUBMIT FINAL COURT VERDICT.</p>
                           <button class="btn btn-primary" id="btn-submit-final-verdict" style="background: var(--color-success); border-color: var(--color-success); font-weight: 800; font-size: 14px; width: 100%; max-width: 400px; padding: 12px;">SUBMIT FINAL COURT VERDICT</button>`
                        : ''
                    }
                </div>
            </div>
        `;
        this.attachEvents(container, state, onUpdate);
    },

    renderRecommendationBanner(riskScore) {
        if (riskScore < 40) {
            return `
                <div style="background: rgba(74, 222, 128, 0.12); border: 1px solid var(--color-success); border-radius: 6px; padding: 12px; text-align: center; color: var(--color-success); font-weight: 800; font-size: 14px;">
                    Quantex Advice Recommendation: ACCEPT BAIL (LOW RISK)
                </div>
            `;
        } else if (riskScore < 80) {
            return `
                <div style="background: rgba(251, 191, 36, 0.12); border: 1px solid var(--color-warning); border-radius: 6px; padding: 12px; text-align: center; color: var(--color-warning); font-weight: 800; font-size: 14px;">
                    Quantex Advice Recommendation: CONDITIONAL ACCEPT BAIL (MEDIUM RISK)
                </div>
            `;
        } else {
            return `
                <div style="background: rgba(248, 113, 113, 0.12); border: 1px solid var(--color-danger); border-radius: 6px; padding: 12px; text-align: center; color: var(--color-danger); font-weight: 800; font-size: 14px;">
                    Quantex Advice Recommendation: DENY BAIL (HIGH RISK)
                </div>
            `;
        }
    },

    attachEvents(container, state, onUpdate) {
        const selectedCase = state.cases.find(c => c.caseNumber === state.selectedCaseNumber);
        if (!selectedCase) return;

        // Docket selector report trigger
        const docBtn = container.querySelector('#btn-case-docket');
        if (docBtn) {
            docBtn.addEventListener('click', () => {
                state.addAuditLog('DOCKET_VIEW', `Judge requested evaluation reports for case ${selectedCase.caseNumber}`);
                state.openDocumentSelector(selectedCase.caseNumber);
            });
        }

        // Checklist 3 Trigger -> scroll to advice panel
        const adviceCard = container.querySelector('#card-trigger-decision-panel');
        if (adviceCard) {
            adviceCard.addEventListener('click', () => {
                const el = container.querySelector('#decision-advice-panel');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            });
        }

        // Action decisions
        const selectDecision = (decision) => {
            state.adjudicationDecision = decision;
            const remarksField = container.querySelector('#adjudication-remarks');
            if (remarksField) {
                state.remarks = remarksField.value;
            }
            onUpdate();
        };

        const gBtn = container.querySelector('#btn-grant-bail');
        const cBtn = container.querySelector('#btn-grant-cond');
        const dBtn = container.querySelector('#btn-deny-bail');
        const aBtn = container.querySelector('#btn-adjourn');

        if (gBtn) gBtn.addEventListener('click', () => selectDecision('GRANTED'));
        if (cBtn) cBtn.addEventListener('click', () => selectDecision('CONDITIONAL'));
        if (dBtn) dBtn.addEventListener('click', () => selectDecision('DENIED'));
        if (aBtn) aBtn.addEventListener('click', () => selectDecision('ADJOURNED'));

        // eSign interactive click (with Aadhaar OTP Verification modal)
        const esignBox = container.querySelector('#esign-interactive-box');
        if (esignBox) {
            esignBox.addEventListener('click', () => {
                if (!state.adjudicationDecision) {
                    alert("Please select an adjudication decision (Grant/Deny/Adjourn) first.");
                    return;
                }
                if (state.eSignAffixed) return; // already signed

                // Open Aadhaar OTP Modal
                const modal = document.createElement('div');
                modal.id = 'aadhaar-otp-modal';
                modal.className = 'modal-overlay';
                modal.style = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(5,12,22,0.85); display: flex; justify-content: center; align-items: center; z-index: 2000; font-family: var(--font-body);';
                modal.innerHTML = `
                    <div style="background: var(--color-card-dark); border: 2px solid var(--color-border); border-radius: 10px; width: 90%; max-width: 420px; padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.6); box-sizing: border-box; text-align: center;">
                        <div style="font-size: 36px; color: var(--color-gold); margin-bottom: 10px;">🛡️</div>
                        <h3 style="color: var(--color-text-main); font-family: var(--font-brand); margin: 0 0 5px 0;">UIDAI Aadhaar e-Sign Portal</h3>
                        <p style="color: var(--color-text-muted); font-size: 12px; margin: 0 0 20px 0;">A secure 6-digit verification code has been sent to the registered mobile number associated with Aadhaar **** **** ${selectedCase.accused.aadhaarNumber ? selectedCase.accused.aadhaarNumber.slice(-4) : '9012'}</p>
                        
                        <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 25px;" id="otp-input-container">
                            <input type="text" class="otp-box" maxlength="1" style="width: 40px; height: 45px; background: var(--color-navy); border: 1px solid var(--color-border); color: #fff; text-align: center; font-size: 20px; font-weight: 700; border-radius: 4px;" value="1">
                            <input type="text" class="otp-box" maxlength="1" style="width: 40px; height: 45px; background: var(--color-navy); border: 1px solid var(--color-border); color: #fff; text-align: center; font-size: 20px; font-weight: 700; border-radius: 4px;" value="2">
                            <input type="text" class="otp-box" maxlength="1" style="width: 40px; height: 45px; background: var(--color-navy); border: 1px solid var(--color-border); color: #fff; text-align: center; font-size: 20px; font-weight: 700; border-radius: 4px;" value="3">
                            <input type="text" class="otp-box" maxlength="1" style="width: 40px; height: 45px; background: var(--color-navy); border: 1px solid var(--color-border); color: #fff; text-align: center; font-size: 20px; font-weight: 700; border-radius: 4px;" value="4">
                            <input type="text" class="otp-box" maxlength="1" style="width: 40px; height: 45px; background: var(--color-navy); border: 1px solid var(--color-border); color: #fff; text-align: center; font-size: 20px; font-weight: 700; border-radius: 4px;" value="5">
                            <input type="text" class="otp-box" maxlength="1" style="width: 40px; height: 45px; background: var(--color-navy); border: 1px solid var(--color-border); color: #fff; text-align: center; font-size: 20px; font-weight: 700; border-radius: 4px;" value="6">
                        </div>

                        <div id="otp-loader-section" style="display: none; margin-bottom: 20px;">
                            <div class="loader-spinner" style="border: 3px solid rgba(255,255,255,0.1); border-left-color: var(--color-success); border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
                            <span style="color: var(--color-text-muted); font-size: 12px;" id="otp-loader-text">Authorizing signature with UIDAI...</span>
                        </div>

                        <div style="display: flex; gap: 10px;">
                            <button class="btn btn-secondary" id="btn-otp-cancel" style="flex: 1;" type="button">Cancel</button>
                            <button class="btn btn-primary" id="btn-otp-verify" style="flex: 2; background: var(--color-success); border-color: var(--color-success);" type="button">Verify & Sign</button>
                        </div>
                    </div>
                    <style>
                        @keyframes spin {
                            to { transform: rotate(360deg); }
                        }
                    </style>
                `;
                document.body.appendChild(modal);

                // Auto focus logic for OTP inputs
                const inputs = modal.querySelectorAll('.otp-box');
                inputs.forEach((input, idx) => {
                    input.addEventListener('input', (e) => {
                        if (e.target.value.length === 1 && idx < inputs.length - 1) {
                            inputs[idx + 1].focus();
                        }
                    });
                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Backspace' && !e.target.value && idx > 0) {
                            inputs[idx - 1].focus();
                        }
                    });
                });

                modal.querySelector('#btn-otp-cancel').addEventListener('click', () => {
                    modal.remove();
                });

                modal.querySelector('#btn-otp-verify').addEventListener('click', async () => {
                    // Start loading state
                    modal.querySelector('#otp-input-container').style.display = 'none';
                    modal.querySelector('#btn-otp-cancel').disabled = true;
                    modal.querySelector('#btn-otp-verify').disabled = true;
                    const loader = modal.querySelector('#otp-loader-section');
                    loader.style.display = 'block';

                    await new Promise(r => setTimeout(r, 700));
                    loader.querySelector('#otp-loader-text').textContent = "Affixing cryptographic e-SIGN token...";
                    await new Promise(r => setTimeout(r, 600));

                    modal.remove();
                    state.eSignAffixed = true;
                    onUpdate();
                    if (state.showToast) {
                        state.showToast('Aadhaar e-Sign Affixed: Biometric token authorized by UIDAI', 'info');
                    }
                });
            });
        }

        // Submit Final Court Verdict
        const submitVerdictBtn = container.querySelector('#btn-submit-final-verdict');
        if (submitVerdictBtn) {
            submitVerdictBtn.addEventListener('click', () => {
                const finalStatus = (state.adjudicationDecision === 'GRANTED' || state.adjudicationDecision === 'CONDITIONAL') ? 'GRANTED' : 'DENIED';
                
                // Log the final verdict submit action
                state.addAuditLog('VERDICT_SUBMIT', `Presiding Judge J. Kameswara Rao submitted verdict: [${finalStatus}] for case ${state.selectedCaseNumber}. Cryptographic dispatch initiated.`);

                // Update applicationStatus in cases list
                const idx = state.cases.findIndex(c => c.caseNumber === state.selectedCaseNumber);
                if (idx !== -1) {
                    state.cases[idx].applicationStatus = finalStatus;
                    state.cases[idx].currentStatus = 'Completed';
                    state.cases[idx].orderStatus = finalStatus;
                    const remarksVal = container.querySelector('#adjudication-remarks')?.value || '';
                    state.cases[idx].judgeRemarks = remarksVal || (finalStatus === 'GRANTED' ? 'BAIL GRANTED BY PRESIDING JUDGE' : 'BAIL DENIED BY PRESIDING JUDGE');
                    state.cases[idx].digitalSignature = `AFFIXED_MD5_${state.selectedCaseNumber.replace(/[^a-zA-Z0-9]/g, '')}`;
                    state.saveDatabase();
                }

                // Show Verdict Modal
                const overlay = container.querySelector('#verdict-modal-overlay');
                overlay.querySelector('#modal-case-no').textContent = selectedCase.caseNumber;
                overlay.querySelector('#modal-accused').textContent = selectedCase.accused.fullName;
                overlay.querySelector('#modal-verdict').textContent = state.adjudicationDecision;
                
                // Random Secure Hash
                const chars = '0123456789ABCDEF';
                let randHash = '0x';
                for (let i = 0; i < 40; i++) randHash += chars[Math.floor(Math.random() * 16)];
                overlay.querySelector('#modal-hash').textContent = randHash;

                // Populate WhatsApp Simulator
                overlay.querySelector('#wa-case-no').textContent = selectedCase.caseNumber;
                overlay.querySelector('#wa-verdict').textContent = finalStatus;
                overlay.querySelector('#wa-hash').textContent = randHash;
                overlay.querySelector('#wa-hash-short').textContent = randHash.substring(2, 12);

                overlay.style.display = 'flex';

                overlay.querySelector('#btn-modal-close').addEventListener('click', () => {
                    overlay.style.display = 'none';
                    state.eSignAffixed = false;
                    state.adjudicationDecision = null;
                    state.remarks = "";
                    onUpdate();
                });
            });
        }
    }
};
