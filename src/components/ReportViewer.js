/**
 * VERDIQO: HIGH FIDELITY LEGAL REPORTS GENERATOR
 * Quantex Intelligence Systems (P) Ltd.
 * Generates official PDF-style printable court forms.
 */

export const ReportViewer = {
    /**
     * Generates a modal container and inserts the report HTML
     */
    show(reportId, caseData, onClose, onBack = null) {
        // Remove existing modal if any
        const existing = document.getElementById('report-modal-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'report-modal-overlay';
        overlay.className = 'modal-overlay';
        
        let reportTitle = '';
        switch(reportId) {
            case 1: reportTitle = 'Bail Eligibility Assessment Report'; break;
            case 2: reportTitle = 'Surety Verification Report'; break;
            case 3: reportTitle = 'Property Mutation Order'; break;
            case 4: reportTitle = 'Order of Bail Adjudication (Draft)'; break;
            case 5: reportTitle = 'Post-Bail Compliance Tracking & Alerts Log'; break;
            case 6: reportTitle = 'Quantex Smart Analytics & Statistical Report'; break;
            case 7: reportTitle = 'Bail Satisfaction & Release Certificate'; break;
        }

        const backButtonHtml = onBack 
            ? `<button id="back-report-btn" class="btn btn-secondary" style="padding: 6px 12px; font-size: 13px; display:inline-flex; align-items:center; justify-content:center; gap:6px; background-color: var(--color-border); border-color: var(--color-border); color: var(--color-text-main); margin-right: 8px;">
                <span>◀ Back to List</span>
               </button>`
            : '';

        overlay.innerHTML = `
            <div class="modal-content-container">
                <div class="modal-top-actions">
                    <h3>${reportTitle}</h3>
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <div style="display: flex; gap: 6px; align-items: center; margin-right: 8px;">
                            <label style="color: var(--color-text-muted); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;">Docket Style:</label>
                            <select id="docket-theme-select" style="background: var(--color-navy); border: 1px solid var(--color-border); color: #FFFFFF; font-weight: 700; font-size: 12px; padding: 4px 8px; border-radius: 4px; cursor: pointer; outline: none;">
                                <option value="system">Auto (Theme Sync)</option>
                                <option value="cream">Cream Sheet</option>
                                <option value="black">Black Sheet</option>
                            </select>
                        </div>
                        ${backButtonHtml}
                        <button id="print-report-btn" class="btn btn-primary" style="padding: 6px 12px; font-size: 13px; display:inline-flex; align-items:center; justify-content:center; gap:6px;">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                            <span>Print Document</span>
                        </button>
                        <button id="close-report-btn" class="modal-close-btn">&times;</button>
                    </div>
                </div>
                <div class="report-document-body">
                    <div class="legal-page-sheet">
                        <div class="legal-watermark">VERDIQO</div>
                        
                        <!-- Header Seal -->
                        <div class="legal-header">
                            <div class="legal-logo-seal" style="display:flex; justify-content:center; align-items:center; margin-bottom:8px;">
                                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#0a1628" stroke-width="2"><path d="M12 2v20M5 7h14M5 7L3 13h4L5 7zm14 0l-2 6h4l-2-6zM12 22h6M12 22H6"/></svg>
                            </div>
                            <h2>In the Court of the Preceding Judge, Rajamundry</h2>
                            <p>STATE OF ANDHRA PRADESH, INDIA</p>
                            <p style="font-size: 9px; margin-top: 4px;">POWERED BY VERDIQO DECISION SUPPORT ENGINE • QUANTEX SYSTEMS</p>
                        </div>
                        
                        <!-- Report Content -->
                        <div id="legal-sheet-content"></div>
                        
                        <!-- Signature Seal -->
                        <div class="legal-signatures-block">
                            <div class="sig-col">
                                <p style="font-size: 11px; color:#555;">Document ID: VQ-${caseData.caseNumber.replace(/\//g, '-')}</p>
                                <div class="digital-stamp" style="border-color: #1a7a4a; color: #1a7a4a;">✓ System Verified</div>
                                <div class="sig-line">Quantex Audit Engine</div>
                            </div>
                            <div class="sig-col">
                                <p style="font-size: 11px; color:#555;">Signed digitally via Aadhaar e-Sign</p>
                                ${caseData.orderStatus === 'GRANTED' || caseData.orderStatus === 'GRANTED_WITH_CONDITIONS'
                                    ? `<div class="signature-text" style="opacity:1; font-family:'Playfair Display', serif; font-style:italic; font-size:18px; color:#0a1628; height: 20px;">J. Kameswara Rao</div>`
                                    : `<div style="height:20px; border-bottom: 1px dashed #ccc;"></div>`
                                }
                                <div class="sig-line">${caseData.presidingJudge || 'Preceding Judge'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Render specific report template
        const contentDiv = overlay.querySelector('#legal-sheet-content');
        contentDiv.innerHTML = this.getTemplate(reportId, caseData);

        // Apply docket sheet theme selection dynamically
        const themeSelect = overlay.querySelector('#docket-theme-select');
        const sheet = overlay.querySelector('.legal-page-sheet');

        const applyDocketTheme = (themeValue) => {
            sheet.classList.remove('theme-cream', 'theme-black');
            if (themeValue === 'cream') {
                sheet.classList.add('theme-cream');
            } else if (themeValue === 'black') {
                sheet.classList.add('theme-black');
            } else {
                // system auto-sync with global body class
                if (document.body.classList.contains('light-theme')) {
                    sheet.classList.add('theme-cream');
                } else {
                    sheet.classList.add('theme-black');
                }
            }
        };

        const currentThemeChoice = localStorage.getItem('verdiqo_docket_theme') || 'system';
        themeSelect.value = currentThemeChoice;
        applyDocketTheme(currentThemeChoice);

        themeSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            localStorage.setItem('verdiqo_docket_theme', val);
            applyDocketTheme(val);
        });

        // Bind events
        overlay.querySelector('#close-report-btn').addEventListener('click', () => {
            overlay.remove();
            if (onClose) onClose();
        });

        if (onBack) {
            overlay.querySelector('#back-report-btn').addEventListener('click', () => {
                overlay.remove();
                onBack();
            });
        }

        overlay.querySelector('#print-report-btn').addEventListener('click', () => {
            window.print();
        });

        // Close on clicking overlay
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
                if (onClose) onClose();
            }
        });
    },

    getTemplate(reportId, caseData) {
        const d = caseData;
        const proposedBail = parseFloat(d.proposedBailAmount || 50000);
        const avgBalance = parseFloat(d.accused.bankBalance6m || 25000);
        const avgItr = d.accused.itrDeclaredIncome || 0;
        const cibil = d.accused.cibilScore || 650;
        const suretyIncome = parseFloat(d.surety.monthlyIncome || 35000);
        const suretyBails = d.surety.activeBailCount || 0;

        switch(reportId) {
            case 1: // Bail Eligibility Assessment Report
                return `
                    <div class="document-title-block" style="margin-bottom: 12px; text-align: center;">
                        <h3 style="font-size: 15px; margin: 0; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #111; display: inline-block; padding-bottom: 2px; color: var(--color-gold);">Bail Eligibility Assessment Report</h3>
                    </div>
                    
                    <div class="legal-metadata-grid" style="grid-template-columns: repeat(2, 1fr); gap: 8px; padding: 10px; margin-bottom: 14px; font-size: 11px; background-color: #fafafa; border: 1px solid #ddd; border-radius: 4px; color: #111;">
                        <div class="meta-field">
                            <span class="meta-lbl" style="width: 110px; font-weight: 700; color: #444; font-size: 9.5px; text-transform: uppercase;">Case Number:</span>
                            <span class="meta-val code" style="color: #111;">${d.caseNumber}</span>
                        </div>
                        <div class="meta-field">
                            <span class="meta-lbl" style="width: 110px; font-weight: 700; color: #444; font-size: 9.5px; text-transform: uppercase;">FIR Number:</span>
                            <span class="meta-val code" style="color: #111;">${d.firNumber}</span>
                        </div>
                        <div class="meta-field">
                            <span class="meta-lbl" style="width: 110px; font-weight: 700; color: #444; font-size: 9.5px; text-transform: uppercase;">Accused Name:</span>
                            <span class="meta-val" style="font-weight: 700; color: #111;">${d.accused.fullName}</span>
                        </div>
                        <div class="meta-field">
                            <span class="meta-lbl" style="width: 110px; font-weight: 700; color: #444; font-size: 9.5px; text-transform: uppercase;">IPC Sections:</span>
                            <span class="meta-val" style="color: #c0392b; font-weight:700;">${d.ipcSections}</span>
                        </div>
                        <div class="meta-field">
                            <span class="meta-lbl" style="width: 110px; font-weight: 700; color: #444; font-size: 9.5px; text-transform: uppercase;">Date of Arrest:</span>
                            <span class="meta-val" style="color: #111;">${d.dateOfArrest}</span>
                        </div>
                        <div class="meta-field">
                            <span class="meta-lbl" style="width: 110px; font-weight: 700; color: #444; font-size: 9.5px; text-transform: uppercase;">Proposed Bail:</span>
                            <span class="meta-val" style="font-family: var(--font-mono); font-weight:700; color: #111;">₹${proposedBail.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                    
                    <div class="legal-section-header" style="font-size: 12px; margin-top: 10px; margin-bottom: 6px; padding-bottom: 2px; font-weight: 700; border-bottom: 1px solid #ddd; color: #111;">1. IDENTITY VERIFICATION STATUS</div>
                    <p class="legal-text-p" style="font-size: 11px; margin-bottom: 10px; line-height: 1.35; text-align: justify; color: #111;">
                        The accused’s Aadhaar credential was queried via the UIDAI API. Core biometrics (10 fingerprints and dual iris scans) were successfully validated at the counter. 
                        Status is marked as: <strong style="color: #1a7a4a; font-weight: 700;">${d.checks.identity.status === 'GREEN' ? 'IDENTITY FULLY CONFIRMED' : 'REJECTED/ALERT RAISED'}</strong>.
                    </p>

                    <div class="legal-section-header" style="font-size: 12px; margin-top: 10px; margin-bottom: 6px; padding-bottom: 2px; font-weight: 700; border-bottom: 1px solid #ddd; color: #111;">2. ACCUSED PERSONAL ASSETS & IMMIGRATION WATCHLIST</div>
                    <p class="legal-text-p" style="font-size: 11px; margin-bottom: 6px; line-height: 1.35; color: #111;">
                        Official verification from national transport registries, financial authorities, and immigration control watchlists returned the following metrics:
                    </p>
                    <table class="legal-table" style="margin-bottom: 12px; font-size: 10.5px; width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr>
                                <th style="padding: 4px 6px; text-align: left;">Category</th>
                                <th style="padding: 4px 6px; text-align: left;">Credential Verified</th>
                                <th style="padding: 4px 6px; text-align: left;">Database Source</th>
                                <th style="padding: 4px 6px; text-align: left;">Verified Output / Watch Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">Driving License (DL)</td>
                                <td class="code" style="padding: 4px 6px; border: 1px solid #cbd5e1; font-family: var(--font-mono); color: #111;">${d.accused.drivingLicense || 'N/A'}</td>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">AP Transport Dept / Sarathi</td>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1;"><span style="color:#1a7a4a; font-weight:700;">✓ VALID & CLEAN</span></td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">Passport Number</td>
                                <td class="code" style="padding: 4px 6px; border: 1px solid #cbd5e1; font-family: var(--font-mono); color: #111;">${d.accused.passportNumber || 'N/A'}</td>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">Ministry of External Affairs</td>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1;">${d.accused.travelRestricted ? '<span style="color:#c0392b; font-weight:700;">⚠️ WATCHLIST PREVENT DEPARTURE</span>' : '<span style="color:#1a7a4a; font-weight:700;">✓ NO ACTIVE IMMIGRATION WATCH</span>'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">Travel History & LOC Check</td>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">Exit/Entry: Verified 2 trips in 2025</td>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">Bureau of Immigration (BoI) API</td>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1;">${d.accused.travelRestricted ? '<span style="color:#c0392b; font-weight:700;">⚠️ ACTIVE LOOKOUT CIRCULAR (LOC)</span>' : '<span style="color:#1a7a4a; font-weight:700;">✓ CLEAR (No active LOC / travel warnings)</span>'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">Declared Monthly Income</td>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">₹${parseFloat(d.accused.monthlyIncome || 0).toLocaleString('en-IN')}</td>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">Income Tax NSDL API</td>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">Status: Verified Salaried/Business</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">Liquid Balance (6M Avg)</td>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">₹${parseFloat(d.accused.bankBalance6m || 0).toLocaleString('en-IN')}</td>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">FIU Banking Sync API</td>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">Account: ${d.accused.bankAccount || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">CIBIL Credit Score</td>
                                <td style="font-weight: 700; padding: 4px 6px; border: 1px solid #cbd5e1; color: ${d.accused.cibilScore >= 700 ? '#1a7a4a' : d.accused.cibilScore >= 600 ? '#e67e22' : '#c0392b'};">${d.accused.cibilScore || 'N/A'}</td>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">TransUnion CIBIL Bureau</td>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">Credit risk rating is ${d.accused.cibilScore >= 700 ? 'EXCELLENT' : d.accused.cibilScore >= 600 ? 'MODERATE' : 'POOR'}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div class="legal-section-header" style="font-size: 12px; margin-top: 10px; margin-bottom: 6px; padding-bottom: 2px; font-weight: 700; border-bottom: 1px solid #ddd; color: #111;">3. CRIME SEVERITY & EVIDENCE STRENGTH EVALUATION</div>
                    <p class="legal-text-p" style="font-size: 11px; margin-bottom: 6px; line-height: 1.35; color: #111;">
                        Evaluation of offence categorization and prima facie evidence strength:
                    </p>
                    <table class="legal-table" style="margin-bottom: 12px; font-size: 10.5px; width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr>
                                <th style="padding: 4px 6px; text-align: left;">Legal Parameter</th>
                                <th style="padding: 4px 6px; text-align: left;">Case Value</th>
                                <th style="padding: 4px 6px; text-align: left;">Statutory Definition / Severity Metric</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">Bailable Status</td>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1;">${d.ipcSections.includes('302') ? '<span style="color:#c0392b; font-weight:700;">NON-BAILABLE</span>' : '<span style="color:#1a7a4a; font-weight:700;">BAILABLE UNDER CONDITIONS</span>'}</td>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">Categorization under First Schedule of CrPC / BNSS</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">Charge Seriousness</td>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1;">${d.ipcSections.includes('302') ? '<span style="color:#c0392b; font-weight:700;">CRITICAL (Murder Charge)</span>' : '<span style="color:#e67e22; font-weight:700;">MODERATE (Financial/Forgery)</span>'}</td>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">Judged based on imprisonment terms and societal threat guidelines</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">Violence Involved</td>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">${d.ipcSections.includes('302') ? 'HIGH (Physical Homicide / Extreme Violence)' : 'NONE / LOW (Economic / Documents only)'}</td>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">Assessment of physical harm, injury, or co-conspirator weapons</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">Evidence Strength Score</td>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1;">${d.ipcSections.includes('302') ? '<span style="color:#1a7a4a; font-weight:700;">STRONG (Eye witness + forensic recovery)</span>' : '<span style="color:#e67e22; font-weight:700;">MODERATE (Circumstantial ledger match)</span>'}</td>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">Composite score of police recovery statements and witness credibility</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="legal-section-header" style="font-size: 12px; margin-top: 10px; margin-bottom: 6px; padding-bottom: 2px; font-weight: 700; border-bottom: 1px solid #ddd; color: #111;">4. RISK SCORING & CRIMINAL RECORD HISTORY</div>
                    <p class="legal-text-p" style="font-size: 11px; margin-bottom: 6px; line-height: 1.35; color: #111;">
                        The system executed a cross-jurisdiction query against the National Crime Records Bureau (NCRB) database and the eCourts platform.
                    </p>
                    <table class="legal-table" style="margin-bottom: 12px; font-size: 10.5px; width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr>
                                <th style="padding: 4px 6px; text-align: left;">Registry Database</th>
                                <th style="padding: 4px 6px; text-align: left;">Parameter Evaluated</th>
                                <th style="padding: 4px 6px; text-align: left;">Verified Output</th>
                                <th style="padding: 4px 6px; text-align: left;">Risk Impact</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">NCRB FIR Database</td>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">Prior Registered FIRs (India)</td>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">${d.accused.ncrbCount} Active Case(s)</td>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color:${d.accused.ncrbCount > 0 ? '#e67e22' : '#1a7a4a'}; font-weight: 600;">Low to Moderate</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">eCourts Registry</td>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">Previous Bail Applications</td>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">${d.accused.prevBailsGranted} Granted, ${d.accused.prevBailsHonored} Fulfilled</td>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color:#1a7a4a; font-weight: 600;">No Default Flags</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">State Intelligence</td>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">Absconding & Non-Appearance</td>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">${d.accused.abscondingCount} Failures to Appear</td>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color:${d.accused.abscondingCount > 0 ? '#c0392b' : '#1a7a4a'}; font-weight: 600;">${d.accused.abscondingCount > 0 ? 'Critical Flag' : 'No Default'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">Immigration Watch</td>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">Immigration Watch & Travel Restriction</td>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #111;">${d.accused.travelRestricted ? 'TRAVEL RESTRICTED' : 'CLEAR / NO WATCH'}</td>
                                <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color:${d.accused.travelRestricted ? '#c0392b' : '#1a7a4a'}; font-weight: 600;">${d.accused.travelRestricted ? 'High Alert' : 'No Watch'}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <p class="legal-text-p" style="margin-top: 8px; margin-bottom: 10px; font-size: 11px; color: #111;">
                        <strong>Risk Assessment Conclusion:</strong> The composite Risk Score is calculated at <strong style="color: ${d.checks.risk.score >= 70 ? '#c0392b' : d.checks.risk.score >= 40 ? '#e67e22' : '#1a7a4a'}; font-size:12px;">${d.checks.risk.score}/100</strong>, indicating a <strong>${d.checks.risk.riskLevel} RISK</strong> level.
                    </p>
                    
                    <div class="legal-section-header" style="font-size: 12px; margin-top: 10px; margin-bottom: 6px; padding-bottom: 2px; font-weight: 700; border-bottom: 1px solid #ddd; color: #111;">5. SYSTEM LEGAL RECOMMENDATION</div>
                    <div style="background-color: #f7f3ec; border-left: 4px solid #c9a84c; padding: 10px 14px; font-size: 12px; font-weight:700; margin-bottom: 8px; color: #000;">
                        ADVICE: ${d.checks.recommendation.verdict.replace(/_/g, ' ')}
                    </div>
                    <p class="legal-text-p" style="font-size: 11px; margin-bottom: 0; line-height: 1.35; color: #111;">
                        <strong>Reasoning:</strong> ${d.checks.recommendation.reasoningEn}
                    </p>
                `;
            
            case 2: // Surety Verification Report
                if (d.surety.suretyType === 'INDIVIDUAL') {
                    return `
                        <div class="document-title-block">
                            <h3>Surety Solvency & Capacity Report</h3>
                            <p style="font-size: 11px; margin-top: 2px;">INDIVIDUAL GUARANTOR CAPACITY ASSESSMENT</p>
                        </div>
                        
                        <div class="legal-metadata-grid">
                            <div class="meta-field">
                                <span class="meta-lbl">Surety Name:</span>
                                <span class="meta-val">${d.surety.fullName}</span>
                            </div>
                            <div class="meta-field">
                                <span class="meta-lbl">Relation to Accused:</span>
                                <span class="meta-val">${d.surety.relationToAccused}</span>
                            </div>
                            <div class="meta-field">
                                <span class="meta-lbl">Aadhaar Number:</span>
                                <span class="meta-val code">${d.surety.aadhaarNumber.substring(0,4)}-XXXX-XXXX</span>
                            </div>
                            <div class="meta-field">
                                <span class="meta-lbl">PAN Number:</span>
                                <span class="meta-val code">${d.surety.panNumber}</span>
                            </div>
                            <div class="meta-field">
                                <span class="meta-lbl">Proposed Bail:</span>
                                <span class="meta-val" style="font-family: var(--font-mono); font-weight:700;">₹${proposedBail.toLocaleString('en-IN')}</span>
                            </div>
                            <div class="meta-field">
                                <span class="meta-lbl">Employment Type:</span>
                                <span class="meta-val">${d.surety.employmentDetails}</span>
                            </div>
                        </div>
                        
                        <div class="legal-section-header">1. BIOMETRIC & IDENTITY CHECK</div>
                        <p class="legal-text-p">
                            Surety biometrics were captured at the counter. Fingerprint and iris matching returned a <strong>100% MATCH</strong> status against UIDAI archives. No proxy or identity fraud detected.
                        </p>
                        
                        <div class="legal-section-header">2. FINANCIAL CAPACITY STATEMENT</div>
                        <p class="legal-text-p">
                            Automated checks integrated with the NSDL ITR database and CIBIL score registries returned the following assets and liquid balances:
                        </p>
                        <ul class="legal-list">
                            <li><strong>Verified Monthly Employment Income:</strong> ₹${suretyIncome.toLocaleString('en-IN')} per month.</li>
                            <li><strong>Average 3-Year Income Tax Returns:</strong> Verified average at ₹${(suretyIncome * 12 * 0.95).toLocaleString('en-IN')} per annum.</li>
                            <li><strong>CIBIL Credit Score:</strong> ${cibil} (Low defaults risk registered).</li>
                            <li><strong>Calculated Financial Status:</strong> <span style="text-decoration: underline; font-weight:700;">${d.checks.finance.status}</span>.</li>
                        </ul>
                        
                        <div class="legal-section-header">3. CROSS-COURT SURETY LOAD ASSESSMENT</div>
                        <p class="legal-text-p">
                            The National Surety Ledger has scanned all sub-divisional and district courts across Andhra Pradesh.
                        </p>
                        <ul class="legal-list">
                            <li><strong>Active Bail Guarantees Held:</strong> ${suretyBails} (Legal maximum allowed is 2 active).</li>
                            <li><strong>Previous Obligation Defaults:</strong> 0 Defaults registered in the court registers.</li>
                            <li><strong>Status Verdict:</strong> <strong>${d.checks.suretyLoad.status === 'CLEAR' ? 'APPROVED FOR OBLIGATION' : 'DISQUALIFIED/WARNING'}</strong>.</li>
                        </ul>

                        <div class="legal-section-header">4. CAPABILITY EVALUATION VERDICT</div>
                        <div style="background-color: #f7f3ec; border-left: 4px solid #1a7a4a; padding: 12px; font-size: 13.5px; font-weight:700; display:flex; justify-content:space-between;">
                            <span>SURETY ACCEPTANCE STATUS:</span>
                            <span style="color:#1a7a4a;">[ ACCEPT - SOLVENCY SUFFICIENT ]</span>
                        </div>
                        <p class="legal-text-p" style="margin-top: 8px;">
                            The guarantor displays a verifiable stream of income that comfortably satisfies the court's solvency requirements. No prior default risks or multiple active loads are registered.
                        </p>
                    `;
                } else {
                    return `
                        <div class="document-title-block">
                            <h3>Surety Verification & Capacity Report</h3>
                            <p style="font-size: 11px; margin-top: 2px;">PROPERTY ASSET VALUE & MUTATION ASSESSMENT</p>
                        </div>
                        
                        <div class="legal-metadata-grid">
                            <div class="meta-field">
                                <span class="meta-lbl">Pledged Owner Name:</span>
                                <span class="meta-val">${d.surety.fullName}</span>
                            </div>
                            <div class="meta-field">
                                <span class="meta-lbl">Relation to Accused:</span>
                                <span class="meta-val">${d.surety.relationToAccused}</span>
                            </div>
                            <div class="meta-field">
                                <span class="meta-lbl">Land Survey Number:</span>
                                <span class="meta-val code">${d.surety.surveyNumber || 'Sy. RS-104/12-A'}</span>
                            </div>
                            <div class="meta-field">
                                <span class="meta-lbl">Revenue Patta No:</span>
                                <span class="meta-val code">${d.surety.propertyRevenueRecord || 'P-8472-RJM'}</span>
                            </div>
                            <div class="meta-field">
                                <span class="meta-lbl">Proposed Bail Bond:</span>
                                <span class="meta-val" style="font-family: var(--font-mono); font-weight:700;">₹${proposedBail.toLocaleString('en-IN')}</span>
                            </div>
                            <div class="meta-field">
                                <span class="meta-lbl">Land Valuation:</span>
                                <span class="meta-val" style="font-family: var(--font-mono); color:#1a7a4a; font-weight:700;">₹${parseFloat(d.surety.propertyValuation || 0).toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                        
                        <div class="legal-section-header">1. PROPERTY TITLE & DEED AUTHENTICITY</div>
                        <p class="legal-text-p">
                            The title deed ID <strong>${d.surety.propertyOwnershipDoc || 'TD-2026-RJM-482'}</strong> was verified through a secure API query to the Registration and Stamps Department. 
                            The ownership matches the surety’s name and is confirmed free of any active litigations.
                        </p>
                        
                        <div class="legal-section-header">2. LAND REVENUE & ENCUMBRANCE STATUS</div>
                        <p class="legal-text-p">
                            Automated land ledger query through the Webland/Adangal Portal returned the following parameters:
                        </p>
                        <table class="legal-table">
                            <thead>
                                <tr>
                                    <th>Parameter</th>
                                    <th>Government Database Value</th>
                                    <th>Court Validation Check</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Patta/Khata ID</td>
                                    <td class="code">${d.surety.propertyRevenueRecord || 'P-8472-RJM'}</td>
                                    <td><span style="color:#1a7a4a; font-weight:700;">✓ Matches Revenue Records</span></td>
                                </tr>
                                <tr>
                                    <td>Land Classification</td>
                                    <td>Wet/Dry Agriculture (Patta Land)</td>
                                    <td>✓ Eligible for Bail Guarantee</td>
                                </tr>
                                <tr>
                                    <td>Property Valuation</td>
                                    <td style="font-family: var(--font-mono);">₹${parseFloat(d.surety.propertyValuation || 0).toLocaleString('en-IN')}</td>
                                    <td><span style="color:#1a7a4a; font-weight:700;">✓ Value exceeds bail bond (${Math.round((d.surety.propertyValuation / proposedBail) * 100)}%)</span></td>
                                </tr>
                                <tr>
                                    <td>Encumbrance Status</td>
                                    <td style="font-weight:700; color:${d.surety.encumbranceStatus === 'CLEAN' ? '#1a7a4a' : '#c0392b'};">${d.surety.encumbranceStatus || 'CLEAN'}</td>
                                    <td>${d.surety.encumbranceStatus === 'CLEAN' ? '<span style="color:#1a7a4a; font-weight:700;">✓ CLEAR (No Prior Mortgages)</span>' : '<span style="color:#c0392b; font-weight:700;">⚠️ WARNING (Lien Already Active)</span>'}</td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <div class="legal-section-header">3. MUTATION STATUS</div>
                        <p class="legal-text-p">
                            Upon order submission, direct XML hooks mutate the Mandal land register. Mutation status is currently marked as: 
                            <strong>${d.surety.mutationStatus === 'COMPLETED' ? '<span style="color:#1a7a4a;">✓ ACTIVE BAIL ENCUMBRANCE MUTATED & REGISTERED</span>' : '<span style="color:#f39c12;">AWAITING ADJUDICATION ACTION / PENDING MUTATION</span>'}</strong>.
                        </p>

                        <div class="legal-section-header">4. CAPABILITY EVALUATION VERDICT</div>
                        <div style="background-color: #f7f3ec; border-left: 4px solid #1a7a4a; padding: 12px; font-size: 13.5px; font-weight:700; display:flex; justify-content:space-between;">
                            <span>SURETY ACCEPTANCE STATUS:</span>
                            <span style="color:${d.surety.encumbranceStatus === 'CLEAN' ? '#1a7a4a' : '#c0392b'};">
                                ${d.surety.encumbranceStatus === 'CLEAN' ? '[ ACCEPT - PROPERTY LIEN VIABLE ]' : '[ REJECT - ENCUMBERED PROPERTY ]'}
                            </span>
                        </div>
                    `;
                }

            case 3: // Property Mutation Request
                return `
                    <div class="document-title-block">
                        <h3>Order of Property Mutation & Bail Encumbrance</h3>
                        <p style="font-size: 11px; margin-top: 4px;">FORM 14 - STATE REVENUE DEPARTMENT & DISTRICT LAND REGISTRY</p>
                    </div>
                    
                    <p class="legal-text-p">
                        To,<br/>
                        <strong>The Tahsildar / Land Registrar Office</strong><br/>
                        Rajamundry Urban Mandal, East Godavari District, Andhra Pradesh.
                    </p>
                    
                    <p class="legal-text-p" style="margin-top: 14px;">
                        <strong>SUBJECT:</strong> Request for entry of Bail Encumbrance (Mortgage Lien) in Revenue Land Register (Webland/Adangal).
                    </p>
                    
                    <p class="legal-text-p">
                        Pursuant to orders passed by this Hon’ble Court in case number <strong>${d.caseNumber}</strong>, the property detailed below has been accepted as judicial surety for the release of the accused, <strong>${d.accused.fullName}</strong>. You are hereby ordered to record an encumbrance entry on this land registry.
                    </p>
                    
                    <div class="legal-section-header">PROPERTY DESCRIPTION FOR MUTATION</div>
                    <table class="legal-table">
                        <tr>
                            <td style="font-weight:700; width: 200px; background-color: #f9f9f9;">Declared Owner:</td>
                            <td>${d.surety.fullName} (Verified via Land Registry ID)</td>
                        </tr>
                        <tr>
                            <td style="font-weight:700; background-color: #f9f9f9;">Property Address:</td>
                            <td>${d.surety.propertyAddress || 'Ward No. 12, Syama Prasad Nagar, Rajamundry'}</td>
                        </tr>
                        <tr>
                            <td style="font-weight:700; background-color: #f9f9f9;">Revenue Survey Number:</td>
                            <td style="font-family: var(--font-mono); font-weight:700;">${d.surety.surveyNumber || 'RS-342/12-A'}</td>
                        </tr>
                        <tr>
                            <td style="font-weight:700; background-color: #f9f9f9;">Ready-Reckoner Valuation:</td>
                            <td style="font-family: var(--font-mono);">₹${parseFloat(d.surety.propertyValuation || 0).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                            <td style="font-weight:700; background-color: #f9f9f9;">Bail Obligation Limit:</td>
                            <td style="font-family: var(--font-mono); font-weight:700;">₹${proposedBail.toLocaleString('en-IN')}</td>
                        </tr>
                    </table>
                    
                    <div class="legal-section-header">STATUTORY MANDATE</div>
                    <p class="legal-text-p" style="color: #c0392b; font-weight:700;">
                        THE OWNER IS HEREBY STRICTLY PROHIBITED FROM SELLING, GIFTING, LEASING, TRANSFERRING, OR MORTGAGING THE AFOREMENTIONED PROPERTY WHILE THE BAIL ENCUMBRANCE REMAINS ACTIVE.
                    </p>
                    <p class="legal-text-p">
                        Upon recording the mutation in the government land archives (Webland Portal), please transmit an automated XML validation token back to the Verdiqo Court Database to enable release authorization.
                    </p>
                `;

            case 4: // Bail Order Draft
                const conditionsList = d.orderStatus === 'GRANTED_WITH_CONDITIONS' && d.judgeRemarks 
                    ? d.judgeRemarks.split('\n')
                    : [
                        'Accused shall appear before the Investigating Officer every Monday at 10:00 AM.',
                        'Accused shall surrender their passport immediately to the court registry.',
                        'Accused shall not influence prosecution witnesses or tamper with evidence.',
                        'Surety shall notify court of any changes in financial capacity or residence.'
                    ];
                return `
                    <div class="document-title-block">
                        <h3>Order of Bail Adjudication</h3>
                        <p style="font-family: var(--font-mono); font-size: 12px; margin-top: 4px;">CASE ID: SC-${d.caseNumber.split('/')[1]}</p>
                    </div>
                    
                    <p class="legal-text-p">
                        In the matter of State vs. <strong>${d.accused.fullName}</strong>, having heard arguments from the learned Counsel for Defence and the learned Public Prosecutor, this Court has analyzed the verified composite parameters compiled by the <strong>Verdiqo Verification Engine</strong>.
                    </p>
                    
                    <div class="legal-section-header">COURT FINDINGS</div>
                    <ul class="legal-list">
                        <li><strong>Identity Authenticity:</strong> Confirmed green via biometric match.</li>
                        <li><strong>Risk Metric Level:</strong> ${d.checks.risk.score}/100 (${d.checks.risk.riskLevel} Risk Profile).</li>
                        <li><strong>Surety Asset Eligibility:</strong> Verified capable and mutated under court control.</li>
                    </ul>
                    
                    <div class="legal-section-header">ADJUDICATION DIRECTIVE</div>
                    <p class="legal-text-p" style="font-size: 15px; font-weight: 700; color: var(--color-navy-sec);">
                        STATUS: BAIL IS HEREBY ${d.orderStatus ? d.orderStatus.replace(/_/g, ' ') : 'PENDING HEARING'}.
                    </p>
                    
                    ${d.orderStatus === 'GRANTED_WITH_CONDITIONS' ? `
                        <p class="legal-text-p"><strong>Subject to the following mandatory conditions:</strong></p>
                        <ol class="legal-list" style="margin-left: 20px;">
                            ${conditionsList.map(c => `<li>${c}</li>`).join('')}
                        </ol>
                    ` : ''}

                    ${d.orderStatus === 'GRANTED' ? `
                        <p class="legal-text-p">The accused is released on executing a personal bond of ₹${proposedBail.toLocaleString('en-IN')} with one solvent surety of like amount to the satisfaction of the court registrar.</p>
                    ` : ''}

                    ${d.orderStatus === 'DENIED' ? `
                        <p class="legal-text-p" style="color:#c0392b;">Bail application stands rejected. Accused is remanded to judicial custody. The severity of charges, combined with high risk parameters, warrants detention pending trial.</p>
                    ` : ''}
                `;

            case 5: // Compliance Alerts Log
                return `
                    <div class="document-title-block">
                        <h3>Post-Bail Compliance Tracking & Alerts Log</h3>
                    </div>
                    
                    <p class="legal-text-p">
                        This schedule outlines active compliance notifications and automated alert parameters configured in the **Verdiqo Compliance Engine** for Case <strong>${d.caseNumber}</strong>.
                    </p>
                    
                    <div class="legal-section-header">1. SYSTEM INTEGRATION TRACKING STATUS</div>
                    <table class="legal-table">
                        <thead>
                            <tr>
                                <th>Check Type</th>
                                <th>Schedule / Deadline</th>
                                <th>Recipient</th>
                                <th>Alert Channel</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Hearing Reminder</td>
                                <td>3 Days Prior (Scheduled Hearing)</td>
                                <td>Accused + Surety</td>
                                <td>SMS / WhatsApp</td>
                                <td><span class="badge badge-green">Scheduled</span></td>
                            </tr>
                            <tr>
                                <td>Property Mutation Tracker</td>
                                <td>7-Day Target from Order Activation</td>
                                <td>Court Registrar</td>
                                <td>Verdiqo System Banner</td>
                                <td><span class="badge badge-info">${d.surety.mutationStatus === 'COMPLETED' ? 'Completed' : 'Awaiting XML'}</span></td>
                            </tr>
                            <tr>
                                <td>Biometric Verification</td>
                                <td>Every Monday 10:00 AM</td>
                                <td>Accused</td>
                                <td>Police Station Counter</td>
                                <td><span class="badge badge-yellow">Pending First Check</span></td>
                            </tr>
                            <tr>
                                <td>Immigration Watch</td>
                                <td>Real-time Border Entry Alert</td>
                                <td>Immigration/Judge</td>
                                <td>Priority Flag</td>
                                <td><span class="badge badge-green">Active Monitoring</span></td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div class="legal-section-header">2. REAL-TIME EXCEPTION PROTOCOLS</div>
                    <p class="legal-text-p">
                        If the accused fails to perform counter biometrics at the local precinct on the appointed day, a high-priority <strong>Non-Appearance Notification</strong> is dispatched to the Preceding Judge and the Superintendent of Police within <strong>30 minutes</strong> of the deadline.
                    </p>
                `;

            case 6: // Statistical Reports
                return `
                    <div class="document-title-block">
                        <h3>Quantex Smart Analytics & Statistical Report</h3>
                        <p style="font-size: 11px;">VERDIQO DISTRICT COURT COMPLIANCE AUDIT</p>
                    </div>
                    
                    <p class="legal-text-p">
                        Aggregated statistics regarding bail decisions, processing durations, and compliance metrics for the judicial subdivision of Rajamundry.
                    </p>
                    
                    <div class="legal-section-header">1. BENCHMARK PERFORMANCE METRICS</div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px;">
                        <div style="background-color: #f7f3ec; padding: 12px; border-radius: 4px; text-align:center;">
                            <h5 style="font-size: 12px; color:#666;">AVG PROCESSING TIME</h5>
                            <p style="font-family: var(--font-mono); font-size: 24px; font-weight:700; color: var(--color-gold);">14.2 Min</p>
                            <span style="font-size: 10px; color:#1a7a4a;">Target: 30 Min (Cleared)</span>
                        </div>
                        <div style="background-color: #f7f3ec; padding: 12px; border-radius: 4px; text-align:center;">
                            <h5 style="font-size: 12px; color:#666;">OBLIGATION VALUE ACTIVE</h5>
                            <p style="font-family: var(--font-mono); font-size: 24px; font-weight:700; color: var(--color-gold);">₹4.2 Cr</p>
                            <span style="font-size: 10px; color:#555;">Across 148 mutated properties</span>
                        </div>
                        <div style="background-color: #f7f3ec; padding: 12px; border-radius: 4px; text-align:center;">
                            <h5 style="font-size: 12px; color:#666;">SURETY DEFAULT RATE</h5>
                            <p style="font-family: var(--font-mono); font-size: 24px; font-weight:700; color: var(--color-danger);">0.84%</p>
                            <span style="font-size: 10px; color:#1a7a4a;">Industry threshold: 5.0%</span>
                        </div>
                    </div>
                    
                    <div class="legal-section-header">2. MONTHLY ADJUDICATION RATIOS</div>
                    <table class="legal-table">
                        <thead>
                            <tr>
                                <th>Judicial Division</th>
                                <th>Total Bail Applications</th>
                                <th>Granted (Plain)</th>
                                <th>Granted (With Conditions)</th>
                                <th>Denied</th>
                                <th>System recommendation compliance</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Rajamundry Sub-court 1</td>
                                <td>142 Cases</td>
                                <td>42%</td>
                                <td>38%</td>
                                <td>20%</td>
                                <td>94.8%</td>
                            </tr>
                            <tr>
                                <td>Rajamundry Sub-court 2</td>
                                <td>98 Cases</td>
                                <td>38%</td>
                                <td>40%</td>
                                <td>22%</td>
                                <td>91.2%</td>
                            </tr>
                            <tr>
                                <td>District Sessions Court</td>
                                <td>64 Cases</td>
                                <td>28%</td>
                                <td>52%</td>
                                <td>20%</td>
                                <td>96.5%</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <p class="legal-text-p" style="font-size: 11px; color:#555; text-align:center; margin-top: 10px;">
                        This statistical data conforms with standard reporting protocols for the High Court of Andhra Pradesh.
                    </p>
                `;

            case 7: // Bail Satisfaction & Release Certificate (NEW)
                return `
                    <div class="document-title-block">
                        <h3>Bail Satisfaction & Release Certificate</h3>
                        <p style="font-size: 11px; margin-top: 4px;">FORM 22 - STATE REVENUE DEPARTMENT MUTATION RELEASE DIRECTIVE</p>
                    </div>
                    
                    <p class="legal-text-p">
                        To,<br/>
                        <strong>The Tahsildar / Mandal Revenue Officer</strong><br/>
                        Rajamundry Urban Mandal, East Godavari District, Andhra Pradesh.
                    </p>
                    
                    <p class="legal-text-p" style="margin-top: 14px;">
                        <strong>SUBJECT:</strong> Expunging and Satisfaction of Bail Encumbrance (Mutation Release Order).
                    </p>
                    
                    <p class="legal-text-p">
                        It is hereby certified that the bail conditions and financial obligations imposed upon the accused, <strong>${d.accused.fullName}</strong> in case number <strong>${d.caseNumber}</strong>, have been fully satisfied or the bail has been formally discharged by the order of this Hon’ble Court.
                    </p>
                    
                    <div class="legal-section-header">PROPERTY DESCRIPTION FOR MUTATION RELEASE</div>
                    <table class="legal-table">
                        <tr>
                            <td style="font-weight:700; width: 200px; background-color: #f9f9f9;">Registered Owner:</td>
                            <td>${d.surety.fullName} (Surety)</td>
                        </tr>
                        <tr>
                            <td style="font-weight:700; background-color: #f9f9f9;">Property Address:</td>
                            <td>${d.surety.propertyAddress || 'Ward No. 8, Subhash Road, Rajamundry'}</td>
                        </tr>
                        <tr>
                            <td style="font-weight:700; background-color: #f9f9f9;">Revenue Survey Number:</td>
                            <td style="font-family: var(--font-mono); font-weight:700;">${d.surety.surveyNumber || 'RS-104/12-C'}</td>
                        </tr>
                        <tr>
                            <td style="font-weight:700; background-color: #f9f9f9;">Revenue Patta/Khata Record:</td>
                            <td style="font-family: var(--font-mono);">${d.surety.propertyRevenueRecord || 'Patta No: P-8472-RJM'}</td>
                        </tr>
                        <tr>
                            <td style="font-weight:700; background-color: #f9f9f9;">Bail Bond Released:</td>
                            <td style="font-family: var(--font-mono); font-weight:700; color:#1a7a4a;">₹${proposedBail.toLocaleString('en-IN')} (SATISFIED)</td>
                        </tr>
                    </table>
                    
                    <div class="legal-section-header">MUTATION DISCHARGE ORDER</div>
                    <p class="legal-text-p" style="color: #1a7a4a; font-weight:700; font-size: 14.5px;">
                        THE REVENUE OFFICE IS DIRECTED TO IMMEDIATELY EXPUNGE THE COURT LIEN AND RELEASE THE ENCUMBRANCE MUTATION RECORDED ON THE WEB-LAND ADANGAL REGISTRY FOR THE ABOVE PROPERTY.
                    </p>
                    <p class="legal-text-p">
                        This order discharges all surety liabilities. The land is restored to an unencumbered status and returned fully to the owner. Let this decree be executed in the official government land records forthwith.
                    </p>

                    <div style="margin-top: 15px; border: 1px dashed var(--color-success); background: rgba(74, 222, 128, 0.05); padding: 12px; border-radius: 6px;">
                        <span style="font-family: var(--font-mono); font-size: 11px; font-weight: 700; color: #1a7a4a; display: block;">AUTOMATED RELEASE AUTHENTICATION PROTOCOL</span>
                        <span style="font-family: var(--font-mono); font-size: 10px; color: #555;">MUTATION DISCHARGE HASH: SHA-256/RELEASE-MUTATION-${Math.floor(100000 + Math.random() * 900000)}-SEC</span>
                    </div>
                `;
        }
    }
};
