'use strict';
// Brand / agency configuration. The server seeds demo data with the active brand's names, forms and area codes.
// Pick the default with the BRAND env var; switch at runtime in Settings (which reseeds) or with ?brand= on /pop.
// To add an agency: copy a block, change the values, restart. Everything not set falls back to `ohiotax`.

const BRANDS = {
  ohiotax: {
    id: 'ohiotax',
    agency: 'Ohio Department of Taxation',
    shortName: 'Ohio Tax',
    state: 'Ohio', stateAbbr: 'OH',
    workspaceName: 'CSM/FSM Configurable Workspace',
    // v3 workspace text and behavior (the layout, colors and icons follow the workspace template; only this text changes)
    ui: {
      platformLogo: { text: 'servicenow', image: '' },   // top-left wordmark; set image to a URL to use a picture instead
      palette: 'workspace',            // 'workspace' = template colors; 'brand' = use the theme colors below
      recordTitle: 'Agent Needed',     // interaction title / short description for virtual agent transfers
      acceptSeconds: 55,               // inbox "Time to accept" countdown
      adherenceToast: true,            // show the yellow workforce adherence toast when a call connects
      adherenceText: 'Out of Adherence: You are not scheduled for this time. Please select the correct status.',
      presence: ['On Queue', 'Available', 'Away', 'Break', 'Meal', 'Busy', 'Offline'],
      wrapCodes: ['Payment / Billing Inquiry', 'Refund Inquiry', 'Notice Response', 'Identity Verification', 'General Question'],
      assistIntervalMs: 7000,          // Agent Assist reveals the next scripted utterance this often (press ] to advance by hand)
      assistStyle: 'copilot',          // 'copilot' = Genesys Copilot panel on the left (template video); 'agent-assist' = ServiceNow Agent Assist on the right
      // Genesys Copilot panel: every label and list below can be changed per demo (Settings > Demo text).
      copilot: {
        title: 'Copilot', searchPlaceholder: 'Search knowledge', loading: 'Loading Copilot…', waiting: "You're waiting for a conversation",
        newSuggestion: 'New Suggestion', newSuggestions: 'New Suggestions',
        transferSummary: 'Transfer Summary', reasonLabel: 'Reason contacted', summaryLabel: 'Summary', resolutionLabel: 'Resolution', aiNote: 'AI generated this summary. It is recommended to review for accuracy.',
        generatedAnswer: 'Generated Answer', sources: 'Sources', questionInfo: 'Generated from what the caller just said.', searchResults: 'Search results', noMatches: 'No matches found. Try modifying your search text.',
        checklistsTitle: 'Review checklists (Optional)', checklistCount: 'Checklist', checklistsCount: 'Checklists', completed: 'Completed', checklistDone: 'checklist completed.', requiredNote: 'Required',
        transcription: 'Transcription', transcriptionEmpty: 'The live transcript appears here once the call is connected.',
        relevant: 'Relevant', irrelevant: 'Irrelevant', feedbackSubmitted: 'Feedback submitted', undo: 'Undo',
        wrapTitle: 'Wrap-up Codes', afterCallWork: 'After call work', aiPowered: 'AI Powered', wrapCodeLabel: 'Wrap-up code', wrapCodePlaceholder: 'Click to select a wrap-up code', rateSuggestions: 'Rate these suggestions?',
        summaryTitle: 'Summary', rateSummary: 'How would you rate this summary?', rateVoice: 'How would you rate the voice quality for this call?', acwTime: 'ACW Time', done: 'Done', reasonForCall: 'Reason for call', actionItems: 'Action items', details: 'Details', generating: 'Generating summary…', creatingSuggestions: 'Creating AI suggestions…',
        // Checklist(s) shown while a call is live. Items complete by clicking them, or on their own after `auto` caller lines.
        checklists: [
          { name: 'Agent Greeting', items: [{ text: 'Greet the caller', required: true, info: 'Greet the caller by name and state your own name.', auto: 1 }, { text: 'Confirm reason for call', required: true, info: 'Repeat back why the caller contacted you.', auto: 2 }] },
        ],
        // Optional per-topic wrap-up text. Topics: notice-paid, refund-identity, refund-docs, refund, balance, docs, default.
        // Placeholders: {first} {full} {notice} {noticeAmount} {noticeYear} {refund} {refundYear} {refundStatus} {payment}.
        topics: {},
      },
      reasonContacted: 'Escalation to human agent',
      resolution: 'Customer escalated before resolution'
    },
    emailDomain: 'tax.ohio.example',
    supportLine: '(800) 555-0128',
    portal: 'OH|TAX eServices',
    refundTool: 'Check a Refund',
    forms: { individual: 'IT 1040', amended: 'IT 1040X', schoolDistrict: 'SD 100', sales: 'UST 1', cat: 'CAT 12', poa: 'TBOR 1' },
    taxTypes: { individual: 'Individual Income Tax', schoolDistrict: 'School District Income Tax', sales: 'Sales and Use Tax', cat: 'Commercial Activity Tax' },
    areaCodes: ['614', '216', '513', '937', '419', '330'],
    cities: [['Columbus', '43215', 'Franklin'], ['Cleveland Heights', '44118', 'Cuyahoga'], ['Cincinnati', '45202', 'Hamilton'], ['Dayton', '45402', 'Montgomery'], ['Toledo', '43604', 'Lucas'], ['Akron', '44308', 'Summit']],
    schoolDistricts: ['Columbus City SD (2503)', 'Cleveland Hts-University Hts City SD (1808)', 'Cincinnati City SD (3103)'],
    timeZone: 'America/New_York',
    logo: {
      // Horizontal logo shown in a white badge. If it fails to load, a text wordmark is used.
      image: 'https://tax.ohio.gov/static/assets/Logo_Assets/Ohio-Agency-Logo-Department-of-Taxation-HORZ-RGB_v2.png',
      wordTop: 'Ohio', wordBottom: 'Department of Taxation'
    },
    theme: { nav: '#0c2340', navText: '#ffffff', accent: '#1b5694', accentSoft: '#e6eef7', highlight: '#ba0c2f', railTop: '#0c2340', railBottom: '#ba0c2f' }
  },

  // Fictional example agency, to show a rebrand: BRAND=pinecrest or Settings > Brand
  pinecrest: {
    id: 'pinecrest',
    agency: 'Pinecrest Department of Revenue',
    shortName: 'Pinecrest Revenue',
    state: 'Pinecrest', stateAbbr: 'PC',
    emailDomain: 'revenue.pinecrest.example',
    supportLine: '(800) 555-0166',
    portal: 'Revenue Online',
    refundTool: "Where's My Refund",
    forms: { individual: 'PC-40', amended: 'PC-40X', schoolDistrict: 'PC-SD', sales: 'ST-9', cat: 'GR-1', poa: 'POA-1' },
    taxTypes: { individual: 'Individual Income Tax', schoolDistrict: 'Local Income Tax', sales: 'Sales and Use Tax', cat: 'Gross Receipts Tax' },
    logo: { image: '', wordTop: 'Pinecrest', wordBottom: 'Department of Revenue' },
    theme: { nav: '#1b2a1f', navText: '#ffffff', accent: '#2f6f3e', accentSoft: '#e4f0e6', highlight: '#d98e04', railTop: '#1b2a1f', railBottom: '#d98e04' }
  }
};

function merge(base, over) {
  const out = { ...base };
  for (const [k, v] of Object.entries(over || {})) out[k] = v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object' ? merge(base[k], v) : v;
  return out;
}
const getBrand = (id) => merge(BRANDS.ohiotax, BRANDS[id] || {});
const listBrands = () => Object.values(BRANDS).map((b) => ({ id: b.id, agency: b.agency }));

module.exports = { getBrand, listBrands, BRANDS, merge };
