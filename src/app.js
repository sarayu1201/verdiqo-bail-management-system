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

        const cached = localStorage.getItem('verdiqo_db_pwa');
        if (cached) {
            this.cases = JSON.parse(cached);
        } else {
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

        // Document options selector
        const reports = [
            { id: 1, name: '1. Bail Eligibility Assessment Report' },
            { id: 2, name: '2. Surety Verification Report' },
            { id: 3, name: '3. Property Mutation Order' },
            { id: 4, name: '4. Order of Bail Adjudication (Draft)' },
            { id: 5, name: '5. Post-Bail Compliance Tracking Log' },
            { id: 7, name: '6. Bail Satisfaction & Release Certificate' }
        ];

        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'document-selector-overlay';
        modalOverlay.className = 'modal-overlay';
        modalOverlay.style = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(5,12,22,0.8); display: flex; justify-content: center; align-items: center; z-index: 1000;';
        
        modalOverlay.innerHTML = `
            <div class="modal-content" style="background: var(--color-card-dark); border: 2px solid var(--color-border); border-radius: 8px; width: 90%; max-width: 500px; padding: 25px;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border); padding-bottom: 12px; margin-bottom: 20px;">
                    <div>
                        <h3 style="color: #FFFFFF; font-family: var(--font-brand); margin: 0; font-size: 18px;">Legal Document Report Selector</h3>
                        <p style="color: var(--color-text-muted); font-size: 12px; margin: 4px 0 0 0;">Case: ${caseRecord.accused.fullName} (${caseRecord.caseNumber})</p>
                    </div>
                    <button id="close-selector-btn" style="background: none; border: none; color: #FFFFFF; font-size: 24px; cursor: pointer;">&times;</button>
                </div>

                <div style="display: flex; flex-direction: column; gap: 10px;">
                    ${reports.map(r => `
                        <button class="btn btn-secondary btn-select-report" data-id="${r.id}" style="width: 100%; text-align: left; padding: 12px 15px; background: var(--color-navy); border: 1px solid var(--color-border); color: #FFFFFF; font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
                            <span>${r.name}</span>
                            <span>➔</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(modalOverlay);

        modalOverlay.querySelector('#close-selector-btn').addEventListener('click', () => {
            modalOverlay.remove();
        });

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
            <!-- Top Navbar -->
            <header class="top-navbar" style="background: var(--color-header-dark); border-bottom: 2px solid var(--color-border); padding: 12px 25px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
                <div class="brand-section" style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 24px; color: var(--color-gold);">⚖️</div>
                    <div>
                        <h1 style="color: #FFFFFF; font-family: var(--font-brand); font-size: 18px; margin: 0; font-weight: 700; letter-spacing: 0.5px;">VERDIQO Bail Management System</h1>
                        <p style="color: var(--color-text-muted); font-size: 10px; margin: 0; font-family: var(--font-body); letter-spacing: 1.5px; text-transform: uppercase;">Quantex Adjudication Systems Portal</p>
                    </div>
                </div>

                <div class="nav-actions" style="display: flex; align-items: center; gap: 15px;">
                    <button class="theme-toggle-btn-mock" id="global-theme-toggle-btn" title="Toggle Theme" style="display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; background: #ffffff; border: 1px solid rgba(0,0,0,0.15); border-radius: 6px; cursor: pointer; font-size: 16px;">
                        ${document.body.classList.contains('light-theme') ? '🌙' : '☀️'}
                    </button>
                    <div style="color: #FFFFFF; font-size: 13px; text-align: right;">
                        <div style="font-weight: 700;">${AppState.currentUser.name}</div>
                        <div style="font-size: 11px; color: var(--color-text-muted);">${AppState.currentUser.designation}</div>
                    </div>
                    <button class="btn btn-secondary" id="global-logout-btn" style="font-size: 12px; font-weight: 700; border-color: var(--color-border); color: #FFFFFF; background: rgba(255,255,255,0.05); padding: 6px 12px;">Logout</button>
                </div>
            </header>

            <!-- Main Workspace content -->
            <main class="main-content" id="dashboard-mount-point" style="flex: 1; padding: 25px; max-width: 1200px; width: 100%; margin: 0 auto; box-sizing: border-box;"></main>
        </div>
    `;

    // Theme toggle trigger
    root.querySelector('#global-theme-toggle-btn').addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        localStorage.setItem('verdiqo_theme', isLight ? 'light' : 'dark');
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
                    <label style="color: var(--color-text-muted); font-size: 13px;">Aadhaar / Case Number</label>
                    <input type="text" id="login-username" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 10px; color: #FFFFFF; font-family: var(--font-mono); border-radius: 4px;" required placeholder="e.g. BMS/2026/0042" value="BMS/2026/0042">
                </div>
                <div class="form-group" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px;">
                    <label style="color: var(--color-text-muted); font-size: 13px;">OTP Verification</label>
                    <input type="text" id="login-password" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 10px; color: #FFFFFF; font-family: var(--font-mono); border-radius: 4px;" required placeholder="Awaiting OTP" value="123456" disabled>
                </div>
            `;
        } else {
            inputFields = `
                <div class="form-group" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 15px;">
                    <label style="color: var(--color-text-muted); font-size: 13px;">System Username</label>
                    <input type="text" id="login-username" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 10px; color: #FFFFFF; font-family: var(--font-mono); border-radius: 4px;" required value="${defaultUser}">
                </div>
                <div class="form-group" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px;">
                    <label style="color: var(--color-text-muted); font-size: 13px;">Access Password</label>
                    <input type="password" id="login-password" class="form-input" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 10px; color: #FFFFFF; font-family: var(--font-mono); border-radius: 4px;" required value="${defaultPass}">
                </div>
            `;
        }

        root.innerHTML = `
            <div style="min-height: 100vh; background: var(--color-bg-dark); display: flex; justify-content: center; align-items: center; padding: 20px; box-sizing: border-box;">
                <div class="login-card" style="background: var(--color-card-dark); border: 2px solid var(--color-border); border-radius: 12px; width: 100%; max-width: 440px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                    <div style="text-align: center; margin-bottom: 25px;">
                        <span style="font-size: 40px; color: var(--color-gold);">⚖️</span>
                        <h2 style="color: #FFFFFF; font-family: var(--font-brand); margin: 10px 0 5px 0; font-size: 22px; font-weight: 800;">VERDIQO Bail Management System</h2>
                        <p style="color: var(--color-text-muted); margin: 0; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Quantex Adjudication Systems Portal</p>
                    </div>

                    <!-- Role selector dropdown -->
                    <div class="form-group" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px;">
                        <label style="color: var(--color-text-muted); font-size: 13px;">Adjudication System Role</label>
                        <select id="login-role-selector" style="background: var(--color-navy); border: 1px solid var(--color-border); padding: 10px; color: #FFFFFF; font-weight: 700; border-radius: 4px; cursor: pointer;">
                            <option value="STAFF" ${activeRole === 'STAFF' ? 'selected' : ''}>Court Staff Portal</option>
                            <option value="JUDGE" ${activeRole === 'JUDGE' ? 'selected' : ''}>Presiding Judge Portal</option>
                            <option value="ADMIN" ${activeRole === 'ADMIN' ? 'selected' : ''}>District Head Judge Portal</option>
                            <option value="CITIZEN" ${activeRole === 'CITIZEN' ? 'selected' : ''}>Citizen Portal</option>
                        </select>
                    </div>

                    <form id="login-auth-form">
                        ${inputFields}
                        
                        <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; font-weight: 800; font-size: 14px; background: var(--color-navy-sec); border-color: var(--color-navy-sec); color: #FFFFFF; margin-bottom: 20px;">
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

window.addEventListener('DOMContentLoaded', async () => {
    // Read and apply saved theme preference, defaulting to light/beige
    const savedTheme = localStorage.getItem('verdiqo_theme');
    if (savedTheme === 'dark') {
        document.body.classList.remove('light-theme');
    } else {
        document.body.classList.add('light-theme');
    }

    try {
        await AppState.initDatabase();
    } catch (e) {
        console.error("Failed initialization:", e);
    }
    updateUI();
});
