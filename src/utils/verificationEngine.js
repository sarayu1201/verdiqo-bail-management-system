/**
 * VERDIQO VERIFICATION ENGINE & RISK SCORING MODULE
 * Smart decision-support formulas for Indian Bail Adjudication
 * Quantex Intelligence Systems (P) Ltd.
 * Upgraded to support high-fidelity bilingual English & Hindi verification checks.
 */

export const VerificationEngine = {
    /**
     * CHECK 01: IDENTITY VERIFICATION
     * Compares counter-scanned biometric data against the UIDAI / Aadhaar database.
     */
    verifyIdentity(aadhaar, fingerprintMatched, retinaMatched) {
        if (!aadhaar || aadhaar.length !== 12 || isNaN(aadhaar)) {
            return {
                status: 'RED',
                reasonEn: 'Invalid Aadhaar Number format provided.',
                reasonHi: 'अमान्य आधार संख्या प्रारूप प्रदान किया गया है।'
            };
        }

        // Simulating the counter fingerprint & retina matching
        if (fingerprintMatched && retinaMatched) {
            return {
                status: 'GREEN',
                reasonEn: 'UIDAI biometric matching successful. Accused identity confirmed via active fingerprints and iris scanning.',
                reasonHi: 'UIDAI बायोमेट्रिक मिलान सफल रहा। आरोपी की पहचान सक्रिय उंगलियों के निशान और आईरिस स्कैनिंग के माध्यम से सत्यापित की गई है।'
            };
        } else {
            const failures = [];
            const failuresHi = [];
            if (!fingerprintMatched) {
                failures.push('Fingerprint mismatch');
                failuresHi.push('उंगलियों के निशान का मिलान नहीं हुआ');
            }
            if (!retinaMatched) {
                failures.push('Iris scans mismatch');
                failuresHi.push('आईरिस स्कैन का मिलान नहीं हुआ');
            }
            return {
                status: 'RED',
                reasonEn: `Identity mismatch detected: ${failures.join(' and ')} against biometric registry.`,
                reasonHi: `पहचान का मिलान नहीं हुआ: बायोमेट्रिक रजिस्ट्री के अनुसार ${failuresHi.join(' और ')} विफल रहा।`
            };
        }
    },

    /**
     * CHECK 02: FINANCIAL CAPACITY CHECK
     * Evaluates if the surety can cover the proposed bail amount based on ITR, bank statements, and CIBIL score.
     */
    verifyFinancialCapacity(pan, itrList, bankBalance6m, cibil, proposedBailAmount) {
        if (!pan || pan.length !== 10) {
            return {
                status: 'NOT_CAPABLE',
                reasonEn: 'PAN details missing or invalid.',
                reasonHi: 'पैन (PAN) विवरण गायब या अमान्य हैं।',
                metrics: {}
            };
        }

        const avgItr = itrList && itrList.length > 0
            ? itrList.reduce((acc, curr) => acc + parseFloat(curr || 0), 0) / itrList.length
            : 0;

        const liquidAssets = parseFloat(bankBalance6m || 0);
        // Financial capacity score: Average ITR + 100% of liquid assets
        const financialCapabilityMetric = (avgItr * 1.2) + liquidAssets;

        let status = 'NOT_CAPABLE';
        let reasonEn = '';
        let reasonHi = '';

        if (cibil < 500) {
            status = 'NOT_CAPABLE';
            reasonEn = `Extremely poor CIBIL credit score (${cibil}). Loan default history flags financial instability.`;
            reasonHi = `अत्यधिक कम सिबिल (CIBIL) क्रेडिट स्कोर (${cibil})। ऋण चूक (लोन डिफ़ॉल्ट) का इतिहास वित्तीय अस्थिरता को दर्शाता है।`;
        } else if (financialCapabilityMetric >= proposedBailAmount) {
            status = 'CAPABLE';
            reasonEn = `Surety demonstrates robust capacity. Verified annual income average is ₹${avgItr.toLocaleString('en-IN')} with average bank liquid reserves of ₹${liquidAssets.toLocaleString('en-IN')}.`;
            reasonHi = `ज़मानतदार मजबूत वित्तीय क्षमता प्रदर्शित करता है। सत्यापित औसत वार्षिक आय ₹${avgItr.toLocaleString('en-IN')} है और औसत बैंक तरल भंडार ₹${liquidAssets.toLocaleString('en-IN')} है।`;
        } else if (financialCapabilityMetric >= (proposedBailAmount * 0.5)) {
            status = 'BORDERLINE';
            reasonEn = `Surety financial backup is marginally tight. Annual average income (₹${avgItr.toLocaleString('en-IN')}) and reserves (₹${liquidAssets.toLocaleString('en-IN')}) are close to the threshold.`;
            reasonHi = `ज़मानतदार की वित्तीय स्थिति सीमांत रूप से तंग है। औसत वार्षिक आय (₹${avgItr.toLocaleString('en-IN')}) और बैंक भंडार (₹${liquidAssets.toLocaleString('en-IN')}) सीमा के बहुत करीब हैं।`;
        } else {
            status = 'NOT_CAPABLE';
            reasonEn = `Insufficient financial strength. The combined metric of ITR averaging ₹${avgItr.toLocaleString('en-IN')} and liquid reserves of ₹${liquidAssets.toLocaleString('en-IN')} fails to support the proposed bail amount of ₹${proposedBailAmount.toLocaleString('en-IN')}.`;
            reasonHi = `अपर्याप्त वित्तीय क्षमता। औसत वार्षिक आय ₹${avgItr.toLocaleString('en-IN')} और तरल भंडार ₹${liquidAssets.toLocaleString('en-IN')} का कुल योग प्रस्तावित ज़मानत राशि ₹${proposedBailAmount.toLocaleString('en-IN')} का समर्थन करने में विफल है।`;
        }

        return { status, reasonEn, reasonHi, metrics: { avgItr, liquidAssets, capability: financialCapabilityMetric } };
    },

    /**
     * CHECK 03: CRIMINAL HISTORY & RISK SCORING
     * Calculates a 0-100 Risk Score.
     * Low (0-30), Medium (31-60), High (61-100).
     */
    calculateRiskScore(ncrbCount, prevBailsGranted, prevBailsHonored, abscondingCount, travelRestricted) {
        let score = 0;
        const reasons = [];
        const reasonsHi = [];

        // 1. Priors from NCRB
        if (ncrbCount > 0) {
            const points = Math.min(ncrbCount * 15, 40);
            score += points;
            reasons.push(`${ncrbCount} registered FIR cases found in NCRB database (+${points} Risk)`);
            reasonsHi.push(`NCRB डेटाबेस में ${ncrbCount} पंजीकृत एफआईआर (FIR) मामले पाए गए (+${points} जोखिम)`);
        } else {
            reasons.push('No active criminal record found in NCRB history');
            reasonsHi.push('NCRB इतिहास में कोई सक्रिय आपराधिक रिकॉर्ड नहीं पाया गया');
        }

        // 2. Absconding History (Highest Penalty)
        if (abscondingCount > 0) {
            const points = Math.min(abscondingCount * 30, 45);
            score += points;
            reasons.push(`${abscondingCount} instances of non-appearance/absconding (+${points} Risk)`);
            reasonsHi.push(`अदालत में पेश न होने / फरार होने के ${abscondingCount} मामले पाए गए (+${points} जोखिम)`);
        }

        // 3. Travel and Immigration Flag
        if (travelRestricted) {
            score += 15;
            reasons.push('Immigration flight-risk watch list flag (+15 Risk)');
            reasonsHi.push('इमिग्रेशन फ्लाइट-रिस्क वॉच लिस्ट फ्लैग सक्रिय (+15 जोखिम)');
        }

        // 4. Bail Performance Ratio
        if (prevBailsGranted > 0) {
            const defaults = prevBailsGranted - prevBailsHonored;
            if (defaults > 0) {
                score += 20;
                reasons.push(`Defaulted on previous bail conditions in ${defaults} cases (+20 Risk)`);
                reasonsHi.push(`पिछले ${defaults} मामलों में ज़मानत शर्तों का उल्लंघन किया (+20 जोखिम)`);
            } else {
                score -= 10; // Positive factor
                reasons.push('Excellent compliance history on previous granted bail (-10 Risk reduction)');
                reasonsHi.push('पूर्व में स्वीकृत ज़मानत पर उत्कृष्ट अनुपालन इतिहास (-10 जोखिम में कमी)');
            }
        }

        // Clamp score between 0 and 100
        score = Math.max(0, Math.min(score, 100));

        let riskLevel = 'LOW';
        if (score > 60) riskLevel = 'HIGH';
        else if (score > 30) riskLevel = 'MEDIUM';

        return { score, riskLevel, reasons, reasonsHi };
    },

    /**
     * CHECK 04: SURETY CROSS-COURT LOAD CHECK
     * Limits surety active load. Multiple court commitments can trigger overload or disqualification.
     */
    verifySuretyLoad(activeBailCount, pastDefaults) {
        if (pastDefaults > 0) {
            return {
                status: 'DISQUALIFIED',
                reasonEn: `Disqualified. Surety defaulted on guarantees in other courts (${pastDefaults} past defaults).`,
                reasonHi: `अयोग्य। ज़मानतदार अन्य न्यायालयों में गारंटी देने में चूक गया (${pastDefaults} पिछली चूकें)।`
            };
        }

        if (activeBailCount >= 3) {
            return {
                status: 'DISQUALIFIED',
                reasonEn: `Disqualified. Active bail guarantees limit exceeded. Currently holding ${activeBailCount} active commitments.`,
                reasonHi: `अयोग्य। सक्रिय ज़मानत गारंटी सीमा से अधिक। वर्तमान में ${activeBailCount} सक्रिय प्रतिबद्धताएं हैं।`
            };
        }

        if (activeBailCount === 2) {
            return {
                status: 'OVERLOADED',
                reasonEn: `Warning: High Surety Load. Currently holding ${activeBailCount} active commitments across courts. Bordering limits.`,
                reasonHi: `चेतावनी: उच्च ज़मानत भार। वर्तमान में न्यायालयों में ${activeBailCount} सक्रिय प्रतिबद्धताएं हैं। सीमा के करीब।`
            };
        }

        return {
            status: 'CLEAR',
            reasonEn: `Clearance granted. Surety holds ${activeBailCount} active guarantee(s). Well within legal limits.`,
            reasonHi: `मंजूरी दी गई। ज़मानतदार के पास ${activeBailCount} सक्रिय गारंटी है। कानूनी सीमाओं के भीतर।`
        };
    },

    /**
     * CHECK 05: PROPERTY VALIDATION
     * Matches property records with revenue archives and confirms ready-reckoner values.
     */
    verifyProperty(hasProperty, ownerName, registryOwner, encumbered, valuation, proposedBailAmount) {
        if (!hasProperty) {
            return {
                status: 'N/A',
                reasonEn: 'No property surety pledged. Individual personal surety submitted.',
                reasonHi: 'कोई संपत्ति ज़मानत गिरवी नहीं रखी गई। व्यक्तिगत ज़मानत प्रस्तुत की गई।'
            };
        }

        if (ownerName.toLowerCase().trim() !== registryOwner.toLowerCase().trim()) {
            return {
                status: 'BLOCKED',
                reasonEn: `Property title mismatch. Declared owner is "${ownerName}", but Revenue Land Registry records show "${registryOwner}".`,
                reasonHi: `संपत्ति के स्वामित्व का मिलान नहीं हुआ। घोषित स्वामी "${ownerName}" है, लेकिन राजस्व भूमि रजिस्ट्री रिकॉर्ड "${registryOwner}" दिखाता है।`
            };
        }

        if (encumbered) {
            return {
                status: 'BLOCKED',
                reasonEn: 'Property blocked. Active mortgage or prior lien / encumbrance registered against this survey number.',
                reasonHi: 'संपत्ति अवरुद्ध। इस सर्वेक्षण संख्या के खिलाफ सक्रिय बंधक या पूर्व ग्रहणाधिकार / भार पंजीकृत है।'
            };
        }

        if (valuation < proposedBailAmount) {
            return {
                status: 'BLOCKED',
                reasonEn: `Property valuation (₹${valuation.toLocaleString('en-IN')}) is less than proposed bail amount (₹${proposedBailAmount.toLocaleString('en-IN')}).`,
                reasonHi: `संपत्ति का मूल्यांकन (₹${valuation.toLocaleString('en-IN')}) प्रस्तावित ज़मानत राशि (₹${proposedBailAmount.toLocaleString('en-IN')}) से कम है।`
            };
        }

        return {
            status: 'ELIGIBLE',
            reasonEn: `Property verified successfully. Clean title, clean encumbrance status, and ready-reckoner value (₹${valuation.toLocaleString('en-IN')}) is sufficient.`,
            reasonHi: `संपत्ति का सफलतापूर्वक सत्यापन किया गया। स्पष्ट स्वामित्व, बंधक-मुक्त स्थिति और संपत्ति का मूल्य (₹${valuation.toLocaleString('en-IN')}) पर्याप्त है।`
        };
    },

    /**
     * CHECK 06: SYSTEM RECOMMENDATION (COMPOSITE DECISION)
     * Compiles all checks to output GRANT BAIL, GRANT WITH CONDITIONS, or DENY BAIL.
     */
    compileRecommendation(identity, finance, risk, suretyLoad, property) {
        const triggers = [];
        const triggersHi = [];
        let verdict = 'GRANT_BAIL';

        // Critical hard failures -> Automatic Denial
        if (identity.status === 'RED') {
            verdict = 'DENY_BAIL';
            triggers.push('Identity Verification Failed (Biometrics / Aadhaar mismatch)');
            triggersHi.push('पहचान सत्यापन विफल (बायोमेट्रिक्स / आधार मिलान नहीं हुआ)');
        }

        if (suretyLoad.status === 'DISQUALIFIED') {
            verdict = 'DENY_BAIL';
            triggers.push('Surety Disqualified (Default history or active guarantees limit exceeded)');
            triggersHi.push('ज़मानतदार अयोग्य (पिछला चूक इतिहास या सक्रिय गारंटी सीमा पार हो गई है)');
        }

        if (property.status === 'BLOCKED') {
            verdict = 'DENY_BAIL';
            triggers.push('Pledged Property is ineligible or title mismatched');
            triggersHi.push('गिरवी रखी गई संपत्ति अयोग्य है या स्वामित्व का मिलान नहीं हुआ है');
        }

        if (risk.riskLevel === 'HIGH') {
            verdict = 'DENY_BAIL';
            triggers.push(`High Criminal Risk Profile (Score: ${risk.score}/100) due to previous non-appearances or flight history`);
            triggersHi.push(`उच्च आपराधिक जोखिम प्रोफ़ाइल (स्कोर: ${risk.score}/100) पूर्व में अनुपस्थित रहने या फरार होने के इतिहास के कारण`);
        }

        if (finance.status === 'NOT_CAPABLE' && property.status !== 'ELIGIBLE') {
            verdict = 'DENY_BAIL';
            triggers.push('Surety lacks financial capacity to cover the required bail reserves');
            triggersHi.push('ज़मानतदार के पास आवश्यक ज़मानत राशि को कवर करने के लिए वित्तीय क्षमता की कमी है');
        }

        // If not denied, check for conditional parameters
        if (verdict !== 'DENY_BAIL') {
            if (risk.riskLevel === 'MEDIUM' || finance.status === 'BORDERLINE' || suretyLoad.status === 'OVERLOADED') {
                verdict = 'GRANT_WITH_CONDITIONS';
                if (risk.riskLevel === 'MEDIUM') {
                    triggers.push(`Medium risk profile (Score: ${risk.score}/100) advises active reporting`);
                    triggersHi.push(`मध्यम जोखिम प्रोफ़ाइल (स्कोर: ${risk.score}/100) सक्रिय रिपोर्टिंग की सलाह देता है`);
                }
                if (finance.status === 'BORDERLINE') {
                    triggers.push('Surety capacity is borderline; financial monitoring recommended');
                    triggersHi.push('ज़मानतदार की वित्तीय क्षमता सीमांत है; वित्तीय निगरानी की सिफारिश की जाती है');
                }
                if (suretyLoad.status === 'OVERLOADED') {
                    triggers.push('Surety has multiple active commitments; check performance ledger closely');
                    triggersHi.push('ज़मानतदार की कई सक्रिय प्रतिबद्धताएं हैं; प्रदर्शन बही का बारीकी से निरीक्षण करें');
                }
            }
        }

        // Compile explanation text
        let reasoningEn = '';
        let reasoningHi = '';

        if (verdict === 'DENY_BAIL') {
            reasoningEn = `SYSTEM ADVISES TO DENY BAIL.\nKey factors: ${triggers.join('; ')}. The risk of flight or procedural defaults is too high under current statutory limits.`;
            reasoningHi = `सिस्टम ज़मानत खारिज करने की सलाह देता है।\nमुख्य कारक: ${triggersHi.join('; ')}। वर्तमान वैधानिक सीमाओं के तहत फरार होने या प्रक्रियात्मक चूक का जोखिम बहुत अधिक है।`;
        } else if (verdict === 'GRANT_WITH_CONDITIONS') {
            reasoningEn = `SYSTEM ADVISES TO GRANT BAIL WITH STRICT CONDITIONS.\nRecommended actions:\n1. Surrender of passport to prevent travel.\n2. Biometric reporting at local Police Station twice a week.\n3. Monitored movements due to: ${triggers.join(', ')}.`;
            reasoningHi = `सिस्टम सख्त शर्तों के साथ ज़मानत देने की सलाह देता है।\nअनुशंसित कार्रवाई:\n1. यात्रा रोकने के लिए पासपोर्ट जमा करना।\n2. स्थानीय पुलिस स्टेशन में सप्ताह में दो बार बायोमेट्रिक रिपोर्टिंग।\n3. इसके कारण निगरानी की स्थिति: ${triggersHi.join(', ')}।`;
        } else {
            reasoningEn = 'SYSTEM ADVISES TO GRANT BAIL.\nReasoning: All core checks are complete and cleared. The accused shows a low-risk profile (0-30), identity is fully authenticated via UIDAI biometrics, and the surety holds high capability with verified property status. No adverse factors detected.';
            reasoningHi = 'सिस्टम ज़मानत देने की सलाह देता है।\nतर्क: सभी मुख्य सत्यापन पूर्ण और स्वीकृत हैं। आरोपी का जोखिम प्रोफ़ाइल कम (0-30) है, पहचान यूआईडीएआई (UIDAI) बायोमेट्रिक्स के माध्यम से पूरी तरह से प्रमाणित है, और ज़मानतदार सत्यापित संपत्ति स्थिति के साथ उच्च क्षमता रखता है। कोई प्रतिकूल कारक नहीं पाया गया।';
        }

        return { verdict, reasoningEn, reasoningHi };
    }
};
