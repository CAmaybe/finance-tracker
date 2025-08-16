// Speech recognition functionality
let recognition;
let isListening = false;

function initializeSpeechRecognition() {
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.log('Speech recognition not supported');
        $('speechBtn').disabled = true;
        $('speechBtn').title = 'Speech recognition not supported in this browser';
        return;
    }
    
    // Initialize speech recognition
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    // Handle speech recognition events
    recognition.onstart = function() {
        isListening = true;
        $('speechBtn').classList.add('mic-active');
        $speechFeedback.classList.remove('d-none');
        $speechText.textContent = 'Listening...';
    };
    
    recognition.onresult = function(event) {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        
        $speechText.textContent = finalTranscript || interimTranscript;
        
        if (finalTranscript) {
            processVoiceCommand(finalTranscript);
        }
    };
    
    recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        stopSpeechRecognition();
    };
    
    recognition.onend = function() {
        stopSpeechRecognition();
    };
    
    // Set up speech button click event
    $('speechBtn').addEventListener('click', toggleSpeechRecognition);
}

function toggleSpeechRecognition() {
    if (isListening) {
        recognition.stop();
    } else {
        recognition.start();
    }
}

function stopSpeechRecognition() {
    isListening = false;
    $('speechBtn').classList.remove('mic-active');
    
    // Don't hide the feedback immediately to let the user see the result
    setTimeout(() => {
        if (!isListening) {
            $speechFeedback.classList.add('d-none');
        }
    }, 3000);
}

function processVoiceCommand(command) {
    console.log('Processing voice command:', command);
    
    // Extract expense information
    let amount = extractAmount(command);
    let category = extractCategory(command);
    let description = extractDescription(command, amount, category);
    
    if (amount && category) {
        // Auto-fill the form
        $expenseAmount.value = amount;
        
        // Select the category in the dropdown
        for (let i = 0; i < $expenseCategory.options.length; i++) {
            if ($expenseCategory.options[i].value.toLowerCase() === category.toLowerCase()) {
                $expenseCategory.selectedIndex = i;
                break;
            }
        }
        
        // Ask for confirmation before adding
        $speechText.textContent = `Confirm: ${amount} ${category} expense`;
    } else {
        $speechText.textContent = 'Could not understand. Please try again with amount and category.';
    }
}

function extractAmount(text) {
    // Match currency patterns like "100 rupees", "rs 100", "₹ 100", "100 rs", etc.
    // Added more Indian variations of currency terms
    const currencyPattern = /(\d+(\.\d+)?)\s*(rupees?|rupay|rs\.?|₹|inr|rupe?|rupaye|rupaye?s?)|₹\s*(\d+(\.\d+)?)|(\d+(\.\d+)?)\s*(rs\.?|inr|rupees?|rupay|rupe?|rupaye|rupaye?s?)/i;
    const numberPattern = /\d+(\.\d+)?/;
    
    // Match for K/k (thousand) and L/l/lac/lakh (hundred thousand) notations common in India
    const kPattern = /(\d+(\.\d+)?)\s*k/i;  // e.g., "5k" or "5.5k" for 5,000 or 5,500
    const lPattern = /(\d+(\.\d+)?)\s*(l|lac|lakh)/i;  // e.g., "2l" or "2 lakh" for 200,000
    
    // First try to match K notation (thousands)
    const kMatch = text.match(kPattern);
    if (kMatch) {
        return parseFloat(kMatch[1]) * 1000;
    }
    
    // Then try to match L/lac/lakh notation (hundred thousands)
    const lMatch = text.match(lPattern);
    if (lMatch) {
        return parseFloat(lMatch[1]) * 100000;
    }
    
    // Then try to match currency patterns
    const currencyMatch = text.match(currencyPattern);
    if (currencyMatch) {
        // Extract the number from the match
        const numberStr = currencyMatch[1] || currencyMatch[4] || currencyMatch[6];
        return parseFloat(numberStr);
    }
    
    // If no specific pattern, try to extract any number
    const numberMatch = text.match(numberPattern);
    if (numberMatch) {
        return parseFloat(numberMatch[0]);
    }
    
    return null;
}

function extractCategory(text) {
    const categories = [
        'Food', 
        'Transport', 
        'Entertainment', 
        'Shopping', 
        'Utilities', 
        'Rent', 
        'Medical', 
        'Education', 
        'Other'
    ];
    
    // Check for category matches
    for (const category of categories) {
        if (text.toLowerCase().includes(category.toLowerCase())) {
            return category;
        }
    }
    
    // Check for related terms with India-specific keywords
    if (text.match(/food|meal|lunch|dinner|breakfast|eat|restaurant|cafe|tiffin|dhaba|mess|canteen|chai|tea|coffee|snack|biryani|thali|dosa|idli|paratha|roti|sabzi|curry|paneer|dal|sweet|mithai|lassi|samosa|chaat|pav bhaji|vada pav|bhel puri|kachori|jalebi|swiggy|zomato/i)) return 'Food';
    
    if (text.match(/transport|travel|bus|train|taxi|uber|ola|auto|rickshaw|car|bike|scooter|scooty|activa|fuel|petrol|diesel|gas|flight|metro|local|railway|irctc|booking|ticket|fare|toll|parking|yatri|namma metro|rapido|cab|dtc|best|tsrtc|bmtc|ksrtc|msrtc/i)) return 'Transport';
    
    if (text.match(/entertain|movie|cinema|show|concert|game|fun|theatre|multiplex|pvr|inox|bookmyshow|netflix|amazon prime|hotstar|ott|subscription|amusement park|club|disco|pub|party|vacation|holiday|trip|tour|picnic|event|fest|carnival|mela|sports|cricket|football|ipl|gymkhana/i)) return 'Entertainment';
    
    if (text.match(/shop|buy|purchase|amazon|flipkart|myntra|ajio|nykaa|meesho|bigbasket|grofers|store|mall|market|bazaar|shop|kirana|grocery|supermarket|hypermarket|dmart|reliance|big bazaar|pantaloons|westside|lifestyle|clothes|dress|shirt|pant|saree|kurta|jewellery|footwear|shoes|sandals|electronics|gadget|phone|laptop|tv|furniture|decor/i)) return 'Shopping';
    
    if (text.match(/bill|utility|electric|electricity|water|gas|cylinder|lpg|internet|phone|mobile|wifi|broadband|postpaid|prepaid|recharge|dth|cable|dish|tata sky|airtel|jio|vi|bsnl|mtnl|idea|vodafone|tangedco|bescom|tsspdcl|mseb|kseb|pgvcl|torrent|adani|indane|hp gas|bharatgas|mahanagar gas/i)) return 'Utilities';
    
    if (text.match(/rent|house|apartment|flat|accommodation|pg|hostel|room|deposit|advance|broker|tenant|landlord|owner|lease|agreement|society|maintenance|housing|home loan|emi|mortgage|property|real estate|nobroker|housing|magicbricks|99acres|nestaway|paying guest|shared accommodation|colive|oyo rooms|stanza living/i)) return 'Rent';
    
    if (text.match(/medical|medicine|doctor|hospital|health|clinic|pharmacy|consultation|check(-|\s)?up|test|lab|ambulance|emergency|treatment|surgery|operation|dental|dentist|eye|optical|lens|spectacles|glasses|insurance|apollo|max|fortis|aiims|medplus|netmeds|pharmeasy|1mg|practo|medlife|lenskart|pathology|diagnostic|scan|xray|mri|ct|ecg|physiotherapy|therapy|ayurvedic|homeopathy|ayush/i)) return 'Medical';
    
    if (text.match(/education|course|class|school|college|university|institute|tuition|coaching|tutorial|online class|book|study|fees|admission|examination|exam|test|assignment|project|tution|iit|jee|neet|upsc|ssc|banking|cat|gmat|gre|toefl|ielts|byju|unacademy|coursera|udemy|khan academy|vedantu|grade up|board exam|semester|backlog|degree|diploma|certificate|skill|learning|training|workshop|seminar|library|stationary|uniform/i)) return 'Education';
    
    // Default to Other if no match
    return 'Other';
}

function extractDescription(text, amount, category) {
    // Remove amount and category mentions from the text to get a cleaner description
    let description = text;
    
    if (amount) {
        description = description.replace(new RegExp(`\\b${amount}\\b`), '');
        description = description.replace(/rupees|rs\.?|₹/gi, '');
    }
    
    if (category) {
        description = description.replace(new RegExp(`\\b${category}\\b`, 'i'), '');
    }
    
    // Clean up common phrases
    description = description.replace(/spent on|paid for|bought|purchased|expense for/gi, '');
    
    // Trim whitespace and punctuation
    description = description.trim().replace(/^[.,\s]+|[.,\s]+$/g, '');
    
    // Capitalize first letter
    if (description) {
        description = description.charAt(0).toUpperCase() + description.slice(1);
    }
    
    return description || category; // Default to category if no description is found
}
