// DOM Elements
const paymentForm = document.getElementById('paymentForm');
const paymentMethods = document.querySelectorAll('.payment-method');
const cardPayment = document.getElementById('cardPayment');
const paypalPayment = document.getElementById('paypalPayment');
const bankPayment = document.getElementById('bankPayment');
const successAlert = document.getElementById('successAlert');
const errorAlert = document.getElementById('errorAlert');
const warningAlert = document.getElementById('warningAlert');
const errorMessage = document.getElementById('errorMessage');
const warningMessage = document.getElementById('warningMessage');
const tokenDisplay = document.getElementById('tokenDisplay');
const tokenValue = document.getElementById('tokenValue');
const fraudIndicators = document.getElementById('fraudIndicators');
const fraudList = document.getElementById('fraudList');
const transactionList = document.getElementById('transactionList');
const successfulList = document.getElementById('successfulList');
const failedList = document.getElementById('failedList');
const fraudListTab = document.getElementById('fraudListTab');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const cardNumberInput = document.getElementById('cardNumber');
const expiryDateInput = document.getElementById('expiryDate');
const cvvInput = document.getElementById('cvv');

// Transaction history
let transactions = JSON.parse(localStorage.getItem('paymentTransactions')) || [];

// Format card number with spaces
cardNumberInput.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ');
    if (formattedValue) {
        e.target.value = formattedValue;
    }
});

// Format expiry date
expiryDateInput.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
        e.target.value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
});

// Payment method selection
paymentMethods.forEach(method => {
    method.addEventListener('click', function() {
        paymentMethods.forEach(m => m.classList.remove('active'));
        this.classList.add('active');
        
        const methodType = this.getAttribute('data-method');
        
        cardPayment.style.display = methodType === 'card' ? 'block' : 'none';
        paypalPayment.style.display = methodType === 'paypal' ? 'block' : 'none';
        bankPayment.style.display = methodType === 'bank' ? 'block' : 'none';
    });
});

// Tab selection
tabs.forEach(tab => {
    tab.addEventListener('click', function() {
        const tabId = this.getAttribute('data-tab');
        
        tabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === `${tabId}Transactions`) {
                content.classList.add('active');
            }
        });
        
        updateTransactionDisplay();
    });
});

// Clear history
clearHistoryBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to clear all transaction history?')) {
        transactions = [];
        localStorage.setItem('paymentTransactions', JSON.stringify(transactions));
        updateTransactionDisplay();
    }
});

// Form submission
paymentForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Hide all alerts initially
    successAlert.style.display = 'none';
    errorAlert.style.display = 'none';
    warningAlert.style.display = 'none';
    tokenDisplay.style.display = 'none';
    fraudIndicators.style.display = 'none';
    
    // Get form values
    const amount = document.getElementById('amount').value;
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const activeMethod = document.querySelector('.payment-method.active').getAttribute('data-method');
    
    let cardNumber, expiryDate, cvv, paypalEmail, routingNumber, accountNumber;
    
    if (activeMethod === 'card') {
        cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
        expiryDate = document.getElementById('expiryDate').value;
        cvv = document.getElementById('cvv').value;
    } else if (activeMethod === 'paypal') {
        paypalEmail = document.getElementById('paypalEmail').value;
    } else if (activeMethod === 'bank') {
        routingNumber = document.getElementById('routingNumber').value;
        accountNumber = document.getElementById('accountNumber').value;
    }
    
    // Simulate API call with delay
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    setTimeout(() => {
        processPayment({
            amount,
            name,
            email,
            method: activeMethod,
            cardNumber,
            expiryDate,
            cvv,
            paypalEmail,
            routingNumber,
            accountNumber
        });
        
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-lock"></i> Process Payment';
    }, 2000);
});

// Process payment
function processPayment(paymentData) {
    // Tokenize sensitive data (simulated)
    const token = tokenizeData(paymentData);
    tokenValue.textContent = token;
    
    // Check for fraud indicators
    const fraudIndicatorsList = checkForFraud(paymentData);
    
    // Determine if transaction should be approved
    let approved = false;
    let message = '';
    let warning = '';
    
    // Test card numbers for simulation
    if (paymentData.method === 'card') {
        if (paymentData.cardNumber === '4242424242424242') {
            approved = true;
            message = 'Payment processed successfully!';
        } else if (paymentData.cardNumber === '4000000000000002') {
            approved = false;
            message = 'Card declined. Please use a different payment method.';
        } else if (paymentData.cardNumber === '4000000000009995') {
            approved = false;
            message = 'Insufficient funds.';
        } else {
            // Random approval for other cards (80% success rate)
            approved = Math.random() > 0.2;
            message = approved ? 'Payment processed successfully!' : 'Transaction failed. Please try again.';
        }
    } else {
        // For non-card methods, random approval (90% success rate)
        approved = Math.random() > 0.1;
        message = approved ? 'Payment processed successfully!' : 'Transaction failed. Please try again.';
    }
    
    // Create transaction record
    const transaction = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        amount: paymentData.amount,
        method: paymentData.method,
        status: approved ? 'success' : 'failed',
        fraudFlags: fraudIndicatorsList,
        token: token
    };
    
    // Add to transaction history
    transactions.unshift(transaction);
    localStorage.setItem('paymentTransactions', JSON.stringify(transactions));
    
    // Show appropriate alert
    if (approved) {
        if (fraudIndicatorsList.length > 0) {
            warningAlert.style.display = 'block';
            warningMessage.textContent = 'Payment processed but flagged for review due to potential fraud indicators.';
            fraudIndicators.style.display = 'block';
            
            // Populate fraud indicators
            fraudList.innerHTML = '';
            fraudIndicatorsList.forEach(indicator => {
                const li = document.createElement('li');
                li.textContent = indicator;
                fraudList.appendChild(li);
            });
        } else {
            successAlert.style.display = 'block';
        }
    } else {
        errorAlert.style.display = 'block';
        errorMessage.textContent = message;
    }
    
    // Show token
    tokenDisplay.style.display = 'block';
    
    // Update transaction display
    updateTransactionDisplay();
}

// Tokenize sensitive data (simulated)
function tokenizeData(paymentData) {
    let dataToTokenize = '';
    
    if (paymentData.method === 'card') {
        dataToTokenize = paymentData.cardNumber + paymentData.expiryDate + paymentData.cvv;
    } else if (paymentData.method === 'paypal') {
        dataToTokenize = paymentData.paypalEmail;
    } else if (paymentData.method === 'bank') {
        dataToTokenize = paymentData.routingNumber + paymentData.accountNumber;
    }
    
    // Simple hash function for simulation (not cryptographically secure)
    return btoa(dataToTokenize).substring(0, 20) + '...';
}

// Check for fraud indicators
function checkForFraud(paymentData) {
    const indicators = [];
    
    // Check for test card numbers (not really fraud, but worth flagging)
    if (paymentData.method === 'card') {
        const testCards = [
            '4242424242424242', 
            '4000000000000002', 
            '4000000000009995',
            '5555555555554444',
            '2223003122003222'
        ];
        
        if (testCards.includes(paymentData.cardNumber)) {
            indicators.push('Test card number used');
        }
        
        // Check for unusual amounts
        if (paymentData.amount > 100000) {
            indicators.push('Unusually high transaction amount');
        }
        
        if (paymentData.amount < 10) {
            indicators.push('Unusually low transaction amount');
        }
        
        // Simple Luhn check (not implemented fully for demo)
        if (paymentData.cardNumber && !isValidLuhn(paymentData.cardNumber)) {
            indicators.push('Invalid card number format');
        }
    }
    
    // Check for suspicious email patterns
    if (paymentData.email) {
        const tempEmailDomains = ['tempmail.com', 'mailinator.com', 'guerrillamail.com'];
        const domain = paymentData.email.split('@')[1];
        if (tempEmailDomains.includes(domain)) {
            indicators.push('Temporary email address detected');
        }
    }
    
    return indicators;
}

// Simple Luhn algorithm check (for demo purposes)
function isValidLuhn(cardNumber) {
    // Remove non-digit characters
    cardNumber = cardNumber.replace(/\D/g, '');
    
    // Check if the card number is empty or too short
    if (cardNumber.length < 13 || cardNumber.length > 19) {
        return false;
    }
    
    // Luhn algorithm implementation would go here
    // For demo purposes, we'll just return true for most cases
    return cardNumber.length >= 13 && cardNumber.length <= 19;
}

// Generate unique ID
function generateId() {
    return 'txn_' + Math.random().toString(36).substr(2, 9);
}

// Update transaction display
function updateTransactionDisplay() {
    // Clear all lists
    transactionList.innerHTML = '';
    successfulList.innerHTML = '';
    failedList.innerHTML = '';
    fraudListTab.innerHTML = '';
    
    if (transactions.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'transaction-item';
        emptyMsg.innerHTML = '<div class="transaction-details">No transactions found</div>';
        transactionList.appendChild(emptyMsg);
        successfulList.appendChild(emptyMsg.cloneNode(true));
        failedList.appendChild(emptyMsg.cloneNode(true));
        fraudListTab.appendChild(emptyMsg.cloneNode(true));
        return;
    }
    
    transactions.forEach(transaction => {
        const transactionEl = createTransactionElement(transaction);
        
        // Add to all transactions
        transactionList.appendChild(transactionEl.cloneNode(true));
        
        // Add to filtered lists
        if (transaction.status === 'success') {
            successfulList.appendChild(transactionEl.cloneNode(true));
        } else {
            failedList.appendChild(transactionEl.cloneNode(true));
        }
        
        if (transaction.fraudFlags.length > 0) {
            fraudListTab.appendChild(transactionEl.cloneNode(true));
        }
    });
}

// Create transaction element
function createTransactionElement(transaction) {
    const transactionEl = document.createElement('div');
    transactionEl.className = 'transaction-item';
    
    const date = new Date(transaction.timestamp);
    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    
    let methodIcon = '';
    if (transaction.method === 'card') methodIcon = '<i class="fas fa-credit-card"></i>';
    else if (transaction.method === 'paypal') methodIcon = '<i class="fab fa-paypal"></i>';
    else if (transaction.method === 'bank') methodIcon = '<i class="fas fa-university"></i>';
    
    transactionEl.innerHTML = `
        <div class="transaction-details">
            <div><strong>${methodIcon} ₹${transaction.amount}</strong></div>
            <div>${formattedDate}</div>
            <div>Token: ${transaction.token}</div>
        </div>
        <div>
            <span class="transaction-status status-${transaction.status}">${transaction.status.toUpperCase()}</span>
            ${transaction.fraudFlags.length > 0 ? '<span class="fraud-flag">FRAUD</span>' : ''}
        </div>
    `;
    
    return transactionEl;
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    updateTransactionDisplay();
});