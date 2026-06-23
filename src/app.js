import { VerificationEngine } from './utils/verificationEngine.js';
import { DashboardStaff } from './components/DashboardStaff.js';
import { DashboardJudge } from './components/DashboardJudge.js';
import { DashboardAdmin } from './components/DashboardAdmin.js';
import { DashboardCitizen } from './components/DashboardCitizen.js';
import { ReportViewer } from './components/ReportViewer.js';
import {
    db,
    getCaseByNo,
    getAccusedByCase,
    getSuretyByCase,
    getBiometricByCase,
    getComplianceByCase,
    getOpenFraudAlerts,
    getCasesByStatus,
    getHighRiskCases,
    getFullCaseProfile
} from './verdiqo_db.js';

// Consolidate the database arrays into initial runtime state
const INITIAL_DATABASE = db.bailApplications.map(c => {
    const a = getAccusedByCase(c.caseNo) || {
        fullName: c.accusedName || 'Unknown',
        dob: '1990-01-01',
        age: '35',
        fathersName: 'Unknown',
        residentialAddress: 'Unknown',
        mobile: '',
        aadhaarNo: '',
        panNo: '',
        dlNo: '',
        passportNo: '',
        employment: '',
        monthlyIncomeRs: '0',
        bankAccNo: '',
        cibilScore: '650',
        previousNcrbCases: '0',
        bailComplianceHistory: '',
        abscondingIncidents: '0',
        immigrationLocStatus: 'CLEAR',
        biometricStatus: 'VERIFIED',
        identityVerified: 'YES'
    };

    const s = getSuretyByCase(c.caseNo) || {
        suretyName: 'Unknown',
        relationship: 'Unknown',
        aadhaarNo: '',
        panNo: '',
        mobile: '',
        suretyType: 'Individual',
        employment: '',
        monthlyIncomeRs: '0',
        avgAnnualItrRs: '0',
        propertyAddress: '',
        surveyNo: '',
        pattaKhataNo: '',
        marketValueRs: '0',
        titleDeedId: '',
        encumbranceStatus: '',
        activeGuaranteesCount: '0',
        maxAllowed: '2',
        guaranteeOverload: 'NO',
        financialCapacityCheck: 'ADEQUATE',
        disqualificationFlags: 'NIL',
        biometricStatus: 'VERIFIED',
        suretyVerdict: 'ELIGIBLE'
    };

    return {
        caseNumber: c.caseNo,
        firNumber: c.firNo,
        ipcSections: c.ipcBnsSections,
        dateOfArrest: c.arrestDate,
        policeStation: c.psIoName + " PS",
        presidingJudge: "Hon'ble " + c.judgeName,
        judgeId: "JUDGE-" + c.judgeName.replace(/[^A-Za-z0-9]/g, '').toUpperCase(),
        courtLocation: c.courtName + ", " + c.district,
        caseStatus: (c.applicationStatus === 'GRANTED' || c.applicationStatus === 'DENIED') ? 'Completed' : 'Checking',
        previousCourtOrders: c.previousBailRejected === 'Yes' 
            ? `Yes, prior rejection on ${c.previousRejectionDate}. Reason: ${c.rejectionReason}`
            : 'None.',
        filingDate: c.filingDate,
        supportingDocs: ['Character Certificate', 'Employment Letter', 'Community Ties Evidence'],
        bailType: c.bailType,
        proposedBailAmount: parseInt(c.proposedBailAmtRs) || 50000,
        proposedConditions: ['Weekly Reporting', 'Passport Deposit', 'No Contact with Witnesses'],
        hearingDate: c.hearingDate + "T" + c.hearingTime,
        currentStatus: (c.applicationStatus === 'GRANTED' || c.applicationStatus === 'DENIED') ? 'Completed' : 'Checking',
        orderStatus: c.applicationStatus === 'GRANTED' ? 'GRANTED' : (c.applicationStatus === 'DENIED' ? 'DENIED' : 'PENDING'),
        applicationStatus: c.applicationStatus,
        judgeRemarks: c.adjudication,
        digitalSignature: (c.applicationStatus === 'GRANTED' || c.applicationStatus === 'DENIED') ? 'AFFIXED_MD5_' + c.caseNo.replace(/[^a-zA-Z0-9]/g, '') : '',
        accused: {
            fullName: a.fullName,
            dob: a.dob,
            age: a.age || '35',
            fathersName: a.fathersName,
            address: a.residentialAddress,
            mobileNumber: a.mobile,
            aadhaarNumber: a.aadhaarNo,
            panNumber: a.panNo,
            drivingLicense: a.dlNo || 'NIL',
            passportNumber: a.passportNo || 'NIL',
            employmentDetails: a.employment,
            monthlyIncome: parseInt(a.monthlyIncomeRs) || 0,
            bankAccount: a.bankAccNo,
            cibilScore: parseInt(a.cibilScore) || 600,
            criminalHistory: `${a.previousNcrbCases} prior cases. Absconding: ${a.abscondingIncidents}.`,
            ncrbCount: parseInt(a.previousNcrbCases) || 0,
            prevBailsGranted: a.bailComplianceHistory.includes('/') ? parseInt(a.bailComplianceHistory.split('/')[1]) || 0 : 0,
            prevBailsHonored: a.bailComplianceHistory.includes('/') ? parseInt(a.bailComplianceHistory.split('/')[0]) || 0 : 0,
            abscondingCount: parseInt(a.abscondingIncidents) || 0,
            travelRestricted: a.immigrationLocStatus !== 'CLEAR',
            bankBalance6m: 25000
        },
        surety: {
            suretyType: s.suretyType ? s.suretyType.toUpperCase() : 'INDIVIDUAL',
            fullName: s.suretyName,
            relationToAccused: s.relationship,
            mobileNumber: s.mobile,
            aadhaarNumber: s.aadhaarNo,
            panNumber: s.panNo,
            employmentDetails: s.employment,
            monthlyIncome: parseInt(s.monthlyIncomeRs) || 0,
            avgAnnualItr: parseInt(s.avgAnnualItrRs) || 0,
            activeBailCount: parseInt(s.activeGuaranteesCount) || 0,
            maxAllowed: parseInt(s.maxAllowed) || 2,
            propertyAddress: s.propertyAddress || '',
            surveyNumber: s.surveyNo || '',
            propertyValuation: parseInt(s.marketValueRs) || 0,
            propertyOwnershipDoc: s.titleDeedId ? "Title Deed ID: " + s.titleDeedId : 'N/A',
            propertyRevenueRecord: s.pattaKhataNo ? "Patta No: " + s.pattaKhataNo : 'N/A',
            encumbranceStatus: s.encumbranceStatus || 'CLEAN',
            mutationStatus: s.encumbranceStatus.includes('MUTATION') ? 'PENDING' : 'COMPLETED',
            guaranteeOverload: s.guaranteeOverload || 'NO',
            financialCapacityCheck: s.financialCapacityCheck || 'ADEQUATE',
            disqualificationFlags: s.disqualificationFlags || 'NIL'
        },
        checks: {}
    };
});

class ApplicationState {
    constructor() {
        this.language = 'EN';
        this.currentUser = null;
        this.cases = [];
        this.staffActiveTab = 'dashboard';
        this.adminActiveTab = 'admin-kpi';
        this.citizenTab = 'home';
        this.selectedCaseNumber = null;
        this.citizenSearchQuery = '';
        this.eSignAffixed = false;
        this.adjudicationDecision = null;
        this.remarks = "";
        
        // Biometric scanning state indicators
        this.accusedFingerScanning = false;
        this.accusedIrisScanning = false;
        this.suretyFingerScanning = false;
        
        this.logs = [];
        
        this.initDatabase();
    }

    async initDatabase() {
        try {
            const res = await fetch('/api/cases');
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) {
                    this.cases = data;
                    localStorage.setItem('verdiqo_db_pwa', JSON.stringify(this.cases));
                }
            }
        } catch (e) {
            console.warn("Server offline or API error. Falling back to local storage.", e);
        }

        // Fetch cryptographic audit logs from backend
        try {
            const logRes = await fetch('/api/logs');
            if (logRes.ok) {
                this.logs = await logRes.json();
            }
        } catch (e) {
            console.warn("Failed to load logs from server:", e);
        }

        let cached = localStorage.getItem('verdiqo_db_pwa');
        let parsedSuccessfully = false;
        if (cached) {
            try {
                this.cases = JSON.parse(cached);
                parsedSuccessfully = true;
            } catch (err) {
                console.error("Failed to parse cached database. Clearing local cache.", err);
                localStorage.removeItem('verdiqo_db_pwa');
            }
        }
        
        if (!parsedSuccessfully) {
            // Pre-compile verification metrics using engine
            this.cases = INITIAL_DATABASE.map(c => {
                const fingerprintMatched = c.accused.aadhaarNumber !== '';
                const retinaMatched = c.accused.aadhaarNumber !== '';

                const idCheck = VerificationEngine.verifyIdentity(c.accused.aadhaarNumber, fingerprintMatched, retinaMatched);
                
                const avgItr = c.surety.avgAnnualItr || (c.surety.monthlyIncome * 12);
                const finCheck = VerificationEngine.verifyFinancialCapacity(c.surety.panNumber, [avgItr, avgItr, avgItr], c.accused.bankBalance6m, c.accused.cibilScore || 680, c.proposedBailAmount);
                
                const riskCheck = VerificationEngine.calculateRiskScore(c.accused.ncrbCount, c.accused.prevBailsGranted, c.accused.prevBailsHonored, c.accused.abscondingCount, c.accused.travelRestricted);
                
                const suretyCheck = VerificationEngine.verifySuretyLoad(c.surety.activeBailCount, 0);
                
                const isEncumbered = c.surety.encumbranceStatus.includes('ENCUMBERED') || 
                                     c.surety.encumbranceStatus.includes('MUTATION') ||
                                     c.surety.disqualificationFlags.toLowerCase().includes('fake') ||
                                     c.surety.disqualificationFlags.toLowerCase().includes('mismatch');
                const propCheck = VerificationEngine.verifyProperty(c.surety.suretyType === 'PROPERTY', c.surety.fullName, c.surety.fullName, isEncumbered, c.surety.propertyValuation, c.proposedBailAmount);
                
                const recCheck = VerificationEngine.compileRecommendation(idCheck, finCheck, riskCheck, suretyCheck, propCheck);

                c.checks = {
                    identity: idCheck,
                    finance: finCheck,
                    risk: riskCheck,
                    suretyLoad: suretyCheck,
                    property: propCheck,
                    recommendation: recCheck
                };
                return c;
            });
            await this.saveDatabase();
        }
    }

    async saveDatabase() {
        localStorage.setItem('verdiqo_db_pwa', JSON.stringify(this.cases));
        try {
            const res = await fetch('/api/cases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.cases)
            });
            if (res.ok) {
                this.showToast('Central registry database synchronized.', 'success');
            } else {
                throw new Error("API error response");
            }
        } catch (e) {
            console.error("Failed to sync database to server:", e);
            this.showToast('Offline Mode: Changes saved to local browser cache.', 'info');
        }
    }

    startAutoSync() {
        setInterval(async () => {
            // Only sync if logged in
            if (!this.currentUser) return;
            
            try {
                // Fetch cases
                const res = await fetch('/api/cases');
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.length > 0) {
                        const dataStr = JSON.stringify(data);
                        const currentStr = JSON.stringify(this.cases);
                        if (dataStr !== currentStr) {
                            this.cases = data;
                            localStorage.setItem('verdiqo_db_pwa', JSON.stringify(this.cases));
                            
                            // Check if user is typing
                            const activeEl = document.activeElement;
                            const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');
                            // Also check if any scan is active
                            const isScanning = this.accusedFingerScanning || this.accusedIrisScanning || this.suretyFingerScanning;
                            // Check if report/otp modal is open
                            const isModalOpen = document.getElementById('aadhaar-otp-modal') || document.getElementById('document-selector-overlay');
                            
                            if (!isTyping && !isScanning && !isModalOpen) {
                                updateUI();
                            }
                        }
                    }
                }
                
                // Fetch logs
                const logRes = await fetch('/api/logs');
                if (logRes.ok) {
                    const logData = await logRes.json();
                    if (logData && logData.length > 0) {
                        const logStr = JSON.stringify(logData);
                        const currentLogStr = JSON.stringify(this.logs);
                        if (logStr !== currentLogStr) {
                            this.logs = logData;
                            // Only update UI if we are in admin active tab that shows logs
                            if (this.currentUser.role === 'ADMIN' && this.adminActiveTab === 'admin-logs') {
                                const activeEl = document.activeElement;
                                const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
                                if (!isTyping) {
                                    updateUI();
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                console.warn("Background auto-sync failed:", e);
            }
        }, 5000);
    }

    showToast(message, type = 'success') {
        const existing = document.getElementById('verdiqo-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'verdiqo-toast';
        toast.className = 'toast-notification';
        
        let icon = '✓';
        let borderCol = 'var(--color-success)';
        if (type === 'info') {
            icon = '⚡';
            borderCol = 'var(--color-gold)';
        }

        toast.style.borderLeftColor = borderCol;
        toast.innerHTML = `
            <div style="font-size: 20px; font-weight: bold; color: ${type === 'success' ? 'var(--color-success)' : 'var(--color-gold)'};">${icon}</div>
            <div>
                <div style="font-weight: 700; font-size: 13px; color: var(--color-text-main);">Database Sync</div>
                <div style="font-size: 11px; color: var(--color-text-muted); margin-top: 2px;">${message}</div>
            </div>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 50);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    async addAuditLog(actionCategory, details) {
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const userStr = this.currentUser ? `${this.currentUser.name} (${this.currentUser.role})` : 'System';
        
        // Generate a mock hash representing cryptographic verify block
        const characters = '0123456789abcdef';
        let hash = '0x';
        for (let i = 0; i < 32; i++) {
            hash += characters[Math.floor(Math.random() * 16)];
        }

        const logEntry = {
            timestamp,
            user: userStr,
            category: actionCategory,
            details,
            hash
        };

        this.logs.unshift(logEntry);

        try {
            await fetch('/api/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.logs)
            });
        } catch (e) {
            console.error("Failed to sync log to server:", e);
        }
    }

    login(role, username, password) {
        if (role === 'STAFF') {
            if (username === 'staff1' && password === 'court123') {
                this.currentUser = { name: 'K. Lakshmi', role: 'STAFF', designation: 'Court Bench Clerk', court: 'Rajamundry District Court' };
                this.staffActiveTab = 'dashboard';
                this.addAuditLog('AUTH_LOGIN', 'Court Staff authorized entry to central registry.');
                return true;
            }
        } else if (role === 'JUDGE') {
            if (username === 'judge1' && password === 'justice789') {
                this.currentUser = { name: 'Hon\'ble J. Kameswara Rao', role: 'JUDGE', designation: 'Presiding Judge', court: 'Sessions Court Room 2' };
                this.addAuditLog('AUTH_LOGIN', 'Presiding Judge authorized secure adjudication bench access.');
                return true;
            }
        } else if (role === 'ADMIN') {
            if (username === 'admin1' && password === 'district456') {
                this.currentUser = { name: 'K. Prasad Rao', role: 'ADMIN', designation: 'District Head Judge', court: 'East Godavari Judicial Division' };
                this.adminActiveTab = 'admin-kpi';
                this.addAuditLog('AUTH_LOGIN', 'District Head Judge authorized administrative audit desk access.');
                return true;
            }
        } else if (role === 'CITIZEN') {
            this.currentUser = { name: 'Citizen User', role: 'CITIZEN', designation: 'Citizen Tracker', court: 'Rajamundry Division' };
            this.citizenTab = 'home';
            this.addAuditLog('AUTH_LOGIN', 'Citizen Tracker requested public gateway case tracking.');
            return true;
        }
        return false;
    }

    logout() {
        this.addAuditLog('AUTH_LOGOUT', 'User closed active session and terminated cryptographic credentials.');
        this.currentUser = null;
        this.selectedCaseNumber = null;
        this.citizenSearchQuery = '';
        this.eSignAffixed = false;
        this.adjudicationDecision = null;
        this.remarks = "";
    }

    openDocumentSelector(caseNo) {
        const caseRecord = this.cases.find(c => c.caseNumber === caseNo);
        if (!caseRecord) return;

        // Remove any existing modal
        const existing = document.getElementById('document-selector-overlay');
        if (existing) existing.remove();

        // Document options selector
        const reports = [
            { id: 1, name: 'Bail Eligibility Assessment Report', icon: '📋' },
            { id: 2, name: 'Surety Verification Report', icon: '🔍' },
            { id: 3, name: 'Property Mutation Order', icon: '🏠' },
            { id: 4, name: 'Order of Bail Adjudication (Draft)', icon: '⚖️' },
            { id: 5, name: 'Post-Bail Compliance Tracking Log', icon: '📊' },
            { id: 7, name: 'Bail Satisfaction & Release Certificate', icon: '✅' }
        ];

        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'document-selector-overlay';
        modalOverlay.className = 'modal-overlay';
        modalOverlay.style = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(5,12,22,0.85); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 16px; box-sizing: border-box;';
        
        modalOverlay.innerHTML = `
            <div class="modal-content" style="font-family: 'Public Sans', sans-serif; background: var(--color-card-dark); border: 2px solid var(--color-border); border-radius: 12px; width: 100%; max-width: 520px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.6);">
                
                <!-- Modal Header -->
                <div style="background: var(--color-header-dark); border-bottom: 2px solid #FFD700; padding: 16px 20px; display: flex; align-items: center; gap: 12px;">
                    <button id="back-selector-btn" style="display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: #FFFFFF; font-size: 13px; font-weight: 700; padding: 7px 14px; border-radius: 6px; cursor: pointer; transition: background 0.2s; white-space: nowrap;">
                        ← Back
                    </button>
                    <div style="flex: 1; min-width: 0;">
                        <div style="color: #FFD700; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Legal Document Selector</div>
                        <div style="color: #FFFFFF; font-size: 14px; font-weight: 700; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${caseRecord.accused.fullName}
                            <span style="color: rgba(255,255,255,0.85); font-size: 12px; font-weight: 700; font-family: var(--font-mono); margin-left: 6px;">${caseRecord.caseNumber}</span>
                        </div>
                    </div>
                    <button id="close-selector-btn" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.7); font-size: 20px; line-height: 1; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        ✕
                    </button>
                </div>

                <!-- Report List -->
                <div style="padding: 16px 20px 20px 20px; display: flex; flex-direction: column; gap: 8px;">
                    <p style="color: var(--color-text-muted); font-size: 12px; margin: 0 0 8px 0; font-weight: bold;">Select a report to generate and preview:</p>
                    ${reports.map((r, i) => `
                        <button class="btn-select-report" data-id="${r.id}">
                            <span style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-size: 18px;">${r.icon}</span>
                                <span class="report-name-text">${i + 1}. ${r.name}</span>
                            </span>
                            <span class="report-arrow">→</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(modalOverlay);

        // Back / Close buttons both dismiss the modal
        const closeModal = () => modalOverlay.remove();
        modalOverlay.querySelector('#back-selector-btn').addEventListener('click', closeModal);
        modalOverlay.querySelector('#close-selector-btn').addEventListener('click', closeModal);

        // Click outside the inner box also closes
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });

        // Setup report row click handler
        modalOverlay.querySelectorAll('.btn-select-report').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                modalOverlay.remove();
                
                // Show specific report page
                ReportViewer.show(id, caseRecord, () => {
                    // Reopen selector on close if desired
                    this.openDocumentSelector(caseNo);
                }, () => {
                    // Back logic
                    this.openDocumentSelector(caseNo);
                });
            });
        });
    }

}

const AppState = new ApplicationState();

function updateUI() {
    const root = document.getElementById('app-root');

    if (!AppState.currentUser) {
        renderLogin(root);
        return;
    }

    const role = AppState.currentUser.role;

    // Outer layout shell
    root.innerHTML = `
        <div class="app-wrapper" style="min-height: 100vh; background: var(--color-bg-dark); display: flex; flex-direction: column;">
            <!-- India Govt Tricolor Accent Bar -->
            <div class="tricolor-bar" style="height: 4px; display: flex; width: 100%;">
                <div style="flex: 1; background: #FF9933;"></div>
                <div style="flex: 1; background: #FFFFFF;"></div>
                <div style="flex: 1; background: #128807;"></div>
            </div>
            <!-- Top Navbar -->
            <header class="top-navbar" style="background: linear-gradient(135deg, #1b3f6b 0%, #11294a 100%); border-bottom: 2px solid var(--color-border); padding: 12px 25px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 15px rgba(0,0,0,0.18);">
                <div class="brand-section" style="display: flex; align-items: center; gap: 15px;">
                    <div class="emblem-svg-container" style="display: flex; align-items: center; justify-content: center;">
                        <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#FFD700" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 4px rgba(255,215,0,0.5));">
                            <!-- Base -->
                            <path d="M8 21h8M12 17v4" />
                            <!-- Pillar -->
                            <path d="M12 5v12" />
                            <circle cx="12" cy="4" r="1.5" fill="#FFD700" />
                            <!-- Main Beam -->
                            <path d="M5 7h14" />
                            <!-- Left Hanger & Pan -->
                            <path d="M5 7l-2.5 7h5L5 7z" />
                            <path d="M2.5 14c0 1.5 1.1 2 2.5 2s2.5-.5 2.5-2" />
                            <!-- Right Hanger & Pan -->
                            <path d="M19 7l-2.5 7h5L19 7z" />
                            <path d="M16.5 14c0 1.5 1.1 2 2.5 2s2.5-.5 2.5-2" />
                        </svg>
                    </div>
                    <div>
                        <h1 style="color: #FFFFFF; font-family: var(--font-brand); font-size: 19px; margin: 0; font-weight: 700; letter-spacing: 0.5px; display: flex; align-items: center; gap: 10px;">
                            VERDIQO <span style="font-size: 11.5px; color: #0a0f18; background: #FFD700; border: none; padding: 3px 8px; border-radius: 4px; font-weight: 800; font-family: var(--font-body); letter-spacing: 0.5px; text-transform: uppercase; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">e-Courts Portal</span>
                        </h1>
                        <p style="color: rgba(255,255,255,0.75); font-size: 11px; margin: 3px 0 0 0; font-family: var(--font-body); font-weight: 500; letter-spacing: 0.5px;">Integrated Bail Decision Support Desk • Government of India</p>
                    </div>
                </div>

                <div class="nav-actions" style="display: flex; align-items: center; gap: 15px;">
                    <div class="secure-badge" style="display: flex; align-items: center; gap: 6px; background: rgba(18, 136, 7, 0.15); border: 1px solid rgba(18, 136, 7, 0.4); padding: 4px 12px; border-radius: 20px; font-size: 10px; color: #81e681; font-weight: 700; letter-spacing: 0.5px; font-family: var(--font-mono);">
                        <span style="display: inline-block; width: 6px; height: 6px; background: #5cdb5c; border-radius: 50%; box-shadow: 0 0 8px #5cdb5c; animation: pulseGreen 2s infinite;"></span>
                        NIC-NET SECURE
                    </div>
                    <button class="theme-toggle-btn-mock" id="global-theme-toggle-btn" title="Toggle Theme" style="display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; background: rgba(255,255,255,0.06); border: 1px solid var(--color-border); border-radius: 6px; cursor: pointer; font-size: 14px; color: #FFFFFF; transition: background 0.2s;">
                        ${document.body.classList.contains('light-theme') ? '🌙' : '☀️'}
                    </button>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="user-avatar" style="width: 32px; height: 32px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.25); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #FFD700; font-weight: 700; font-size: 14px;">${AppState.currentUser.name.charAt(0)}</div>
                        <div class="user-info-display" style="text-align: left; line-height: 1.3;">
                            <div style="color: #FFFFFF; font-size: 13.5px; font-weight: 700;">${AppState.currentUser.name}</div>
                            <div style="font-size: 9.5px; color: rgba(255,255,255,0.70); text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600;">${AppState.currentUser.designation}</div>
                        </div>
                    </div>
                    <button class="btn" id="global-logout-btn" style="font-size: 12.5px; font-weight: 700; border: 1px solid rgba(255,255,255,0.25); color: #FFFFFF; background: rgba(255,255,255,0.08); padding: 7px 15px; border-radius: 6px; cursor: pointer; transition: all 0.2s; white-space: nowrap;">Logout</button>
                </div>
            </header>
            <style>
                @keyframes pulseGreen {
                    0% { opacity: 0.5; }
                    50% { opacity: 1; }
                    100% { opacity: 0.5; }
                }
                .theme-toggle-btn-mock:hover {
                    background: rgba(255,255,255,0.12) !important;
                }
                #global-logout-btn:hover {
                    background: rgba(255, 68, 68, 0.15) !important;
                    border-color: rgba(255, 68, 68, 0.4) !important;
                    color: #ff9999 !important;
                    transform: translateY(-0.5px);
                }
                #global-logout-btn:active {
                    transform: translateY(0);
                }
            </style>
            <!-- Main Workspace content -->
            <main class="main-content" id="dashboard-mount-point" style="flex: 1; padding: 25px; max-width: 1200px; width: 100%; margin: 0 auto; box-sizing: border-box;"></main>
        </div>
    `;

    // Theme toggle trigger
    root.querySelector('#global-theme-toggle-btn').addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        localStorage.setItem('verdiqo_theme', isLight ? 'light' : 'dark');
        
        // Update open docket if any
        const docketOverlay = document.getElementById('report-modal-overlay');
        if (docketOverlay) {
            const themeSelect = docketOverlay.querySelector('#docket-theme-select');
            const sheet = docketOverlay.querySelector('.legal-page-sheet');
            if (themeSelect && sheet && themeSelect.value === 'system') {
                sheet.classList.remove('theme-cream', 'theme-black');
                if (isLight) {
                    sheet.classList.add('theme-cream');
                } else {
                    sheet.classList.add('theme-black');
                }
            }
        }

        updateUI();
    });

    // Logout trigger
    root.querySelector('#global-logout-btn').addEventListener('click', () => {
        AppState.logout();
        updateUI();
    });

    const mountPoint = root.querySelector('#dashboard-mount-point');

    // Route to appropriate view
    if (role === 'STAFF') {
        DashboardStaff.render(mountPoint, AppState, updateUI);
    } else if (role === 'JUDGE') {
        DashboardJudge.render(mountPoint, AppState, updateUI);
    } else if (role === 'ADMIN') {
        DashboardAdmin.render(mountPoint, AppState, updateUI);
    } else if (role === 'CITIZEN') {
        DashboardCitizen.render(mountPoint, AppState, updateUI);
    }
}

function renderLogin(root) {
    let activeRole = 'STAFF';

    const renderLoginForm = () => {
        let defaultUser = 'staff1';
        let defaultPass = 'court123';
        if (activeRole === 'JUDGE') {
            defaultUser = 'judge1';
            defaultPass = 'justice789';
        } else if (activeRole === 'ADMIN') {
            defaultUser = 'admin1';
            defaultPass = 'district456';
        }

        let inputFields = '';
        if (activeRole === 'CITIZEN') {
            inputFields = `
                <div class="form-group" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 15px;">
                    <label style="color: var(--color-text-muted); font-size: 13px; font-weight: 500;">Aadhaar / Case Number</label>
                    <input type="text" id="login-username" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 12px; color: #FFFFFF; font-family: var(--font-mono); border-radius: 6px; font-size: 14px;" required placeholder="e.g. BMS/2026/0042" value="BMS/2026/0042">
                </div>
                <div class="form-group" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px;">
                    <label style="color: var(--color-text-muted); font-size: 13px; font-weight: 500;">OTP Verification</label>
                    <input type="text" id="login-password" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 12px; color: #FFFFFF; font-family: var(--font-mono); border-radius: 6px; font-size: 14px;" required placeholder="Awaiting OTP" value="123456" disabled>
                </div>
            `;
        } else {
            inputFields = `
                <div class="form-group" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 15px;">
                    <label style="color: var(--color-text-muted); font-size: 13px; font-weight: 500;">System Username</label>
                    <input type="text" id="login-username" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 12px; color: #FFFFFF; font-family: var(--font-mono); border-radius: 6px; font-size: 14px;" required value="${defaultUser}">
                </div>
                <div class="form-group" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px;">
                    <label style="color: var(--color-text-muted); font-size: 13px; font-weight: 500;">Access Password</label>
                    <input type="password" id="login-password" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 12px; color: #FFFFFF; font-family: var(--font-mono); border-radius: 6px; font-size: 14px;" required value="${defaultPass}">
                </div>
            `;
        }

        root.innerHTML = `
            <style>
                @keyframes slideUpFade {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .login-card {
                    animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    box-shadow: 0 15px 35px rgba(0,0,0,0.3) !important;
                    transition: all 0.3s ease !important;
                }
                body.light-theme .login-card {
                    background: #ffffff !important;
                    border: 1px solid #b0c4de !important;
                    box-shadow: 0 10px 30px rgba(29, 58, 104, 0.08) !important;
                }
                .form-input, select {
                    transition: all 0.2s ease !important;
                    outline: none !important;
                }
                .form-input:focus, select:focus {
                    border-color: var(--color-navy-sec) !important;
                    box-shadow: 0 0 0 3px rgba(59, 107, 182, 0.25) !important;
                }
                .login-btn {
                    transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
                    cursor: pointer;
                }
                .login-btn:hover {
                    transform: translateY(-1.5px);
                    box-shadow: 0 5px 15px rgba(59, 107, 182, 0.35) !important;
                }
                .login-btn:active {
                    transform: translateY(0);
                }
            </style>
            <div style="min-height: 100vh; background: var(--color-bg-dark); display: flex; justify-content: center; align-items: center; padding: 20px; box-sizing: border-box;">
                <div class="login-card" style="background: var(--color-card-dark); border: 2px solid var(--color-border); border-radius: 12px; width: 100%; max-width: 440px; padding: 30px;">
                    <div style="text-align: center; margin-bottom: 25px;">
                        <div style="display: flex; justify-content: center; margin-bottom: 8px;">
                            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#FFD700" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 5px rgba(255,215,0,0.5));">
                                <path d="M8 21h8M12 17v4" />
                                <path d="M12 5v12" />
                                <circle cx="12" cy="4" r="1.5" fill="#FFD700" />
                                <path d="M5 7h14" />
                                <path d="M5 7l-2.5 7h5L5 7z" />
                                <path d="M2.5 14c0 1.5 1.1 2 2.5 2s2.5-.5 2.5-2" />
                                <path d="M19 7l-2.5 7h5L19 7z" />
                                <path d="M16.5 14c0 1.5 1.1 2 2.5 2s2.5-.5 2.5-2" />
                            </svg>
                        </div>
                        <h2 style="color: var(--color-text-main); font-family: var(--font-brand); margin: 10px 0 5px 0; font-size: 23px; font-weight: 800;">VERDIQO Bail Management System</h2>
                        <p style="color: var(--color-text-muted); margin: 0; font-size: 12px; letter-spacing: 0.5px; font-weight: 500;">by Quantex Intelligence Systems</p>
                    </div>

                    <!-- Role selector dropdown -->
                    <div class="form-group" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px;">
                        <label style="color: var(--color-text-muted); font-size: 13px; font-weight: 500;">Adjudication System Role</label>
                        <select id="login-role-selector" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 12px; color: #FFFFFF; font-weight: 600; font-family: var(--font-body); font-size: 14px; border-radius: 6px; cursor: pointer; width: 100%;">
                            <option value="STAFF" ${activeRole === 'STAFF' ? 'selected' : ''}>Court Staff Portal</option>
                            <option value="JUDGE" ${activeRole === 'JUDGE' ? 'selected' : ''}>Presiding Judge Portal</option>
                            <option value="ADMIN" ${activeRole === 'ADMIN' ? 'selected' : ''}>District Head Judge Portal</option>
                            <option value="CITIZEN" ${activeRole === 'CITIZEN' ? 'selected' : ''}>Citizen Portal</option>
                        </select>
                    </div>

                    <form id="login-auth-form">
                        ${inputFields}
                        
                        <button type="submit" class="btn btn-primary login-btn" style="width: 100%; padding: 14px; font-weight: 700; font-size: 14.5px; background: var(--color-navy-sec); border: none; color: #FFFFFF; border-radius: 6px; margin-top: 10px; margin-bottom: 20px;">
                            Sign in with Cryptographic Security
                        </button>
                    </form>

                    <div style="border-top: 1px solid var(--color-border); padding-top: 15px; text-align: center;">
                        <span class="badge" style="background: rgba(240, 194, 67, 0.1); border: 1px solid var(--color-gold); color: var(--color-gold-light); font-size: 11px; padding: 4px 8px; border-radius: 4px; display: inline-block;">
                            🔐 Cryptographic Login Verification
                        </span>
                    </div>
                </div>
            </div>
        `;

        // Handle dropdown role switch
        root.querySelector('#login-role-selector').addEventListener('change', (e) => {
            activeRole = e.target.value;
            renderLoginForm();
        });

        // Submit form
        root.querySelector('#login-auth-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const u = root.querySelector('#login-username').value.trim();
            const p = root.querySelector('#login-password') ? root.querySelector('#login-password').value : '';
            
            const success = AppState.login(activeRole, u, p);
            if (success) {
                updateUI();
            } else {
                alert("ACCESS DENIED: Credentials mismatch or signature verification failure.");
            }
        });
    };

    renderLoginForm();
}

async function initApp() {
    // Read and apply saved theme preference, defaulting to light/beige
    const savedTheme = localStorage.getItem('verdiqo_theme');
    if (savedTheme === 'dark') {
        document.body.classList.remove('light-theme');
    } else {
        document.body.classList.add('light-theme');
    }

    try {
        await AppState.initDatabase();
        AppState.startAutoSync();
    } catch (e) {
        console.error("Failed initialization:", e);
    }
    updateUI();
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
