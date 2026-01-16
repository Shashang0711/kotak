# Kotak Bank Statement Generator

A Node.js web application that converts any bank statement PDF into Kotak Mahindra Bank statement format.

## Features

- Upload any bank statement PDF to auto-extract account information
- Generate Kotak bank statement PDFs with realistic transactions
- Exact formatting matching Kotak statement style (fonts, spacing, layout)
- Manual entry mode for custom statements

## Installation

1. Navigate to the project directory:
   ```bash
   cd /home/shashang-tandel/Desktop/Kotak_statement
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Add Kotak logo (optional):
   - Place `kotak-logo.png` in `public/images/` directory
   - If logo is not provided, the template will display "kotak" text

4. Start the server:
   ```bash
   # Development mode (with auto-reload)
   npm run dev
   
   # Production mode
   npm start
   ```

5. Access the application:
   - Open browser: `http://localhost:3000`

## Usage

### Method 1: Upload Existing PDF

1. Click "Choose PDF File" button
2. Select any bank statement PDF
3. Wait for auto-extraction (customer info will populate)
4. Review and modify fields if needed
5. Configure statement parameters
6. Click "Generate & Download PDF"

### Method 2: Manual Entry

1. Fill all required fields manually
2. Configure statement period and transactions
3. Click "Generate & Download PDF"

## Configuration

- **Account Information**: Name, Account Number, Branch, IFSC, etc.
- **Statement Period**: From and To dates
- **Opening Balance**: Starting balance
- **Monthly Transaction Limits**: Debit and Credit transaction counts per month
- **Salary Configuration** (Optional): Company name, salary date, monthly amount
- **Closing Balance** (Optional): Target closing balance (transactions will adjust)

## Project Structure

```
Kotak_statement/
├── server.js                 # Main Express server
├── transactionGenerator.js   # Kotak transaction format generator
├── package.json              # Dependencies
├── views/
│   ├── index.ejs            # Main form page
│   └── statement.ejs        # PDF template (Kotak format)
├── public/
│   ├── images/              # Kotak logo (add kotak-logo.png here)
│   └── fonts/               # Helvetica fonts
├── uploads/                 # Temporary PDF uploads (auto-deleted)
└── temp/                    # Temporary PDF files (auto-deleted)
```

## Notes

- Generated PDFs match Kotak statement format exactly (fonts, spacing, layout)
- All uploaded PDFs are automatically deleted after extraction
- Generated PDFs are streamed directly (not stored on server)
- For testing and development purposes only

## License

ISC License
