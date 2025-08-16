# Speech Recognition Automated Expense Tracker

A web-based expense tracker application with speech recognition capabilities, built using Flask and vanilla JavaScript.

## Features

- Track expenses with amount, category, and date
- Set and manage monthly budget
- Add income transactions
- View transaction history
- Speech recognition for adding expenses by voice
- Data visualization with charts:
  - Spending breakdown (pie chart)
  - Category comparison (bar chart)
  - Budget utilization (gauge chart)
  - Recurring expenses analysis
- Import/export expense data in CSV format
- Real-time budget progress tracking with color transitions
- Interactive UI with Bootstrap

## Installation Instructions

1. Download the project as a ZIP file and extract it

2. Create a virtual environment (recommended):
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

4. Install required Python packages:
   ```
   pip install flask flask-sqlalchemy psycopg2-binary email-validator gunicorn openpyxl
   ```
   
   Or install from pyproject.toml (requires pip>=22.0):
   ```
   pip install -e .
   ```

5. Set up environment variables:
   - Windows (Command Prompt):
     ```
     set FLASK_APP=main.py
     set FLASK_DEBUG=1
     set DATABASE_URL=sqlite:///instance/expense_tracker.db
     ```
   - Windows (PowerShell):
     ```
     $env:FLASK_APP = "main.py"
     $env:FLASK_DEBUG = "1"
     $env:DATABASE_URL = "sqlite:///instance/expense_tracker.db"
     ```
   - macOS/Linux:
     ```
     export FLASK_APP=main.py
     export FLASK_DEBUG=1
     export DATABASE_URL=sqlite:///instance/expense_tracker.db
     ```

6. Run the application:
   ```
   python main.py
   ```
   
   Or using Flask CLI:
   ```
   flask run --host=0.0.0.0 --port=5000
   ```

7. Open the application in your web browser:
   ```
   http://localhost:5000
   ```

## Usage

- Add new expenses: Enter the amount, select a category, choose a date, and click "Add Expense"
- Add income: Click "Add Income", enter optional description and amount
- Use speech recognition: Click the microphone button and speak your expense details
- Export/Import data: Use the respective buttons at the bottom of the Expense History section
- View visualizations: Click "Expense Visualization" and navigate between the different chart types
- Transaction history: View both income and expense transactions by clicking "Transaction History" near your balance

## Speech Commands

Examples of voice commands for adding expenses:
- "Add 50 rupees for food"
- "Spent 200 on shopping yesterday"
- "Paid 500 for rent on April 1st"

## Contributing

Feel free to submit issues or pull requests to improve the application.