import { getFullCaseProfile, db } from '../verdiqo_db.js';

export const DashboardCitizen = {
    render(container, state, onUpdate) {
        if (!state.citizenTab) {
            state.citizenTab = 'home';
        }

        // Lighter styling variables to force light theme for citizen dashboard
        container.innerHTML = `
            <div class="citizen-dashboard-container" style="background: #f8fafc; color: #0f172a; padding: 25px; border-radius: 8px; font-family: var(--font-body); display: flex; flex-direction: column; gap: 20px; border: 1px solid #cbd5e1; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px;">
                    <div>
                        <h1 style="font-family: var(--font-brand); color: #1e3a8a; margin: 0; font-size: 26px; font-weight: 800;">VERDIQO Citizen Portal</h1>
                        <p style="color: #475569; margin: 5px 0 0 0; font-size: 13px;">Quantex Adjudication Systems Public Gateway</p>
                    </div>
                    ${state.citizenTab !== 'home' ? `
                        <button class="btn btn-secondary" id="btn-citizen-back" style="background: #e2e8f0; border-color: #cbd5e1; color: #1e293b;">
                            ← Back to Portal
                        </button>
                    ` : ''}
                </div>

                <div id="citizen-content-mount"></div>
            </div>
        `;

        const mount = container.querySelector('#citizen-content-mount');

        if (state.citizenTab === 'home') {
            this.renderHome(mount, state, onUpdate);
        } else if (state.citizenTab === 'status-tracker') {
            this.renderStatusTracker(mount, state, onUpdate);
        } else if (state.citizenTab === 'aadhaar-cases') {
            this.renderAadhaarCases(mount, state, onUpdate);
        } else if (state.citizenTab === 'ipc-predictor') {
            this.renderIpcPredictor(mount, state, onUpdate);
        } else if (state.citizenTab === 'guidelines') {
            this.renderGuidelines(mount, state, onUpdate);
        }

        // Back button
        const backBtn = container.querySelector('#btn-citizen-back');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                state.citizenTab = 'home';
                state.citizenSearchQuery = '';
                onUpdate();
            });
        }
    },

    renderHome(mount, state, onUpdate) {
        mount.innerHTML = `
            <div style="margin-bottom: 10px; text-align: center;">
                <h3 style="color: #1e293b; font-size: 18px; margin: 0 0 5px 0;">Welcome to the Automated Adjudication Tracking System</h3>
                <p style="color: #64748b; font-size: 13px; margin: 0;">Access certified public court bail details, verify surety liabilities, and predict case outcomes.</p>
            </div>

            <!-- 4 Feature Cards -->
            <div class="citizen-cards-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-top: 15px;">
                <!-- Card 1 -->
                <div class="citizen-card" id="card-track-status" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                    <div style="font-size: 24px; margin-bottom: 10px;">🔍</div>
                    <h4 style="color: #1e3a8a; font-size: 16px; margin: 0 0 8px 0; font-weight: 700;">Track Bail Status</h4>
                    <p style="color: #475569; font-size: 12.5px; margin: 0; line-height: 1.4;">Input Case Number to verify UIDAI biometric, solvency, and mutation status checkpoints.</p>
                </div>

                <!-- Card 2 -->
                <div class="citizen-card" id="card-aadhaar-cases" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                    <div style="font-size: 24px; margin-bottom: 10px;">💳</div>
                    <h4 style="color: #1e3a8a; font-size: 16px; margin: 0 0 8px 0; font-weight: 700;">Know Active Cases (Aadhaar)</h4>
                    <p style="color: #475569; font-size: 12.5px; margin: 0; line-height: 1.4;">Verify active judicial bail bonds or guarantees linked to your Aadhaar card number.</p>
                </div>

                <!-- Card 3 -->
                <div class="citizen-card" id="card-ipc-predictor" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                    <div style="font-size: 24px; margin-bottom: 10px;">⚖️</div>
                    <h4 style="color: #1e3a8a; font-size: 16px; margin: 0 0 8px 0; font-weight: 700;">IPC Offence & Bail Law Predictor</h4>
                    <p style="color: #475569; font-size: 12.5px; margin: 0; line-height: 1.4;">Predict bailable/non-bailable classification and average approval probability for IPC sections.</p>
                </div>

                <!-- Card 4 -->
                <div class="citizen-card" id="card-guidelines" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                    <div style="font-size: 24px; margin-bottom: 10px;">📜</div>
                    <h4 style="color: #1e3a8a; font-size: 16px; margin: 0 0 8px 0; font-weight: 700;">Indian Surety Guidelines</h4>
                    <p style="color: #475569; font-size: 12.5px; margin: 0; line-height: 1.4;">Review solvency norms, property mutation procedures, and legal liabilities under BNS.</p>
                </div>
            </div>
        `;

        // Card Hover effects
        const cards = mount.querySelectorAll('.citizen-card');
        cards.forEach(card => {
            card.addEventListener('mouseover', () => {
                card.style.borderColor = '#3b82f6';
                card.style.transform = 'translateY(-2px)';
                card.style.boxShadow = '0 6px 12px rgba(59, 130, 246, 0.08)';
            });
            card.addEventListener('mouseout', () => {
                card.style.borderColor = '#e2e8f0';
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
            });
        });

        // Tab Triggers
        mount.querySelector('#card-track-status').addEventListener('click', () => {
            state.citizenTab = 'status-tracker';
            onUpdate();
        });
        mount.querySelector('#card-aadhaar-cases').addEventListener('click', () => {
            state.citizenTab = 'aadhaar-cases';
            onUpdate();
        });
        mount.querySelector('#card-ipc-predictor').addEventListener('click', () => {
            state.citizenTab = 'ipc-predictor';
            onUpdate();
        });
        mount.querySelector('#card-guidelines').addEventListener('click', () => {
            state.citizenTab = 'guidelines';
            onUpdate();
        });
    },

    renderStatusTracker(mount, state, onUpdate) {
        const query = state.citizenSearchQuery || '';
        
        let caseData = null;
        let profile = null;
        if (query) {
            profile = getFullCaseProfile(query);
            if (profile) caseData = profile.application;
        }

        const widthLimit = (query && caseData) ? '900px' : '600px';

        mount.innerHTML = `
            <div style="max-width: ${widthLimit}; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); transition: max-width 0.3s ease;">
                <h3 style="color: #1e3a8a; font-family: var(--font-brand); margin: 0 0 15px 0;">Bail Application Status Tracker</h3>
                
                <div style="display: flex; gap: 10px; margin-bottom: 25px;">
                    <input type="text" id="citizen-search-input" value="${query}" placeholder="Enter Case Number (e.g. BMS/2026/0042)" style="flex: 1; border: 1px solid #cbd5e1; padding: 10px; border-radius: 4px; color: #0f172a; font-family: var(--font-mono); font-size: 14px;">
                    <button class="btn btn-primary" id="btn-citizen-search" style="background: #1e3a8a; border: none; font-weight: 700; padding: 10px 20px;">Search</button>
                </div>

                ${query ? (caseData ? this.renderTrackerResults(profile, state) : `
                    <div style="text-align: center; padding: 20px; color: #ef4444; font-weight: 600;">
                        No case records found matching Case No: "${query}".
                    </div>
                `) : `
                    <div style="text-align: center; padding: 20px; color: #64748b; font-size: 13px;">
                        Input your Case Number above and click Search. (Try "BMS/2026/0042")
                    </div>
                `}
            </div>
        `;

        mount.querySelector('#btn-citizen-search').addEventListener('click', () => {
            state.citizenSearchQuery = mount.querySelector('#citizen-search-input').value.trim();
            onUpdate();
        });
    },

    renderTrackerResults(p, state) {
        const c = p.application;
        const a = p.accused;
        const s = p.surety;
        const b = p.biometrics;

        const isGranted = c.applicationStatus === 'GRANTED';
        const status = c.applicationStatus || 'PENDING';

        // Checkpoints validation flags
        const bioCheck = b.some(bio => bio.role === 'Accused' && bio.identityFinalStatus === 'VERIFIED');
        const finCheck = s && s.financialCapacityCheck === 'ADEQUATE';
        const mutCheck = s && s.encumbranceStatus.includes('MUTATION');
        const esignCheck = c.digitalSignature !== '';

        let badgeBg = '#4b5563';
        if (status === 'GRANTED') badgeBg = '#15803d'; // Green
        else if (status === 'CHECKING') badgeBg = '#b45309'; // Orange
        else if (status === 'ALERT') badgeBg = '#b91c1c'; // Red
        else if (status === 'DENIED') badgeBg = '#7f1d1d'; // Dark Red

        // Compile simulated SMS alerts
        const smsAlerts = [];
        smsAlerts.push({
            time: '09:30 AM',
            title: 'VERDIQO Registration',
            body: `Case ${c.caseNumber} filed successfully. Accused biometric scan completed and matched with Aadhaar.`
        });

        if (finCheck) {
            smsAlerts.push({
                time: '10:15 AM',
                title: 'VERDIQO Solvency Desk',
                body: `Surety ${s.fullName} solvency check: Adequate. No duplicate pledge alerts identified.`
            });
        }

        if (mutCheck) {
            smsAlerts.push({
                time: '11:00 AM',
                title: 'VERDIQO Webland mutation',
                body: `Surety property Survey No ${s.surveyNumber} verified. Pre-mutation court lien order compiled.`
            });
        }

        if (status === 'GRANTED' || status === 'DENIED') {
            smsAlerts.push({
                time: '11:45 AM',
                title: 'VERDIQO Adjudication',
                body: `Bail Application ${status} by Presiding Judge Rao. Digital e-Sign Affixed: ${c.digitalSignature}.`
            });
        } else {
            smsAlerts.push({
                time: 'Pending',
                title: 'VERDIQO Alert',
                body: `Adjudication in progress. Awaiting Judicial digital e-sign authorization.`
            });
        }

        return `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 25px; align-items: start;">
                <!-- Left Details Column -->
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <!-- Status Header Banner -->
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
                        <div>
                            <strong style="color: #64748b; font-size: 12px; text-transform: uppercase;">Current Bail Status:</strong>
                            <div style="margin-top: 4px;">
                                <span class="badge" style="background: ${badgeBg}; color: #FFFFFF; font-size: 13px; font-weight: 800; padding: 4px 10px; border-radius: 4px;">
                                    ${status}
                                </span>
                            </div>
                        </div>
                        
                        <div style="text-align: right;">
                            <span style="color: #64748b; font-size: 11px;">Next Hearing / Appearance:</span>
                            <div style="color: #0f172a; font-weight: 700; font-size: 13px; margin-top: 2px;">
                                ${c.hearingDate ? c.hearingDate.replace('T', ' ') : 'N/A'}
                            </div>
                        </div>
                    </div>

                    <!-- Granted Mutation Lien Alert -->
                    ${isGranted ? `
                        <div style="background: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #d97706; padding: 12px; border-radius: 4px; font-size: 12px; color: #b45309; font-weight: 700;">
                            ⚠ MUTATION ENCUMBRANCE MUTATED – Property under Court Lien
                        </div>
                    ` : ''}

                    <!-- Accused Info Card -->
                    <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 15px; font-size: 13px;">
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                            <div><strong style="color: #475569;">Accused:</strong> ${a.fullName}</div>
                            <div><strong style="color: #475569;">FIR Ref:</strong> ${c.firNumber}</div>
                            <div><strong style="color: #475569;">Charge IPC:</strong> ${c.ipcSections}</div>
                            <div><strong style="color: #475569;">Court Room:</strong> ${c.courtLocation}</div>
                        </div>
                    </div>

                    <!-- 4 Application Checkpoints -->
                    <div>
                        <h4 style="color: #1e3a8a; font-size: 14px; margin: 0 0 10px 0; font-weight: 700;">Application Checkpoints</h4>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 13px; border-bottom: 1px dotted #e2e8f0; padding-bottom: 6px;">
                                <span style="color: #334155;">1. UIDAI Biometric Identity</span>
                                <span style="font-weight: 700; color: ${bioCheck ? '#15803d' : '#b91c1c'};">${bioCheck ? '✓ MATCHED' : '✗ FAILED/AWAITING'}</span>
                            </div>
                            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 13px; border-bottom: 1px dotted #e2e8f0; padding-bottom: 6px;">
                                <span style="color: #334155;">2. Financial Solvency Check</span>
                                <span style="font-weight: 700; color: ${finCheck ? '#15803d' : '#b91c1c'};">${finCheck ? '✓ VERIFIED' : '✗ AWAITING/INSUFFICIENT'}</span>
                            </div>
                            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 13px; border-bottom: 1px dotted #e2e8f0; padding-bottom: 6px;">
                                <span style="color: #334155;">3. Land Mutation Link</span>
                                <span style="font-weight: 700; color: ${mutCheck ? '#15803d' : '#d97706'};">${mutCheck ? '✓ MUTATION LOCKED' : '⚠ PENDING DIRECTIVE'}</span>
                            </div>
                            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 13px; border-bottom: 1px dotted #e2e8f0; padding-bottom: 6px;">
                                <span style="color: #334155;">4. Bail Order & e-Sign</span>
                                <span style="font-weight: 700; color: ${esignCheck ? '#15803d' : '#b91c1c'};">${esignCheck ? '✓ SIGNED' : '✗ PENDING JUDGE SIGN'}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Download button -->
                    <button class="btn btn-primary" id="btn-citizen-download" style="background: #15803d; border: none; font-weight: 800; padding: 12px; width: 100%; border-radius: 4px; margin-top: 10px;">
                        📥 Download Signed Bail Order
                    </button>
                </div>

                <!-- Right Smartphone SMS Notification Timeline Simulator -->
                <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                    <h4 style="color: #1e3a8a; font-size: 13px; font-family: var(--font-brand); margin: 0 0 5px 0; font-weight: 700;">Live SMS Alert History</h4>
                    
                    <div class="phone-mockup-frame">
                        <div class="phone-status-bar">
                            <span style="color: #fff;">15:32</span>
                            <span style="display: flex; gap: 3px; color: #fff;">📶 🪫 94%</span>
                        </div>
                        <div class="phone-screen-content">
                            <!-- SMS thread messages -->
                            ${smsAlerts.map(sms => `
                                <div class="sms-bubble">
                                    <div class="sms-header">
                                        <span>${sms.title}</span>
                                        <span style="color: rgba(255,255,255,0.4); font-size: 8px;">${sms.time}</span>
                                    </div>
                                    <div>${sms.body}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
            
            <script>
                // Add event listener to the newly rendered download button
                document.getElementById('btn-citizen-download')?.addEventListener('click', () => {
                    alert('Bail Release Certificate PDF generation completed. Encrypted receipt dispatched to jail authorities.');
                });
            </script>
        `;
    },

    renderAadhaarCases(mount, state, onUpdate) {
        const aadhaar = state.aadhaarQuery || '';
        
        let matchingCases = [];
        if (aadhaar) {
            matchingCases = state.cases.filter(c => c.accused.aadhaarNumber.replace(/[- ]/g, '') === aadhaar.replace(/[- ]/g, ''));
        }

        mount.innerHTML = `
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                <h3 style="color: #1e3a8a; font-family: var(--font-brand); margin: 0 0 15px 0;">Active Cases Aadhaar Registry Search</h3>
                
                <div style="display: flex; gap: 10px; margin-bottom: 25px;">
                    <input type="text" id="citizen-aadhaar-input" value="${aadhaar}" placeholder="Enter 12-digit Aadhaar No." style="flex: 1; border: 1px solid #cbd5e1; padding: 10px; border-radius: 4px; color: #0f172a; font-family: var(--font-mono); font-size: 14px;">
                    <button class="btn btn-primary" id="btn-aadhaar-search" style="background: #1e3a8a; border: none; font-weight: 700; padding: 10px 20px;">Search</button>
                </div>

                ${aadhaar ? (matchingCases.length > 0 ? `
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        <h4 style="color: #1e293b; font-size: 13px; font-weight: 700;">Matching bonds discovered:</h4>
                        ${matchingCases.map(c => `
                            <div style="border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 6px; padding: 15px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                    <strong style="color: #0f172a; font-size: 14px;">${c.accused.fullName}</strong>
                                    <span style="font-weight: 700; color: #1e3a8a; font-size: 12px;">${c.caseNumber}</span>
                                </div>
                                <div style="font-size: 12.5px; color: #475569; display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px;">
                                    <div><strong>Filing Status:</strong> ${c.caseStatus}</div>
                                    <div><strong>Bail Type:</strong> ${c.bailType}</div>
                                    <div><strong>Proposed Amt:</strong> ₹${c.proposedBailAmount}</div>
                                    <div><strong>Hearing:</strong> ${c.hearingDate ? c.hearingDate.replace('T', ' ') : 'N/A'}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div style="text-align: center; padding: 20px; color: #ef4444; font-weight: 600;">
                        No active court bail bonds or records found linked to Aadhaar: "${aadhaar}".
                    </div>
                `) : `
                    <div style="text-align: center; padding: 20px; color: #64748b; font-size: 13px;">
                        Input your 12-digit Aadhaar card number above and click Search. (Try "567823419012")
                    </div>
                `}
            </div>
        `;

        mount.querySelector('#btn-aadhaar-search').addEventListener('click', () => {
            state.aadhaarQuery = mount.querySelector('#citizen-aadhaar-input').value.trim();
            onUpdate();
        });
    },

    renderIpcPredictor(mount, state, onUpdate) {
        const query = state.ipcQuery || '';

        // Predictor database logic (simple)
        let prediction = null;
        if (query) {
            const cleanQuery = query.replace(/[^0-9]/g, '');
            if (cleanQuery === '302' || cleanQuery === '376') {
                prediction = {
                    ipc: `Section ${cleanQuery}`,
                    classification: "NON-BAILABLE / COGNIZABLE",
                    violenceLevel: "HIGH (Critical Offence against body)",
                    prob: "5% (Extremely low probability, discretionary to High Court/Sessions only)",
                    color: "#b91c1c",
                    recommendation: "Deny bail unless extraordinary medical or custodial delays occur."
                };
            } else if (cleanQuery === '420' || cleanQuery === '468' || cleanQuery === '467') {
                prediction = {
                    ipc: `Section ${cleanQuery}`,
                    classification: "NON-BAILABLE / COGNIZABLE (Economic Fraud)",
                    violenceLevel: "LOW (Non-violent asset violation)",
                    prob: "65% (High probability if full asset recovery is secured by investigation agency)",
                    color: "#d97706",
                    recommendation: "Grant bail conditional on surrendering passport and executing full mutation on surety property."
                };
            } else {
                prediction = {
                    ipc: `Section ${cleanQuery || '379'}`,
                    classification: "BAILABLE / COGNIZABLE",
                    violenceLevel: "LOW (Minor theft or breach)",
                    prob: "88% (Standard statutory right under BNS/CrPC)",
                    color: "#15803d",
                    recommendation: "Grant bail immediately upon submission of clean local solvent surety guarantee."
                };
            }
        }

        mount.innerHTML = `
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                <h3 style="color: #1e3a8a; font-family: var(--font-brand); margin: 0 0 15px 0;">IPC Offence & Bail Law Predictor</h3>
                
                <div style="display: flex; gap: 10px; margin-bottom: 25px;">
                    <input type="text" id="citizen-ipc-input" value="${query}" placeholder="Enter IPC Section (e.g. IPC 420, IPC 302)" style="flex: 1; border: 1px solid #cbd5e1; padding: 10px; border-radius: 4px; color: #0f172a; font-family: var(--font-mono); font-size: 14px;">
                    <button class="btn btn-primary" id="btn-ipc-predict" style="background: #1e3a8a; border: none; font-weight: 700; padding: 10px 20px;">Predict</button>
                </div>

                ${prediction ? `
                    <div style="border: 2px solid ${prediction.color}; border-radius: 6px; padding: 20px; background: #fafafa;">
                        <h4 style="color: #0f172a; margin: 0 0 10px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; font-weight: 800;">${prediction.ipc} Bail Feasibility</h4>
                        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px;">
                            <div><strong style="color: #475569;">Legal Classification:</strong> <span style="font-weight:700; color: ${prediction.color};">${prediction.classification}</span></div>
                            <div><strong style="color: #475569;">Violence Profile:</strong> ${prediction.violenceLevel}</div>
                            <div><strong style="color: #475569;">Bail Probability:</strong> <span style="font-weight: 800; color: #1e3a8a;">${prediction.prob}</span></div>
                            <div style="margin-top: 8px; border-top: 1px dashed #cbd5e1; padding-top: 8px; color: #334155;">
                                <strong>System Precedent Advice:</strong><br>
                                <span style="color: #475569;">${prediction.recommendation}</span>
                            </div>
                        </div>
                    </div>
                ` : `
                    <div style="text-align: center; padding: 20px; color: #64748b; font-size: 13px;">
                        Input an IPC / BNS section code above to query statutory precedent. (Try "420" or "302")
                    </div>
                `}
            </div>
        `;

        mount.querySelector('#btn-ipc-predict').addEventListener('click', () => {
            state.ipcQuery = mount.querySelector('#citizen-ipc-input').value.trim();
            onUpdate();
        });
    },

    renderGuidelines(mount) {
        mount.innerHTML = `
            <div style="max-width: 650px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); font-size: 13.5px; color: #334155; line-height: 1.6;">
                <h3 style="color: #1e3a8a; font-family: var(--font-brand); margin: 0 0 15px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Indian Surety Guidelines & Liabilities</h3>
                
                <h4 style="color: #0f172a; font-weight: 700; margin: 0 0 5px 0;">1. Who can be a Bail Surety?</h4>
                <p style="margin: 0 0 15px 0;">Any solvent citizen of India with active, clean financial assets, clean criminal track record, and a registered Aadhaar card can act as a surety. Relatives are generally preferred by courts to verify community ties.</p>
                
                <h4 style="color: #0f172a; font-weight: 700; margin: 0 0 5px 0;">2. Financial Capacity Verification (ITR & Assets)</h4>
                <p style="margin: 0 0 15px 0;">Sureties must demonstrate that their net worth (liquid cash, ITR, or mutated land revenue assets) exceeds the proposed bail bond amount. Over-committing is forbidden; no single surety can pledge guarantees for more than **2 active cases** concurrently.</p>

                <h4 style="color: #0f172a; font-weight: 700; margin: 0 0 5px 0;">3. Property Mutation & Lien Restrictions</h4>
                <p style="margin: 0 0 15px 0;">If land property is pledged (via Survey & Patta reference), the court registry records a **Court Lien** in the Webland system. Pledged property *cannot* be sold, transferred, or mutated until the case is disposed of and a Release Certificate is issued by the presiding judge.</p>

                <h4 style="color: #0f172a; font-weight: 700; margin: 0 0 5px 0;">4. Penalties for Absconding Accused</h4>
                <p style="margin: 0 0 5px 0; color: #b91c1c; font-weight: 600;">If the accused defaults on court appearances, the court initiates forfeiture proceedings against the surety. The pledged property will be mutated and auctioned to recover the full bail bond value under judicial revenue directives.</p>
            </div>
        `;
    }
};
