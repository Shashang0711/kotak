const express = require("express");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer");
const dayjs = require("dayjs");
const fs = require("fs").promises;
const path = require("path");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const transactionGenerator = require("./transactionGenerator");
const muhammara = require("muhammara");

const FONT_BASE_PATH = `file://${path.join(__dirname, "public", "fonts")}`;

// Function to load fonts as base64 data URIs (to bypass Chromium security restrictions)
function loadFontsAsBase64() {
  const fontsDir = path.join(__dirname, "public", "fonts");
  const fonts = {
    regular: '',
    bold: '',
    medium: '',
    light: ''
  };

  try {
    const fontFiles = {
      regular: 'Roboto-Regular.ttf',
      bold: 'Roboto-Bold.ttf',
      medium: 'Roboto-Medium.ttf',
      light: 'Roboto-Light.ttf'
    };

    for (const [key, filename] of Object.entries(fontFiles)) {
      const fontPath = path.join(fontsDir, filename);
      if (require('fs').existsSync(fontPath)) {
        const fontBuffer = require('fs').readFileSync(fontPath);
        const base64Font = fontBuffer.toString('base64');
        fonts[key] = `data:font/truetype;charset=utf-8;base64,${base64Font}`;
      }
    }
  } catch (error) {
    console.error('⚠ Error loading fonts as base64:', error.message);
  }

  return fonts;
}

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set("view engine", "ejs");
app.use("/public", express.static(path.join(__dirname, "public")));

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

// Function to extract customer info from any bank PDF (generic extraction)
async function extractCustomerInfo(pdfPath) {
  try {
    const dataBuffer = await fs.readFile(pdfPath);
    const data = await pdfParse(dataBuffer);
    const text = data.text;

    const info = {
      name: "",
      accountNumber: "",
      branch: "",
      ifsc: "",
      address:
        "B-90,Purshottam Nagar Society,Near Althan Garden,New City Light Road Surat City Surat - 395007",
      openingBalance: "",
      closingBalance: "",
      fromDate: "",
      toDate: "",
      crn: "",
      micr: "",
      nominationRegistered: "",
      accountType: "",
    };

    // Extract Account Name (try multiple patterns)
    const namePatterns = [
      /Account Name\s*:?\s*([^\n]+)/i,
      /Account Holder\s*:?\s*([^\n]+)/i,
      /Name\s*:?\s*([^\n]+)/i,
      /([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/, // Generic name pattern
    ];
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match) {
        info.name = match[1].trim();
        break;
      }
    }

    // Extract Account Number (try multiple patterns)
    const accPatterns = [
      /Account Number\s*:?\s*(\d+)/i,
      /Account\s*#\s*(\d+)/i,
      /Account No\s*:?\s*(\d+)/i,
      /A\/c No\s*:?\s*(\d+)/i,
    ];
    for (const pattern of accPatterns) {
      const match = text.match(pattern);
      if (match) {
        info.accountNumber = match[1].trim();
        break;
      }
    }

    // Extract Branch
    const branchPatterns = [
      /Branch\s*:?\s*([^\n]+)/i,
      /Branch Name\s*:?\s*([^\n]+)/i,
    ];
    for (const pattern of branchPatterns) {
      const match = text.match(pattern);
      if (match) {
        info.branch = match[1].trim();
        break;
      }
    }

    // Extract IFSC Code
    const ifscPatterns = [
      /IFSC\s*:?\s*([A-Z0-9]+)/i,
      /IFS Code\s*:?\s*([A-Z0-9]+)/i,
      /IFSC Code\s*:?\s*([A-Z0-9]+)/i,
    ];
    for (const pattern of ifscPatterns) {
      const match = text.match(pattern);
      if (match) {
        info.ifsc = match[1].trim();
        break;
      }
    }

    // Extract Address
    const addressPatterns = [
      /Address\s*:?\s*([^\n]+(?:\n\s+[^\n]+)*?)(?=\n\s*(?:Date|Account|Branch|Statement|CRN))/is,
      /Address\s*:?\s*([^\n]+(?:\n[^\n]+){0,4})/is,
    ];
    for (const pattern of addressPatterns) {
      const match = text.match(pattern);
      if (match) {
        info.address = match[1].trim().replace(/\s+/g, " ");
        break;
      }
    }

    // Extract CRN (Customer Reference Number)
    const crnMatch = text.match(/CRN\s*:?\s*([X\d]+)/i);
    if (crnMatch) {
      info.crn = crnMatch[1].trim();
    }

    // Extract MICR Code
    const micrMatch = text.match(/MICR\s*:?\s*(\d+)/i);
    if (micrMatch) {
      info.micr = micrMatch[1].trim();
    }

    // Extract Nominee
    const nomineeMatch = text.match(/Nominee[^\n]*:?\s*([^\n]+)/i);
    if (nomineeMatch) {
      info.nominationRegistered = nomineeMatch[1].trim();
    }

    // Extract Account Type
    const accountTypeMatch = text.match(/Account\s*#\s*\d+\s+(\w+)/i);
    if (accountTypeMatch) {
      info.accountType = accountTypeMatch[1].trim();
    }

    // Extract Statement Date Range (various formats)
    const dateRangePatterns = [
      /(\d{1,2}\s+\w+\s+\d{4})\s*-\s*(\d{1,2}\s+\w+\s+\d{4})/i,
      /from\s+(\d{1,2}\s+\w+\s+\d{4})\s+to\s+(\d{1,2}\s+\w+\s+\d{4})/i,
      /Statement from\s+(\d{1,2}\s+\w+\s+\d{4})\s+to\s+(\d{1,2}\s+\w+\s+\d{4})/i,
    ];
    for (const pattern of dateRangePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          const fromDateStr = match[1].trim();
          const toDateStr = match[2].trim();
          const fromDate = dayjs(fromDateStr, "DD MMM YYYY");
          const toDate = dayjs(toDateStr, "DD MMM YYYY");
          if (fromDate.isValid()) info.fromDate = fromDate.format("YYYY-MM-DD");
          if (toDate.isValid()) info.toDate = toDate.format("YYYY-MM-DD");
          break;
        } catch (e) {
          console.log("Date parsing error:", e);
        }
      }
    }

    // Extract Opening Balance
    const balancePatterns = [
      /Opening Balance[^:]*:?\s*([\d,]+\.?\d*)/i,
      /Balance\s+as\s+on[^:]*:?\s*([\d,]+\.?\d*)/i,
      /Opening[^:]*:?\s*([\d,]+\.?\d*)/i,
    ];
    for (const pattern of balancePatterns) {
      const match = text.match(pattern);
      if (match) {
        info.openingBalance = match[1].trim().replace(/,/g, "");
        break;
      }
    }

    // Extract Closing Balance
    const closingPatterns = [
      /Closing Balance[^:]*:?\s*([\d,]+\.?\d*)/i,
      /Balance[^:]*:?\s*([\d,]+\.?\d*)\s*$/im,
    ];
    for (const pattern of closingPatterns) {
      const match = text.match(pattern);
      if (match) {
        info.closingBalance = match[1].trim().replace(/,/g, "");
        break;
      }
    }

    return info;
  } catch (error) {
    console.error("Error extracting customer info:", error);
    throw error;
  }
}

// Helper function to format number with commas (Indian format)
function formatAmount(amount) {
  return Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Function to generate realistic transaction descriptions for Kotak format
function generateRealisticDescription(type, subType) {
  let result;

  if (type === "debit") {
    switch (subType) {
      case "upi":
        result = transactionGenerator.generateUpiDebit();
        break;
      case "atm":
        result = transactionGenerator.generateAtmWithdrawal();
        break;
      case "pay":
        result = transactionGenerator.generateUpiPay();
        break;
      case "card":
        result = transactionGenerator.generateCardDebit();
        break;
      default:
        result = transactionGenerator.generateUpiDebit();
    }
  } else {
    switch (subType) {
      case "upi":
        result = transactionGenerator.generateUpiCredit();
        break;
      case "mandate":
        result = transactionGenerator.generateUpiMandate();
        break;
      case "refund":
        result = transactionGenerator.generateUpiMandateRefund();
        break;
      default:
        result = transactionGenerator.generateUpiCredit();
    }
  }

  return {
    desc: result.description,
    ref: result.refNo,
  };
}

// Function to generate transactions for Kotak format
function generateTransactions(
  from,
  to,
  salary,
  opening,
  salaryDate,
  companyName,
  debitLimit = 8,
  creditLimit = 10,
  closingBalance = null,
) {
  let tx = [];
  let openingBalance = Number(opening) || 0;

  // Calculate months in range
  const monthsInRange = [];
  let currentMonth = dayjs(from).startOf("month");
  const endMonth = dayjs(to).startOf("month");

  while (currentMonth.isBefore(endMonth) || currentMonth.isSame(endMonth)) {
    monthsInRange.push({
      start: currentMonth.isAfter(dayjs(from)) ? currentMonth : dayjs(from),
      end: currentMonth.add(1, "month").subtract(1, "day").isBefore(dayjs(to))
        ? currentMonth.add(1, "month").subtract(1, "day")
        : dayjs(to),
      monthIndex: monthsInRange.length,
    });
    currentMonth = currentMonth.add(1, "month");
  }

  const shouldGenerateSalary =
    salary &&
    Number(salary) > 0 &&
    companyName &&
    companyName.trim().length > 0;

  // Generate salary credits
  if (shouldGenerateSalary) {
    let d = dayjs(from).startOf("month");
    while (d.isBefore(to) || d.isSame(to)) {
      const salaryTxDate = d.date(salaryDate);
      if (
        (salaryTxDate.isAfter(from) || salaryTxDate.isSame(from)) &&
        (salaryTxDate.isBefore(to) || salaryTxDate.isSame(to))
      ) {
        const monthlySalary = Number(salary);
        const upiTransaction = transactionGenerator.generateUpiCredit();

        tx.push({
          txnDate: salaryTxDate.toDate(),
          valueDate: salaryTxDate.toDate(),
          description: upiTransaction.description,
          refNo: upiTransaction.refNo,
          debit: "",
          credit: formatAmount(monthlySalary),
          balance: 0,
        });
      }
      d = d.add(1, "month");
    }
  }

  // Define transaction types
  const debitTypes = [
    { type: "upi", weight: 45 },
    { type: "atm", weight: 20 },
    { type: "card", weight: 25 },
    { type: "pay", weight: 10 },
  ];

  const creditTypes = [
    { type: "upi", weight: 70 },
    { type: "mandate", weight: 15 },
    { type: "refund", weight: 15 },
  ];

  // Generate transactions for each month
  monthsInRange.forEach((month, index) => {
    const monthDebitLimit = debitLimit;
    const monthCreditLimit = creditLimit;

    // Track transactions per day (max 6 per day)
    const maxTransactionsPerDay = 6;
    const dailyTransactionCount = {};

    const getAvailableDate = () => {
      const daysDiff = month.end.diff(month.start, "day");
      const maxAttempts = 100;
      let attempts = 0;

      while (attempts < maxAttempts) {
        const randomDays = Math.floor(Math.random() * (daysDiff + 1));
        const date = month.start.add(randomDays, "day");
        const dateKey = date.format("D MMM YYYY");

        const currentCount = dailyTransactionCount[dateKey] || 0;
        if (currentCount < maxTransactionsPerDay) {
          dailyTransactionCount[dateKey] = currentCount + 1;
          return date;
        }
        attempts++;
      }

      let minCount = Infinity;
      let bestDate = month.start;
      for (let d = 0; d <= daysDiff; d++) {
        const checkDate = month.start.add(d, "day");
        const dateKey = checkDate.format("D MMM YYYY");
        const count = dailyTransactionCount[dateKey] || 0;
        if (count < minCount) {
          minCount = count;
          bestDate = checkDate;
        }
      }
      const bestDateKey = bestDate.format("D MMM YYYY");
      dailyTransactionCount[bestDateKey] =
        (dailyTransactionCount[bestDateKey] || 0) + 1;
      return bestDate;
    };

    // Generate debit transactions
    for (let i = 0; i < monthDebitLimit; i++) {
      const date = getAvailableDate();

      const random = Math.random() * 100;
      let cumulative = 0;
      let selectedType = "upi";

      for (const dt of debitTypes) {
        cumulative += dt.weight;
        if (random <= cumulative) {
          selectedType = dt.type;
          break;
        }
      }

      const txDetails = generateRealisticDescription("debit", selectedType);

      let amount;
      if (selectedType === "atm") {
        amount = [500, 1000, 2000, 5000][Math.floor(Math.random() * 4)];
      } else if (selectedType === "card") {
        // Card transactions typically range from ₹100 to ₹5000
        amount = Math.floor(Math.random() * 4900 + 100);
      } else {
        amount = Math.floor(Math.random() * 10000 + 50);
      }

      tx.push({
        txnDate: date.toDate(),
        valueDate: date.toDate(),
        description: txDetails.desc,
        refNo: txDetails.ref,
        debit: formatAmount(amount),
        credit: "",
        balance: 0,
      });
    }

    // Generate credit transactions
    for (let i = 0; i < monthCreditLimit; i++) {
      const date = getAvailableDate();

      const random = Math.random() * 100;
      let cumulative = 0;
      let selectedType = "upi";

      for (const ct of creditTypes) {
        cumulative += ct.weight;
        if (random <= cumulative) {
          selectedType = ct.type;
          break;
        }
      }

      const txDetails = generateRealisticDescription("credit", selectedType);

      let amount = Math.floor(Math.random() * 10000 + 50);

      tx.push({
        txnDate: date.toDate(),
        valueDate: date.toDate(),
        description: txDetails.desc,
        refNo: txDetails.ref,
        debit: "",
        credit: formatAmount(amount),
        balance: 0,
      });
    }
  });

  // Sort by date
  tx.sort((a, b) => new Date(a.txnDate) - new Date(b.txnDate));

  // Calculate running balance
  const minBalance = 500;
  let runningBalance = openingBalance;
  const validTransactions = [];

  for (const t of tx) {
    const debitVal = t.debit
      ? parseFloat(String(t.debit).replace(/,/g, ""))
      : 0;
    const creditVal = t.credit
      ? parseFloat(String(t.credit).replace(/,/g, ""))
      : 0;
    let newBalance = runningBalance - debitVal + creditVal;

    if (newBalance < minBalance && debitVal > 0) {
      const maxDebit = runningBalance - minBalance;
      if (maxDebit > 100) {
        t.debit = formatAmount(maxDebit);
        newBalance = minBalance;
      } else {
        continue; // Skip transaction
      }
    }

    runningBalance = newBalance;
    t.balance = formatAmount(runningBalance);
    validTransactions.push(t);
  }

  // Adjust to match closing balance if provided
  if (
    closingBalance !== null &&
    closingBalance !== undefined &&
    closingBalance !== ""
  ) {
    const targetClosingBalance = Number(closingBalance);
    const currentClosingBalance = runningBalance;
    const difference = targetClosingBalance - currentClosingBalance;

    if (Math.abs(difference) > 0.01) {
      // Add adjustment transaction
      const adjustmentDate = dayjs(to);
      if (difference > 0) {
        const upiTx = transactionGenerator.generateUpiCredit();
        validTransactions.push({
          txnDate: adjustmentDate.toDate(),
          valueDate: adjustmentDate.toDate(),
          description: upiTx.description,
          refNo: upiTx.refNo,
          debit: "",
          credit: formatAmount(difference),
          balance: 0,
        });
      } else {
        const upiTx = transactionGenerator.generateUpiDebit();
        validTransactions.push({
          txnDate: adjustmentDate.toDate(),
          valueDate: adjustmentDate.toDate(),
          description: upiTx.description,
          refNo: upiTx.refNo,
          debit: formatAmount(Math.abs(difference)),
          credit: "",
          balance: 0,
        });
      }

      // Recalculate balances
      validTransactions.sort(
        (a, b) => new Date(a.txnDate) - new Date(b.txnDate),
      );
      runningBalance = openingBalance;
      for (const t of validTransactions) {
        const debitVal = t.debit
          ? parseFloat(String(t.debit).replace(/,/g, ""))
          : 0;
        const creditVal = t.credit
          ? parseFloat(String(t.credit).replace(/,/g, ""))
          : 0;
        runningBalance = runningBalance - debitVal + creditVal;
        t.balance = formatAmount(runningBalance);
      }
    }
  }

  return {
    transactions: validTransactions,
    finalBalance: runningBalance,
  };
}

// Function to sanitize filename
function sanitizeFilename(name) {
  return name
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

// Function to format date for filename
function formatDateForFilename(date) {
  return dayjs(date).format("DD-MM-YYYY");
}

// Load target metadata
let targetMetadata = null;
try {
  const targetMetadataPath = path.join(__dirname, "targetMetadata.json");
  targetMetadata = JSON.parse(
    require("fs").readFileSync(targetMetadataPath, "utf8"),
  );
  console.log("✓ Target metadata loaded successfully");
} catch (error) {
  console.log("⚠ Target metadata not found, using defaults");
}

// Function to modify PDF metadata to match target
async function modifyKotakMetadata(inputPath, outputPath, customDate = null) {
  try {
    const pdfWriter = muhammara.createWriterToModify(inputPath, {
      modifiedFilePath: outputPath,
      compress: false, // Match target: optimized = no
      version: targetMetadata?.PDFVersion
        ? parseFloat(targetMetadata.PDFVersion)
        : 1.4,
    });

    const infoDictionary = pdfWriter.getDocumentContext().getInfoDictionary();

    // Set Producer to match target exactly
    const producerString =
      targetMetadata?.Producer ||
      "iText 5.3.4 2000-2012 1T3XT BVBA (AGPL-version)";
    infoDictionary.producer = producerString;

    // Clear all other metadata fields (matches target)
    infoDictionary.creator = "";
    infoDictionary.title = "";
    infoDictionary.author = "";
    infoDictionary.subject = "";
    infoDictionary.keywords = "";

    // Set dates (use custom if provided, otherwise current time)
    const dateToUse = customDate ? new Date(customDate) : new Date();
    infoDictionary.setCreationDate(dateToUse);
    infoDictionary.setModDate(dateToUse);

    pdfWriter.end();
    console.log(`✓ PDF metadata modified (Producer: ${producerString})`);
  } catch (error) {
    console.error("Error modifying PDF metadata:", error);
    const syncFs = require("fs");
    syncFs.copyFileSync(inputPath, outputPath);
  }
}

app.get("/", (req, res) => res.render("index"));

// Direct HTML preview route - renders statement as HTML for easy inspection and editing
app.post("/preview-html", async (req, res) => {
  try {
    const {
      from,
      to,
      salary,
      opening,
      name,
      acc,
      bank,
      branch,
      ifsc,
      address,
      salaryDate,
      companyName,
      debitLimit,
      creditLimit,
      crn,
      micr,
      nominationRegistered,
      accountType,
      closingBalance,
    } = req.body;

    const debitLimitNum = parseInt(debitLimit) || 8;
    const creditLimitNum = parseInt(creditLimit) || 10;
    const salaryDateNum = parseInt(salaryDate) || 1;

    const salaryAmount = salary && salary.trim() !== "" ? Number(salary) : null;
    const companyNameValue =
      companyName && companyName.trim() !== "" ? companyName.trim() : null;

    const result = generateTransactions(
      from,
      to,
      salaryAmount || 0,
      Number(opening),
      salaryDateNum,
      companyNameValue || null,
      debitLimitNum,
      creditLimitNum,
      closingBalance,
    );
    const tx = result.transactions;
    const finalBalance = result.finalBalance;

    // Read logo
    let logoBase64 = "";
    try {
      const logoPath = path.join(
        __dirname,
        "public",
        "images",
        "kotak-logo.png",
      );
      const logoBuffer = await fs.readFile(logoPath);
      logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
    } catch (error) {
      console.log("Logo not found");
    }


    // Render directly as HTML (not in a popup)
    res.render("statement", {
      name: (name && name.trim()) || "Account Holder",
      acc: (acc && acc.trim()) || "0000000000",
      bank: (bank && bank.trim()) || "Kotak Mahindra Bank",
      branch: (branch && branch.trim()) || "Branch Name",
      ifsc: (ifsc && ifsc.trim()) || "KKBK0000000",
      address: (address && address.trim()) || "Address not available",
      crn: (crn && crn.trim()) || "XXXXXX000",
      micr: (micr && micr.trim()) || "000000000",
      nominationRegistered:
        (nominationRegistered && nominationRegistered.trim()) ||
        "Not Registered",
      accountType: (accountType && accountType.trim()) || "SAVINGS",
      from: from || new Date().toISOString().split("T")[0],
      to: to || new Date().toISOString().split("T")[0],
      tx,
      opening: formatAmount(opening || 0),
      closing:
        closingBalance && closingBalance !== ""
          ? formatAmount(closingBalance)
          : tx.length > 0
            ? tx[tx.length - 1].balance
            : formatAmount(opening || 0),
      logoUrl: logoBase64,
      fontBasePath: FONT_BASE_PATH,
    });
  } catch (error) {
    console.error("Preview HTML error:", error);
    res.status(500).send("Failed to generate preview: " + error.message);
  }
});

// Upload PDF endpoint
app.post("/upload-pdf", upload.single("pdfFile"), async (req, res) => {
  try {
    console.log("Upload request received");

    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    const customerInfo = await extractCustomerInfo(req.file.path);
    console.log("Extracted info:", customerInfo);

    await fs.unlink(req.file.path);
    console.log("File cleaned up");

    res.json(customerInfo);
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      error: "Failed to extract customer information",
      details: error.message,
    });
  }
});

// Preview route
app.post("/preview", async (req, res) => {
  try {
    const {
      from,
      to,
      salary,
      opening,
      name,
      acc,
      branch,
      bank,
      ifsc,
      address,
      salaryDate,
      companyName,
      debitLimit,
      creditLimit,
      crn,
      micr,
      nominationRegistered,
      accountType,
      closingBalance,
    } = req.body;

    // Log received data for debugging
    console.log("Received form data:", {
      name,
      acc,
      branch,
      ifsc,
      address,
      crn,
      micr,
      nominationRegistered,
      accountType,
    });

    const debitLimitNum = parseInt(debitLimit) || 8;
    const creditLimitNum = parseInt(creditLimit) || 10;
    const salaryDateNum = parseInt(salaryDate) || 1;

    const salaryAmount = salary && salary.trim() !== "" ? Number(salary) : null;
    const companyNameValue =
      companyName && companyName.trim() !== "" ? companyName.trim() : null;

    const result = generateTransactions(
      from,
      to,
      salaryAmount || 0,
      Number(opening),
      salaryDateNum,
      companyNameValue || null,
      debitLimitNum,
      creditLimitNum,
      closingBalance,
    );
    const tx = result.transactions;
    const finalBalance = result.finalBalance;

    // Read logo
    let logoBase64 = "";
    try {
      const logoPath = path.join(
        __dirname,
        "public",
        "images",
        "kotak-logo.png",
      );
      const logoBuffer = await fs.readFile(logoPath);
      logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
    } catch (error) {
      console.log("Logo not found");
    }

    const html = await new Promise((resolve) => {
      res.app.render(
        "statement",
        {
          name: (name && name.trim()) || "Account Holder",
          acc: (acc && acc.trim()) || "0000000000",
          branch: (branch && branch.trim()) || "Branch Name",
          bank: (bank && bank.trim()) || "Kotak Mahindra Bank",
          ifsc: (ifsc && ifsc.trim()) || "KKBK0000000",
          address: (address && address.trim()) || "Address not available",
          crn: (crn && crn.trim()) || "XXXXXX000",
          micr: (micr && micr.trim()) || "000000000",
          nominationRegistered:
            (nominationRegistered && nominationRegistered.trim()) ||
            "Not Registered",
          accountType: (accountType && accountType.trim()) || "SAVINGS",
          from: from || new Date().toISOString().split("T")[0],
          to: to || new Date().toISOString().split("T")[0],
          tx,
          opening: formatAmount(opening || 0),
          closing:
            closingBalance && closingBalance !== ""
              ? formatAmount(closingBalance)
              : tx.length > 0
                ? tx[tx.length - 1].balance
                : formatAmount(opening || 0),
          logoUrl: logoBase64,
          fontBasePath: FONT_BASE_PATH,
        },
        (_, h) => resolve(h),
      );
    });

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    console.error("Preview error:", error);
    res.status(500).send("Failed to generate preview: " + error.message);
  }
});

// Generate route
app.post("/generate", async (req, res) => {
  try {
    const {
      from,
      to,
      salary,
      opening,
      name,
      acc,
      bank,
      branch,
      ifsc,
      address,
      salaryDate,
      companyName,
      debitLimit,
      creditLimit,
      crn,
      micr,
      nominationRegistered,
      accountType,
      closingBalance,
      filename,
    } = req.body;

    const debitLimitNum = parseInt(debitLimit) || 8;
    const creditLimitNum = parseInt(creditLimit) || 10;
    const salaryDateNum = parseInt(salaryDate) || 1;

    const salaryAmount = salary && salary.trim() !== "" ? Number(salary) : null;
    const companyNameValue =
      companyName && companyName.trim() !== "" ? companyName.trim() : null;

    const result = generateTransactions(
      from,
      to,
      salaryAmount || 0,
      Number(opening),
      salaryDateNum,
      companyNameValue || null,
      debitLimitNum,
      creditLimitNum,
      closingBalance,
    );
    const tx = result.transactions;
    const finalBalance = result.finalBalance;

    let logoBase64 = "";
    try {
      const logoPath = path.join(
        __dirname,
        "public",
        "images",
        "kotak-logo.png",
      );
      const logoBuffer = await fs.readFile(logoPath);
      logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
    } catch (error) {
      console.log("Logo not found");
    }

    const html = await new Promise((resolve) => {
      res.app.render(
        "statement",
        {
          name: (name && name.trim()) || "Account Holder",
          acc: (acc && acc.trim()) || "0000000000",
          branch: (branch && branch.trim()) || "Branch Name",
          bank: (bank && bank.trim()) || "Kotak Mahindra Bank",
          ifsc: (ifsc && ifsc.trim()) || "KKBK0000000",
          address: (address && address.trim()) || "Address not available",
          crn: (crn && crn.trim()) || "XXXXXX000",
          micr: (micr && micr.trim()) || "000000000",
          nominationRegistered:
            (nominationRegistered && nominationRegistered.trim()) ||
            "Not Registered",
          accountType: (accountType && accountType.trim()) || "SAVINGS",
          from: from || new Date().toISOString().split("T")[0],
          to: to || new Date().toISOString().split("T")[0],
          tx,
          opening: formatAmount(opening || 0),
          closing:
            closingBalance && closingBalance !== ""
              ? formatAmount(closingBalance)
              : tx.length > 0
                ? tx[tx.length - 1].balance
                : formatAmount(opening || 0),
          logoUrl: logoBase64,
          fontBasePath: FONT_BASE_PATH,
          fonts: loadFontsAsBase64(), // Load fonts as base64 to bypass Chromium security
        },
        (_, h) => resolve(h),
      );
    });

    console.log("Generating PDF...");
    let pdfFileName;
    if (filename && filename.trim() !== "") {
      pdfFileName = sanitizeFilename(filename.trim()) + ".pdf";
    } else {
      const customerName = sanitizeFilename(name || "AccountHolder");
      const fromDate = formatDateForFilename(from);
      const toDate = formatDateForFilename(to);
      pdfFileName = `${customerName}_${fromDate}_to_${toDate}.pdf`;
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-gpu",
      ],
      executablePath:
        process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
    });
    const page = await browser.newPage();

    // Enable console logging from the page
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    // Check font files exist before proceeding
    const fontsDir = path.join(__dirname, "public", "fonts");
    const fontFiles = ['Roboto-Regular.ttf', 'Roboto-Bold.ttf', 'Roboto-Medium.ttf', 'Roboto-Light.ttf'];
    console.log('\n🔍 FONT DEBUG - Checking font files...');
    console.log('Font base path:', FONT_BASE_PATH);
    console.log('Fonts directory:', fontsDir);

    for (const fontFile of fontFiles) {
      const fontPath = path.join(fontsDir, fontFile);
      const exists = require('fs').existsSync(fontPath);
      const size = exists ? require('fs').statSync(fontPath).size : 0;
      console.log(`  ${exists ? '✅' : '❌'} ${fontFile}: ${size} bytes ${!exists ? '(MISSING!)' : size === 0 ? '(EMPTY!)' : ''}`);
    }

    await page.setContent(html, { waitUntil: "networkidle0" });

    // Debug: Check what fonts are actually loaded in the page
    console.log('\n🔍 FONT DEBUG - Checking fonts in rendered page...');
    const fontDebugInfo = await page.evaluate(() => {
      const debug = {
        documentFonts: [],
        computedBodyFont: '',
        fontFaceRules: []
      };

      // Get all loaded fonts
      if (document.fonts) {
        document.fonts.forEach(font => {
          debug.documentFonts.push({
            family: font.family,
            weight: font.weight,
            status: font.status,
            loaded: font.status === 'loaded'
          });
        });
      }

      // Get computed font on body
      const body = document.querySelector('body');
      if (body) {
        debug.computedBodyFont = window.getComputedStyle(body).fontFamily;
      }

      // Get @font-face rules from stylesheets
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules || sheet.rules) {
            if (rule instanceof CSSFontFaceRule) {
              debug.fontFaceRules.push({
                family: rule.style.fontFamily,
                src: rule.style.src,
                weight: rule.style.fontWeight
              });
            }
          }
        } catch (e) {
          // Cross-origin stylesheet, skip
        }
      }

      return debug;
    });

    console.log('Fonts detected in page:', fontDebugInfo.documentFonts.length);
    fontDebugInfo.documentFonts.forEach(f => {
      console.log(`  ${f.loaded ? '✅' : '❌'} ${f.family} (${f.weight}): ${f.status}`);
    });
    console.log('Body font-family:', fontDebugInfo.computedBodyFont);
    console.log('@font-face rules found:', fontDebugInfo.fontFaceRules.length);
    fontDebugInfo.fontFaceRules.forEach(f => {
      console.log(`  - ${f.family} (${f.weight}): ${f.src.substring(0, 80)}...`);
    });

    // Wait for fonts to load before generating PDF
    console.log('\n🔍 FONT DEBUG - Waiting for fonts to load...');
    await page.evaluateHandle("document.fonts.ready");

    // Check font status after waiting
    const fontsLoaded = await page.evaluate(() => {
      return document.fonts ? document.fonts.status : 'unknown';
    });
    console.log('Fonts status after waiting:', fontsLoaded);

    // Give extra time for fonts to render
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('✅ Font loading complete, generating PDF...\n');

    const pdfBuffer = await page.pdf({
      width: "595pt",
      height: "842pt",
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      tagged: false,
      omitBackground: false,
    });
    await browser.close();

    const tempDir = path.join(__dirname, "temp");
    await fs.mkdir(tempDir, { recursive: true }).catch(() => {});
    const timestamp = Date.now();
    const tempPdfPath = path.join(tempDir, `temp_${timestamp}.pdf`);
    const metadataModifiedPath = path.join(
      tempDir,
      `temp_${timestamp}_metadata.pdf`,
    );

    await fs.writeFile(tempPdfPath, pdfBuffer);
    await modifyKotakMetadata(tempPdfPath, metadataModifiedPath);
    const finalPdfBuffer = await fs.readFile(metadataModifiedPath);

    console.log(
      `Final PDF size: ${(finalPdfBuffer.length / 1024).toFixed(2)} KB`,
    );

    await fs.unlink(tempPdfPath).catch(() => {});
    await fs.unlink(metadataModifiedPath).catch(() => {});

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${pdfFileName}"`,
    );
    res.setHeader("Content-Length", finalPdfBuffer.length);
    res.send(finalPdfBuffer);
  } catch (error) {
    console.error("Generate error:", error);
    res.status(500).send("Failed to generate PDF");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
