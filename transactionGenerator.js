// Transaction Generator Module for Kotak Bank
// Generates realistic UPI, ATM, and other transaction descriptions
// Matches exact Kotak bank statement format

// Helper function to generate random person names for UPI transactions
function getRandomPersonName() {
  const firstNames = [
    "PATIL DHANRAJ", "SIDDHARTH LAKHO", "BAJ AJ FINANCE L", "PATEL HARSH",
    "GUJARAT STATE R", "BP Surat", "MR VIJAY PRATAP", "J AYESH PATIDAR",
    "Indian Railways", "DHANNAJ AYSINH R", "MYJ IO", "PATIL HARSH",
    "MEHUL PATEL", "RAJESH SHAH", "KIRAN DESAI", "AMIT PANDYA",
    "PRIYA MEHTA", "ROHIT KAPOOR", "NISHA AGARWAL", "VIKAS SINGH"
  ];
  return firstNames[Math.floor(Math.random() * firstNames.length)];
}

// Helper function to generate random transaction IDs (12 digits)
function getRandomTransactionId() {
  return String(Math.floor(Math.random() * 900000000000) + 100000000000);
}

// Helper function to generate random UPI reference number
function getRandomUpiRef() {
  return String(Math.floor(Math.random() * 900000000000) + 100000000000);
}

// Generate UPI Debit Transaction
// Format: UPI/PATIL DHANRAJ /527912353702/UPI
function generateUpiDebit() {
  const personName = getRandomPersonName();
  const transactionId = getRandomTransactionId();
  const refNo = getRandomUpiRef();

  return {
    description: `UPI/${personName}/${transactionId}/UPI`,
    refNo: `UPI-${refNo}`
  };
}

// Generate UPI Credit Transaction
// Format: UPI/PATEL HARSH/564657580745/UPI
function generateUpiCredit() {
  const personName = getRandomPersonName();
  const transactionId = getRandomTransactionId();
  const refNo = getRandomUpiRef();

  return {
    description: `UPI/${personName}/${transactionId}/UPI`,
    refNo: `UPI-${refNo}`
  };
}

// Generate UPI Mandate Transaction
// Format: UPI/BAJ AJ FINANCE L/101643310321/UPI Mandate
function generateUpiMandate() {
  const merchantName = getRandomPersonName();
  const transactionId = getRandomTransactionId();
  const refNo = getRandomUpiRef();

  return {
    description: `UPI/${merchantName}/${transactionId}/UPI Mandate`,
    refNo: `UPI-${refNo}`
  };
}

// Generate UPI Mandate Refund
// Format: UPI/BAJ AJ FINANCE L/101643319892/Mandate Refund
function generateUpiMandateRefund() {
  const merchantName = getRandomPersonName();
  const transactionId = getRandomTransactionId();
  const refNo = getRandomUpiRef();

  return {
    description: `UPI/${merchantName}/${transactionId}/Mandate Refund`,
    refNo: `UPI-${refNo}`
  };
}

// Generate ATM Withdrawal Transaction
// Format: ATL/8820/622018/GANGA COMPLEX SHITAL C071025/07:37
function generateAtmWithdrawal() {
  const atmIds = [
    { id1: "8820", id2: "622018", location: "GANGA COMPLEX SHITAL" },
    { id1: "8506", id2: "612018", location: "MAIN BRANCH SURAT" },
    { id1: "8123", id2: "634567", location: "VARACHHA ROAD SURAT" },
    { id1: "9234", id2: "645678", location: "KATARGAM SURAT" },
    { id1: "8345", id2: "656789", location: "ADJAR ROAD SURAT" }
  ];
  const atm = atmIds[Math.floor(Math.random() * atmIds.length)];
  
  // Generate date code (C + MMDDYY format)
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2);
  const dateCode = `C${month}${day}${year}`;
  
  // Generate time (HH:MM format)
  const hours = String(Math.floor(Math.random() * 24)).padStart(2, '0');
  const minutes = String(Math.floor(Math.random() * 60)).padStart(2, '0');
  const time = `${hours}:${minutes}`;

  const refNo = String(Math.floor(Math.random() * 900000000000) + 100000000000);

  return {
    description: `ATL/${atm.id1}/${atm.id2}/${atm.location} ${dateCode}/${time}`,
    refNo: refNo
  };
}

// Generate UPI Pay Transaction
// Format: UPI/MYJ IO/528295663953/Pay
function generateUpiPay() {
  const merchantName = getRandomPersonName();
  const transactionId = getRandomTransactionId();
  const refNo = getRandomUpiRef();

  return {
    description: `UPI/${merchantName}/${transactionId}/Pay`,
    refNo: `UPI-${refNo}`
  };
}

// Helper function to generate random merchant names for card transactions
function getRandomCardMerchant() {
  const merchants = [
    "AMAZON", "FLIPKART", "SWIGGY", "ZOMATO", "RELIANCE DIGITAL",
    "BIG BAZAAR", "DMART", "STARBUCKS", "MCDONALDS", "DOMINOS",
    "BOOKMYSHOW", "MAKEMYTRIP", "OYO", "UBER", "OLA",
    "PETROL PUMP", "BPCL", "HP PETROL", "INDIAN OIL",
    "SHOPPERS STOP", "WEST SIDE", "PANTALOONS", "CENTRAL",
    "CROMA", "V2 RETAIL", "SPENCERS", "MORE", "HYPERSHOP"
  ];
  return merchants[Math.floor(Math.random() * merchants.length)];
}

// Generate Card Debit Transaction (POS/CARD Payment)
// Format: POS/AMAZON/123456789012/CARD
// or: CARD/FLIPKART/987654321098/POS
function generateCardDebit() {
  const merchantName = getRandomCardMerchant();
  const transactionId = getRandomTransactionId();
  const refNo = String(Math.floor(Math.random() * 900000000000) + 100000000000);
  
  // Randomly choose between POS and CARD prefix
  const prefix = Math.random() > 0.5 ? 'POS' : 'CARD';
  const suffix = prefix === 'POS' ? 'CARD' : 'POS';

  return {
    description: `${prefix}/${merchantName}/${transactionId}/${suffix}`,
    refNo: `${prefix}-${refNo}`
  };
}

// Export functions
module.exports = {
  generateUpiDebit,
  generateUpiCredit,
  generateUpiMandate,
  generateUpiMandateRefund,
  generateAtmWithdrawal,
  generateUpiPay,
  generateCardDebit,
  getRandomPersonName,
  getRandomTransactionId,
  getRandomUpiRef,
  getRandomCardMerchant
};
