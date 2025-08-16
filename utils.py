from flask import session
from datetime import datetime
from models import User, Expense

def get_current_user():
    """Get current user from session"""
    user_id = session.get('user_id')
    if not user_id:
        return None
    return User.query.get(user_id)

def get_monthly_expenses(user_id, month, year, category=None):
    """Get expenses for a specific month and year"""
    # Start and end date for the month
    start_date = datetime(year, month, 1)
    
    # Determine the last day of the month
    if month == 12:
        end_date = datetime(year + 1, 1, 1)
    else:
        end_date = datetime(year, month + 1, 1)
    
    # Query expenses
    if category:
        expenses = Expense.query.filter(
            Expense.user_id == user_id,
            Expense.date >= start_date,
            Expense.date < end_date,
            Expense.category == category
        ).order_by(Expense.date.desc()).all()
    else:
        expenses = Expense.query.filter(
            Expense.user_id == user_id,
            Expense.date >= start_date,
            Expense.date < end_date
        ).order_by(Expense.date.desc()).all()
    
    return expenses

def calculate_budget_progress(budget, expenses):
    """Calculate budget utilization as a percentage"""
    if not budget or budget <= 0:
        return 0
    
    total_expenses = sum(expense.amount for expense in expenses)
    progress = (total_expenses / budget) * 100
    
    # Cap at 100% for display purposes
    return min(progress, 100)

def get_category_totals(expenses):
    """Calculate total amount spent per category"""
    category_totals = {}
    
    for expense in expenses:
        category = expense.category
        amount = expense.amount
        
        if category in category_totals:
            category_totals[category] += amount
        else:
            category_totals[category] = amount
    
    return category_totals

def get_monthly_trend_data(user_id, number_of_months=6):
    """Get expense data for the past several months for trend analysis"""
    today = datetime.today()
    current_month = today.month
    current_year = today.year
    
    monthly_data = []
    
    for i in range(number_of_months):
        # Calculate month and year to fetch
        month = current_month - i
        year = current_year
        
        # Adjust for previous years
        while month <= 0:
            month += 12
            year -= 1
        
        # Get expenses for this month
        expenses = get_monthly_expenses(user_id, month, year)
        total = sum(expense.amount for expense in expenses)
        
        # Add data point
        monthly_data.append({
            'month': month,
            'year': year,
            'total': total,
            'label': f"{month}/{year}"
        })
    
    # Reverse to get chronological order
    monthly_data.reverse()
    
    return monthly_data

def detect_recurring_expenses(user_id, threshold=0.9):
    """
    Detect potential recurring expenses by finding similar descriptions 
    and amounts across multiple months
    """
    # Get all expenses
    expenses = Expense.query.filter_by(user_id=user_id).order_by(Expense.description).all()
    
    # Group expenses by description (case insensitive)
    grouped_expenses = {}
    for expense in expenses:
        key = expense.description.lower()
        if key in grouped_expenses:
            grouped_expenses[key].append(expense)
        else:
            grouped_expenses[key] = [expense]
    
    # Find potential recurring expenses
    recurring = []
    
    for description, expenses_list in grouped_expenses.items():
        # Need at least 2 expenses to consider recurring
        if len(expenses_list) < 2:
            continue
        
        # Check if amounts are similar and appear in different months
        amounts = [e.amount for e in expenses_list]
        dates = [e.date for e in expenses_list]
        
        # Check if these expenses occur in different months
        months = set((d.year, d.month) for d in dates)
        
        if len(months) >= 2:
            # Calculate average and check if all amounts are within threshold
            avg_amount = sum(amounts) / len(amounts)
            is_recurring = all(abs(amount - avg_amount) / avg_amount <= threshold for amount in amounts)
            
            if is_recurring:
                # Determine frequency (monthly, etc.)
                frequency = "Monthly"  # Default assumption
                
                # Use the most recent expense for display
                newest_expense = max(expenses_list, key=lambda e: e.date)
                
                recurring.append({
                    'description': newest_expense.description,
                    'category': newest_expense.category,
                    'amount': avg_amount,
                    'frequency': frequency,
                    'count': len(expenses_list)
                })
    
    return recurring
