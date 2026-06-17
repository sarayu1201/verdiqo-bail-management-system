/**
 * VERDIQO: AUTOMATED VERIFICATION TEST SUITE
 * Unit tests for checking scoring logic and mathematical capabilities
 * Quantex Intelligence Systems (P) Ltd.
 */

import { VerificationEngine } from '../src/utils/verificationEngine.js';

export function runTests(logger) {
    logger("🔄 STARTING VERDIQO CRITICAL UNIT TEST RUN...", "info");
    let passed = 0;
    let failed = 0;

    const assert = (condition, message) => {
        if (condition) {
            passed++;
            logger(`✓ PASS: ${message}`, "success");
        } else {
            failed++;
            logger(`✗ FAIL: ${message}`, "danger");
        }
    };

    try {
        // ==========================================
        // TEST 1: Identity Verification (Check 01)
        // ==========================================
        logger("\n--- Testing Check 01: Biometric Identity ---", "info");
        
        const idPass = VerificationEngine.verifyIdentity("123456789012", true, true);
        assert(idPass.status === 'GREEN', "Identity confirmed green when fingerprints and retina scans match.");

        const idFail = VerificationEngine.verifyIdentity("123456789012", false, true);
        assert(idFail.status === 'RED', "Identity flags red when fingerprints mismatch.");

        const idAadhaarFail = VerificationEngine.verifyIdentity("1234", true, true);
        assert(idAadhaarFail.status === 'RED', "Identity flags red when Aadhaar formatting is invalid.");

        // ==========================================
        // TEST 2: Financial Capacity (Check 02)
        // ==========================================
        logger("\n--- Testing Check 02: Financial Solvency ---", "info");

        // High capability surety vs. 50k bail
        const finPass = VerificationEngine.verifyFinancialCapacity("ABCDE1234F", [45000, 45000, 48000], 35000, 750, 50000);
        assert(finPass.status === 'CAPABLE', "Surety verified as CAPABLE when income exceeds proposed bail reserves.");

        // Borderline financials
        const finBorder = VerificationEngine.verifyFinancialCapacity("ABCDE1234F", [20000, 21000, 19000], 8000, 680, 50000);
        assert(finBorder.status === 'BORDERLINE', "Surety marked BORDERLINE when combined capability is close to bail limit.");

        // Low CIBIL default flag
        const finCibilFail = VerificationEngine.verifyFinancialCapacity("ABCDE1234F", [80000, 80000, 80000], 90000, 420, 50000);
        assert(finCibilFail.status === 'NOT_CAPABLE', "Surety marked NOT CAPABLE if credit history score falls below 500.");

        // ==========================================
        // TEST 3: Criminal Risk Score (Check 03)
        // ==========================================
        logger("\n--- Testing Check 03: NCRB/eCourts Risk Scoring ---", "info");

        // Low risk accused
        const riskLow = VerificationEngine.calculateRiskScore(0, 0, 0, 0, false);
        assert(riskLow.score === 0 && riskLow.riskLevel === 'LOW', "Accused risk score is 0 (LOW) for pristine first offenders.");

        // High risk accused (Prior absconding + watch lists)
        const riskHigh = VerificationEngine.calculateRiskScore(2, 2, 1, 1, true);
        assert(riskHigh.score > 60 && riskHigh.riskLevel === 'HIGH', `High-risk calculation accurate. Score computed: ${riskHigh.score} (HIGH).`);

        // ==========================================
        // TEST 4: Surety Cross-Court Load (Check 04)
        // ==========================================
        logger("\n--- Testing Check 04: Surety Obligation Load ---", "info");

        const loadClear = VerificationEngine.verifySuretyLoad(0, 0);
        assert(loadClear.status === 'CLEAR', "Surety clear with 0 active obligations.");

        const loadOver = VerificationEngine.verifySuretyLoad(2, 0);
        assert(loadOver.status === 'OVERLOADED', "Surety flagged OVERLOADED with 2 active cross-court commitments.");

        const loadDisq = VerificationEngine.verifySuretyLoad(3, 0);
        assert(loadDisq.status === 'DISQUALIFIED', "Surety DISQUALIFIED when commitments exceed statutory limit of 2.");

        // ==========================================
        // TEST 5: Property Registry & Title (Check 05)
        // ==========================================
        logger("\n--- Testing Check 05: Revenue Property Mutation ---", "info");

        const propPass = VerificationEngine.verifyProperty(true, "Madhava Rao", "Madhava Rao", false, 800000, 50000);
        assert(propPass.status === 'ELIGIBLE', "Land eligible when title matches registry, unencumbered, and valuation exceeds bail.");

        const propTitleFail = VerificationEngine.verifyProperty(true, "Madhava Rao", "Srinivas Rao", false, 800000, 50000);
        assert(propTitleFail.status === 'BLOCKED', "Property blocked when owner title mismatches Land Revenue record.");

        const propMortgaged = VerificationEngine.verifyProperty(true, "Madhava Rao", "Madhava Rao", true, 800000, 50000);
        assert(propMortgaged.status === 'BLOCKED', "Property blocked if active mortgage encumbrance is found.");

        // ==========================================
        // TEST 6: Recommendation Engine (Check 06)
        // ==========================================
        logger("\n--- Testing Check 06: Composite recommendation ---", "info");

        // Perfect conditions -> GRANT BAIL
        const recGrant = VerificationEngine.compileRecommendation(
            { status: 'GREEN' },
            { status: 'CAPABLE' },
            { score: 10, riskLevel: 'LOW', reasons: [] },
            { status: 'CLEAR' },
            { status: 'ELIGIBLE' }
        );
        assert(recGrant.verdict === 'GRANT_BAIL', "Advises GRANT BAIL when all checkpoints are green.");

        // Medium risk -> GRANT WITH CONDITIONS
        const recCond = VerificationEngine.compileRecommendation(
            { status: 'GREEN' },
            { status: 'CAPABLE' },
            { score: 45, riskLevel: 'MEDIUM', reasons: [] },
            { status: 'CLEAR' },
            { status: 'ELIGIBLE' }
        );
        assert(recCond.verdict === 'GRANT_WITH_CONDITIONS', "Advises GRANT WITH CONDITIONS when accused has moderate risk score.");

        // Biometric failure -> DENY BAIL
        const recDeny = VerificationEngine.compileRecommendation(
            { status: 'RED' },
            { status: 'CAPABLE' },
            { score: 10, riskLevel: 'LOW', reasons: [] },
            { status: 'CLEAR' },
            { status: 'ELIGIBLE' }
        );
        assert(recDeny.verdict === 'DENY_BAIL', "Advises DENY BAIL if accused biometric matching fails.");

    } catch (e) {
        logger(`CRITICAL SYSTEM ERROR DURING TEST EXECUTION: ${e.message}`, "danger");
        failed++;
    }

    logger(`\n📊 VERDIQO TEST SUMMARY: Passed: ${passed} | Failed: ${failed}`, "info");
    return { passed, failed };
}
